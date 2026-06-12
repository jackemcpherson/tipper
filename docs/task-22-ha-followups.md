# Task 22: Prediction-HA Follow-ups — Backwards Validation, Bucketed HA, Win-Prob Head

**Date:** 2026-06-12
**Baseline:** `predha-080` (v3) — 2021–2025 LogLoss 0.8485, tips 68.1%, MAE 26.31
**Verdict:** No change. v3 stands. All five HANDOFF directions resolved; none clears the
promotion bar. The bucketed-HA structure is real but ~2–4× too small to promote at the
current sample size — re-test when the evaluation window grows.

## Method note: offline evaluation of prediction-side changes

`prediction_home_advantage`, sigma, and the margin→probability mapping affect predictions
only, never state updates. Any change to them is therefore *exactly* evaluable from the
match-level records persisted in results files, without re-running backtests: subtract the
run's HA contribution from `predictedMargin`, apply the candidate adjustment, and recompute
probability/metrics with the engine's own CDF approximation and the `metrics.ts` conventions
(draws scored as away wins for LogLoss; clamp 0.01/0.99). The flat-80 replica reproduces the
official 0.8485 to four decimals. All sweeps below used this; real backtests were run only
where new configs were created.

## 1. Backwards validation 2018–2019 under v3 (HANDOFF #2)

`v2-backwards` re-run first: reproduces Task 18 exactly (0.8845, 414 matches). Measured
home edge on the window: mean actual margin **+5.15**, mean predicted +0.58 → bias **4.57
pts**, implied HA ≈ **65**.

**The HANDOFF premise was wrong:** the 2018–2019 home edge is *smaller* than 2021–2025's
(4.57 vs 5.58 pts), not the ~9–10 pt historical figure (that figure belongs to earlier
decades). New configs `predha-bw-{040,065,080,100,130}` (v2-backwards + prediction HA):

| pred HA | Tips | MAE | LogLoss | Δ vs 0.8845 |
|---|---|---|---|---|
| 0 (v2) | 65.4% | 28.08 | 0.8845 | — |
| 40 | 65.4% | 27.72 | 0.8765 | −0.0080 |
| **65** | 66.1% | 27.58 | **0.8752** | **−0.0093** |
| 80 | 67.1% | 27.54 | 0.8758 | −0.0087 |
| 100 | 66.8% | 27.52 | 0.8781 | −0.0064 |
| 130 | 65.4% | 27.63 | 0.8849 | +0.0004 |

Clean U-shape, optimum exactly at the measured era bias. **HA=80 generalises backwards**
(within 0.0006 of the era optimum); 130 would erase the entire benefit.

## 2. Era-estimated / rolling HA (HANDOFF #3) — unnecessary

Direct consequence of #1: the optimum tracks the measured era bias, and the cost of using
fixed 80 instead of the per-era optimum is ≤0.0006 in both eras tested. A walk-forward HA
estimator has almost nothing to recover. Dropped. The cheap seasonal re-sweep once 2026
completes (Task 20 caveat) remains worthwhile.

## 3. Residual diagnostics (HANDOFF #4) and bucketed prediction HA (HANDOFF #1)

### Diagnostics on `predha-080` 2021–2025 match records

Classification by team-state/venue-state with secondary home grounds (Hawthorn→UTAS,
North→Ninja/Blundstone, GWS→Manuka, Gold Coast→TIO/Cairns, Melbourne→Traeger; MCG and
Marvel are shared venues). Residual = actual − predicted margin:

| Segment | n | Residual | Implied HA |
|---|---|---|---|
| Same-state derby at shared venue (MCG/Marvel) | 259 | **−5.11** | ≈ 7 |
| Same-state at true home ground (Kardinia etc.) | 64 | **+8.01** | ≈ 194 |
| Interstate visitor at true home ground | 487 | +1.92 | ≈ 107 |
| Interstate visitor at shared venue | 196 | −0.61 | ≈ 71 |
| Neutral (home side travelled) | 56 | −0.39 | ≈ 74 |

Per-season sign consistency (2021–2025): derby-at-shared negative all five seasons;
true-home-same-state positive all five (and not just Geelong: non-Geelong +6.4);
true-home-interstate noisy (sign flips season to season).

Other cuts: finals residual −2.71 (n=45) — interesting but tiny sample; round-phase flat;
favourite-strength flat; per-team table still led by West Coast (−16.7, t=−4.8) and North
Melbourne (−11.0, t=−3.6) — the known Elo era-lag problem, unchanged by v3.

### Cross-era replication on 2018–2019 (independent check, vs flat-80 predictions)

| Bucket | 2021–25 implied HA | 2018–19 implied HA | Replicates? |
|---|---|---|---|
| Derby at shared venue | ≈ 7 | ≈ −24 (n=111) | **Yes** — derbies want ~zero HA |
| True home, same-state | ≈ 194 | ≈ +14 (n=27) | **No — sign flips.** Era-specific (Geelong's 2021–25 Kardinia run), not structure |
| True home, interstate | ≈ 107 | ≈ +106 (n=194) | **Yes** — ~105–110 both eras |
| Shared venue, interstate | ≈ 71 | ≈ +117 (n=77) | No (noisy both eras) |

### Bucketed-HA evaluation (2021–2025, offline-exact, paired bootstrap seed 42/1000 iter)

| Candidate | LogLoss | Δ | 95% CI |
|---|---|---|---|
| Derived 2-bucket {derby 10, true-home-same 195} | 0.8452 | −0.0033 | [−0.0099, +0.0024] |
| Fitted 3-bucket {derby 30, ths 205, thi 110} | 0.8439 | −0.0045 | [−0.0114, +0.0017] |
| In-sample optimum, all 5 free | 0.8424 | −0.0061 | (maximally overfit) |
| **Era-stable 2-bucket {derby 20, thi 110}** | 0.8461 | −0.0024 | [−0.0079, +0.0029] |
| Era-stable 2-bucket on 2018–2019 | 0.8739 | −0.0019 | [−0.0109, +0.0070] |

**Rejected for promotion.** Even the best parsimonious candidate (−0.0045) is below the
0.005 bar and no CI excludes zero; the only era-stable variant is worth ~−0.002 per window.
The structure is genuine (smooth 1-D curves, consistent signs across five seasons and two
eras for the two stable buckets) — the effect is simply too small relative to match noise
on 1062 matches. No schema or engine change was made: the offline evaluation is exact, so
implementing the feature to confirm a sub-bar result would add dead config surface.

**2026 was deliberately not evaluated** — the monitoring window stays unburned as the OOS
gate for a future re-test (e.g. end of 2026, ~1270 in-sample matches, where a real ~0.002–
0.004 effect may clear the bar).

## 4. Win-probability head refinement (HANDOFF #5)

All offline-exact on `predha-080` records (margins unchanged; only the prob mapping varies):

- **Sigma re-sweep:** optimum 33–34, Δ −0.0006 — confirms the Task 20 interaction-sweep
  reading; sub-noise, keep 36.
- **Heteroscedastic sigma** (a + b·|margin|): best a=38, b=−0.2 → Δ −0.0011, CI
  [−0.0045, +0.0024]. Direction matches the calibration table (wider for toss-ups,
  narrower for favourites) but sub-noise.
- **Heavier tails (logistic head):** no gain at matched scale; worse beyond.

**Rejected.** The margin→probability head is calibrated; the 50–60% bucket overconfidence
in the calibration table is noise-level once the HA bias is removed.

## Artifacts

- New configs + results: `predha-bw-040/065/080/100/130`, fresh `v2-backwards` results file.
- Bucket classification maps (team→state, venue→state, secondary homes, shared venues) are
  reproduced in this doc's diagnostics section and in the HANDOFF re-test note.
