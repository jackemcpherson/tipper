# Task 38C: T28 Shot-Margin Elo Standalone Re-Test

**Date:** 2026-06-16 **Status:** **Parked (T28 verdict preserved with 2026 OOS
warning).** Engine machinery already ships (from T28). No promotion. **Reads:**
[`task-28-scoring-shot-elo.md`](task-28-scoring-shot-elo.md),
[`task-32-squiggle-rerank.md`](task-32-squiggle-rerank.md),
[`task-38-wheelo-closure-roadmap.md`](task-38-wheelo-closure-roadmap.md).

## Headline

Re-running T28's standalone `shotelo-w100` (`elo.shot_margin_weight: 1`, no
team-offset bundle) against the amended T32 bar reproduces T28's headline
numbers bit-identically and adds:

- The T32 tips criterion passes on both training windows. Primary 2021-25 gains
  +5, and early 2016-19 gains +6. The **+11 pooled** gain uses the same windows
  that informed T28. Recent-3 (2023-25) tied at 439-439.
- 2026 R1-R14 OOS evidence reverses direction: ΔTips **−2**, ΔLL **+0.0069**
  (shotelo regresses).
- Sliding recent-3 (2024-26): ΔTips **−4** vs v3. Under T32's comp-facing rule a
  recent-window tip deficit is disqualifying: currently a warning at half a
  2026, not yet a hard call.
- LogLoss bar unchanged from T28: primary point −0.0034 (sub-bar), CI [−0.0042,
  +0.0107] **includes zero**. Pooled (n=1890) −0.0047, CI [−0.0102, +0.0009]
  **barely includes zero**.

**Decision:** Keep `shotelo-w100` parked in the A2 end-of-2026 bundle. Do not
promote or kill it. The pre-2026 evidence (positive direction in both training
windows and positive tips) still holds. T28 also found a monotone dose-response.
The 2026 partial-season reversal uses a small sample of 121 matches.

It points in the wrong direction and matches v4's failure pattern. The reversal
must close before reviewers can reconsider promotion.

## Re-Test Against the Amended T32 Bar

This review applies each part of the amended promotion standard.

### Bar Reminder

1. Primary 2021-25 ΔLL < −0.005 with CI excluding zero.
2. Early 2016-19 confirmatory: same direction, magnitude within 50% of primary.
3. Tips criterion (T32 amendment): no pooled tip regression vs incumbent on the
   scored windows. Last-three-seasons tip delta non-negative (deficit =
   disqualifying for comp-facing).
4. Three regression guards (T38 §3): consensus-wrong cut ΔTips ≥ 0, per-team
   residual non-degradation, per-venue residual monitor.

### Pre-2026 Picture (T28's Evidence + Tips Lens)

Reproduced via `bun run dist/cli/index.js compare` against `predha-080` (v3,
hash `2641f46f`) and `predha80-early`:

| Window           |        n |  v3 tips | shotelo-w100 tips |   ΔTips |         v3 LL | shotelo LL |         ΔLL | bootstrap CI           |
| ---------------- | -------: | -------: | ----------------: | ------: | ------------: | ---------: | ----------: | ---------------------- |
| Primary 2021-25  |     1062 |      716 |               721 |  **+5** |        0.8485 |     0.8451 |     −0.0034 | [−0.0042, +0.0107]     |
| Early 2016-19    |      828 |      554 |               560 |  **+6** |        0.8555 |     0.8491 |     −0.0064 | [−0.0022, +0.0156]     |
| **Pooled (T28)** | **1890** | **1270** |          **1281** | **+11** | Not available |          : | **−0.0047** | **[−0.0102, +0.0009]** |

Per-season tips in the primary window:

| Season             |      v3 | shotelo-w100 |      Δ |
| ------------------ | ------: | -----------: | -----: |
| 2021               |     131 |          132 |     +1 |
| 2022               |     146 |          150 |     +4 |
| 2023               |     144 |          146 |     +2 |
| 2024               |     140 |          137 | **−3** |
| 2025               |     155 |          156 |     +1 |
| Recent-3 (2023-25) |     439 |          439 |  **0** |
| **Pool**           | **716** |      **721** | **+5** |

Pre-2026, this result is a clean profile against the amended T32 tips criterion:
pooled positive, recent-3 tied. The T28 conclusion ("strongest unshipped
candidate since v3") stands and the new tips lens does not undermine it.

### 2026 R1-R14 OOS Evidence

`bun run dist/cli/index.js backtest --config <id> --season 2026` against the
same framework data (`data_through` 2026-06-16, n=121 completed matches in 2026
R1-R14):

| Model                           |             tips |                  LL |
| ------------------------------- | ---------------: | ------------------: |
| v3 (`predha-080`, scope=[2026]) | 89 / 121 (73.6%) |              0.7761 |
| shotelo-w100 (scope=[2026])     | 87 / 121 (71.9%) |              0.7831 |
| Δ (shotelo − v3)                |      **−2 tips** | **+0.0069 (worse)** |

This result is the first OOS look at `shotelo-w100`: T28's evaluation predated
the 2026 data. The direction is the opposite of every other window:

| Window          | shotelo Δtips vs v3 | shotelo ΔLL vs v3 |
| --------------- | ------------------: | ----------------: |
| Primary 2021-25 |                  +5 |           −0.0034 |
| Early 2016-19   |                  +6 |           −0.0064 |
| **2026 R1-R14** |              **−2** |       **+0.0069** |

Sliding "last three seasons" (T32 amended bar's recent-comp window):

| Window                                                      |  v3 | shotelo |      Δ |
| ----------------------------------------------------------- | --: | ------: | -----: |
| 2023 + 2024 + 2025 (T28's window)                           | 439 |     439 |      0 |
| 2024 + 2025 + 2026 R1-R14                                   | 384 |     380 | **−4** |
| 2023 + 2024 + 2025 + 2026 R1-R14 cumulative (v4 convention) | 528 |     526 | **−2** |

Either reading puts shotelo into deficit territory on the most-recent slice.
V4's documented kill (T32) was "−9 over 763 games, 0/−4/−1/−4 by season".
Shotelo's −2 over 763 games (2023-26) is materially smaller but the same shape:
better on older eras, worse on the most recent.

### LogLoss Bar Status

Updating the T28 pool with 2026 (point-estimate weighted average, not a fresh
CI):

- Pre-2026 pool: −0.0047 over 1890 matches.
- With 2026 R1-R14: (1062 × −0.0034 + 828 × −0.0064 + 121 × +0.0069) / 2011 ≈
  −0.0040.

Magnitude shrinks (point estimate now further below the bar of 0.005) and the CI
almost still includes zero. Adding 2026 R1-R14 to the strict bar makes the LL
case _weaker_, not stronger: even though the magnitude is still on the right
side.

## Why Parked Rather Than Killed

T28 parked shotelo-w100 in the A2 end-of-2026 bundle precisely because the case
was directionally clean but sub-bar. The new evidence does not flip that call
cleanly in either direction:

- Against kill: both training windows still show positive tips (+5 / +6) and
  right-direction LL. Luck-adjusted scoring-shot Elo has theoretical support.
  Wheelo's xScore-style update target provides external corroboration, per T38
  §B.4. T28 did not have that evidence. A half-season of OOS data, n=121,
  tipping the wrong way is not statistically decisive. Season-average tip rates
  of 71.9% versus 73.6% sit within per-round variance.
- Against promote: the LL bar was already not cleared and adding 2026 R1-R14
  weakens it further. Recent-three-seasons shows a −2 to −4 tip deficit
  depending on window definition: the comp-facing v4 failure mode. The T32
  amendment treats that as disqualifying.
- Decision: keep parked. The A2 end-of-2026 re-test is the decision point. Full
  2026 doubles the OOS sample and makes the recent-3 window cover complete 2024,
  2025, and 2026 seasons. **If full-2026 also goes against shotelo, this becomes
  a kill, not a re-park.**

## Regression Guards (Deferred to A2 Re-Test)

Per the T38 roadmap §3, three guards apply to any promotion candidate:

1. Consensus-wrong cut ΔTips ≥ 0: not run for T38c. The relevant cut needs
   Squiggle field tips + per-match prediction alignment for shotelo across
   2021-25 (same machinery as `analysis/wheelo-headhead.py`). Defer to A2
   re-test since the promotion call is also deferred.
2. Per-team residual non-degradation: T28 reported MAE 26.31 to 26.22 primary,
   28.79 to 28.74 early: improvements at the global level. Per-team breakdown
   not run. Defer.
3. Per-venue residual monitor: same as above. Defer.

The regression guards become important if shotelo's reversal depends on which
games it misses. One possible cause is losing its edge on consensus-wrong games.
Run these guards before the A2 re-test so the promotion review has complete
data.

## Engine Machinery (Already Ships)

No new code. T28 added `elo.shot_margin_weight` (optional, hash-stable) and
`computeUpdateMargin` in `src/engine/elo.ts`. The `shotelo-w100` config (hash
`72243a69…`, no schema change since 2026-06-12) re-ran bit-identically:

- Primary 2021-25 LogLoss `0.8451` (matches T28 doc to four decimals).
- Tips 721 (matches T28 doc).

Bit-inertness of v3 also re-verified: `predha-080` still hashes `2641f46f`,
LogLoss `0.8485`, 716 tips.

## Outcome Versus Wheelo-Closure Roadmap

The Wheelo review pre-registered three candidates: 38a (per-venue HGA, killed
today), 38c (this task, re-parked), 38b (T36 OD R14+, scheduled end-of-2026).
Wheelo provides external validation for shotelo-style update mechanics. Attack
correlates +0.93 with xScore, while Defence correlates −0.94 with
TotalPoints_Opp. This evidence strengthens the scoring-shot Elo hypothesis. The
2026 out-of-sample reversal still requires a full-season re-test.

## Artefacts

- `/tmp/v38c-cmp-w100.json`: paired bootstrap predha-080 vs shotelo-w100
  (primary 2021-25).
- `/tmp/v38c-cmp-early.json`: paired bootstrap on the early window.
- `/tmp/v38c-v3-2026.json`, `/tmp/v38c-w100-2026.json`: 2026 R1-R14 backtests.
- `configs/shotelo-w100/`, `configs/shotelo-w100-early/`: existing T28 configs,
  unchanged.

## References

- [Squiggle API documentation](https://api.squiggle.com.au/)
- [Wheelo current AFL team ratings](https://www.wheeloratings.com/afl_ratings.html)
- [Wheelo AFL team statistics](https://www.wheeloratings.com/afl_stats_team.html)
