# Task 26 (C2): Rest & Travel Differentials — No Signal

**Date:** 2026-06-12
**Baseline:** `predha-080` (v3) — primary 0.8485 (n=1062) + early window 0.8555 (n=828)
**Verdict:** Rejected. Neither rest-day differentials nor interstate-travel flags carry
exploitable prediction-side signal on 1,890 matches. The only structure found is the
already-known T22 derby-vs-interstate HA bucketing (queued for the A2 end-of-2026
re-test). First experiment evaluated under the Task 25 two-window procedure.

## Method

Offline-exact on both windows' persisted records. Rest days computed within-season from
fixture dates in the records (season openers carry no rest value and contribute zero to
the rest term); travel = venue state ≠ team home state, with venue→state and team→state
maps over all 25 venues appearing in 2016–2019/2021–2025.

## Diagnostics

Rest distribution (team-matches): 6–7 days 2,307 · 8–9 days 885 · 10+ 334 · ≤5 days 92
(short breaks are rare in the modern fixture).

| Home-oriented residual by rest diff (home − away) | n | resid | t |
|---|---|---|---|
| ≤ −3 days | 121 | +1.57 | +0.54 |
| −2..−1 | 525 | +1.93 | +1.27 |
| 0 | 530 | −1.06 | −0.70 |
| +1..+2 | 531 | −0.65 | −0.44 |
| ≥ +3 | 98 | −4.90 | −1.40 |

OLS residual ~ clamped rest diff: slope **−0.57 pts/day (t −1.48)** — *negative*, i.e.
directionally opposite to the "more rest is good" theory, and insignificant. The
away-short-break cell (n=27, −12.1, t −1.8) also points opposite to theory. There is
nothing here the model fails to price.

| Travel status | n | resid | t |
|---|---|---|---|
| home local, away travelled | 1115 | +2.00 | +1.90 |
| derby (both local) | 593 | −3.28 | −2.44 |
| home travelled, away local | 17 | −9.38 | −1.09 |
| neutral (both travelled) | 165 | +2.44 | +0.85 |

This is T22's bucketed-HA structure re-observed through a travel lens (flat 80 HA is too
big for derbies, slightly small for interstate visitors) — already documented, already
sub-bar at this n, already queued for re-test at n≈1270 (A2). No new information.

## Sweep

`margin += bRest × clamp(restDiff, ±7) + bTravel × (awayTravelled − homeTravelled)`,
bRest ∈ {0…1.0}, bTravel ∈ {0…3} margin pts:

- Every non-zero bRest **hurts** in both windows (consistent with the negative slope).
- bTravel best at 1 pt: pooled dLL **−0.0002**, CI [−0.0013, +0.0011] — noise.
- Stratified pooled bootstrap (Task 25 procedure) confirms: nothing approaches the bar.

## Do-not-redo entry

Rest-day differentials (any coefficient, clamped or bucketed) and binary interstate-travel
adjustments are dead at n=1890. Resurrection condition: actual travel-distance/timezone
data, or a fixture regime change (e.g. condensed rounds returning short breaks at scale —
current fixture has only 92 short-break team-matches in nine seasons).

## Artifacts

Script `/tmp/c2_rest_travel.ts` (offline-exact, engine functions). No configs, no engine
changes, 2026 gate untouched.
