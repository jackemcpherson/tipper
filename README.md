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
| `CLOUDFLARE_API_TOKEN`     | API token with D1 read access (takes precedence over wrangler's OAuth token) |
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
tipper backtest --config pavfix-blend-w06

# Predict upcoming matches
tipper predict --season 2026 --round 8

# Bootstrap-compare two configs
tipper compare --config-a pavfix-blend-w06 --config-b elo-only-tuned-v1b

# Manage configs
tipper config list
tipper config show pavfix-blend-w06
tipper config current
tipper config promote pavfix-blend-w06 --reason "v2: corrected PAV blend"
tipper config create new-config --from pavfix-blend-w06
tipper config diff config-a config-b
```

### Caching

Historical season data (matches, lineups, player stats) is cached under
`~/.cache/tipper/` after the first fetch. Past seasons are append-only, so
the cache never goes stale; the current season is always fetched live.
Pass `--no-cache` (or set `TIPPER_NO_CACHE=1`) to bypass it.

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

## Current model (v2)

```
Model:  pavfix-blend-w06
Type:   MOV-Elo + PAV (corrected defence formula)

Parameters:
  K-factor:            25
  Home advantage:      160 Elo points (11.2 scoreboard points)
  Regression to mean:  0.10
  MOV multiplier:      538_log
  Sigma:               36
  Blend weight (Elo):  0.6
  PAV cal. slope:      6.986

Performance (2021-2025, 1062 matches):
  Tip%:      66.1%
  LogLoss:   0.8607
  Brier:     0.2060

Out-of-sample (2026, 63 matches):
  Tip%:      77.8%
  LogLoss:   0.8029
```

See `docs/` for the full tuning reports (Tasks 1-18).
