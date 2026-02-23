# Moral Intuition Topology Study — Prolific + GitHub Pages + Google Sheets

A 35-trial adaptive experiment that maps the topology of moral intuition across a 5-dimensional scenario space. Deployed as a static site on GitHub Pages, with data logged to Google Sheets via Google Apps Script.

## Architecture

```
index.html          ← Multi-screen HTML shell (consent → trials → completion)
config.js           ← Study parameters (endpoints, trial counts, algorithm tuning)
scenarios.js        ← Scenario bank: 35 moral vignettes with 5-D coordinates
adaptive.js         ← Adaptive selection engine (Latin Hypercube + boundary-seeking)
trialEngine.js      ← Trial state machine (sequencing, persistence, recovery)
app.js              ← Orchestrator (DOM wiring, logging, Prolific integration)
styles.css          ← Responsive UI styles
apps_script/Code.gs ← Google Apps Script backend for Sheets logging
```

## Five Dimensions

Each scenario maps to a point in a 5-dimensional moral space:

| Dim | Name | 0 | 1 |
|-----|------|---|---|
| D1 | Agency type | Natural event | Deliberate human action |
| D2 | Causal directness | Highly mediated | Physical / proximate |
| D3 | Number affected | 1 person | 1,000 people (log-scaled) |
| D4 | Intention clarity | Pure side-effect | Explicit goal |
| D5 | Relational proximity | Stranger | Intimate relationship |

## Trial Structure

Per participant (35 trials, ~25 minutes):
- **Trials 1–8**: Space-filling (Latin Hypercube sampling across the 5-D space)
- **Trials 9–35**: Adaptive (kernel-weighted boundary-seeking selects scenarios where moral intuitions are most uncertain)
- **Every 7th trial**: Free-text justification prompt

Per trial:
1. Read scenario vignette
2. Binary choice: "Morally Permissible" / "Morally Impermissible"
3. Confidence slider (0–100)
4. (Every 7th trial) One-sentence justification

## Setup

### 1) Deploy Google Sheets endpoint
1. Create a new Google Sheet.
2. Open `Extensions → Apps Script`.
3. Paste the contents of `apps_script/Code.gs`.
4. Click `Deploy → New deployment → Web app`.
5. Set:
   - Execute as: `Me`
   - Who has access: `Anyone`
6. Copy the Web App URL (ends with `/exec`).

### 2) Configure the website
Edit `config.js`:
- `GAS_ENDPOINT`: your Apps Script Web App URL
- `PROLIFIC_COMPLETION_URL`: `https://app.prolific.com/submissions/complete?cc=YOUR_CODE`
- Optionally adjust `TOTAL_TRIALS`, `KERNEL_BANDWIDTH`, etc.

### 3) Publish on GitHub Pages
1. Push this folder to your GitHub repository.
2. In repo settings, enable GitHub Pages.
3. Select the branch/folder where `index.html` lives.
4. Copy your final public URL.

### 4) Configure Prolific study link
Use this as your external study URL:

```
https://YOUR-USERNAME.github.io/YOUR-REPO/prolific_github_sheets/index.html?PROLIFIC_PID={{%PROLIFIC_PID%}}&STUDY_ID={{%STUDY_ID%}}&SESSION_ID={{%SESSION_ID%}}&GROUP=philosopher
```

The `GROUP` parameter should be set via Prolific's pre-screening filters:
- `GROUP=philosopher` — participants with philosophical training (≥2 ethics courses)
- `GROUP=non_philosopher` — participants without philosophical training

### 5) What gets stored in Sheets

In sheet `raw_data`, each row is one event. Per complete participant: **37 rows** (1 session_start + 35 trial_responses + 1 session_complete).

| Column | Description |
|--------|-------------|
| timestamp_server | Server-side timestamp |
| event_id | Unique event identifier |
| event | `session_start`, `trial_response`, or `session_complete` |
| timestamp_iso | Client-side ISO timestamp |
| prolific_pid | Prolific participant ID |
| study_id | Prolific study ID |
| session_id | Prolific session ID |
| group | `philosopher`, `non_philosopher`, or `unspecified` |
| trial_number | 1–35 |
| trial_type | `latin_hypercube` or `adaptive` |
| scenario_id | e.g., `S001` |
| d1–d5 | Scenario coordinates in the 5-D space |
| response | `permissible` or `impermissible` |
| confidence | 0–100 |
| justification | Free text (every 7th trial) |
| response_time_ms | Milliseconds from scenario display to "Next" click |
| responses_backup | Full JSON backup (session_complete event only) |

## Adaptive Algorithm

The adaptive engine approximates Gaussian Process boundary detection:

1. **Space-filling phase** (trials 1–8): Latin Hypercube sampling ensures broad coverage of the 5-D space before adaptation begins.
2. **Adaptive phase** (trials 9–35): For each unshown scenario, computes a kernel-weighted estimate of P(permissible) from prior responses using an RBF kernel. Scenarios where P is closest to 0.5 (moral boundary) receive the highest score, with an exploration bonus for under-sampled regions.

Parameters (tunable in `config.js`):
- `KERNEL_BANDWIDTH`: RBF kernel width (default 0.3)
- `EXPLORATION_WEIGHT`: Balance between boundary-seeking and exploration (default 0.2)

## Session Recovery

Progress is saved to `sessionStorage`. If a participant's browser crashes or refreshes mid-study, they resume from the last completed trial. The adaptive engine is deterministic given the same seed, so the same sequence is reconstructed.

## Preview Mode

Test the full 35-trial flow without Prolific by opening:
```
index.html?preview=1
```
No redirect to Prolific is triggered. Set `ALLOW_PREVIEW_WITHOUT_PROLIFIC: false` in `config.js` before production if you want strict session validation.
