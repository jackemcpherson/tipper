# Task 23: Season-Boundary Regression Toward a PAV-Implied Target

**Date:** 2026-06-12

**Baseline:** `predha-080` (v3): 2021-2025 LogLoss 0.8485, tips 68.1%, MAE 26.31

**Verdict:** Documented negative. The entire 2D sweep is flat or worse.
Degradation increases monotonically with dose, and the diagnostic rejects the
premise: the West Coast / North Melbourne residual is _not_ a season-boundary
information problem. V3 stands.

## Hypothesis (HANDOFF #2, Untried Direction)

Elo carries stale era information across seasons. `regression_to_mean` pulls
every team towards a flat 1500 at season boundaries. Replace the target with the
PAV-implied list-quality rating that the model already computes. Teams whose
lists collapsed (West Coast) or rebuilt regress toward where their list says
they should be, not toward average.

## Mechanism

At each season boundary, after the prior-season PAV map is rebuilt for the
incoming season:

1. For each team, take its **first named lineup** of the new season (same
   `pav.include` filter as prediction) and sum prior-season PAV per player,
   `missing_player_default` for players without a prior. This result is exactly
   the R1 list-quality signal: at 0 games played, `blendWithPrior` returns the
   prior, so no new signal was invented.
2. Calibrate onto the Elo scale with the existing blend slope (`calibratePav`).
   Mean-centre across teams: `target = 1500 + w × (pav_implied − mean)`.
3. `applyRegression` pulls each team toward its target by `regression_to_mean`
   (ρ). Teams without lineup data regress to 1500.

New schema field `elo.regression_pav_target_weight` (`.optional()`, never
`.default()`). Absent reproduces v3 bit-for-bit (verified: backtest reproduces
0.8485, hash `2641f46f` stable). Present-at-zero (`rtmpav-w00`) compares against
baseline with deltas exactly 0.0000 on all three metrics: the implementation is
inert when the dial is at 0.

Captures both prior-season decline (via PAV levels) and off-season list turnover
(retirements/trades drop out of the lineup. Recruits bring their PAV from the
old club).

## Signal Check (Pre-Implementation)

The v3 results derive R1 PAV-implied ratings from slope and lineup PAV sums.
Their mean-centred spread has an SD of 175-250 points. Post-regression Elo spans
141-188, with correlations of 0.74-0.91. The motivating 2022 West Coast case has
PAV deviation −391 versus Elo deviation −91. PAV identified the collapse one
season before Elo did.

From 2023 to 2025, PAV and Elo agree that WCE ranks last (−389 vs −347 in 2023).
The mismatch existed in one season only.

## Sweep: W × Ρ, Paired Bootstrap Versus `predha-080`, 2021-2025 (1062 Matches)

ρ swept jointly because at ρ=0.1 a target shift moves season-start Elo by only
0.1×: an informative target could justify stronger regression.

| Config         | w   | ρ   | ΔLogLoss | 95% CI            | Sig?            |
| -------------- | --- | --- | -------- | ----------------- | --------------- |
| rtmpav-w05-r01 | 0.5 | 0.1 | −0.0000  | [−0.0008, 0.0008] | no              |
| rtmpav-w05-r02 | 0.5 | 0.2 | +0.0006  | [−0.0003, 0.0015] | no              |
| rtmpav-w05-r03 | 0.5 | 0.3 | +0.0013  | [−0.0002, 0.0029] | no              |
| rtmpav-w05-r05 | 0.5 | 0.5 | +0.0031  | [+0.0001, 0.0060] | **YES (worse)** |
| rtmpav-w10-r01 | 1.0 | 0.1 | +0.0001  | [−0.0016, 0.0018] | no              |
| rtmpav-w10-r02 | 1.0 | 0.2 | +0.0008  | [−0.0015, 0.0033] | no              |
| rtmpav-w10-r03 | 1.0 | 0.3 | +0.0018  | [−0.0012, 0.0050] | no              |
| rtmpav-w10-r05 | 1.0 | 0.5 | +0.0043  | [−0.0004, 0.0093] | no              |

Monotone degradation in both w and ρ. The gradient points at the baseline (w=0,
ρ=0.1). Brier and Tip% agree everywhere. Nothing to refine toward: the best cell
is indistinguishable from doing nothing.

## Why It Fails: the Residual Is Not a Boundary Phenomenon

Per-team residuals (actual − predicted margin, home-signed) under the strong
dose `rtmpav-w10-r03` barely move the target teams:

| Team            | v3 baseline    | w10-r03        |
| --------------- | -------------- | -------------- |
| West Coast      | −16.7 (t=−4.8) | −15.8 (t=−4.6) |
| North Melbourne | −11.0 (t=−3.6) | −10.3 (t=−3.4) |

The baseline per-season cut shows West Coast overprediction in **every season**.
Values ranged from −9.2 to −25.0 points per match between 2021 and 2025. From
2023 to 2025, Elo rated them about 350 points below average, and PAV agreed. The
arithmetic: by 2023 the PAV target and the Elo rating coincide, so the boundary
correction approaches zero exactly where the residual peaks.

The genuine 2022 mismatch provides one useful team-season correction. It cannot
offset the noise injected into 17 other teams across five boundaries. R1 lineups
reflect injuries and availability, not only list quality.

**Conclusion: the WCE/North signal is persistent within-season overprediction of
cellar-dweller teams, not stale cross-season information.** Even rated bottom by
both state machines, the model's margins against these teams are not extreme
enough. Future work should target the prediction tail rather than
season-boundary state. Options include nonlinear margin mapping at extreme
rating gaps or team-level underperformance relative to ratings. Note the mirror
class (Bulldogs/Geelong +8) before reaching for asymmetric fixes.

## Status of the Change

Tasks 16, 17, 19, and 21 establish the framework precedent for update-side
experiments.

The implementation includes these safeguards and extension points:

- Tests verify bit identity when the field is absent.
- `applyRegression` accepts optional per-team targets.
- `buildRegressionTargets` constructs targets in `harness.ts`.
- `calibratePav` now lives in `blend.ts`.
- The schema field remains optional.

The `rtmpav-*` configs and results files are the historical record.

No promotion occurred, and `_current` remains unchanged.

## Do Not Re-Propose Without New Data

- PAV-implied season-boundary regression targets, any (w, ρ) dose: flat at best,
  significantly worse at ρ=0.5.
- By extension: era-estimated or otherwise "smarter" boundary regression aimed
  at the WCE/North residual. The residual survives boundary-state surgery
  because it is not boundary state (this task) and is not update-side venue/K
  mechanics (Tasks 16/17).
