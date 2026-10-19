# Health AI Decisions: research protocol

Version: 1.0. Prepared on 19 October 2026.

Researcher: Aníbal Astobiza, University of Granada (UGR). Contact: amastobiza@ugr.es. The researcher name, affiliation and contact were supplied by the commissioning researcher.

## Status and purpose

This is a newly designed, brief online pilot for adults. It combines feedback-based token earning with costly reliance on two fictional health AI systems. It is intended for a GitHub Pages frontend with a separate Google Sheets collection endpoint. It is not a validated diagnostic instrument, a clinical intervention, or a replication of a published experiment.

The methodological reference is Michael C. Frank's work at Stanford, specifically the experimental workflow in *Experimentology* [2] and the Language and Cognition Lab's open materials [4]. The present application uses explicit instructions, randomized conditions, recorded trial outcomes, a comprehension check with corrective feedback, progress information and a concise debrief. These are adaptations of general research practices. The token game and health AI manipulation were designed for this project; they have not been validated or endorsed by Frank or his laboratory, and no affiliation is claimed.

The research question is whether a predictable access fee affects participants' willingness to commit earned tokens to a simulated health AI, compared with a variable fee having the same expected value. The conceptual contribution is a pilot extension from pricing preferences to consequential choices involving a health AI label. Its novelty and generalizability have not been established by a systematic literature review.

## Source-grounded rationale

Schlereth, Skiera and Schulz analyzed choices from 779 electricity customers, combining survey and billing information. Economic antecedents were more influential than price fairness considerations. They distinguished time-invariant tariffs, static time-varying tariffs such as time-of-use pricing, and dynamic tariffs [1]. These findings motivate a pricing hypothesis; they do not establish that the same effect occurs for health AI.

Token commitment is an operational measure of behavioral reliance under monetary-style risk. It can reflect expected utility, risk preference, recent feedback, remaining tokens, or price sensitivity. It should not be interpreted as a pure or validated measure of trust. A short subjective trust item is recorded separately. The distinction between behavioral action and a theoretically specified trust construct is consistent with the conceptual issues discussed by Jacovi and colleagues [3].

## Design

Each participant experiences both fee conditions in two blocks of four trials. The block order is randomized. Neutral AI names are assigned to fee conditions independently of block order. All four name and order combinations are available with equal probability. This is randomized counterbalancing; exact equality of group counts is not forced. Both fictional systems have the same stated simulator success probability of 75%.

| Feature | Fixed fee | Variable fee |
| --- | --- | --- |
| Fee on a positive stake | 1 token | 0 or 2 tokens, each with probability 0.5 |
| Expected fee | 1 token | 1 token |
| Fee information before choice | Exact fee known | Distribution known; realized fee hidden |
| Realized fee shown | With feedback | With feedback |
| Success probability | 0.75 | 0.75 |
| Stake options | 0, 2, 4, 6 tokens | 0, 2, 4, 6 tokens |
| Fee when stake is zero | 0 tokens | 0 tokens |

The manipulation combines variation in fees and uncertainty about the current fee. A difference between conditions cannot isolate these two mechanisms. A later study could add a variable-but-disclosed condition to separate them. Equal expected fees do not imply equal realized fees for each participant.

Successes and variable fees are sampled independently. Neither exactly three successes per block nor exactly two high fees per block is promised. The implementation should retain the random seed, assignment, and generated trial schedule to allow an audit of randomization. Any seeded generator is used for reproducibility rather than security.

## Participant flow and time budget

The intended active experience is approximately 3 to 5 minutes. The application caps the task at five minutes after consent and flags timeouts. Consent reading, interruptions, and connection delays can extend elapsed time; a real participant timing pilot is required before advertising a total duration of five minutes as established fact.

| Stage | Content | Planning allowance |
| --- | --- | --- |
| Information and consent | Adult eligibility, voluntary participation, simulation, data use | 35 seconds |
| Optional demographics | Broad categories only | 20 seconds |
| Earning instructions and game | Eight symbol choices with feedback | 45 seconds |
| Delegation instructions | Stakes, return, fee, simulation and comprehension | 35 seconds |
| Two decision blocks | Eight commitments and outcome feedback | 60 seconds |
| Block ratings | Trust, risk, complexity and fairness | 30 seconds |
| Submission and debrief | Finish and submit, explanation | 15 seconds |

These are planning estimates, not observed completion times. The five-minute cutoff is an administrative rule. A timeout is recorded as incomplete, never as a zero stake on the trials that were not presented. In collection mode, the final "Finish and submit" action sends the response. A timeout also initiates submission of the completed portion, as disclosed before consent. Ratings selected on a page but not submitted before the cutoff remain missing.

## Token-earning game

The participant chooses between two abstract symbols over eight trials. One symbol has a 75% bonus probability and the other has a 25% bonus probability; the identity of the better symbol is randomized between participants. The participant receives eight guaranteed tokens per trial and an additional four tokens after a successful draw. Outcomes are shown after each choice.

After all eight trials, the token balance is between 64 and 96 tokens. The guaranteed component ensures that later willingness to commit tokens is not mechanically prevented by poor early luck. This stage creates a modest sense of earned ownership and exposure to feedback. Its psychological effect has not been validated. Eight choices provide only a very coarse descriptive measure of selection of the better symbol.

Tokens are virtual experimental points. They have no cash value, cannot be purchased, and are not a payment. The study includes no cash incentive or payout mechanism.

## Simulated health AI decisions

Participants are told that the task represents fictional health-related decisions, such as routing an invented case for further review. They supply no symptoms, medical records, diagnoses, or health history. No real patient receives an intervention and no real AI is making a clinical judgment.

On each trial the participant may keep all tokens by choosing zero, or commit 2, 4, or 6 earned tokens to the displayed fictional system. A successful simulated decision returns twice the stake. An unsuccessful decision returns none of the stake. A positive stake also incurs the condition's fee. The fee is paid regardless of success.

For stake s greater than zero, success indicator y, and realized fee f:

```text
new_balance = old_balance - s - f + 2 * s * y
expected_change = 0.5 * s - 1
```

For a zero stake, the balance is unchanged and no fee is charged. The maximum loss across eight trials is 60 tokens: four fixed-fee losses of 7 tokens and four variable-fee losses of at most 8 tokens. The minimum initial balance of 64 therefore leaves at least 4 tokens. A participant who completes all earning trials can afford every offered choice. The expected token gain of a positive stake increases with stake under the stated probabilities. Consequently, larger commitments can be explained by expected value maximization as well as confidence in the system.

The two systems share a programmed success probability. Individual participants can observe different success rates by chance. The analysis must distinguish nominal reliability from experienced feedback. Zero stakes reveal only that the participant kept their tokens, without displaying the sampled potential success or fee. The protocol is therefore a partial-feedback design: selection affects what participants observe. The generated potential success and fee remain in the trial record for auditing; they must not be treated as feedback observed by the participant.

Before the delegation trials, a two-question comprehension check asks whether a zero stake incurs a fee and when the variable fee is learned. Both answers must be correct to proceed; incorrect attempts show corrective information and permit a retry. The application records the attempt count. Participants who reach the time limit during this check provide an incomplete response.

## Measures

The proposed primary outcome is each participant's mean token stake in the fixed-fee block minus the mean token stake in the variable-fee block. The primary sample requires all four decisions in both blocks. The unit of inference is the participant.

Secondary descriptive outcomes are the proportion of positive stakes, fees actually paid, net token change, and post-block ratings. A positive stake measures adoption; its magnitude measures costly commitment conditional on the options offered. Report these separately because fee differences can make raw expenditure hard to interpret.

After each block, the application offers four optional ratings on a 1 to 7 scale, with endpoints shown. The system name in the first question is the actual name for that block:

1. Trust: "How much did you trust System A in this game?" Endpoints: 1 "Not at all"; 7 "Completely". "System B" replaces "System A" where appropriate.
2. Risk: "How risky did using this system feel?" Endpoints: 1 "Not at all risky"; 7 "Extremely risky".
3. Complexity: "How difficult was its fee to understand?" Endpoints: 1 "Very easy"; 7 "Very difficult".
4. Fairness: "How fair did its fee feel?" Endpoints: 1 "Very unfair"; 7 "Very fair".

These are custom single items. Their reliability and construct validity have not been established. Each can be left blank, and a "Clear ratings" button removes selections before the page is submitted. Exact wording and endpoint labels should remain frozen within a deployed version.

Optional demographic categories are age group, gender, education, and frequency of AI use. "Prefer not to say" is the initial value for each field and permits continuation without an answer. Age groups are 18 to 24, 25 to 34, 35 to 44, 45 to 54, 55 to 64, and 65 or older. Gender choices are woman, man, non-binary, and another gender. Education choices are secondary school or less, vocational or professional qualification, undergraduate degree, and postgraduate degree. AI use choices are never or almost never, about monthly, about weekly, and daily or almost daily. Exact age, date of birth, name, email, location, institution, free text, health information, and an external recruitment identifier are not requested. Adult eligibility is a consent checkbox. A second checkbox confirms that tokens have no cash value. There is no participant code entry or completion code.

## Hypotheses and proposed analysis

The directional pilot hypothesis is a higher mean stake under the fixed fee. Higher risk and complexity ratings under the variable fee are secondary hypotheses. These predictions are proposed extensions from the source literature. They are not established effects in this setting.

For a confirmatory collection, the proposed plan is to preregister the version, exclusions, primary contrast, stopping rule, effect size of interest, and sample size justification. No preregistration or power analysis has been completed for this package. The initial pilot is intended to assess usability, timing, missingness and correct data capture. Small pilot effects should not be used as stable estimates for powering a confirmatory study. This focus on procedure and participant understanding follows the data-collection workflow in *Experimentology* [2].

For an initial analysis, report the paired mean difference with a participant-level bootstrap confidence interval, the full distribution of within-participant differences, and results separated by randomized block order. Analyze binary adoption separately from stake magnitude. A trial-level exploratory model can include fee condition, trial, order and prior observed feedback, with participant effects. Distinguish all such exploratory models from the primary contrast.

Do not control for current bankroll in the primary total-effect analysis: previous treatment choices and outcomes contribute to that bankroll. Record it for descriptive checks and explicitly labeled sensitivity analyses. Four decisions per condition provide weak information for individual differences and make reliable individual learning-rate estimation inappropriate.

Exclude only predeclared structural invalidity from the primary comparison: absent consent, incomplete paired blocks, invalid stake values, impossible balances, or duplicate submissions of the same internal session. Keep zero stakes and unusual but valid response patterns. Do not remove participants because their answers oppose the hypothesis. Report the count and reasons for exclusions, completion rates, timeouts and missing ratings. Unobserved trials and optional missing responses remain missing.

## Data handling and participant choice

The application does not request direct identifiers. Broad demographics and behavioral records still require careful handling. An internal random session identifier permits deduplication; it is never requested from the participant or displayed as a completion code. Do not describe an identifier alone as proof of anonymity.

Store consent and protocol versions, randomized condition assignments, trial indices, choices, probabilities, outcomes, fees, balances, response durations, ratings, coarse optional demographics, completion state and the internal session identifier. Avoid analytics, third-party fonts, device fingerprinting, user-agent collection, advertising identifiers, and personal data fields. Hosting and collection providers may process ordinary connection metadata independently of the research table; consent must not promise that nobody processes an IP address.

Before submission, participants can leave or discard their responses through a confirmation screen. The five-minute timer continues on that screen. In collection mode, a failed or unconfirmed transfer is shown as unconfirmed and can be retried using the same internal session identifier. Participants receive a clear saved message only after a valid acknowledgement, without being asked for any code or personal detail. After confirmed submission, the researcher may be unable to identify a particular record for withdrawal because no identifying information or participant-held withdrawal code is collected. This limitation is explained before consent. Development preview mode displays the debrief and never sends responses to the collection endpoint.

The participant page presents the task, voluntary consent, virtual-token rules, collected data categories, withdrawal limitation and researcher contact. It does not display approval-status or retention-period fields or placeholders, as requested. No institutional approval is asserted. This protocol describes the study mechanics and does not certify institutional or legal compliance.

## Debrief and interpretation limits

Explain that the study compares predictable and variable costs while holding programmed success probability constant, and that every health AI and outcome was simulated. Clarify that token commitments are a behavioral proxy with several alternative explanations.

Principal limits are the small number of trials, health framing without clinical consequence, points without monetary payment, perceived task demand, outcome noise, bankroll carryover, and the combined variability/uncertainty manipulation. Results cannot demonstrate clinical trustworthiness, health decision quality, or real-world adoption. The effect of earned rather than endowed tokens is not identified because there is no randomized endowment control.

References [1] to [4] and their verification notes are provided in REFERENCES.md.
