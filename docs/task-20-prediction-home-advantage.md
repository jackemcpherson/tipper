# Task 20: Prediction-Side Home Advantage

**Date:** 2026-06-12
**Verdict:** Promoted — `predha-080` is the new current config (v3). First fix to clear every promotion criterion since v2.

## Discovery

While reviewing the prediction path for the zone-blending work, it emerged that **home advantage never entered predictions at all**. `elo.home_advantage` (160) is used only inside `updateElo`'s expected-result computation; `generatePrediction → predictMargin` is a pure rating difference. Task 7 selected HA=160 "(11.2 pts, matches AFL published HA)" under the belief that HA contributed to predicted margins — it never did. Every HA sweep to date tuned the update equation only.

Measured on the v2 baseline (1062 matches, 2021–2025):

- Mean actual margin: **+5.88** (home advantage is real)
- Mean predicted margin: **+0.30** (model predicts neutral)
- Systematic bias: **+5.58 points per match against home teams**
- Home win rate 56.3% vs mean predicted home probability 50.3%

## Design

New optional config field `output.prediction_home_advantage` — rating points added to the home side's blended rating at prediction time (margin contribution = value × `margin_per_rating_point`). Absent = 0 = exact v2 behavior (identity verified: hash 932184a8, LogLoss 0.8612 unchanged). Distinct from `elo.home_advantage`, which continues to shape update sizes only.

The measured bias of 5.58 margin points predicts an optimum near 5.58 / 0.07 ≈ **80 rating points**.

## Sweep (2021–2025, vs baseline 0.8612)

| pred HA (rating pts) | Margin pts | Tips | MAE | LogLoss | Δ |
|---|---|---|---|---|---|
| 40 | 2.8 | 66.6% | 26.43 | 0.8514 | −0.0098 |
| 60 | 4.2 | 67.0% | 26.34 | 0.8491 | −0.0121 |
| 70 | 4.9 | 67.8% | 26.32 | 0.8486 | −0.0126 |
| **80** | **5.6** | **68.1%** | **26.31** | **0.8485** | **−0.0127** |
| 90 | 6.3 | 68.6% | 26.31 | 0.8488 | −0.0124 |
| 100 | 7.0 | 69.2% | 26.33 | 0.8496 | −0.0116 |
| 120 | 8.4 | 68.3% | 26.38 | 0.8524 | −0.0088 |
| 160 | 11.2 | 68.3% | 26.69 | 0.8631 | +0.0019 |

Clean U-shape; the optimum sits exactly at the measured bias. HA=160 (the AFL published value Task 7 targeted) overshoots badly — the modern (2021–2025) home edge is ~5.9 points, roughly half the historical figure.

## Interaction sweeps around predha-080

| Variant | LogLoss | Note |
|---|---|---|
| update-HA 60 | 0.8492 | flat — keep 160 |
| update-HA 100 | 0.8489 | flat — keep 160 |
| weight_elo 0.5 | 0.8485 | tie — keep 0.6 |
| weight_elo 0.7 | 0.8497 | worse |
| sigma 34 | 0.8479 | −0.0006, sub-noise — keep 36 |
| sigma 38 | 0.8495 | worse |

No interaction moves beyond the noise floor; the single-parameter change is the candidate (parsimony, and its value is independently derived from the measured bias rather than fitted).

## Promotion evidence

1. **Effect size:** ΔLogLoss −0.0128 > 0.005 threshold (2.5×). Largest single improvement in the project's history (v2 was −0.0120).
2. **Bootstrap (1000 iter, seed 42, paired):** LogLoss Δ −0.0128, 95% CI [−0.0247, −0.0007] — excludes zero. Brier Δ −0.0041, CI [−0.0078, −0.0003] — excludes zero. Tip% +1.7pp, CI [−0.5%, +4.1%] — not individually significant, consistent with LogLoss being the sharper instrument.
3. **2026 out-of-sample gate (115 matches through R13, untouched by any fitting):**

| Config | Tips | LogLoss | MAE | Brier |
|---|---|---|---|---|
| pavfix-blend-w06 (v2) | 71.9% | 0.8331 | 26.91 | 0.1968 |
| **predha-080 (v3)** | **73.7%** | **0.7925** | **26.39** | **0.1863** |

Out-of-sample improvement (−0.0406 LogLoss) is *larger* than in-sample — the opposite of an overfit signature, as expected for a bias correction. The 2026 number also beats the 0.8029 that ranked 1st of 29 Squiggle sources in Task 18 (different match count; direct rank comparison pending).

## Caveats / follow-ups

- 2021–2025 home edge (5.9 pts) is below the long-run historical figure; if home advantage regimes shift, `prediction_home_advantage` should be re-checked seasonally (cheap sweep).
- A venue- or travel-aware prediction HA is now a meaningful research direction (Task 17 rejected venue HA in the *update* equation — the prediction side was never tested because it didn't exist).
- The backwards 2018–2019 validation window was not re-run today; worth doing before any further HA refinement since the historical home edge was larger.
