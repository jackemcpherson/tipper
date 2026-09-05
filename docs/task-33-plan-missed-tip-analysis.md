# Task 33 (Plan): Missed-Tip Pattern Analysis with Field Triangulation

**Status:** Next research iteration, proposed by Jack on 2026-06-12 after Task
32

**Model under analysis:** The current v3 model (`predha-080`).

**Goal:** Find structural blind spots in games that v3 tips incorrectly. Use the
Squiggle field as the control group. Convert repeated clusters into candidates
that can pass the amended, tips-aware promotion bar.

## Premise

Task 32 established that close-game sign accuracy determines competition
placings, and that v3's miss set is the raw material. But a missed tip alone is
ambiguous: models should miss about 45% of genuine coin flips. The
discriminating signal is the field: a game most models also missed is (probably)
irreducible noise. A game most of the field got right while we got wrong means
**information existed that v3 does not carry**. Those tipper-specific misses are
where a fixable blind spot would live.

## Phase 1: Inventory and Feature-Tag V3's Misses

Window: 2023-2026 (the seasons with field data already pulled. Extend to 2021-22
through the API if the analysis needs more volume. Expect about 230 total misses
at v3's 31% miss rate).

For every v3 wrong tip, tag:

- Closeness: |predicted margin| (the dominant covariate: everything else must be
  tested _conditional_ on it, or closeness will masquerade as every other
  pattern).
- Upset direction: did we tip the favourite (ours and the field's) or the dog?
- Venue/travel bucket (T22 maps): derby-at-shared, true-home-vs-interstate,
  neutral….
- Round phase (early / mid / late / finals) and post-bye flag.
- Team identities, both sides: especially offset-class teams (cellar dwellers,
  Geelong-at-home) and team-season cells.
- Rest diff, weather (DB holds 2010-25 weather. T26 found no _global_ signal,
  but a cluster-conditional one is a different question).
- Actual margin (did we lose a coin-flip by a kick, or miss by 40?).

Output: one row per miss, plus the same table for correctly-tipped games (the
control: patterns must be over-represented among misses, not just present).

## Phase 2: Field Triangulation (The Key Step)

For each v3 miss, from the Squiggle tips data (full-coverage sources only):

- Field split: record the fraction of sources that tipped correctly and the
  field's mean confidence on the true winner. Use each source's API
  `hconfidence`.
- Classify: **consensus miss** (≤35% of field correct: nobody's information
  helped) vs **tipper-specific miss** (≥65% of field correct: we were the
  outlier) vs grey zone.
- For tipper-specific misses: _which_ sources are repeatedly right on them?
  Profile the repeat winners: market-anchored (Punters),
  player-availability-aware, form-weighted: their shared method is a direct
  pointer to the missing signal. Also compute our probability vs field mean on
  those games: were we confidently wrong or 51/49 wrong?

Mirror check: apply the same triangulation to correct v3 tips that most of the
field missed. These games contain v3's existing edge, which any change must not
destroy it.

## Phase 3: Cluster the Tipper-Specific Misses

Expected n ≈ 60-90. Small. Approach accordingly:

- Primary: cross-tabs over the Phase 1 features conditional on closeness band,
  reviewed with domain eyes (Jack): at this n, named human-legible segments beat
  algorithmic clusters.
- Secondary: hierarchical clustering on standardised features as a suggestion
  engine only. Only report clusters that have a plain-language rule ("interstate
  dogs off a bye", "team X at venue Y early-season").
- Replication gate: a cluster only graduates if it appears in ≥2 seasons (or
  both the 2023-25 block and 2026). Note and park single-season clusters.

## Phase 4: Clusters to Candidates

For each graduated cluster, state the hypothesis, mechanism, and cheapest test
before any sweep. This pre-registration matters because the exercise chases
residuals by design. The multiple-comparisons risk is maximal. Follow the
standing evaluation procedure. Use offline-exact evaluation for prediction-side
changes across both windows, with a stratified pooled bootstrap. Also apply the
Task 32 tips criterion and close-game sign-accuracy band.

This band is the primary metric because the candidates claim to improve close
games.

## Kill Condition (Pre-Registered)

If at least 80% of v3 misses are consensus misses, examine the remainder. If no
feature beyond closeness repeats across seasons, v3 has no exploitable blind
spot at the field's information level. Competition gains must then come from new
information sources, such as player availability or market signal: the D4
question), not model tweaks. Document and close.

## Mechanics

- All offline + Squiggle API. No engine changes in this task. Re-use
  `analysis/squiggle-rerank-2023-2026.py` fetch/convention code (User-Agent,
  draws correct for all, GWS name map).
- v3 records: 2023-25 from `predha-080` results (2641f46f), 2026 from e8e0cede.
- Caveat to carry: 2023-25 v3 predictions are tuning-window-flattered. The _miss
  set_ is still valid (flattering makes misses rarer, not differently
  distributed), but report 2026 separately as the clean sample.
- Effort: S-M (one session). Deliverables: per-miss tagged dataset,
  triangulation tables, named clusters with replication status, ranked candidate
  list (or the kill conclusion), all in a `docs/task-33-missed-tip-analysis.md`
  results doc.

## References

- [Squiggle API documentation](https://api.squiggle.com.au/)
