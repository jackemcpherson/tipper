# Task 25 (A1): Scored-Window Expansion — 2016–2019 Confirmatory Window

**Date:** 2026-06-12
**Baseline:** `predha-080` (v3) — 2021–2025 LogLoss 0.8485 (1,062 matches)
**Verdict:** Shipped (methodology, no model change). The scored window grows from 1,062 to
**1,890 matches** via a new confirmatory window (2016–2019, config `predha80-early`,
LogLoss 0.8555). An **era-stratified pooled bootstrap** (`bootstrapCompareStratified` in
`metrics.ts`) becomes the headline significance test for future candidates. The promotion
bar on the primary window is unchanged; 2020 stays train-only; the 2026 gate is untouched.

## 1. The confirmatory window

New config `predha80-early`: identical v3 parameters, `train_seasons: [2015]`,
`test_seasons: [2016–2019]`. Real walk-forward backtest against D1
(results-2026-06-12-909461e1.json):

| Window | n | LogLoss | Tips | MAE |
|---|---|---|---|---|
| 2016 | 207 | 0.7902 | 69.6% | 31.49 |
| 2017 | 207 | 0.8799 | 64.7% | 28.56 |
| 2018 | 207 | 0.8349 | 69.4% | 27.73 |
| 2019 | 207 | 0.9169 | 65.2% | 27.36 |
| **early 2016–19** | **828** | **0.8555** | **67.2%** | **28.79** |
| primary 2021–25 | 1062 | 0.8485 | 68.1% | 26.31 |
| pooled | 1890 | 0.8515 | 67.7% | 27.39 |

v3 generalises: the early window scores within 0.007 of the primary window despite a
one-season Elo warm-up (2015 only) and a different competitive era. MAE is higher in
2016–17 (higher-scoring era; margins larger league-wide).

### Validation against the known backwards run

2018/2019 replicate `predha-bw-080` (Task 22; warm-up 2015–2017) to the 4th decimal:
2018 LL 0.8349 vs 0.8348, 2019 0.9169 vs 0.9168. Not bit-identical — cause identified and
benign: in the backwards run 2016–17 were *train* seasons, so their PAV season states were
created without the prior-league carry (`harness.ts` season-boundary branch); the
end-of-2017 league accumulator that seeds 2018's R1 PAV therefore differs by ~0.05 PAV pts.
Elo is bit-identical match-by-match. The new run's chain (2016–17 fully modelled) is the
canonical one going forward.

## 2. Era-stratified pooled bootstrap (new tooling)

`bootstrapCompareStratified(strata, nBootstrap, seed)` added to `src/engine/metrics.ts`:
each stratum (era window) is resampled independently with replacement preserving its size,
deltas computed on the pooled resample. `bootstrapCompare` is now the single-stratum case
(bit-identical to its previous behaviour; existing tests unchanged and passing). Unit
tests added in `tests/engine/bootstrap.test.ts` (113 tests green).

**Evaluation procedure for future candidates:**
1. Primary window 2021–2025 — promotion bar unchanged (Δ > 0.005 + CI excl. zero + no
   2026 regression).
2. Early window 2016–2019 — mandatory confirmatory run (offline-exact where
   prediction-side; real backtest on `predha80-early`-derived config where update-side).
3. Headline significance: stratified pooled bootstrap across both windows (seed 42,
   1000 iter).
4. A candidate that wins pooled but *loses* on either window individually is suspect —
   report both window deltas alongside the pooled CI.

Floating-point note: `buildDelta` has no epsilon, so a degenerate CI of [1e-15, 1e-15] can
"exclude zero". Always read the CI magnitude, not just the flag.

## 3. Measured (not assumed) era sensitivities

| Quantity | 2016–19 | 2021–25 | config |
|---|---|---|---|
| Implied PAV calibration slope (OLS pavDiff→margin ÷ mprp) | 7.512 | 7.291 | 6.986 |
| Implied prediction HA (80 + bias/0.07) | 90 | 80 (by construction) | 80 |

- The PAV slope is era-sensitive at ~0.2 scale (early era favours a slightly hotter PAV
  signal), but both eras' implied slopes sit *above* the config value, so 6.986 is
  conservative in both — no action. Re-fit only if the blend architecture changes (D1).
- Early-window home bias is +0.67 pts/match → implied HA 90 vs config 80; combined with
  T22's 2018–19-only implied 65, this is era noise around 80, confirming the fixed value.

## 4. Cross-era replication of the tail bias (input to B2)

Per-team residuals on 2016–2019 (team-oriented, actual − predicted):

| Overpredicted | resid | t | Underpredicted | resid | t |
|---|---|---|---|---|---|
| Gold Coast | −15.3 | −3.90 | Geelong | +10.1 | +2.76 |
| Brisbane Lions | −9.5 | −2.49 | GWS Giants | +8.6 | +2.26 |
| Fremantle | −9.3 | −2.29 | Adelaide | +7.3 | +1.87 |
| Carlton | −8.1 | −2.35 | Sydney | +5.8 | +1.69 |

**The Task 24 pattern replicates with different teams.** The 2016–19 overpredicted class
is exactly that era's rebuilders/cellar dwellers (Gold Coast, post-2016 Brisbane,
rebuilding Carlton/Fremantle), while West Coast — the 2021–25 problem child — flips to
+2.7 in its premiership era, and North Melbourne to +0.2. This kills any "it's a
WCE-specific data quirk" theory: the phenomenon follows *list state*, not identity. B2's
walk-forward team offset has cross-era support before it is even built.

Geelong is underpredicted in both eras (+10.1 / +7.6) — plausibly the true-home-ground
structure T22's bucketed HA found (GMHBA vs interstate visitors ≈110). The B2 offset and
the A2 bucketed-HA re-test may both claim this; whichever ships first, re-test the other
against it.

## 5. First use: B1's convex map re-tested with pooled power

The Task 24 convex margin map (τ=150, s2=0.08), offline-exact on both windows, stratified
pooled bootstrap:

| | dLL |
|---|---|
| primary 2021–25 | −0.0010 |
| early 2016–19 | −0.0024 |
| **pooled (n=1890)** | **−0.0016, CI [−0.0033, −0.0001] — excludes zero** |

Exactly the power gain A1 promised: an effect invisible at n=1062 now resolves as real —
and as **tiny**. It stays rejected (≪ 0.005 bar), and Task 24's diagnosis stands: the
bulk of the tail residual is team-level, not gap-level. If B2 ships, re-run this; the
convex remainder may vanish entirely.

## Artifacts

- `configs/predha80-early/` — config + results (hash 909461e1)
- `src/engine/metrics.ts` — `bootstrapCompareStratified`, `PredictionStratum`
- `tests/engine/bootstrap.test.ts` — 6 new tests
- analysis script `/tmp/a1_analysis.ts` (ad-hoc, uses engine functions directly)
