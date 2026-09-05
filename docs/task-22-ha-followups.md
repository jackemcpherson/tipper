# Task 22: Prediction-HA Follow-Ups: Backwards Validation, Bucketed HA, Win-Prob Head

**Date:** 2026-06-12 **Baseline:** `predha-080` (v3): 2021-2025 LogLoss 0.8485,
tips 68.1%, MAE 26.31 **Verdict:** No change. V3 stands. All five HANDOFF
directions resolved. None clears the promotion bar. The bucketed-HA structure is
real but ~2-4× too small to promote at the current sample size: re-test when the
evaluation window grows.

## Method Note: Offline Evaluation of Prediction-Side Changes

`prediction_home_advantage`, sigma, and the margin to probability mapping affect
predictions only, never state updates. Match-level result records can therefore
evaluate any change exactly without another backtest. Subtract the run's HA
contribution from `predictedMargin` and apply the candidate adjustment. Then
recompute metrics with the engine's CDF approximation and the `metrics.ts`
conventions (draws scored as away wins for LogLoss. Clamp 0.01/0.99). The
flat-80 replica reproduces the official 0.8485 to four decimals.

All sweeps below used this result.

We ran real backtests only when we created new configs.

## 1. Backwards Validation 2018-2019 Under V3 (HANDOFF #2)

`v2-backwards` re-run first: reproduces Task 18 exactly (0.8845, 414 matches).
Measured home edge on the window: mean actual margin **+5.15**, mean predicted
+0.58 to bias **4.57 pts**, implied HA ≈ **65**.

**The HANDOFF premise was wrong:** The 2018-2019 home edge is 4.57 points versus
5.58 in 2021-2025. The 9-10-point historical figure belongs to earlier decades.
New configs `predha-bw-{040,065,080,100,130}` (v2-backwards + prediction HA):

| pred HA | Tips  | MAE   | LogLoss    | Δ vs 0.8845   |
| ------- | ----- | ----- | ---------- | ------------- |
| 0 (v2)  | 65.4% | 28.08 | 0.8845     | Not available |
| 40      | 65.4% | 27.72 | 0.8765     | −0.0080       |
| **65**  | 66.1% | 27.58 | **0.8752** | **−0.0093**   |
| 80      | 67.1% | 27.54 | 0.8758     | −0.0087       |
| 100     | 66.8% | 27.52 | 0.8781     | −0.0064       |
| 130     | 65.4% | 27.63 | 0.8849     | +0.0004       |

Clean U-shape, optimum exactly at the measured era bias. **HA=80 generalises
backwards** (within 0.0006 of the era optimum). 130 would erase the entire
benefit.

## 2. Era-Estimated / Rolling HA (HANDOFF #3): Unnecessary

The optimum tracks the measured era bias. Using a fixed 80 instead of the
per-era optimum costs at most 0.0006 in either tested era. A walk-forward HA
estimator has almost nothing to recover. Dropped. The cheap seasonal re-sweep
once 2026 completes (Task 20 caveat) remains worthwhile.

## 3. Residual Diagnostics (HANDOFF #4) and Bucketed Prediction HA (HANDOFF #1)

This analysis tests whether prediction residuals support a structured
adjustment.

### Diagnostics on `predha-080` 2021-2025 Match Records

Classification uses team and venue states, including secondary home grounds.
Those mappings cover Hawthorn to UTAS, North to Ninja or Blundstone, and GWS to
Manuka. They also cover Gold Coast to TIO or Cairns and Melbourne to Traeger.
Teams share the MCG and Marvel. Residual = actual − predicted margin:

| Segment                                                     | n   | Residual  | Implied HA |
| ----------------------------------------------------------- | --- | --------- | ---------- |
| Same-state derby at shared venue (MCG/Marvel)               | 259 | **−5.11** | ≈ 7        |
| Same-state at true home ground (Kardinia and similar items) | 64  | **+8.01** | ≈ 194      |
| Interstate visitor at true home ground                      | 487 | +1.92     | ≈ 107      |
| Interstate visitor at shared venue                          | 196 | −0.61     | ≈ 71       |
| Neutral (home side travelled)                               | 56  | −0.39     | ≈ 74       |

Per-season sign consistency (2021-2025): derby-at-shared negative all five
seasons. True-home-same-state positive all five (and not just Geelong:
non-Geelong +6.4). True-home-interstate noisy (sign flips season to season).

Other cuts: finals residual −2.71 (n=45): interesting but tiny sample. Round
phase and favourite strength remain flat. West Coast (−16.7, t=−4.8) and North
Melbourne (−11.0, t=−3.6) still lead the per-team table. This pattern is the
known Elo era-lag problem, unchanged by v3.

### Cross-Era Replication on 2018-2019 (Independent Check, Versus Flat-80 Predictions)

| Bucket                   | 2021-25 implied HA | 2018-19 implied HA | Replicates?                                                                      |
| ------------------------ | ------------------ | ------------------ | -------------------------------------------------------------------------------- |
| Derby at shared venue    | ≈ 7                | ≈ −24 (n=111)      | **Yes**: derbies want ~zero HA                                                   |
| True home, same-state    | ≈ 194              | ≈ +14 (n=27)       | **No: sign flips.** Era-specific (Geelong's 2021-25 Kardinia run), not structure |
| True home, interstate    | ≈ 107              | ≈ +106 (n=194)     | **Yes**: ~105-110 both eras                                                      |
| Shared venue, interstate | ≈ 71               | ≈ +117 (n=77)      | No (noisy both eras)                                                             |

### Bucketed-HA Evaluation (2021-2025, Offline-Exact, Paired Bootstrap Seed 42/1000 Iter)

| Candidate                                       | LogLoss | Δ       | 95% CI              |
| ----------------------------------------------- | ------- | ------- | ------------------- |
| Derived 2-bucket {derby 10, true-home-same 195} | 0.8452  | −0.0033 | [−0.0099, +0.0024]  |
| Fitted 3-bucket {derby 30, ths 205, thi 110}    | 0.8439  | −0.0045 | [−0.0114, +0.0017]  |
| In-sample optimum, all 5 free                   | 0.8424  | −0.0061 | (maximally overfit) |
| **Era-stable 2-bucket {derby 20, thi 110}**     | 0.8461  | −0.0024 | [−0.0079, +0.0029]  |
| Era-stable 2-bucket on 2018-2019                | 0.8739  | −0.0019 | [−0.0109, +0.0070]  |

**Rejected for promotion.** Even the best parsimonious candidate (−0.0045) is
below the 0.005 bar and no CI excludes zero. The only era-stable variant is
worth about −0.002 per window. Smooth one-dimensional curves and consistent
signs support the structure across five seasons and two eras. However, the
effect remains too small against match noise across 1,062 matches.

We made no schema or engine change. The offline evaluation is exact, so
implementing the feature to confirm a sub-bar result would add dead config
surface.

**The evaluation deliberately excludes 2026.** The monitoring window remains an
unused OOS gate for a future retest. By the end of 2026, about 1,270 in-sample
matches may let a real 0.002-0.004 effect clear the bar.

## 4. Win-Probability Head Refinement (HANDOFF #5)

All offline-exact on `predha-080` records (margins unchanged. Only the prob
mapping varies):

- Sigma re-sweep: optimum 33-34, Δ −0.0006: confirms the Task 20
  interaction-sweep reading. Sub-noise, keep 36.
- Heteroscedastic sigma (a + b·|margin|): best a=38, b=−0.2 to Δ −0.0011, CI
  [−0.0045, +0.0024]. Direction matches the calibration table (wider for
  toss-ups, narrower for favourites) but sub-noise.
- Heavier tails (logistic head): no gain at matched scale. Worse beyond.

**Rejected.** The margin-to-probability head has sound calibration. Removing the
HA bias reduces the 50-60% bucket's overconfidence to noise level.

## Artefacts

- New configs + results: `predha-bw-040/065/080/100/130`, fresh `v2-backwards`
  results file.
- Bucket classification maps (team to state, venue to state, secondary homes,
  shared venues) are reproduced in this doc's diagnostics section and in the
  HANDOFF re-test note.
