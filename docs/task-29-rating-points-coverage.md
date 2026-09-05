# Task 29 (C4): Official AFL Rating_points as a Second Player Signal: Redundant

**Date:** 2026-06-12 **Verdict:** Resolved negative at the blend level.
`player_match_stats.rating_points` has full coverage (100% of AFLM rows
2012-2026) but correlates too highly with PAV where the blend would consume it.
No engine change. One forward note for D1.

## Coverage

100.0% of player_match_stats rows carry `rating_points` for every AFLM season
2012-2025 (2026 in progress at 99.1%). Per-season averages are stable (8.7-9.8.
7.4 in short-quarters 2020). Coverage is not the blocker the re-think flagged.

## Redundancy Versus PAV (Player-Season Level, 2015-2025, N=7,293 Matched Player-Seasons)

| Comparison                               | r         |
| ---------------------------------------- | --------- |
| Season RP total vs season PAV total      | **0.951** |
| Same, regulars only (≥10 games, n=4,901) | 0.898     |
| Per-game rates, regulars                 | 0.764     |

The blend sums season-cumulative player values across lineups. At that level,
the two signals correlate at 0.90-0.95, beyond the engine's redundancy criterion
(`runCalibration` complementarity note: >0.85 = redundant). Swapping or
ensembling `rating_points` with PAV adds a mostly redundant third signal behind
a 0.4 lever arm. This repeats the T19 opponent-adjustment lesson again.

## What Survives

The **per-game-rate** correlation of 0.76 shows that `rating_points` adds some
information beyond PAV. Possession-value weighting likely explains the
difference from PAV's involvement shares. Do not add another hand-tuned blend
partner. Instead, test the signal in the **D1 learned stacking head**, where
regularisation can assess its marginal value.

## Do-Not-Redo Entry

Do not use `rating_points` as a PAV replacement or hand-tuned ensemble partner.
Reconsider it only as a candidate feature in the D1 stacking head.

## Artefacts

Scripts `/tmp/c4_coverage.ts`, `/tmp/c4_corr.ts` (D1 read-only queries). No
configs, no engine changes, 2026 gate untouched.
