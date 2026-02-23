(function () {
  const cfg = Object.assign(
    {
      STUDY_TITLE: "Moral Intuition Study",
      GAS_ENDPOINT: "",
      PROLIFIC_COMPLETION_URL: "",
      REDIRECT_DELAY_MS: 900
    },
    window.STUDY_CONFIG || {}
  );

  const els = {
    title: document.getElementById("study-title"),
    statusText: document.getElementById("status-text"),
    statusBox: document.getElementById("status-box"),
    errorBox: document.getElementById("error-box"),
    form: document.getElementById("study-form"),
    finishBtn: document.getElementById("finish-btn"),
    confidence: document.getElementById("confidence"),
    confidenceValue: document.getElementById("confidence-value")
  };

  els.title.textContent = cfg.STUDY_TITLE;
  els.confidence.addEventListener("input", function () {
    els.confidenceValue.textContent = String(els.confidence.value);
  });

  const session = getProlificSession_();
  if (!session.isValid) {
    showError_("Missing Prolific URL parameters.");
    return;
  }

  if (!cfg.GAS_ENDPOINT || !cfg.PROLIFIC_COMPLETION_URL) {
    showError_("Missing configuration in config.js.");
    return;
  }

  const condition = assignCondition_(session.prolificPid);
  updateStatus_("Session linked. You can start.");
  els.form.hidden = false;

  fireAndForgetLog_("arrival", {
    condition: condition,
    responses: ""
  });

  els.form.addEventListener("submit", async function (event) {
    event.preventDefault();
    els.finishBtn.disabled = true;
    updateStatus_("Saving your responses...");

    const payload = collectResponses_();
    await fireAndForgetLog_("finish", {
      condition: condition,
      responses: JSON.stringify(payload)
    });

    updateStatus_("Done. Redirecting to Prolific...");
    setTimeout(function () {
      window.location.assign(cfg.PROLIFIC_COMPLETION_URL);
    }, cfg.REDIRECT_DELAY_MS);
  });

  function collectResponses_() {
    const data = new FormData(els.form);
    return {
      case_1: data.get("case_1"),
      case_2: data.get("case_2"),
      case_3: data.get("case_3"),
      confidence: Number(data.get("confidence")),
      consent: data.get("consent") === "on"
    };
  }

  function fireAndForgetLog_(eventType, fields) {
    const form = new URLSearchParams();
    const payload = Object.assign(
      {
        event_id: makeEventId_(),
        event: eventType,
        timestamp_iso: new Date().toISOString(),
        prolific_pid: session.prolificPid,
        study_id: session.studyId,
        session_id: session.sessionId,
        page_url: window.location.href,
        user_agent: navigator.userAgent
      },
      fields || {}
    );

    Object.keys(payload).forEach(function (key) {
      form.append(key, String(payload[key] == null ? "" : payload[key]));
    });

    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(cfg.GAS_ENDPOINT, form);
      if (ok) {
        return Promise.resolve();
      }
    }

    return fetch(cfg.GAS_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      body: form
    }).catch(function () {
      return undefined;
    });
  }

  function getProlificSession_() {
    const params = new URLSearchParams(window.location.search);
    const prolificPid = params.get("PROLIFIC_PID") || params.get("prolific_pid") || "";
    const studyId = params.get("STUDY_ID") || params.get("study_id") || "";
    const sessionId = params.get("SESSION_ID") || params.get("session_id") || "";

    return {
      prolificPid: prolificPid,
      studyId: studyId,
      sessionId: sessionId,
      isValid: Boolean(prolificPid && studyId && sessionId)
    };
  }

  function assignCondition_(seed) {
    const value = hashString_(seed);
    return value % 2 === 0 ? "control" : "treatment";
  }

  function hashString_(input) {
    let h = 0;
    for (let i = 0; i < input.length; i += 1) {
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

  function showError_(msg) {
    els.errorBox.hidden = false;
    els.form.hidden = true;
    updateStatus_(msg);
  }

  function updateStatus_(msg) {
    els.statusText.textContent = msg;
  }
})();
