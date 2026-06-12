# Task 33 (Plan): Missed-Tip Pattern Analysis with Field Triangulation

**Status:** PLAN — next research iteration (proposed by Jack 2026-06-12, post Task 32)
**Model under analysis:** v3 (`predha-080`, current)
**Goal:** find structural blind spots in the games v3 tips wrong, using the Squiggle
field as the control group, and convert any real clusters into testable candidates that
pass the amended (tips-aware) promotion bar.

## Premise

Task 32 established that comp placings are decided by close-game sign accuracy, and that
v3's miss set is the raw material. But a missed tip alone is ambiguous: ~45% of genuine
coin-flips *should* be missed. The discriminating signal is the field: a game most
models also missed is (probably) irreducible noise; a game most of the field got right
while we got wrong means **information existed that v3 doesn't carry**. Those
tipper-specific misses are where a fixable blind spot would live.

## Phase 1 — Inventory and feature-tag v3's misses

Window: 2023–2026 (the seasons with field data already pulled; extend to 2021–22 via the
API if volume is needed — expect ~230 total misses at v3's ~31% miss rate).

For every v3 wrong tip, tag:
- **Closeness**: |predicted margin| (the dominant covariate — everything else must be
  tested *conditional* on it, or closeness will masquerade as every other pattern)
- **Upset direction**: did we tip the favourite (ours and the field's) or the dog?
- **Venue/travel bucket** (T22 maps): derby-at-shared, true-home-vs-interstate, neutral…
- **Round phase** (early / mid / late / finals) and post-bye flag
- **Team identities**, both sides — especially offset-class teams (cellar dwellers,
  Geelong-at-home) and team-season cells
- **Rest diff, weather** (DB holds 2010–25 weather; T26 found no *global* signal, but a
  cluster-conditional one is a different question)
- **Actual margin** (did we lose a coin-flip by a kick, or miss by 40?)

Output: one row per miss, plus the same table for correctly-tipped games (the control —
patterns must be over-represented among misses, not just present).

## Phase 2 — Field triangulation (the key step)

For each v3 miss, from the Squiggle tips data (full-coverage sources only):
- **Field split**: fraction of sources that tipped it correctly, and the field's mean
  confidence on the true winner (`hconfidence` per source is in the API payload)
- Classify: **consensus miss** (≤35% of field correct — nobody's information helped) vs
  **tipper-specific miss** (≥65% of field correct — we were the outlier) vs grey zone
- For tipper-specific misses: *which* sources are repeatedly right on them? Profile the
  repeat winners — market-anchored (Punters), player-availability-aware, form-weighted —
  their shared method is a direct pointer to the missing signal. Also compute our
  probability vs field mean on those games: were we confidently wrong or 51/49 wrong?

Mirror check: run the same triangulation on games v3 got right but most of the field
missed — that's where v3's existing edge lives, and any "tweak" must not destroy it.

## Phase 3 — Cluster the tipper-specific misses

Expected n ≈ 60–90; small. Approach accordingly:
- Primary: cross-tabs over the Phase 1 features conditional on closeness band, reviewed
  with domain eyes (Jack) — at this n, named human-legible segments beat algorithmic
  clusters.
- Secondary: hierarchical clustering on standardized features as a suggestion engine
  only; never report a cluster that can't be restated as a plain-language rule
  ("interstate dogs off a bye", "team X at venue Y early-season").
- **Replication gate**: a cluster only graduates if it appears in ≥2 seasons (or both
  the 2023–25 block and 2026). Single-season clusters are noted and parked.

## Phase 4 — Clusters → candidates

For each graduated cluster: state the hypothesis, the mechanism, and the cheapest test
*before* sweeping anything (pre-registration discipline — this whole exercise is
residual-chasing by construction, so the multiple-comparisons risk is maximal).
Evaluation per the standing procedure: offline-exact where prediction-side, both
windows, stratified pooled bootstrap, **plus the Task 32 tips criterion and the
close-game (|pred margin| < 12) sign-accuracy band** — which is where these candidates
claim to help, so it's their primary metric, not a side report.

## Kill condition (pre-registered)

If ≥80% of v3's misses are consensus misses, and the tipper-specific remainder shows no
feature over-representation beyond closeness that replicates across seasons — then v3
has no exploitable blind spot at the field's information level, and the honest
conclusion is that comp gains must come from new information sources (player
availability, market signal — the D4 question), not model tweaks. Document and close.

## Mechanics

- All offline + Squiggle API; no engine changes in this task. Re-use
  `analysis/squiggle-rerank-2023-2026.py` fetch/convention code (User-Agent, draws
  correct for all, GWS name map).
- v3 records: 2023–25 from `predha-080` results (2641f46f), 2026 from e8e0cede.
- Caveat to carry: 2023–25 v3 predictions are tuning-window-flattered; the *miss set* is
  still valid (flattering makes misses rarer, not differently distributed), but report
  2026 separately as the clean sample.
- Effort: S–M (one session). Deliverables: per-miss tagged dataset, triangulation
  tables, named clusters with replication status, ranked candidate list (or the kill
  conclusion), all in a `docs/task-33-missed-tip-analysis.md` results doc.
