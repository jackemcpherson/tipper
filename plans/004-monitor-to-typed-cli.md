# Plan 004: Port the weekly comp monitor's scoring core into the typed, tested CLI

> **Executor instructions**: Follow this plan step by step. Run every verification command
> and confirm the expected result before moving on. This plan ports **comp-critical
> scoring logic** from an untested Python script into tested TypeScript — fidelity to the
> existing numbers is the whole point, so the golden-output check in the Test plan is
> non-negotiable. If anything in "STOP conditions" occurs, stop and report. Update
> `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 4948270..HEAD -- analysis/weekly-monitor.py src/engine/metrics.ts`
> If `analysis/weekly-monitor.py` or `src/engine/metrics.ts` changed since this plan was
> written, compare the "Current state" excerpts to the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MED (it must reproduce the existing comp scoring **exactly** — a silent
  scoring drift would corrupt the signal the maintainer steers the comp by)
- **Depends on**: none (but see "Maintenance notes" re: sharing code with plan 001)
- **Category**: tech-debt / direction
- **Planned at**: commit `4948270`, 2026-06-30

## Why this matters

`analysis/weekly-monitor.py` is the **comp-critical operational tool**: it scores v3 (and
shadow configs) against the live Squiggle field every week — tips, close-band sign
accuracy, and a market column — and alerts when v3 drifts from the market. It is the
instrument the maintainer uses to decide whether the model is on track for the 2027 comp.

Yet it is the **least-engineered part of the stack**: ~400 lines of untested Python that
shells out to `bun run dist/cli/index.js`, living outside the otherwise pure-TypeScript,
Vitest-tested, Biome-linted codebase (CLAUDE.md mandates Web-Standard TypeScript with tests
at boundaries). A scoring bug here is invisible — there are no tests — and would quietly
mislead every promotion decision. Porting the **scoring core** into a tested TS module and
a `tipper monitor` command removes the shell-out, makes the comp-scoring conventions
testable, and gives a single bit-faithful implementation the OD gate (plan 001) can reuse.

This is hygiene with no modelling gain — hence P3 — but it protects the integrity of the
one operational signal the project runs on.

## Current state

Verified at commit `4948270`. `analysis/weekly-monitor.py` (header at lines 1–60, tail at
the end) does five things:

1. **Refreshes** model results by shelling out to `bun run dist/cli/index.js backtest -c
   <id> -s 2026` for `V3 = "predha-080"`, `V4 = "v4-shotoff"`, `OD = "od-w100-k008"`
   (lines ~30–58 `refresh_results()`).
2. **Fetches** the Squiggle field via the read API with a required `User-Agent` header
   (`UA = "tipper-weekly-monitor/1.0 (jackemcpherson@gmail.com)"`).
3. **Scores** each model's tips against completed games, computes a **comp rank** among
   full-coverage Squiggle sources, a **close band** (`|v3 predicted margin| < 12`) sign
   accuracy, and a **market column** (Punters = Squiggle source 5).
4. **Alerts** at `|market_gap| >= 3` tips (exit code 2).
5. **Logs** one row per run date to `analysis/weekly-monitor-log.csv` (idempotent
   same-day), columns listed in `LOG_COLUMNS` (run_date, v3_tips, v3_rank, leader,
   od_tips, od_rank, market_gap, close_*, alert, …).

The scoring conventions it uses are the canonical ones, already implemented in TypeScript
in `src/engine/metrics.ts`:

- `computeMetrics(predictions)` (`metrics.ts:22`) — tips, tip%, MAE, LogLoss (bits),
  Brier. Draws excluded from tips; LogLoss clamps to [0.01, 0.99] and scores draws as away
  wins. **This is the same convention the Python `clamp`/`tip_ok`/`logloss_bits` helpers
  reimplement.** The port should call the existing TS functions, not reimplement them.

Model prediction output: `tipper backtest` writes `configs/<id>/results-<date>-<hash>.json`
with a `"matches"` array of `MatchPrediction` records (`src/types.ts`).

### Repo conventions to follow

- CLI commands: one Commander subcommand per file under `src/cli/commands/`, registered in
  `src/cli/index.ts`. Model on `src/cli/commands/backtest.ts` and
  `src/cli/commands/predict.ts`.
- Use the existing `runBacktest`/`runPrediction` orchestration functions
  (`src/orchestration.ts:181`, `:258`) directly — **do not shell out to the built CLI** as
  the Python does. That removal of the subprocess hop is half the value of this port.
- Squiggle field fetch: Web-Standard `fetch` with the UA header (CLAUDE.md bans Node-only
  APIs). Reuse the same UA string family.
- Scoring: call `computeMetrics` and friends from `src/engine/metrics.ts`. Do not
  reimplement clamp/draw handling.
- Tests: Vitest under `tests/`, mirroring `src/`. Pure scoring functions get unit tests
  with hand-computed expected values — see `tests/engine/metrics.test.ts` for the pattern.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `bun install` | exit 0 |
| Build | `bun run build` | exit 0 |
| Typecheck | `bun run typecheck` | exit 0 |
| Lint/format | `bun run check` | exit 0 |
| Tests | `bun run test` | all pass |
| Run new command | `bun run dist/cli/index.js monitor --season 2026` | prints the comp-rank + close-band + market table |
| Run Python reference (golden) | `python3 analysis/weekly-monitor.py --no-refresh` | prints the same metrics (the values to match) |

> **D1 auth note**: `monitor` reads from D1 (to backtest the shadow configs) and from the
> Squiggle API. If D1 returns 401, run `wrangler whoami` to refresh, then retry. If
> `wrangler` is unavailable, this is a STOP condition for the end-to-end check (the unit
> tests still run offline).

## Scope

**In scope** (create/modify only these):

- `src/cli/commands/monitor.ts` (create) — the `monitor` Commander command.
- `src/cli/monitor/score.ts` (create) — pure scoring functions (comp rank, close-band sign
  accuracy, market gap) that consume already-scored predictions + Squiggle field tips.
- `src/cli/monitor/squiggle.ts` (create) — `fetch`-based Squiggle field loader (UA header).
- `tests/cli/monitor-score.test.ts` (create) — unit tests for the pure scoring.
- `src/cli/index.ts` (modify) — register the new command.
- `plans/README.md` (status row update).

**Out of scope** (do NOT touch):

- `analysis/weekly-monitor.py` — **leave it in place as the reference/golden oracle.** Do
  not delete it in this plan; it is how you verify the port. Removal is a follow-up once the
  TS version is trusted over a few real weeks.
- `analysis/weekly-monitor-log.csv` — the existing log. If the new command writes a log,
  write to a **new** file (`analysis/monitor-log.csv`); do not overwrite the Python log.
- `src/engine/**` — no engine change; call the existing metrics functions.
- Any model config or `configs/_current.json`.

## Git workflow

- Branch: `advisor/004-monitor-to-typed-cli`
- Conventional-commits style, e.g. `feat(cli): tipper monitor — typed comp monitor (port of weekly-monitor.py scoring)`.
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Build the Squiggle field loader

Create `src/cli/monitor/squiggle.ts` exporting a function that fetches the field tips for a
season from `https://api.squiggle.com.au/?q=tips;year=<Y>` (and `q=games` for completed
games if needed), using Web-Standard `fetch` with header
`User-Agent: tipper-monitor/1.0 (jackemcpherson@gmail.com)`. Return typed records keyed by
`(date10, homeTeamName)`, applying the Squiggle team-name map
(`Greater Western Sydney → GWS Giants`). Validate the response shape with Zod at this
boundary (CLAUDE.md: "Zod validates at boundaries").

**Verify**: a throwaway `bunx tsx` call to the exported loader prints a non-empty list of
field tips for 2026 (skip if D1/network unavailable — note it).

### Step 2: Port the scoring core (pure, tested)

Create `src/cli/monitor/score.ts` with **pure** functions mirroring the Python scoring:

- `compRank(modelTips, fieldSourceTips)` → the model's rank among full-coverage sources by
  tip count (the Python ranks only sources covering all games).
- `closeBandSign(predictions, threshold = 12)` → sign accuracy on matches where
  `|predictedMargin| < threshold`, draws excluded (the comp-decisive band, per
  `HANDOFF.md` item 2).
- `marketGap(modelTips, puntersTips)` → season-to-date tip delta vs Squiggle source 5
  (Punters ≈ closing market, per Task 34); the alert threshold is `|gap| >= 3`.

These consume already-computed values; they do **not** re-derive LogLoss/tips from scratch
— get those from `computeMetrics` (`src/engine/metrics.ts:22`). Keep every function pure
(no fetch, no D1) so the test in Step 4 needs no network.

**Verify**: `bun run typecheck` → exit 0.

### Step 3: Wire the `monitor` command

Create `src/cli/commands/monitor.ts` (model on `src/cli/commands/backtest.ts`). It:

1. Backtests v3 (`predha-080`) and the shadow configs (`v4-shotoff`, `od-w100-k008`) for
   the target season via `runBacktest` from `src/orchestration.ts` — **directly, not via a
   subprocess**.
2. Loads the Squiggle field via Step 1's loader.
3. Computes the comp-rank table, close-band sign accuracy, and market gap via Step 2.
4. Prints a table matching the Python's output sections (comp rank; close band; market
   column) and exits **2** when `|market_gap| >= 3` (matching the Python's alert contract),
   else 0.
5. Optionally appends a row to `analysis/monitor-log.csv` (new file — not the Python's
   log), idempotent per run date, when a `--log` flag is passed.

Register it in `src/cli/index.ts` alongside the other commands.

**Verify**: `bun run build && bun run dist/cli/index.js monitor --season 2026` → prints the
three sections; exit code is 0 or 2 consistent with the printed market gap.

### Step 4: Unit-test the scoring core

Create `tests/cli/monitor-score.test.ts` (Vitest, model on
`tests/engine/metrics.test.ts`). Cover, with hand-computed expected values:

- `closeBandSign`: a mix of close (<12) and blowout (≥12) predictions, with a draw, asserting
  the draw is excluded and only close games count.
- `marketGap`: model 86 tips vs Punters 83 → gap +3 → alert true; gap +2 → alert false.
- `compRank`: a small field where the model ties and ranks correctly among full-coverage
  sources.

**Verify**: `bun run test -- monitor-score` → all new tests pass.

### Step 5: Golden-output fidelity check against the Python

Run both implementations on the same current 2026 data and confirm the headline numbers
match:

```text
python3 analysis/weekly-monitor.py --no-refresh    # reference values
bun run dist/cli/index.js monitor --season 2026     # ported values
```

Compare: v3 tips, v3 rank, leader + leader tips, OD tips/rank, market gap, close-band v3.
They must match (rank and tip counts exactly; close-band % to within rounding). **A
mismatch is a STOP condition** — the port has drifted from the comp scoring the maintainer
relies on; do not "fix" by changing the Python.

**Verify**: a short diff of the two outputs shows identical headline numbers.

### Step 6: Quality gates

**Verify**: `bun run typecheck` → 0; `bun run check` → 0; `bun run test` → all pass.

## Test plan

- New file `tests/cli/monitor-score.test.ts` (see Step 4) — pure-function unit tests with
  hand-computed expectations; no network. Model on `tests/engine/metrics.test.ts`.
- The **golden-output check** (Step 5) is the integration-level test: the TS `monitor` must
  reproduce `weekly-monitor.py --no-refresh`'s headline numbers on real 2026 data.
- Verification: `bun run test` green, including the new file, AND the Step-5 outputs match.

## Done criteria

ALL must hold:

- [ ] `tipper monitor --season 2026` runs, prints comp-rank + close-band + market sections,
      and exits 0/2 consistent with the market gap.
- [ ] Scoring logic lives in pure functions in `src/cli/monitor/score.ts`; the command does
      not shell out to `bun run dist/...`.
- [ ] `tests/cli/monitor-score.test.ts` exists and passes; `bun run test` is green.
- [ ] Step-5 golden check: TS `monitor` headline numbers match
      `weekly-monitor.py --no-refresh` (tips/rank exact, close-band % within rounding).
- [ ] `bun run typecheck` and `bun run check` both exit 0.
- [ ] `analysis/weekly-monitor.py` and `analysis/weekly-monitor-log.csv` are unchanged
      (`git diff --quiet analysis/weekly-monitor.py analysis/weekly-monitor-log.csv`).
- [ ] `plans/README.md` status row updated.

## STOP conditions

Stop and report back (do not improvise) if:

- The Step-5 golden check shows any headline mismatch — the scoring has drifted; report the
  divergence rather than altering the Python oracle.
- `wrangler`/D1 is unavailable so the shadow backtests can't run (the unit tests still run;
  note that the end-to-end + golden checks were blocked).
- The Squiggle API response shape differs from what the Python expects (the Zod validation
  in Step 1 fails) — report the schema difference.
- Reproducing the comp-rank logic requires assumptions you can't verify from the Python
  (e.g. how ties or partial-coverage sources are handled) — read `weekly-monitor.py`
  closely; if still ambiguous, STOP and ask rather than guessing.
- The port balloons toward reimplementing the Python's `refresh_results`/CSV-logging in
  full — keep this plan to the **scoring core + command + tests**; defer the rest.

## Maintenance notes

- **Do not delete `weekly-monitor.py` in this plan.** Keep it as the oracle for a few real
  weeks; retire it in a follow-up once the TS version is trusted, and migrate the CSV log
  then.
- **Shared scoring with plan 001**: the consensus-cut / field-scoring logic in plan 001's
  `od-consensus-gate.py` and this command's `score.ts` should converge on one TS module. If
  plan 001 has already landed, prefer to lift its consensus logic into `src/cli/monitor/`
  (TS) so there is a single bit-faithful field-scoring implementation; note this in the PR.
- A reviewer should scrutinise: (1) the draw handling (excluded from tips, scored as away
  for LogLoss — the `metrics.ts` convention), (2) the comp-rank "full-coverage sources
  only" rule, and (3) that the new command reuses `runBacktest`/`computeMetrics` rather than
  reimplementing scoring.
- The 2027 operational wrapper (scheduled weekly run + alerting) should target this typed
  command once it's trusted, replacing the Python cron.
