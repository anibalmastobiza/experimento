import { createDesign, earningOutcome, delegationOutcome } from '../docs/engine.js';

// Synthetic data for tests only. Do not put this fixture into a participant dataset.
export function completeFixture({ seed = 123456, sessionId = '11111111-2222-4333-8444-555555555555', stake = 2 } = {}) {
  const design = createDesign(seed);
  const payload = {
    schemaVersion: 1, studyVersion: '1.0.0', consentVersion: '2026-10-19', sessionId,
    seed, consent: true, mode: 'test', status: 'completed', durationMs: 140000,
    conditionOrder: design.conditionOrder, systemOrder: design.systemOrder, betterArm: design.betterArm,
    demographics: { ageBand: 'prefer_not', gender: 'prefer_not', education: 'prefer_not', aiUse: 'prefer_not' },
    comprehensionAttempts: 1, earnedTokens: 0, finalTokens: 0,
    earningTrials: [], delegationTrials: [], ratings: []
  };
  let balance = 0;
  for (let i = 0; i < 8; i++) {
    const outcome = earningOutcome(design, i, i % 2 ? 'diamond' : 'circle', balance, 3000);
    payload.earningTrials.push(outcome);
    balance = outcome.balanceAfter;
  }
  payload.earnedTokens = balance;
  for (let i = 0; i < 8; i++) {
    const outcome = delegationOutcome(design, i, stake, balance, 4000);
    payload.delegationTrials.push(outcome);
    balance = outcome.balanceAfter;
  }
  payload.finalTokens = balance;
  payload.ratings = design.conditionOrder.map((condition, i) => ({
    block: i + 1, condition, trust: 5, risk: 3, complexity: 2, fairness: null
  }));
  return payload;
}

export function timeoutFixture(options = {}) {
  const payload = completeFixture(options);
  payload.status = 'timed_out';
  payload.durationMs = 300000;
  payload.delegationTrials = payload.delegationTrials.slice(0, 5);
  payload.ratings = payload.ratings.slice(0, 1);
  payload.finalTokens = payload.delegationTrials[4].balanceAfter;
  return payload;
}
