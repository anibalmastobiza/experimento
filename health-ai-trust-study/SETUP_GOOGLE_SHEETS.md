# Google Sheets collection setup

The collector has been deployed with the researcher's explicit authorization. On 19 October 2026, a real-browser test received a successful acknowledgement and the matching response was independently read from the private Sheet. It contained eight earning trials, eight delegation trials and two rating records, and was marked `mode: test`. The website configuration enables participant collection. The instructions below explain how to configure a separate deployment or reproduce the checks.

Researcher: Aníbal Astobiza, University of Granada, amastobiza@ugr.es.

## 1. Select the private workbook

Use the private workbook delivered separately to the researcher, or create another private Google spreadsheet under the appropriate research account. Its private link and identifier are deliberately omitted from this public source package. Do not publish the spreadsheet or grant participants access. The prepared workbook contains `Readme`, `Sessions`, and `Data dictionary` sheets. `Sessions` includes one verified test response, marked separately from participant data.

The spreadsheet ID is the part between `/d/` and `/edit` in its URL. Store this ID in Apps Script properties. The web page does not need the spreadsheet ID, a Google API key, or an OAuth token.

## 2. Install the collector

1. Open the spreadsheet and choose **Extensions > Apps Script**.
2. Replace the initial script with the contents of `backend/Code.gs`.
3. In **Project Settings**, enable display of the `appsscript.json` manifest. Replace its contents with `backend/appsscript.json`.
4. In **Project Settings > Script properties**, add these three properties:

| Property | Value |
| --- | --- |
| `SPREADSHEET_ID` | Your private spreadsheet ID, supplied only in Script Properties. |
| `ALLOWED_ORIGINS` | A JSON array of exact web origins, for example `["https://YOUR-USERNAME.github.io"]`. |
| `COLLECTION_OPEN` | `false` initially. Only the exact text `true` permits submissions. |

For a local pilot, an additional explicit origin can be used, for example `["https://YOUR-USERNAME.github.io","http://localhost:4173"]`. An origin contains the scheme, host, and optional port. Do not include the repository path, a trailing slash, or a wildcard. `localhost` and `127.0.0.1` are different origins. Remove local test origins when they are no longer needed.

5. Select `setupCollector` in the editor and run it once. Authorize the spreadsheet access requested by your own script. It creates a header-only `Sessions` sheet if needed and checks existing headers. It does not open collection.
6. Confirm that the `Sessions` header row contains the 24 columns defined in `COLLECTOR.headers`. A `header_mismatch` error means the script and sheet schema differ. Resolve the mismatch deliberately; do not delete existing research records to make an error disappear.

Google documents web app entry points, execution identities, and deployment through the editor in its [Apps Script web app guide](https://developers.google.com/apps-script/guides/web).

## 3. Deploy the endpoint

1. Choose **Deploy > New deployment > Web app**.
2. Set **Execute as** to your account. The collector needs to write to your private spreadsheet using the deployment owner's access.
3. Set **Who has access** to **Anyone**, if this option is available under your institution's account policy. A deployment requiring participant sign-in does not meet this study's design. If anonymous deployment is unavailable, use an institution-approved anonymous collection service before recruitment.
4. Deploy, authorize as the owner, and copy the URL ending in `/exec`.
5. Open that URL. The health response should be `{"service":"health-ai-trust-study","schemaVersion":1,"status":"reachable"}`. This checks endpoint reachability only. It does not establish that a write works.

Keep the spreadsheet private. The endpoint URL is public by design. A token or password placed in public JavaScript would also be public and would not authenticate participants. Do not put Google credentials, OAuth tokens, or private keys in the repository. Google's [web app guide](https://developers.google.com/apps-script/guides/web) explicitly cautions against sending owner OAuth tokens to clients.

When changing collector code, update the deployment to a new version through **Deploy > Manage deployments**. Saving a script alone does not replace the code served by an existing versioned deployment.

## 4. Configure and test the website

In `docs/config.js`, set `appsScriptUrl` to the deployed `/exec` URL.

For a controlled pilot, set the server property `COLLECTION_OPEN` to `true`, set `submissionMode: 'test'`, and enable `collectionEnabled` in the local website configuration. Keep the public site closed during this test. Pilot rows will be marked `mode: "test"`. Do not submit real participant data for this check.

Run the local page with:

```sh
python3 -m http.server 4173 --directory docs
```

Then open `http://localhost:4173` using the browser. Opening `index.html` as a local file does not give a usable origin for this submission bridge.

Complete the following deployment checks in the actual browser:

1. Finish one consented test session. Confirm that exactly one new row appears in `Sessions`, the website reports a verified save, `mode` is `test`, and `payloadJson` includes the completed trial arrays.
2. Verify both condition orders and a session that reaches the five-minute limit. Partial timed-out data must retain `status: "timed_out"`.
3. Retry a submission with the same in-memory session payload after a simulated connection failure. Confirm that the collector returns `duplicate` and does not add a second row. The same session ID with changed data must be rejected as `session_conflict`.
4. Set `COLLECTION_OPEN` to `false` and submit a controlled test. Confirm that the website does not display a successful save. Restore it only when ready for collection.
5. Test with a browser profile that is signed out of Google. Check desktop and mobile browsers, including the browsers intended for recruitment. Authentication prompts, blocked frames, and quota failures must not be interpreted as successful saves.

A submission timeout is an uncertain outcome: the row may already have been written. Keep the same payload and session ID when retrying. Do not regenerate an ID for a retry. The website must wait for an acknowledged `saved` or `duplicate` response; a form submission or iframe load by itself is insufficient.

After a successful pilot, review the private test rows and preserve or remove them according to your research record procedure. Use `mode` to exclude test rows from participant analyses. Set `submissionMode: 'live'` and enable public collection after the actual deployment has passed these checks.

## Submission protocol

The site sends a URL-encoded HTML form to its private target iframe. There are exactly three form fields:

| Field | Meaning |
| --- | --- |
| `payload` | JSON following schema version 1. |
| `parentOrigin` | The current site's exact origin, included in `ALLOWED_ORIGINS`. |
| `nonce` | A new random UUID v4 for this submission attempt. |

The server validates the payload, obtains a script lock, checks the session ID, writes one authoritative row, flushes the spreadsheet, and reads back the identifier and digest before replying. Duplicate detection uses the session UUID plus the SHA-256 digest of a canonical representation of the entire payload. It prevents accidental duplicate retries; it cannot establish that one human participated only once.

The response is an HTML document containing only a small acknowledgment:

```json
{
  "type": "health-ai-study-ack",
  "schemaVersion": 1,
  "sessionId": "11111111-2222-4333-8444-555555555555",
  "nonce": "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
  "ok": true,
  "status": "saved",
  "code": ""
}
```

This acknowledgment contains no answers. The random internal session ID is not displayed to participants and is not a completion code.

Apps Script uses a nested iframe sandbox. The response uses `window.top.postMessage` with the exact permitted parent origin and `HtmlService.XFrameOptionsMode.ALLOWALL`. These choices follow Google's [HTML service restrictions](https://developers.google.com/apps-script/guides/html/restrictions) and [frame option documentation](https://developers.google.com/apps-script/reference/html/x-frame-options-mode). The endpoint renders no interactive page or participant-supplied HTML.

The receiving site must validate message type, schema, exact nonce, session ID, a permitted Google script origin, and the sender window's ancestry under the pending submission iframe. Direct equality with the outer iframe's `contentWindow` is insufficient when the sender is inside Google's sandbox. Cross-origin access permits reading `window.parent`, which supports a bounded ancestry check. See [MDN's cross-origin script access documentation](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy#cross-origin_script_api_access) and [postMessage security guidance](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#security_concerns).

## Data and operational limits

The collector rejects unknown fields, arbitrary strings, unsupported categories, invalid consent, out-of-range values, inconsistent token balances, missing completed trials, and unexpected form fields. Names, email addresses, health histories, free-text answers, device details, and IP addresses are not fields in the research dataset. The server adds only the UTC collection date, without time of day. Google and GitHub may process ordinary request metadata independently of this dataset.

The `payloadJson` column is the authoritative complete session record. The separate JSON columns make trial and rating extraction easier. No secondary trial sheet is written during submission, avoiding a success state with only part of a session copied across sheets. Keep the collector's `Sessions` header stable while collecting; make derived analyses in separate sheets or files.

All client data remain untrusted. A public endpoint can receive fabricated requests, and a caller can forge the submitted `parentOrigin` value. The origin list controls where an acknowledgment is sent; it is not authentication or bot prevention. The random seed makes sessions reproducible for analysis, but server-side schema checks do not prove that a browser displayed the game or that a human made each choice. Predefine data-quality checks and monitor collection volume and service quotas. Avoid collecting additional identifying metadata solely to enforce uniqueness.

The lock coordinates writes made by this script. It does not prevent a spreadsheet editor from changing cells manually. Google's [LockService documentation](https://developers.google.com/apps-script/reference/lock/lock-service) explains the script lock's scope. Do not manually reorder or edit `Sessions` while a submission is in progress.

## Local verification

Run:

```sh
node --test backend/backend.test.cjs
```

The mocked Apps Script tests exercise validation, balance arithmetic, unknown-field rejection, origin rejection, closed collection, canonical duplicate detection, conflicting retries, lock contention, header mismatch, and storage failure. Separately, the real-browser test verified Google deployment, authorization, a production write, and the browser acknowledgement. Live retry deduplication, signed-out browsers, and a real five-minute timeout submission have not been verified; these conditions were covered by local simulated tests where applicable.
