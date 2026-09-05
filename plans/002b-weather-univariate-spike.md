# Plan 002b: Pre-registered univariate test of weather as a tip-relevant signal

> **Executor instructions**: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving on. If anything in "STOP
> conditions" occurs, stop and report — do not improvise. When done, update the status
> row in `plans/README.md`.
>
> **This is a research spike, not a model change.** Its entire purpose is to find out
> whether weather data carries any signal *before* anyone wires it into the engine. You
> will NOT modify `src/engine/`, NOT add a config field, and NOT change any model. The
> deliverable is one analysis script and a written verdict that says GO or NO-GO on a
> follow-up engine plan. A NO-GO verdict is a successful outcome.
>
> **Depends on plan 002a.** 002a (an afl-stats/fitzroy upstream task) audits and, if
> warranted, enriches the weather data this spike consumes, and reports the coverage you
> can rely on. Do not start 002b until 002a has reported its coverage number — running the
> signal test on data that 002a is about to enrich would waste the run.
>
> **Drift check (run first)**: `git diff --stat 4948270..HEAD -- src/data/ src/engine/harness.ts`
> If `src/data/queries.ts`, `src/data/types.ts`, or `src/engine/harness.ts` changed since
> this plan was written, compare the "Current state" excerpts to the live code before
> proceeding; on a mismatch, treat it as a STOP condition. **In particular**, if 002a added
> new weather columns (e.g. rainfall), confirm they were plumbed into `MatchRow`
> (`src/data/types.ts`) and the match query (`src/data/queries.ts:106`) before relying on
> them here.

## Status

- **Priority**: P2
- **Effort**: S–M
- **Risk**: LOW (read-only analysis; no engine change)
- **Depends on**: plan 002a (weather data audit/enrichment, upstream in afl-stats)
- **Category**: direction
- **Planned at**: commit `4948270`, 2026-06-30

## Why this matters

This project's research ledger has established that the **existing feature set is
exhausted** at the field's skill level: Tasks 33/34/35 showed residual-mining, the closing
market, and learned stacking all add ~0 net tips. The only way left to genuinely improve
tip accuracy is **new information not already in the model**. The maintainer's own rule
(Task 35) is that any new feature must **survive a univariate pre-registered test before
any engine work**.

Weather is the cheapest untested new-information candidate: the data is **already pulled
from the database into every match record** (`weather_temp_c`, `weather_type`; plan 002a
audits/enriches it) but the **engine never reads it**. The ledger's "do-not-redo" list
covers travel, rest, and round-phase — but **not weather**. The comp is decided in the
close band (`|predicted margin| < 12`), and wet/extreme conditions compress scoring and
margins, which is exactly where favourites flip. The honest prior is roughly a coin-flip —
weather may move *total score* and *variance* more than margin *sign*, in which case it's
irrelevant to the tips-scored comp. This spike settles it cheaply.

## Current state

**The data is present but unused.** Verified at commit `4948270`:

- `src/data/queries.ts:106` — the match query already selects
  `margin, attendance, weather_temp_c, weather_type`.
- `src/data/types.ts:49-50` — `MatchRow` carries
  `readonly weather_temp_c: number | null;` and `readonly weather_type: string | null;`.
- `grep -rn 'weather' src/engine/` returns **nothing** — the engine ignores both fields.
  (If plan 002a added new columns, they may now also appear in `MatchRow` — use whatever
  002a's findings doc says is available.)

**How predictions are produced.** `src/engine/harness.ts` walks matches chronologically
and, for completed matches in the evaluation seasons, emits a `MatchPrediction` record
(`src/types.ts`) with `predictedMargin`, `winProbability`, `actualMargin`, and `correct`.
The walk-forward backtest results are written by `tipper backtest` to
`configs/<id>/results-<date>-<hash>.json` under a `"matches"` array.

**The incumbent model** is `predha-080` (v3). The residual that matters is
`actualMargin − predictedMargin` per match — if weather has signal, v3's residual will be
systematically different in (say) wet games than dry games, and/or v3's close-band tip
accuracy will differ by weather bucket.

**Existing exemplars to model the spike on:**

- `analysis/wheelo-headhead.py` — Python script that loads `configs/.../results-*.json`
  `"matches"` arrays and computes tip%/LogLoss with the canonical scoring helpers
  (`clamp`, draws→away, draws excluded). Reuse those helpers (lines 33–43).
- `analysis/task33-neutral-ha-test.ts` — a TypeScript analysis probe (run via `bunx tsx`)
  that cuts v3's predictions by a categorical match attribute and reports the per-bucket
  effect. Either language is fine; pick whichever lets you join weather fields most easily.

**The catch:** `weather_temp_c`/`weather_type` are NOT in the results-file
`MatchPrediction` records (the engine never copies them through). So the spike must join
the model's predictions to the raw weather columns **by `matchId`**, fetching the weather
columns directly — query D1 for `id, weather_temp_c, weather_type` (plus any new 002a
columns) over the relevant seasons, via the existing `src/data/d1-rest.ts` shim or a small
`bunx tsx` script importing from `src/data/queries.ts`.

### Repo conventions to follow

- Analysis scripts live in `analysis/`. Match `analysis/task33-neutral-ha-test.ts`
  (TypeScript via `bunx tsx`) or `analysis/wheelo-headhead.py` (Python) structurally.
- Scoring (clamp to [0.01, 0.99], draws scored as away wins for LogLoss, draws excluded
  from tips) is copied verbatim from `analysis/wheelo-headhead.py:33-43` (Python) or
  matched to `src/engine/metrics.ts` (TypeScript). Do not invent scoring.
- Pre-registration is a hard convention: the pass/fail bar is written **before** looking at
  the result, as a comment block at the top of the script. See the pre-registered bars in
  `docs/task-37-age-curve-priors.md` and `docs/task-38a-per-venue-hga.md` for house style.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `bun install` | exit 0 |
| Build CLI | `bun run build` | exit 0 |
| Generate v3 predictions (primary 2021–25) | `bun run dist/cli/index.js backtest -c predha-080` | writes `configs/predha-080/results-*.json` |
| Generate v3 predictions (early 2016–19) | `bun run dist/cli/index.js backtest -c predha80-early` | writes results for the confirmatory window |
| Inspect weather coverage | (Step 1 — small `bunx tsx` script or D1 query) | prints distinct `weather_type` values + null rate |
| Run the spike | `bunx tsx analysis/weather-univariate.ts` (or `python3 analysis/weather-univariate.py`) | prints per-bucket table + verdict |
| Typecheck (if TS script) | `bun run typecheck` | exit 0 |

> **D1 auth note**: if any D1 read returns HTTP 401, run `wrangler whoami` to refresh the
> token, then retry. If `wrangler` is unavailable, this is a STOP condition.

## Scope

**In scope** (create only):

- `analysis/weather-univariate.ts` **or** `analysis/weather-univariate.py` (one script).
- `analysis/weather-univariate-verdict.md` (the written GO/NO-GO verdict).
- `plans/README.md` (status row update).

**Out of scope** (do NOT touch):

- `src/engine/**` — no model change. The whole point is to decide *whether* a model change
  is warranted.
- `src/config/schema.ts` — do NOT add a weather config field in this plan. That belongs to
  a follow-up plan written only if this spike returns GO.
- `configs/**` — no new config, no promotion.
- The afl-stats repo / D1 weather data — that is plan 002a. This plan only *reads* it.
- The existing analysis scripts — read them, don't edit them.

## Git workflow

- Branch: `advisor/002b-weather-univariate-spike`
- Conventional-commits style, e.g. `chore(analysis): weather univariate pre-registered spike`.
- Do NOT push or open a PR unless instructed.

## Steps

### Step 1: Confirm weather coverage (consume 002a's report)

Read plan 002a's findings (the coverage number it reported) and confirm it against a quick
D1 query: distinct `weather_type` values and the non-null fraction of both `weather_type`
and `weather_temp_c` across seasons 2016–2025 (plus any new 002a columns).

**Verify**: the script prints (a) the distinct `weather_type` strings with counts and (b)
the non-null coverage fraction per season, matching 002a's reported numbers.

**Decision gate**: if `weather_type` is non-null for **< 60% of matches in 2021–2025**,
STOP and report back to 002a — coverage is the blocker, and remediation is upstream, not
here. (Do not dead-end as "inconclusive"; the fix has an owner.)

### Step 2: Define and freeze the buckets and the pre-registered bar

Decide the weather buckets **from the Step-1 value list, before scoring anything**, and
write them into the script header as a frozen comment. Suggested bucketing (adapt to the
actual `weather_type` values found):

- `wet` = `weather_type` in {RAIN, WET, SHOWERS, …} (whatever the data calls rain).
- `dry`/`clear` = the fine-weather values.
- `extreme_temp` = `weather_temp_c` in the top/bottom decile (optional secondary cut).
- If 002a added rainfall/wind, add a graded cut on those (they may carry more than the
  category string).

Write the pre-registered bar as a header comment:

> **Pre-registered bar.** Weather earns a follow-up engine plan (GO) iff, on the primary
> 2021–2025 window: (a) v3's mean residual (`actualMargin − predictedMargin`) differs
> between the `wet` and `dry` buckets by a margin whose 95% bootstrap CI excludes zero,
> **OR** (b) v3's close-band (`|predictedMargin| < 12`) tip accuracy differs between
> buckets by ≥ 3 percentage points with the bucket n ≥ 50. Direction must **replicate**
> (same sign) on the early 2016–2019 confirmatory window. If neither holds, the verdict is
> NO-GO and weather joins the documented-negatives list. A within-noise result is NO-GO,
> not "promising".

Freeze this before computing anything. (Mirrors how Tasks 37 and 38a pre-registered bars.)

### Step 3: Write the spike script

The script must:

1. Load v3 predictions from `configs/predha-080/results-*.json` (primary) and
   `configs/predha80-early/results-*.json` (early window), reading the `"matches"` arrays.
2. Join each prediction to its weather fields by `matchId` (from the Step-1 D1 pull — cache
   it to a local JSON so re-runs don't re-query).
3. Assign each match to a weather bucket (Step 2).
4. For each bucket and each window, report: `n`, mean residual, close-band tip% (and n in
   the close band), and overall tip%. Put a bootstrap CI (reuse the `bootstrap_ci` helper
   from `wheelo-headhead.py:170`, or an equivalent) on the wet−dry residual difference.
5. Evaluate the pre-registered bar and print a final
   `WEATHER SPIKE VERDICT: GO | NO-GO | INCONCLUSIVE` line.

**Verify**: the script runs to exit 0 and prints the per-bucket table for both windows plus
the verdict line. The script's reported v3 overall tip%/LogLoss must match v3's
results-file `overall` block to within rounding (sanity cross-check).

### Step 4: Write the verdict

Create `analysis/weather-univariate-verdict.md`: the date, the weather-coverage numbers,
the bucket definitions, the per-window table, and the GO/NO-GO call with one paragraph of
reasoning. If GO, state specifically *what* the signal looks like (e.g. "v3 over-predicts
home margin by 4.1 pts in wet games, replicating across both windows") so a follow-up
engine plan has a concrete target. If NO-GO, state the effect size and that it's within
noise, so it can be added to `HANDOFF.md`'s documented-negatives list.

**Verify**: `test -f analysis/weather-univariate-verdict.md` and it contains the verdict
line.

## Test plan

No vitest unit tests (analysis script). Verification is reproduction fidelity:

- **Sanity cross-check**: script-computed v3 overall tip% and LogLoss must match the
  `overall` block of v3's results file to within rounding. Mismatch ⇒ STOP.
- **Coverage report**: Step 1's coverage fraction is recorded in the verdict regardless of
  outcome.

## Done criteria

ALL must hold:

- [ ] Weather coverage for 2016–2025 is confirmed against 002a's report.
- [ ] The spike script exists, runs to exit 0, and prints per-bucket tables for both the
      primary (2021–25) and early (2016–19) windows.
- [ ] The script's v3 overall tip%/LogLoss match v3's results-file `overall` (sanity check).
- [ ] A frozen pre-registered bar appears as a header comment in the script.
- [ ] `analysis/weather-univariate-verdict.md` records a GO / NO-GO / INCONCLUSIVE verdict
      with effect sizes.
- [ ] `git status` shows only the two new `analysis/` files and `plans/README.md` changed;
      nothing under `src/` or `configs/`.
- [ ] `plans/README.md` status row updated.

## STOP conditions

Stop and report back (do not improvise) if:

- Weather coverage in 2021–2025 is < 60% — report to plan 002a (remediation is upstream).
- `wrangler`/D1 is unavailable so you cannot read the weather columns.
- The v3 sanity cross-check fails.
- You find yourself wanting to add a config field, touch `src/engine/`, or build the
  weather feature itself — that is a *separate, later* plan that only exists if this spike
  returns GO. Report the GO and stop.
- A step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- **If GO**: the follow-up plan adds an `output.weather_*` config field (Zod `.optional()`,
  **never `.default()`** — the config hash covers the parsed config, so a default
  invalidates every existing config's hash; see the comments in `src/config/schema.ts:29`
  and `:90`). It then wires a margin/sigma adjustment into `generatePrediction` in
  `src/engine/harness.ts` (the same place `prediction_home_advantage` and `marginAdjust`
  enter, around `harness.ts:576`), bit-inert when unset, and backtests it against the full
  T32 promotion bar (primary + early confirmatory + tips criterion + the consensus-wrong
  regression guard from plan 001).
- **If NO-GO**: add a one-line entry to `HANDOFF.md`'s "Documented negatives" section so it
  isn't re-proposed without new (e.g. higher-resolution) weather data — mirroring the T26
  travel and T27 round-phase entries.
- A reviewer should check that the buckets were frozen before scoring (the header comment
  predates the result) and that the early-window replication test was actually applied —
  direction-reversal on the early window is exactly what killed T38a.
