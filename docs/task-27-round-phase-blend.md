# Task 27 (D3): Round-Phase Blend Schedule — Premise Falsified

**Date:** 2026-06-12
**Baseline:** `predha-080` (v3) — primary 0.8485 (n=1062) + early window 0.8555 (n=828)
**Verdict:** Rejected. The T18 observation that PAV's edge is strongest early-season does
not replicate as round-phase structure in either window: per-phase optimal blend weights
are incoherent noise, the two eras disagree phase-by-phase, and every ramp schedule swept
is at or worse than the flat `weight_elo = 0.6`. Flat blend stands.

## Method

Offline-exact: team ratings rebuilt from persisted `homeElo/awayElo/PavTotals` as
`w×Elo + (1−w)×6.986×PAV`. Reconstruction at w=0.6 reproduces persisted margins to
3.6e-14 and both windows' LogLoss exactly.

## Per-phase optimal weight (diagnostic — in-sample per cell)

| Phase | primary n | primary w* | dLL | early n | early w* | dLL |
|---|---|---|---|---|---|---|
| R0–3 | 137 | 0.750 | −0.0015 | 108 | 0.425 | −0.0023 |
| R4–7 | 177 | 0.300 | −0.0057 | 144 | 0.750 | −0.0026 |
| R8–12 | 213 | 0.775 | −0.0020 | 168 | 0.525 | −0.0005 |
| R13–18 | 237 | 0.325 | −0.0045 | 192 | 0.300 | −0.0184 |
| R19+/finals | 298 | 0.600 | 0.0000 | 216 | 0.700 | −0.0006 |

No monotone early→late pattern; the windows *contradict* each other in three of five
phases (most starkly R0–3). These are 100–300-match cells where the per-cell optimum
swings ±0.3 in w for sub-0.005 gains — exactly the boundary-overfit signature the v1.5
RTM lesson warned about. If anything were real, the early-round cells would agree across
eras; they don't.

## Ramp sweep

`w(round) = w0 + (w1−w0) × min(1, round/K)`, w0 ∈ {0.40…0.55}, w1 ∈ {0.60…0.75},
K ∈ {6, 10, 14} (48 variants, both windows): **every variant ≥ baseline in pooled
LogLoss**. Best is the degenerate near-flat 0.55→0.60 at ±0.0000; every genuine ramp
hurts (up to +0.0032 pooled). No bootstrap needed — there is no candidate.

## Note on the T18 observation

T18's "2026 lead narrowed as Elo caught up" was a *between-model* observation on one
partial season (v2 vs Squiggle field), not within-model round structure. As a within-model
claim it is now tested and dead at n=1890.

## Do-not-redo entry

Round-phase blend schedules (linear ramps, per-phase weights). Resurrection condition:
none from more of the same data — only a structural change to how PAV information enters
(e.g. D1 learned head with a round-phase interaction term, which would test this jointly
rather than as a hand-tuned schedule).

## Artifacts

Script `/tmp/d3_round_phase.ts`. No configs, no engine changes, 2026 gate untouched.
