# Task 37 (T30 Tipper-Side): Age-Curve PAV Priors: Pre-Registration

**Date:** 2026-06-13, before any backtest

**Baseline:** `predha-080` (v3): primary 0.8485, early 0.8555, and 2026 R14
0.7893

**Status:** Pre-registered. Results follow below.

This document is the **pre-registration**: the hypothesis and acceptance
document states the criterion before the team runs the experiment. The T35
lesson amended the bar after the session: "any new feature must survive a
univariate pre-registered test before any combiner sees it." This result is the
first feature pre-registered under that rule.

## Hypothesis

Multiplying the R1 PAV prior (last season's final PAV) by a player-age-dependent
factor improves LogLoss and tips. Mechanism: a 33-year-old's expected 2026
output is empirically lower than their 2025 output, while a 22-year-old's is
higher. The R1 prior currently uses last season's PAV unadjusted: a systematic
bias against young teams (undershooting) and toward ageing-list teams
(overshooting). The WCE ageing-list collapse is the canonical case the rethink
doc and T31 cellar-bias diagnostics both flagged.

The age curve will be **fitted on 1998-2014**: the DOB-coverage-complete window
with no test-season leakage. (Primary test window is 2021-25. Confirmatory is
2016-19. Both are outside the curve-fitting window.)

## Mechanism

- Optional config field `pav.age_curve_weight ∈ [0, 1]` (`.optional()` never
  `.default()`). Absent = off (bit-identical to v3). Lets us sweep dose: 0 to
  0.5 to 1.0.
- New constant in `prior.ts`: piecewise-linear `ageMultiplier(age)` fitted from
  data (peak around 24-26, decay both directions). Same multiplier across
  off/mid/def: first cut, before per-zone elaboration.
- `blendWithPrior` applies `prior × (1 − w + w × ageMultiplier(age))` instead of
  `prior`. At `w = 1`, full curve. At `w = 0`, identity (bit-inert).
- Data layer addition: include `players.date_of_birth` in the player-season-PAV
  row so the engine can compute age at R1 of the prediction season. DOB lookup
  is keyed by `player_id`, evaluated once per (player, season) at prior-map
  build time.

## Acceptance Criteria: Promotion Bar (All Must Hold)

1. Pooled Δ LL ≥ −0.005 on primary 2021-25 + confirmatory 2016-19 with the
   era-stratified bootstrap CI excluding zero (seed 42, 1000 iter via
   `bootstrapCompareStratified`).
2. No recent-3 tip regression: pooled 2023-25 tips Δ ≥ 0.
3. No 2026 regression: full-window (R1-R14) tips Δ ≥ 0.
4. Confirmatory window directionally agrees: early window Δ LL < 0 alone, even
   if sub-bar.
5. Bit-identity: `predha-080` re-run reproduces hash `2641f46f`, LogLoss 0.8485,
   716/1062 tips with `pav.age_curve_weight` absent.

## Parking Criterion (Intermediate Verdict, Like T36)

If criterion 1 narrowly fails the CI margin but criteria 2-5 hold, park
`pav-age-curve-w100` for R14+ re-pooling. Use the same disposition as T36 OD.

## Killing Criterion

Kill the candidate if pooled Δ LL exceeds zero or recent-three tips decline.
Those results match either the v4 or T35 failure pattern.

## Sweep Scope

Curve fit is one-shot (a single curve, fitted on 1998-2014). Engine sweep is
dose only:

- `age_curve_weight ∈ {0.25, 0.5, 0.75, 1.0}` on primary 2021-25 to 4 backtests.
- Best primary candidate cloned as `-early` for confirmatory to 1 backtest.
- 2026 OOS for promotion vs. Parking decision to 1 backtest.

Total: ≤ 7 backtests + curve-fit analysis. Smaller than T36's 17 because the
curve is not itself parameterised at runtime (it is hardcoded post-fit).

## What This Experiment Cannot Prove

- Off-zone vs def-zone differential ageing: forwards age differently than
  ruckmen. This experiment uses a single multiplier across all three zones. A
  per-zone curve is a follow-up.
- Selection-bias-corrected ageing: cross-sectional averages over-state decline
  because cut players do not show up at older ages. The within-player
  consecutive-year ratio is the fix. If the cross-sectional curve fails the bar,
  retry with within-player.

## Results

**Verdict: killed on the T35 fingerprint (LL worsens on both training
windows).** The pre-registered killing criterion fires: pooled Δ LL > 0 (no LL
improvement on the training windows), even though tips gain is positive. The
2026 R1-R14 OOS window shows a small LL gain of −0.0079. However, that result is
inside the OOS power floor and against the training-window evidence.

### Bit-Identity (Criterion 5)

`predha-080` re-run with the new schema field absent: hash `2641f46f`, LL
0.8485, 716/1062 tips: byte-identical match record. ✓

### Dose Sweep: Primary 2021-25 (Baseline V3 0.8485, 716 Tips)

| w    | LL     | ΔLL     | tips | Δtips |
| ---- | ------ | ------- | ---- | ----- |
| 0.25 | 0.8487 | +0.0002 | 715  | −1    |
| 0.50 | 0.8491 | +0.0006 | 716  | 0     |
| 0.75 | 0.8496 | +0.0011 | 718  | +2    |
| 1.00 | 0.8501 | +0.0016 | 719  | +3    |

Monotone-worse on LL across all four dose levels, monotone-better on tips by a
tiny margin. The shape: LL ↑ and tips ↑ together: is the signature of a
noise-injection, not a signal.

### Confirmatory Window: Early 2016-19 (Baseline 0.8555, 554 Tips)

`age-w100-early` (w=1.0 clone of `predha80-early`):

|                     | LL          | tips                |
| ------------------- | ----------- | ------------------- |
| v3 (predha80-early) | 0.8555      | 554/828 (66.9%)     |
| age-w100-early      | **0.8570**  | **562/828 (67.9%)** |
| Δ                   | **+0.0015** | **+8**              |

The early window matches the primary direction: worse LL and slightly better
tips. The match-weighted pooled LL Δ is +0.0015. The pre-registered killing rule
applies because both strata have the wrong sign. A bootstrap would add no useful
evidence, so it was not run.

### 2026 OOS R1-R14

|          | LL          | tips                                       |
| -------- | ----------- | ------------------------------------------ |
| v3       | 0.7893      | 85/116                                     |
| age-w100 | **0.7846**  | **85/117** (one extra game due to refresh) |
| Δ        | **−0.0047** | ≈ 0                                        |

LL improves only in this window. However, 116 or 117 matches remain well inside
the noise floor. T11 found a CI wider than ±0.01 at this scale, and both
training windows pointed elsewhere.

### Per-Season Tip Delta (Age − V3, Both Windows)

| year | Δ      | year | Δ   |
| ---- | ------ | ---- | --- |
| 2016 | **+7** | 2022 | −1  |
| 2017 | +2     | 2023 | 0   |
| 2018 | 0      | 2024 | +1  |
| 2019 | −1     | 2025 | +1  |
| 2021 | +2     |      |     |

Recent-3 (2023-25): +2 tips. So criterion 2 (no recent-3 tip regression) passes,
but criterion 1 fails outright. The +7 result in 2016 is the largest single
move. The curve may capture something about that era's list demographics that
does not generalise.

### Why the Age Curve Failed: Best-Supported Hypothesis

The analysis fits the within-player consecutive-year ratio on **survivors**:
players who appeared in lineups in consecutive seasons. The transition ratios
measure annual change among those survivors. They do not estimate the next-year
output of an average 33-year-old. Players whose age predicts a large decline
often underperform their prior PAV. Clubs then disproportionately cut them, and
their would-be-bad next-season PAV is never observed. The fitted curve thus
understates ageing effects for the population that actually shows up in lineups.

A more decisive structural issue exists. At K=15, current-season PAV outweighs
the R1 prior by about R8. A 0.95 multiplier on a four-week-old prior adjusts a
60/40 blended team rating by about 1.5%.

Even a perfectly accurate curve at this magnitude moves the predicted margin by
less than 0.5 points per match. The signal was always at the noise floor. The
survivor-bias error then tips it negative.

### Promotion-Bar Verdict

1. Pooled Δ LL ≥ −0.005 with CI excluding 0: ✗ **wrong sign**.
2. No recent-3 tip regression: ✓ (+2).
3. No 2026 regression: ✓ (tied).
4. Confirmatory directionally agrees: ✗ (LL also worse there).
5. Bit-identity: ✓.

Two failures. One is fatal (LL direction). **Killed.**

### What Ships, What Does Not

- Engine machinery ships (T28 / T36 precedent): `src/engine/prior.ts`
  (`ageAtDate`, `applyAgeCurve`, `AGE_TRANSITION_RATIO`), `pav.age_curve_weight`
  schema field, `dobByPlayerId` plumbing through `HarnessData`. All bit-inert
  when `pav.age_curve_weight` absent.
- The `configs/age-w*` sweep configs do not ship. Remove this clutter.
- The `tests/engine/age-curve.test.ts` file stays. It protects the helpers if
  anything reuses them (for example a per-zone or selection-corrected curve
  later).

### Resurrection Conditions

This feature is dead **as a global multiplier on the prior**. Resurrection would
require addressing the survivor-bias structural issue:

- Selection-corrected curve: model the cut/retain decision explicitly. Impute
  the would-be PAV for cut players from their last-season PAV and an ageing-list
  prior. Larger project: basically a player-level survival model.
- Per-zone curve: forwards age differently than ruckmen (the data shows the
  defence/midfield/offence ratios diverge: for example age 33 def 0.91, mid
  0.85, off 0.95 in the raw cross-section). A per-component multiplier could
  land where the global one did not. Still constrained by the K-blend lever-arm
  problem.
- Apply earlier in the season only: the lever arm dies after ~R8. An age curve
  that only operates in R1-R4 with a higher dose could matter without messing up
  late-season predictions. Engineering-light. Could be paired with the A2
  bundle.

None of these items remain in the next-session queue. The lever-arm finding
suggests the PAV-prior side just does not have enough lever for a fix at this
magnitude.

### What This Means for the Rethink Doc

- §6 C3 row moves from "data unblocked, fit untested" to **killed at strict bar,
  machinery shipped inert**. Same disposition as T35 stacking head.
- §7 negatives table gets a T37 entry.
- The known-real but sub-bar §5.2 list stays as it was. Nothing here joins it.

---
