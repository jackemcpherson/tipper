# Plan 008: Pre-registered univariate test of travel distance / timezone shift (D5 resurrection)

> **Executor instructions**: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving to the next step. If anything
> in the "STOP conditions" section occurs, stop and report — do not improvise. When
> done, update the status row for this plan in `plans/README.md`.
>
> **This is a research spike, not a model change.** You will NOT modify `src/engine/`,
> NOT add config fields, NOT change any model. Deliverable: one analysis script + a
> written GO/NO-GO verdict. **A NO-GO verdict is a successful outcome** — it closes the
> last named resurrection condition in the research ledger.
>
> **Drift check (run first)**: `git diff --stat 212ba7c..HEAD -- src/data/ docs/task-26-rest-travel.md analysis/`
> Expect only plan-005/006 additions to `analysis/`. If `src/data/queries.ts` or the
> task-26 doc changed, compare the "Current state" excerpts to live code; on mismatch, STOP.

## Status

- **Priority**: P3
- **Effort**: S–M
- **Risk**: LOW (read-only analysis)
- **Depends on**: none (005 not required; this uses existing results files on main)
- **Category**: direction
- **Planned at**: commit `212ba7c`, 2026-07-12

## Why this matters

Task 26 killed rest-day differentials and **binary** interstate-travel flags
(everything sub-noise at n=1890) but recorded an explicit resurrection condition:
"actual travel-distance/timezone data" (`docs/task-26-rest-travel.md`, Verdict
section). The previous advisor round deferred this probe behind the weather spike with
a written trigger: revisit if weather returns NO-GO (`plans/README.md`, "Findings
considered and NOT turned into plans"). Weather returned NO-GO (plan 002b,
`analysis/weather-univariate-verdict.md`). The trigger has fired, and this is the
**last unexplored new-information candidate** named anywhere in the ledger. The honest
prior is another documented negative — Perth↔east-coast trips are the one place a
graded distance/timezone measure could beat T26's binary flag. Either way the ledger
closes cleanly.

## Current state

Verified at commit `212ba7c`:

- `docs/task-26-rest-travel.md` — the prior art. Its travel definition: venue state ≠
  team home state, with venue→state and team→state maps. Its bucket table (home local /
  away travelled: n=1115; home travelled: n=17; neutral both-travelled: n=165) is the
  structure this spike refines with distance in km and timezone delta in hours.
- `src/data/queries.ts:80-82` — the venues table exposes ONLY `id, name`. **There is no
  geo data in the DB.** The venue→(lat, lon, tz) and team→home-base maps must be built
  as curated constants in the analysis script (one-time, ~30 venues for 2016–2026
  seasons, 18 teams). Sources: club/AFL public venue info; store coordinates to 2
  decimal places (≈1 km precision — ample).
- Predictions to test against: v3 = `predha-080` results files under
  `configs/predha-080/results-*.json` (`"matches"` array of `MatchPrediction`:
  `matchId`, `date`, `home`, `away`, `venue`, `predictedMargin`, `actualMargin`,
  `correct`, `winProbability`). Windows: primary 2021–25, early 2016–19
  (`configs/predha80-early/`), 2026 for OOS color.
- **Exemplar to clone**: `analysis/weather-univariate.py` (lands via 005; if 005 hasn't
  merged, the same pattern exists at `analysis/wheelo-headhead.py:33-43` for scoring +
  `plans/002b-weather-univariate-spike.md` for the pre-registration structure). Scoring
  conventions are canonical: clamp probabilities to [0.01, 0.99], LogLoss scores draws
  as away wins, draws excluded from tip%. Do not invent scoring.
- Venue names in results files are DB venue names — build the venue map against the
  distinct `venue` values actually present in the results files, not against a guessed
  list: `python3 -c "import json;.."` or `jq '[.matches[].venue] | unique'` over the
  results files enumerates exactly what needs mapping.

Pre-registration is a hard repo convention (Task 35 rule): the pass/fail bar is
written at the top of the script BEFORE results are computed.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Enumerate venues | `jq -r '[.matches[].venue] | unique[]' configs/predha-080/results-<latest>.json` | list of venue names |
| Run spike | `python3 analysis/travel-univariate.py` | prints pre-registered bars, then results, then verdict |

(Python or TypeScript via `bunx tsx` both acceptable — match `weather-univariate.py`
if it's on main, else `task33-neutral-ha-test.ts`.)

## Scope

**In scope**:

- `analysis/travel-univariate.py` (or `.ts`) — the spike, including the curated
  venue-geo and team-home-base constant maps
- `analysis/travel-univariate-verdict.md` — the verdict
- On NO-GO: one entry appended to `HANDOFF.md` "Documented negatives"

**Out of scope** (do NOT touch):

- `src/engine/`, `src/data/`, configs — no schema, no engine, no DB changes
- Adding geo columns to D1 (only justified if the verdict is GO, and that's a
  follow-up plan)

## Git workflow

- Branch: `advisor/008-travel-probe` off main
- Conventional commit, e.g. `chore(analysis): travel-distance univariate probe (D5)`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Pre-register the bars

Top-of-script comment block, written before any result is computed. Register:

- **Feature definitions**: for each match and each team, great-circle km from the
  team's home base to the venue, and timezone delta in hours (AEST/ACST/AWST; use
  season-appropriate fixed offsets — AFL season is April–September, so daylight-saving
  edge rounds matter for at most ±1h in March/October; note this as a known
  approximation). Univariate covariates: `away_km − home_km` and `away_tz − home_tz`.
- **Test 1 (residual slope)**: OLS slope of v3 residual (`actualMargin −
  predictedMargin`) on each covariate, primary window. Bar: |slope| must be ≥ 1.0
  scoreboard point per 1000 km (resp. per timezone hour ≥ 1.5 points) AND
  bootstrap 95% CI excluding zero, AND same sign on the early window.
- **Test 2 (close-band tips)**: within |predictedMargin| < 12, tip% split by
  high-travel-differential (top quartile |Δkm|) vs rest. Bar: difference with 95% CI
  excluding zero, same direction both windows.
- **Verdict rule**: GO only if Test 1 passes on at least one covariate AND Test 2 is
  directionally consistent. Anything else NO-GO.

**Verify**: comment block present; no result code executed yet (`git diff` shows only
the header).

### Step 2: Build the maps

Enumerate distinct venues from the results files (command above). Curate
`VENUE_GEO: {name: (lat, lon, tz_offset_h)}` and `TEAM_BASE: {team: (lat, lon,
tz_offset_h)}` (18 teams — home-ground city; note the two Adelaide and two Perth
clubs share cities, which is fine). Add an assertion: every venue and team appearing
in the loaded matches is mapped.

**Verify**: script's map-coverage assertion passes over primary + early + 2026 files
(prints `mapped: <N>/<N> venues, 18/18 teams`).

### Step 3: Compute and report

Load v3 results (primary, early, 2026), join covariates, run the two pre-registered
tests + T26's bucket table recomputed with mean km (continuity check against the
task-26 doc's table shape). Print per-window and pooled numbers, CIs (bootstrap,
seed 42, 1000 iterations — repo convention), and the verdict per the registered rule.

**Verify**: `python3 analysis/travel-univariate.py` exits 0; output contains
`VERDICT: GO` or `VERDICT: NO-GO`.

### Step 4: Write the verdict doc

`analysis/travel-univariate-verdict.md` modeled on
`analysis/weather-univariate-verdict.md` (or, if 005 unmerged, on the Verdict section
of `docs/task-26-rest-travel.md`): registered bars, numbers, verdict, and — on NO-GO —
the exact "Documented negatives" line to add to HANDOFF, including any NEW resurrection
condition only if one is honestly identifiable (if none, say "none — closed").

**Verify**: doc exists; on NO-GO, HANDOFF.md gains exactly one line under
"Documented negatives".

## Test plan

Analysis spike — validated by assertions, not unit tests: (1) map-coverage assertion
(step 2); (2) scoring continuity: script recomputes v3 primary tips/LogLoss and asserts
716 / 0.8485 before any cut; (3) T26 continuity: binary-travel bucket sizes match the
task-26 doc's table (n=1115/17/165 on its window) within the window difference it
documents.

## Done criteria

- [ ] Pre-registered bars committed before results (verifiable in the git history of the branch: header commit precedes results commit)
- [ ] Script exits 0 with all three assertions passing
- [ ] Verdict doc written; GO or NO-GO stated against the registered rule verbatim
- [ ] On NO-GO: HANDOFF "Documented negatives" updated; on GO: NO engine work started — report back instead
- [ ] Nothing under `src/` modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The v3 baseline assertion (716 tips / 0.8485) fails.
- More than 2 venues can't be confidently geolocated (obscure historical venues —
  report them rather than guessing coordinates).
- The verdict is GO — the follow-up (engine plumbing, config field, backtest under the
  T25/T32 procedure) is a separate plan the maintainer must commission.
- You find yourself adjusting a bar after seeing results.

## Maintenance notes

- If NO-GO: the new-information ledger is fully closed (weather, travel, market, age,
  stacking all documented negatives) — 2027 comp strategy rests on v3/OD-class skill +
  variance, per the strategy table in the maintainer's notes.
- If GO: the venue-geo map graduates from script constant to a proper D1 table
  (upstream afl-stats change, mirroring the DOB-backfill precedent) before any engine work.
