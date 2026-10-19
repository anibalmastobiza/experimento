import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDesign,
  randomGenerator,
  earningOutcome,
  delegationOutcome,
  summary,
  EARNING_TRIALS,
  DELEGATION_TRIALS,
  STAKES,
} from '../docs/engine.js';

test('a recorded seed reproduces the complete schedule and outcome stream', () => {
  for (const seed of [0, 1, 123456789, 0xffffffff]) {
    assert.deepEqual(createDesign(seed), createDesign(seed));
    const first = randomGenerator(seed);
    const second = randomGenerator(seed);
    for (let i = 0; i < 100; i++) {
      const draw = first();
      assert.equal(draw, second());
      assert.ok(draw >= 0 && draw < 1);
    }
  }
  assert.notDeepEqual(createDesign(1), createDesign(2));
});

test('the design maps exactly two four-trial blocks to the assigned names and conditions', () => {
  for (let seed = 0; seed < 256; seed++) {
    const design = createDesign(seed);
    assert.equal(design.earning.length, EARNING_TRIALS);
    assert.equal(design.delegation.length, DELEGATION_TRIALS);
    assert.equal(EARNING_TRIALS, 8);
    assert.equal(DELEGATION_TRIALS, 8);
    assert.deepEqual([...design.conditionOrder].sort(), ['fixed', 'variable']);
    assert.deepEqual([...design.systemOrder].sort(), ['A', 'B']);
    for (let i = 0; i < 8; i++) {
      const row = design.delegation[i];
      const blockIndex = Math.floor(i / 4);
      assert.equal(row.trial, i + 1);
      assert.equal(row.block, blockIndex + 1);
      assert.equal(row.condition, design.conditionOrder[blockIndex]);
      assert.equal(row.system, design.systemOrder[blockIndex]);
      assert.equal(typeof row.potentialSuccess, 'boolean');
      assert.ok(row.condition === 'fixed' ? row.feeDraw === 1 : [0, 2].includes(row.feeDraw));
    }
  }
});

test('randomization spans and approximately balances all order, name, and better-arm combinations', () => {
  const counts = new Map();
  const sessions = 8192;
  for (let seed = 0; seed < sessions; seed++) {
    const design = createDesign(seed);
    const key = [design.conditionOrder[0], design.systemOrder[0], design.betterArm].join(':');
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  assert.equal(counts.size, 8);
  const expected = sessions / 8;
  for (const [key, n] of counts) {
    assert.ok(Math.abs(n - expected) / expected < 0.12, `${key}: ${n} sessions`);
  }
});

test('earning pays eight guaranteed tokens plus a four-token bonus with correct success thresholds', () => {
  const design = createDesign(10);
  design.betterArm = 'circle';
  for (const [draw, circleSuccess, diamondSuccess] of [
    [0, true, true], [.249999, true, true], [.25, true, false], [.749999, true, false], [.75, false, false], [.999999, false, false],
  ]) {
    design.earning[0].draw = draw;
    for (const [choice, expectedSuccess] of [['circle', circleSuccess], ['diamond', diamondSuccess]]) {
      const result = earningOutcome(design, 0, choice, 19, 123);
      assert.equal(result.success, expectedSuccess);
      assert.equal(result.reward, expectedSuccess ? 12 : 8);
      assert.equal(result.balanceAfter, 19 + result.reward);
      assert.equal(result.rtMs, 123);
    }
  }
  for (let seed = 0; seed < 256; seed++) {
    const session = createDesign(seed);
    let balance = 0;
    for (let i = 0; i < 8; i++) balance = earningOutcome(session, i, i % 2 ? 'circle' : 'diamond', balance, 50).balanceAfter;
    assert.ok(balance >= 64 && balance <= 96);
    assert.equal(balance % 4, 0);
  }
});

test('committing zero always preserves the bank and charges no fee or return', () => {
  for (let seed = 0; seed < 256; seed++) {
    const design = createDesign(seed);
    let balance = 64;
    const rows = design.delegation.map((_, index) => {
      const result = delegationOutcome(design, index, 0, balance, 87);
      assert.equal(result.feeCharged, 0);
      assert.equal(result.returned, 0);
      assert.equal(result.balanceAfter, balance);
      assert.equal(result.rtMs, 87);
      balance = result.balanceAfter;
      return result;
    });
    assert.deepEqual(summary(rows), {
      fixed: { n: 4, meanStake: 0 }, variable: { n: 4, meanStake: 0 },
    });
  }
});

test('all maximum commitments reconcile against stake, fee and return totals', () => {
  for (let seed = 0; seed < 1024; seed++) {
    const design = createDesign(seed);
    let balance = 64;
    let totalStaked = 0;
    let totalFees = 0;
    let totalReturned = 0;
    for (let i = 0; i < 8; i++) {
      const result = delegationOutcome(design, i, 6, balance, 99);
      assert.equal(result.balanceBefore, balance);
      assert.equal(result.returned, result.potentialSuccess ? 12 : 0);
      assert.equal(result.feeCharged, result.feeDraw);
      totalStaked += result.stake;
      totalFees += result.feeCharged;
      totalReturned += result.returned;
      balance = result.balanceAfter;
      assert.equal(balance, 64 - totalStaked - totalFees + totalReturned);
      assert.ok(balance >= 0);
    }
    assert.equal(totalStaked, 48);
  }
});

test('even all failures with maximum variable fees remain affordable from the minimum bank', () => {
  const design = createDesign(42);
  design.delegation.forEach(row => {
    row.potentialSuccess = false;
    row.feeDraw = row.condition === 'fixed' ? 1 : 2;
  });
  let balance = 64;
  for (let i = 0; i < 8; i++) {
    for (const stake of STAKES) assert.doesNotThrow(() => delegationOutcome(design, i, stake, balance, 100));
    balance = delegationOutcome(design, i, 6, balance, 100).balanceAfter;
    assert.ok(balance >= 0);
  }
  assert.equal(balance, 4);
});

test('only offered numeric stakes and valid trial indices are accepted', () => {
  const design = createDesign(8);
  assert.deepEqual(STAKES, [0, 2, 4, 6]);
  for (const invalid of [-2, -1, 1, 3, 5, 7, 8, .5, '2', null, undefined, NaN, Infinity]) {
    assert.throws(() => delegationOutcome(design, 0, invalid, 64, 100));
  }
  for (const index of [-1, 8, 9]) {
    assert.throws(() => delegationOutcome(design, index, 2, 64, 100));
    assert.throws(() => earningOutcome(design, index, 'circle', 0, 100));
  }
  assert.throws(() => earningOutcome(design, 0, 'triangle', 0, 100));
  const fixedIndex = design.delegation.findIndex(row => row.condition === 'fixed');
  assert.throws(() => delegationOutcome(design, fixedIndex, 6, 6, 100), /Insufficient tokens/);
  assert.equal(delegationOutcome(design, fixedIndex, 0, 0, 100).balanceAfter, 0);
});

test('Monte Carlo schedules preserve equal expected fees and the declared success chance', () => {
  const counts = { fixed: { n: 0, fees: 0, successes: 0 }, variable: { n: 0, fees: 0, successes: 0 } };
  let variableAllSuccess = false;
  let variableAllFailure = false;
  for (let seed = 0; seed < 8192; seed++) {
    const design = createDesign(seed);
    for (const row of design.delegation) {
      const group = counts[row.condition];
      group.n++;
      group.fees += row.feeDraw;
      group.successes += Number(row.potentialSuccess);
    }
    const variable = design.delegation.filter(row => row.condition === 'variable');
    variableAllSuccess ||= variable.every(row => row.potentialSuccess);
    variableAllFailure ||= variable.every(row => !row.potentialSuccess);
  }
  assert.equal(counts.fixed.fees / counts.fixed.n, 1);
  assert.ok(Math.abs(counts.variable.fees / counts.variable.n - 1) < .03);
  for (const group of Object.values(counts)) assert.ok(Math.abs(group.successes / group.n - .75) < .015);
  assert.ok(variableAllSuccess && variableAllFailure, 'outcomes must not be forced to three successes per block');
});
