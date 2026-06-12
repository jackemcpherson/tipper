# Task 29 (C4): Official AFL rating_points as a Second Player Signal — Redundant

**Date:** 2026-06-12
**Verdict:** Resolved negative at the blend level. `player_match_stats.rating_points`
has full coverage (100% of AFLM rows 2012–2026) but correlates too highly with PAV where
the blend would consume it. No engine change. One forward note for D1.

## Coverage

100.0% of player_match_stats rows carry `rating_points` for every AFLM season 2012–2025
(2026 in progress at 99.1%). Per-season averages are stable (8.7–9.8; 7.4 in
short-quarters 2020). Coverage is not the blocker the re-think flagged.

## Redundancy vs PAV (player-season level, 2015–2025, n=7,293 matched player-seasons)

| Comparison | r |
|---|---|
| Season RP total vs season PAV total | **0.951** |
| Same, regulars only (≥10 games, n=4,901) | 0.898 |
| Per-game rates, regulars | 0.764 |

The blend consumes *season-cumulative* player values summed over lineups — at that level
the two signals are 0.90–0.95 correlated, beyond the engine's own redundancy criterion
(`runCalibration` complementarity note: >0.85 = redundant). Swapping or ensembling
rating_points against PAV inside the existing blend buys a third signal that is mostly
the same signal, behind a 0.4 lever arm — the T19 opponent-adjustment lesson again.

## What survives

The **per-game-rate** correlation (0.76) says rating_points carries some information PAV
lacks (likely its possession-value weighting vs PAV's involvement shares). The cheap way
to harvest that is not a second hand-tuned blend partner but a feature in the **D1 learned
stacking head** (lineup RP-rate diff alongside Elo diff and PAV zone diffs), where
regularisation can decide if the marginal 24% of variance is worth anything.

## Do-not-redo entry

rating_points as a PAV replacement or hand-tuned ensemble partner in the current blend.
Resurrection condition: D1 stacking head (as a candidate feature, not a rating system).

## Artifacts

Scripts `/tmp/c4_coverage.ts`, `/tmp/c4_corr.ts` (D1 read-only queries). No configs, no
engine changes, 2026 gate untouched.
