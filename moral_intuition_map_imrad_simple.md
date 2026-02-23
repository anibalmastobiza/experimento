# Mapping Moral Intuition: Generative AI and Bayesian Adaptive Design

## Abstract
Experimental philosophy has generated important insights, but it still samples moral intuitions through isolated vignettes. That approach cannot tell us whether classic effects are general patterns or local artifacts. We propose a simpler and more scalable method: use large language models to generate a broad, controlled set of dilemmas, then use Bayesian adaptive design to sample the most informative cases.

In Phase 1, an LLM creates 1,500 candidate dilemmas by varying five dimensions: agency type, causal directness, number affected, intention clarity, and relational proximity. A panel of six moral philosophers validates dimensional fidelity and realism, producing a final set of about 400 scenarios. In Phase 2, 120 participants complete 35 trials each (8 space-filling, 27 adaptive). A Gaussian Process model updates after each response and selects new scenarios near uncertainty zones where judgments are likely to switch. In Phase 3, we estimate a continuous moral-intuition map across the five-dimensional space, with uncertainty bands and boundary detection.

The project offers a clear contribution: it shifts experimental philosophy from pointwise hypothesis testing to structured discovery. Substantively, it identifies where moral judgments are stable, where they flip, and whether philosophical training changes those boundaries.

## Keywords
moral intuition mapping; Bayesian adaptive design; generative AI; experimental philosophy; Gaussian Process models; moral judgment

## Index (IMRaD)
1. Introduction
2. Methods
3. Results
4. Discussion

## 1. Introduction
Experimental philosophy has mostly relied on a narrow set of canonical cases. This creates a stimulus-sampling bottleneck: we may mistake local vignette effects for general moral structure.

This study asks three questions:
1. Can we build a continuous map of moral permissibility across a multidimensional scenario space?
2. Are there sharp moral boundaries (phase transitions) rather than only smooth shifts?
3. Does philosophical training change the topology of those boundaries?

### Main contribution
The methodological contribution is the integration of LLM-generated stimuli with Bayesian adaptive sampling. The theoretical contribution is a structural account of moral disagreement based on boundary location and shape.

## 2. Methods
### 2.1 Phase 1: Scenario generation and validation
We define a five-dimensional moral scenario space:
1. Agency type
2. Causal directness
3. Number affected
4. Intention clarity
5. Relational proximity

An LLM generates 1,500 short dilemmas targeted to coordinate points in this space. Six moral philosophers rate each scenario for dimensional fidelity, plausibility, and confound control. Scenarios passing threshold agreement form a validated corpus of about 400 items.

### 2.2 Phase 2: Bayesian adaptive data collection
Participants: N = 120 (60 with formal philosophy training, 60 without).  
Each participant completes 35 judgments:
1. 8 initial space-filling trials
2. 27 adaptive trials selected online by a Gaussian Process model

Primary response: binary judgment (permissible / impermissible).  
Secondary response: confidence rating.

Adaptive rule: sample scenarios near the current decision boundary (posterior probability near 0.5), where information gain is highest.

### 2.3 Phase 3: Structural mapping
We fit a Gaussian Process model to pooled data and estimate:
1. Posterior moral-intuition surface
2. Boundary sharpness (smooth shifts vs abrupt flips)
3. Dimensional relevance and interactions
4. Group differences by philosophical training

## 3. Results
This manuscript pre-registers expected outcomes rather than reporting observed data.

Planned outputs:
1. A continuous map of permissibility across the five-dimensional space
2. Detection of high-gradient boundary regions
3. Comparison of smooth vs discontinuous transition models
4. Topological distance between trained and untrained groups

Expected pattern: at least one robust boundary appears across groups, while another is moderated by philosophical training.

## 4. Discussion
The project reframes experimental philosophy as cartography rather than vignette-by-vignette testing. Instead of asking whether one famous case replicates, it asks what the global structure of moral judgment looks like.

### Practical impact
The validated scenario bank and open moral-topology maps can support:
1. Replicable moral cognition research
2. Better benchmark design for value alignment work
3. Theory comparison in ethics using structural, not only pointwise, evidence

### Limitations
1. Five dimensions do not capture all moral relevance.
2. LLM-generated text may introduce narrative regularities.
3. Binary judgments compress nuance.
4. Cross-cultural replication remains necessary.

### Open science outputs
We release prompts, validation protocol, code, and interactive maps as open materials for extension and replication.
