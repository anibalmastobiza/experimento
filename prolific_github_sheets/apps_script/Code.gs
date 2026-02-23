const SHEET_NAME = "raw_data";
const HEADERS = [
  "timestamp_server",
  "event_id",
  "event",
  "timestamp_iso",
  "prolific_pid",
  "study_id",
  "session_id",
  "group",
  "trial_number",
  "trial_type",
  "scenario_id",
  "d1",
  "d2",
  "d3",
  "d4",
  "d5",
  "response",
  "confidence",
  "justification",
  "response_time_ms",
  "responses_backup",
  "page_url",
  "user_agent"
];

function doPost(e) {
  return handleRequest_(e);
}

function doGet(e) {
  return handleRequest_(e);
}

function handleRequest_(e) {
  let lock;
  try {
    lock = LockService.getScriptLock();
    lock.waitLock(5000);

    const sheet = getSheet_();
    ensureHeader_(sheet);

    const p = (e && e.parameter) || {};
    const row = [
      new Date(),
      p.event_id || "",
      p.event || "",
      p.timestamp_iso || "",
      p.prolific_pid || "",
      p.study_id || "",
      p.session_id || "",
      p.group || "",
      p.trial_number || "",
      p.trial_type || "",
      p.scenario_id || "",
      p.d1 || "",
      p.d2 || "",
      p.d3 || "",
      p.d4 || "",
      p.d5 || "",
      p.response || "",
      p.confidence || "",
      p.justification || "",
      p.response_time_ms || "",
      p.responses_backup || "",
      p.page_url || "",
      p.user_agent || ""
    ];

    sheet.appendRow(row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    if (lock) {
      lock.releaseLock();
    }
  }
}

function ensureHeader_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  return sheet;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
