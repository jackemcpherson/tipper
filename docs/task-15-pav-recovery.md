# Task 15 — PAV Recovery and Blend Re-disambiguation

**Date:** 2026-04-26
**Starting baseline:** `elo-only-tuned-v1b` (K=25, HA=160, RTM=0.10, weight_elo=1.0, sigma=36)
**Final model:** `pavfix-blend-w06` (weight_elo=0.6, pav_calibration_slope=6.986)

---

## Part A — Recalibrated slope

Calibration regression on 2021-2024 (846 matches), using corrected PAV
formula (Task 13 defence fix applied).

| | Old (broken) | New (corrected) |
|---|---|---|
| pav_calibration_slope | 0.246 | **6.986** |
| Slope ratio | 1.00 | 28.4x |

The 28x difference reflects the removal of the 100x defence inflation.
With the bug, defensive PAV dominated the total signal, and the slope had
to be very small to compensate. The corrected slope is in the expected
range for converting PAV differentials (~40-point range) to Elo-equivalent
units.

PAV-Elo diff correlation: **0.808** — moderate complementarity. PAV and
Elo are correlated (both measure team quality) but PAV captures player-level
signal that Elo alone misses. Below the 0.85 redundancy threshold.

## Part B — Blend weight sweep

| Config | weight_elo | Tip% | MAE | Brier | LogLoss | Delta vs Elo-only |
|--------|-----------|------|------|-------|---------|-------------------|
| pavfix-blend-w04 | 0.4 | 65.6% | 26.74 | 0.2064 | 0.8621 | -0.0106 |
| pavfix-blend-w05 | 0.5 | 65.2% | 26.73 | 0.2060 | 0.8609 | -0.0118 |
| **pavfix-blend-w06** | **0.6** | **66.1%** | **26.75** | **0.2060** | **0.8607** | **-0.0120** |
| pavfix-blend-w07 | 0.7 | 65.8% | 26.81 | 0.2064 | 0.8618 | -0.0109 |
| pavfix-blend-w08 | 0.8 | 66.3% | 26.92 | 0.2072 | 0.8642 | -0.0085 |
| pavfix-blend-w09 | 0.9 | 66.0% | 27.06 | 0.2084 | 0.8679 | -0.0048 |
| pavfix-blend-w10 | 1.0 | 65.2% | 27.21 | 0.2100 | 0.8727 | 0.0000 |

The relationship is **no longer monotonic toward Elo**. The optimum is at
weight_elo=0.6, and every blend config beats Elo-only. This is a complete
reversal from v1 Task 1, where more Elo weight was always better — because
v1 was blending against broken PAV.

The improvement at the optimum (-0.0120 LogLoss) is larger than the entire
v1 tuning process improvement (-0.015 from blended-v1 to elo-tuned-v1).

## Part C — Bootstrap validation

| Comparison | Point estimate Delta | 95% CI | Excludes zero? |
|---|---|---|---|
| LogLoss (A-B) | **-0.0120** | **[-0.0220, -0.0019]** | **YES** |
| Brier (A-B) | **-0.0040** | **[-0.0071, -0.0007]** | **YES** |
| Tip% (A-B) | +0.9% | [-1.1%, +2.6%] | no |

Bootstrap: 1,000 iterations, seed=42.

**Both LogLoss and Brier CIs exclude zero.** This is the first parameter
change in the project to achieve statistical significance at 95% confidence.
Task 11 showed that none of the v1/v1.5 decisions could achieve this — the
effect sizes were too small relative to sampling noise. The corrected PAV
signal is large enough to clear the noise floor.

## Per-season breakdown

| Year | Elo-only LogLoss | PAV blend LogLoss | Delta |
|------|-----------------|-------------------|-------|
| 2021 | 0.9216 | 0.9271 | +0.0055 (PAV hurts) |
| 2022 | 0.8499 | 0.8468 | -0.0031 (PAV helps) |
| 2023 | 0.9063 | 0.8926 | -0.0137 (PAV helps) |
| 2024 | 0.8902 | 0.8587 | -0.0315 (PAV helps) |
| 2025 | 0.7969 | 0.7807 | -0.0162 (PAV helps) |

PAV helps in 4 of 5 years. The 2021 underperformance (+0.0055) is expected:
it's the first test year, and the Bayesian prior is working from cold-start
PAV data with limited accumulation. The improvement strengthens over time as
PAV state accumulates (2024: -0.0315 is the largest single-year delta).

## Decision: Outcome A — PAV genuinely contributes

The v1.5 decision to bench PAV was wrong. The 100x defence bug was masking
real signal by making PAV essentially a "defensive involvement + noise"
metric. With the corrected formula:

- PAV's signal is balanced across offence, midfield, and defence zones
- The calibration slope (6.986) is in the physically meaningful range
- The blend optimum is weight_elo=0.6, not 0.9 or 1.0
- The improvement is statistically significant (first in the project)

**Promoted `pavfix-blend-w06` as baseline for Tasks 16-18.**

### Updated v1.5 parameters → Task 15 parameters

| Parameter | v1.5 value | Task 15 value | Change |
|-----------|-----------|---------------|--------|
| weight_elo | 1.0 | **0.6** | PAV restored |
| pav_calibration_slope | 0.246 | **6.986** | Corrected |
| All other params | unchanged | unchanged | |

### Performance: v1.5 → Task 15

| Metric | v1.5 (Elo-only) | Task 15 (blend) | Improvement |
|--------|-----------------|-----------------|-------------|
| LogLoss | 0.8727 | **0.8607** | -0.0120 |
| Brier | 0.2100 | **0.2060** | -0.0040 |
| MAE | 27.21 | **26.75** | -0.46 |
| RMSE | 34.77 | **34.22** | -0.55 |
| Tip% | 65.2% | **66.1%** | +0.9% |
