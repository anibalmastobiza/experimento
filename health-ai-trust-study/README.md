# Tokens & Trust

An English browser experiment for Aníbal Astobiza, University of Granada. Contact: amastobiza@ugr.es.

Participants consent, optionally select broad demographic categories, earn virtual tokens in eight computer-generated game rounds, commit tokens in eight simulated health AI decisions, and optionally rate each system. There is no payout, identifying question, login, or completion code. The active task has a five-minute limit after consent. Reading the initial consent and network saving are outside that limit. Actual participant completion time has not yet been established in a timing pilot.

The design uses clear instructions, corrective comprehension questions, progress feedback, randomized condition order and system labels, and an explicit debrief. These choices are informed by Michael C. Frank and colleagues' *Experimentology*. This is an original exploratory study by the named researcher; there is no Stanford affiliation, endorsement, or claim of replication. See [research protocol](RESEARCH_PROTOCOL.md) and [verified references](REFERENCES.md).

## Run locally

Requires Node.js 22 or later and Python 3. No package installation is needed.

```sh
npm test
npm run test:analysis
npm run serve
```

Open the local address printed by the server. The supplied configuration starts in preview mode until the collector is configured and tested. Preview responses remain in browser memory. The site uses local assets and system fonts, without analytics or third-party client libraries.

## Google Sheets

Follow [SETUP_GOOGLE_SHEETS.md](SETUP_GOOGLE_SHEETS.md). The collector receives a final session through an HTTPS form POST and returns an acknowledgement only after storage and readback. A random session identifier deduplicates retries. The webpage never receives Google credentials or the dataset contents. Unexpected fields are rejected rather than written to the Sheet.

The connection states are explicit:

| Configuration | Behaviour |
| --- | --- |
| `collectionEnabled: false` | Local preview; no submission. |
| Enabled with a valid endpoint and `submissionMode: 'test'` | Saves researcher tests, marked separately. |
| Enabled with a valid endpoint and `submissionMode: 'live'` | Saves participant responses. |
| No acknowledgement | Shows an unconfirmed-save message and retry control. |

## GitHub Pages

For a standalone repository, upload this folder's contents, then select **Settings > Pages > Deploy from a branch > main > /docs**. The `.nojekyll` file keeps the static assets unchanged. Every asset path is relative, so the page also works inside a repository subdirectory.

For the existing `experimento` repository, this study can be served from `health-ai-trust-study/docs/` when Pages publishes the repository root. It does not replace the existing study or change its entry page. A branch or pull request alone does not publish a GitHub Pages URL.

Keep `private-setup/`, participant exports, credentials, and analysis output out of GitHub. The included `.gitignore` excludes them. The workflow in this folder's `.github/workflows/` applies when this folder is the repository root; in a larger repository it must be installed at the repository root with the appropriate working directory.

## Research records and analysis

The private collection workbook has a header-only `Sessions` tab, a data dictionary, and a Readme. Each stored row contains the complete authoritative session plus selected searchable columns. Download the `Sessions` tab as CSV and use [the local exporter](analysis/README.md) to create analysis tables. Test sessions are excluded by default.

The primary exploratory measure is mean tokens committed under fixed versus uncertain variable fees. Separate ratings measure reported trust, risk, fee difficulty, and fairness. Fees, uncertainty, outcomes, and risk preferences can all affect commitments. The protocol explains the limits of treating this behaviour as a trust proxy. No individual reinforcement-learning parameter estimation or clinical validity is claimed.

## Verification

Automated tests exercise randomization, token arithmetic, consent gating, deadline handling, withdrawal, full session progression, payload validation, duplicate handling, acknowledgement origin and iframe checks, and local CSV export. A real-browser preview has been completed through the final debrief. These checks do not establish human completion time, psychometric validity, or a working live Google deployment. See the connection guide for the current deployment verification state.
