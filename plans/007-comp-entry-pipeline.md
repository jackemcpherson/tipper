# Plan 007: 2027 Squiggle comp entry — gameid resolver, tips endpoint skeleton, and contact checklist

> **Executor instructions**: Follow this plan step by step. Run every verification
> command and confirm the expected result before moving to the next step. If anything
> in the "STOP conditions" section occurs, stop and report — do not improvise. When
> done, update the status row for this plan in `plans/README.md`.
>
> **Deploy nothing.** This plan produces code and documents that make comp entry a
> short, known path — but Squiggle acceptance requires human contact and an
> endpoint-format agreement that does not exist yet. You build the resolver and the
> Worker skeleton; the maintainer contacts Squiggle and deploys. Any `wrangler deploy`
> is out of scope.
>
> **Depends on plan 005** — `export-tips` (`src/cli/commands/export-tips.ts`,
> `src/cli/format/comp.ts`) must be on main.
>
> **Drift check (run first)**: `git diff --stat 212ba7c..HEAD -- src/cli/format/comp.ts src/cli/commands/export-tips.ts docs/task-39-squiggle-submission.md`
> These land via plan 005; if they've changed beyond that landing, compare against the
> "Current state" excerpts; on a mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED (external API dependency; format partly unknown by design)
- **Depends on**: plans/005-land-approved-branches.md
- **Category**: direction
- **Planned at**: commit `212ba7c`, 2026-07-12

## Why this matters

The entire project exists to enter Squiggle's 2027 model competition. Task 39 (plan
003's spike) established the channel: **pull-based** — SquiggleBot fetches tips hourly
from each model's own public URL; there is no push API. Entry therefore needs three
things that don't exist: (1) resolution of Squiggle's canonical `gameid` (our
`matchId` is an internal DB id — Task 39 flagged this as the one hard gap), (2) a
public HTTPS endpoint serving our tips in the agreed format, and (3) acceptance by
Squiggle, which requires contacting the maintainer (@SquiggleAFL / Max Barry) and
meeting published criteria. The 2027 season starts ~March; acceptance and a soak
period (serving 2026-remainder tips as a live rehearsal) should happen in 2026, which
makes this July–September work, not February panic work.

## Current state

Verified at commit `212ba7c` + reviewed plan-003 branch (`8ad4a54`):

- `docs/task-39-squiggle-submission.md` (lands via 005) — the spike findings. Key facts
  inlined here so you don't depend on having read it:
  - Squiggle tip objects carry: `gameid` (canonical, required), `hteam`, `ateam`, `tip`,
    `tipteamid`, `margin` (tipped team, positive), `hmargin` (home perspective, negative
    when away tipped), `confidence` / `hconfidence` (win prob as 0–100 percentage),
    `year`, `round`.
  - Team-name mapping ours→Squiggle: only `GWS Giants` → `Greater Western Sydney`
    differs (map exists in `analysis/weekly-monitor.py` `OURS_TO_SQ` and in plan 004's
    `src/cli/monitor/squiggle.ts` after 005 lands).
  - `gameid` linkage: resolve via `https://api.squiggle.com.au/?q=games;year=Y;round=R`,
    matching on `(hteam, ateam)` after name mapping. A `User-Agent` header is REQUIRED
    or the API refuses.
  - Lockout is per-game at scheduled start; no round-wide lockout.
  - Entry criteria: competent long-term performance, no human-opinion inputs, method
    transparency, preferably a public site.
- `src/cli/format/comp.ts` (lands via 005) — pure formatter producing the
  Squiggle-shaped payload minus `gameid`; `src/cli/commands/export-tips.ts` — dry-run
  CLI printing it. 15 tests in `tests/cli/comp-format.test.ts`.
- The former Cloudflare Worker was retired in v3.2 (CLAUDE.md); there is currently NO
  deploy target in this repo. `wrangler` is used only for D1 auth.
- Squiggle-fetch conventions exemplar: plan 004's `src/cli/monitor/squiggle.ts`
  (User-Agent set, name map, `?q=games`/`?q=tips` parsing).

Repo conventions: strict TS (`noUncheckedIndexedAccess`, no `any`), Zod at boundaries
(`api.squiggle.com.au` responses are a boundary — validate with Zod like the config
loader in `src/config/` does), Web Standard APIs only (fetch — no Bun APIs; this code
must run on Workers V8).

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Typecheck | `bun run typecheck` | exit 0 |
| Lint | `bun run check` | exit 0 |
| Tests | `bun run test -- --run` | all pass |
| Build | `bun run build` | exit 0 |
| Dry-run export | `bun run dist/cli/index.js export-tips --season 2026 --round <current>` | payload printed |

## Scope

**In scope**:

- `src/cli/monitor/squiggle.ts` — add a `resolveGameIds()` function (or a sibling
  module `src/cli/monitor/gameid.ts` if cleaner)
- `src/cli/commands/export-tips.ts` — add `--resolve-gameids` flag wiring the resolver
- `tests/cli/gameid.test.ts` (create)
- `worker/` (create) — endpoint skeleton: `worker/index.ts`, `worker/wrangler.toml`,
  `worker/README.md`
- `docs/task-42-comp-entry-checklist.md` (create) — the human-action checklist

**Out of scope** (do NOT touch):

- Deploying anything (`wrangler deploy`, DNS, routes)
- Contacting Squiggle (that's the maintainer's checklist item, not yours)
- `src/engine/`, configs, model behavior
- The retired-Worker history — do not resurrect old worker code from git history

## Git workflow

- Branch: `advisor/007-comp-entry` off main (after 005 merges)
- Conventional commits, e.g. `feat(cli): resolve Squiggle gameids in export-tips`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: gameid resolver

Add `resolveGameIds(season, round, fetchImpl)` returning
`Map<"hteam|ateam", number>` from `?q=games;year=Y;round=R`. Zod-validate the response
shape. Apply the name map in the OURS→Squiggle direction before matching. Injectable
`fetchImpl` for tests (match how `src/cli/monitor/squiggle.ts` structures its fetch
after 005 lands — same User-Agent constant).

**Verify**: `bun run typecheck` → exit 0.

### Step 2: wire into export-tips

Add `--resolve-gameids` flag: when set, fetch the round's games, attach `gameid` to
each payload entry, and **fail loudly listing unmatched games** (a payload with missing
gameids is worse than an error — SquiggleBot would silently drop those tips).
Default remains off (offline dry-run keeps working).

**Verify**: `bun run dist/cli/index.js export-tips --season 2026 --round <a completed 2026 round> --resolve-gameids`
→ every entry has a numeric `gameid`; command exits 0.

### Step 3: Worker skeleton

Create `worker/` with:

- `index.ts` — a Workers-format `fetch` handler serving `GET /tips` (and
  `GET /tips?round=N`) from a static JSON blob checked in as `worker/tips.json`
  (placeholder: one round of real `export-tips --resolve-gameids` output). Content-type
  `application/json`, permissive CORS, 404 elsewhere. NO D1 access, NO secrets — the
  design is "CLI generates payload, maintainer publishes it", so the Worker is a dumb
  static server and the update path is `export-tips > worker/tips.json` + redeploy
  (document exactly that in `worker/README.md`).
- `wrangler.toml` — name `tipper-tips`, no bindings, no account id committed.
- `worker/README.md` — deploy command, update flow, and a note that the final URL path
  format is agreed with Squiggle after acceptance and may change.

Keep `worker/` OUT of the npm package (`files` allowlist in `package.json` — verify it
already excludes it, otherwise adjust) and out of the CLI build if `tsconfig.json`
would sweep it in (add an exclude if needed).

**Verify**: `bun run typecheck && bun run build && bun run test -- --run` → all exit 0
(worker code type-checks; CLI build unaffected).

### Step 4: entry checklist doc

Create `docs/task-42-comp-entry-checklist.md`: ordered human actions with owner
MAINTAINER on each — (1) contact @SquiggleAFL/@maxbarry with model description
(MOV-Elo + PAV, fully automated, no human inputs; link README + docs ledger for the
transparency criterion), (2) agree endpoint URL format, (3) `wrangler deploy` from
`worker/`, (4) soak: serve remaining-2026 rounds and verify ingestion by checking
`?q=tips;source=<assigned id>` returns our numbers, (5) pre-2027 dry run. Include the
per-game lockout fact and the weekly update flow.

**Verify**: doc exists; every action line names an owner.

## Test plan

`tests/cli/gameid.test.ts`, modeled structurally on `tests/cli/comp-format.test.ts`
(lands via 005): mock `fetchImpl` fixtures for (a) clean round — all games resolve,
(b) GWS naming — resolves only via the name map, (c) missing game — resolver reports
the unmatched pair, (d) malformed API response — Zod rejection surfaces a clear error.
Verification: `bun run test -- --run` all pass including ≥4 new tests.

## Done criteria

- [ ] `export-tips --resolve-gameids` produces a payload where every entry has `gameid`, verified against a real completed 2026 round
- [ ] `worker/` type-checks; serves the checked-in payload shape (unit-test the handler with a Request object — no deploy)
- [ ] `docs/task-42-comp-entry-checklist.md` exists, all actions owner-tagged
- [ ] `bun run typecheck && bun run check && bun run test -- --run && bun run build` all exit 0
- [ ] npm `files` allowlist does not include `worker/`
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The live `?q=games` response doesn't match the Task 39 field list (API drift).
- More than one team name fails to match after the GWS mapping (name map is stale —
  needs maintainer eyes, not guesswork).
- You are tempted to have the Worker query D1 directly — that reintroduces the retired
  architecture and needs a maintainer decision.
- Anything requires a credential to be committed or echoed.

## Maintenance notes

- The endpoint URL/format WILL change after Squiggle contact — the Worker skeleton is
  deliberately dumb so that change is a routing tweak, not a rework.
- When the 2027 fixture appears, `export-tips` gains a weekly cadence; consider folding
  payload regeneration into plan 009's cron once the feed is live (explicitly deferred).
- Reviewer scrutiny: the fail-loudly-on-unmatched-gameid behavior in step 2 is the
  load-bearing safety property; don't let it soften to a warning.
