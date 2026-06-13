# Task 37 (T30 tipper-side): Age-Curve PAV Priors — Pre-Registration

**Date:** 2026-06-13 (registration timestamp, before any backtest)
**Baseline:** `predha-080` (v3) — primary 0.8485 (n=1062), early 0.8555 (n=828), 2026 R14 0.7893 (n=116)
**Status:** Pre-registered; results to follow below.

This document is the **pre-registration**: the hypothesis and acceptance criterion are
written first, then the experiment is run. The T35 lesson amended the bar after the
session: "any new feature must survive a univariate pre-registered test before any
combiner sees it." This is the first feature pre-registered under that rule.

## Hypothesis

Multiplying the R1 PAV prior (last season's final PAV) by a player-age-dependent factor
improves LogLoss and tips. Mechanism: a 33-year-old's expected 2026 output is
empirically lower than their 2025 output, while a 22-year-old's is higher. The R1 prior
currently uses last season's PAV unadjusted — a systematic bias against young teams
(undershooting) and toward aging-list teams (overshooting). The WCE aging-list collapse
is the canonical case the rethink doc and T31 cellar-bias diagnostics both flagged.

The age curve will be **fitted on 1998–2014** — the DOB-coverage-complete window with
no test-season leakage. (Primary test window is 2021–25; confirmatory is 2016–19; both
are outside the curve-fitting window.)

## Mechanism

- Optional config field `pav.age_curve_weight ∈ [0, 1]` (`.optional()` never `.default()`).
  Absent = off (bit-identical to v3). Lets us sweep dose: 0 → 0.5 → 1.0.
- New constant in `prior.ts`: piecewise-linear `ageMultiplier(age)` fitted from data
  (peak around 24–26, decay both directions). Same multiplier across off/mid/def — first
  cut, before per-zone elaboration.
- `blendWithPrior` applies `prior × (1 − w + w × ageMultiplier(age))` instead of `prior`.
  At `w = 1`, full curve; at `w = 0`, identity (bit-inert).
- Data layer addition: include `players.date_of_birth` in the player-season-PAV row so
  the engine can compute age at R1 of the prediction season. DOB lookup is keyed by
  `player_id`, evaluated once per (player, season) at prior-map build time.

## Acceptance criteria — promotion bar (all must hold)

1. **Pooled Δ LL ≥ −0.005** on primary 2021–25 + confirmatory 2016–19 with the
   era-stratified bootstrap CI excluding zero (seed 42, 1000 iter via
   `bootstrapCompareStratified`).
2. **No recent-3 tip regression**: pooled 2023–25 tips Δ ≥ 0.
3. **No 2026 regression**: full-window (R1–R14) tips Δ ≥ 0.
4. **Confirmatory window directionally agrees**: early window Δ LL < 0 alone, even if
   sub-bar.
5. **Bit-identity**: `predha-080` re-run reproduces hash `2641f46f`, LogLoss 0.8485,
   716/1062 tips with `pav.age_curve_weight` absent.

## Parking criterion (intermediate verdict, like T36)

If 1 fails by the CI margin (Δ pooled ≥ −0.005 but CI lower bound just inside zero)
AND 2–5 all hold, park as `pav-age-curve-w100` for R14+ re-pool — same disposition as
T36 OD.

## Killing criterion

If pooled Δ LL > +0.000 (no LL improvement) OR recent-3 tips Δ < 0, kill on the v4
fingerprint (LL win, tips lose) or the T35 fingerprint (LL loss).

## Sweep scope

Curve fit is one-shot (a single curve, fitted on 1998–2014). Engine sweep is dose only:
- `age_curve_weight ∈ {0.25, 0.5, 0.75, 1.0}` on primary 2021–25 → 4 backtests
- Best primary candidate cloned as `-early` for confirmatory → 1 backtest
- 2026 OOS for promotion vs. parking decision → 1 backtest

Total: ≤ 7 backtests + curve-fit analysis. Smaller than T36's 17 because the curve
isn't itself parameterised at runtime (it's hardcoded post-fit).

## What this experiment cannot prove

- **Off-zone vs def-zone differential aging**: forwards age differently than ruckmen.
  This experiment uses a single multiplier across all three zones; a per-zone curve is a
  follow-up.
- **Selection-bias-corrected aging**: cross-sectional averages over-state decline
  because cut players don't show up at older ages. The within-player consecutive-year
  ratio is the fix; if the cross-sectional curve fails the bar, retry with within-player.

## Results

**Verdict: killed on the T35 fingerprint (LL worsens on both training windows).** The
pre-registered killing criterion fires: pooled Δ LL > 0 (no LL improvement on the
training windows), even though tips gain is positive. The 2026 R1-R14 OOS window
shows a small LL gain (Δ −0.0079) but that's already inside the OOS power floor
and against the training-window evidence.

### Bit-identity (criterion 5)

`predha-080` re-run with the new schema field absent: hash `2641f46f`, LL 0.8485,
716/1062 tips — byte-identical match record. ✓

### Dose sweep — primary 2021–25 (baseline v3 0.8485, 716 tips)

| w | LL | ΔLL | tips | Δtips |
|---|---|---|---|---|
| 0.25 | 0.8487 | +0.0002 | 715 | −1 |
| 0.50 | 0.8491 | +0.0006 | 716 | 0 |
| 0.75 | 0.8496 | +0.0011 | 718 | +2 |
| 1.00 | 0.8501 | +0.0016 | 719 | +3 |

Monotone-worse on LL across all four dose levels, monotone-better on tips by a tiny
margin. The shape — LL ↑ and tips ↑ together — is the signature of a noise-injection,
not a signal.

### Confirmatory window — early 2016–19 (baseline 0.8555, 554 tips)

`age-w100-early` (w=1.0 clone of `predha80-early`):

| | LL | tips |
|---|---|---|
| v3 (predha80-early) | 0.8555 | 554/828 (66.9%) |
| age-w100-early | **0.8570** | **562/828 (67.9%)** |
| Δ | **+0.0015** | **+8** |

Same direction as primary — LL worse, tips slightly better. Pooled LL Δ (weighted by
match count) = +0.0015. **Bootstrap not run** — per the pre-registered killing rule,
no point pooling a Δ that's the wrong sign on both strata.

### 2026 OOS R1–R14

| | LL | tips |
|---|---|---|
| v3 | 0.7893 | 85/116 |
| age-w100 | **0.7846** | **85/117** (one extra game due to refresh) |
| Δ | **−0.0047** | ≈ 0 |

The only window where LL improves, but n=116/117 is well inside the noise floor
(T11's ±0.01+ CI width at this scale), and the training windows both pointed the
other way.

### Per-season tip delta (age − v3, both windows)

| year | Δ | year | Δ |
|---|---|---|---|
| 2016 | **+7** | 2022 | −1 |
| 2017 | +2 | 2023 | 0 |
| 2018 | 0 | 2024 | +1 |
| 2019 | −1 | 2025 | +1 |
| 2021 | +2 |  |  |

Recent-3 (2023–25): +2 tips. So criterion 2 (no recent-3 tip regression) passes,
but criterion 1 fails outright. The +7 in 2016 is the largest single move and
suggests the curve catches *something* about that specific era's list demographics
that doesn't generalise.

### Why the age curve failed — best-supported hypothesis

The within-player consecutive-year ratio is fitted on **survivors** — players who
appeared in lineups in both season N and season N+1. The transition ratios it
measures are how much surviving players changed year-over-year, NOT how much an
average 33-year-old's expected output will be next year. Players whose age would
predict a large decline (and who therefore underperform their prior PAV the most)
are disproportionately CUT, and their would-be-bad next-season PAV is never
observed. The fitted curve thus understates aging effects for the population that
actually shows up in lineups.

But there's a more decisive structural issue: at K=15 (the prior weight), the R1
prior already loses to current-season PAV by R8 or so. A 0.95 multiplier on a
4-week-old prior is a ~1.5% adjustment to a team rating that itself blends 60/40
with Elo — so even a *perfectly correct* curve at this magnitude moves the predicted
margin by &lt; 0.5 pts/match. The signal was always going to be at the noise floor;
the survivor-bias error then tips it negative.

### Promotion-bar verdict

1. Pooled Δ LL ≥ −0.005 with CI excluding 0 — ✗ **wrong sign**
2. No recent-3 tip regression — ✓ (+2)
3. No 2026 regression — ✓ (tied)
4. Confirmatory directionally agrees — ✗ (LL also worse there)
5. Bit-identity — ✓

Two failures; one is fatal (LL direction). **Killed.**

### What ships, what doesn't

- **Engine machinery ships** (T28 / T36 precedent): `src/engine/prior.ts`
  (`ageAtDate`, `applyAgeCurve`, `AGE_TRANSITION_RATIO`), `pav.age_curve_weight`
  schema field, `dobByPlayerId` plumbing through `HarnessData`. All bit-inert when
  `pav.age_curve_weight` absent.
- **`configs/age-w*` sweep configs do NOT ship** — clutter, kill them.
- **`tests/engine/age-curve.test.ts` stays** — defends the helpers if anything
  reuses them (e.g. a per-zone or selection-corrected curve later).

### Resurrection conditions

This feature is dead **as a global multiplier on the prior**. Resurrection would
require addressing the survivor-bias structural issue:

- **Selection-corrected curve**: model the cut/retain decision explicitly. Impute
  the would-be PAV for cut players from their last-season PAV and an aging-list
  prior. Larger project — basically a player-level survival model.
- **Per-zone curve**: forwards age differently than ruckmen (the data shows the
  defence/midfield/offence ratios diverge — e.g. age 33 def 0.91, mid 0.85, off
  0.95 in the raw cross-section). A per-component multiplier could land where the
  global one didn't. Still constrained by the K-blend lever-arm problem.
- **Apply earlier in the season only**: the lever arm dies after ~R8; an age curve
  that only operates in R1-R4 with a higher dose could matter without messing up
  late-season predictions. Engineering-light; could be paired with the A2 bundle.

None of these are queued for a next session — the lever-arm finding suggests the
PAV-prior side just doesn't have enough lever for a fix at this magnitude.

### What this means for the rethink doc

- §6 C3 row moves from "data unblocked, fit untested" → **killed at strict bar,
  machinery shipped inert**. Same disposition as T35 stacking head.
- §7 negatives table gets a T37 entry.
- The known-real but sub-bar §5.2 list stays as it was; nothing here joins it.

---

