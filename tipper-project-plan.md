# tipper — AFL match prediction CLI

> **For implementation by Claude Code.** This is a v1 plan. Decisions documented here are locked unless explicitly revisited. Open questions are flagged in [§14](#14-open-questions-deferred-to-v2).

---

## 1. Overview

`tipper` is a CLI tool that predicts AFL match outcomes by combining a team-level MOV-Elo rating with player-level PAV ratings, blended at the team-rating level (538-style architecture). Model parameters live in versioned config files; backtest results are stored alongside configs as immutable artifacts. Eventual deployment target is a Cloudflare Worker; v1 is a TypeScript CLI that runs against the existing AFL D1 database.

### Goals

1. Predict winners and margins for upcoming AFL rounds, given named lineups
2. Make model parameters versionable, comparable, and reproducible artifacts
3. Provide a backtest harness that produces apples-to-apples comparisons across configs

### Non-goals (v1)

- Season simulation / ladder projection / finals odds (v2)
- Live in-game probability updates (v3+)
- AFLW support (planned but out of scope; CLI flags accommodate it)
- Web UI or dashboard

---

## 2. Tech stack

| Layer | Choice | Rationale |
|---|---|---|
| Language | TypeScript | Single codebase from dev to prod Worker |
| Runtime (dev) | Node.js (latest LTS) | Standard for TS CLIs |
| Runtime (prod) | Cloudflare Workers | Stated deployment target |
| Database | Cloudflare D1 (SQLite) | Existing AFL data; same binding in dev and prod |
| Local D1 access | `wrangler dev` | Wrangler binds local CLI to remote D1 |
| CLI framework | `commander` or `cac` | Pick one; both are fine |
| Validation | `zod` | Config schema + runtime validation |
| Package manager | `pnpm` | Recommended; team preference fine |
| Test runner | `vitest` | TS-native, fast, jest-compatible API |

### Package metadata

- npm name: `@jackemcpherson/tipper`
- bin: `tipper`
- Node engines: `>=20`

---

## 3. Project layout

```
tipper/
├── package.json
├── tsconfig.json
├── wrangler.toml                    # D1 binding config
├── README.md
├── src/
│   ├── cli/
│   │   ├── index.ts                 # entry point, command registry
│   │   ├── commands/
│   │   │   ├── backtest.ts
│   │   │   ├── predict.ts
│   │   │   └── config/
│   │   │       ├── list.ts
│   │   │       ├── show.ts
│   │   │       ├── current.ts
│   │   │       ├── promote.ts
│   │   │       ├── diff.ts
│   │   │       └── create.ts
│   │   ├── format/
│   │   │   ├── human.ts             # human-readable output
│   │   │   └── json.ts              # JSON contract
│   │   └── flags.ts                 # shared flag definitions (fitzRoy-aligned)
│   ├── engine/
│   │   ├── elo.ts                   # MOV-Elo update + state
│   │   ├── pav.ts                   # round-by-round PAV computation
│   │   ├── prior.ts                 # Bayesian prior blending
│   │   ├── blend.ts                 # team-rating blend (Elo + PAV)
│   │   ├── predict.ts               # rating diff → margin → win prob
│   │   └── harness.ts               # walk-forward backtest driver
│   ├── data/
│   │   ├── queries.ts               # all SQL strings, single source of truth
│   │   └── types.ts                 # row types matching schema
│   ├── config/
│   │   ├── schema.ts                # Zod schemas for config + results
│   │   ├── store.ts                 # filesystem-backed config CRUD
│   │   └── hash.ts                  # content hashing
│   └── types.ts                     # cross-cutting types
├── tests/
│   ├── engine/                      # unit tests for engine modules
│   ├── config/                      # config validation, hashing, promotion
│   └── golden/                      # golden-file backtest reproducibility
├── configs/
│   ├── _current.json                # pointer to current best config
│   └── <config-id>/
│       ├── config.json
│       └── results-<run-iso-date>.json
└── .github/workflows/
    └── ci.yml
```

### Notes on layout

- **`src/data/queries.ts` is the only place SQL strings live.** Every query has a named export. This makes it trivial to audit what the engine reads and to swap data sources later if needed.
- **`src/engine/` is pure functions where possible.** Each engine module takes its inputs explicitly — no module reaches for a database, a config file, or globals. The CLI layer is responsible for assembling inputs and calling engine functions. This is what makes unit testing straightforward and makes the eventual Worker port a simple wiring exercise.
- **`configs/` lives in the repo and is committed.** Git is the version history.

---

## 4. CLI surface

All commands accept fitzRoy-aligned flags where applicable:

| Flag | Type | Default | Notes |
|---|---|---|---|
| `--season` | int or comma-list | required | Year(s), e.g. `2024` or `2021,2022,2023` |
| `--round-number` | int | (omitted) | Specific round; if omitted, all rounds in scope |
| `--comp` | string | `AFLM` | Reserved for AFLW expansion; only `AFLM` supported in v1 |
| `--team` | string | (none) | Filter to a single team |
| `--config` | string | reads `configs/_current.json` | Config ID override |
| `--json` | bool | `false` | Switch from human format to JSON output |
| `--reason` | string | required for `promote` | Promotion reason (audit trail) |

### Commands

#### `tipper predict`

Predicts match outcomes for a specific round. Requires named lineups in `match_lineups` for the matches in scope.

```
tipper predict --season 2026 --round-number 7
tipper predict --season 2026 --round-number 7 --team "Geelong"
tipper predict --season 2026 --round-number 7 --json
tipper predict --season 2026 --round-number 7 --config experimental-blend-v3
```

Default output (human format) shows config header + one row per match with predicted winner, predicted margin, and win probability. JSON output emits the contract defined in [§7](#7-results-and-prediction-contract).

#### `tipper backtest`

Runs walk-forward predictions across one or more historical seasons and reports aggregate metrics.

```
tipper backtest --season 2024
tipper backtest --season 2021,2022,2023,2024,2025
tipper backtest --season 2024 --config experimental-blend-v3
tipper backtest --season 2024 --json > results.json
```

Persists results to `configs/<config-id>/results-<iso-date>.json`. Always reads current config unless `--config` is specified.

#### `tipper config <subcommand>`

| Subcommand | Description |
|---|---|
| `list` | All configs with one-line headline metric per config |
| `show <id>` | Pretty-print full config + most recent results |
| `current` | Print current config ID and promotion reason |
| `diff <id1> <id2>` | JSON-diff of two configs |
| `promote <id> --reason "..."` | Update `_current.json` (guarded — see §6) |
| `create <id> --from <existing-id>` | Scaffold a new config by copying an existing one |

---

## 5. Config schema (Zod)

```ts
const ConfigSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),         // human-readable, kebab-case
  schema_version: z.literal(1),
  notes: z.string().optional(),

  elo: z.object({
    k: z.number().positive(),                    // base K-factor
    initial_rating: z.number(),
    home_advantage: z.number(),                  // in Elo points
    regression_to_mean: z.number().min(0).max(1),// off-season pull-toward-1500
    mov_multiplier: z.enum(['538_log', 'none']), // formula by name
  }),

  pav: z.object({
    computation: z.literal('round_by_round_cumulative'),
    prior_weight_k: z.number().nonnegative(),    // games-of-current-equivalence
    prior_source: z.enum(['previous_season_final']),
    missing_player_default: z.number(),
    include: z.enum([
      'named_lineup_excl_emerg',
      'named_lineup_incl_emerg',
      'actually_played',
      'starting_18_only',
    ]),
  }),

  blend: z.object({
    weight_elo: z.number().min(0).max(1),        // 1.0 = pure Elo, 0.0 = pure PAV
    where: z.literal('team_rating'),             // future: 'prediction'
  }),

  output: z.object({
    margin_per_elo_point: z.number(),            // rating diff → predicted margin
    sigma: z.number().positive(),                // for win prob via normal CDF
  }),

  backtest: z.object({
    train_seasons: z.array(z.number()),
    test_seasons: z.array(z.number()),
    walk_forward: z.literal(true),
  }),
});

type Config = z.infer<typeof ConfigSchema>;
```

### Config invariants

- `id` is human-authored, kebab-case, unique
- All tunable knobs live in this schema; nothing else in the engine has tunable parameters
- Schema versioned via `schema_version` for future migration

### Hashing

Content hash = SHA-256 of the canonical JSON of `config` minus `id` and `notes`. Two configs with the same hash are the same model; if their results differ, that's a bug. Hash is recorded in the results bundle but not in the config file (so renaming `id` doesn't require re-running backtests).

---

## 6. Configs directory and the `_current.json` pointer

### Layout

```
configs/
├── _current.json
├── elo20-pav-prior15-blend60-v1/
│   ├── config.json
│   └── results-2026-04-26.json
├── elo15-pav-prior10-blend50-v2/
│   ├── config.json
│   ├── results-2026-04-20.json
│   └── results-2026-04-26.json
└── ...
```

### `_current.json` shape

```json
{
  "config_id": "elo20-pav-prior15-blend60-v1",
  "promoted_at": "2026-04-26T10:00:00Z",
  "promoted_from": "elo20-pav-only-v0",
  "promotion_reason": "first config to beat home-advantage baseline by 5pp+ on 2023-2025"
}
```

### Promotion guardrails

`tipper config promote <id>` MUST refuse to proceed if any of:

1. The config does not exist in `configs/`
2. The config has zero results files
3. The most recent results file's `config_hash` does not match the current config's content hash (means the config was edited after backtesting; results are stale)
4. The `--reason` flag is missing or empty

Rationale: we never want a "current" model that has not been tested in its current state.

### Multiple results per config

Re-running a backtest with the same config (e.g. after new data lands) appends a new `results-<date>.json`. The config itself is immutable once written. To change parameters, create a new config with `tipper config create <new-id> --from <existing-id>` and edit the new file.

---

## 7. Results and prediction contract

Both `predict` and `backtest` emit the same shape, with `backtest` adding `actual_*` fields and aggregate metrics.

### Per-match prediction (used by both commands)

```ts
type MatchPrediction = {
  match_id: number;
  date: string;                     // ISO YYYY-MM-DD
  round: string;                    // e.g. "R7", "GF"
  round_number: number;             // numeric, including 0 for Opening Round
  home: string;
  away: string;
  venue: string;

  // model state used for prediction
  home_team_rating: number;         // post-blend
  away_team_rating: number;
  home_elo: number;                 // raw Elo component
  away_elo: number;
  home_pav_total: number;           // raw summed PAV component
  away_pav_total: number;

  // outputs
  predicted_margin: number;          // home minus away, points
  predicted_winner: 'home' | 'away';
  win_probability: { home: number; away: number };

  // for backtest only
  actual_margin?: number;
  actual_winner?: 'home' | 'away' | 'draw';
  correct?: boolean;
};
```

### Backtest results bundle

```ts
type BacktestResults = {
  config_id: string;
  config_hash: string;
  ran_at: string;                    // ISO timestamp
  data_through: string;              // latest match date in DB at run time
  scope: {
    seasons: number[];
    rounds?: number[];
    teams?: string[];
  };

  overall: {
    matches: number;
    tips: number;                    // correct picks
    tip_pct: number;
    mae_margin: number;
    rmse_margin: number;
    log_loss_bits: number;           // base-2
    brier: number;
  };

  by_season: Record<string, OverallMetrics>;
  by_round?: Array<{ round_number: number } & OverallMetrics>;

  calibration: Array<{
    bucket: string;                  // e.g. "0.5-0.6"
    predicted: number;
    actual: number;
    n: number;
  }>;

  matches: MatchPrediction[];
};
```

### Human-format header (both commands)

Always show a header containing config ID, config hash (short), run timestamp, data freshness, and scope. Critical for sanity-checking which config produced which output.

```
Round 7, 2026 — predictions
Config: elo20-pav-prior15-blend60-v1 (a3f8...) | Run: 2026-04-26 10:00 AEST | Data: 2026-04-19
─────────────────────────────────────────────────────────────────────────────────
Western Bulldogs vs Sydney (Marvel)        Sydney by 28    (69%)
Richmond vs Melbourne (MCG)                Melbourne by 22 (66%)
Hawthorn vs Gold Coast (UTAS)              Gold Coast by 7 (54%)
...
```

---

## 8. Engine architecture

The engine is composed of small, pure modules. Data flows in one direction.

```
                    ┌─────────────┐
                    │  D1 query   │  src/data/queries.ts
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Match      │  one batch per match
                    │  iterator   │  in chronological order
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
     ┌──────────┐   ┌──────────┐   ┌──────────┐
     │ Elo      │   │ PAV      │   │ Prior    │
     │ updater  │   │ computer │   │ blender  │
     └────┬─────┘   └────┬─────┘   └────┬─────┘
          │              │              │
          └──────┬───────┴──────────────┘
                 ▼
          ┌─────────────┐
          │ Team-rating │  src/engine/blend.ts
          │ blender     │
          └──────┬──────┘
                 │
                 ▼
          ┌─────────────┐
          │ Predictor   │  src/engine/predict.ts
          │ (margin →   │
          │  win prob)  │
          └─────────────┘
```

### Module responsibilities

| Module | Inputs | Outputs | Notes |
|---|---|---|---|
| `elo.ts` | match result, current Elo state | new Elo state, prediction confidence | MOV-Elo update with 538 log multiplier |
| `pav.ts` | box-score stats + team strength + league avgs | Off/Mid/Def/Total PAVs per player per round | HPN formula, recomputed cumulatively each round |
| `prior.ts` | prior-season PAV, current-season cumulative PAV, K | blended PAV | Bayesian prior with weight K |
| `blend.ts` | team Elo, summed team PAV, blend weight | single team rating | `α × elo + (1-α) × pav_calibrated` |
| `predict.ts` | rating differential, sigma, margin_per_elo | margin, win probability | Normal CDF for win prob |
| `harness.ts` | seasons, config, db | iterates matches, drives engine, collects MatchPrediction[] | Walk-forward |

### Walk-forward semantics

Process matches in strict chronological order (date, then time within date if available). For each match:
1. Read current Elo and PAV states (from in-memory state, populated by all prior matches)
2. Read the named lineup for this match from `match_lineups`
3. Compute team ratings → prediction
4. Record prediction
5. Read actual result → update Elo and PAV state for use in subsequent matches

State for a backtest run is in-memory only. Each backtest run rebuilds state from scratch starting at the earliest match in the requested seasons, with off-season regression applied at season boundaries.

For predictions of upcoming rounds, state is built from all completed matches up to the round immediately prior, then prediction is run against the named lineups for the requested round.

---

## 9. The v1 model (locked specification)

### Team Elo

Standard MOV-Elo:

```
expected = 1 / (1 + 10^((R_opp - R_self - home_advantage_if_home) / 400))
mov_multiplier = log(|margin| + 1) × 2.2 / (rating_diff × 0.001 + 2.2)
new_rating = R_self + K × mov_multiplier × (actual_result - expected)
```

`actual_result` ∈ {1, 0.5, 0}. `home_advantage_if_home` is `home_advantage` for home team, 0 for away team. Regression to mean is applied at off-season: `R_new = R_old + regression_to_mean × (1500 - R_old)`.

Initial rating for new teams or first appearance: `initial_rating` (default 1500).

### Round-by-round PAV (HPN formula, applied cumulatively)

After each round, recompute for every team:

```
team_offence  = (team_points / team_inside_50s) / league_avg_points_per_i50
team_midfield = team_inside_50s / opponent_inside_50s
DN            = (points_conceded / inside_50s_conceded) / league_avg
team_defence  = 100 × ((2 × DN - DN²) / (2 × DN)) × 2
```

Then for every player who played, compute involvement scores using the box-score formulas:

```
off_score = (goals × 6 + behinds) + 0.25 × hitouts + 3 × goal_assists 
          + inside_fifties + marks_inside_fifty + (free_kicks_for - free_kicks_against)

def_score = 20 × rebounds + 12 × one_percenters 
          + (marks - 4 × marks_inside_fifty + 2 × (free_kicks_for - free_kicks_against))
          - (2/3) × hitouts

mid_score = 15 × inside_fifties + 20 × clearances + 3 × tackles 
          + 1.5 × hitouts + (free_kicks_for - free_kicks_against)
```

Apportionment to PAV: each player's share of their team's total in each zone × the team's PAV pool for that zone. PAV pool scales linearly with games played (the canonical 100 × num_teams per zone is for a full season).

All sums are cumulative across the current season. League averages are also computed cumulatively from current-season data.

### Bayesian prior cold start

For early-season rounds, blend prior-season final PAV with current-season cumulative PAV:

```
weighted_pav = (K × prior_final_pav + games_played_this_season × current_cumulative_pav)
             / (K + games_played_this_season)
```

K is `pav.prior_weight_k` from config. Default starting value: 15. Tuneable via backtest.

For a player with no prior-season PAV (debutant), prior = `pav.missing_player_default`.

### Team rating blend

```
team_rating = blend.weight_elo × elo_rating + (1 - blend.weight_elo) × pav_calibrated
```

`pav_calibrated` is the team's summed player PAV scaled into Elo-equivalent units. Calibration constant must be derived during model setup such that one unit of summed PAV at the team level maps to a comparable spread in Elo points. Suggested approach: regress historical summed-PAV against historical Elo on the training seasons, use the slope.

### Margin and win probability

```
predicted_margin = (home_team_rating - away_team_rating) × output.margin_per_elo_point
win_prob_home    = NormalCDF(predicted_margin / output.sigma)
```

`output.margin_per_elo_point` and `output.sigma` are config-level tunables. Sensible starting values:
- `margin_per_elo_point`: 0.07 (i.e. 100 Elo ≈ 7 points, derived from AFL data)
- `sigma`: 36 (typical AFL margin standard deviation around 36 points)

These are knobs at v1, not auto-fit.

---

## 10. Data access

- **Single path**: live D1 in dev, test, and prod
- **No snapshots, no flat files, no caching layer**
- Engine functions take a `D1Database` as an argument (never reach for it from globals)
- `wrangler.toml` defines the binding; `wrangler dev` provides it locally
- Tests inject a fake `D1Database` for unit tests
- All SQL lives in `src/data/queries.ts` as named exports

---

## 11. Backtest harness specifications

### Default backtest scope

- Test seasons: 2021-2025 (5 seasons, ~1000 matches)
- Train seasons: 2020 (used for warming up Elo state and computing prior PAV for 2021)
- Walk-forward only; no retrodiction

### Metrics computed

| Metric | Definition |
|---|---|
| `tip_pct` | % of correct winner predictions, draws excluded |
| `mae_margin` | Mean absolute error of predicted vs actual margin |
| `rmse_margin` | Root mean squared error |
| `log_loss_bits` | Mean per-match log loss in bits (base 2) |
| `brier` | Mean Brier score for win probability |

### Calibration buckets

Predicted win probability bucketed into 10 deciles; for each, report (predicted, actual, n) for reliability diagrams.

### Reproducibility

A backtest run with the same config + the same DB content must produce identical numbers. Tested via golden-file tests that pin a known config + known data window to known expected results.

---

## 12. Validation and guardrails

| Guardrail | Location | Behaviour on violation |
|---|---|---|
| Config validates against Zod schema | Load time | Hard fail with field-level error |
| Promote requires existing config + matching results hash + reason | `config promote` | Hard fail with explanation |
| Predict on a round with no named lineups | `predict` | Hard fail; suggest waiting for team announcement |
| Backtest on a season with no completed matches | `backtest` | Hard fail with date range printed |
| Match has lineup but missing player_match_stats (incomplete data) | Engine | Skip match; warn; record skip in results |
| Player in lineup with no prior PAV and no current data | `prior.ts` | Use `missing_player_default`; no warning needed |
| MOV multiplier produces non-finite value | `elo.ts` | Throw with rating diff and margin printed |

---

## 13. Suggested implementation order

The order below builds the riskiest pieces first and lets each stage validate the previous.

### Milestone 1 — Skeleton and config plumbing

- Project scaffolding, tsconfig, package.json, wrangler.toml
- Zod schemas for Config and Results
- Config store (filesystem read/write, hashing)
- `tipper config list/show/current/promote/diff/create` working against fixture configs
- Promotion guardrails enforced with tests

**Deliverable**: can author a config by hand and inspect it via CLI. No engine yet.

### Milestone 2 — Data layer

- Wrangler binding to D1 working in `wrangler dev`
- Named SQL queries in `src/data/queries.ts` for all reads the engine needs:
  - matches in a season range, ordered by date
  - lineups for a match
  - player box-score stats for a match
  - prior-season PAV (for a player or all players in a season)
- Row types in `src/data/types.ts` matching schema

**Deliverable**: can run a Node script that queries D1 and prints results.

### Milestone 3 — Elo updater

- Pure function: `(state, match_result) → new_state`
- MOV multiplier per spec
- Off-season regression
- Initial rating handling
- Unit tests with hand-computed expected values

**Deliverable**: can run Elo over all matches 2020-2025 and print final ratings. Sanity-check against known finishing positions.

### Milestone 4 — PAV computer

- Pure functions for team strength (Off/Mid/Def) and player involvement scores
- Cumulative state per season
- Apportionment from team pool to player share
- Bayesian prior blending (`prior.ts`)
- Unit tests against the Carlton/Gibbs example from the HPN article (Bryce Gibbs 2016, 10.22 MidPAV)

**Deliverable**: can compute round-by-round PAV for any season and player. Spot-check against `player_season_pav` table at season-end (should be close but not identical — HPN's published values use full-season league averages).

### Milestone 5 — Blend, predict, harness

- `blend.ts` — combine Elo + summed-PAV at team level
- `predict.ts` — rating diff → margin → win prob
- `harness.ts` — walk-forward driver
- `tipper backtest` command working end-to-end
- Persist results to `configs/<id>/results-*.json`

**Deliverable**: can backtest a config and get metrics. Compare against the 70% baseline established in the chat exploration.

### Milestone 6 — Predict command

- `tipper predict` against an upcoming round
- Human and JSON output formats with config-aware header

**Deliverable**: end-to-end working CLI for v1 use case.

### Milestone 7 — Polish and CI

- README with quickstart, config authoring guide, command reference
- GitHub Actions CI: lint, typecheck, test
- Golden-file backtest tests for reproducibility
- npm publish workflow

---

## 14. Open questions deferred to v2

These are deliberately not solved in v1. They're recorded so we don't forget them.

1. **Opponent-strength adjustment in PAV updates.** A/B test against the v1 baseline. Likely lifts predictive accuracy modestly.
2. **Auto-fit of `margin_per_elo_point` and `sigma`.** Currently config-level tunables; could be fitted from the training set automatically.
3. **Ground-specific home advantage.** AFL home advantage varies dramatically by venue (Geelong at Kardinia, WCE/Fremantle at Optus). Single global value is a simplification.
4. **Travel and short-turnaround adjustments.** Interstate travel and 5-day breaks measurably affect outcomes.
5. **Late team changes.** Lineups can change up to ~1 hour before bounce. v1 uses the post-change snapshot. v2 could compare pre-change vs post-change predictions.
6. **Zone-specific blending.** PAV is already broken into Off/Mid/Def. We could match home Off vs away Def (and vice versa) for finer matchup analysis instead of summing total PAV.
7. **Two-track Elo (regular season vs finals).** 538's NBA model split these in 2025. May be relevant given AFL finals dynamics.
8. **AFLW support.** Schema accommodates `comp` flag; engine should be data-source-driven without code changes once AFLW is in the DB.
9. **Season simulation / Monte Carlo finals odds.** Requires projected lineups for unannounced matches (depth-chart algorithm).
10. **Cloudflare Worker deployment.** Same TS code; new entrypoint that exposes predict over HTTP. Backtest is unlikely to run in a Worker (long-lived; v2 would invoke it from a queue/cron).

---

## 15. Style notes

- Use `async/await` throughout; no callback patterns
- All time/date handling via ISO 8601 strings; convert at the boundary
- Errors carry context — match_id, season, config_id where relevant
- Engine functions should be deterministic for the same inputs (no `Date.now()` inside engine code; pass timestamps in)
- Don't over-abstract. The engine is small enough that direct function composition beats elaborate dependency injection.
