# Task 35 (D1): Learned Stacking Head — Killed

**Date:** 2026-06-13
**Verdict:** **D1 is dead.** Three walk-forward stack variants over the engine's
features all score *significantly worse* than v3's hand-tuned two-coefficient blend —
on LogLoss (pooled CIs exclude zero on the wrong side) *and* on tips (−14 to −32 across
the scored windows). The "capture several individually-sub-bar effects jointly"
hypothesis is refuted: the joint model cannot even hold the baseline. With T33 (no
exploitable miss pattern) and T34 (market adds ~nothing recent), this closes the last
structural bet on v3's existing information set.

## Design (pre-registered before fitting)

Features per match, all from persisted records (no engine changes): Elo diff, PAV zone
diffs (off/mid/def), T22/T33 venue-bucket dummies, rest diff (clipped ±10, from record
schedule), round-phase dummies — 12 features + intercept.

- **M1** ridge on margin; prob via engine CDF (σ=36). Primary.
- **M2** L2 logistic on home win. Secondary.
- **Stack-lite** ridge over v3's own two features {Elo diff, PAV total diff} — harness
  sanity check.
- **M3** *(post-hoc steelman, declared before running)*: ridge on v3's residuals, all
  coefficients penalised, so λ→∞ recovers v3 exactly — shrinkage toward the incumbent
  rather than toward zero, grid extended to 3000.

Protocol: per-round expanding refit within era pools (2016–19 | 2021–26), min 200
training matches with exact-v3 fallback before that (paired deltas zero there), λ from
{3…300} ({3…3000} for M3) by forward-chained 80/20 validation strictly inside the
training set, continuous features z-scored on training stats. `rating_points` excluded
(needs a DB pull; r 0.90–0.95 with PAV at the consumed level per T29, so it cannot
rescue the result). Scoring: engine `metrics.ts` + `bootstrapCompareStratified`
(seed 42/1000) via `analysis/task35-stack-eval.ts`.

**Sanity:** stack-lite recovers v3's margins at corr 0.992 (early) / 0.997 (recent),
mean |diff| 5.7 / 2.8 pts — the walk-forward harness can find the incumbent when the
incumbent is the truth. The failures below are not harness artifacts.

## Results (candidate − v3)

| Variant | Window | Tips Δ | Close band | ΔLogLoss |
|---|---|---|---|---|
| M1 ridge | early 16–19 | −10 | 230→220 /410 | +0.0142 |
| M1 ridge | primary 21–25 | −4 | 299→295 /533 | +0.0101 |
| M1 ridge | 2026 R1–13 | −5 | 34→29 /49 | −0.0082 |
| M2 logistic | early | −19 | 230→211 | +0.0157 |
| M2 logistic | primary | −13 | 299→286 | +0.0137 |
| M2 logistic | 2026 | −4 | 34→30 | −0.0003 |
| M3 residual | early | −2 | 230→228 | +0.0108 |
| M3 residual | primary | −11 | 299→288 | +0.0091 |
| M3 residual | 2026 | −4 | 34→30 | −0.0023 |

Pooled stratified bootstrap (early+primary): M1 ΔLL **+0.0119** [+0.0045, +0.0198];
M2 **+0.0146** [+0.0081, +0.0211] with Δtip% CI also excluding zero (negative);
M3 **+0.0098** [+0.0044, +0.0162]. Median chosen λ: ridge 100, logistic 30,
residual 1000 (the M3 selector pushed toward "do nothing" and the residual model
*still* lost — its learned corrections are noise with a positive price).

## Why it fails

1. **The features carry no incremental signal.** Every feature beyond Elo/PAV was
   individually sub-noise or dead in prior tasks (venue buckets T22, rest T26, phase
   T27, neutral HA T33). Joint estimation cannot conjure signal from noise — it can
   only spend variance on it. The D1 pitch had the logic backwards.
2. **Walk-forward refitting is expensive.** Even the two-feature lite model pays a
   2.8–5.7-pt margin wobble vs fixed coefficients; with 12 features the wobble grows
   and close-game signs flip. The 2024-class chaos seasons punish any model that chases
   recent residuals — same mechanism as v4's tips failure (T32).
3. **The fairness caveat cuts the right way.** v3's params are in-sample for 2021–25,
   but the early window — where v3's coefficients were transported, not tuned — is the
   stack's *worst* window. The incumbent's structure generalises; the stack doesn't.
4. 2026's small LogLoss gains (−0.002…−0.008) come with −4/−5 tips on 49 close games —
   the v4 trade again, in miniature.

## Disposition

- **Documented negative.** Do not re-propose a learned head over the *existing*
  feature set. Resurrection condition: a new feature that first survives a univariate
  pre-registered test (the standing bar) — e.g. DOB/age priors after the afl-stats
  backfill (T30), or a genuinely new data feed. A stack is a combiner, not a source.
- The 2027 comp position stands as after T34: v3-class skill + variance. Remaining live
  modelling work = **A2 end-of-2026 bundle** (incl. neutral≈0) and the **v4 tips-first
  re-eval** at season end.

## Artifacts

- `analysis/stacking-head-walkforward.py` (M1/M2/M3 + lite sanity; uv run --with numpy)
- `analysis/task35-stack-eval.ts` (engine-exact scoring + official bootstrap)
- No engine or config changes; no promotion
