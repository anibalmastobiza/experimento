# Who Does My Child Believe: Me or AI?
## A Home-Based Event-Boundary Paradigm for Epistemic Deference in Early Childhood (Proof-of-Concept Pilot)

### Abstract
Early exposure to generative AI raises a developmental question: when preschool children face uncertainty, do they trust a familiar caregiver or an artificial informant? We implemented a home-based, 5-minute paradigm using a 2:04-minute clip from *Bluey* with four predefined pauses: two event-boundary trials (high narrative uncertainty) and two control trials (low uncertainty). At each pause, the child completed three tasks: segmentation ("same" vs. "new"), prediction, and deference under caregiver-AI disagreement. Informant accuracy was counterbalanced by design (AI correct in boundary trials; caregiver correct in control trials; both 2/4 total) to isolate contextual effects from cumulative accuracy learning. This manuscript reports a proof-of-concept pilot (N=1; age 3 years) aimed at testing operational feasibility, measurement behavior, and theory refinement, not population inference. The protocol was fully executable, all trial-level outcomes were captured, and theoretically informative patterns emerged: overall robot choice 3/4, robot deference was lower at boundaries (0.50) than controls (1.00), and segmentation/prediction dropped from 1.00 in the first half to 0.00 in the second half. The pilot does not confirm the original directional hypothesis, but it provides valid feasibility evidence and identifies mechanism-level refinements (subjective boundary detection, novelty bias, recency effects, and fatigue). These outputs justify progression to a pre-registered, adequately powered confirmatory study.

### 1. Introduction
Children's selective trust is shaped by familiarity and informant reliability. In AI-rich environments, a third informant enters the epistemic ecology of the family: an artificial agent that can appear authoritative, novel, and interactive. The key developmental question is not only whether children defer to AI, but under what cognitive conditions deference changes.

Event-segmentation theory predicts that narrative boundaries increase prediction error and model updating demands. We therefore tested whether deference to AI is modulated by event boundaries versus control moments in a naturalistic story context.

The paradigm uses three linked behavioral readouts per pause:
1. Segmentation sensitivity ("same/new")
2. Predictive accuracy
3. Deference choice (caregiver vs. AI)

The original hypothesis was that deference to AI would increase at event boundaries. A critical design feature was counterbalanced informant accuracy: AI correct in P1/P3 (boundaries), caregiver correct in P2/P4 (controls), yielding equal global accuracy (2/4 each). This eliminates a simple "follow the more accurate source" confound and strengthens internal interpretability of any boundary effect.

### 2. Methods
#### 2.1 Design and purpose
Single-case proof-of-concept pilot, within-session repeated measures (4 pauses). The pilot objective was feasibility and mechanism discovery, not confirmatory hypothesis testing.

#### 2.2 Participant and setting
One child (3 years old), home setting, caregiver present throughout, mobile-video administration.

#### 2.3 Stimulus and trial structure
Stimulus: *Bluey* S1E1 ("Magic Xylophone"), 2:04.
Pauses:
1. P1 Boundary (~0:25), AI correct
2. P2 Control (~0:50), caregiver correct
3. P3 Boundary (~1:15), AI correct
4. P4 Control (~1:35), caregiver correct

At each pause, the same sequence was administered:
1. Segmentation question ("same/new")
2. Two-option prediction
3. Deference question under caregiver-AI disagreement
Then the video resumed for 10-15 seconds to provide outcome feedback.

#### 2.4 Measures
Primary constructed metric:
- Boundary deference effect: Delta_deference = P(robot | boundary) - P(robot | control)

Other outcomes:
- Segmentation accuracy by condition and by session half
- Prediction accuracy by condition and by session half
- Hesitation (yes/no), as a conflict marker

#### 2.5 Analytic strategy
Given N=1 and 4 trials, analyses were descriptive:
1. Trial-level pattern analysis
2. Condition-level proportions
3. Temporal (first-half vs second-half) degradation check
4. Exact binomial 95% confidence intervals for proportions

No inferential population claims were attempted.

### 3. Results
#### 3.1 Feasibility and data completeness
- Full protocol completion: yes (4/4 pauses)
- Full data capture across all outcomes: yes
- Counterbalanced informant-accuracy manipulation executed as planned: yes

#### 3.2 Trial-level outcomes
Pattern by trial: Robot, Robot, Caregiver, Robot.
Hesitation occurred once (P1), absent in P2-P4.

#### 3.3 Condition-level outcomes
- Robot choice overall: 3/4 = 0.75 (95% CI [0.194, 0.994])
- Robot choice at boundaries: 1/2 = 0.50 (95% CI [0.013, 0.987])
- Robot choice at controls: 2/2 = 1.00 (95% CI [0.158, 1.000])
- Delta_deference (boundary - control): -0.50

#### 3.4 Temporal profile
- Segmentation accuracy first half (P1-P2): 2/2 = 1.00 (95% CI [0.158, 1.000])
- Segmentation accuracy second half (P3-P4): 0/2 = 0.00 (95% CI [0.000, 0.842])
- Prediction accuracy first half: 2/2 = 1.00 (95% CI [0.158, 1.000])
- Prediction accuracy second half: 0/2 = 0.00 (95% CI [0.000, 0.842])

Interpretation of the time split is compatible with attention/fatigue effects that can mask or distort condition contrasts in very short repeated protocols with preschoolers.

### 4. Discussion
#### 4.1 Substantive interpretation
This pilot does not support the original directional prediction (higher AI deference at boundaries). However, it produced theory-relevant structure:
1. A strong baseline attraction to the robot (3/4 choices)
2. A localized caregiver choice at P3 after recent robot failure (possible recency weighting)
3. A sharp second-half performance drop consistent with fatigue or disengagement
4. A unique hesitation event at P1, consistent with high epistemic conflict during first boundary exposure

Together, the data suggest a refined mechanism: deference may depend less on objective boundary status and more on subjective boundary detection, novelty salience, and immediate reliability memory under attentional constraints.

#### 4.2 Scientific validity of a single-case proof-of-concept
The validity claim here is narrow and rigorous: this pilot is valid for feasibility and mechanism refinement, not for population effect estimation.

What is validly established:
1. Operational validity: the paradigm can be implemented end-to-end in a domestic setting with a 3-year-old.
2. Measurement validity (procedural): all three behavioral channels and hesitation coding can be obtained trial-by-trial.
3. Manipulation validity: informant-accuracy counterbalancing can be executed in practice.
4. Internal diagnostic value: trial-level trajectories reveal concrete failure modes (fatigue/order effects) and mechanism candidates that would remain hidden in aggregate-only reporting.

What is not claimed:
1. No generalizable prevalence estimates.
2. No confirmatory support for the original hypothesis.
3. No stable effect-size estimation.

This "small data" logic is scientifically defensible because proof-of-concept research answers a different question than confirmatory research:
- Pilot question: "Does the design work, and what mechanisms/failure modes appear?"
- Confirmatory question: "What is the population-level effect and uncertainty under pre-registered inference?"

A methodologically rigorous workflow is therefore:
1. Use N=1 to test protocol executability, measure behavior, and confound discovery.
2. Revise design before scale-up.
3. Run an adequately powered confirmatory study for causal/general claims.

#### 4.3 Threats to validity and mitigation
Main threats observed:
1. Fatigue/order contamination across four consecutive pauses.
2. Novelty dominance of the robot.
3. Potential recency bias after informant error.

Pre-specified mitigation for v2:
1. Two-pause between-subjects design (one boundary, one control per child).
2. Brief robot familiarization phase before testing.
3. Latency and video-coded conflict indices as primary/secondary outcomes.
4. Pre-registered analysis plan and progression criteria.

#### 4.4 Next confirmatory step
Progression target from your presentation: N approximately 130 (about 65 per condition), with binary choice plus continuous latency outcomes, to separate boundary effects from novelty and recency under sufficient power.

### 5. Conclusion
This N=1 study should be interpreted as a proof-of-concept pilot with high procedural value and bounded inferential scope. Its scientific contribution is not a population claim; it is the production of a testable, better-specified model and a cleaner next-stage design. In that sense, the pilot is valid, informative, and necessary for rigorous empirical progression.

---

## Figures and Data (generated in R)
- Trial-level pattern: `/Users/anibalmonasterioastobiza/Documents/New project/outputs/figure_1_trial_pattern.png`
- Condition metrics: `/Users/anibalmonasterioastobiza/Documents/New project/outputs/figure_2_condition_metrics.png`
- Temporal drop: `/Users/anibalmonasterioastobiza/Documents/New project/outputs/figure_3_temporal_drop.png`
- Trial-level dataset: `/Users/anibalmonasterioastobiza/Documents/New project/outputs/pilot_trial_level.csv`
- Condition summary: `/Users/anibalmonasterioastobiza/Documents/New project/outputs/pilot_summary_by_condition.csv`
- Temporal summary: `/Users/anibalmonasterioastobiza/Documents/New project/outputs/pilot_summary_by_half.csv`
