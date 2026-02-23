# Who Does My Child Believe: Me or AI?
## A Home-Based Event-Boundary Paradigm for Epistemic Deference in Early Childhood

**Author:** Anibal M. Astobiza  
**Affiliation:** University of Granada

### Abstract
Children are increasingly exposed to generative artificial intelligence (AI) systems during early development, yet little is known about how this affects selective trust when children interpret uncertain events. This study introduces a home-based event-boundary paradigm designed to test epistemic deference in a child-caregiver-AI triadic context. A 3-year-old child and caregiver viewed a 2:04 clip from *Bluey* with four predefined pauses: two event-boundary trials and two control trials. At each pause, the child completed three tasks: event segmentation ("same/new"), narrative prediction, and deference choice under caregiver-AI disagreement. Informant accuracy was counterbalanced by design (AI correct in boundaries; caregiver correct in controls; both 2/4 total), isolating contextual uncertainty from accumulated reliability. As a proof-of-concept pilot (N = 1), the study aimed to establish feasibility and refine mechanism-level hypotheses rather than estimate population effects. The protocol was fully executable and produced complete trial-level data. Overall robot choice was 3/4, but robot deference was lower at boundaries (0.50) than controls (1.00). Segmentation and prediction were perfect in the first half and null in the second half, suggesting attentional or fatigue effects. The pilot does not confirm the original directional hypothesis; instead, it supports a refined model in which deference reflects interactions among novelty bias, recent reliability, and subjective boundary detection. Findings justify a preregistered, adequately powered confirmatory study.

**Keywords:** selective trust, early childhood, event boundaries, artificial intelligence, cognitive offloading, pilot study

## Introduction
Young children calibrate trust by combining familiarity cues and informant reliability (Harris & Corriveau, 2011; Koenig & Harris, 2005). In contemporary digital ecologies, children also encounter AI-generated predictions in daily contexts. This creates a new developmental question: under uncertainty, does a child prioritize the familiar caregiver or an artificial informant?

Event-segmentation research indicates that narrative boundaries increase prediction error and model updating demands (Zacks et al., 2007). These moments may function as periods of heightened epistemic openness. The present paradigm operationalizes this idea by testing deference under controlled caregiver-AI disagreement at boundary versus control moments.

A key methodological challenge is separating contextual uncertainty effects from simple reliability learning. If one informant is always more accurate, deference may reflect cumulative reinforcement rather than boundary sensitivity. To address this, the paradigm counterbalances accuracy by condition: AI is correct at boundaries, caregiver is correct at controls, and both end with identical global accuracy (2/4 each).

The original hypothesis predicted higher AI deference at event boundaries. However, because this is an initial proof-of-concept pilot, the primary goals were:  
1. To evaluate operational feasibility in a home setting with a 3-year-old.  
2. To test whether the measurement system yields interpretable behavioral variance.  
3. To identify design-level threats and refine the theoretical model before confirmatory scaling.

## Method
### Design
This was a single-case proof-of-concept pilot using a within-session repeated-measures structure (4 trials: P1-P4). The inferential target was feasibility and mechanism discovery, not population-level hypothesis testing.

### Participant and Setting
One child (3 years old) participated with a caregiver in a domestic setting. The protocol was administered using a mobile device and physical response cards.

### Materials and Stimulus
The stimulus was *Bluey* S1E1 ("Magic Xylophone"; 2:04). Four pause points were pre-specified:
1. P1 Boundary (~0:25), AI-correct trial.  
2. P2 Control (~0:50), caregiver-correct trial.  
3. P3 Boundary (~1:15), AI-correct trial.  
4. P4 Control (~1:35), caregiver-correct trial.

### Procedure
At each pause, the same three-step micro-protocol was administered:
1. **Segmentation:** "Is it the same or is something new happening?"  
2. **Prediction:** forced choice between two possible next events.  
3. **Deference:** caregiver and AI offered opposing predictions; child selected who to follow.

After each response, playback resumed for approximately 10-15 seconds so the child could observe the true outcome.

### Measures
Primary construct:
- **Boundary deference effect:**  
  Delta_deference = P(robot | boundary) - P(robot | control)

Secondary measures:
- Segmentation accuracy by condition and session half.
- Prediction accuracy by condition and session half.
- Deference rate by condition.
- Hesitation (yes/no) as a conflict marker.

### Analytic Strategy
Given N = 1 and four trials, analyses were descriptive and case-based:
1. Trial-level trajectory analysis.
2. Condition-level proportions.
3. First-half versus second-half temporal profile.
4. Exact binomial 95% confidence intervals for observed proportions.

No confirmatory inferential claims were made.

## Results
### Feasibility and Data Capture
The full protocol was completed (4/4 trials). All planned variables were captured without missing values. The counterbalanced accuracy manipulation was successfully implemented.

### Trial-Level Pattern
Deference sequence across trials was: Robot (P1), Robot (P2), Caregiver (P3), Robot (P4). Hesitation occurred only in P1.

### Condition-Level Outcomes
- Overall robot choice: 3/4 = 0.75, 95% CI [0.194, 0.994].  
- Robot choice at boundaries: 1/2 = 0.50, 95% CI [0.013, 0.987].  
- Robot choice at controls: 2/2 = 1.00, 95% CI [0.158, 1.000].  
- Boundary deference effect (Delta_deference): -0.50.

### Temporal Profile
- Segmentation accuracy, first half (P1-P2): 2/2 = 1.00, 95% CI [0.158, 1.000].  
- Segmentation accuracy, second half (P3-P4): 0/2 = 0.00, 95% CI [0.000, 0.842].  
- Prediction accuracy, first half: 2/2 = 1.00, 95% CI [0.158, 1.000].  
- Prediction accuracy, second half: 0/2 = 0.00, 95% CI [0.000, 0.842].

This complete first-half to second-half collapse is consistent with a fatigue/disengagement threat in a four-pause sequence for this age group.

## Discussion
### Summary
The pilot did not support the original directional hypothesis (greater AI deference at boundaries). Nonetheless, it generated highly diagnostic information for theory and design refinement.

### Mechanistic Interpretation
Four patterns are notable:
1. A strong baseline robot preference (3/4 choices).  
2. Local caregiver selection in P3 after recent robot error (possible recency weighting).  
3. Abrupt second-half decline in segmentation/prediction (attention/fatigue contamination).  
4. Hesitation only at first boundary exposure (possible heightened epistemic conflict).

Together, these findings are more compatible with a refined model in which deference depends on interactions among novelty salience, short-horizon reliability memory, and subjective detection of boundary uncertainty.

### Why an N = 1 Pilot Is Scientifically Valid Here
This study claims **procedural and diagnostic validity**, not population validity.

What is validly supported:
1. **Operational validity:** the paradigm is executable end-to-end in natural home conditions.  
2. **Measurement validity (procedural):** all outcome channels can be captured at trial resolution.  
3. **Manipulation validity:** counterbalanced informant accuracy can be implemented as designed.  
4. **Mechanism discovery value:** trial-level structure reveals confounds (fatigue, novelty, recency) that are essential for designing a valid confirmatory study.

What is explicitly not claimed:
1. No population effect estimate.  
2. No confirmatory test of the original hypothesis.  
3. No stable effect-size inference.

This is the standard logic of proof-of-concept work: first establish that the paradigm functions and identify dominant nuisance processes, then proceed to preregistered, powered confirmation.

### Limitations
1. Single participant, no external generalizability.  
2. Fixed within-session order can induce confounding by fatigue and recency.  
3. Hesitation was binary; latency was not quantified continuously.

### Confirmatory Next Step
A scaled design should include:
1. Between-subjects structure with two pauses per child (one boundary, one control).  
2. Brief pre-task familiarization with the robot to attenuate novelty bias.  
3. Continuous latency coding plus deference choice.  
4. Preregistered hypotheses and analysis plan.  
5. Target sample near the previously projected N ~ 130 (about 65 per condition), depending on final primary endpoint.

## Conclusion
As a proof-of-concept pilot, this N = 1 study is scientifically valid within a bounded scope: it establishes feasibility, validates core manipulations, and improves theoretical specification for confirmatory testing. The central contribution is not a population claim; it is a rigorously constrained transition from exploratory mechanism discovery to a cleaner, testable next-stage design.

## Data Availability Statement
All pilot outputs generated for this manuscript are available locally:
- `/Users/anibalmonasterioastobiza/Documents/New project/outputs/pilot_trial_level.csv`
- `/Users/anibalmonasterioastobiza/Documents/New project/outputs/pilot_summary_by_condition.csv`
- `/Users/anibalmonasterioastobiza/Documents/New project/outputs/pilot_summary_by_half.csv`
- `/Users/anibalmonasterioastobiza/Documents/New project/outputs/pilot_effects.csv`

## Figure Captions
**Figure 1.** Trial-level response pattern across P1-P4 (deference choice, segmentation/prediction correctness, hesitation marker).  
File: `/Users/anibalmonasterioastobiza/Documents/New project/outputs/figure_1_trial_pattern.png`

**Figure 2.** Condition-level outcomes (frontier vs. control): segmentation accuracy, prediction accuracy, and robot choice rate.  
File: `/Users/anibalmonasterioastobiza/Documents/New project/outputs/figure_2_condition_metrics.png`

**Figure 3.** Temporal profile by session half (P1-P2 vs. P3-P4) for segmentation and prediction accuracy.  
File: `/Users/anibalmonasterioastobiza/Documents/New project/outputs/figure_3_temporal_drop.png`

## References
Corriveau, K. H., & Harris, P. L. (2009). Choosing your informant: Weighing familiarity and recent accuracy. *Cognitive Development, 24*(4), 411-422.

Fan, Y., Tang, L., Le, H., Shen, K., Tan, S., Zhao, Y., ... & Gasevic, D. (2025). Beware of metacognitive laziness: Effects of generative artificial intelligence on learning motivation, processes, and performance. *British Journal of Educational Technology, 56*(2), 489-530. https://doi.org/10.1111/bjet.13544

Harris, P. L., & Corriveau, K. H. (2011). Young children's selective trust in informants. *Philosophical Transactions of the Royal Society B: Biological Sciences, 366*(1567), 1179-1187. https://doi.org/10.1098/rstb.2010.0321

Kahn, P. H., Jr., Kanda, T., Ishiguro, H., Gill, B. T., Ruckert, J. H., Shen, S., ... & Severson, R. L. (2012). "Robovie, you'll have to go into the closet now": Children's social and moral relationships with a humanoid robot. *Developmental Psychology, 48*(2), 303-314.

Koenig, M. A., & Harris, P. L. (2005). Preschoolers mistrust ignorant and inaccurate speakers. *Child Development, 76*(6), 1261-1277. https://doi.org/10.1111/j.1467-8624.2005.00849.x

Tomasello, M., Carpenter, M., Call, J., Behne, T., & Moll, H. (2005). Understanding and sharing intentions: The origins of cultural cognition. *Behavioral and Brain Sciences, 28*(5), 675-735. https://doi.org/10.1017/S0140525X05000129

Zacks, J. M., Speer, N. K., Swallow, K. M., Braver, T. S., & Reynolds, J. R. (2007). Event perception: A mind-brain perspective. *Psychological Bulletin, 133*(2), 273-293. https://doi.org/10.1037/0033-2909.133.2.273
