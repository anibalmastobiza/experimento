"""Synthetic, local-only tests for the CSV export utility."""

import copy
import csv
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

import export_sessions as exporter


def fixture(session_id='11111111-2222-4333-8444-555555555555', mode='live'):
    p = dict(
        schemaVersion=1, studyVersion='1.0.0', consentVersion='2026-10-19',
        sessionId=session_id, seed=123456, consent=True, mode=mode,
        status='completed', durationMs=140000, conditionOrder=['fixed', 'variable'],
        systemOrder=['B', 'A'], betterArm='circle',
        demographics={key: 'prefer_not' for key in exporter.DEMOGRAPHICS},
        comprehensionAttempts=1, earnedTokens=0, finalTokens=0,
        earningTrials=[], delegationTrials=[], ratings=[],
    )
    balance = 0
    for index in range(8):
        success = index % 2 == 0
        reward = 12 if success else 8
        balance += reward
        p['earningTrials'].append(dict(trial=index + 1, choice='circle' if success else 'diamond',
                                      success=success, reward=reward, balanceAfter=balance, rtMs=3000))
    p['earnedTokens'] = balance
    for index in range(8):
        block = index // 4 + 1
        condition = p['conditionOrder'][block - 1]
        stake = [0, 2, 4, 6, 2, 2, 2, 2][index]
        fee_draw = 1 if condition == 'fixed' else (index % 2) * 2
        fee = fee_draw if stake else 0
        success = index % 2 == 0
        returned = 2 * stake if success else 0
        after = balance - stake - fee + returned
        p['delegationTrials'].append(dict(
            trial=index + 1, block=block, condition=condition, system=p['systemOrder'][block - 1],
            stake=stake, potentialSuccess=success, feeDraw=fee_draw, feeCharged=fee,
            returned=returned, balanceBefore=balance, balanceAfter=after, rtMs=4000,
        ))
        balance = after
    p['finalTokens'] = balance
    p['ratings'] = [dict(block=i + 1, condition=condition, trust=5, risk=3, complexity=2, fairness=None)
                    for i, condition in enumerate(p['conditionOrder'])]
    return p


class ExportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.input = self.root / 'Sessions.csv'

    def write_input(self, payloads, bom=False, headers=None, digest=False):
        fields = headers or ['sessionId', 'payloadJson']
        if digest:
            fields = ['sessionId', 'payloadSha256', 'payloadJson']
        with self.input.open('w', encoding='utf-8-sig' if bom else 'utf-8', newline='') as target:
            writer = csv.DictWriter(target, fieldnames=fields)
            writer.writeheader()
            for payload in payloads:
                row = dict(sessionId=payload['sessionId'], payloadJson=json.dumps(payload))
                if digest:
                    row['payloadSha256'] = hashlib.sha256(exporter.canonical(payload).encode()).hexdigest()
                writer.writerow(row)

    def test_bom_export_means_ratings_and_partial_feedback(self):
        self.write_input([fixture()], bom=True, digest=True)
        output = self.root / 'output'
        counts = exporter.export(self.input, output, include_earning=True)
        self.assertEqual(counts['sessionsExported'], 1)
        with (output / 'participant_summary.csv').open(newline='') as source:
            rows = list(csv.DictReader(source))
        self.assertEqual(len(rows), 1)
        row = rows[0]
        self.assertEqual(row['pairedComplete'], '1')
        self.assertEqual(float(row['fixed_meanStake']), 3)
        self.assertEqual(float(row['variable_meanStake']), 2)
        self.assertEqual(float(row['fixedMinusVariableMeanStake']), 1)
        self.assertEqual(float(row['fixed_positiveStakeProportion']), .75)
        self.assertEqual(float(row['fixed_meanPositiveStake']), 4)
        self.assertEqual(row['fixed_fairness'], '')
        self.assertEqual(row['fixed_system'], 'B')
        with (output / 'trials.csv').open(newline='') as source:
            trials = list(csv.DictReader(source))
        self.assertEqual(len(trials), 8)
        self.assertEqual(trials[0]['potentialSuccess'], '1')
        self.assertEqual(trials[0]['outcomeObserved'], '0')
        self.assertEqual(trials[0]['observedSuccess'], '')
        self.assertEqual(trials[0]['observedFeeDraw'], '')
        self.assertEqual(trials[1]['observedSuccess'], '0')
        self.assertTrue((output / 'earning_trials.csv').exists())

    def test_test_mode_excluded_by_default_and_opt_in(self):
        self.write_input([fixture(mode='test')])
        sessions, counts = exporter.read_sessions(self.input)
        self.assertEqual(sessions, [])
        self.assertEqual(counts['testSessionsExcluded'], 1)
        sessions, counts = exporter.read_sessions(self.input, include_test=True)
        self.assertEqual(len(sessions), 1)
        self.assertEqual(counts['testSessionsExcluded'], 0)

    def test_semantic_duplicate_deduplication(self):
        p = fixture()
        reordered = dict(reversed(list(p.items())))
        self.write_input([p, reordered])
        sessions, counts = exporter.read_sessions(self.input)
        self.assertEqual(len(sessions), 1)
        self.assertEqual(counts['duplicatesRemoved'], 1)

    def test_conflicting_duplicate_rejected_before_any_output(self):
        p = fixture()
        changed = copy.deepcopy(p)
        changed['durationMs'] += 1
        self.write_input([p, changed])
        output = self.root / 'output'
        with self.assertRaisesRegex(exporter.ExportError, 'CSV row 3: Conflicting'):
            exporter.export(self.input, output)
        self.assertFalse(output.exists())

    def test_timeout_partial_means_without_paired_contrast(self):
        p = fixture()
        p.update(status='timed_out', durationMs=300000)
        p['delegationTrials'] = p['delegationTrials'][:5]
        p['ratings'] = p['ratings'][:1]
        p['finalTokens'] = p['delegationTrials'][-1]['balanceAfter']
        exporter.validate_payload(p)
        row = exporter.summary_row(p)
        self.assertFalse(row['completed'])
        self.assertFalse(row['pairedComplete'])
        self.assertEqual(row['variable_trialCount'], 1)
        self.assertIsNone(row['fixedMinusVariableMeanStake'])
        self.assertIsNone(row['variable_trust'])

    def test_timeout_after_full_blocks_retains_paired_eligibility(self):
        p = fixture()
        p.update(status='timed_out', durationMs=300000, ratings=p['ratings'][:1])
        exporter.validate_payload(p)
        row = exporter.summary_row(p)
        self.assertTrue(row['pairedComplete'])
        self.assertFalse(row['completed'])
        self.assertEqual(row['fixedMinusVariableMeanStake'], 1)

    def test_early_timeout_does_not_impute_zeros(self):
        p = fixture()
        p.update(status='timed_out', durationMs=300000, earningTrials=[],
                 earnedTokens=0, finalTokens=0, delegationTrials=[], ratings=[])
        exporter.validate_payload(p)
        row = exporter.summary_row(p)
        self.assertEqual(row['fixed_trialCount'], 0)
        self.assertIsNone(row['fixed_meanStake'])
        self.assertIsNone(row['fixed_feesPaid'])
        self.assertIsNone(row['earningBetterChoiceProportion'])

    def test_unknown_personal_fields_rejected_at_all_levels(self):
        for location in ('root', 'demographics', 'earning', 'delegation', 'ratings'):
            with self.subTest(location=location):
                p = fixture()
                target = {'root': p, 'demographics': p['demographics'],
                          'earning': p['earningTrials'][0], 'delegation': p['delegationTrials'][0],
                          'ratings': p['ratings'][0]}[location]
                target['email'] = 'synthetic@example.invalid'
                self.write_input([p])
                with self.assertRaisesRegex(exporter.ExportError, 'Unexpected or missing') as caught:
                    exporter.read_sessions(self.input)
                self.assertNotIn('synthetic@example.invalid', str(caught.exception))

    def test_unknown_csv_header_rejected(self):
        self.input.write_text('payloadJson,email\n', encoding='utf-8')
        with self.assertRaisesRegex(exporter.ExportError, 'CSV headers'):
            exporter.read_sessions(self.input)

    def test_invalid_balances_missing_consent_and_boolean_numbers_rejected(self):
        for change in ('balance', 'consent', 'boolean'):
            with self.subTest(change=change):
                p = fixture()
                if change == 'balance':
                    p['delegationTrials'][0]['balanceAfter'] += 1
                elif change == 'consent':
                    p['consent'] = False
                else:
                    p['delegationTrials'][0]['feeDraw'] = True
                self.write_input([p])
                with self.assertRaises(exporter.ExportError):
                    exporter.read_sessions(self.input)

    def test_duplicate_json_keys_rejected(self):
        raw = json.dumps(fixture()).replace('"schemaVersion": 1', '"schemaVersion": 1, "schemaVersion": 1')
        with self.input.open('w', newline='') as target:
            writer = csv.writer(target)
            writer.writerow(['payloadJson'])
            writer.writerow([raw])
        with self.assertRaisesRegex(exporter.ExportError, 'Duplicate JSON'):
            exporter.read_sessions(self.input)

    def test_mismatched_checksum_rejected(self):
        self.write_input([fixture()], digest=True)
        text = self.input.read_text()
        digest = hashlib.sha256(exporter.canonical(fixture()).encode()).hexdigest()
        self.input.write_text(text.replace(digest, '0' * 64))
        with self.assertRaisesRegex(exporter.ExportError, 'checksum mismatch'):
            exporter.read_sessions(self.input)

    def test_empty_export_has_headers_and_optional_file_is_opt_in(self):
        self.write_input([])
        output = self.root / 'output'
        exporter.export(self.input, output)
        self.assertTrue((output / 'participant_summary.csv').read_text().startswith('sessionId,'))
        self.assertTrue((output / 'trials.csv').read_text().startswith('sessionId,'))
        self.assertFalse((output / 'earning_trials.csv').exists())


if __name__ == '__main__':
    unittest.main()
