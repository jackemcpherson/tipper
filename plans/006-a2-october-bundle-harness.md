# Plan 006: Pre-register the A2 October bundle and build its one-button evaluation harness

> **Executor instructions**: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving to the next step. If anything
> in the "STOP conditions" section occurs, stop and report — do not improvise. When
> done, update the status row for this plan in `plans/README.md`.
>
> **This is a research-harness plan, not a model change and not the October decision
> itself.** You are building (a) a pre-registration document that fixes every pass/fail
> criterion BEFORE full-2026 data exists, and (b) a runner script that computes all of
> them from results files. You will NOT modify `src/engine/`, NOT promote any config,
> and NOT write any verdicts — the harness prints numbers against pre-registered bars;
> the October human runs it and decides.
>
> **Depends on plan 005** — the runner reuses `analysis/od-consensus-gate.py` (landed by
> 005). Do not start until 005's PR is merged to main.
>
> **Drift check (run first)**: `git diff --stat 212ba7c..HEAD -- analysis/ src/engine/metrics.ts configs/od-w100-k008/ docs/`
> Expect only plan-005 additions. If `src/engine/metrics.ts` or the OD/v3 configs
> changed beyond that, compare the "Current state" excerpts against live code; on a
> mismatch, STOP.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW (analysis + docs only)
- **Depends on**: plans/005-land-approved-branches.md
- **Category**: direction
- **Planned at**: commit `212ba7c`, 2026-07-12

## Why this matters

Six research decisions all fall due in one window (~October 2026, after the 2026 season
completes): the OD-split (v5) promotion call, the T38c shot-margin kill-or-park, the v4
tips-first re-evaluation, the bucketed prediction-HA bundle, the flat-HA re-sweep, and
the sigma third confirmation. The project's own evaluation discipline (HANDOFF.md
"Evaluation procedure", Tasks 25/32/35) demands criteria be fixed before results are
seen — and today, mid-July, the full-2026 results do NOT yet exist, which is exactly why
the pre-registration must be written NOW. Building the runner now also turns October
into a button-press instead of a week of ad-hoc scripting under decision pressure.

## Current state

Verified at commit `212ba7c` (plus plan-005 branch contents, reviewed):

**The six October decisions and where their criteria come from** (all from `HANDOFF.md`
and `docs/task-38b-od-preflight.md` — quoted so you don't need other context):

1. **OD-split (`od-w100-k008`) promotion — the headline.** Four gates, from
   `docs/task-38b-od-preflight.md` §"Decision-and-trajectory":
   - Gate 1: pooled ΔLogLoss point estimate ≥ 0.005 in OD's favour (at T38b: ≈0.0070).
   - Gate 2: recent-3 sliding tip delta ≥ 0 (2024+2025+full-2026; at T38b: +4).
   - Gate 3: bootstrap CI lower bound on pooled ΔLL excludes zero (at T38b: −0.0018,
     not yet cleared — this is the gate the extra 2026 matches are expected to close).
   - Gate 4: consensus-wrong bucket ΔTips ≥ 0 (already tooled:
     `analysis/od-consensus-gate.py`, verdict 2026-06-30 was PASS at +1, n=323).
   Plus two regression guards from the same doc §"Regression guards": per-team residual
   non-degradation (OD halves v3 bias on WCE/North/Geelong/Carlton — re-tabulate with
   2026) and a per-venue residual table (never yet run).
2. **T38c shot-margin kill-or-park** (`docs/task-38c-shot-margin-restest.md`): if
   full-2026 stays reversed (2026 ΔTips < 0 or ΔLL > 0 for shot-margin vs v3), KILL;
   otherwise re-park.
3. **v4 tips-first re-eval** (HANDOFF item 3): full-2026 realized tips v4-shadow vs v3
   under the T32 amended bar (no pooled tip regression; recent-3 deficit disqualifying).
4. **Bucketed prediction HA** (HANDOFF item 3): {derby ≈20, true-home-vs-interstate
   ≈110, neutral 0 (T33), else 80}. Offline-exact (prediction-side only).
5. **Flat HA re-sweep 70–100** (HANDOFF item 3). Offline-exact.
6. **Sigma third confirmation** (HANDOFF item 3): then retire the question. Note
   HANDOFF's product rule: probability-head work is comp-irrelevant unless it moves
   margin sign — the pre-registration should say sigma is confirm-and-retire, not tune.

**Scoring/bootstrap conventions** (must be preserved exactly):

- `src/engine/metrics.ts:190` — `bootstrapCompareStratified(strata, nBootstrap = 1000,
  seed = 42)`; strata resampled independently, pooled deltas; "Read CI magnitudes, not
  just the excludesZero flag" (HANDOFF).
- Draws: LogLoss scores draws as away wins; draws excluded from tip%. Canonical
  implementations: `src/engine/metrics.ts` (TS) and `analysis/wheelo-headhead.py:33-43`
  (Python).
- Windows: primary 2021–2025 (n=1062), early confirmatory 2016–2019 (n=828,
  `predha80-early` config), 2026 OOS (R14 onward is the unburned gate — R1–R13 was
  burned for the v4 decision on 2026-06-12; note results files span all rounds, the
  runner must support a round cutoff).

**The exemplar for the runner**: `analysis/task36-pooled-eval.ts` — loads
`configs/<id>/results-*.json` `"matches"` arrays, calls `bootstrapCompareStratified`
with two strata, prints pooled LL/tips plus close-band (|v3 predicted margin| < 12)
sign accuracy per window. Copy its structure (`load()`, `tipsCount()`, close-band cut).

**Offline-exact evaluation** (HANDOFF "Mechanics reminders"): prediction-side changes
(items 4, 5, 6 — all prediction-HA or sigma) can be evaluated by recomputing
predictions from persisted rating differences WITHOUT re-running backtests.
`analysis/task33-neutral-ha-test.ts` is the exemplar for an offline-exact
prediction-side HA probe. Update-side items (OD, shot-margin, v4) use real backtest
results files, which already exist per config.

**Baselines to hard-code as assertions** (from HANDOFF): `predha-080` primary LogLoss
0.8485, 716 tips, hash `2641f46f`; early window 0.8555; `v4-shotoff` 0.8409, hash
`7af312c5`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `bun run typecheck` | exit 0 |
| Lint | `bun run check` | exit 0 |
| Run runner | `bunx tsx analysis/a2-bundle-eval.ts --through-round 14` | prints all sections, exits 0 |
| Gate-4 tool | `python3 analysis/od-consensus-gate.py` | prints bucket table |
| Fresh backtest (October) | `bun run dist/cli/index.js backtest --config od-w100-k008 -s 2026` | writes results JSON |

## Scope

**In scope**:

- `docs/task-40-a2-bundle-preregistration.md` (create) — the pre-registration
- `analysis/a2-bundle-eval.ts` (create) — the runner
- One-line pointer added to `HANDOFF.md` open item 3 referencing both files

**Out of scope** (do NOT touch):

- `src/engine/` — nothing here changes the model
- `configs/_current.json` and any config promotion
- `analysis/od-consensus-gate.py` — reuse as-is via subprocess or by documenting its
  invocation in the runner output; do not rewrite it
- Running the October decision itself — full-2026 data doesn't exist yet

## Git workflow

- Branch: `advisor/006-a2-bundle-harness` off main (after 005 merges)
- Conventional commits, e.g. `feat(analysis): A2 October bundle pre-registration + runner`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Write the pre-registration document

Create `docs/task-40-a2-bundle-preregistration.md` following the structure of existing
task docs (see `docs/task-38b-od-preflight.md` for tone/format). It must contain, for
EACH of the six decisions: the exact metric(s), the exact window(s), the pass bar as a
number, the disqualifying condition, and the decision that follows from each outcome
(promote / park / kill / retire). All bars come from the "Current state" section above —
do not invent new ones. Where a bar is genuinely undefined (per-venue residual guard has
no precedent), propose a conservative one and mark it `PROPOSED — maintainer to ratify
before October`.

**Verify**: document lists exactly 6 numbered decisions + 2 OD regression guards;
`grep -c "PROPOSED" docs/task-40-a2-bundle-preregistration.md` → ≥ 1 (the per-venue bar).

### Step 2: Build the runner skeleton with a round cutoff

Create `analysis/a2-bundle-eval.ts` modeled on `analysis/task36-pooled-eval.ts`. CLI
args: `--through-round <N>` (2026 cutoff; October uses the final round) and
`--results-date <YYYY-MM-DD>` (selects which `results-<date>-<hash>.json` files to
load, so the script is re-runnable as new backtests are written). Load v3, OD, v4,
shot-margin, and early-window results files; validate the hard-coded baselines
(0.8485/716/2641f46f etc.) and abort loudly if they don't reproduce.

**Verify**: `bunx tsx analysis/a2-bundle-eval.ts --through-round 14 --results-date <latest available>`
→ prints baseline-assertion PASS lines; exits 0.

### Step 3: Implement the update-side sections (decisions 1, 2, 3)

For OD: gates 1–3 via `bootstrapCompareStratified` (primary + early + 2026-through-cutoff
as three strata; also print per-window), recent-3 sliding tips, per-team residual table
(mean `actualMargin − predictedMargin` per team, v3 vs OD, flagging WCE/North/Geelong/
Carlton), per-venue residual table, and a printed reminder to run
`analysis/od-consensus-gate.py` for gate 4. For T38c and v4: 2026-only ΔTips/ΔLL vs v3
plus recent-3 sliding, printed against their pre-registered bars.

**Verify**: runner output contains sections `[1] OD gates`, `[2] T38c`, `[3] v4`, each
line ending with `PASS` / `FAIL` / `PENDING (n=...)` against the registered bar.

### Step 4: Implement the offline-exact prediction-side sections (decisions 4, 5, 6)

Model on `analysis/task33-neutral-ha-test.ts`: recompute v3's predicted margins under
(a) the bucketed HA {derby 20, interstate 110, neutral 0, else 80}, (b) flat HA swept
70–100 in steps of 5, (c) sigma variants for the third confirmation — from the persisted
predictions' rating differences. Derby/interstate/neutral classification needs
team-state and venue-state maps — copy the ones used in Task 26's analysis
(`docs/task-26-rest-travel.md` describes venue→state and team→state mapping); if no
reusable map exists in-repo, inline a curated constant map and STOP-flag any unmapped
venue.

**Verify**: bucketed-HA section reproduces the T33 neutral result (+1 tip / −0.0011
pooled LL for neutral-only at 2021–25) as a golden check before applying the full
bucket set.

### Step 5: Wire pointer into HANDOFF

Add one line under HANDOFF.md open item 3: pre-registration at
`docs/task-40-a2-bundle-preregistration.md`, runner at `analysis/a2-bundle-eval.ts`,
October invocation documented at the top of the runner.

**Verify**: `grep -n "task-40" HANDOFF.md` → 1 match.

## Test plan

Analysis scripts in this repo are validated by golden checks, not unit tests (see
`analysis/task36-pooled-eval.ts` precedent). Required golden checks, all inside the
runner and all must print PASS on current data:

1. v3 primary baseline: LogLoss 0.8485, 716 tips.
2. OD primary vs v3: ΔLL −0.0058, ΔTips +12 (reproduces T38b table).
3. T33 neutral-HA reproduction (step 4).
4. Early-window v3: LogLoss 0.8555.

## Done criteria

- [ ] `docs/task-40-a2-bundle-preregistration.md` exists with 6 decisions + 2 guards, every bar numeric
- [ ] `bunx tsx analysis/a2-bundle-eval.ts --through-round 14 --results-date <date>` exits 0 with all 4 golden checks PASS
- [ ] All six sections print PASS/FAIL/PENDING lines against registered bars
- [ ] `bun run typecheck` and `bun run check` exit 0
- [ ] No file outside the in-scope list modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Plan 005 has not merged (`analysis/od-consensus-gate.py` absent from main).
- Any golden check fails — baselines not reproducing means the results files or engine
  drifted; that invalidates the whole harness premise.
- The offline-exact recomputation (step 4) cannot reproduce v3's own stored predictions
  bit-identically at HA=80 before you vary anything.
- You cannot find or construct a defensible venue→state / team→state map (>2 venues
  unmapped in the evaluation seasons).
- You feel the need to adjust a pre-registered bar after seeing a number. That is the
  exact failure mode this plan exists to prevent.

## Maintenance notes

- In October: run fresh backtests for all configs over full 2026, re-run the runner with
  the final round and new results-date, run `od-consensus-gate.py`, and write
  `docs/task-41-a2-bundle-results.md` with the verdicts. The maintainer ratifies the
  PROPOSED per-venue bar before that run.
- If plan 009 (monitor cron) lands, its weekly log gives an early-warning trend line on
  gate 2 (recent-3 tips) between now and October.
- The runner intentionally hard-fails on baseline drift; if a legitimate engine fix
  changes baselines before October, the pre-registration doc must be amended by the
  maintainer, not silently by an executor.
