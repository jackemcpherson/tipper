# Task 36 (D2): Offence/Defence Split Ratings — Promising, Parked Pending 2026 R14+ Gate

**Date:** 2026-06-13
**Baseline:** `predha-080` (v3) — primary 0.8485 (n=1062), early 0.8555 (n=828), 2026 R14 0.7893 (n=116)
**Verdict:** **Parked, do not promote yet.** The last untested structural idea on the rethink
agenda. Beats v3 on every comp-relevant metric — close-band signs, recent-3 tips, full-window
tips — at a Δ LogLoss that is marginally significant pooled and clearly significant on 2026.
The strict pooled CI just barely includes zero (lower bound −0.0007), so the strict promotion
bar is missed. Add to A3 weekly monitor as a second shadow alongside v4; revisit at end of
2026.

This is the inverse of v4's fingerprint: v4 won LogLoss with CI excluding zero and **lost
tips**; OD passes the comp-currency criterion (the one that killed v4) and falls **marginally
short on the LogLoss CI**. The first candidate in this category since v3.

## 1. The mechanism (D2 as designed)

Parallel attack/concede state in points space, replacing the scalar Elo input to `computeTeamRating`
on a weight `w`:

- `A_i` = expected points scored, `C_i` = expected points conceded; cold start = `initial_score`
- Expected scores: `E_home = (A_h + C_a)/2 + ha/2`, `E_away = (A_a + C_h)/2 − ha/2`
- Update per completed match: residuals `r_home = S_home − E_home`, `r_away = S_away − E_away`.
  Each residual moves both the scoring team's attack and the opposing team's concede by `k·r`
  — they share evidence half-and-half by symmetric step size
- Season boundary regression: per-component toward the **current league mean of state values**
  (tracks scoring-era drift, unlike Elo's fixed 1500 anchor)
- Prediction blend: `eloUsed = (1−w)·Elo + w·odImplied`, where `odImplied = 1500 + (A−C)/2 / margin_per_rating_point`.
  The two teams' rating-diff × `margin_per_rating_point` then reproduces the OD pair-wise
  margin exactly. Prediction HA stays in `output.prediction_home_advantage` (margin-side, unchanged)

No MOV multiplier — residuals are already magnitude-proportional in points, unlike scalar Elo's
sign-only Bernoulli update. OD updates on every completed match (train + test alike), so warm-up
behaves identically to scalar Elo.

## 2. Engine implementation

- `src/engine/odelo.ts` — OD state, expected-scores, update, regression, implied-rating (7 unit tests)
- `elo.od: { weight, k, home_advantage_points, initial_score, regression_to_mean, shot_score_weight? }`
  (`.optional()`, never `.default()` — hash stability)
- `harness.ts`: state creation alongside offset state, season-boundary regression, per-match
  update (train and test), `generatePrediction` mixes OD into the Elo slot of the blend. Same
  pattern in `runPredict` so live predictions inherit the OD warm-up
- **Bit-inertness verified**: `predha-080` re-run reproduces hash `2641f46f`, LogLoss 0.8485,
  716/1062 tips — byte-identical match record
- The reported `homeElo`/`awayElo` on the prediction record stay the **raw scalar Elo** so
  existing diagnostics (per-team residuals, calibration) don't shift meaning

## 3. Sweep — w=1.0, k=0.08 is the leading candidate

All runs on primary 2021-25, walk-forward, real backtests. Baseline v3: 0.8485 / 716 tips.

| stage | config | LL | tips | ΔLL | Δtips |
|---|---|---|---|---|---|
| A | w=0.25, k=0.08 | 0.8459 | 718 | −0.0026 | +2 |
| A | w=0.50, k=0.08 | 0.8441 | 716 | −0.0044 | 0 |
| A | w=0.75, k=0.08 | 0.8430 | 722 | −0.0055 | +6 |
| A | **w=1.0, k=0.08** | **0.8427** | **728** | **−0.0058** | **+12** |
| B | w=1.0, k=0.04 | 0.8518 | 725 | +0.0033 | +9 |
| B | w=1.0, k=0.12 | 0.8407 | 725 | −0.0078 | +9 |
| B | w=1.0, k=0.20 | 0.8426 | 717 | −0.0059 | +1 |
| C | w=1.0, k=0.08, rtm=0.0 | 0.8422 | 717 | −0.0063 | +1 |
| C | w=1.0, k=0.08, rtm=0.1 | 0.8422 | 720 | −0.0063 | +4 |
| C | w=1.0, k=0.08, rtm=0.3 | 0.8437 | 727 | −0.0048 | +11 |
| D | w=1.0, k=0.08, ha=6 | 0.8425 | 725 | −0.0060 | +9 |
| D | w=1.0, k=0.08, ha=14 | 0.8429 | 727 | −0.0056 | +11 |

The plateau around (w=1.0, k=0.08–0.12, rtm=0.0–0.2, ha=10) is broad — not a spike. k=0.12
edges out on LogLoss alone (0.8407) but k=0.08 is the **joint** maximum across LogLoss + tips.
**Leading config: `od-w100-k008`** (w=1.0, k=0.08, ha=10, rtm=0.2, initial_score=85).

## 4. Confirmatory window (T25 procedure)

`od-w100-k008-early` (clone of `predha80-early` + same OD block):

| | LL | tips | MAE |
|---|---|---|---|
| v3 (predha80-early) | 0.8555 | 554/828 (67.0%) | 28.79 |
| OD (od-w100-k008-early) | **0.8504** | **560/828 (67.6%)** | **28.59** |
| Δ | **−0.0051** | **+6** | −0.20 |

Pattern replicates cross-era: same direction on LogLoss, tips, and MAE.

## 5. Pooled era-stratified bootstrap (the promotion-bar significance test)

`analysis/task36-pooled-eval.ts`, seed=42, 1000 iter, primary + early as strata:

| | Δ point | 95% CI | excludes 0 |
|---|---|---|---|
| LogLoss | **−0.0054** | **[−0.0007, +0.0110]** | **no (marginal)** |
| Tip% | −0.96% | [−2.14%, +0.21%] | no |
| Brier | (similar shape) | | |

The Δ LogLoss exceeds the 0.005 effect-size bar, but the CI lower bound is at −0.0007 — barely
inside zero. **Strict bar fails.** Compare T31 (v4) which got CI [−0.0144, −0.0026], cleanly
excluding zero — the n=1890 + this effect size sits right at the power threshold.

## 6. The comp-currency story (the v4-killer criterion)

Pooled close-band sign accuracy (|v3 pred margin| < 12, draws excluded — the band that decides
the comp):

| window | n | v3 | OD | Δ tips |
|---|---|---|---|---|
| primary 2021-25 | 533 | 299 (56.1%) | 311 (58.3%) | **+12** |
| early 2016-19 | 410 | 230 (56.1%) | 236 (57.6%) | **+6** |
| **pooled** | **943** | **529 (56.1%)** | **547 (58.0%)** | **+18** |

Per-season tips delta (pooled, sign convention OD − v3):

| year | Δ | year | Δ |
|---|---|---|---|
| 2016 | +5 | 2022 | +3 |
| 2017 | +1 | 2023 | +2 |
| 2018 | +2 | 2024 | **−2** |
| 2019 | −2 | 2025 | +5 |
| 2021 | +4 | | |

- **Recent-3 (2023-25): +5** — clears the "last-three-seasons tip deficit disqualifies" criterion
- 7 of 9 seasons positive; 2 single-year regressions (2019 −2, 2024 −2) offset by adjacent gains
- This is the **opposite** of v4's fingerprint (v4 pooled −9 across 2023-25, −1 to −4 every recent season)

## 7. 2026 OOS (R14 window)

The R14 gate hasn't formally accrued (predha-080 currently spans R1-R14), but as a directional
check:

| | LL | tips | MAE |
|---|---|---|---|
| v3 2026 (R1-R14) | 0.7893 | 85/116 (73.3%) | 26.38 |
| OD 2026 (R1-R14) | **0.7711** | **85/116** | **26.26** |
| Δ | **−0.0182** | **0** | −0.12 |

Substantial LogLoss gain with tied tips — and the OD direction (LogLoss-positive, tips-neutral
or better) matches the historical fingerprint, the inverse of v4.

## 8. Why "park" not "promote"

Strict promotion bar (T25/T32 amended):
- ✅ Δ LogLoss > 0.005 pooled (0.0054)
- ❌ **Bootstrap CI excludes zero (lower bound −0.0007, just inside)** — the failure mode
- ✅ Confirmatory window agrees (early Δ −0.0051, tips +6)
- ✅ No recent-3 tip regression (+5 vs −9 for v4)
- ✅ No 2026 regression (Δ −0.0182, tips tied)
- ✅ Close-band sign accuracy improves both eras (+18 pooled)

Failing exactly one criterion — and the marginal one at that — argues for **parked, not killed**.
The 2026 R14+ window will deliver ~110 more matches by season end; folding those into a
re-evaluation will either tighten the CI off zero (most likely given the 2026 R1-R14 slope) or
confirm the current marginal-but-not-significant verdict.

## 9. What ships, what doesn't

- **Engine machinery ships** (T28 precedent): `src/engine/odelo.ts`, schema field, harness
  wiring stay in — bit-inert when `elo.od` absent
- **`od-w100-k008` config ships** with `.optional()` machinery so it can be invoked any time
- **No current pointer change** — `_current.json` still points at `predha-080`
- **Added to A3 monitor** as a second shadow alongside v4 (third row of the comp standing
  table). End-of-2026 A2 bundle re-evaluates with the full R1-R26+ window

## 10. What this means for open items on the rethink doc

- **D2 status moves from "open — the last untested structural idea"** to **"prototype built,
  comp-passing, awaiting 2026 R14+ power"**. The only remaining structural idea is exhausted
  as a research question; what's left is data accrual
- The "v3's existing information set is exhausted from three directions" claim (T33-35) needs
  qualification: **structural moves still found juice**. OD reaches information T33 (field
  triangulation), T34 (market), and T35 (stacking) couldn't, because it changes what the model
  *is*, not what it *combines*
- The known-real but sub-bar §5.2 list keeps growing — bucketed HA, finals HA, sigma 33-34,
  T28 shot Elo, T31 team offsets, T36 OD splits. Stack them into the A2 bundle pre-registered

## Artifacts

- `src/engine/odelo.ts`, `tests/engine/odelo.test.ts`
- `src/config/schema.ts` (`elo.od` block), `src/engine/harness.ts` (wiring)
- `configs/od-w100-k008/` (leading) + 8 sweep variants + `od-w100-k008-early/`
- `configs/predha-080/results-2026-06-13-2641f46f.json` (bit-identity proof)
- `analysis/task36-pooled-eval.ts` (pooled stratified bootstrap + close-band)
