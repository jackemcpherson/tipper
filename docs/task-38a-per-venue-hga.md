# Task 38a — Per-venue prediction HGA (KILLED)

**Date:** 2026-06-16
**Status:** **Killed.** Engine machinery ships inert; no config promoted.
**Reads:** [`task-38-wheelo-closure-roadmap.md`](task-38-wheelo-closure-roadmap.md), [`task-32-squiggle-rerank.md`](task-32-squiggle-rerank.md), [`../analysis/wheelo-headhead-2026-06-16.md`](../analysis/wheelo-headhead-2026-06-16.md).

## Headline

Walk-forward per-venue prediction HGA, added as a delta on top of v3's static 80 rating-pt HGA, **does not clear the bar**. Both pre-registered shrinkage variants (α=1, α=0.5; min_n=5) fail in different ways and the result is incoherent across the primary and confirmatory windows.

| Metric | bar | α=1 primary | α=0.5 primary | α=1 early | α=0.5 early |
|---|---|---|---|---|---|
| ΔLogLoss vs v3 | < −0.005, CI excl 0 | −0.0031, CI [−0.007, +0.013] | −0.0033, CI [−0.003, +0.010] | **+0.0138 (worse)** | **+0.0042 (worse)** |
| CI excludes zero | required | no | no | (n/a — direction reversal) | (n/a — direction reversal) |
| Pooled Δtips vs v3 | ≥ 0 (hard) | **−4** | **−4** | +3 | +4 |
| Recent-3 Δtips | ≥ 0 (hard) | +1 | −2 | n/a | n/a |

Both variants fail at least one hard guard in the pre-registered bar:

- Pooled tip regression on the primary window (both −4). The bar is "no pooled tip regression" — hard kill.
- ΔLogLoss CI on the primary window includes zero for both — fails strict significance.
- Direction reversal between primary and early windows (primary slightly better, early significantly worse) — fails the confirmatory criterion ("same direction, magnitude within 50%").

α=1's marginal recent-3 gain (+1 tip pooled over 2023–25) is the only positive comp-currency signal and is well within sampling noise.

## Numbers in full

Baseline (v3, `predha-080`, hash `2641f46f…`):
- Primary 2021–25 (n=1062): 716 tips (68.06%), LogLoss 0.8485.
- Early 2016–19 (n=828, via `predha80-early`): 554 tips (67.23%), LogLoss 0.8555.

### α=1 (`predha80-venha-a10-n5`, hash `ba0291ab…`) — primary

| Season | v3 tips | α=1 tips | Δ | v3 LL | α=1 LL | ΔLL |
|---|---:|---:|---:|---:|---:|---:|
| 2021 | 131 | 127 | −4 | 0.9428 | 0.9471 | +0.0044 |
| 2022 | 146 | 145 | −1 | 0.8228 | 0.8290 | +0.0062 |
| 2023 | 144 | 143 | −1 | 0.8727 | 0.8639 | −0.0088 |
| 2024 | 140 | 145 | **+5** | 0.8394 | 0.8355 | −0.0039 |
| 2025 | 155 | 152 | −3 | 0.7676 | 0.7549 | −0.0127 |
| **Pool** | **716** | **712** | **−4** | **0.8485** | **0.8454** | **−0.0031** |

Bootstrap (paired by match, seed 42, n_iter 1000): ΔLogLoss −0.0031, CI [−0.0069, +0.0132] (includes zero); ΔTipPct +0.0038, CI [−0.0114, +0.0191] (includes zero).

Pattern: 2021–22 regress (early warm-up phase, sparse venue residuals), 2023–25 improve as state warms. By 2025, ΔLL is −0.013 — meaningful — but pooled drag from 2021–22 wipes it out.

### α=0.5 (`predha80-venha-a05-n5`, hash `175c5f5c…`) — primary

| Season | v3 tips | α=0.5 tips | Δ | v3 LL | α=0.5 LL | ΔLL |
|---|---:|---:|---:|---:|---:|---:|
| 2021 | 131 | 129 | −2 | 0.9428 | 0.9419 | −0.0008 |
| 2022 | 146 | 146 | 0 | 0.8228 | 0.8275 | +0.0047 |
| 2023 | 144 | 139 | **−5** | 0.8727 | 0.8655 | −0.0071 |
| 2024 | 140 | 144 | +4 | 0.8394 | 0.8363 | −0.0031 |
| 2025 | 155 | 154 | −1 | 0.7676 | 0.7578 | −0.0097 |
| **Pool** | **716** | **712** | **−4** | **0.8485** | **0.8452** | **−0.0033** |

Bootstrap: ΔLogLoss −0.0033, CI [−0.0031, +0.0101] (includes zero); ΔTipPct +0.0038, CI [−0.0095, +0.0172] (includes zero).

α=0.5's recent-3 (2023–25) tips: 437 vs v3's 439 → **−2** — worse than α=1 on the comp-relevant cut.

### Early window — both variants

| Variant | Tips | ΔTips | LogLoss | ΔLL |
|---|---:|---:|---:|---:|
| Baseline `predha80-early` | 554 | — | 0.8555 | — |
| `predha80-venha-a10-n5-early` | 557 | +3 | 0.8693 | **+0.0138 (regression)** |
| `predha80-venha-a05-n5-early` | 558 | +4 | 0.8597 | **+0.0042 (regression)** |

The confirmatory window reverses the LogLoss direction: primary is slightly better, early is significantly worse. Per the pre-registered bar ("same direction, magnitude within 50% of primary") this alone kills both variants.

## What the kill rules out

The Wheelo head-to-head review (`analysis/wheelo-headhead-2026-06-16.md`) showed Wheelo's per-venue HGA range is **21.9 margin pts vs v3's 4.6** — the biggest measured parameter gap. T38a tested the most obvious mechanism for closing it: fit per-venue HGA residuals walk-forward, apply on top of v3's static HGA. The mechanism does not improve v3's tips and only marginally lifts LogLoss (sub-bar, CI includes zero) on the primary window.

Three plausible reasons:

1. **v3's static HGA at 80 rating pts (5.6 margin pts) is already on the global mean.** What's left at each venue is mostly noise — and per-venue mean-residual estimates at n=20–100 are noisy enough to add jitter without signal. The α=0.5 shrinkage softens this but doesn't fix it.
2. **Wheelo's 21.9 pt range likely conflates venue effect with team strength.** WCE/Fremantle play Perth most often; if those teams are stronger than average, the panel regression's per-venue intercept absorbs some of their team rating. Wheelo's intercept range overstates the pure venue contribution. Our walk-forward residual fit also picks up the same conflation, but at the smaller-sample-noise scale.
3. **Self-correcting residuals against full prediction (the team-offset pattern) drift each venue's accumulated mean toward zero in steady state**, so by 2024–25 the active correction is small. Combined with sparse early-season noise, the net effect is a wash with extra variance.

The roadmap noted that the per-venue figures in the Wheelo panel fit had this team-strength leak risk (`wheelo-headhead-2026-06-16.md` §B.2). T38a's null result is consistent with that being most of the apparent 21.9-pt range — there isn't a clean per-venue HGA signal there for v3 to capture.

## Don't relitigate without

T38a does not refute per-venue HGA as a concept; it refutes the simplest walk-forward implementation as a delta on v3's static HGA at v3's data scale. Resurrection conditions:

- **Team-and-venue interaction term** rather than venue-only intercept. Wheelo's number likely has a hidden team-strength component; fitting a (team, venue) random-effect would isolate the venue piece. Heavier engineering, more data needed.
- **Reset semantics:** fit per-venue HGA from a stable pre-trained table (e.g., 2010–2019 OLS on actual margin vs Elo diff, like the existing `venue.ts`) rather than walk-forward residuals. The static-table approach has lower variance but loses adaptation.
- **A2 bundle inclusion:** T38a doesn't pass standalone, but the per-venue HGA mechanism could feature in the A2 end-of-2026 bucketed-HA bundle alongside the T33 neutral-venue piece. The bucketing collapses many venues into a few buckets (derby ≈20, true-home-vs-interstate ≈110, neutral ≈0, else 80) — that's coarser, more sample-efficient, and may avoid the per-venue noise problem T38a hit.

## Engine machinery (ships inert)

The schema field `output.prediction_home_advantage_per_venue: { alpha, min_n }` is added as `.optional()`, never `.default()` (hash stability — `predha-080` still hashes `2641f46f`). The state machine lives in `src/engine/venue-ha.ts` (parallel to `offset.ts`), and the harness wires `venueHaConfig` into both `runHarness` and `runPredict` exactly like `team_offset`. When the field is absent, behavior is bit-identical to v3 (verified by re-running `predha-080` post-change: hash `2641f46f…`, overall LogLoss `0.8485`, 716 tips — matches baseline to the digit).

Unit tests in `tests/engine/venue-ha.test.ts` cover: empty-state default, min_n fallback, α=1 (no shrinkage), α=0.5 (50% mix with global), α=0 (collapse to global), min_n=0 (always use venue mean).

Configs created:
- `predha80-venha-a10-n5` (α=1, min_n=5, primary)
- `predha80-venha-a05-n5` (α=0.5, min_n=5, primary)
- `predha80-venha-a10-n5-early` (early-window confirmatory)
- `predha80-venha-a05-n5-early` (early-window confirmatory)

None promoted. Result files retained for reproducibility.

## Outcome vs Wheelo-closure roadmap

T38a was the lead candidate from the Wheelo review (§2.38a) — the largest measured parameter gap and the most novel structural idea. Its null result narrows the closure path:

- T38a (this task): killed.
- T38c (T28 standalone shot-margin re-test): next, already queued.
- T38b (T36 OD R14+ re-eval): scheduled end-of-2026 per T36 plan.

The Wheelo headline finding ("statistically tied on tips, directional LL gap") therefore loses its most plausible structural explanation. The remaining gap likely lives in the OD-split update mechanic (T38b/T36) rather than per-venue HGA.
