# Task 25 (A1): Scored-Window Expansion: 2016-2019 Confirmatory Window

**Date:** 2026-06-12 **Baseline:** `predha-080` (v3): 2021-2025 LogLoss 0.8485
(1,062 matches) **Verdict:** Shipped (methodology, no model change). The scored
window grows from 1,062 to **1,890 matches** via a new confirmatory window
(2016-2019, config `predha80-early`, LogLoss 0.8555). An **era-stratified pooled
bootstrap** (`bootstrapCompareStratified` in `metrics.ts`) becomes the headline
significance test for future candidates. The promotion bar on the primary window
remains unchanged. 2020 stays train-only. The process leaves the 2026 gate
untouched.

## 1. The Confirmatory Window

New config `predha80-early`: identical v3 parameters, `train_seasons: [2015]`,
`test_seasons: [2016–2019]`. Real walk-forward backtest against D1
(results-2026-06-12-909461e1.json):

| Window            | n       | LogLoss    | Tips      | MAE       |
| ----------------- | ------- | ---------- | --------- | --------- |
| 2016              | 207     | 0.7902     | 69.6%     | 31.49     |
| 2017              | 207     | 0.8799     | 64.7%     | 28.56     |
| 2018              | 207     | 0.8349     | 69.4%     | 27.73     |
| 2019              | 207     | 0.9169     | 65.2%     | 27.36     |
| **early 2016-19** | **828** | **0.8555** | **67.2%** | **28.79** |
| primary 2021-25   | 1062    | 0.8485     | 68.1%     | 26.31     |
| pooled            | 1890    | 0.8515     | 67.7%     | 27.39     |

v3 generalises: the early window scores within 0.007 of the primary window
despite a one-season Elo warm-up (2015 only) and a different competitive era.
MAE is higher in 2016-17 (higher-scoring era. Margins larger league-wide).

### Validation Against the Known Backwards Run

The 2018/2019 results replicate `predha-bw-080` to four decimals after a
2015-2017 warm-up. The 2018 LogLoss values are 0.8349 and 0.8348. The 2019
values are 0.9169 and 0.9168. A benign cause explains the small difference. The
backwards run treated 2016-17 as training seasons, so the framework created
their PAV season states without the prior-league carry (`harness.ts`
season-boundary branch).

The end-of-2017 league accumulator that seeds 2018's R1 PAV therefore differs by
~0.05 PAV pts. Elo is bit-identical match-by-match. The new run's chain (2016-17
fully modelled) is the canonical one going forward.

## 2. Era-Stratified Pooled Bootstrap (New Tooling)

`bootstrapCompareStratified(strata, nBootstrap, seed)` entered
`src/engine/metrics.ts`: the method resamples each stratum (era window)
independently with replacement preserving its size, deltas computed on the
pooled resample. `bootstrapCompare` is now the single-stratum case
(bit-identical to its previous behaviour. Existing tests unchanged and passing).
Unit tests added in `tests/engine/bootstrap.test.ts` (113 tests green).

**Evaluation procedure for future candidates:**

1. Primary window 2021-2025: promotion bar unchanged (Δ > 0.005 + CI excl.
   Zero + no 2026 regression).
2. Early window 2016-2019: mandatory confirmatory run (offline-exact where
   prediction-side. Real backtest on `predha80-early`-derived config where
   update-side).
3. Headline significance: stratified pooled bootstrap across both windows (seed
   42, 1000 iter).
4. A candidate that wins pooled but _loses_ on either window individually is
   suspect: report both window deltas alongside the pooled CI.

Floating-point note: `buildDelta` has no epsilon, so a degenerate CI of [1e-15,
1e-15] can "exclude zero". Always read the CI magnitude, not just the flag.

## 3. Measured (Not Assumed) Era Sensitivities

| Quantity                                                     | 2016-19 | 2021-25              | config |
| ------------------------------------------------------------ | ------- | -------------------- | ------ |
| Implied PAV calibration slope (OLS pavDiff to margin ÷ mprp) | 7.512   | 7.291                | 6.986  |
| Implied prediction HA (80 + bias/0.07)                       | 90      | 80 (by construction) | 80     |

- The PAV slope is era-sensitive at ~0.2 scale (early era favours a slightly
  hotter PAV signal), but both eras' implied slopes sit _above_ the config
  value, so 6.986 is conservative in both: no action. Re-fit only if the blend
  architecture changes (D1).
- Early-window home bias is +0.67 pts/match to implied HA 90 vs config 80.
  Combined with T22's 2018-19-only implied 65, this result is era noise around
  80, confirming the fixed value.

## 4. Cross-Era Replication of the Tail Bias (Input to B2)

Per-team residuals on 2016-2019 (team-oriented, actual − predicted):

| Overpredicted  | resid | t     | Underpredicted | resid | t     |
| -------------- | ----- | ----- | -------------- | ----- | ----- |
| Gold Coast     | −15.3 | −3.90 | Geelong        | +10.1 | +2.76 |
| Brisbane Lions | −9.5  | −2.49 | GWS Giants     | +8.6  | +2.26 |
| Fremantle      | −9.3  | −2.29 | Adelaide       | +7.3  | +1.87 |
| Carlton        | −8.1  | −2.35 | Sydney         | +5.8  | +1.69 |

**The Task 24 pattern replicates with different teams.** The 2016-19
overpredicted class contains that era's rebuilding and cellar-dwelling teams.
These teams include Gold Coast, post-2016 Brisbane, Carlton, and Fremantle. West
Coast: the 2021-25 problem child: flips to +2.7 in its premiership era, and
North Melbourne to +0.2. This kills any "it is a WCE-specific data quirk"
theory: the phenomenon follows _list state_, not identity. B2's walk-forward
team offset has cross-era support before it is even built.

Geelong is underpredicted in both eras (+10.1 / +7.6): plausibly the
true-home-ground structure T22's bucketed HA found (GMHBA vs interstate visitors
≈110). The B2 offset and the A2 bucketed-HA re-test may both claim this.
Whichever ships first, re-test the other against it.

## 5. First Use: B1's Convex Map Re-Tested with Pooled Power

The Task 24 convex margin map (τ=150, s2=0.08), offline-exact on both windows,
stratified pooled bootstrap:

|                     | dLL                                               |
| ------------------- | ------------------------------------------------- |
| primary 2021-25     | −0.0010                                           |
| early 2016-19       | −0.0024                                           |
| **pooled (n=1890)** | **−0.0016, CI [−0.0033, −0.0001]: excludes zero** |

Exactly the power gain A1 promised: an effect invisible at n=1062 now resolves
as real: and as **tiny**. It stays rejected (≪ 0.005 bar), and Task 24's
diagnosis stands: the bulk of the tail residual is team-level, not gap-level. If
B2 ships, re-run this. The convex remainder may vanish entirely.

## Artefacts

- `configs/predha80-early/`: config + results (hash 909461e1).
- `src/engine/metrics.ts`: `bootstrapCompareStratified`, `PredictionStratum`.
- `tests/engine/bootstrap.test.ts`: 6 new tests.
- `/tmp/a1_analysis.ts` is an ad hoc analysis that calls engine functions.
