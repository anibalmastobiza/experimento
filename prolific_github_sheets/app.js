(function () {
  "use strict";

  var cfg = Object.assign(
    {
      STUDY_TITLE: "Moral Intuition Topology Study",
      GAS_ENDPOINT: "",
      PROLIFIC_COMPLETION_URL: "",
      REDIRECT_DELAY_MS: 900,
      ALLOW_PREVIEW_WITHOUT_PROLIFIC: true,
      TOTAL_TRIALS: 35,
      LHS_TRIALS: 8,
      JUSTIFICATION_EVERY_N: 7,
      KERNEL_BANDWIDTH: 0.3,
      EXPLORATION_WEIGHT: 0.2,
      MIN_RESPONSE_TIME_MS: 500
    },
    window.STUDY_CONFIG || {}
  );

  // --- DOM references ---
  var els = {
    title: document.getElementById("study-title"),
    statusBox: document.getElementById("status-box"),
    statusText: document.getElementById("status-text"),
    errorBox: document.getElementById("error-box"),
    previewBtn: document.getElementById("preview-btn"),
    // Demographics
    demographicsScreen: document.getElementById("demographics-screen"),
    demographicsForm: document.getElementById("demographics-form"),
    demographicsBtn: document.getElementById("demographics-btn"),
    demographicsError: document.getElementById("demographics-error"),
    demoAge: document.getElementById("demo-age"),
    demoGender: document.getElementById("demo-gender"),
    demoEducation: document.getElementById("demo-education"),
    demoCountry: document.getElementById("demo-country"),
    demoPhilosophyTraining: document.getElementById("demo-philosophy-training"),
    // Consent
    consentScreen: document.getElementById("consent-screen"),
    consentCheckbox: document.getElementById("consent-checkbox"),
    consentBtn: document.getElementById("consent-btn"),
    // Trial
    trialScreen: document.getElementById("trial-screen"),
    progressBar: document.getElementById("progress-bar"),
    progressLabel: document.getElementById("progress-label"),
    trialPhaseTag: document.getElementById("trial-phase-tag"),
    scenarioText: document.getElementById("scenario-text"),
    choiceArea: document.getElementById("choice-area"),
    confidenceArea: document.getElementById("confidence-area"),
    trialConfidence: document.getElementById("trial-confidence"),
    trialConfidenceValue: document.getElementById("trial-confidence-value"),
    justificationArea: document.getElementById("justification-area"),
    trialJustification: document.getElementById("trial-justification"),
    nextTrialBtn: document.getElementById("next-trial-btn"),
    // Completion
    completionScreen: document.getElementById("completion-screen"),
    completionStatus: document.getElementById("completion-status")
  };

  els.title.textContent = cfg.STUDY_TITLE;

  // --- URL parameters ---
  var params = new URLSearchParams(window.location.search);
  var queryWantsPreview = params.get("preview") === "1" || params.get("test") === "1";
  var realSession = getProlificSession_(params);

  // --- Current trial state for UI ---
  var currentChoice = null;
  var demographicsData = null;

  // --- Bootstrap ---
  if (realSession.isValid) {
    startStudy_(realSession, false);
  } else if (cfg.ALLOW_PREVIEW_WITHOUT_PROLIFIC || queryWantsPreview) {
    startStudy_(makePreviewSession_(), true);
  } else {
    showError_("Missing Prolific URL parameters.");
    els.previewBtn.hidden = false;
    els.previewBtn.addEventListener("click", function () {
      startStudy_(makePreviewSession_(), true);
    });
  }

  // =========================================================================
  // Core flow
  // =========================================================================

  function startStudy_(session, isPreviewMode) {
    var hasEndpoint = isConfiguredUrl_(cfg.GAS_ENDPOINT);
    var hasCompletionUrl = isConfiguredUrl_(cfg.PROLIFIC_COMPLETION_URL);
    var canLog = hasEndpoint;

    if (!isPreviewMode && (!hasEndpoint || !hasCompletionUrl)) {
      showError_("Missing configuration in config.js.");
      return;
    }

    // Hide error, start at demographics screen
    els.errorBox.hidden = true;
    els.statusBox.hidden = true;
    els.demographicsScreen.hidden = false;
    els.consentScreen.hidden = true;
    els.trialScreen.hidden = true;
    els.completionScreen.hidden = true;

    if (isPreviewMode) {
      updateStatus_("Preview mode. Responses will not redirect to Prolific.");
      els.statusBox.hidden = false;
    }

    wireDemographicsEvents_(session, isPreviewMode, hasCompletionUrl, canLog);
    wireConsentEvents_(session, isPreviewMode, hasCompletionUrl, canLog);
  }

  function wireDemographicsEvents_(session, isPreviewMode, hasCompletionUrl, canLog) {
    if (els.demographicsForm.dataset.bound === "1") {
      refreshDemographicsButton_();
      return;
    }

    els.demographicsForm.dataset.bound = "1";
    var fields = [
      els.demoAge,
      els.demoGender,
      els.demoEducation,
      els.demoCountry,
      els.demoPhilosophyTraining
    ];

    fields.forEach(function (field) {
      if (!field) return;
      var eventType = field.tagName === "SELECT" ? "change" : "input";
      field.addEventListener(eventType, function () {
        refreshDemographicsButton_();
        els.demographicsError.hidden = true;
      });
    });

    refreshDemographicsButton_();

    els.demographicsBtn.addEventListener("click", function () {
      var parsed = parseDemographics_();
      if (!parsed) {
        els.demographicsError.hidden = false;
        refreshDemographicsButton_();
        return;
      }

      demographicsData = parsed;
      els.demographicsError.hidden = true;

      if (canLog) {
        fireAndForgetLog_(session, "demographics_submitted", {
          group: session.group,
          age: String(demographicsData.age),
          gender: demographicsData.gender,
          education: demographicsData.education,
          country: demographicsData.country,
          philosophy_training: demographicsData.philosophyTraining
        });
      }

      els.demographicsScreen.hidden = true;
      els.consentScreen.hidden = false;
      els.consentCheckbox.checked = false;
      els.consentBtn.disabled = true;
    });
  }

  function wireConsentEvents_(session, isPreviewMode, hasCompletionUrl, canLog) {
    if (els.consentScreen.dataset.bound === "1") {
      return;
    }

    els.consentScreen.dataset.bound = "1";

    // Consent checkbox enables button
    els.consentCheckbox.addEventListener("change", function () {
      els.consentBtn.disabled = !els.consentCheckbox.checked;
    });

    // Begin study on consent
    els.consentBtn.addEventListener("click", function () {
      if (!els.consentCheckbox.checked) return;
      if (!demographicsData) return;

      els.consentScreen.hidden = true;

      // Initialize trial engine
      var seed = hashString_(session.prolificPid);
      var wasResumed = window.TrialEngine.init({
        scenarios: window.SCENARIO_BANK,
        seed: seed,
        totalTrials: cfg.TOTAL_TRIALS,
        lhsTrials: cfg.LHS_TRIALS,
        justificationEveryN: cfg.JUSTIFICATION_EVERY_N,
        config: cfg,
        sessionId: session.sessionId
      });

      // Log session start (only if fresh)
      if (!wasResumed && canLog) {
        fireAndForgetLog_(session, "session_start", {
          group: session.group,
          age: String(demographicsData.age),
          gender: demographicsData.gender,
          education: demographicsData.education,
          country: demographicsData.country,
          philosophy_training: demographicsData.philosophyTraining
        });
      }

      var trialState = window.TrialEngine.getState();

      if (trialState.isComplete) {
        // Already completed (restored from sessionStorage)
        showCompletion_(session, isPreviewMode, hasCompletionUrl, canLog);
        return;
      }

      // Show trial screen and wire up events
      els.trialScreen.hidden = false;
      wireTrialEvents_(session, isPreviewMode, hasCompletionUrl, canLog);
      renderTrial_();
    });
  }

  function refreshDemographicsButton_() {
    els.demographicsBtn.disabled = parseDemographics_() == null;
  }

  function parseDemographics_() {
    var age = Number(els.demoAge.value);
    var gender = String(els.demoGender.value || "").trim();
    var education = String(els.demoEducation.value || "").trim();
    var country = String(els.demoCountry.value || "").trim();
    var philosophyTraining = String(els.demoPhilosophyTraining.value || "").trim();

    var hasValidAge = Number.isFinite(age) && age >= 18 && age <= 99;
    if (!hasValidAge || !gender || !education || !country || !philosophyTraining) {
      return null;
    }

    return {
      age: age,
      gender: gender,
      education: education,
      country: country,
      philosophyTraining: philosophyTraining
    };
  }

  // =========================================================================
  // Trial event wiring
  // =========================================================================

  function wireTrialEvents_(session, isPreviewMode, hasCompletionUrl, canLog) {
    // Choice buttons
    var choiceBtns = els.choiceArea.querySelectorAll(".choice-btn");
    choiceBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        currentChoice = btn.getAttribute("data-value");

        // Highlight selected, dim other
        choiceBtns.forEach(function (b) {
          b.classList.remove("selected");
        });
        btn.classList.add("selected");

        // Show confidence slider
        els.confidenceArea.hidden = false;

        // Show justification if needed, or show Next
        var trialState = window.TrialEngine.getState();
        if (trialState.needsJustification) {
          els.justificationArea.hidden = false;
        }
        els.nextTrialBtn.hidden = false;
      });
    });

    // Confidence slider display
    els.trialConfidence.addEventListener("input", function () {
      els.trialConfidenceValue.textContent = String(els.trialConfidence.value);
    });

    // Next trial button
    els.nextTrialBtn.addEventListener("click", function () {
      if (!currentChoice) return;

      var trialState = window.TrialEngine.getState();

      // Collect response
      var response = {
        choice: currentChoice,
        confidence: Number(els.trialConfidence.value),
        justification: trialState.needsJustification
          ? els.trialJustification.value.trim()
          : ""
      };

      // Record in engine
      var record = window.TrialEngine.recordResponse(response);

      // Log to Google Sheets
      if (canLog && record) {
        fireAndForgetLog_(session, "trial_response", {
          group: session.group,
          age: demographicsData ? String(demographicsData.age) : "",
          gender: demographicsData ? demographicsData.gender : "",
          education: demographicsData ? demographicsData.education : "",
          country: demographicsData ? demographicsData.country : "",
          philosophy_training: demographicsData ? demographicsData.philosophyTraining : "",
          trial_number: String(record.trialNumber),
          trial_type: record.trialType,
          scenario_id: record.scenarioId,
          d1: String(record.dimensions.d1),
          d2: String(record.dimensions.d2),
          d3: String(record.dimensions.d3),
          d4: String(record.dimensions.d4),
          d5: String(record.dimensions.d5),
          response: record.response,
          confidence: String(record.confidence),
          justification: record.justification,
          response_time_ms: String(record.responseTimeMs)
        });
      }

      // Check if complete
      var nextState = window.TrialEngine.getState();
      if (nextState.isComplete) {
        els.trialScreen.hidden = true;
        showCompletion_(session, isPreviewMode, hasCompletionUrl, canLog);
        return;
      }

      // Advance to next trial
      renderTrial_();
    });
  }

  // =========================================================================
  // Render current trial
  // =========================================================================

  function renderTrial_() {
    var trialState = window.TrialEngine.getState();

    // Reset UI state
    currentChoice = null;
    els.confidenceArea.hidden = true;
    els.justificationArea.hidden = true;
    els.nextTrialBtn.hidden = true;
    els.trialConfidence.value = "50";
    els.trialConfidenceValue.textContent = "50";
    els.trialJustification.value = "";

    // Reset choice button states
    var choiceBtns = els.choiceArea.querySelectorAll(".choice-btn");
    choiceBtns.forEach(function (b) {
      b.classList.remove("selected");
    });

    // Update progress
    els.progressBar.style.width = (trialState.progress * 100) + "%";
    els.progressLabel.textContent =
      "Trial " + trialState.trialNumber + " of " + trialState.totalTrials;

    // Update phase tag
    els.trialPhaseTag.textContent =
      trialState.trialType === "latin_hypercube" ? "Space-filling" : "Adaptive";

    // Display scenario
    if (trialState.currentScenario) {
      els.scenarioText.textContent = trialState.currentScenario.text;
    }

    // Scroll to top of card
    els.trialScreen.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // =========================================================================
  // Completion
  // =========================================================================

  function showCompletion_(session, isPreviewMode, hasCompletionUrl, canLog) {
    els.trialScreen.hidden = true;
    els.completionScreen.hidden = false;

    // Log session complete with backup data
    if (canLog) {
      var allResponses = window.TrialEngine.getAllResponses();
      var totalTime = window.TrialEngine.getTotalSessionTimeMs();

      fireAndForgetLog_(session, "session_complete", {
        group: session.group,
        age: demographicsData ? String(demographicsData.age) : "",
        gender: demographicsData ? demographicsData.gender : "",
        education: demographicsData ? demographicsData.education : "",
        country: demographicsData ? demographicsData.country : "",
        philosophy_training: demographicsData ? demographicsData.philosophyTraining : "",
        trial_number: String(allResponses.length),
        response_time_ms: String(totalTime),
        responses_backup: JSON.stringify(allResponses)
      });
    }

    // Clear saved state
    window.TrialEngine.clearSavedState();

    if (isPreviewMode || !hasCompletionUrl) {
      els.completionStatus.textContent =
        "Preview complete. No Prolific redirect in preview mode.";
      return;
    }

    els.completionStatus.textContent = "Redirecting to Prolific\u2026";
    setTimeout(function () {
      window.location.assign(cfg.PROLIFIC_COMPLETION_URL);
    }, cfg.REDIRECT_DELAY_MS);
  }

  // =========================================================================
  // Logging
  // =========================================================================

  function fireAndForgetLog_(session, eventType, fields) {
    var form = new URLSearchParams();
    var payload = {
      event_id: makeEventId_(),
      event: eventType,
      timestamp_iso: new Date().toISOString(),
      prolific_pid: session.prolificPid,
      study_id: session.studyId,
      session_id: session.sessionId,
      group: session.group || "",
      trial_number: "",
      trial_type: "",
      scenario_id: "",
      d1: "",
      d2: "",
      d3: "",
      d4: "",
      d5: "",
      response: "",
      confidence: "",
      justification: "",
      age: demographicsData ? String(demographicsData.age) : "",
      gender: demographicsData ? demographicsData.gender : "",
      education: demographicsData ? demographicsData.education : "",
      country: demographicsData ? demographicsData.country : "",
      philosophy_training: demographicsData ? demographicsData.philosophyTraining : "",
      response_time_ms: "",
      page_url: window.location.href,
      user_agent: navigator.userAgent
    };

    // Merge event-specific fields
    var keys = Object.keys(fields || {});
    for (var i = 0; i < keys.length; i++) {
      payload[keys[i]] = fields[keys[i]];
    }

    var paramKeys = Object.keys(payload);
    for (var j = 0; j < paramKeys.length; j++) {
      var k = paramKeys[j];
      form.append(k, payload[k] == null ? "" : String(payload[k]));
    }

    if (navigator.sendBeacon) {
      var ok = navigator.sendBeacon(cfg.GAS_ENDPOINT, form);
      if (ok) return Promise.resolve();
    }

    return fetch(cfg.GAS_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      body: form
    }).catch(function () {
      return undefined;
    });
  }

  // =========================================================================
  // Session helpers
  // =========================================================================

  function getProlificSession_(params) {
    var prolificPid = params.get("PROLIFIC_PID") || params.get("prolific_pid") || "";
    var studyId = params.get("STUDY_ID") || params.get("study_id") || "";
    var sessionId = params.get("SESSION_ID") || params.get("session_id") || "";
    var group = params.get("GROUP") || params.get("group") || "unspecified";

    return {
      prolificPid: prolificPid,
      studyId: studyId,
      sessionId: sessionId,
      group: group,
      isValid: Boolean(prolificPid && studyId && sessionId)
    };
  }

  function makePreviewSession_() {
    return {
      prolificPid: "preview_pid",
      studyId: "preview_study",
      sessionId: "preview_session",
      group: "preview",
      isValid: true
    };
  }

  function hashString_(input) {
    var h = 0;
    for (var i = 0; i < input.length; i++) {
      h = (h << 5) - h + input.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  function makeEventId_() {
    if (window.crypto && window.crypto.randomUUID) {
      return window.crypto.randomUUID();
    }
    return "evt_" + Date.now() + "_" + Math.floor(Math.random() * 1e6);
  }

  function isConfiguredUrl_(value) {
    return Boolean(
      value &&
      /^https?:\/\//i.test(value) &&
      value.indexOf("PASTE_") === -1 &&
      value.indexOf("REPLACE_ME") === -1
    );
  }

  function showError_(msg) {
    els.errorBox.hidden = false;
    els.demographicsScreen.hidden = true;
    els.consentScreen.hidden = true;
    els.trialScreen.hidden = true;
    updateStatus_(msg);
  }

  function updateStatus_(msg) {
    els.statusText.textContent = msg;
  }
})();
