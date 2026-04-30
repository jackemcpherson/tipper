# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

AFL match prediction CLI (`tipper`) combining MOV-Elo ratings with player-level PAV (Player Approximate Value) ratings. The CLI calls the Cloudflare D1 REST API directly and runs the engine locally. A thin Cloudflare Worker is also available for deployed/HTTP use.

## Commands

```bash
bun install              # Install dependencies
bun run dev              # Start local worker (wrangler dev)
bun run build            # Compile TypeScript (tsc)
bun run typecheck        # Type-check without emitting (tsc --noEmit)
bun run test             # Run all tests (vitest)
bun run test -- --watch  # Watch mode
bunx vitest run tests/engine/elo.test.ts  # Single test file
bun run check            # Lint + format check (biome check .)
bun run format           # Auto-format (biome format --write .)
```

The CLI requires `wrangler login` (or `CLOUDFLARE_API_TOKEN` env var) for D1 access. Run via `bun run dist/cli/index.js <command>` (or the `tipper` bin after build/install).

## Architecture

Two parallel state machines joined by a read-only predictor:

```
CLI (Commander) → D1 REST API → D1 Database (afl-stats)
       ↓
  Orchestration → Engine (pure functions)

Worker (Cloudflare) → Orchestration → Engine (pure functions)
       ↓
  D1 Database (afl-stats)
```

**Engine layer (`src/engine/`)** — Pure functions, no I/O:
- `elo.ts` — MOV-Elo rating system (538-style margin-of-victory multiplier)
- `pav.ts` — Round-by-round PAV computation using HPN formula with fixed pool (100/team/zone)
- `prior.ts` — Bayesian prior blending for PAV cold-start (K-weighted previous season)
- `blend.ts` — Combines Elo + calibrated PAV into a single team rating (the only place the two state machines meet)
- `predict.ts` — Rating difference → margin → win probability (normal CDF)
- `harness.ts` — Walk-forward orchestrator: predict-then-update per match in chronological order
- `metrics.ts` — Aggregate metrics (tip %, MAE, RMSE, log loss, Brier, calibration)

**Data layer (`src/data/`)** — All SQL queries, typed row interfaces. Single source of truth for DB access. The engine never constructs SQL.

**Config layer (`src/config/`)** — Zod-validated configs stored as JSON files under `configs/`. Content-hashed (SHA-256 minus id/notes) for identity. Promotion guardrails require a backtest with matching hash before a config can become `_current.json`.

**Orchestration (`src/orchestration.ts`)** — Shared data-fetching and engine-invocation logic used by both CLI and Worker. Functions take a `D1Database` (Worker binding or REST shim).

**D1 REST client (`src/data/d1-rest.ts`)** — `D1Database`-compatible shim that calls the Cloudflare D1 HTTP API, used by the CLI.

**Worker (`src/worker.ts`)** — Thin HTTP wrapper around the orchestration layer for deployed use. Endpoints: `/backtest`, `/predict`, `/calibrate`, `/compare`, `/derive-venue-ha`.

**CLI (`src/cli/`)** — Commander-based. Reads configs from disk, calls orchestration functions directly via the D1 REST shim, formats output. Commands: `config {list,show,current,promote,diff,create}`, `backtest`, `predict`, `compare`.

## Key Design Decisions

- **Walk-forward backtesting**: Matches processed in strict `(season_id, date, local_time, id)` order. Predictions generated before state updates per match.
- **Fixed PAV pool**: 100 points per team per zone per season (not scaled by games played), so cumulative PAV is always in season-end-equivalent units — required for prior compatibility.
- **Raw SQL over Drizzle**: Queries use D1's `prepare().bind().all()` directly. D1 has a bind limit of ~100, so large IN clauses are batched in chunks of 80.
- **Config content hashing**: Two configs with identical parameters (ignoring `id` and `notes`) produce the same hash, preventing redundant backtests.

## Conventions

Follow `TYPESCRIPT_STYLE_GUIDE.md` for full conventions. Key points:

- **Bun** as package manager, **Biome** for lint+format, **Vitest** for tests, **tsc** for type checking
- Strict TypeScript: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, no `any`, no enums
- Biome enforces 100-char line width, 2-space indent, `useConst`, organized imports
- Zod validates at boundaries (config load, API responses); trust types internally
- Pure core / effectful shell: engine functions take all data as arguments, never touch DB
- Use Web Standard APIs only (no Bun-specific APIs) — code deploys to Cloudflare Workers V8 runtime
