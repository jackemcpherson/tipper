# Task 35 (D1): Learned Stacking Head: Killed

**Date:** 2026-06-13

**Verdict:** **D1 is dead.** Three walk-forward stack variants score
significantly worse than v3's hand-tuned blend. Both LogLoss and tips decline,
with pooled intervals excluding zero on the wrong side. The evidence refutes the
"capture several individually-sub-bar effects jointly" hypothesis. The joint
model cannot even hold the baseline. With T33 (no exploitable miss pattern) and
T34 (market adds ~nothing recent), this closes the last structural bet on v3's
existing information set.

## Design (Pre-Registered Before Fitting)

Each match uses 12 features plus an intercept from persisted records. Features
include Elo and PAV zone differences, T22/T33 venue buckets, and round phase.
Rest difference comes from the schedule and clips at ±10.

- M1 ridge on margin. Prob via engine CDF (σ=36). Primary.
- M2 L2 logistic on home win. Secondary.
- Stack-lite ridge over v3's own two features {Elo diff, PAV total diff}:
  framework sanity check.
- M3 _(post-hoc steelman, declared before running)_: ridge on v3's residuals,
  all coefficients penalised, so λ to ∞ recovers v3 exactly: shrinkage toward
  the incumbent rather than toward zero, grid extended to 3000.

The protocol uses an expanding per-round refit within 2016-19 and 2021-26 era
pools. It requires 200 training matches and uses exact v3 before that point. The
validation selects λ from 3-300, or 3-3,000 for M3, through a forward-chained
80/20 split. Strictly inside the training set, continuous features z-scored on
training stats.

`rating_points` excluded (needs a DB pull. R 0.90-0.95 with PAV at the consumed
level per T29, so it cannot rescue the result). Scoring: engine `metrics.ts` +
`bootstrapCompareStratified` (seed 42/1000) via `analysis/task35-stack-eval.ts`.

**Sanity:** The stack-lite model recovers v3's margins with correlations of 0.992
early and 0.997 recently. Mean absolute differences are 5.7 and 2.8 points. The
walk-forward framework can find the incumbent when the incumbent is the truth.
The failures below are not framework artefacts.

## Results (Candidate − V3)

| Variant     | Window        | Tips Δ | Close band      | ΔLogLoss |
| ----------- | ------------- | ------ | --------------- | -------- |
| M1 ridge    | early 16-19   | −10    | 230 to 220 /410 | +0.0142  |
| M1 ridge    | primary 21-25 | −4     | 299 to 295 /533 | +0.0101  |
| M1 ridge    | 2026 R1-13    | −5     | 34 to 29 /49    | −0.0082  |
| M2 logistic | early         | −19    | 230 to 211      | +0.0157  |
| M2 logistic | primary       | −13    | 299 to 286      | +0.0137  |
| M2 logistic | 2026          | −4     | 34 to 30        | −0.0003  |
| M3 residual | early         | −2     | 230 to 228      | +0.0108  |
| M3 residual | primary       | −11    | 299 to 288      | +0.0091  |
| M3 residual | 2026          | −4     | 34 to 30        | −0.0023  |

Pooled stratified bootstrap (early+primary): M1 ΔLL **+0.0119** [+0.0045,
+0.0198]. M2 **+0.0146** [+0.0081, +0.0211] with Δtip% CI also excluding zero
(negative). M3 **+0.0098** [+0.0044, +0.0162]. Median selected λ values were 100
for ridge, 30 for logistic, and 1,000 for residual. The M3 selector approached
"do nothing", but the residual model still lost. Its learned corrections add
noise with a positive price).

## Why It Fails

1. The features carry no incremental signal. Every feature beyond Elo/PAV was
   individually sub-noise or dead in prior tasks (venue buckets T22, rest T26,
   phase T27, neutral HA T33). Joint estimation cannot conjure signal from
   noise: it can only spend variance on it. The D1 pitch had the logic
   backwards.
2. Walk-forward refitting is expensive. Even the two-feature lite model pays a
   2.8-5.7-pt margin wobble vs fixed coefficients. With 12 features the wobble
   grows and close-game signs flip. The 2024-class chaos seasons punish any
   model that chases recent residuals: same mechanism as v4's tips failure
   (T32).
3. The fairness caveat cuts the right way. V3's params are in-sample for
   2021-25, but the early window: where v3's coefficients were transported, not
   tuned: is the stack's _worst_ window. The incumbent's structure generalises.
   The stack does not.
4. 2026's small LogLoss gains (−0.002…−0.008) come with −4/−5 tips on 49 close
   games: the v4 trade again, in miniature.

## Disposition

- Documented negative. Do not re-propose a learned head over the _existing_
  feature set. Resurrection condition: a new feature that first survives a
  univariate pre-registered test (the standing bar): for example DOB/age priors
  after the afl-stats backfill (T30), or a genuinely new data feed. A stack is a
  combiner, not a source.
- The 2027 comp position is after T34: v3-class skill + variance. Remaining live
  modelling work = **A2 end-of-2026 bundle** (incl. Neutral≈0) and the **v4
  tips-first re-eval** at season end.

## Artefacts

- `analysis/stacking-head-walkforward.py` (M1/M2/M3 plus lite sanity, run with
  `uv run --with numpy`).
- `analysis/task35-stack-eval.ts` (engine-exact scoring + official bootstrap).
- No engine or config changes. No promotion.
