# Task 33: Missed-Tip Pattern Analysis with Field Triangulation

**Date:** 2026-06-12 **Model analysed:** v3 (`predha-080`, current). Plan:
`task-33-plan-missed-tip-analysis.md`. **Verdict:** **Effective kill, with one
micro-candidate folded into A2.** 79% of v3's misses are consensus misses (field
also wrong). The remaining 24 tipper-specific misses contain two clusters that
repeat across seasons.

However, the mechanism-backed neutral-venue advantage converts to a fix worth
**+1 tip over 2,005 games**: an order of magnitude under the bar. The
pre-registered kill condition requires new information sources for competition
gains. Candidates include player availability and the D4 market signal, rather
than v3 signal tweaks.

## Method

- v3 records: 2023-25 from `predha-080` 2641f46f, 2026 (R1-13) from e8e0cede:
  763 games, 233 misses (draws excluded. 2023-25 tuning-flattered, 2026 clean
  OOS).
- Field: Squiggle API tips, full-coverage sources only (23-28 per season), comp
  scoring conventions (T32). Per miss: share of field correct, field mean
  `hconfidence` on the true winner.
- Classification: **consensus miss** ≤35% of field correct. **tipper-specific
  (TS) miss** ≥65%. Grey between.
- Tags per game (misses _and_ correctly-tipped control): closeness band on |pred
  margin|, T22 venue/travel bucket, round phase, post-bye, rest diff (Squiggle
  schedule), weather (D1, 2023-25 only), team identities, upset direction vs
  field.
- Scripts: `analysis/missed-tip-analysis-2023-2026.py` (phases 1-3, writes the
  tagged dataset. Misses persisted in `analysis/task33-misses-tagged.csv`),
  `analysis/task33-neutral-ha-test.ts` (phase 4, offline-exact via engine
  `metrics.ts`: reproduces official 0.8485/0.8555 before applying the
  candidate).

## Phase 2: Triangulation

| Season   | Misses  | Consensus     | Grey         | Tipper-specific | Field sources |
| -------- | ------- | ------------- | ------------ | --------------- | ------------- |
| 2023     | 70      | 51            | 9            | 10              | 26            |
| 2024     | 73      | 59            | 8            | 6               | 23            |
| 2025     | 60      | 48            | 6            | 6               | 23            |
| 2026 R13 | 30      | 25            | 3            | 2               | 28            |
| **All**  | **233** | **183 (79%)** | **26 (11%)** | **24 (10%)**    |               |

Miss rate by closeness confirms the T32 premise. An absolute predicted margin
below 6 had a 45% miss rate. The rates were 41% for 6-12, 25% for 12-24, and 11%
above 24. All 24 TS misses had an absolute predicted margin below 12, including
19 below 6.

**Character of the TS misses:** The model was narrowly wrong, not confidently
wrong. Its mean tip probability was 0.557. Its mean absolute predicted margin
was 3.9. Only four of 24 true winners fell below 0.40. However, mean absolute
actual margin was a decisive 24.1.

The field leaned only mildly the other way (mean 0.547 on the winner) yet was
right ≥65% of the time. Information existed. It affected sign rather than
magnitude. By contrast, v3 was more confident than the field on consensus
misses. These genuine upsets are irreducible at the field's information level.

**Who repeatedly beats us on TS misses:** Graft, s10, Wheelo Ratings, and Live
Ladders each scored 22/24. The Wooden Finger scored 21/24, and The Cruncher
scored 14/16. Do Not Blame the Data, AFL Lab, and Matter of Stats scored 20/24.
These are strong general quant models, not a single method family. Market-led
and teamsheet-aware sources are not over-represented. The result points to
better venue or team handling rather than one missing data feed.

**Mirror (preserve v3's edge):** 23 games v3 tipped right that ≥65% of the field
missed. True-home-interstate games account for 11, shared derbies for eight, and
shared-interstate games for four. Neutral venues account for none. V3's edge
lives in conventional-venue close calls. The N0 candidate below touches none of
them (verified: no mirror game flips).

## Phase 3: Clusters (Close Games |Pred|<12. Base TS Rate 6.3%)

| Cluster                                      | n (TS) | TS rate | Ratio    | Seasons          | Status                                   |
| -------------------------------------------- | ------ | ------- | -------- | ---------------- | ---------------------------------------- |
| **Neutral venue, tipped nominal home**       | 5/13   | 38%     | 6.1×     | 2024, 2025, 2026 | **Graduated to N0**                      |
| **St Kilda tipped, St Kilda lost**           | 6/53   | 11%     | 1.8×     | 2023, 2025, 2026 | Replicates. Parked (precedent)           |
| Away Brisbane Lions                          | 5/35   | 14%     | 2.3×     | 2023, 2024       | Parked: mixed direction, dead after 2024 |
| Wet weather                                  | 9/121  | 7.4%    | 1.2×     | Not available    | Flat (T26 re-confirmed)                  |
| Round phase, rest diff, post-bye, upset side |        |         | 0.7-1.3× | Not available    | Flat                                     |

- The neutral cluster is sharp: all 5 are "v3 tipped the designated home at a
  venue where nobody is home (Gather Round ×4, 2024 GF), home lost, field tipped
  away". Raw binomial p ≈ 0.001. Survives ~40-cell multiplicity at ~0.04.
  Replicated in three seasons. T22 independently found derbies/neutrals want ≈0
  HA. Mechanism: v3 grants a flat 5.6-pt prediction HA that is venue-conferred
  in reality, not fixture-conferred.
- The St Kilda cluster is directionally pure (6/6 "we tipped StK, they lost")
  but team-identity fixes are precedent-rejected: T24/T25 showed team residuals
  follow list state, and the structural answer (v4 walk-forward offsets) loses
  tips (T32). Carry as a diagnostic into the season-end v4 re-eval and the D1
  feature set, not a model tweak.

## Phase 4: Candidate N0 (Pre-Registered Before Running)

**Hypothesis:** Zero `prediction_home_advantage` when the home side is out of
its state at a ground that is not one of its (incl. Secondary) home grounds.
Single value, no sweep. Offline-exact (T22 method note) on engine `metrics.ts`
conventions.

| Window                   | Neutral games | Tips Δ                 | Close-band         | ΔLogLoss |
| ------------------------ | ------------- | ---------------------- | ------------------ | -------- |
| Primary 2021-25 (n=1062) | 56            | **+0** (won 2, lost 2) | 299/533 to 299/533 | −0.0011  |
| Early 2016-19 (n=828)    | 13            | **+1** (won 3, lost 2) | 230/410 to 231/410 | −0.0012  |
| 2026 R1-13 (n=115)       | 8             | **+0** (won 1, lost 1) | 34/49 to 34/49     | +0.0035  |

Pooled stratified bootstrap (seed 42/1000): ΔLogLoss −0.0011, CI [−0.0028,
+0.0006]. Last-3-seasons tips delta: +1. MAE −0.03.

**Why it fizzles despite the clean cluster:** Only games with 0 < pred margin <
5.6 can flip. Three of the five cluster misses had v3 margins of 6.8-10.2: the
HA term contributed but v3's underlying margin also leaned home. Removing HA
fixes 2 of 5 (Freo-Carlton 2024, Collingwood-Freo 2026) and surrenders one
previously correct tip (Sydney-Gold Coast 2026). LogLoss moves correctly and
consistently in both old windows. The mechanism is real and costs one config
field. However, the standalone candidate sits about five times below the
CI-width needed, let alone the 0.005 bar.

**Disposition:** Fold _neutral ≈ 0_ into the A2 end-of-2026 bucketed-HA bundle
({derby ≈20, true-home-interstate ≈110, **neutral ≈0**, else 80}). The
micro-effects remain individually below the bar. T22's effects were about
−0.002, and only a joint bundle has a chance of clearing it. Do not promote
standalone.

## Kill-Condition Assessment

Pre-registered: kill if ≥80% consensus misses AND no replicating
over-representation beyond closeness. The measured consensus rate is **79%**,
within rounding distance of the threshold. The TS remainder contains repeating
structure. However, the only actionable, mechanism-backed cluster adds one tip /
−0.0011 LogLoss. The spirit of the condition is met even though the letter
narrowly is not:

> **v3 has no exploitable blind spot of material size at the field's information
> level.** Its misses are overwhelmingly the field's misses. The 24 exceptions
> are 51/49 calls where stronger general models lean the other way: not a
> fixable feature gap. Comp gains from here come from new information (player
> availability, market signal: D4 stacking head), or from variance (the comp
> winner rotates yearly, T32).

2026 corroborates: only 2 of 30 misses are tipper-specific (7%) in the clean OOS
sample: v3 currently sits 4th of 29 with essentially field-typical misses.

## Artefacts

- `analysis/missed-tip-analysis-2023-2026.py`: phases 1-3 (tagging,
  triangulation, cross-tabs). Full tagged table to
  `/tmp/task33-games-tagged.csv`.
- `analysis/task33-misses-tagged.csv`: the 233 tagged misses (durable copy).
- `analysis/task33-neutral-ha-test.ts`: N0 offline-exact test (engine metrics,
  exact bootstrap). Validity-checked against official 0.8485/0.8555.
- No engine or config changes. No promotion.

## References

- [Squiggle API documentation](https://api.squiggle.com.au/)
