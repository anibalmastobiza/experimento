# Pilot Data Dictionary (N=1 Proof-of-Concept)

## Dataset 1
**File:** `/Users/anibalmonasterioastobiza/Documents/New project/outputs/pilot_trial_level.csv`  
**Unit of observation:** trial (pause)  
**Rows:** 4

| Variable | Type | Allowed values | Description |
|---|---|---|---|
| `trial` | categorical | `P1`,`P2`,`P3`,`P4` | Pause identifier. |
| `condition` | categorical | `Frontier`,`Control` | Event-boundary context (`Frontier`) vs non-boundary control (`Control`). |
| `correct_informant` | categorical | `Robot`,`Caregiver` | Informant whose prediction was objectively correct at that trial. |
| `child_segment` | categorical | `New`,`Same` | Child segmentation response to “same/new” prompt. |
| `seg_correct` | logical | `TRUE`,`FALSE` | Whether segmentation response matched trial type expectation. |
| `pred_correct` | logical | `TRUE`,`FALSE` | Whether child prediction matched actual clip outcome. |
| `chosen_informant` | categorical | `Robot`,`Caregiver` | Child deference choice under caregiver-AI disagreement. |
| `hesitation` | logical | `TRUE`,`FALSE` | Whether hesitation was observed before final choice. |
| `half` | categorical | `First`,`Second` | Session half (`First`=P1-P2, `Second`=P3-P4). |
| `robot_chosen` | logical | `TRUE`,`FALSE` | Binary derivative of `chosen_informant` (`TRUE` if Robot). |

## Dataset 2
**File:** `/Users/anibalmonasterioastobiza/Documents/New project/outputs/pilot_summary_by_condition.csv`  
**Unit of observation:** condition  
**Rows:** 2

| Variable | Type | Description |
|---|---|---|
| `condition` | categorical | `Frontier` or `Control`. |
| `n_trials` | integer | Number of trials in that condition. |
| `segmentation_accuracy` | numeric [0,1] | Mean of `seg_correct` within condition. |
| `prediction_accuracy` | numeric [0,1] | Mean of `pred_correct` within condition. |
| `robot_choice_rate` | numeric [0,1] | Mean of `robot_chosen` within condition. |
| `hesitation_rate` | numeric [0,1] | Mean of `hesitation` within condition. |

## Dataset 3
**File:** `/Users/anibalmonasterioastobiza/Documents/New project/outputs/pilot_summary_by_half.csv`  
**Unit of observation:** session half  
**Rows:** 2

| Variable | Type | Description |
|---|---|---|
| `half` | categorical | `First` (P1-P2) or `Second` (P3-P4). |
| `n_trials` | integer | Number of trials in that half. |
| `segmentation_accuracy` | numeric [0,1] | Mean of `seg_correct` within half. |
| `prediction_accuracy` | numeric [0,1] | Mean of `pred_correct` within half. |
| `robot_choice_rate` | numeric [0,1] | Mean of `robot_chosen` within half. |

## Dataset 4
**File:** `/Users/anibalmonasterioastobiza/Documents/New project/outputs/pilot_effects.csv`  
**Unit of observation:** derived metric  
**Rows:** 2

| Variable | Type | Description |
|---|---|---|
| `metric` | categorical | Name of derived effect metric. |
| `value` | numeric | Metric value. Includes `Delta deference (Frontier - Control)` and `Overall robot choice`. |

## Missing Data
No missing values in this pilot dataset.

## Scope Statement
These data come from a retrospective N=1 feasibility pilot and support procedural/diagnostic conclusions only (not population-level confirmatory inference).
