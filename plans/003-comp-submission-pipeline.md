# Plan 003: Spike the Squiggle submission channel, then add a tip-export command

> **Executor instructions**: This plan has two halves. **Half A is a spike** —
> investigate how tips actually get into the 2027 Squiggle comp and write up what you
> find. **Half B builds a lightweight export command**, but only the parts the spike
> confirms are needed. Do NOT build a live HTTP submitter until Half A proves there is an
> API to submit to. Run every verification command. If anything in "STOP conditions"
> occurs, stop and report. Update `plans/README.md` when done.
>
> **Drift check (run first)**: `git diff --stat 4948270..HEAD -- src/cli/`
> If `src/cli/commands/predict.ts` or `src/cli/format/` changed since this plan was
> written, compare the "Current state" excerpts to the live code before proceeding.

## Status

- **Priority**: P2
- **Effort**: S–M (Half A is S; Half B depends on the spike's finding)
- **Risk**: LOW–MED (MED only if a live submitter turns out to be in scope — see Half A)
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `4948270`, 2026-06-30

## Why this matters

The entire stated product goal is to **enter the 2027 Squiggle model competition**
(`HANDOFF.md` §"Product goal"). The comp requires submitting a tip (and margin/confidence)
for every game, every round, before lockout, for a whole season. Today the project can
**generate** predictions (`tipper predict`) but has **no path to submit them** — `predict`
only prints to stdout, and nothing in `src/` writes to Squiggle. That gap is the
difference between "a good model" and "an entry that scores". A missed or late round is an
automatic zero for that round in the comp.

The reason this is a spike first: Squiggle's submission mechanism may be a programmatic API,
a manual web form, or an email/spreadsheet to the comp organiser — and the right amount of
tooling differs enormously between those. Building a live HTTP submitter for a channel that
turns out to be a manual form is wasted, fragile work. So Half A *confirms the channel*
before Half B commits to a shape.

## Current state

Verified at commit `4948270`:

- `src/cli/commands/predict.ts` — the `predict` command. It calls
  `runPrediction(...)` (`src/orchestration.ts:258`) and then either prints human output
  (`formatPrediction`) or JSON (`formatPredictionsJson`). It has `--json` already
  (`predict.ts:91-92`). There is no submission step.
- `src/cli/format/json.ts:12` — `formatPredictionsJson(predictions, configId, configHash,
  dataThrough)` already emits a clean JSON envelope with a `predictions` array. Each
  prediction (`MatchPrediction` in `src/types.ts`) carries `home`, `away`, `predictedMargin`,
  `winProbability.home`, `predictedWinner`, `date`, `round`, `venue`.
- `grep -rniE 'submit|squiggle|upload' src/` → only matches in `d1-rest.ts` (Cloudflare
  POST, unrelated). **No Squiggle write path exists.**
- The project already **reads** the Squiggle API in `analysis/weekly-monitor.py` (the
  `q=tips`/`q=games` read endpoints, with a required `User-Agent` header). That file is the
  reference for how Squiggle API access works in this project.
- `HANDOFF.md` §"Mechanics reminders" notes Squiggle conventions: "comp scoring = tips on
  completed games, draws correct for every source, rank only full-coverage sources" and the
  team-name map `GWS Giants → Greater Western Sydney`.

### Repo conventions to follow

- CLI commands are Commander subcommands, one file each under `src/cli/commands/`. Model a
  new command on `src/cli/commands/predict.ts` — option wiring via the shared option
  objects in `src/cli/flags.ts`, output via `src/cli/format/`.
- Strict TypeScript: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, no `any`,
  no enums (CLAUDE.md). New schema fields are Zod `.optional()`, never `.default()`.
- **Web Standard APIs only** (CLAUDE.md): use `fetch`, not Node http; the code targets the
  V8 runtime. The existing `d1-rest.ts` uses `fetch` — match it.
- Tests: Vitest, files under `tests/` mirroring `src/`. Format helpers are unit-tested —
  see `tests/` for the pattern (e.g. any `format`/`metrics` test).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Install | `bun install` | exit 0 |
| Build | `bun run build` | exit 0 |
| Typecheck | `bun run typecheck` | exit 0 |
| Lint/format | `bun run check` | exit 0 |
| Tests | `bun run test` | all pass |
| Generate a round's predictions | `bun run dist/cli/index.js predict --season 2026 --round 15 --json` | prints prediction JSON |
| (Half B) export a round to comp format | `bun run dist/cli/index.js export-tips --season 2026 --round 15` | prints/writes the comp-format payload |

## Half A — Spike (do this first; it gates Half B's shape)

### Step A1: Determine the submission channel

Investigate, using read-only web research and the Squiggle API docs, **how a source
submits tips to the Squiggle comp**. Concretely, find out:

- Is there a documented **write/submit API endpoint** on `api.squiggle.com.au` (the read
  API is `q=tips`/`q=games`)? Check the Squiggle API docs / about page.
- Or is submission a **manual web form / login** on squiggle.com.au?
- Or is it **out-of-band** (email/spreadsheet to the organiser, as some tipping comps are)?
- What **fields** does a submission require per game (winner? margin? confidence %? all
  three?) and in **what units/format**?
- What is the **lockout timing** (per game start time? per round?).

Use `WebFetch`/`WebSearch` for the Squiggle docs and comp rules. Do NOT attempt to create
an account, authenticate, or POST anything during this spike.

**Verify**: you can state, in one paragraph, which of the three channel types applies and
what a single game's submission payload must contain.

### Step A2: Write the spike findings

Create `docs/task-39-squiggle-submission.md` recording the channel type, the required
per-game fields and format, the lockout timing, and a recommendation for Half B's scope:

- **If a write API exists** → Half B should still stop at producing the exact request
  *payload* and a `--dry-run` printout; a live submitter that authenticates and POSTs is a
  **separate follow-up plan** (it needs credential handling and is MED risk). Note this.
- **If manual form / out-of-band** → Half B is just a formatter: produce a copy-pasteable
  or file-export payload in exactly the comp's expected format. No HTTP at all.

**Verify**: `test -f docs/task-39-squiggle-submission.md` and it names the channel type and
the per-game payload fields.

> **STOP and report after Half A if** the spike reveals that submission requires
> credentials/authentication and a live POST: that is MED-risk work (secret handling) and
> should be its own plan with the maintainer's sign-off. Build only the dry-run formatter
> in Half B and stop.

## Half B — Build the export/formatter command

Scope Half B to what Step A2 concluded. The **default, safe** build (correct for the
manual-form and out-of-band channels, and the dry-run half of an API channel) is a new
`export-tips` command that produces the comp-format payload **without submitting**.

### Step B1: Add the `export-tips` command

Create `src/cli/commands/export-tips.ts`, modelled on `src/cli/commands/predict.ts`. It
takes `--season` and `--round` (reuse `seasonOption`, `roundOption` from
`src/cli/flags.ts`), runs `runPrediction(...)` the same way `predict` does, and emits the
**comp-format payload** determined in Step A2 instead of the human/debug JSON. Map each
`MatchPrediction` to the comp's per-game fields:

- winner = `predictedWinner` mapped to the team name (`home`/`away` → `p.home`/`p.away`),
  with the Squiggle team-name map applied (`GWS Giants → Greater Western Sydney`).
- margin = `Math.round(p.predictedMargin)` (absolute value if the comp wants margin
  magnitude for the tipped team — confirm from Step A2).
- confidence = `Math.round(p.winProbability.home * 100)` (or the tipped side's
  probability — confirm units from Step A2).

Add a `--out <file>` option to write the payload to a file, defaulting to stdout. Register
the command in `src/cli/index.ts` next to where `predictCommand` is registered.

**Verify**: `bun run build && bun run dist/cli/index.js export-tips --season 2026 --round 15`
→ prints the comp-format payload for that round; every game in the round appears exactly
once; team names use the Squiggle spelling.

### Step B2: Add a format helper + unit test

Put the prediction → comp-payload mapping in a pure function in
`src/cli/format/` (e.g. `comp.ts`) so it is unit-testable without hitting D1. Add
`tests/cli/comp-format.test.ts` (Vitest) covering: a home tip, an away tip, the GWS
name-mapping, margin rounding, and confidence formatting. Model it on an existing format
test under `tests/`.

**Verify**: `bun run test -- comp-format` → all new tests pass.

### Step B3: Quality gates

**Verify**: `bun run typecheck` → exit 0; `bun run check` → exit 0; `bun run test` →
all pass.

## Test plan

- New file `tests/cli/comp-format.test.ts` covering: home-team tip, away-team tip, GWS
  Giants → Greater Western Sydney mapping, margin rounding (e.g. 12.6 → 13), confidence
  percentage (0.734 → 73). Model structurally on an existing `tests/` format test.
- The mapping function must be pure (no D1, no fetch) so the test needs no network.
- Verification: `bun run test` → all pass including the new file.

## Done criteria

ALL must hold:

- [ ] `docs/task-39-squiggle-submission.md` exists and states the channel type + per-game
      payload fields + lockout timing.
- [ ] If the spike concluded "manual / out-of-band / dry-run only": `export-tips` exists,
      builds, and prints the comp-format payload for a round, with no HTTP submission code.
- [ ] `src/cli/format/comp.ts` (or equivalent) holds a pure mapping function.
- [ ] `tests/cli/comp-format.test.ts` exists and passes; `bun run test` is green.
- [ ] `bun run typecheck` and `bun run check` both exit 0.
- [ ] No live-submission/auth/credential code was added (unless a separate plan explicitly
      authorised it).
- [ ] `plans/README.md` status row updated.

## STOP conditions

Stop and report back (do not improvise) if:

- The spike (Half A) shows submission needs authentication + a live POST — build only the
  dry-run formatter and stop; flag the live-submitter work as a separate MED-risk plan.
- You cannot determine the comp's submission format from public docs — report what you
  found and ask, rather than guessing the payload shape.
- Building `export-tips` requires changing the prediction engine or `MatchPrediction`
  shape — it should only *read* existing prediction output. If it doesn't, STOP.
- `wrangler`/D1 is unavailable so `predict`/`export-tips` can't fetch a round to format
  (you can still build + unit-test the pure formatter; note D1 was unavailable for the
  end-to-end check).
- A verification fails twice after a reasonable fix attempt.

## Maintenance notes

- Keep submission **logic-free of the model**: `export-tips` reads prediction output and
  reshapes it. Never let comp-format concerns leak into `src/engine/`.
- The live-submission follow-up (if Step A2 found a write API) needs: credential handling
  (an API token via env var, **never** committed), idempotency (don't double-submit a
  round), and a lockout-aware guard. That is deliberately out of this plan.
- A 2027-season operational wrapper (cron that runs `export-tips` each round before
  lockout and alerts on failure) is the natural next step once the format is locked — note
  it but don't build it here.
- A reviewer should scrutinise the team-name mapping (GWS is the known mismatch; check
  whether any other team names differ between our DB and Squiggle) and the margin/confidence
  units against Step A2's findings.
