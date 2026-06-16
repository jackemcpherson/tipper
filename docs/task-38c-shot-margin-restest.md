# Task 38c — T28 shot-margin Elo standalone re-test

**Date:** 2026-06-16
**Status:** **Parked (T28 verdict preserved with 2026 OOS warning).** Engine machinery already ships (from T28). No promotion.
**Reads:** [`task-28-scoring-shot-elo.md`](task-28-scoring-shot-elo.md), [`task-32-squiggle-rerank.md`](task-32-squiggle-rerank.md), [`task-38-wheelo-closure-roadmap.md`](task-38-wheelo-closure-roadmap.md).

## Headline

Re-running T28's standalone `shotelo-w100` (`elo.shot_margin_weight: 1`, no team-offset bundle) against the amended T32 bar reproduces T28's headline numbers bit-identically and adds:

- **Tips criterion (T32 amendment) passes on both training windows:** +5 pooled on primary (2021–25), +6 on early (2016–19), **+11 pooled** across the two windows that already informed the T28 decision. Recent-3 (2023–25) tied at 439–439.
- **2026 R1–R14 OOS evidence reverses direction:** ΔTips **−2**, ΔLL **+0.0069** (shotelo regresses).
- **Sliding recent-3 (2024–26):** ΔTips **−4** vs v3. Under T32's comp-facing rule a recent-window tip deficit is disqualifying — currently a warning at half a 2026, not yet a hard call.
- LogLoss bar unchanged from T28: primary point −0.0034 (sub-bar), CI [−0.0042, +0.0107] **includes zero**; pooled (n=1890) −0.0047, CI [−0.0102, +0.0009] **barely includes zero**.

**Decision:** keep `shotelo-w100` parked in the A2 end-of-2026 bundle. Don't promote, don't kill. The pre-2026 evidence (positive direction in both training windows, positive tips, monotone dose-response per T28) still holds. The 2026 partial-season reversal is small-sample (n=121) but pointing the wrong way and consistent with v4's "old eras good, recent years bad" failure mode — it must close before promotion can be reconsidered.

## Re-test against the amended T32 bar

### Bar reminder

1. Primary 2021–25 ΔLL < −0.005 with CI excluding zero.
2. Early 2016–19 confirmatory: same direction, magnitude within 50% of primary.
3. **Tips criterion** (T32 amendment): no pooled tip regression vs incumbent on the scored windows; last-three-seasons tip delta non-negative (deficit = disqualifying for comp-facing).
4. Three regression guards (T38 §3): consensus-wrong cut ΔTips ≥ 0, per-team residual non-degradation, per-venue residual monitor.

### Pre-2026 picture (T28's evidence + tips lens)

Reproduced via `bun run dist/cli/index.js compare` against `predha-080` (v3, hash `2641f46f`) and `predha80-early`:

| Window | n | v3 tips | shotelo-w100 tips | ΔTips | v3 LL | shotelo LL | ΔLL | bootstrap CI |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Primary 2021–25 | 1062 | 716 | 721 | **+5** | 0.8485 | 0.8451 | −0.0034 | [−0.0042, +0.0107] |
| Early 2016–19 | 828 | 554 | 560 | **+6** | 0.8555 | 0.8491 | −0.0064 | [−0.0022, +0.0156] |
| **Pooled (T28)** | **1890** | **1270** | **1281** | **+11** | — | — | **−0.0047** | **[−0.0102, +0.0009]** |

Per-season tips in the primary window:

| Season | v3 | shotelo-w100 | Δ |
|---|---:|---:|---:|
| 2021 | 131 | 132 | +1 |
| 2022 | 146 | 150 | +4 |
| 2023 | 144 | 146 | +2 |
| 2024 | 140 | 137 | **−3** |
| 2025 | 155 | 156 | +1 |
| Recent-3 (2023–25) | 439 | 439 | **0** |
| **Pool** | **716** | **721** | **+5** |

Pre-2026, this is a clean profile against the amended T32 tips criterion: pooled positive, recent-3 tied. The T28 conclusion ("strongest unshipped candidate since v3") stands and the new tips lens does not undermine it.

### 2026 R1–R14 OOS evidence

`bun run dist/cli/index.js backtest --config <id> --season 2026` against the same harness data (`data_through` 2026-06-16, n=121 completed matches in 2026 R1–R14):

| Model | tips | LL |
|---|---:|---:|
| v3 (`predha-080`, scope=[2026]) | 89 / 121 (73.6%) | 0.7761 |
| shotelo-w100 (scope=[2026]) | 87 / 121 (71.9%) | 0.7831 |
| Δ (shotelo − v3) | **−2 tips** | **+0.0069 (worse)** |

This is the first OOS look at `shotelo-w100`: T28's evaluation predated the 2026 data. The direction is the opposite of every other window:

| Window | shotelo Δtips vs v3 | shotelo ΔLL vs v3 |
|---|---:|---:|
| Primary 2021–25 | +5 | −0.0034 |
| Early 2016–19 | +6 | −0.0064 |
| **2026 R1–R14** | **−2** | **+0.0069** |

Sliding "last three seasons" (T32 amended bar's recent-comp window):

| Window | v3 | shotelo | Δ |
|---|---:|---:|---:|
| 2023 + 2024 + 2025 (T28's window) | 439 | 439 | 0 |
| 2024 + 2025 + 2026 R1–R14 | 384 | 380 | **−4** |
| 2023 + 2024 + 2025 + 2026 R1–R14 cumulative (v4 convention) | 528 | 526 | **−2** |

Either reading puts shotelo into deficit territory on the most-recent slice. v4's documented kill (T32) was "−9 over 763 games, 0/−4/−1/−4 by season"; shotelo's −2 over 763 games (2023–26) is materially smaller but the same shape — better on older eras, worse on the most recent.

### LogLoss bar status

Updating the T28 pool with 2026 (point-estimate weighted average, not a fresh CI):

- Pre-2026 pool: −0.0047 over 1890 matches.
- With 2026 R1–R14: (1062 × −0.0034 + 828 × −0.0064 + 121 × +0.0069) / 2011 ≈ −0.0040.

Magnitude shrinks (point estimate now further below the bar of 0.005) and the CI almost certainly still includes zero. Adding 2026 R1–R14 to the strict bar makes the LL case *weaker*, not stronger — even though the magnitude is still on the right side.

## Why parked rather than killed

T28 parked shotelo-w100 in the A2 end-of-2026 bundle precisely because the case was directionally clean but sub-bar. The new evidence does not flip that call cleanly in either direction:

- **Against kill:** both training windows still show positive tips (+5 / +6) and right-direction LL. The mechanism (luck-adjusted scoring-shot Elo) has theoretical support — Wheelo's update target is xScore-style (T38 review §B.4), an external corroboration the T28 doc didn't have. A single half-season's worth of OOS data (n=121) tipping the wrong way is not statistically decisive: a season-average tip rate at 71.9% vs 73.6% is well inside per-round variance.
- **Against promote:** the LL bar was already not cleared and adding 2026 R1–R14 weakens it further. Recent-three-seasons shows a −2 to −4 tip deficit depending on window definition — the comp-facing v4 failure mode. The T32 amendment treats that as disqualifying.
- **Decision:** keep parked. End-of-2026 re-test (A2 bundle) is the natural decision point — full 2026 doubles the OOS sample, and the recent-3 window then becomes 2024 + 2025 + 2026 (full), which closes the partial-season hand-wave. **If full-2026 also goes against shotelo, this becomes a kill, not a re-park.**

## Regression guards (deferred to A2 re-test)

Per the T38 roadmap §3, three guards apply to any promotion candidate:

1. **Consensus-wrong cut ΔTips ≥ 0**: not run for T38c. The relevant cut needs Squiggle field tips + per-match prediction alignment for shotelo across 2021–25 (same machinery as `analysis/wheelo-headhead.py`). Defer to A2 re-test since the promotion call is also deferred.
2. **Per-team residual non-degradation**: T28 reported MAE 26.31→26.22 primary, 28.79→28.74 early — improvements at the global level. Per-team breakdown not run; defer.
3. **Per-venue residual monitor**: same as above; defer.

If shotelo's 2026 reversal is driven by *which* games it misses (e.g. losing the contrarian edge on consensus-wrong games specifically), the guards become load-bearing. Worth running ahead of the A2 re-test so the picture is complete before the promotion call.

## Engine machinery (already ships)

No new code. T28 added `elo.shot_margin_weight` (optional, hash-stable) and `computeUpdateMargin` in `src/engine/elo.ts`. The `shotelo-w100` config (hash `72243a69…`, no schema change since 2026-06-12) re-ran bit-identically:

- Primary 2021–25 LogLoss `0.8451` (matches T28 doc to four decimals).
- Tips 721 (matches T28 doc).

Bit-inertness of v3 also re-verified: `predha-080` still hashes `2641f46f`, LogLoss `0.8485`, 716 tips.

## Outcome vs Wheelo-closure roadmap

The Wheelo review pre-registered three candidates: 38a (per-venue HGA, killed today), 38c (this task, re-parked), 38b (T36 OD R14+, scheduled end-of-2026). The Wheelo external validation for shotelo-style update mechanics (Attack r=+0.93 with xScore, Defence r=−0.94 with TotalPoints_Opp) raises the prior that the scoring-shot Elo signal is real — but the bar is the bar, and the 2026 OOS reversal is the new piece of evidence that has to be re-tested at full season.

## Artifacts

- `/tmp/v38c-cmp-w100.json` — paired bootstrap predha-080 vs shotelo-w100 (primary 2021–25).
- `/tmp/v38c-cmp-early.json` — paired bootstrap on the early window.
- `/tmp/v38c-v3-2026.json`, `/tmp/v38c-w100-2026.json` — 2026 R1–R14 backtests.
- `configs/shotelo-w100/`, `configs/shotelo-w100-early/` — existing T28 configs, unchanged.
