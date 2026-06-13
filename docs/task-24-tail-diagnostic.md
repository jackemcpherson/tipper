# Task 24 (B1): Tail Diagnostic — Nonlinear Rating→Margin vs Team-Level Effects

**Date:** 2026-06-12
**Baseline:** `predha-080` (v3) — 2021–2025 LogLoss 0.8485, tips 68.1%, MAE 26.31
**Verdict:** The cellar-dweller tail bias is **team-specific, not gap-specific**. A global
convex margin map is rejected (best −0.0010, CI includes zero). `margin_per_rating_point`
is now swept and closed (optimum 0.075, worth −0.0006 — ratio-equivalent to the known
sigma 33–34 result). The residual routes to **B2: per-team performance-vs-rating offsets**,
with a large in-sample oracle bound (−0.012 LogLoss). No promotion; v3 stands.

## Method

Offline-exact from `predha-080` persisted records (1,062 matches, 2021–2025), per the
Task 22 method note. Replica verification: recomputed margins from
`homeTeamRating + 80 − awayTeamRating` × 0.07 match persisted `predictedMargin` to
floating-point exactness (max diff 0.0); replica metrics reproduce the official run
exactly — LogLoss 0.8485, tips 716 (68.06%), MAE 26.3086, RMSE 33.7779.

Residuals are favourite-oriented: `fav_resid = sign(pred) × actual − |pred|`
(positive = favourite won by more than predicted).

## 1. Pooled diagnostic: residuals DO grow with predicted margin…

| fav pred margin | n | mean resid | t |
|---|---|---|---|
| [0,5) | 238 | −1.71 | −0.81 |
| [5,10) | 221 | −2.50 | −1.06 |
| [10,15) | 172 | +5.33 | +2.09 |
| [15,20) | 138 | +2.96 | +1.21 |
| [20,25) | 91 | +7.03 | +1.78 |
| [25,30) | 75 | +1.36 | +0.36 |
| [30,40) | 92 | +5.57 | +1.62 |
| [40,200) | 35 | +15.58 | +2.42 |

OLS `fav_resid ~ fav_pred`: slope **+0.306** (se 0.091, t 3.37). Taken alone this looks
like convexity — favourites systematically win by more than the linear map predicts.

## 2. …but the effect is entirely team-driven

Large-gap matches (fav pred ≥ 20, n=293):

| Subset | n | mean resid | t |
|---|---|---|---|
| all big-gap | 293 | +6.14 | +2.99 |
| underdog is WCE/North | 123 | +14.38 | +4.62 |
| **no WCE/North involved** | **167** | **+0.66** | **+0.25** |
| favourite is Bulldogs/Geelong | 58 | +12.34 | +2.43 |
| no WCE/North/WB/Geel involved | 130 | −0.97 | −0.33 |

Control (fav pred 5–20): all +1.45 (t 1.01); excluding WCE/North +0.17 (t 0.11).

Remove West Coast and North Melbourne and the entire tail effect vanishes. The pooled
slope in §1 is a composition artifact: cellar teams populate the big-gap bins.

### The mirror class dissolves

| Subset | n | mean resid | t |
|---|---|---|---|
| big-gap: fav WB/Geel, dog **not** WCE/North | 36 | +6.45 | +1.02 |
| big-gap: fav WB/Geel, dog **is** WCE/North | 22 | +21.98 | +2.67 |
| big-gap: dog WCE/North, fav not WB/Geel | 102 | +12.22 | +3.66 |
| all gaps: dog is WCE/North | 198 | **+13.93** | **+5.63** |
| all gaps: fav WB/Geel, dog not cellar | 145 | +5.51 | +1.85 |

The Bulldogs/Geelong "underprediction" is mostly the same matches viewed from the other
side. The phenomenon is **one-sided**: WCE/North underperform their own (already low)
ratings by ~12–14 pts/match against everyone, at every gap size. Nothing asymmetric is
needed for the rest of the league.

## 3. Confirmatory sweeps (both negative, as the diagnostic predicts)

### Flat `margin_per_rating_point` (closing the "never swept" item)

| mprp | LogLoss | ΔLL | MAE | ΔMAE |
|---|---|---|---|---|
| 0.060 | 0.8526 | +0.0041 | 26.556 | +0.248 |
| 0.070 | 0.8485 | baseline | 26.309 | — |
| **0.075** | **0.8479** | **−0.0006** | 26.223 | −0.085 |
| 0.080 | 0.8482 | −0.0002 | 26.191 | −0.118 |
| 0.090 | 0.8515 | +0.0031 | 26.292 | −0.017 |

Note: for LogLoss, only the ratio `mprp/sigma` enters the probability head, so this sweep
is mathematically equivalent to the existing sigma sweeps — mprp 0.075 @ sigma 36 ≡
sigma 33.6 @ mprp 0.07, and indeed reproduces the known sub-noise −0.0006. The only new
information is MAE (−0.12 at 0.08), also sub-noise. **Closed; do not re-sweep either knob
separately.**

### Convex piecewise margin map

`margin = 0.07×gap` below rating-gap threshold τ, slope s2 above (signed). Swept
τ ∈ {150…350}, s2 ∈ {0.08…0.15} (25 combos). Best: τ=150, s2=0.08 → LogLoss 0.8474
(**−0.0010**), paired bootstrap (mulberry32 seed 42, 1000 iter) 95% CI
**[−0.0032, +0.0015]** — includes zero. Steeper tails are actively harmful (s2=0.15 →
+0.0182). Rejected.

## 4. Oracle bound for B2 (in-sample, residual-fitted — upper bound only)

Fixed margin shift against WCE/North (their identity hand-picked from residuals, so this
is the ceiling, not an estimate):

| shift (pts) | LogLoss | ΔLL | ΔMAE |
|---|---|---|---|
| 6 | 0.8405 | −0.0080 | −0.250 |
| 10 | 0.8376 | −0.0109 | −0.331 |
| 14 | 0.8363 | **−0.0121** | −0.346 |

The ceiling (−0.012) matches the magnitude of the v2 (−0.0120) and v3 (−0.0128) wins.
Even half of it surviving a walk-forward, shrunk, no-team-identity implementation would
clear the promotion bar.

## Implications

1. **Do not pursue global nonlinearity** in the rating→margin map; the linear 0.07 is fine
   for the league at large. Add to the do-not-redo list.
2. **B2 (team-level performance-vs-rating offsets) is now the highest-value modelling
   target**: a slow-moving per-team offset learned walk-forward from margin residuals,
   heavily shrunk (James-Stein toward 0). Design constraints from this diagnostic:
   - One-sided in effect but symmetric in mechanism — let the data find WCE/North rather
     than encoding cellar-ness.
   - Walk-forward only; the oracle uses hindsight identity. Expect well under the ceiling.
   - **Cross-era replication required** before believing it (2018–19 cellar teams: Gold
     Coast, Carlton) — naturally falls out of A1's window expansion. Risk remains
     residual-chasing.
3. The Task 23 reframe is sharpened further: not "margins against bad teams aren't extreme
   enough" in general, but "two specific teams persistently underperform their ratings".
   Candidate causal stories (list management, tanking-era effort, mass personnel churn)
   are team-level states, which is what B2 models.

## Artifacts

Diagnostic scripts: `/tmp/b1_tail.py`, `/tmp/b1_sweep.py` (offline-exact, ad-hoc per Task
22 convention; replica verified before any delta was trusted). No configs created, no
engine changes, 2026 gate untouched.
