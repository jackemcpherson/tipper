# Changelog

## [3.4.0] - 2026-06-13

### Model: v3 (`predha-080`) unchanged

The current pointer stays at `predha-080`. Two engine candidates were
prototyped and one feature was killed under the new pre-registration
rule (Task 35); the model itself didn't move.

### Research (Tasks 33–37)

The full rethink agenda (`docs/task-24-tail-diagnostic.md` onward) was
executed in two sittings:

- **Task 33** — missed-tip field triangulation: 79% of v3's 233 misses
  are consensus misses; one replicating cluster (neutral-venue HA) is
  worth +1 tip / −0.0011 LL, folded into the A2 bundle.
- **Task 34** — closing market benchmark (D4-i): market wins ~0 tips
  recent, would have won none of the last four comps. Product decision:
  tipper stays market-independent; market becomes the A3 monitor column.
- **Task 35** — learned stacking head (D1): three walk-forward variants
  (ridge, logistic, residual-shrink) all significantly worse on both
  metrics. Combiners over the existing features are dead until a new
  feature first survives a univariate pre-registered test.
- **Task 36** — offence/defence split ratings (D2): pooled Δ LL −0.0054
  (CI [−0.0007, +0.0110] just inside zero), close-band signs +18 pooled,
  recent-3 tips +5 (vs v4 −9, the opposite fingerprint), 2026 R1–R14
  Δ LL −0.0182 with tied tips. Comp-passing on every criterion except
  the strict CI lower bound — **parked** pending end-of-2026 re-pool
  with R14+ accrued.
- **Task 37** — age-curve PAV priors (T30 tipper-side, the first
  feature run under the pre-registration rule): pooled LL got worse on
  both training windows at every dose; survivor-bias in the
  within-player fit + tiny lever arm at K=15. **Killed.**

### New: A3 weekly comp monitoring

`analysis/weekly-monitor.py` productionizes the T32/T34 conventions into
a repeatable run: refreshes v3 + v4-shadow + (T36) OD-shadow backtests,
scores against the Squiggle field on tips, tracks close-band
(|v3 pred margin| < 12) sign accuracy, and includes a Punters market
column (T34 ≈ closing odds). Alerts at ±3 tips season-to-date drift
(exit code 2). Append-style CSV log at `analysis/weekly-monitor-log.csv`,
one row per run date (idempotent). First R14 row: v3 86/116 (rank 4/30),
v4-shadow 82 (13th), OD-shadow 86 (tied 4th), market gap +3 — alert
fired.

### Engine machinery (all bit-inert when the new config fields are absent)

- `src/engine/odelo.ts` + optional `elo.od.{weight, k,
  home_advantage_points, initial_score, regression_to_mean,
  shot_score_weight?}` block. Parallel attack/concede state in points
  space, mixed into the Elo slot of the blend. `od-w100-k008` is the
  leading T36 candidate; 12 sweep variants kept as the audit trail.
- `src/engine/prior.ts`: age-curve helpers (`AGE_TRANSITION_RATIO`,
  `ageAtDate`, `applyAgeCurve`) and optional `pav.age_curve_weight`.
  T37 killed the global multiplier; helpers ship for a future
  selection-corrected, per-zone, or R1-only retry.
- `src/data/queries.ts`: `fetchPlayerDobs` and
  `HarnessData.dobByPlayerId` plumbing so the engine can see player DOB
  at season-boundary time.

### Procedure / bar changes

- **Tips criterion is now part of the promotion bar** (added Task 32):
  no tip regression vs the incumbent on the pooled scored windows, AND
  a recent-3-seasons (currently 2023–25) tip deficit is disqualifying.
  This is what kept v4 reverted, parked T36, and would have killed any
  age-curve dose even if LogLoss had moved.
- **Pre-registration rule** (added Task 35, first applied Task 37):
  any new feature must survive a univariate test with the hypothesis +
  acceptance criterion written down BEFORE the backtests run. Combiners
  over existing features need a *new* feature to combine first.
- **DOB backfill in afl-stats** (work in
  jackemcpherson/AFL-MCP `scripts/backfill-dob.mts`): per-AFLM-season
  DOB coverage went 0–10% → 99% for 1998–2014 and 97–100% for
  2015–2025. Source: AFL Tables all-time team lists via fitzroy, with
  a direct-fetch override for Brisbane Lions (fitzroy 3.0.1 slug bug:
  brisbane.html instead of brisbanel.html). Unblocked T30 / T37
  tipper-side; T37's verdict then closed the work for now.

## [3.3.1] - 2026-06-12

### Model: reverted to v3 (`predha-080`)

The product goal is Squiggle's model comp (2027), which is **scored on
tips**. Re-ranking against the live Squiggle field (task 32) showed v4
trails v3 on tips in every recent season (2023–2026: 0/−4/−1/−4, −9
cumulative over 763 games) despite better LogLoss and MAE — v4's margin
gains are concentrated in already-decided games while close-game sign
accuracy suffers. v3 placed 2nd (2024) and 4th (2026 to date) on the comp
metric; v4's best is 12th–13th.

The v4 engine machinery (`shot_margin_weight`, `team_offset`) remains and
is bit-inert when unset; tips-first re-evaluation at 2026 season end.
The promotion bar now additionally requires no tip regression vs the
incumbent on the pooled scored windows (recent-season deltas reported
separately).

## [3.3.0] - 2026-06-12

### Model: v4 promoted (`v4-shotoff`)

Two combined mechanisms, each individually sub-bar but nearly additive
(tasks 28 and 31):

- **Scoring-shot Elo updates** (`elo.shot_margin_weight: 1.0`) — the Elo
  update margin is the scoring-shot-implied margin (shots × 3.64 league
  pts/shot), removing conversion luck from the update signal
- **Walk-forward team offsets** (`output.team_offset: {k: 32,
  season_carry: 0.5}`) — a heavily-shrunk per-team performance-vs-rating
  estimate learned from prediction residuals, applied at prediction time
  (the Task 24 cellar-dweller tail bias, e.g. West Coast −16.7 pts/match)

Results: 2021–2025 LogLoss 0.8409 (−0.0075 vs v3), 2016–2019 confirmatory
window 0.8454 (−0.0100), era-stratified pooled bootstrap CI [−0.0144,
−0.0026] excludes zero (Brier CI too), 2026 gate flat (+0.0003, n=115).
First promotion under the two-window evaluation procedure.

### Methodology

- Scored window expanded to 1,890 matches: 2016–2019 added as a mandatory
  confirmatory window (`predha80-early`); 2020 stays train-only
- `bootstrapCompareStratified` in `metrics.ts` — era-stratified pooled
  paired bootstrap, now the headline significance test
- Five further directions resolved negative with documented evidence:
  convex margin maps (task 24), rest/travel differentials (task 26),
  round-phase blend schedules (task 27), rating_points as a second player
  signal (task 29), age-curve priors (blocked on DOB coverage, task 30)

## [3.2.0] - 2026-06-12

### Model: v3 promoted (`predha-080`)

Predictions previously contained no home advantage at all —
`elo.home_advantage` only shaped Elo update sizes, leaving a systematic
+5.6 pt bias against home teams. New `output.prediction_home_advantage`
(80 rating points) corrects it:

- 2021–2025: LogLoss 0.8485 (−0.0128 vs v2), tips 68.1%, MAE 26.31
- 2026 out-of-sample (115 matches): LogLoss 0.7925 (−0.0405 vs v2,
  bootstrap CI excludes zero), tips 73.7%

See `docs/task-20-prediction-home-advantage.md`. Two further experiments
were run and rejected with documented evidence: opponent-adjusted PAV
(task 19) and per-zone blend slopes (task 21). Their engine support
remains behind optional config fields that are inert when unset.

### Harness fixes

- **Warm-up gap**: `backtest -s`, `predict`, and `compare` now warm up
  over seasons between the train window and the target — previously a
  2026 run jumped from 2020 Elo state straight to 2026 (live `predict`
  was affected too)
- Results filenames include the short config hash so scope-overridden
  runs can't overwrite same-day promotion-valid results
- Promotion guardrail accepts any results file matching the current
  config hash, not just the lexically-latest file
- Stale wrangler OAuth tokens are skipped during credential resolution

### CLI improvements

- `compare -s <seasons>` — score a comparison on an overridden window
  (e.g. `tipper compare -a predha-080 -b pavfix-blend-w06 -s 2026`)
- Backtest results now include per-zone PAV sums per match
  (`homePavZones`/`awayPavZones`) for diagnostics

## [3.1.0] - 2026-05-01

### CLI improvements

- Added short flags across all commands: `-s` (season), `-r` (round),
  `-c` (config), `-j` (json), `-t` (team), `-a`/`-b` (compare configs)
- **Breaking**: Renamed `--round-number` to `--round` (`-r`)

### Example usage

```bash
tipper predict -s 2026 -r 7
tipper backtest -s 2024,2025 -c pavfix-blend-w06 -j
tipper compare -a elo-only-v1 -b pavfix-blend-w06
```

## [3.0.0] - 2026-04-30

**Breaking**: The CLI no longer requires a running Cloudflare Worker.
All commands (backtest, predict, compare) now call the D1 REST API
directly and run the engine locally.

### Setup change

Just `wrangler login` — the CLI reads the OAuth token from
`~/.wrangler/config/default.toml` automatically. No env vars needed.

Env var override (`CLOUDFLARE_API_TOKEN`) still works for CI or
machines without wrangler.

### Architecture changes

- **D1 REST client** (`src/data/d1-rest.ts`): D1Database-compatible shim
  that calls the Cloudflare D1 HTTP API. `queries.ts` is unchanged.
- **Shared orchestration** (`src/orchestration.ts`): Extracted
  `fetchHarnessData`, `runBacktest`, `runPrediction`, `runCalibration`,
  `runCompare`, and `runDeriveVenueHA` from `worker.ts` into a shared
  module used by both the CLI and the Worker.
- **Worker** (`src/worker.ts`): Now a thin HTTP wrapper around the shared
  orchestration layer (~80 lines, down from ~550).
- **CLI commands**: Call orchestration functions directly instead of
  POSTing to `http://localhost:8787`.

### Removed

- `WORKER_URL` constant — CLI no longer needs a local worker endpoint.

## [2.0.0] - 2026-04-30

v2 restores the PAV player-quality signal after fixing a 100x defence
scaling bug that had invalidated all prior PAV work. The corrected PAV
blend produces the first statistically significant improvement in the
project's history.

### Model changes

- **PAV defence formula fix** (Task 13): Removed spurious `100 *`
  multiplier in `pav.ts` that inflated defensive PAV by 100x. All prior
  PAV-related decisions were invalidated.
- **PAV re-calibration** (Task 15A): Re-derived `pav_calibration_slope`
  from 0.246 to 6.986 against corrected PAV values.
- **Blend weight restored** (Task 15B): Optimal blend moved from
  weight_elo=1.0 (Elo-only) to weight_elo=0.6 (60% Elo, 40% PAV).
  LogLoss improved by 0.012 with bootstrap 95% CI excluding zero.
- **Contextual K-factor** (Task 16): Implemented but not shipped.
  Improvement (0.0005 LogLoss) below noise floor.
- **Ground-specific HA** (Task 17): Implemented but not shipped.
  Derived venue HA values degraded performance vs static HA=160.

### Engine additions

- `src/engine/prng.ts` — Seeded Mulberry32 PRNG for reproducible bootstrap
- `src/engine/venue.ts` — Per-venue home advantage derivation via OLS
- `src/engine/elo.ts` — Added `EloHistory`, `computeContextualK()`,
  `resolveHomeAdvantage()`; `updateElo()` now accepts optional history
- `src/engine/metrics.ts` — Added `bootstrapCompare()` for paired
  bootstrap confidence intervals
- `src/config/schema.ts` — Added `k_context_sensitivity`,
  `k_context_window`, `home_advantage_source`, `venue_ha` (all with
  backward-compatible defaults)

### CLI additions

- `tipper compare --config-a <id> --config-b <id>` — Bootstrap-compare
  two configs with paired 95% CIs

### Worker additions

- `POST /compare` — Run two backtests and return bootstrap comparison
- `POST /derive-venue-ha` — Derive per-venue HA from historical data

### Validation (Task 18)

- In-sample (2021-2025): LogLoss 0.8607 (was 0.8727), Brier 0.2060
- Backwards (2018-2019): LogLoss 0.8845 (cross-era gap 0.024)
- Forward (2026, 63 matches): LogLoss 0.8029, 77.8% tips
- Squiggle benchmark: 1st of 29 sources on 2026 LogLoss

### v2 model parameters

```
K=25, HA=160, RTM=0.10, weight_elo=0.6
pav_calibration_slope=6.986, sigma=36
```

## [1.5.0] - 2026-04-26

Elo-only model after initial PAV was benched (later found to be due to
the defence bug). Tasks 5-12 documented in `docs/`.

- Removed PAV from prediction path (weight_elo=1.0)
- RTM changed from 0.0 to 0.10 (out-of-sample validation)
- HA increased from 80 to 160 (extended sweep)
- Sigma confirmed at 36 (already optimal)
- Validated against Squiggle, backwards/forwards windows, bootstrap CIs
- Per-team audit identified 7 systematically misrated teams

## [1.0.0] - 2026-04-26

Initial tuned model. Tasks 1-4 in `docs/v1-tuning-report.md`.

- Blend weight sweep: weight_elo=0.9 optimal (with broken PAV)
- K-factor: 20 to 25
- Home advantage: 30 to 80
- Regression to mean: 0.33 to 0.0 (later corrected to 0.10 in v1.5)
- LogLoss: 0.887 to 0.872

## [0.1.0] - 2026-04-25

Initial implementation.

- MOV-Elo rating system (538-style)
- Round-by-round PAV computation (HPN formula)
- Walk-forward backtest harness
- Cloudflare Worker + D1 backend
- Commander CLI (backtest, predict, config)
