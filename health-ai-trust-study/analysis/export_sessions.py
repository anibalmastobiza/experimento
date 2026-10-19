#!/usr/bin/env python3
"""Validate a local Google Sheets Sessions CSV and write descriptive CSV tables."""

import argparse
import csv
import hashlib
import json
from pathlib import Path
import re
import statistics
import sys


HEADERS = [
    'sessionId', 'receivedDateUtc', 'payloadSha256', 'schemaVersion', 'studyVersion',
    'consentVersion', 'mode', 'status', 'durationMs', 'ageBand', 'gender', 'education',
    'aiUse', 'comprehensionAttempts', 'earnedTokens', 'finalTokens', 'conditionOrder',
    'systemOrder', 'betterArm', 'seed', 'earningTrialsJson', 'delegationTrialsJson',
    'ratingsJson', 'payloadJson',
]
PAYLOAD_KEYS = [
    'schemaVersion', 'studyVersion', 'consentVersion', 'sessionId', 'seed', 'consent',
    'mode', 'status', 'durationMs', 'conditionOrder', 'systemOrder', 'betterArm',
    'demographics', 'comprehensionAttempts', 'earnedTokens', 'finalTokens',
    'earningTrials', 'delegationTrials', 'ratings',
]
EARNING_KEYS = ['trial', 'choice', 'success', 'reward', 'balanceAfter', 'rtMs']
TRIAL_KEYS = [
    'trial', 'block', 'condition', 'system', 'stake', 'potentialSuccess', 'feeDraw',
    'feeCharged', 'returned', 'balanceBefore', 'balanceAfter', 'rtMs',
]
RATING_KEYS = ['block', 'condition', 'trust', 'risk', 'complexity', 'fairness']
DEMOGRAPHICS = {
    'ageBand': ['18-24', '25-34', '35-44', '45-54', '55-64', '65+', 'prefer_not'],
    'gender': ['woman', 'man', 'nonbinary', 'another', 'prefer_not'],
    'education': ['secondary_or_less', 'vocational', 'undergraduate', 'postgraduate', 'prefer_not'],
    'aiUse': ['never', 'monthly', 'weekly', 'daily', 'prefer_not'],
}
SUMMARY_FIELDS = [
    'sessionId', 'schemaVersion', 'studyVersion', 'consentVersion', 'mode', 'status',
    'completed', 'pairedComplete', 'durationMs', 'conditionOrder', 'systemOrder',
    'betterArm', 'seed', *DEMOGRAPHICS, 'comprehensionAttempts', 'earnedTokens',
    'finalTokens', 'earningTrialCount', 'delegationTrialCount', 'ratingBlockCount',
    'earningBetterChoiceProportion',
]
for _condition in ('fixed', 'variable'):
    SUMMARY_FIELDS.extend(f'{_condition}_{name}' for name in (
        'trialCount', 'block', 'system', 'meanStake', 'positiveStakeProportion',
        'meanPositiveStake', 'feesPaid', 'netTokenChange', 'trust', 'risk',
        'complexity', 'fairness',
    ))
SUMMARY_FIELDS.append('fixedMinusVariableMeanStake')
TRIAL_FIELDS = [
    'sessionId', 'mode', 'status', 'pairedComplete', *TRIAL_KEYS,
    'positiveStake', 'netTokenChange', 'outcomeObserved', 'observedSuccess',
    'observedFeeDraw',
]
EARNING_FIELDS = ['sessionId', 'mode', 'status', 'betterArm', *EARNING_KEYS, 'choseBetterArm']


class ExportError(ValueError):
    """Malformed or inconsistent input. Messages never reproduce payload values."""


def require(test, message):
    if not test:
        raise ExportError(message)


def keys(value, expected):
    require(isinstance(value, dict) and set(value) == set(expected), 'Unexpected or missing object fields.')


def integer(value, low, high):
    require(type(value) is int and low <= value <= high, 'Invalid integer or range.')


def one_of(value, allowed):
    require(any(type(value) is type(item) and value == item for item in allowed), 'Invalid category.')


def bounded_array(value, maximum):
    require(isinstance(value, list) and len(value) <= maximum, 'Invalid array or length.')


def permutation(value, allowed):
    bounded_array(value, len(allowed))
    for item in value:
        one_of(item, allowed)
    require(sorted(value) == sorted(allowed), 'Invalid assignment order.')


def validate_payload(p):
    """Match the schema and token-accounting rules in backend/Code.gs version 1."""
    keys(p, PAYLOAD_KEYS)
    require(type(p['schemaVersion']) is int and p['schemaVersion'] == 1
            and p['studyVersion'] == '1.0.0' and p['consentVersion'] == '2026-10-19'
            and p['consent'] is True, 'Unsupported version or absent consent.')
    require(isinstance(p['sessionId'], str) and re.fullmatch(
        r'[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}',
        p['sessionId']), 'Invalid internal session identifier.')
    integer(p['seed'], 0, 4294967295)
    one_of(p['mode'], ['live', 'test'])
    one_of(p['status'], ['completed', 'timed_out'])
    for field, high in [('durationMs', 300000), ('comprehensionAttempts', 99),
                        ('earnedTokens', 96), ('finalTokens', 192)]:
        integer(p[field], 0, high)
    permutation(p['conditionOrder'], ['fixed', 'variable'])
    permutation(p['systemOrder'], ['A', 'B'])
    one_of(p['betterArm'], ['circle', 'diamond'])
    keys(p['demographics'], DEMOGRAPHICS)
    for field, allowed in DEMOGRAPHICS.items():
        one_of(p['demographics'][field], allowed)
    for field, maximum in [('earningTrials', 8), ('delegationTrials', 8), ('ratings', 2)]:
        bounded_array(p[field], maximum)
    balance = 0
    for index, trial in enumerate(p['earningTrials'], 1):
        keys(trial, EARNING_KEYS)
        integer(trial['trial'], index, index)
        require(type(trial['success']) is bool, 'Invalid success indicator.')
        one_of(trial['choice'], ['circle', 'diamond'])
        integer(trial['rtMs'], 0, 300000)
        reward = 12 if trial['success'] else 8
        integer(trial['reward'], reward, reward)
        balance += reward
        integer(trial['balanceAfter'], balance, balance)
    require(p['earnedTokens'] == balance, 'Inconsistent earned balance.')
    require(not p['delegationTrials'] or len(p['earningTrials']) == 8,
            'Delegation before all earning trials.')
    for index, trial in enumerate(p['delegationTrials']):
        keys(trial, TRIAL_KEYS)
        block = index // 4 + 1
        integer(trial['trial'], index + 1, index + 1)
        integer(trial['block'], block, block)
        require(trial['condition'] == p['conditionOrder'][block - 1]
                and trial['system'] == p['systemOrder'][block - 1], 'Inconsistent trial assignment.')
        require(type(trial['potentialSuccess']) is bool, 'Invalid potential success indicator.')
        one_of(trial['stake'], [0, 2, 4, 6])
        one_of(trial['feeDraw'], [1] if trial['condition'] == 'fixed' else [0, 2])
        integer(trial['rtMs'], 0, 300000)
        fee = trial['feeDraw'] if trial['stake'] else 0
        returned = 2 * trial['stake'] if trial['potentialSuccess'] else 0
        integer(trial['feeCharged'], fee, fee)
        integer(trial['returned'], returned, returned)
        integer(trial['balanceBefore'], balance, balance)
        require(balance >= trial['stake'] + fee, 'Unaffordable stake.')
        balance += returned - trial['stake'] - fee
        integer(trial['balanceAfter'], balance, balance)
    require(p['finalTokens'] == balance, 'Inconsistent final balance.')
    for index, rating in enumerate(p['ratings']):
        keys(rating, RATING_KEYS)
        integer(rating['block'], index + 1, index + 1)
        require(rating['condition'] == p['conditionOrder'][index]
                and len(p['delegationTrials']) >= (index + 1) * 4,
                'Rating before the end of its block.')
        for field in RATING_KEYS[2:]:
            if rating[field] is not None:
                integer(rating[field], 1, 7)
    require(p['status'] != 'completed' or (
        len(p['earningTrials']) == 8 and len(p['delegationTrials']) == 8 and len(p['ratings']) == 2
    ), 'Completed session has incomplete stages.')
    return p


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, 'Duplicate JSON object key.')
        result[key] = value
    return result


def canonical(payload):
    return json.dumps(payload, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False)


def read_sessions(path, include_test=False):
    sessions = {}
    duplicates = 0
    with Path(path).open(encoding='utf-8-sig', newline='') as source:
        reader = csv.DictReader(source)
        headers = reader.fieldnames or []
        require(len(headers) == len(set(headers)) and set(headers) <= set(HEADERS)
                and 'payloadJson' in headers, 'Unrecognized, duplicate, or missing CSV headers.')
        for row_number, row in enumerate(reader, 2):
            try:
                require(None not in row and all(value is not None for value in row.values()),
                        'CSV row has the wrong number of cells.')
                raw = row['payloadJson']
                require(len(raw) <= 18000, 'Payload exceeds the collector limit.')
                try:
                    payload = json.loads(raw, object_pairs_hook=unique_object)
                except (json.JSONDecodeError, RecursionError):
                    raise ExportError('Invalid JSON payload.') from None
                validate_payload(payload)
                normalized = canonical(payload)
                if row.get('sessionId'):
                    require(row['sessionId'] == payload['sessionId'], 'Session column disagrees with payload.')
                if row.get('payloadSha256'):
                    digest = hashlib.sha256(normalized.encode('utf-8')).hexdigest()
                    require(row['payloadSha256'] == digest, 'Payload checksum mismatch.')
                session_id = payload['sessionId']
                if session_id in sessions:
                    require(canonical(sessions[session_id]) == normalized, 'Conflicting payloads share a session identifier.')
                    duplicates += 1
                else:
                    sessions[session_id] = payload
            except ExportError as error:
                raise ExportError(f'CSV row {row_number}: {error}') from None
    excluded_test = sum(p['mode'] == 'test' for p in sessions.values()) if not include_test else 0
    included = [p for p in sessions.values() if include_test or p['mode'] == 'live']
    return included, {'duplicatesRemoved': duplicates, 'testSessionsExcluded': excluded_test}


def mean(values):
    return statistics.mean(values) if values else None


def summary_row(p):
    row = {key: p[key] for key in SUMMARY_FIELDS if key in p}
    row.update(p['demographics'])
    row.update(
        completed=p['status'] == 'completed', pairedComplete=len(p['delegationTrials']) == 8,
        conditionOrder='|'.join(p['conditionOrder']), systemOrder='|'.join(p['systemOrder']),
        earningTrialCount=len(p['earningTrials']), delegationTrialCount=len(p['delegationTrials']),
        ratingBlockCount=len(p['ratings']),
        earningBetterChoiceProportion=mean([int(t['choice'] == p['betterArm']) for t in p['earningTrials']]),
    )
    for condition in ('fixed', 'variable'):
        trials = [t for t in p['delegationTrials'] if t['condition'] == condition]
        rating = next((r for r in p['ratings'] if r['condition'] == condition), {})
        assignment = p['conditionOrder'].index(condition)
        values = dict(
            trialCount=len(trials), block=assignment + 1, system=p['systemOrder'][assignment],
            meanStake=mean([t['stake'] for t in trials]),
            positiveStakeProportion=mean([int(t['stake'] > 0) for t in trials]),
            meanPositiveStake=mean([t['stake'] for t in trials if t['stake'] > 0]),
            feesPaid=sum(t['feeCharged'] for t in trials) if trials else None,
            netTokenChange=sum(t['balanceAfter'] - t['balanceBefore'] for t in trials) if trials else None,
            **{field: rating.get(field) for field in RATING_KEYS[2:]},
        )
        row.update({f'{condition}_{key}': value for key, value in values.items()})
    row['fixedMinusVariableMeanStake'] = (
        row['fixed_meanStake'] - row['variable_meanStake'] if row['pairedComplete'] else None
    )
    return row


def trial_rows(p):
    for trial in p['delegationTrials']:
        positive = trial['stake'] > 0
        yield dict(
            sessionId=p['sessionId'], mode=p['mode'], status=p['status'],
            pairedComplete=len(p['delegationTrials']) == 8, **trial,
            positiveStake=positive, netTokenChange=trial['balanceAfter'] - trial['balanceBefore'],
            outcomeObserved=positive, observedSuccess=trial['potentialSuccess'] if positive else None,
            observedFeeDraw=trial['feeDraw'] if positive else None,
        )


def earning_rows(p):
    for trial in p['earningTrials']:
        yield dict(sessionId=p['sessionId'], mode=p['mode'], status=p['status'],
                   betterArm=p['betterArm'], **trial, choseBetterArm=trial['choice'] == p['betterArm'])


def write_table(path, fields, rows):
    with path.open('w', encoding='utf-8', newline='') as target:
        writer = csv.DictWriter(target, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: int(value) if type(value) is bool else value for key, value in row.items()})


def export(input_path, output_dir, include_test=False, include_earning=False):
    sessions, counts = read_sessions(input_path, include_test)
    output_dir = Path(output_dir)
    destinations = [output_dir / 'participant_summary.csv', output_dir / 'trials.csv']
    if include_earning:
        destinations.append(output_dir / 'earning_trials.csv')
    require(all(path.resolve() != Path(input_path).resolve() for path in destinations),
            'An output file would overwrite the input CSV.')
    output_dir.mkdir(parents=True, exist_ok=True)
    write_table(destinations[0], SUMMARY_FIELDS, (summary_row(p) for p in sessions))
    write_table(destinations[1], TRIAL_FIELDS, (row for p in sessions for row in trial_rows(p)))
    if include_earning:
        write_table(destinations[2], EARNING_FIELDS, (row for p in sessions for row in earning_rows(p)))
    return dict(sessionsExported=len(sessions), delegationTrialsExported=sum(len(p['delegationTrials']) for p in sessions), **counts)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input_csv', type=Path, help='Downloaded Sessions sheet CSV')
    parser.add_argument('--output-dir', type=Path, default=Path('analysis-output'))
    parser.add_argument('--include-test', action='store_true', help='Include mode=test sessions; excluded by default')
    parser.add_argument('--earning-trials', action='store_true', help='Also write earning_trials.csv')
    args = parser.parse_args(argv)
    try:
        counts = export(args.input_csv, args.output_dir, args.include_test, args.earning_trials)
    except (ExportError, OSError, UnicodeError, csv.Error) as error:
        print(f'Export failed: {error}', file=sys.stderr)
        return 1
    print(json.dumps(counts, sort_keys=True))
    return 0


if __name__ == '__main__':
    sys.exit(main())
