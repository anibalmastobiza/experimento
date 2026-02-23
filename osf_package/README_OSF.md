# OSF Materials Package

This package is organized for direct upload to an OSF project.

## Folder structure
- `analysis/`
  - `analysis_bluey_pilot.R`: descriptive pilot analysis script (N=1 proof-of-concept).
  - `md_to_apa_rtf.py`: manuscript formatting helper used during document generation.
- `manuscripts/`
  - Manuscript sources and submission-ready files.
- `materials/`
  - Experimental paradigm HTML (`kit_experimento_bluey_v4.html`).
- `outputs/`
  - Pilot figures, trial-level table, and summary CSV outputs.
- `registration/`
  - OSF registration assets: analysis-code statement and pilot codebook.
- `source_documents/`
  - Source PDFs used as project input documents.

## Reproducibility
Run:

```bash
Rscript analysis/analysis_bluey_pilot.R
```

Expected outputs are in `outputs/`.

## Scope statement
The pilot dataset in this package is `N=1` and supports feasibility/diagnostic conclusions only.
It is not a confirmatory population-level dataset.
