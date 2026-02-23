/**
 * Trial Engine — State machine for the 35-trial moral intuition experiment.
 *
 * Manages trial sequencing (8 Latin Hypercube + 27 adaptive), tracks responses,
 * and persists state to sessionStorage for crash recovery.
 *
 * No DOM manipulation. Consumers call getState() and render accordingly.
 */
window.TrialEngine = (function () {
  "use strict";

  var STORAGE_KEY = "moral_topology_state";

  var state = {
    phase: "idle",             // idle | running | complete
    trialNumber: 0,            // 0-indexed current trial
    totalTrials: 35,
    lhsTrials: 8,
    justificationEveryN: 7,
    lhsQueue: [],              // pre-selected scenarios for space-filling phase
    responses: [],             // completed trial records
    shownIds: {},              // scenario id -> true
    currentScenario: null,
    trialStartTime: 0,
    sessionStartTime: 0,
    seed: 0,
    scenarios: [],
    config: {}
  };

  // --- Initialization ---
  function init(options) {
    state.scenarios = options.scenarios || [];
    state.seed = options.seed || 0;
    state.totalTrials = Math.min(
      options.totalTrials || 35,
      state.scenarios.length
    );
    state.lhsTrials = Math.min(
      options.lhsTrials || 8,
      state.totalTrials
    );
    state.justificationEveryN = options.justificationEveryN || 7;
    state.config = options.config || {};
    state.sessionStartTime = Date.now();

    // Try to restore from sessionStorage
    var restored = tryRestore_(options.sessionId);
    if (restored) {
      return true; // resumed from saved state
    }

    // Fresh start: compute Latin Hypercube queue
    state.phase = "running";
    state.trialNumber = 0;
    state.responses = [];
    state.shownIds = {};
    state.lhsQueue = window.AdaptiveEngine.initLatinHypercube(
      state.scenarios,
      state.lhsTrials,
      state.seed
    );

    selectCurrentScenario_();
    saveState_();
    return false; // fresh start
  }

  // --- Trial Selection ---
  function selectCurrentScenario_() {
    var scenario = null;

    if (state.trialNumber < state.lhsTrials) {
      // Space-filling phase: use pre-computed queue
      scenario = state.lhsQueue[state.trialNumber];
    } else {
      // Adaptive phase: boundary-seeking selection
      scenario = window.AdaptiveEngine.selectNextAdaptive(
        state.scenarios,
        state.responses,
        state.shownIds,
        state.config,
        state.seed,
        state.trialNumber
      );
    }

    if (!scenario) {
      state.phase = "complete";
      return;
    }

    state.currentScenario = scenario;
    state.shownIds[scenario.id] = true;
    state.trialStartTime = Date.now();
  }

  // --- Record Response and Advance ---
  function recordResponse(response) {
    if (state.phase !== "running") return null;

    var record = {
      trialNumber: state.trialNumber + 1, // 1-indexed for humans
      trialType: state.trialNumber < state.lhsTrials ? "latin_hypercube" : "adaptive",
      scenarioId: state.currentScenario.id,
      dimensions: state.currentScenario.dimensions,
      response: response.choice,
      confidence: response.confidence,
      justification: response.justification || "",
      responseTimeMs: Date.now() - state.trialStartTime
    };

    state.responses.push(record);
    state.trialNumber++;

    if (state.trialNumber >= state.totalTrials) {
      state.phase = "complete";
      saveState_();
      return record;
    }

    selectCurrentScenario_();
    saveState_();
    return record;
  }

  // --- State Queries ---
  function getState() {
    var trialNum1 = state.trialNumber + 1; // 1-indexed
    return {
      phase: state.phase,
      trialNumber: trialNum1,
      totalTrials: state.totalTrials,
      trialType: state.trialNumber < state.lhsTrials ? "latin_hypercube" : "adaptive",
      currentScenario: state.currentScenario,
      needsJustification: trialNum1 % state.justificationEveryN === 0,
      progress: trialNum1 / state.totalTrials,
      isComplete: state.phase === "complete"
    };
  }

  function getAllResponses() {
    return state.responses.slice();
  }

  function getTotalSessionTimeMs() {
    return Date.now() - state.sessionStartTime;
  }

  // --- Session Persistence ---
  function saveState_() {
    try {
      var saved = {
        trialNumber: state.trialNumber,
        responses: state.responses,
        shownIds: state.shownIds,
        seed: state.seed,
        totalTrials: state.totalTrials,
        lhsTrials: state.lhsTrials,
        justificationEveryN: state.justificationEveryN,
        sessionStartTime: state.sessionStartTime,
        phase: state.phase
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch (e) {
      // sessionStorage unavailable — continue without persistence
    }
  }

  function tryRestore_(sessionId) {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return false;

      var saved = JSON.parse(raw);
      if (!saved || saved.seed !== state.seed) {
        // Different participant or corrupted — start fresh
        sessionStorage.removeItem(STORAGE_KEY);
        return false;
      }

      if (saved.phase === "complete") {
        // Already finished — restore completion state
        state.phase = "complete";
        state.trialNumber = saved.trialNumber;
        state.responses = saved.responses || [];
        state.shownIds = saved.shownIds || {};
        state.sessionStartTime = saved.sessionStartTime || Date.now();
        return true;
      }

      // Restore in-progress state
      state.phase = "running";
      state.trialNumber = saved.trialNumber || 0;
      state.responses = saved.responses || [];
      state.shownIds = saved.shownIds || {};
      state.totalTrials = saved.totalTrials || state.totalTrials;
      state.lhsTrials = saved.lhsTrials || state.lhsTrials;
      state.justificationEveryN = saved.justificationEveryN || state.justificationEveryN;
      state.sessionStartTime = saved.sessionStartTime || Date.now();

      // Re-compute LHS queue (deterministic given same seed)
      state.lhsQueue = window.AdaptiveEngine.initLatinHypercube(
        state.scenarios,
        state.lhsTrials,
        state.seed
      );

      selectCurrentScenario_();
      return true;
    } catch (e) {
      return false;
    }
  }

  function clearSavedState() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  }

  // --- Public API ---
  return {
    init: init,
    recordResponse: recordResponse,
    getState: getState,
    getAllResponses: getAllResponses,
    getTotalSessionTimeMs: getTotalSessionTimeMs,
    clearSavedState: clearSavedState
  };
})();
