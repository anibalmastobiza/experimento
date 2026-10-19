const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const code = fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8');
const origin = 'https://researcher.github.io';
const sessionId = '11111111-2222-4333-8444-555555555555';
const nonce = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

function fixture() {
  const payload = {
    schemaVersion: 1, studyVersion: '1.0.0', consentVersion: '2026-10-19', sessionId,
    seed: 123456, consent: true, mode: 'test', status: 'completed', durationMs: 140000,
    conditionOrder: ['fixed', 'variable'], systemOrder: ['A', 'B'], betterArm: 'circle',
    demographics: { ageBand: 'prefer_not', gender: 'prefer_not', education: 'prefer_not', aiUse: 'prefer_not' },
    comprehensionAttempts: 1, earnedTokens: 80, finalTokens: 84,
    earningTrials: [], delegationTrials: [], ratings: []
  };
  let balance = 0;
  for (let i = 0; i < 8; i++) {
    const success = i % 2 === 0;
    const reward = success ? 12 : 8;
    balance += reward;
    payload.earningTrials.push({ trial: i + 1, choice: 'circle', success, reward, balanceAfter: balance, rtMs: 3000 });
  }
  for (let i = 0; i < 8; i++) {
    const block = i < 4 ? 1 : 2;
    const feeDraw = block === 1 ? 1 : 0;
    const before = balance;
    balance = balance - 2 - feeDraw + 4;
    payload.delegationTrials.push({
      trial: i + 1, block, condition: block === 1 ? 'fixed' : 'variable', system: block === 1 ? 'A' : 'B',
      stake: 2, potentialSuccess: true, feeDraw, feeCharged: feeDraw, returned: 4,
      balanceBefore: before, balanceAfter: balance, rtMs: 4000
    });
  }
  payload.finalTokens = balance;
  payload.ratings = [1, 2].map(block => ({
    block, condition: block === 1 ? 'fixed' : 'variable', trust: 5, risk: 3, complexity: 2, fairness: null
  }));
  return payload;
}

function harness(overrides = {}) {
  const properties = {
    SPREADSHEET_ID: 'abcdefghijklmnopqrstuvwxyz0123456789',
    ALLOWED_ORIGINS: JSON.stringify([origin]), COLLECTION_OPEN: 'true', ...overrides
  };
  const state = { rows: [], releases: 0, flushes: 0, canLock: true, failFlush: false, created: false };
  const sheet = {
    getName: () => 'Sessions', getLastRow: () => state.rows.length, setFrozenRows: () => sheet,
    getRange(row, column, height = 1, width = 1) {
      return {
        setValues(values) {
          assert.equal(values.length, height);
          for (let r = 0; r < height; r++) {
            assert.equal(values[r].length, width);
            if (!state.rows[row - 1 + r]) state.rows[row - 1 + r] = [];
            for (let c = 0; c < width; c++) state.rows[row - 1 + r][column - 1 + c] = values[r][c];
          }
        },
        getValues() {
          return Array.from({ length: height }, (_, r) =>
            Array.from({ length: width }, (_, c) => state.rows[row - 1 + r]?.[column - 1 + c] ?? ''));
        },
        getValue() { return state.rows[row - 1]?.[column - 1] ?? ''; },
        createTextFinder(target) {
          return {
            matchEntireCell(value) { assert.equal(value, true); return this; },
            useRegularExpression(value) { assert.equal(value, false); return this; },
            findNext() {
              for (let r = row - 1; r < row - 1 + height; r++) {
                if (state.rows[r]?.[column - 1] === target) return { getRow: () => r + 1 };
              }
              return null;
            }
          };
        }
      };
    }
  };
  const output = text => ({
    text, frameMode: null, mime: null,
    setXFrameOptionsMode(mode) { this.frameMode = mode; return this; },
    setMimeType(mime) { this.mime = mime; return this; }
  });
  const context = vm.createContext({
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => properties[key] }) },
    SpreadsheetApp: {
      openById(id) {
        assert.equal(id, properties.SPREADSHEET_ID);
        return { getSheetByName: () => state.created ? sheet : null, insertSheet: () => { state.created = true; return sheet; } };
      },
      flush() { state.flushes++; if (state.failFlush) throw new Error('Provider failure must not be reflected'); }
    },
    LockService: { getScriptLock: () => ({ tryLock: () => state.canLock, releaseLock: () => { state.releases++; } }) },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
      computeDigest: (algorithm, value, encoding) => [...crypto.createHash(algorithm).update(value, encoding).digest()]
    },
    HtmlService: { createHtmlOutput: output, XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' } },
    ContentService: { createTextOutput: output, MimeType: { JSON: 'application/json' } }
  });
  vm.runInContext(code, context);
  return { context, state, properties };
}

function envelope(payload = fixture(), changes = {}) {
  const parameter = { payload: JSON.stringify(payload), parentOrigin: origin, nonce, ...changes };
  const contents = new URLSearchParams(parameter).toString();
  return {
    parameter, parameters: Object.fromEntries(Object.entries(parameter).map(([k, v]) => [k, [v]])),
    postData: { contents, type: 'application/x-www-form-urlencoded' }, contentLength: contents.length
  };
}

function ack(output) {
  const match = output.text.match(/window\.top\.postMessage\((\{.*?\}),/);
  return match ? JSON.parse(match[1]) : null;
}

test('saves one complete row and acknowledges only after flush and readback', () => {
  const { context, state } = harness();
  const response = context.doPost(envelope());
  assert.equal(ack(response).status, 'saved');
  assert.equal(ack(response).ok, true);
  assert.equal(ack(response).nonce, nonce);
  assert.equal(response.frameMode, 'ALLOWALL');
  assert.equal(state.rows.length, 2);
  assert.equal(state.rows[0].length, 24);
  assert.equal(state.rows[1][0], sessionId);
  assert.match(state.rows[1][1], /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(state.rows[1][2].length, 64);
  assert.equal(state.flushes, 1);
  assert.equal(state.releases, 1);
  assert.equal(JSON.parse(state.rows[1][23]).consent, true);
  assert.ok(!response.text.includes('ageBand'));
});

test('identical retry returns duplicate without appending', () => {
  const { context, state } = harness();
  context.doPost(envelope());
  assert.equal(ack(context.doPost(envelope())).status, 'duplicate');
  assert.equal(state.rows.length, 2);
});

test('canonical digest tolerates object property reordering', () => {
  const { context, state } = harness();
  const payload = fixture();
  context.doPost(envelope(payload));
  const reordered = Object.fromEntries(Object.entries(payload).reverse());
  assert.equal(ack(context.doPost(envelope(reordered))).status, 'duplicate');
  assert.equal(state.rows.length, 2);
});

test('same UUID with changed answers returns conflict', () => {
  const { context, state } = harness();
  context.doPost(envelope());
  const changed = fixture();
  changed.seed++;
  assert.equal(ack(context.doPost(envelope(changed))).code, 'session_conflict');
  assert.equal(state.rows.length, 2);
});

test('closed collection rejects without creating sheet', () => {
  const { context, state } = harness({ COLLECTION_OPEN: 'false' });
  assert.equal(ack(context.doPost(envelope())).code, 'collection_closed');
  assert.equal(state.rows.length, 0);
});

test('unknown origin receives no postMessage and causes no writes', () => {
  const { context, state } = harness();
  const response = context.doPost(envelope(fixture(), { parentOrigin: 'https://unrelated.example' }));
  assert.equal(ack(response), null);
  assert.equal(state.rows.length, 0);
});

test('GET is reachability only with no configuration or dataset', () => {
  const { context, state } = harness();
  assert.deepEqual(JSON.parse(context.doGet().text), { service: 'health-ai-trust-study', schemaVersion: 1, status: 'reachable' });
  assert.equal(state.rows.length, 0);
});

test('manual setup creates headers only and is idempotent', () => {
  const { context, state } = harness();
  context.setupCollector();
  context.setupCollector();
  assert.equal(state.rows.length, 1);
  assert.equal(state.rows[0][0], 'sessionId');
});

const rejectedCases = [
  ['extra personal field', p => { p.email = 'person@example.com'; }],
  ['extra demographic free text', p => { p.demographics.name = 'Person'; }],
  ['missing consent', p => { p.consent = false; }],
  ['unknown schema version', p => { p.schemaVersion = 2; }],
  ['unknown study version', p => { p.studyVersion = '2.0.0'; }],
  ['invalid UUID', p => { p.sessionId = 'participant@example.com'; }],
  ['formula injection', p => { p.demographics.ageBand = '=IMPORTXML("example.com")'; }],
  ['fractional timing', p => { p.durationMs = 123.5; }],
  ['excessive timing', p => { p.durationMs = 300001; }],
  ['underage or exact age', p => { p.demographics.ageBand = '17'; }],
  ['invalid allocation', p => { p.delegationTrials[0].stake = 7; }],
  ['invalid variable fee', p => { p.delegationTrials[4].feeDraw = 1; }],
  ['invalid fixed fee', p => { p.delegationTrials[0].feeDraw = 0; }],
  ['missing completed trials', p => { p.earningTrials.pop(); }],
  ['invalid final accounting', p => { p.finalTokens++; }],
  ['invalid earning accounting', p => { p.earningTrials[0].reward = 8; }],
  ['wrong condition order', p => { p.conditionOrder.reverse(); }],
  ['unbounded rating', p => { p.ratings[0].trust = 8; }],
  ['unknown trial key', p => { p.earningTrials[0].screenSize = '1024x768'; }]
];
for (const [name, change] of rejectedCases) {
  test(`rejects ${name}`, () => {
    const { context, state } = harness();
    const payload = fixture();
    change(payload);
    assert.equal(ack(context.doPost(envelope(payload))).ok, false);
    assert.equal(state.rows.length, 0);
  });
}

test('accepts consented timeout with zero responses and explicit skipped demographics', () => {
  const { context, state } = harness();
  const payload = fixture();
  Object.assign(payload, { status: 'timed_out', durationMs: 300000, earnedTokens: 0, finalTokens: 0, earningTrials: [], delegationTrials: [], ratings: [] });
  assert.equal(ack(context.doPost(envelope(payload))).status, 'saved');
  assert.equal(state.rows.length, 2);
});

test('accepts timeout after earning and partial delegation without ratings', () => {
  const { context } = harness();
  const payload = fixture();
  payload.status = 'timed_out';
  payload.delegationTrials = payload.delegationTrials.slice(0, 2);
  payload.ratings = [];
  payload.finalTokens = payload.delegationTrials[1].balanceAfter;
  assert.equal(ack(context.doPost(envelope(payload))).status, 'saved');
});

test('zero stake records no fee and no return even on latent success', () => {
  const { context } = harness();
  const payload = fixture();
  payload.status = 'timed_out';
  payload.delegationTrials = [{ trial: 1, block: 1, condition: 'fixed', system: 'A', stake: 0, potentialSuccess: true, feeDraw: 1, feeCharged: 0, returned: 0, balanceBefore: 80, balanceAfter: 80, rtMs: 1000 }];
  payload.ratings = [];
  payload.finalTokens = 80;
  assert.equal(ack(context.doPost(envelope(payload))).status, 'saved');
});

test('malformed JSON and oversized body cause no writes', () => {
  const { context, state } = harness();
  assert.equal(ack(context.doPost(envelope(fixture(), { payload: '{broken' }))).code, 'invalid_payload');
  const large = envelope();
  large.contentLength = 60001;
  assert.equal(ack(context.doPost(large)), null);
  assert.equal(state.rows.length, 0);
});

test('duplicate envelope parameters are rejected', () => {
  const { context, state } = harness();
  const event = envelope();
  event.parameters.nonce.push(nonce);
  assert.equal(ack(context.doPost(event)), null);
  assert.equal(state.rows.length, 0);
});

test('content type must be URL-encoded form POST', () => {
  const { context, state } = harness();
  const event = envelope();
  event.postData.type = 'application/json';
  assert.equal(ack(context.doPost(event)), null);
  assert.equal(state.rows.length, 0);
});

test('lock contention never appends and does not release unacquired lock', () => {
  const { context, state } = harness();
  state.canLock = false;
  assert.equal(ack(context.doPost(envelope())).code, 'busy');
  assert.equal(state.releases, 0);
  assert.equal(state.rows.length, 0);
});

test('storage failure never reports success and can be retried without duplication', () => {
  const { context, state } = harness();
  state.failFlush = true;
  const first = context.doPost(envelope());
  assert.equal(ack(first).code, 'storage_unavailable');
  assert.ok(!first.text.includes('Provider failure'));
  assert.equal(state.releases, 1);
  state.failFlush = false;
  assert.equal(ack(context.doPost(envelope())).status, 'duplicate');
  assert.equal(state.rows.length, 2);
});

test('header mismatch never silently writes into an incompatible sheet', () => {
  const { context, state } = harness();
  context.setupCollector();
  state.rows[0][0] = 'wrongHeader';
  assert.equal(ack(context.doPost(envelope())).code, 'header_mismatch');
  assert.equal(state.rows.length, 1);
});

test('wildcard configuration fails closed', () => {
  const { context, state } = harness({ ALLOWED_ORIGINS: '["*"]' });
  assert.equal(ack(context.doPost(envelope())), null);
  assert.equal(state.rows.length, 0);
});

test('script serialization escapes HTML terminators', () => {
  const { context } = harness();
  const encoded = context.scriptJson_({ value: '</script><script>alert(1)</script>' });
  assert.ok(!encoded.includes('<'));
  assert.equal(JSON.parse(encoded).value, '</script><script>alert(1)</script>');
});

test('actual game engine fixtures satisfy the collector schema', async () => {
  const { completeFixture, timeoutFixture } = await import('../tests/fixture.mjs');
  for (const seed of [0, 1, 123456, 4294967295]) {
    for (const stake of [0, 2, 4, 6]) {
      for (const build of [completeFixture, timeoutFixture]) {
        const { context } = harness();
        assert.equal(ack(context.doPost(envelope(build({ seed, stake })))).status, 'saved');
      }
    }
  }
});
