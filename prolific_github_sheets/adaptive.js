/**
 * Adaptive Engine for Moral Intuition Topology Study
 *
 * Provides:
 *  - Seeded PRNG (mulberry32) for reproducibility
 *  - Latin Hypercube Selection for space-filling trials (1-8)
 *  - Kernel-weighted boundary-seeking selection for adaptive trials (9-35)
 *
 * No DOM manipulation. Pure computation.
 */
window.AdaptiveEngine = (function () {
  "use strict";

  // --- Seeded PRNG (mulberry32) ---
  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // --- Utilities ---
  function euclidean5D(a, b) {
    var dx1 = a.d1 - b.d1;
    var dx2 = a.d2 - b.d2;
    var dx3 = a.d3 - b.d3;
    var dx4 = a.d4 - b.d4;
    var dx5 = a.d5 - b.d5;
    return Math.sqrt(dx1 * dx1 + dx2 * dx2 + dx3 * dx3 + dx4 * dx4 + dx5 * dx5);
  }

  function fisherYatesShuffle(arr, rng) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  var MAX_DIST_5D = Math.sqrt(5); // diagonal of unit 5-D hypercube

  // --- Latin Hypercube Selection (trials 1–8) ---
  function initLatinHypercube(scenarios, numTrials, seed) {
    var rng = mulberry32(seed);
    var dims = ["d1", "d2", "d3", "d4", "d5"];
    var strata = [];
    var i, d;

    for (d = 0; d < dims.length; d++) {
      var indices = [];
      for (i = 0; i < numTrials; i++) {
        indices.push(i);
      }
      strata.push(fisherYatesShuffle(indices, rng));
    }

    // Build target points from strata centers
    var targets = [];
    for (i = 0; i < numTrials; i++) {
      var point = {};
      for (d = 0; d < dims.length; d++) {
        point[dims[d]] = (strata[d][i] + 0.5) / numTrials;
      }
      targets.push(point);
    }

    // Greedily assign nearest unused scenario to each target
    var usedIds = {};
    var selected = [];

    for (i = 0; i < targets.length; i++) {
      var bestScenario = null;
      var bestDist = Infinity;
      for (var s = 0; s < scenarios.length; s++) {
        if (usedIds[scenarios[s].id]) continue;
        var dist = euclidean5D(targets[i], scenarios[s].dimensions);
        if (dist < bestDist) {
          bestDist = dist;
          bestScenario = scenarios[s];
        }
      }
      if (bestScenario) {
        selected.push(bestScenario);
        usedIds[bestScenario.id] = true;
      }
    }

    return selected;
  }

  // --- Kernel-weighted boundary selection (adaptive trials) ---
  function rbfKernel(dist, bandwidth) {
    return Math.exp(-(dist * dist) / (2 * bandwidth * bandwidth));
  }

  function kernelEstimate(candidateDims, responses, bandwidth) {
    var weightSum = 0;
    var valueSum = 0;

    for (var i = 0; i < responses.length; i++) {
      var dist = euclidean5D(candidateDims, responses[i].dimensions);
      var w = rbfKernel(dist, bandwidth);
      weightSum += w;
      valueSum += w * (responses[i].response === "permissible" ? 1 : 0);
    }

    if (weightSum < 1e-10) {
      return 0.5; // maximally uncertain if no nearby data
    }
    return valueSum / weightSum;
  }

  function explorationBonus(candidateDims, shownDimsList) {
    var minDist = Infinity;
    for (var i = 0; i < shownDimsList.length; i++) {
      var dist = euclidean5D(candidateDims, shownDimsList[i]);
      if (dist < minDist) {
        minDist = dist;
      }
    }
    return minDist / MAX_DIST_5D;
  }

  function selectNextAdaptive(scenarios, responses, shownIds, config, seed, trialNumber) {
    var bandwidth = config.KERNEL_BANDWIDTH || 0.3;
    var explWeight = config.EXPLORATION_WEIGHT || 0.2;
    var rng = mulberry32(seed + trialNumber);

    // Build list of shown dimension vectors
    var shownDimsList = [];
    for (var i = 0; i < responses.length; i++) {
      shownDimsList.push(responses[i].dimensions);
    }

    // Score each unshown candidate
    var candidates = [];
    for (var s = 0; s < scenarios.length; s++) {
      if (shownIds[scenarios[s].id]) continue;

      var pHat = kernelEstimate(scenarios[s].dimensions, responses, bandwidth);
      var boundaryScore = 1 - 2 * Math.abs(pHat - 0.5);
      var explBonus = shownDimsList.length > 0
        ? explorationBonus(scenarios[s].dimensions, shownDimsList)
        : 1.0;
      var score = (1 - explWeight) * boundaryScore + explWeight * explBonus;

      candidates.push({
        scenario: scenarios[s],
        score: score,
        tiebreaker: rng()
      });
    }

    // Sort by score descending, then tiebreaker
    candidates.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.tiebreaker - b.tiebreaker;
    });

    return candidates.length > 0 ? candidates[0].scenario : null;
  }

  // --- Public API ---
  return {
    initLatinHypercube: initLatinHypercube,
    selectNextAdaptive: selectNextAdaptive,
    euclidean5D: euclidean5D,
    mulberry32: mulberry32
  };
})();
