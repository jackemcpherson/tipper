# tipper

[![CI](https://github.com/jackemcpherson/tipper/actions/workflows/ci.yml/badge.svg)](https://github.com/jackemcpherson/tipper/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@jackemcpherson/tipper)](https://www.npmjs.com/package/@jackemcpherson/tipper)

AFL match prediction CLI combining MOV-Elo ratings with player-level PAV
(Player Approximate Value). The CLI calls the Cloudflare D1 REST API
directly and runs the prediction engine locally.

This is personal tooling: it requires your own Cloudflare D1 database
populated with the afl-stats schema. It will not work out of the box
against someone else's data.

## Setup

```bash
npm install -g @jackemcpherson/tipper

# Auth: uses wrangler's OAuth token automatically
wrangler login
```

If `wrangler login` isn't available, set `CLOUDFLARE_API_TOKEN` instead.

### Environment variables

| Variable                   | Purpose                                                          |
| -------------------------- | ---------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`     | API token with D1 access — read for predictions, write for `publish` (takes precedence over wrangler's OAuth token) |
| `CLOUDFLARE_ACCOUNT_ID`    | Overrides the default Cloudflare account ID                      |
| `CLOUDFLARE_D1_DATABASE_ID`| Overrides the default D1 database ID                             |
| `TIPPER_NO_CACHE`          | Set to disable the local season-data cache                       |

Point `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_D1_DATABASE_ID` at your own
account and afl-stats D1 database.

## Usage

```bash
# Backtest the current model across historical seasons
tipper backtest

# Backtest a specific config
tipper backtest --config predha-080

# Predict upcoming matches
tipper predict --season 2026 --round 15

# Publish the current round's predictions to the match_predictions D1 table
tipper publish

# Publish a specific round (season defaults to the current year)
tipper publish --season 2026 --round 15 --comp AFLW

# Bootstrap-compare two configs
tipper compare --config-a predha-080 --config-b od-w100-k008

# Manage configs
tipper config list
tipper config show predha-080
tipper config current
tipper config promote predha-080 --reason "v3: prediction-side home advantage"
tipper config create new-config --from predha-080
tipper config diff config-a config-b
```

### Caching

Historical season data (matches, lineups, player stats) is cached under
`~/.cache/tipper/` after the first fetch. Past seasons are append-only, so
the cache never goes stale; the current season is always fetched live.
Pass `--no-cache` (or set `TIPPER_NO_CACHE=1`) to bypass it.

### Scheduled publishing

A Cloudflare Worker (`src/worker/`) publishes predictions into the
`match_predictions` D1 table for downstream consumers (footyBot's round
preview, MCP analysts). The cron fires every 15 minutes and a pure
in-code gate (`publishPlan`) decides what actually needs writing, per
competition (AFLM and AFLW):

- Rounds with unplayed matches whose first match starts within 7 days
  are candidates.
- Refresh cadence steps with context: daily as a baseline, hourly when
  the competition has a match that day, and every 15 minutes during the
  Thursday 17:00–21:00 Melbourne team-announcement window — so published
  rows pick up announced lineups minutes after AFL-MCP syncs them.
- A round freezes once its first match kicks off: its rows become
  immutable history ("prediction as at round start").
- The gate reads the Melbourne clock via `Intl` with the IANA zone, so
  behaviour doesn't drift an hour at AEST/AEDT transitions.

The Worker holds a native D1 binding (no API token) and the promoted
config baked at build time (`src/worker/baked-config.ts`, regenerated
with `bun run bake-config` after every promotion and committed), so the
deployed model version is auditable from the pinned SHA alone.
`GET /health` returns 200/503 derived from `match_predictions` freshness
against the fixture window; every other path 404s.

Deployment is GitOps: merging to main publishes the bundle to R2
(`.github/workflows/publish-artifact.yml` →
`worker-artifacts/tipper/<sha>.js`) and the cloudflare-infra repo pins
and promotes it. `tipper publish` (CLI) remains the manual/break-glass
path, e.g. for republishing a frozen round with `--round`.

## Development

```bash
bun run build        # Compile TypeScript
bun run typecheck    # Type-check without emitting
bun run test         # Run tests (vitest)
bun run check        # Lint + format (biome)
bun run format       # Auto-format
```

## Architecture

Two parallel state machines joined by a read-only predictor:

- **Elo** — MOV-Elo rating system (FiveThirtyEight-style margin-of-victory
  multiplier). Tracks team strength over time.
- **PAV** — Round-by-round player approximate value using the HPN formula
  with a fixed pool of 100 points per team per zone per season. Captures
  player-level quality that Elo misses.
- **Blend** — Weighted combination: `rating = 0.6 * elo + 0.4 * (slope * pav)`.
  The calibration slope (6.986) converts PAV into Elo-equivalent units.

The engine is pure functions with no I/O. The CLI fetches all data from
the Cloudflare D1 REST API (the former thin Worker was retired in v3.2)
and passes pre-fetched data to the engine.

## Current model (v3)

```
Model:  predha-080
Type:   MOV-Elo + PAV (corrected defence formula) + prediction-side home advantage

Parameters:
  K-factor:                     25
  Update home advantage:        160 Elo points (shapes Elo's expected result)
  Prediction home advantage:    80 rating points = 5.6 scoreboard points
  Regression to mean:           0.10
  MOV multiplier:               538_log
  Sigma:                        36
  Blend weight (Elo):           0.6
  PAV cal. slope:               6.986

Performance (2021-2025, 1062 matches):
  Tip%:      68.1%  (716/1062)
  LogLoss:   0.8485
  MAE:       26.31

Out-of-sample (2026, R1-R14, 116 matches):
  Tip%:      73.3%  (85/116)
  LogLoss:   0.7893
```

The defining feature of v3 (`docs/task-20-prediction-home-advantage.md`)
is that home advantage finally enters predictions: prior HA tuning only
shaped Elo's update sizes, leaving a +5.6 pt/match systematic bias
against home teams in the predicted margin. The 80-point fix is derived
from the measured bias, not fitted, and the out-of-sample improvement
(−0.04 LogLoss vs v2) exceeded the in-sample one — the opposite of an
overfit signature.

See `docs/` for the full research ledger (Tasks 1–37). Weekly comp
monitoring vs the Squiggle field lives at `analysis/weekly-monitor.py`.

## Contributing

This is personal tooling targeting Jack McPherson's entry in the 2027
Squiggle model competition. The CLI is published to npm so the
maintainer can install it on new machines, not as an invitation to
contribute — it requires a private Cloudflare D1 database populated with
the afl-stats schema and won't work against anyone else's data.

External issues and pull requests are out of scope. If you're curious
about the modelling, the full research ledger and the rationale behind
every accepted/rejected experiment lives in `docs/task-*.md`; the
running open-items list lives in `HANDOFF.md`.
