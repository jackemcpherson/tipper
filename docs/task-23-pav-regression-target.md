# Task 23: Season-Boundary Regression Toward a PAV-Implied Target

**Date:** 2026-06-12
**Baseline:** `predha-080` (v3) — 2021–2025 LogLoss 0.8485, tips 68.1%, MAE 26.31
**Verdict:** Documented negative. The entire 2D sweep is flat-to-worse, degradation is
monotone in dose, and the diagnostic kills the premise: the West Coast / North Melbourne
residual is *not* a season-boundary information problem. v3 stands.

## Hypothesis (HANDOFF #2, untried direction)

Elo carries stale era information across seasons; `regression_to_mean` pulls every team
toward a flat 1500 at season boundaries. Replace the *target* with a PAV-implied rating —
the list-quality signal the model already computes — so teams whose lists collapsed (West
Coast) or rebuilt regress toward where their list says they should be, not toward average.

## Mechanism

At each season boundary, after the prior-season PAV map is rebuilt for the incoming season:

1. For each team, take its **first named lineup** of the new season (same `pav.include`
   filter as prediction) and sum prior-season PAV per player, `missing_player_default` for
   players without a prior. This is exactly the R1 list-quality signal — at 0 games played,
   `blendWithPrior` returns the prior, so no new signal was invented.
2. Calibrate onto the Elo scale with the existing blend slope (`calibratePav`); mean-centre
   across teams: `target = 1500 + w × (pav_implied − mean)`.
3. `applyRegression` pulls each team toward its target by `regression_to_mean` (ρ).
   Teams without lineup data regress to 1500.

New schema field `elo.regression_pav_target_weight` (`.optional()`, never `.default()`).
Absent reproduces v3 bit-for-bit (verified: backtest reproduces 0.8485, hash `2641f46f`
stable). Present-at-zero (`rtmpav-w00`) compares against baseline with deltas exactly
0.0000 on all three metrics — the implementation is inert when the dial is at 0.

Captures both prior-season decline (via PAV levels) and off-season list turnover
(retirements/trades drop out of the lineup; recruits bring their PAV from the old club).

## Signal check (pre-implementation)

From the v3 results file, R1 PAV-implied ratings (slope × R1 lineup PAV sums, mean-centred):
spread sd 175–250 rating pts vs post-regression Elo sd 141–188; correlation 0.74–0.91.
The motivating case is **2022 West Coast: PAV-implied dev −391 vs Elo dev −91** — PAV knew
the list had collapsed a full season before Elo did. But note 2023–2025: PAV and Elo
*agree* WCE is bottom (−389 vs −347 in 2023). The mismatch existed in one season only.

## Sweep: w × ρ, paired bootstrap vs `predha-080`, 2021–2025 (1062 matches)

ρ swept jointly because at ρ=0.1 a target shift moves season-start Elo by only 0.1× — an
informative target could justify stronger regression.

| Config | w | ρ | ΔLogLoss | 95% CI | Sig? |
|---|---|---|---|---|---|
| rtmpav-w05-r01 | 0.5 | 0.1 | −0.0000 | [−0.0008, 0.0008] | no |
| rtmpav-w05-r02 | 0.5 | 0.2 | +0.0006 | [−0.0003, 0.0015] | no |
| rtmpav-w05-r03 | 0.5 | 0.3 | +0.0013 | [−0.0002, 0.0029] | no |
| rtmpav-w05-r05 | 0.5 | 0.5 | +0.0031 | [+0.0001, 0.0060] | **YES (worse)** |
| rtmpav-w10-r01 | 1.0 | 0.1 | +0.0001 | [−0.0016, 0.0018] | no |
| rtmpav-w10-r02 | 1.0 | 0.2 | +0.0008 | [−0.0015, 0.0033] | no |
| rtmpav-w10-r03 | 1.0 | 0.3 | +0.0018 | [−0.0012, 0.0050] | no |
| rtmpav-w10-r05 | 1.0 | 0.5 | +0.0043 | [−0.0004, 0.0093] | no |

Monotone degradation in both w and ρ; the gradient points at the baseline (w=0, ρ=0.1).
Brier and Tip% agree everywhere. Nothing to refine toward — the best cell is
indistinguishable from doing nothing.

## Why it fails: the residual isn't a boundary phenomenon

Per-team residuals (actual − predicted margin, home-signed) under the strong dose
`rtmpav-w10-r03` barely move the target teams:

| Team | v3 baseline | w10-r03 |
|---|---|---|
| West Coast | −16.7 (t=−4.8) | −15.8 (t=−4.6) |
| North Melbourne | −11.0 (t=−3.6) | −10.3 (t=−3.4) |

And the baseline per-season cut shows West Coast overpredicted **every season**:
2021 −12.2, 2022 −21.7, 2023 −25.0, 2024 −9.2, 2025 −15.5 pts/match — including
2023–2025 when Elo already had them ~350 pts below mean and PAV agreed. The arithmetic:
by 2023 the PAV target and the Elo rating coincide, so the boundary correction is ~0
exactly where the residual is largest. The one genuine mismatch (2022) gives one team-season
of useful correction, which cannot pay for the noise a lineup-based target injects into 17
other teams × 5 boundaries (R1 lineups carry injury/availability noise that has nothing to
do with list quality).

**Conclusion: the WCE/North signal is persistent within-season overprediction of
cellar-dweller teams, not stale cross-season information.** Even rated bottom by both
state machines, the model's margins against these teams aren't extreme enough. Any future
attack should target the prediction tail (e.g. nonlinearity in rating→margin at extreme
rating gaps, or team-level underperformance relative to own rating), not season-boundary
state. Note the mirror class (Bulldogs/Geelong +8) before reaching for asymmetric fixes.

## Status of the change

Implementation retained (same precedent as Tasks 16/17/19/21 — update-side experiments
need the real harness path, and the feature is verified bit-inert when the field is
absent): `applyRegression` accepts optional per-team targets, `buildRegressionTargets` in
`harness.ts`, `calibratePav` extracted from `blend.ts`, schema field optional. The
`rtmpav-*` configs and results files are the historical record. No promotion; `_current`
unchanged.

## Do not re-propose without new data

- PAV-implied season-boundary regression targets, any (w, ρ) dose — flat at best,
  significantly worse at ρ=0.5.
- By extension: era-estimated or otherwise "smarter" boundary regression aimed at the
  WCE/North residual. The residual survives boundary-state surgery because it isn't
  boundary state (this task) and isn't update-side venue/K mechanics (Tasks 16/17).
