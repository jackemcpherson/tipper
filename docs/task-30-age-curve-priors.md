# Task 30 (C3): Age-Curve PAV Priors — Blocked by DOB Coverage

**Date:** 2026-06-12
**Verdict:** Blocked, not refuted. `players.date_of_birth` coverage is far too thin to
fit or apply an age curve anywhere the model evaluates. No engine change. Resurrection is
a data-pipeline task, not a modelling one.

## Coverage facts (players appearing in player_season_pav, AFLM)

| Season | players | with DOB |
|---|---|---|
| 1998 | 582 | 0 (0%) |
| 2005 | 566 | 0 (0%) |
| 2014 | 663 | 64 (10%) |
| 2016 | 656 | 125 (19%) |
| 2021 | 676 | 353 (52%) |
| 2025 | 668 | 592 (89%) |

DOB is populated essentially only for recently-active players (the re-think's "Player
DOB … all players" inventory entry is wrong in practice).

## Why this blocks both halves of the idea

1. **Fitting:** the clean fit window (pre-2015, untouched by both scored windows) has
   ~0–10% DOB coverage — the year-over-year PAV ratio sample collapses to 92 pairs,
   nearly all young recent players (heavy survivor bias: old players with DOB recorded
   are disproportionately ones still playing in the 2020s).
2. **Applying:** in the windows themselves, an age multiplier could be applied to only
   19% (2016) / 52% (2021) of lineup priors, silently treating most of each lineup as
   age-neutral. That is not a model of aging; it is a model of database coverage.

## Resurrection condition

Backfill `players.date_of_birth` in afl-stats (DOBs are public for all VFL/AFL players,
e.g. AFL Tables). Once coverage is ~complete back to ~1990 birth cohorts:
1. Fit the year-over-year PAV ratio curve on 1998–2014 (no window leakage),
2. Apply as a prior multiplier in `prior.ts` behind an optional config field,
3. Evaluate under the Task 25 two-window procedure.
The WCE-aging-collapse motivation from the re-think still stands; B2 (team offsets) may
absorb some of the same signal in the meantime — if B2 ships first, re-derive the
expected gain before building this.

## Artifacts

Scripts `/tmp/c3_curve.ts`, `/tmp/c3_dbg.ts` (read-only D1). No configs, no engine
changes, 2026 gate untouched.
