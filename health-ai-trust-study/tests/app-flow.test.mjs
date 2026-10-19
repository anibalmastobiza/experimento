import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import * as engine from '../docs/engine.js';
import { createDocument, FormDataAdapter } from './mock-dom.mjs';

const html = fs.readFileSync(new URL('../docs/index.html', import.meta.url), 'utf8');
const appSource = fs.readFileSync(new URL('../docs/app.js', import.meta.url), 'utf8').replace(/^import .*?;\s*/, '');
const collector = vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('../backend/Code.gs', import.meta.url), 'utf8'), collector);

function appHarness({ collectionEnabled = false, submissionMode = 'test' } = {}) {
  const document = createDocument(html);
  let clock = 10000;
  const browserWindow = {
    STUDY_CONFIG: { studyVersion: '1.0.0', consentVersion: '2026-10-19', collectionEnabled, submissionMode, appsScriptUrl: 'https://script.google.com/macros/s/example/exec' },
    addEventListener: () => {}, removeEventListener: () => {}, scrollTo: () => {}
  };
  browserWindow.parent = browserWindow;
  const context = vm.createContext({
    ...engine, document, window: browserWindow, performance: { now: () => clock },
    location: { origin: 'http://localhost:4173' }, FormData: FormDataAdapter,
    crypto: { getRandomValues: array => { array[0] = 123456; return array; }, randomUUID: () => '11111111-2222-4333-8444-555555555555' },
    setInterval: () => 1, clearInterval: () => {}, setTimeout: () => 1, clearTimeout: () => {}
  });
  vm.runInContext(appSource, context);
  const click = id => {
    const element = document.getElementById(id);
    assert.ok(element, `Missing clickable element #${id}`);
    element.click();
  };
  const choose = (name, value) => {
    const input = document.querySelectorAll('input').find(input => input.name === name && input.value === value);
    assert.ok(input, `Missing input ${name}=${value}`);
    for (const sibling of document.querySelectorAll('input').filter(item => item.name === name)) sibling.checked = false;
    input.checked = true;
  };
  const begin = () => {
    for (const id of ['consent', 'virtual']) { const element = document.getElementById(id); element.checked = true; element.dispatch('change'); }
    click('start');
  };
  const earning = () => {
    begin(); click('continue'); click('continue');
  };
  const delegation = () => {
    earning();
    for (let i = 0; i < 8; i++) { click('circle'); click('continue'); }
    click('continue'); choose('zeroFee', 'zero'); choose('when', 'after');
    document.getElementById('rules-form').dispatch('submit');
  };
  return {
    context, document, click, choose, begin, earning, delegation,
    read: expression => vm.runInContext(expression, context),
    setTime: millisecondsSinceStart => { clock = 10000 + millisecondsSinceStart; },
    tick: () => vm.runInContext('tick()', context)
  };
}

test('consent requires both explicit checkboxes before the start button is enabled', () => {
  const h = appHarness();
  assert.equal(h.document.getElementById('start').disabled, true);
  h.click('start');
  assert.equal(h.read('state'), null);
  const consent = h.document.getElementById('consent'); consent.checked = true; consent.dispatch('change');
  assert.equal(h.document.getElementById('start').disabled, true);
  h.begin();
  assert.equal(h.read('state.consent'), true);
  assert.equal(h.read('phase'), 'demographics');
});

test('complete preview records eight earning choices, eight commitments and two optional ratings without submitting', () => {
  const h = appHarness();
  h.delegation();
  for (let i = 0; i < 8; i++) {
    h.setTime(40000 + i * 5000);
    h.document.querySelectorAll('.stake').find(element => element.dataset.stake === '4').click();
    h.click('commit'); h.click('continue');
    if (i === 3 || i === 7) h.document.getElementById('ratings-form').dispatch('submit');
  }
  assert.equal(h.read('phase'), 'done');
  assert.equal(h.read('state.status'), 'completed');
  assert.equal(h.read('state.earningTrials.length'), 8);
  assert.equal(h.read('state.delegationTrials.length'), 8);
  assert.equal(h.read('state.ratings.length'), 2);
  assert.equal(h.read('state.ratings[0].trust'), null);
  assert.equal(h.document.submissions.length, 0);
  assert.match(h.document.getElementById('save-status').textContent, /No responses were sent/);
});

test('connection test mode submits one complete schema payload marked test', () => {
  const h = appHarness({ collectionEnabled: true, submissionMode: 'test' });
  h.delegation();
  for (let i = 0; i < 8; i++) {
    h.document.querySelectorAll('.stake')[0].click(); h.click('commit'); h.click('continue');
    if (i === 3 || i === 7) h.document.getElementById('ratings-form').dispatch('submit');
  }
  assert.equal(h.document.submissions.length, 1);
  const payload = JSON.parse(h.document.submissions[0].payload);
  assert.equal(payload.mode, 'test');
  assert.equal(payload.status, 'completed');
  assert.equal(payload.earningTrials.length, 8);
  assert.equal(payload.delegationTrials.length, 8);
  assert.equal(payload.finalTokens, payload.earnedTokens);
  assert.doesNotThrow(() => collector.parsePayload_(h.document.submissions[0].payload));
});

test('choice immediately before the five-minute boundary is retained', () => {
  const h = appHarness();
  h.earning(); h.setTime(299999); h.click('circle');
  assert.equal(h.read('state.earningTrials.length'), 1);
  assert.equal(h.read('phase'), 'earning');
});

test('choice at the deadline expires without accepting a late earning action even if timer was throttled', () => {
  const h = appHarness();
  h.earning(); h.setTime(300000); h.click('circle');
  assert.equal(h.read('phase'), 'done');
  assert.equal(h.read('state.status'), 'timed_out');
  assert.equal(h.read('state.durationMs'), 300000);
  assert.equal(h.read('state.earningTrials.length'), 0);
});

test('late commitment cannot change the recorded token balance', () => {
  const h = appHarness();
  h.delegation();
  const before = h.read('state.finalTokens');
  h.document.querySelectorAll('.stake')[3].click();
  h.setTime(310000); h.click('commit');
  assert.equal(h.read('state.status'), 'timed_out');
  assert.equal(h.read('state.delegationTrials.length'), 0);
  assert.equal(h.read('state.finalTokens'), before);
});

test('deadline during withdrawal confirmation discards without submitting', () => {
  const h = appHarness({ collectionEnabled: true, submissionMode: 'live' });
  h.earning(); h.click('circle'); h.click('withdraw');
  h.setTime(300000); h.tick();
  assert.equal(h.read('phase'), 'withdrawn');
  assert.equal(h.read('state'), null);
  assert.equal(h.document.submissions.length, 0);
  assert.match(h.document.getElementById('app').textContent, /Nothing was sent/);
});

test('deadline in collection mode sends one valid partial response and cannot send twice', () => {
  const h = appHarness({ collectionEnabled: true, submissionMode: 'live' });
  h.earning(); h.click('circle'); h.setTime(300000); h.tick(); h.tick();
  assert.equal(h.document.submissions.length, 1);
  const payload = JSON.parse(h.document.submissions[0].payload);
  assert.equal(payload.mode, 'live');
  assert.equal(payload.status, 'timed_out');
  assert.equal(payload.durationMs, 300000);
  assert.equal(payload.earningTrials.length, 1);
  assert.equal(payload.delegationTrials.length, 0);
  assert.doesNotThrow(() => collector.parsePayload_(h.document.submissions[0].payload));
});

test('explicit discard removes the local response and never submits', () => {
  const h = appHarness({ collectionEnabled: true, submissionMode: 'live' });
  h.earning(); h.click('circle'); h.click('withdraw'); h.click('discard');
  assert.equal(h.read('phase'), 'withdrawn');
  assert.equal(h.read('state'), null);
  assert.equal(h.document.submissions.length, 0);
});

test('returning from withdrawal restores working choice listeners and original response timing', () => {
  const h = appHarness();
  h.earning(); h.setTime(5000); h.click('withdraw'); h.setTime(10000); h.click('return'); h.click('circle');
  assert.equal(h.read('state.earningTrials.length'), 1);
  assert.equal(h.read('state.earningTrials[0].rtMs'), 10000);
});

test('repeated withdrawal clicks do not nest confirmation prompts', () => {
  const h = appHarness();
  h.earning(); h.click('withdraw'); h.click('withdraw'); h.click('return');
  assert.equal(h.read('phase'), 'earning');
  assert.ok(h.document.getElementById('circle'));
});
