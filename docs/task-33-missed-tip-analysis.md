# Task 33: Missed-Tip Pattern Analysis with Field Triangulation

**Date:** 2026-06-12
**Model analysed:** v3 (`predha-080`, current). Plan: `task-33-plan-missed-tip-analysis.md`.
**Verdict:** **Effective kill, with one micro-candidate folded into A2.** 79% of v3's
misses are consensus misses (field also wrong). The tipper-specific remainder (n=24)
contains two season-replicating clusters, but the one with a mechanism (neutral-venue
home advantage) converts to a fix worth **+1 tip over 2,005 games** — an order of
magnitude under the bar. Per the pre-registered kill condition, comp gains must come
from **new information sources** (player availability, market signal — the D4 question),
not tweaks to v3's existing signal.

## Method

- v3 records: 2023–25 from `predha-080` 2641f46f, 2026 (R1–13) from e8e0cede — 763
  games, 233 misses (draws excluded; 2023–25 tuning-flattered, 2026 clean OOS).
- Field: Squiggle API tips, full-coverage sources only (23–28 per season), comp scoring
  conventions (T32). Per miss: share of field correct, field mean `hconfidence` on the
  true winner.
- Classification: **consensus miss** ≤35% of field correct; **tipper-specific (TS)
  miss** ≥65%; grey between.
- Tags per game (misses *and* correctly-tipped control): closeness band on |pred
  margin|, T22 venue/travel bucket, round phase, post-bye, rest diff (Squiggle
  schedule), weather (D1, 2023–25 only), team identities, upset direction vs field.
- Scripts: `analysis/missed-tip-analysis-2023-2026.py` (phases 1–3, writes the tagged
  dataset; misses persisted in `analysis/task33-misses-tagged.csv`),
  `analysis/task33-neutral-ha-test.ts` (phase 4, offline-exact via engine `metrics.ts` —
  reproduces official 0.8485/0.8555 before applying the candidate).

## Phase 2 — Triangulation

| Season | Misses | Consensus | Grey | Tipper-specific | Field sources |
|---|---|---|---|---|---|
| 2023 | 70 | 51 | 9 | 10 | 26 |
| 2024 | 73 | 59 | 8 | 6 | 23 |
| 2025 | 60 | 48 | 6 | 6 | 23 |
| 2026 R13 | 30 | 25 | 3 | 2 | 28 |
| **All** | **233** | **183 (79%)** | **26 (11%)** | **24 (10%)** | |

Miss rate by closeness confirms the T32 premise: |pred| <6 → 45% missed, 6–12 → 41%,
12–24 → 25%, 24+ → 11%. All 24 TS misses have |pred| < 12 (19 of them < 6).

**Character of the TS misses:** we were 51/49-wrong, not confidently wrong — mean prob
on our tip 0.557 (only 4/24 below 0.40 on the true winner), mean |pred| 3.9. But the
outcomes were decisive: mean |actual| 24.1. The field leaned only mildly the other way
(mean 0.547 on the winner) yet was right ≥65% of the time. Information existed; it was
sign-relevant, not magnitude-relevant. By contrast consensus misses are games where v3
was *more* confident than the field (0.648 on our tip, field 0.360 on the winner) —
genuine upsets, irreducible at the field's information level.

**Who repeatedly beats us on TS misses:** Graft, s10, Wheelo Ratings, Live Ladders
(22/24 each), The Wooden Finger (21/24), The Cruncher (14/16), Don't Blame the Data /
AFL Lab / Matter of Stats (20/24). That's the strong general quant models, not a single
method family (market-anchored and teamsheet-aware sources are not over-represented) —
pointing to better venue/team handling rather than one missing data feed.

**Mirror (v3's edge — must not be destroyed):** 23 games v3 tipped right that ≥65% of
the field missed: true-home-interstate 11, shared-derby 8, shared-interstate 4,
**neutral 0**. v3's edge lives in conventional-venue close calls; the N0 candidate below
touches none of them (verified: no mirror game flips).

## Phase 3 — Clusters (close games |pred|<12; base TS rate 6.3%)

| Cluster | n (TS) | TS rate | Ratio | Seasons | Status |
|---|---|---|---|---|---|
| **Neutral venue, tipped nominal home** | 5/13 | 38% | 6.1× | 2024, 2025, 2026 | **Graduated → N0** |
| **St Kilda tipped, St Kilda lost** | 6/53 | 11% | 1.8× | 2023, 2025, 2026 | Replicates; parked (precedent) |
| Away Brisbane Lions | 5/35 | 14% | 2.3× | 2023, 2024 | Parked — mixed direction, dead after 2024 |
| Wet weather | 9/121 | 7.4% | 1.2× | — | Flat (T26 re-confirmed) |
| Round phase, rest diff, post-bye, upset side | | | 0.7–1.3× | — | Flat |

- The neutral cluster is sharp: all 5 are "v3 tipped the designated home at a venue
  where nobody is home (Gather Round ×4, 2024 GF), home lost, field tipped away". Raw
  binomial p ≈ 0.001; survives ~40-cell multiplicity at ~0.04; replicated in three
  seasons; T22 independently found derbies/neutrals want ≈0 HA. Mechanism: v3 grants a
  flat 5.6-pt prediction HA that is venue-conferred in reality, not fixture-conferred.
- The St Kilda cluster is directionally pure (6/6 "we tipped StK, they lost") but
  team-identity fixes are precedent-rejected: T24/T25 showed team residuals follow list
  state, and the structural answer (v4 walk-forward offsets) loses tips (T32). Carry as
  a diagnostic into the season-end v4 re-eval and the D1 feature set, not a model tweak.

## Phase 4 — Candidate N0 (pre-registered before running)

**Hypothesis:** zero `prediction_home_advantage` when the home side is out of its state
at a ground that is not one of its (incl. secondary) home grounds. Single value, no
sweep. Offline-exact (T22 method note) on engine `metrics.ts` conventions.

| Window | Neutral games | Tips Δ | Close-band | ΔLogLoss |
|---|---|---|---|---|
| Primary 2021–25 (n=1062) | 56 | **+0** (won 2, lost 2) | 299/533 → 299/533 | −0.0011 |
| Early 2016–19 (n=828) | 13 | **+1** (won 3, lost 2) | 230/410 → 231/410 | −0.0012 |
| 2026 R1–13 (n=115) | 8 | **+0** (won 1, lost 1) | 34/49 → 34/49 | +0.0035 |

Pooled stratified bootstrap (seed 42/1000): ΔLogLoss −0.0011, CI [−0.0028, +0.0006].
Last-3-seasons tips delta: +1. MAE −0.03.

**Why it fizzles despite the clean cluster:** only games with 0 < pred margin < 5.6
can flip. Three of the five cluster misses had v3 margins of 6.8–10.2 — the HA term
contributed but v3's underlying margin also leaned home. Removing HA fixes 2 of 5
(Freo–Carlton 2024, Collingwood–Freo 2026) and surrenders one previously-correct tip
(Sydney–Gold Coast 2026). The LogLoss direction is right and consistent in both old
windows, the mechanism is real, and the cost is one config field — but as a standalone
candidate it is ~5× below even the CI-width needed, let alone the 0.005 bar.

**Disposition:** fold *neutral ≈ 0* into the A2 end-of-2026 bucketed-HA bundle
({derby ≈20, true-home-interstate ≈110, **neutral ≈0**, else 80}) — the micro-effects
are individually sub-bar (T22's were −0.002-class) and only a joint bundle has a chance
of clearing it. Do not promote standalone.

## Kill-condition assessment

Pre-registered: kill if ≥80% consensus misses AND no replicating over-representation
beyond closeness. Measured: **79% consensus** (within rounding of the threshold), and
the TS remainder *does* contain replicating structure — but the only mechanism-backed,
actionable cluster converts to +1 tip / −0.0011 LogLoss. The spirit of the condition is
met even though the letter narrowly isn't:

> **v3 has no exploitable blind spot of material size at the field's information
> level.** Its misses are overwhelmingly the field's misses. The 24 exceptions are
> 51/49 calls where stronger general models lean the other way — not a fixable feature
> gap. Comp gains from here come from new information (player availability, market
> signal — D4 stacking head), or from variance (the comp winner rotates yearly, T32).

2026 corroborates: only 2 of 30 misses are tipper-specific (7%) in the clean OOS sample
— v3 currently sits 4th of 29 with essentially field-typical misses.

## Artifacts

- `analysis/missed-tip-analysis-2023-2026.py` — phases 1–3 (tagging, triangulation,
  cross-tabs); full tagged table to `/tmp/task33-games-tagged.csv`
- `analysis/task33-misses-tagged.csv` — the 233 tagged misses (durable copy)
- `analysis/task33-neutral-ha-test.ts` — N0 offline-exact test (engine metrics, exact
  bootstrap); validity-checked against official 0.8485/0.8555
- No engine or config changes; no promotion
