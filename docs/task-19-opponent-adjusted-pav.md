# Task 19: Opponent-Adjusted PAV

**Date:** 2026-06-12
**Verdict:** Rejected — flat to slightly negative at all alpha values.

## Prelude: harness fixes and baseline re-establishment

Three pre-existing infrastructure bugs were found and fixed before any experiment ran:

1. **Warm-up gap (Task 6 bug, still live).** `runBacktest` fetched only `train_seasons + test_seasons`, so `backtest -s 2026` jumped from 2020 Elo state straight to 2026 with an empty 2025 PAV prior. The documented Task 6 fix (implicit warm-up of intermediate seasons) was never implemented. Now fixed in `runBacktest` *and* `runPrediction` — the live `predict` command had the same gap (it fetched `[train, season−1, season]`, leaving Elo 4+ years stale for 2026 predictions).
   - 2026 monitoring before fix: 57.0% tips, 0.9725 LogLoss (invalid).
   - 2026 monitoring after fix: 71.9% tips, 0.8331 LogLoss (115 matches through R13).
2. **Results-file collision.** `results-<date>.json` meant a scope-overridden run overwrote a same-day promotion-valid run. Filenames now include the short config hash.
3. **Promotion guardrail ordering.** `validatePromotion` only checked the lexically-latest results file; a same-day override run would block a legitimate promotion. Now accepts any results file whose hash matches the current config content (the hash covers `test_seasons`, so override runs still can't satisfy it — COR-09 preserved).
4. **Stale wrangler token.** CLI token resolution now skips expired OAuth tokens and prefers the freshest across wrangler config locations.

**Re-established baselines (pavfix-blend-w06, data through 2026-06-11):**

| Window | Tips | LogLoss | MAE | Brier |
|---|---|---|---|---|
| 2021–2025 (scored) | 66.3% | 0.8612 | 26.77 | 0.2062 |
| 2026 monitoring (115 m) | 71.9% | 0.8331 | 26.91 | 0.1968 |

The scored baseline differs from the recorded 0.8607 by 0.0005 (D1 data revisions since April) — well below the noise floor. The 2026 number delivers the deferred "re-evaluate at Round 12+" check: the early-season lead (77.8% tips at 63 matches) has narrowed to 71.9% at 115, as the v2 validation predicted it might.

## Hypothesis

PAV stats accumulate raw, so production against weak opponents counts the same as against strong ones. Down-weighting weak-schedule production should sharpen team PAV.

## Design

Elo-scaled schedule adjustment. The harness records each team's pre-match opponent quality delta `(opp_elo − initial) / 400` into the PAV state (`oppQualitySum`). At PAV computation, all three zone pools are scaled by `1 + α × avg(opp quality delta)`, clamped at 0.

*Design note:* the originally sketched per-match stat scaling was abandoned during implementation — all three team-strength measures are ratios (points per i50, i50 for/against), so a uniform per-match scaling cancels out. The pool-level multiplier is where the adjustment cannot cancel.

`α` is a new optional config field `pav.opponent_adjustment_alpha` (absent = 0 = exact v2 behavior; verified by identity backtest, hash 932184a8, LogLoss 0.8612 unchanged).

## Results (2021–2025, vs baseline 0.8612)

| α | Tips | LogLoss | Δ |
|---|---|---|---|
| 0.25 | 66.3% | 0.8611 | −0.0001 |
| 0.50 | 66.3% | 0.8612 | 0.0000 |
| 0.75 | 66.7% | 0.8617 | +0.0005 |
| 1.00 | 66.7% | 0.8624 | +0.0012 |

## Conclusion

Flat at the noise floor for small α, mildly negative for large α. The schedule signal is already carried by the Elo side of the blend (60% weight); adjusting the PAV side adds nothing. Rejected; no grid refinement warranted. The engine support remains (inert at default) for possible reuse if the blend weight ever shifts heavily toward PAV.
