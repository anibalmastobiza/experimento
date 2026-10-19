# Local CSV export

The Python 3 standard-library utility reads a locally downloaded Google Sheets `Sessions` CSV. It does not contact Google, upload data, calculate significance tests, or fit a causal model. Export the `Sessions` tab as CSV from the researcher's private spreadsheet after collection.

Run from the repository directory:

```sh
python3 analysis/export_sessions.py /private/path/Sessions.csv --output-dir /private/path/analysis-output
```

Use `--earning-trials` to also write `earning_trials.csv`. Test-mode records are excluded by default. For synthetic pilot checks only, add `--include-test`. Existing output CSVs with the same names are overwritten. Keep input and output data outside the public GitHub repository and GitHub Pages directory.

```sh
python3 -m unittest discover -s analysis -p 'test_*.py' -v
```

The command prints the numbers of sessions and delegation trials exported, duplicate records removed, and unique test-mode sessions excluded. All input rows are validated before output files are created. A malformed record stops the export with its CSV row number; the utility does not silently discard invalid records. An I/O failure during writing can leave a partial output file, so a successful exit is required before using results.

## Input validation

`payloadJson` is the authoritative source. UTF-8 CSVs with or without a byte order mark are accepted. CSV column names must belong to the collector's known header list; `payloadJson` is required. When present and nonempty, `sessionId` and `payloadSha256` are checked against the payload. Other convenience columns in the sheet are ignored, so editing them cannot alter the exported response.

The validator checks the exact version 1 payload fields and categorical values, affirmative consent, internal identifier format, assignment order, trial count and sequence, allowed stakes, fees, token accounting, rating ranges, and completion consistency. Unexpected object fields, including added personal information fields, are rejected. It does not verify consent authenticity, rule out repeat participation under different random identifiers, or independently regenerate the random schedule from the seed.

Repeated session identifiers with semantically identical payloads are deduplicated, even if JSON object keys have a different order. Conflicting payloads under the same identifier stop the export. Test-mode records are validated before exclusion. Update this utility together with the collector if the schema or version changes.

## Output interpretation

`participant_summary.csv` has one row per retained internal session. It includes optional demographic categories, assignment, timing, token balances, completion flags, observed trial counts, per-condition mean stakes, positive-stake proportions, mean stake among positive stakes, paid fees, net token change, and optional block ratings. `earningBetterChoiceProportion` is the fraction of completed earning choices selecting the higher-probability symbol.

`completed` records whether the application reported the entire flow complete. `pairedComplete` records whether all eight delegation choices are present, with four in each condition. A session that times out after both blocks but before the last rating can have `pairedComplete=1` and `completed=0`. The proposed primary contrast, `fixedMinusVariableMeanStake`, is computed only when `pairedComplete=1`. The utility retains incomplete sessions for reporting completion and missingness.

Per-condition means for incomplete blocks use only observed choices and are descriptive. Blank values indicate missing or undefined quantities, including optional ratings, means with no observed choices, and mean positive stake when no positive stake occurred. An unpresented trial is never imputed as a zero stake. `prefer_not` is the recorded demographic category for a skipped answer, not a missing numeric value. Boolean fields are exported as 1 or 0.

`trials.csv` has one row per observed delegation choice. `potentialSuccess` and `feeDraw` preserve generated simulator values for auditing. For a zero stake, those potential outcomes were not shown to the participant: `outcomeObserved=0`, while `observedSuccess` and `observedFeeDraw` are blank. Any learning or feedback analysis must respect this distinction. `netTokenChange` equals `balanceAfter - balanceBefore`.

The optional `earning_trials.csv` contains each observed earning choice and its feedback, together with the assigned better symbol and `choseBetterArm` indicator.

These tables prepare the measures specified in [the research protocol](../RESEARCH_PROTOCOL.md). They do not establish that token commitment is a validated measure of trust, isolate risk preference from trust, or demonstrate effects on real health decisions. No confidence interval, statistical test, power analysis, or causal conclusion is produced. Analyze participant-level paired contrasts under the planned protocol and report incomplete sessions, missingness, and exclusions.
