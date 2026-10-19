/* Google Apps Script V8 collector. Configure Script Properties; never add secrets to the website. */
var COLLECTOR = Object.freeze({
  schemaVersion: 1,
  studyVersion: '1.0.0',
  consentVersion: '2026-10-19',
  sheetName: 'Sessions',
  maxPayloadLength: 18000,
  maxPostLength: 60000,
  headers: [
    'sessionId', 'receivedDateUtc', 'payloadSha256', 'schemaVersion', 'studyVersion',
    'consentVersion', 'mode', 'status', 'durationMs', 'ageBand', 'gender', 'education',
    'aiUse', 'comprehensionAttempts', 'earnedTokens', 'finalTokens', 'conditionOrder',
    'systemOrder', 'betterArm', 'seed', 'earningTrialsJson', 'delegationTrialsJson',
    'ratingsJson', 'payloadJson'
  ]
});

function doGet() {
  // Reachability only: no records, identifiers, configuration, or write operations.
  return ContentService.createTextOutput(JSON.stringify({
    service: 'health-ai-trust-study', schemaVersion: 1, status: 'reachable'
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var origin = null;
  var nonce = '';
  var sessionId = '';
  try {
    var config = readConfig_();
    var envelope = readEnvelope_(e);
    origin = allowOrigin_(envelope.parentOrigin, config.allowedOrigins);
    nonce = uuid_(envelope.nonce);
    var payload = parsePayload_(envelope.payload);
    sessionId = payload.sessionId;
    if (!config.collectionOpen) fail_('collection_closed');
    var status = storeSession_(payload, config.spreadsheetId);
    return response_(origin, nonce, sessionId, true, status, '');
  } catch (error) {
    // Error details and incoming content must never be logged or reflected.
    var code = error && error.collectorCode ? error.collectorCode : 'storage_unavailable';
    return response_(origin, nonce, sessionId, false, 'rejected', code);
  }
}

function setupCollector() {
  // Run manually once from the Apps Script editor after setting Script Properties.
  // Creates a header-only Sessions sheet or checks the existing header exactly.
  var config = readConfig_();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) fail_('busy');
  try {
    var sheet = ensureSheet_(SpreadsheetApp.openById(config.spreadsheetId));
    SpreadsheetApp.flush();
    return { sheetName: sheet.getName(), columnCount: COLLECTOR.headers.length };
  } finally {
    lock.releaseLock();
  }
}

function readConfig_() {
  var properties = PropertiesService.getScriptProperties();
  var spreadsheetId = properties.getProperty('SPREADSHEET_ID') || '';
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(spreadsheetId)) fail_('configuration_error');
  var allowedOrigins;
  try {
    allowedOrigins = JSON.parse(properties.getProperty('ALLOWED_ORIGINS') || '[]');
  } catch (_) {
    fail_('configuration_error');
  }
  if (!Array.isArray(allowedOrigins) || !allowedOrigins.length || allowedOrigins.length > 10) {
    fail_('configuration_error');
  }
  allowedOrigins.forEach(function (origin) {
    // HTTPS exact origins only, except explicitly configured local pilot origins.
    if (typeof origin !== 'string' || origin.length > 250 ||
        !/^(https:\/\/[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?(?::[0-9]{1,5})?|http:\/\/(?:localhost|127\.0\.0\.1):[0-9]{1,5})$/.test(origin)) {
      fail_('configuration_error');
    }
  });
  return {
    spreadsheetId: spreadsheetId,
    allowedOrigins: allowedOrigins,
    collectionOpen: properties.getProperty('COLLECTION_OPEN') === 'true'
  };
}

function readEnvelope_(e) {
  if (!e || !e.parameter || !e.postData ||
      typeof e.postData.contents !== 'string' ||
      e.postData.contents.length > COLLECTOR.maxPostLength ||
      (typeof e.contentLength === 'number' && e.contentLength > COLLECTOR.maxPostLength) ||
      String(e.postData.type || '').split(';')[0] !== 'application/x-www-form-urlencoded') {
    fail_('invalid_request');
  }
  keys_(e.parameter, ['payload', 'parentOrigin', 'nonce']);
  if (e.parameters) {
    keys_(e.parameters, ['payload', 'parentOrigin', 'nonce']);
    Object.keys(e.parameters).forEach(function (key) {
      if (!Array.isArray(e.parameters[key]) || e.parameters[key].length !== 1) fail_('invalid_request');
    });
  }
  return e.parameter;
}

function allowOrigin_(origin, allowed) {
  if (typeof origin !== 'string' || allowed.indexOf(origin) < 0) fail_('origin_not_allowed');
  return origin;
}

function parsePayload_(raw) {
  if (typeof raw !== 'string' || raw.length > COLLECTOR.maxPayloadLength) fail_('invalid_payload');
  var payload;
  try { payload = JSON.parse(raw); } catch (_) { fail_('invalid_payload'); }
  validatePayload_(payload);
  return payload;
}

function validatePayload_(p) {
  keys_(p, ['schemaVersion', 'studyVersion', 'consentVersion', 'sessionId', 'seed', 'consent',
    'mode', 'status', 'durationMs', 'conditionOrder', 'systemOrder', 'betterArm', 'demographics',
    'comprehensionAttempts', 'earnedTokens', 'finalTokens', 'earningTrials', 'delegationTrials', 'ratings']);
  if (p.schemaVersion !== COLLECTOR.schemaVersion || p.studyVersion !== COLLECTOR.studyVersion ||
      p.consentVersion !== COLLECTOR.consentVersion || p.consent !== true) fail_('invalid_payload');
  uuid_(p.sessionId);
  integer_(p.seed, 0, 4294967295);
  enum_(p.mode, ['live', 'test']);
  enum_(p.status, ['completed', 'timed_out']);
  integer_(p.durationMs, 0, 300000);
  integer_(p.comprehensionAttempts, 0, 99);
  integer_(p.earnedTokens, 0, 96);
  integer_(p.finalTokens, 0, 192);
  permutation_(p.conditionOrder, ['fixed', 'variable']);
  permutation_(p.systemOrder, ['A', 'B']);
  enum_(p.betterArm, ['circle', 'diamond']);
  keys_(p.demographics, ['ageBand', 'gender', 'education', 'aiUse']);
  enum_(p.demographics.ageBand, ['18-24', '25-34', '35-44', '45-54', '55-64', '65+', 'prefer_not']);
  enum_(p.demographics.gender, ['woman', 'man', 'nonbinary', 'another', 'prefer_not']);
  enum_(p.demographics.education, ['secondary_or_less', 'vocational', 'undergraduate', 'postgraduate', 'prefer_not']);
  enum_(p.demographics.aiUse, ['never', 'monthly', 'weekly', 'daily', 'prefer_not']);
  array_(p.earningTrials, 8);
  array_(p.delegationTrials, 8);
  array_(p.ratings, 2);
  var balance = 0;
  p.earningTrials.forEach(function (t, i) {
    keys_(t, ['trial', 'choice', 'success', 'reward', 'balanceAfter', 'rtMs']);
    if (t.trial !== i + 1 || typeof t.success !== 'boolean') fail_('invalid_payload');
    enum_(t.choice, ['circle', 'diamond']);
    integer_(t.rtMs, 0, 300000);
    if (t.reward !== (t.success ? 12 : 8)) fail_('invalid_payload');
    balance += t.reward;
    if (t.balanceAfter !== balance) fail_('invalid_payload');
  });
  if (p.earnedTokens !== balance) fail_('invalid_payload');
  if (p.delegationTrials.length && p.earningTrials.length !== 8) fail_('invalid_payload');
  p.delegationTrials.forEach(function (t, i) {
    keys_(t, ['trial', 'block', 'condition', 'system', 'stake', 'potentialSuccess', 'feeDraw',
      'feeCharged', 'returned', 'balanceBefore', 'balanceAfter', 'rtMs']);
    var block = Math.floor(i / 4) + 1;
    if (t.trial !== i + 1 || t.block !== block || t.condition !== p.conditionOrder[block - 1] ||
        t.system !== p.systemOrder[block - 1] || typeof t.potentialSuccess !== 'boolean') fail_('invalid_payload');
    enum_(t.stake, [0, 2, 4, 6]);
    enum_(t.feeDraw, t.condition === 'fixed' ? [1] : [0, 2]);
    integer_(t.rtMs, 0, 300000);
    if (t.feeCharged !== (t.stake === 0 ? 0 : t.feeDraw) ||
        t.returned !== (t.potentialSuccess ? 2 * t.stake : 0) ||
        t.balanceBefore !== balance || balance < t.stake + t.feeCharged) fail_('invalid_payload');
    balance = balance - t.stake - t.feeCharged + t.returned;
    if (t.balanceAfter !== balance) fail_('invalid_payload');
  });
  if (p.finalTokens !== balance) fail_('invalid_payload');
  p.ratings.forEach(function (r, i) {
    keys_(r, ['block', 'condition', 'trust', 'risk', 'complexity', 'fairness']);
    if (r.block !== i + 1 || r.condition !== p.conditionOrder[i] ||
        p.delegationTrials.length < (i + 1) * 4) fail_('invalid_payload');
    ['trust', 'risk', 'complexity', 'fairness'].forEach(function (key) {
      if (r[key] !== null) integer_(r[key], 1, 7);
    });
  });
  if (p.status === 'completed' &&
      (p.earningTrials.length !== 8 || p.delegationTrials.length !== 8 || p.ratings.length !== 2)) {
    fail_('invalid_payload');
  }
  return p;
}

function storeSession_(payload, spreadsheetId) {
  var canonical = canonical_(payload);
  var digest = sha256_(canonical);
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) fail_('busy');
  try {
    var sheet = ensureSheet_(SpreadsheetApp.openById(spreadsheetId));
    var lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      var found = sheet.getRange(2, 1, lastRow - 1, 1).createTextFinder(payload.sessionId)
        .matchEntireCell(true).useRegularExpression(false).findNext();
      if (found) {
        if (sheet.getRange(found.getRow(), 3).getValue() !== digest) fail_('session_conflict');
        return 'duplicate';
      }
    }
    var d = payload.demographics;
    var row = [payload.sessionId, new Date().toISOString().slice(0, 10), digest,
      payload.schemaVersion, payload.studyVersion, payload.consentVersion, payload.mode,
      payload.status, payload.durationMs, d.ageBand, d.gender, d.education, d.aiUse,
      payload.comprehensionAttempts, payload.earnedTokens, payload.finalTokens,
      JSON.stringify(payload.conditionOrder), JSON.stringify(payload.systemOrder), payload.betterArm,
      payload.seed, JSON.stringify(payload.earningTrials), JSON.stringify(payload.delegationTrials),
      JSON.stringify(payload.ratings), canonical];
    // One authoritative row in one range write avoids multi-sheet partial commits.
    // No free-text fields reach Sheets, and every string has an allowlisted prefix.
    var targetRow = lastRow + 1;
    sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
    SpreadsheetApp.flush();
    var written = sheet.getRange(targetRow, 1, 1, 3).getValues()[0];
    if (written[0] !== payload.sessionId || written[2] !== digest) fail_('write_not_confirmed');
    return 'saved';
  } finally {
    lock.releaseLock();
  }
}

function ensureSheet_(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(COLLECTOR.sheetName) || spreadsheet.insertSheet(COLLECTOR.sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, COLLECTOR.headers.length).setValues([COLLECTOR.headers]);
    sheet.setFrozenRows(1);
  } else {
    var existing = sheet.getRange(1, 1, 1, COLLECTOR.headers.length).getValues()[0];
    if (JSON.stringify(existing) !== JSON.stringify(COLLECTOR.headers)) fail_('header_mismatch');
  }
  return sheet;
}

function response_(origin, nonce, sessionId, ok, status, code) {
  if (!origin) {
    return HtmlService.createHtmlOutput('<!doctype html><meta charset="utf-8"><title>Study submission</title><p>Submission could not be accepted.</p>');
  }
  var message = {
    type: 'health-ai-study-ack', schemaVersion: 1, sessionId: sessionId,
    nonce: nonce, ok: ok, status: status, code: code
  };
  // JSON is escaped as script text. No participant answers are returned.
  // HtmlService adds a sandbox frame; top is the independently hosted study.
  var html = '<!doctype html><meta charset="utf-8"><title>Study submission</title>' +
    '<p>Submission processed. You can return to the study.</p><script>' +
    'window.top.postMessage(' + scriptJson_(message) + ',' + scriptJson_(origin) + ');' +
    '</script>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function scriptJson_(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function canonical_(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical_).join(',') + ']';
  if (value !== null && typeof value === 'object') {
    return '{' + Object.keys(value).sort().map(function (key) {
      return JSON.stringify(key) + ':' + canonical_(value[key]);
    }).join(',') + '}';
  }
  return JSON.stringify(value);
}

function sha256_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8)
    .map(function (byte) { return ('0' + ((byte + 256) % 256).toString(16)).slice(-2); }).join('');
}

function keys_(value, expected) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail_('invalid_payload');
  var actual = Object.keys(value).sort();
  if (actual.length !== expected.length || actual.join('|') !== expected.slice().sort().join('|')) fail_('invalid_payload');
}

function integer_(value, min, max) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) fail_('invalid_payload');
}

function enum_(value, allowed) {
  if (allowed.indexOf(value) < 0) fail_('invalid_payload');
}

function array_(value, maxLength) {
  if (!Array.isArray(value) || value.length > maxLength) fail_('invalid_payload');
}

function permutation_(value, allowed) {
  array_(value, allowed.length);
  value.forEach(function (item) { enum_(item, allowed); });
  if (value.length !== allowed.length || value.slice().sort().join('|') !== allowed.slice().sort().join('|')) fail_('invalid_payload');
}

function uuid_(value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value)) fail_('invalid_payload');
  return value;
}

function fail_(code) {
  var error = new Error(code);
  error.collectorCode = code;
  throw error;
}
