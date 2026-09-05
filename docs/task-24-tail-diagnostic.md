# Task 24 (B1): Tail Diagnostic: Nonlinear Rating to Margin Versus Team-Level Effects

**Date:** 2026-06-12 **Baseline:** `predha-080` (v3): 2021-2025 LogLoss 0.8485,
tips 68.1%, MAE 26.31 **Verdict:** The cellar-dweller tail bias is
**team-specific, not gap-specific**. The evidence rejects a global convex margin
map (best −0.0010, CI includes zero). `margin_per_rating_point` is now swept and
closed (optimum 0.075, worth −0.0006: ratio-equivalent to the known sigma 33-34
result). The residual routes to **B2: per-team performance-vs-rating offsets**,
with a large in-sample oracle bound (−0.012 LogLoss). No promotion. V3 stands.

## Method

Offline-exact from `predha-080` persisted records (1,062 matches, 2021-2025),
per the Task 22 method note. Replica verification: recomputed margins from
`homeTeamRating + 80 − awayTeamRating` × 0.07 match persisted `predictedMargin`
to floating-point exactness (max diff 0.0). Replica metrics reproduce the
official run exactly: LogLoss 0.8485, tips 716 (68.06%), MAE 26.3086, RMSE
33.7779.

Residuals are favourite-oriented: `fav_resid = sign(pred) × actual − |pred|`
(positive = favourite won by more than predicted).

## 1. Pooled Diagnostic: Residuals DO Grow with Predicted Margin…

| fav pred margin | n   | mean resid | t     |
| --------------- | --- | ---------- | ----- |
| [0,5)           | 238 | −1.71      | −0.81 |
| [5,10)          | 221 | −2.50      | −1.06 |
| [10,15)         | 172 | +5.33      | +2.09 |
| [15,20)         | 138 | +2.96      | +1.21 |
| [20,25)         | 91  | +7.03      | +1.78 |
| [25,30)         | 75  | +1.36      | +0.36 |
| [30,40)         | 92  | +5.57      | +1.62 |
| [40,200)        | 35  | +15.58     | +2.42 |

OLS `fav_resid ~ fav_pred`: slope **+0.306** (se 0.091, t 3.37). Taken alone
this looks like convexity: favourites systematically win by more than the linear
map predicts.

## 2. …But the Effect Is Entirely Team-Driven

Large-gap matches (fav pred ≥ 20, n=293):

| Subset                        | n       | mean resid | t         |
| ----------------------------- | ------- | ---------- | --------- |
| all big-gap                   | 293     | +6.14      | +2.99     |
| underdog is WCE/North         | 123     | +14.38     | +4.62     |
| **no WCE/North involved**     | **167** | **+0.66**  | **+0.25** |
| favourite is Bulldogs/Geelong | 58      | +12.34     | +2.43     |
| no WCE/North/WB/Geel involved | 130     | −0.97      | −0.33     |

Control (fav pred 5-20): all +1.45 (t 1.01). Excluding WCE/North +0.17 (t 0.11).

Remove West Coast and North Melbourne and the entire tail effect vanishes. The
pooled slope in §1 is a composition artefact: cellar teams populate the big-gap
bins.

### The Mirror Class Dissolves

| Subset                                      | n   | mean resid | t         |
| ------------------------------------------- | --- | ---------- | --------- |
| big-gap: fav WB/Geel, dog **not** WCE/North | 36  | +6.45      | +1.02     |
| big-gap: fav WB/Geel, dog **is** WCE/North  | 22  | +21.98     | +2.67     |
| big-gap: dog WCE/North, fav not WB/Geel     | 102 | +12.22     | +3.66     |
| all gaps: dog is WCE/North                  | 198 | **+13.93** | **+5.63** |
| all gaps: fav WB/Geel, dog not cellar       | 145 | +5.51      | +1.85     |

The Bulldogs/Geelong "underprediction" is mostly the same matches viewed from
the other side. The phenomenon is **one-sided**: WCE/North underperform their
own (already low) ratings by ~12-14 pts/match against everyone, at every gap
size. The rest of the league needs no asymmetric treatment.

## 3. Confirmatory Sweeps (Both Negative, as the Diagnostic Predicts)

These sweeps test whether simple parameter changes address the diagnosed bias.

### Flat `margin_per_rating_point` (Closing the "Never Swept" Item)

| mprp      | LogLoss    | ΔLL         | MAE    | ΔMAE          |
| --------- | ---------- | ----------- | ------ | ------------- |
| 0.060     | 0.8526     | +0.0041     | 26.556 | +0.248        |
| 0.070     | 0.8485     | baseline    | 26.309 | Not available |
| **0.075** | **0.8479** | **−0.0006** | 26.223 | −0.085        |
| 0.080     | 0.8482     | −0.0002     | 26.191 | −0.118        |
| 0.090     | 0.8515     | +0.0031     | 26.292 | −0.017        |

For LogLoss, only the `mprp/sigma` ratio enters the probability head. This sweep
therefore equals the existing sigma sweeps mathematically. An mprp of 0.075 with
sigma 36 equals sigma 33.6 with mprp 0.07. It reproduces the known sub-noise
−0.0006.

The only new information is MAE (−0.12 at 0.08), also sub-noise. **Closed. Do
not re-sweep either knob separately.**

### Convex Piecewise Margin Map

Below threshold τ, `margin = 0.07×gap`, with signed slope s2 above it. The sweep
tested 25 combinations across τ=150-350 and s2=0.08-0.15. The best combination
used τ=150 and s2=0.08, reaching 0.8474 LogLoss. Its −0.0010 delta produced a
95% paired-bootstrap CI of [−0.0032, +0.0015], which includes zero. Steeper
tails are actively harmful (s2=0.15 to +0.0182). Rejected.

## 4. Oracle Bound for B2 (In-Sample, Residual-Fitted: Upper Bound Only)

Fixed margin shift against WCE/North (their identity hand-picked from residuals,
so this result is the ceiling, not an estimate):

| shift (pts) | LogLoss | ΔLL         | ΔMAE   |
| ----------- | ------- | ----------- | ------ |
| 6           | 0.8405  | −0.0080     | −0.250 |
| 10          | 0.8376  | −0.0109     | −0.331 |
| 14          | 0.8363  | **−0.0121** | −0.346 |

The ceiling (−0.012) matches the magnitude of the v2 (−0.0120) and v3 (−0.0128)
wins. Even half of it surviving a walk-forward, shrunk, no-team-identity
implementation would clear the promotion bar.

## Implications

1. Do not pursue global nonlinearity in the rating to margin map. The linear
   0.07 is fine for the league at large. Add to the do-not-redo list.
2. **B2 (team-level performance-vs-rating offsets) is now the highest-value
   modelling target**: a slow-moving per-team offset learned walk-forward from
   margin residuals, heavily shrunk (James-Stein toward 0). Design constraints
   from this diagnostic:
   - One-sided in effect but symmetric in mechanism: let the data find WCE/North
     rather than encoding cellar-ness.
   - Walk-forward only. The oracle uses hindsight identity. Expect well under
     the ceiling.
   - Cross-era replication required before believing it (2018-19 cellar teams:
     Gold Coast, Carlton): naturally falls out of A1's window expansion. Risk
     remains residual-chasing.
3. The Task 23 reframe is sharpened further: not "margins against bad teams are
   not extreme enough" in general, but "two specific teams persistently
   underperform their ratings". Candidate causal stories (list management,
   tanking-era effort, mass personnel churn) are team-level states, which is
   what B2 models.

## Artefacts

Diagnostic scripts: `/tmp/b1_tail.py`, `/tmp/b1_sweep.py` (offline-exact, ad-hoc
per Task 22 convention. A replica confirmed the results before we trusted any
delta). No configs created, no engine changes, 2026 gate untouched.
