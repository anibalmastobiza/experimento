import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../docs/app.js', import.meta.url), 'utf8');
const submitSource = source.slice(source.indexOf('function submit() {'), source.lastIndexOf('consentScreen();'));

function transport() {
  const elements = [];
  const listeners = new Map();
  const status = { innerHTML: '' };
  const sessionId = '11111111-2222-4333-8444-555555555555';
  const nonce = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
  const browserWindow = {
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name, fn) => { if (listeners.get(name) === fn) listeners.delete(name); }
  };
  browserWindow.parent = browserWindow;
  const context = vm.createContext({
    phase: 'saving', state: { sessionId }, design: {}, pendingCleanup: null,
    config: { appsScriptUrl: 'https://script.google.com/macros/s/example/exec' },
    location: { origin: 'https://researcher.github.io' }, crypto: { randomUUID: () => nonce },
    window: browserWindow, on: () => {}, setTimeout: () => 1, clearTimeout: () => {},
    document: {
      querySelector: () => status,
      body: { append: () => {} },
      createElement(kind) {
        const element = { kind, children: [], removed: false, append(child) { this.children.push(child); }, remove() { this.removed = true; }, submit() { this.submitted = true; } };
        if (kind === 'iframe') element.contentWindow = { parent: browserWindow };
        elements.push(element);
        return element;
      }
    }
  });
  vm.runInContext(submitSource, context);
  context.submit();
  const frame = elements.find(item => item.kind === 'iframe');
  const form = elements.find(item => item.kind === 'form');
  function send(changes = {}) {
    const event = {
      origin: 'https://n-test-script.googleusercontent.com', source: { parent: frame.contentWindow },
      data: { type: 'health-ai-study-ack', schemaVersion: 1, sessionId, nonce, ok: true, status: 'saved', code: '' },
      ...changes
    };
    listeners.get('message')?.(event);
  }
  return { context, status, form, frame, send, sessionId, nonce, browserWindow };
}

test('submission uses form POST with only the expected envelope fields', () => {
  const h = transport();
  assert.equal(h.form.method, 'POST');
  assert.equal(h.form.enctype, 'application/x-www-form-urlencoded');
  assert.equal(h.form.target, h.frame.name);
  assert.equal(h.form.submitted, true);
  assert.deepEqual(h.form.children.map(item => item.name), ['payload', 'parentOrigin', 'nonce']);
});

test('nested Google sandbox acknowledgment confirms and clears local responses', () => {
  const h = transport();
  h.send();
  assert.equal(h.context.phase, 'done');
  assert.equal(h.context.state, null);
  assert.equal(h.frame.removed, true);
  assert.match(h.status.innerHTML, /have been saved/);
});

test('direct target frame acknowledgment is accepted with exact Google script origin', () => {
  const h = transport();
  h.send({ origin: 'https://script.google.com', source: h.frame.contentWindow });
  assert.equal(h.context.phase, 'done');
});

test('an unrelated frame cannot forge an acknowledgment with the correct nonce', () => {
  const h = transport();
  const unrelated = {};
  unrelated.parent = unrelated;
  h.send({ source: unrelated });
  assert.equal(h.context.phase, 'saving');
  assert.ok(h.context.state);
  assert.equal(h.frame.removed, false);
});

test('missing sender or top-window sender does not confirm a save', () => {
  for (const missing of [null, undefined]) {
    const h = transport();
    h.send({ source: missing });
    assert.equal(h.context.phase, 'saving');
  }
  const h = transport();
  h.send({ source: h.browserWindow });
  assert.equal(h.context.phase, 'saving');
});

test('lookalike domains and non-HTTPS origins are rejected', () => {
  for (const origin of ['https://n-test-script.googleusercontent.com.evil.example', 'http://n-test-script.googleusercontent.com', 'https://evil.example', 'null']) {
    const h = transport();
    h.send({ origin });
    assert.equal(h.context.phase, 'saving');
    assert.ok(h.context.state);
  }
});

test('stale nonce, wrong session, and incorrect schema do not confirm', () => {
  for (const change of [{ nonce: 'stale' }, { sessionId: 'another' }, { schemaVersion: 2 }]) {
    const h = transport();
    h.send({ data: { type: 'health-ai-study-ack', schemaVersion: 1, sessionId: h.sessionId, nonce: h.nonce, ok: true, status: 'saved', ...change } });
    assert.equal(h.context.phase, 'saving');
    assert.ok(h.context.state);
  }
});

test('an explicit rejection keeps the response for retry and never claims success', () => {
  const h = transport();
  h.send({ data: { type: 'health-ai-study-ack', schemaVersion: 1, sessionId: h.sessionId, nonce: h.nonce, ok: false, status: 'rejected', code: 'collection_closed' } });
  assert.ok(h.context.state);
  assert.match(h.status.innerHTML, /could not accept this attempt/);
  assert.ok(!h.status.innerHTML.includes('have been saved'));
  assert.equal(h.frame.removed, true);
});
