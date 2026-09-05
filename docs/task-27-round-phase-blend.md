# Task 27 (D3): Round-Phase Blend Schedule: Premise Falsified

**Date:** 2026-06-12

**Baseline:** `predha-080` (v3): primary 0.8485 and early window 0.8555

**Verdict:** Rejected. T18 found that PAV's edge was strongest early in the
season. That result does not replicate as round-phase structure in either
window. Per-phase optimal blend weights are incoherent noise, the two eras
disagree phase-by-phase, and every ramp schedule swept is at or worse than the
flat `weight_elo = 0.6`. Flat blend stands.

## Method

Offline-exact: team ratings rebuilt from persisted `homeElo/awayElo/PavTotals`
as `w×Elo + (1−w)×6.986×PAV`. Reconstruction at w=0.6 reproduces persisted
margins to 3.6e-14 and both windows' LogLoss exactly.

## Per-Phase Optimal Weight (Diagnostic: in-Sample per Cell)

| Phase       | primary n | primary w* | dLL     | early n | early w* | dLL     |
| ----------- | --------- | ---------- | ------- | ------- | -------- | ------- |
| R0-3        | 137       | 0.750      | −0.0015 | 108     | 0.425    | −0.0023 |
| R4-7        | 177       | 0.300      | −0.0057 | 144     | 0.750    | −0.0026 |
| R8-12       | 213       | 0.775      | −0.0020 | 168     | 0.525    | −0.0005 |
| R13-18      | 237       | 0.325      | −0.0045 | 192     | 0.300    | −0.0184 |
| R19+/finals | 298       | 0.600      | 0.0000  | 216     | 0.700    | −0.0006 |

No monotone early to late pattern. The windows _contradict_ each other in three
of five phases, most starkly R0-3. These 100-300-match cells move the per-cell
optimum by ±0.3 in w for gains below 0.005. This result has the boundary-overfit
signature identified by the v1.5 RTM analysis. If anything were real, the
early-round cells would agree across eras. They do not.

## Ramp Sweep

`w(round) = w0 + (w1−w0) × min(1, round/K)`, w0 ∈ {0.40…0.55}, w1 ∈ {0.60…0.75},
K ∈ {6, 10, 14} (48 variants, both windows): **every variant ≥ baseline in
pooled LogLoss**. Best is the degenerate near-flat 0.55 to 0.60 at ±0.0000.
Every genuine ramp hurts (up to +0.0032 pooled). No bootstrap needed: there is
no candidate.

## Note on the T18 Observation

T18's "2026 lead narrowed as Elo caught up" was a _between-model_ observation on
one partial season (v2 vs Squiggle field), not within-model round structure. As
a within-model claim it is now tested and dead at n=1890.

## Do-Not-Redo Entry

Round-phase blend schedules include linear ramps and per-phase weights. More of
the same data cannot resurrect them. Only a structural change to how PAV
information enters could justify another test. One option is a D1 learned head
with a round-phase interaction term.

## Artefacts

Script `/tmp/d3_round_phase.ts`. No configs, no engine changes, 2026 gate
untouched.
