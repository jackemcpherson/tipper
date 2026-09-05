# Plan 001: Build the OD-split (v5) October promotion-gate harness

> **Executor instructions**: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving to the next step. If anything
> in the "STOP conditions" section occurs, stop and report — do not improvise. When
> done, update the status row for this plan in `plans/README.md`.
>
> **This is a research/analysis plan, not a model change.** You are building a
> *measurement* tool that compares two existing model configs against the Squiggle
> field. You will NOT modify any file under `src/engine/`, and you will NOT promote
> any config. The deliverable is one analysis script plus a short written verdict.
>
> **Drift check (run first)**: `git diff --stat 4948270..HEAD -- analysis/ configs/od-w100-k008/ src/engine/odelo.ts`
> If `analysis/wheelo-headhead.py`, `src/engine/odelo.ts`, or the `od-w100-k008` config
> changed since this plan was written, compare the "Current state" excerpts against the
> live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW (read-only analysis; no engine or config mutation)
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `4948270`, 2026-06-30

## Why this matters

The OD-split config (`od-w100-k008`) is the project's **only live model-improvement
candidate** — designated the "v5 candidate", pre-flight GO as of Task 38b. Its
promotion decision is scheduled for **October 2026** and is gated on four checks, three
of which have **no tooling yet**. The single most important missing piece is named
explicitly in `HANDOFF.md` (open item 8) and `docs/task-38b-od-preflight.md` §"Regression
guards" item 1:

> **Action item before October re-eval:** clone `wheelo-headhead.py` to compare OD
> against v3 on the 256 consensus-wrong games and check that OD does not erode v3's
> +14/256 contrarian edge.

That contrarian edge (v3 wins +14 tips on games where the Squiggle field consensus was
wrong) is load-bearing — it's what keeps v3 competitive in the comp. If OD-split quietly
pulls predictions toward field consensus, OD could look better on aggregate LogLoss while
being *worse* for the comp. Without this harness, the October decision is a guess.
Building it now turns October into a button-press and lets the check re-run automatically
as 2026 data accrues.

## Current state

The project compares model configs against the Squiggle field using standalone Python
analysis scripts that read two data sources:

1. **Model predictions** — written by `tipper backtest` as JSON into
   `configs/<config-id>/results-<date>-<hash>.json`. Each file has a `"matches"` array;
   each element is a `MatchPrediction` record (fields: `matchId`, `date`, `home`, `away`,
   `venue`, `predictedMargin`, `winProbability.home`, `actualMargin`, `correct`, …).
   See `src/types.ts` for the full `MatchPrediction` shape.
2. **Squiggle field tips** — fetched from the public Squiggle API
   (`https://api.squiggle.com.au/?q=tips;year=<Y>` for all sources, and
   `;source=<N>` for one source). A `User-Agent` header is **required** or the API
   refuses the request.

The script to clone is `analysis/wheelo-headhead.py`. Its relevant structure (verified at
commit `4948270`):

- Lines 33–43: scoring helpers — `clamp(p)` → `[0.01, 0.99]`; `logloss_bits(prob_home,
  actual_margin)` scores **draws as away wins**; `tip_ok(prob_home, actual)` returns
  `None` for draws (excluded from tip%). **These conventions exactly match
  `src/engine/metrics.ts` and must be preserved** — any clone that scores draws
  differently is wrong.
- Lines 49–54: loads v3 predictions by concatenating the `"matches"` arrays of two
  results files.
- Lines 73–84: loads the full field tips into `field[(date10, home)] -> list of
  {source, p, correct}`.
- Lines 277–301: the **consensus cut** you must replicate. A game's `field_share` =
  fraction of field sources that tipped correctly, computed only when ≥ 8 sources tipped
  it (`n_with >= 8`). Buckets: `consensus_right` (share ≥ 0.65), `split` (0.35–0.65),
  `consensus_wrong` (share ≤ 0.35). The headline metric is **ΔTips on the
  `consensus_wrong` bucket**.

The OD config under test: `configs/od-w100-k008/config.json`. It sets `elo.od`
(offence/defence split) and is **bit-identical to v3 when that field is unset** — so a
direct `backtest -c od-w100-k008` produces a comparable prediction set.

The incumbent (v3) config: `configs/predha-080/config.json`.

The four October gates (from `docs/task-38b-od-preflight.md` §"Decision-and-trajectory"),
for context — **this plan builds the harness for gate 4 and reports gates 1–3 where the
existing CLI already produces them**:

1. ΔLL point estimate past the 0.005 bar (CLI `compare` already produces this).
2. Recent-3 sliding ΔTips ≥ 0 (computable from the per-season `by_season` block).
3. Pooled bootstrap CI lower bound excludes zero (CLI `compare` already produces this).
4. **Consensus-wrong cut ΔTips ≥ 0 — the new harness this plan builds.**

### Repo conventions to follow

- Analysis scripts live in `analysis/` and are standalone (Python `.py` reading from
  `configs/.../results-*.json` + the Squiggle API, or TypeScript `.ts` run via
  `bunx tsx`). Model after `analysis/wheelo-headhead.py` (Python) — it is the closest
  existing exemplar and the doc explicitly says to clone it.
- Squiggle API calls set `User-Agent: tipper-od-gate/1.0 (jackemcpherson@gmail.com)`
  (the existing monitor uses `tipper-weekly-monitor/1.0 (...)` — match that style).
- Team-name mapping between our data and Squiggle: Squiggle uses
  `"Greater Western Sydney"`, we use `"GWS Giants"`. `wheelo-headhead.py:35` has
  `SQ_NAME = {"Greater Western Sydney": "GWS Giants"}`; reuse it.
- Scoring conventions (clamp, draws→away, draws excluded from tips) are copied verbatim
  from `wheelo-headhead.py:33-43`. Do not invent your own.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `bun install` | exit 0 |
| Build CLI | `bun run build` | exit 0, `dist/` populated |
| Generate v3 predictions (primary) | `bun run dist/cli/index.js backtest -c predha-080` | writes `configs/predha-080/results-*.json`, exit 0 |
| Generate v3 predictions (2026) | `bun run dist/cli/index.js backtest -c predha-080 -s 2026` | writes a 2026-scoped results file, exit 0 |
| Generate OD predictions (primary) | `bun run dist/cli/index.js backtest -c od-w100-k008` | writes `configs/od-w100-k008/results-*.json`, exit 0 |
| Generate OD predictions (2026) | `bun run dist/cli/index.js backtest -c od-w100-k008 -s 2026` | writes a 2026-scoped results file, exit 0 |
| Bootstrap compare (gates 1+3) | `bun run dist/cli/index.js compare --config-a predha-080 --config-b od-w100-k008` | prints ΔLogLoss + ΔTipPct with CIs |
| Run the new harness | `python3 analysis/od-consensus-gate.py` | prints the bucket table, exit 0 (or 2 if gate fails — see Step 4) |

> **D1 auth note**: `backtest` reads from Cloudflare D1. If it returns HTTP 401, run any
> `wrangler` command (e.g. `wrangler whoami`) to refresh the OAuth token, then retry. If
> `wrangler` is not installed/authenticated in your environment, this is a **STOP
> condition** — report it; you cannot generate predictions without D1 access.

## Scope

**In scope** (create/modify only these):

- `analysis/od-consensus-gate.py` (create) — the cloned harness.
- `analysis/od-consensus-gate-verdict.md` (create) — the written verdict (Step 5).
- `plans/README.md` (status row update only).

**Out of scope** (do NOT touch):

- Anything under `src/` — this is a measurement tool, not a model change.
- `configs/_current.json` — **do not promote anything.** The promotion decision is the
  maintainer's, scheduled for October.
- `analysis/wheelo-headhead.py` — clone it, don't edit it.
- `analysis/weekly-monitor.py` — a separate plan (004) may port this; leave it alone.

## Git workflow

- Branch: `advisor/001-od-v5-gate-harness`
- Commit message style is conventional-commits (see `git log`: `feat:`, `chore:`,
  `docs:`). Use e.g. `feat(analysis): OD-split consensus-wrong gate harness (T38b gate 4)`.
- Do NOT push or open a PR unless the operator instructs it.

## Steps

### Step 1: Generate the paired prediction sets

Build the CLI and run all four backtests so both configs have current results files for
the primary window (2021–25, the default) and 2026.

```text
bun run build
bun run dist/cli/index.js backtest -c predha-080
bun run dist/cli/index.js backtest -c predha-080 -s 2026
bun run dist/cli/index.js backtest -c od-w100-k008
bun run dist/cli/index.js backtest -c od-w100-k008 -s 2026
```

**Verify**: `ls configs/predha-080/results-*.json configs/od-w100-k008/results-*.json`
→ at least two results files exist per config (one primary, one 2026-scoped). Note the
exact filenames; you will reference them in the script.

### Step 2: Fetch the Squiggle field tips

The field tips are NOT in the repo. Fetch them for 2021–2026 into a local cache directory
(`/tmp/sq/`), one file per year, each from
`https://api.squiggle.com.au/?q=tips;year=<Y>` with the required `User-Agent` header. Do
this **inside the Python script** (Step 3) using `urllib.request` with the UA header, and
cache to `/tmp/sq/sq_tips_<Y>.json` so re-runs don't re-hit the API. Model the fetch on
`analysis/weekly-monitor.py` (it already calls the Squiggle API with a UA header) —
grep it for `urllib` and `UA =`.

**Verify**: after a first script run, `ls /tmp/sq/sq_tips_*.json` → six files (2021–2026),
each non-empty JSON with a top-level `"tips"` array.

> If the Squiggle API returns no tips for a year (e.g. a future season not yet started),
> the script must skip that year gracefully and log which years it scored.

### Step 3: Write `analysis/od-consensus-gate.py`

Clone `analysis/wheelo-headhead.py`'s **scoring helpers and consensus cut** (lines 33–43
and 277–301), but replace "Wheelo" with "OD" and pair **OD predictions vs v3 predictions**
instead of Wheelo vs v3. The script must:

1. Load v3 predictions from the `configs/predha-080/results-*.json` files (concatenate the
   `"matches"` arrays; use the newest primary + newest 2026 file).
2. Load OD predictions from the `configs/od-w100-k008/results-*.json` files the same way.
3. Pair v3 and OD predictions **by `matchId`** (both are the same fixtures, so coverage
   must match exactly — assert equal counts, mirroring `pairByMatchId` in
   `src/engine/metrics.ts:144`).
4. Build `field[(date10, home)] -> list of {source, correct}` from the cached Squiggle
   tips, then `field_share` and the three consensus buckets exactly as
   `wheelo-headhead.py:277-301` does (`n_with >= 8` threshold, 0.65/0.35 cutoffs).
5. For each bucket, print: `n`, v3 tips, OD tips, **ΔTips (OD − v3)**, v3 LogLoss, OD
   LogLoss, ΔLL. The headline line is the `consensus_wrong` bucket's ΔTips.
6. Reuse the bootstrap-CI helper from `wheelo-headhead.py:170` (`bootstrap_ci`) to put a
   CI on the consensus-wrong ΔTips so the result isn't read off a point estimate.

**Pre-registered pass bar** (write it as a comment block at the top of the script,
matching the project's pre-registration convention):

> **Gate 4 (consensus-wrong regression guard):** OD passes iff ΔTips on the
> `consensus_wrong` bucket is **≥ 0** (point estimate), AND the bucket's tip-count is not
> a degenerate sample (require n ≥ 30 in the bucket; if n < 30, report INCONCLUSIVE, not
> PASS). A negative point estimate is a FAIL regardless of CI — this guard is
> deliberately strict because the contrarian edge is the thing being protected.

**Verify**: `python3 analysis/od-consensus-gate.py` → prints a three-row bucket table
and a final line `GATE 4 (consensus-wrong ΔTips): <value> → PASS|FAIL|INCONCLUSIVE`,
exit 0.

### Step 4: Make the gate's exit code machine-readable

Follow `analysis/weekly-monitor.py`'s exit-code convention (`0` ok, `2` alert). The
harness must `sys.exit(2)` when gate 4 is **FAIL**, `sys.exit(0)` on PASS or INCONCLUSIVE,
and `sys.exit(1)` on any error (missing results files, Squiggle fetch failure, matchId
coverage mismatch). This lets the October re-run be scripted.

**Verify**: `python3 analysis/od-consensus-gate.py; echo "exit=$?"` → `exit=0` if OD
currently passes (the 38b pre-flight suggests it should), `exit=2` if it fails. Either is
an acceptable *script* outcome — the point is the code runs and decides. Confirm the
printed verdict matches the exit code.

### Step 5: Write the verdict

Create `analysis/od-consensus-gate-verdict.md` recording: the date, the exact results
filenames used, the bucket table, the gate-4 verdict, and the values for gates 1 and 3
read off the `compare` command (Step's "Commands you will need" → bootstrap compare). Two
to four short paragraphs. State plainly whether OD currently clears gate 4 and what the
October re-run should watch.

**Verify**: `test -f analysis/od-consensus-gate-verdict.md && wc -l analysis/od-consensus-gate-verdict.md`
→ file exists, non-trivial length.

## Test plan

This is an analysis script, not engine code, so there are no vitest unit tests. The
verification is **reproduction fidelity**: the cloned scoring helpers must produce numbers
consistent with the existing pipeline.

- **Sanity cross-check**: the script must print v3's own pooled tip count and LogLoss
  computed from the loaded predictions. These must match the `overall` block in v3's
  results file (`configs/predha-080/results-*.json` → `.overall.tips` and
  `.overall.log_loss_bits`) to within rounding. If they don't, the loader or scoring is
  wrong — STOP.
- **Coverage assertion**: the by-`matchId` pairing must cover the same fixtures for v3 and
  OD with zero unmatched (both are the same backtest fixtures). A non-empty unmatched set
  means the results files are from different scopes — STOP.

## Done criteria

ALL must hold:

- [ ] `analysis/od-consensus-gate.py` exists and runs to a clean exit (0 or 2).
- [ ] The script's printed v3 pooled tips + LogLoss match v3's results-file `overall`
      block to within rounding (the sanity cross-check).
- [ ] The script prints a three-bucket table and a final `GATE 4 … → PASS|FAIL|INCONCLUSIVE`
      line whose verdict matches the exit code.
- [ ] `analysis/od-consensus-gate-verdict.md` exists and records the bucket table + verdict.
- [ ] No files outside the in-scope list are modified (`git status` shows only
      `analysis/od-consensus-gate.py`, `analysis/od-consensus-gate-verdict.md`,
      `plans/README.md`).
- [ ] `configs/_current.json` is unchanged (`git diff --quiet configs/_current.json`).
- [ ] `plans/README.md` status row updated.

## STOP conditions

Stop and report back (do not improvise) if:

- `wrangler` is unavailable/unauthenticated and `backtest` cannot reach D1.
- The Squiggle API returns errors or empty tips for 2021–2025 (the primary window) —
  without field tips there is no consensus cut.
- The v3 sanity cross-check fails (loaded predictions don't reproduce the results-file
  `overall` numbers) — the loader or scoring diverged from `metrics.ts` conventions.
- The by-`matchId` pairing leaves any fixture unmatched between v3 and OD.
- A step's verification fails twice after a reasonable fix attempt.
- You find yourself wanting to edit anything under `src/` or touch `configs/_current.json`
  — that is out of scope; report what you think needs changing instead.

## Maintenance notes

- **For October 2026**: this harness is the gate-4 check. Re-run after the full 2026
  season completes (regenerate both configs' 2026 results first, then run the script). The
  other three gates come from `compare` (ΔLL bar + bootstrap CI) and the per-season
  `by_season` blocks (recent-3 sliding ΔTips).
- **Squiggle source numbers**: the full-field fetch (`q=tips;year=Y` with no `source`)
  returns every source; the consensus cut needs ≥ 8 sources per game, which only holds
  from ~2021 onward. Don't extend this below 2021 without checking source coverage.
- **If plan 004 (port monitor to TS) lands first**, prefer to put the consensus-cut logic
  in the shared TS scoring module it creates, so the gate and the weekly monitor share one
  bit-faithful implementation instead of two Python copies. Note this in the verdict.
- A reviewer should scrutinize: (1) draws are scored as away wins for LogLoss and excluded
  from tips (the metrics.ts convention), and (2) the consensus buckets use the same
  thresholds as `wheelo-headhead.py` so the +14/256 number is directly comparable.
