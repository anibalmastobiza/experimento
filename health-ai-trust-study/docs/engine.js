export const VERSION = '1.0.0';
export const EARNING_TRIALS = 8;
export const DELEGATION_TRIALS = 8;
export const STAKES = [0, 2, 4, 6];

// Fixed algorithm makes a session reproducible from its recorded random seed.
export function randomGenerator(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let x = Math.imul(value ^ value >>> 15, 1 | value);
    x ^= x + Math.imul(x ^ x >>> 7, 61 | x);
    return ((x ^ x >>> 14) >>> 0) / 4294967296;
  };
}

export function createDesign(seed) {
  const rng = randomGenerator(seed);
  const conditionOrder = rng() < .5 ? ['fixed', 'variable'] : ['variable', 'fixed'];
  const systemOrder = rng() < .5 ? ['A', 'B'] : ['B', 'A'];
  const betterArm = rng() < .5 ? 'circle' : 'diamond';
  const earning = Array.from({ length: 8 }, () => ({ draw: rng(), circleLeft: rng() < .5 }));
  const delegation = Array.from({ length: 8 }, (_, index) => {
    const block = Math.floor(index / 4);
    const potentialSuccess = rng() < .75;
    const feeRandom = rng();
    return { trial: index + 1, block: block + 1, condition: conditionOrder[block], system: systemOrder[block], potentialSuccess, feeDraw: conditionOrder[block] === 'fixed' ? 1 : feeRandom < .5 ? 0 : 2 };
  });
  return { seed, conditionOrder, systemOrder, betterArm, earning, delegation };
}

export function earningOutcome(design, index, choice, balance, rtMs) {
  if (!['circle', 'diamond'].includes(choice) || index < 0 || index > 7) throw new Error('Invalid earning choice');
  const success = design.earning[index].draw < (choice === design.betterArm ? .75 : .25);
  const reward = success ? 12 : 8;
  return { trial: index + 1, choice, success, reward, balanceAfter: balance + reward, rtMs };
}

export function delegationOutcome(design, index, stake, balance, rtMs) {
  if (!STAKES.includes(stake) || index < 0 || index > 7) throw new Error('Invalid delegation choice');
  const trial = design.delegation[index];
  const feeCharged = stake > 0 ? trial.feeDraw : 0;
  if (balance < stake + feeCharged) throw new Error('Insufficient tokens');
  const returned = trial.potentialSuccess ? 2 * stake : 0;
  return { ...trial, stake, feeCharged, returned, balanceBefore: balance, balanceAfter: balance - stake - feeCharged + returned, rtMs };
}

export function validEndpoint(value) {
  return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(value || '');
}

export function summary(trials) {
  const out = {};
  for (const condition of ['fixed', 'variable']) {
    const rows = trials.filter(t => t.condition === condition);
    out[condition] = { n: rows.length, meanStake: rows.length ? rows.reduce((s, t) => s + t.stake, 0) / rows.length : null };
  }
  return out;
}
