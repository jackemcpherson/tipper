# Plan 002a: Audit and (if warranted) enrich weather data in the afl-stats pipeline

> **Executor instructions**: This plan executes **in the `afl-stats` repository, NOT in
> tipper.** tipper only *reads* weather from the Cloudflare D1 database; the data is
> *produced* by afl-stats' ingestion (the same pipeline that did the DOB backfill). This
> plan was written from the tipper side by an advisor who does **not** have the afl-stats
> repo in view — so it is investigation-led: confirm the real structure before changing
> anything, and treat every "Current state" claim about afl-stats as a hypothesis to
> verify, not a fact. Run every verification command. If anything in "STOP conditions"
> occurs, stop and report. This plan **gates plan 002b** (the tipper-side signal test).
>
> **Drift check (run first)**: there is no tipper SHA to diff against here — instead,
> confirm the afl-stats repo is the one that populates the D1 `matches.weather_temp_c` /
> `matches.weather_type` columns before proceeding (Step 1).

## Status

- **Priority**: P2
- **Effort**: S (audit-only) to M (if enrichment + backfill is warranted)
- **Risk**: LOW (audit) → MED (a D1 backfill mutates the shared production database)
- **Depends on**: none
- **Gates**: plan 002b (tipper weather signal test) — 002b should not run until this plan
  reports the weather coverage it can expect.
- **Category**: direction / data-pipeline
- **Planned at**: tipper commit `4948270`, 2026-06-30

## Why this matters

The tipper team wants to test whether weather carries tip-relevant signal (plan 002b). But
that test is only as good as the underlying data, and **weather coverage/quality is an
upstream concern, not a tipper one**: tipper reads `matches.weather_temp_c` and
`matches.weather_type` from D1 but never writes them. The maintainer's hypothesis is that
the upstream source (fitzRoy / AFL-Tables / footywire scrapers, the same family used for
the DOB backfill) may expose **richer weather than D1 currently stores** — e.g. rainfall,
wind, or denser historical coverage — and that enriching ingestion *before* the signal test
would make the test meaningfully more powerful. Conversely, if the source has no better
weather than D1 already holds, this plan kills the enrichment idea cheaply and hands 002b a
clear-eyed coverage number to work with.

This mirrors the **DOB-backfill precedent**: the date-of-birth gap (Task 30 was *blocked on
DOB coverage*) was fixed upstream in afl-stats (`scripts/backfill-dob.mts`, coverage
1998–2014 went 0–10% → 99%), and only then consumed in tipper (Task 37). Weather should
follow the same two-step shape.

## Current state (HYPOTHESES — verify in Step 1)

From the tipper side, the following are believed true but must be confirmed against the
actual afl-stats repo:

- The D1 database `afl-stats` has a `matches` table with `weather_temp_c` (real, nullable)
  and `weather_type` (text, nullable) columns. tipper's `src/data/types.ts:49-50` and
  `src/data/queries.ts:106` consume exactly these two.
- These columns are populated by an afl-stats ingestion script (location unknown — likely
  under `scripts/` alongside `backfill-dob.mts`, which `HANDOFF.md` cites as the DOB
  backfill).
- The upstream data source is the fitzRoy R package (or a TypeScript port / direct fetch
  of the same AFL-Tables / footywire endpoints). `HANDOFF.md` notes the DOB backfill used
  "AFL Tables all-time team lists via fitzroy (with a direct-fetch override for Brisbane
  Lions)".
- **Unknown and central to this plan**: whether fitzRoy (or the underlying footywire match
  pages) exposes weather fields beyond a single temp + a category string, and at what
  historical coverage.

### Conventions to follow (from the DOB-backfill precedent)

- Backfill scripts live under afl-stats `scripts/`, written as `.mts` (the DOB backfill is
  `scripts/backfill-dob.mts`). Model any new script on that one — same arg-parsing,
  D1-write batching, and idempotency style.
- D1 has a bind limit of ~100; large writes batch in chunks (tipper batches IN-clauses at
  80 — afl-stats' writer likely has the same constraint). Honor whatever the DOB script does.
- Direct-fetch overrides are an accepted pattern where the library's mapping is wrong (the
  Brisbane Lions case) — reuse rather than reinvent if a venue/source needs special-casing.

## Commands you will need

(Exact commands depend on the afl-stats repo's tooling — discover them in Step 1 from its
README / package.json. Placeholders below; replace with the real ones.)

| Purpose | Command | Expected on success |
|---|---|---|
| Find the ingestion/backfill scripts | `ls afl-stats/scripts/ && grep -rln weather afl-stats/` | locates the weather writer |
| Check current D1 weather coverage | a read query over `matches` grouping null vs non-null `weather_type` by season | a coverage table |
| Inspect fitzRoy weather fields | an R session: `fitzRoy::fetch_results(...)` / footywire fetch for a sample season, list weather columns | the available weather fields |
| Run a backfill (if warranted) | `<afl-stats runner> scripts/backfill-weather.mts` | rows updated, exit 0 |

> **Auth note**: writing to D1 requires afl-stats' own Cloudflare credentials. If they are
> not available in this environment, the **enrichment half is a STOP condition** — you can
> still complete the audit half (read-only) and report.

## Scope

**In scope** (in the afl-stats repo):

- A read-only **coverage audit** of `matches.weather_temp_c` / `weather_type` by season.
- An **availability audit** of what weather fields fitzRoy / the upstream source exposes.
- *If and only if* the audit shows richer/denser weather is available: a new backfill
  script (model on `scripts/backfill-dob.mts`) plus, if new fields are warranted, a schema
  migration adding columns — **with the tipper maintainer's sign-off** before any D1 write.
- A written findings doc in afl-stats recording coverage before/after.

**Out of scope**:

- **Any change to the tipper repo** — that is plan 002b. This plan only changes afl-stats
  and/or the shared D1 data.
- Adding weather *to the model* — neither this plan nor 002b does that; the model change is
  a later plan that only exists if 002b returns GO.
- A D1 write without explicit maintainer approval (it mutates the shared production DB).

## Steps

### Step 1: Locate the weather writer and confirm the hypotheses

In the afl-stats repo, find the script(s) that populate `matches.weather_temp_c` /
`weather_type`, and confirm the upstream source (fitzRoy? footywire direct? something
else). Read the DOB backfill (`scripts/backfill-dob.mts`) as the structural template.

**Verify**: you can name the exact file that writes weather and the exact upstream source
it pulls from. If weather is **not** currently written by any script (the columns were
populated by a one-off import), record that — it changes the enrichment approach.

> **STOP if** the afl-stats repo is not available in this environment, or the D1 columns
> turn out to be populated by something you cannot locate — report and hand back.

### Step 2: Audit current D1 weather coverage

Run a read-only query over `matches` reporting, per season 2015–2026: count of rows,
non-null `weather_type` count, non-null `weather_temp_c` count, and the distinct
`weather_type` values. This is the number plan 002b most needs.

**Verify**: a coverage table exists showing the non-null fraction per season. Record it.

### Step 3: Audit upstream (fitzRoy / footywire) weather availability

For a sample of recent and historical seasons, fetch the upstream match data and list every
weather-related field it exposes (temperature, conditions, rainfall, wind, humidity — and
how complete each is). Compare to what D1 currently stores.

**Verify**: a side-by-side of "fields D1 has now" vs "fields the source exposes", with
coverage for each. This produces the GO/NO-GO for enrichment.

**Decision gate** (pre-register before looking):

- **Enrich** iff the source provides either (a) materially denser coverage of the existing
  two fields (e.g. fills a season block that is mostly null in D1), or (b) at least one new
  field plausibly tied to scoring (rainfall or wind), at usable coverage (≥ 60% for the
  seasons tipper backtests, 2016–2025).
- **Otherwise NO-ENRICH**: D1 already holds what the source has. Report current coverage to
  002b and stop. This is a valid, useful outcome.

### Step 4 (only if Step 3 says Enrich): Backfill, with sign-off

Write a backfill script modelled on `scripts/backfill-dob.mts` (same idempotency + batching

- direct-fetch-override patterns). If new columns are needed, add them via the repo's
migration mechanism first. **Before any D1 write, get explicit maintainer sign-off** — this
mutates the shared production database tipper reads live.

**Verify**: re-run the Step-2 coverage query → coverage improved to the target; spot-check a
handful of known wet-weather games (e.g. a famous wet grand final) have plausible values.

### Step 5: Record findings and hand off to 002b

Write an afl-stats findings doc (model on how `HANDOFF.md` records the DOB backfill):
current coverage, what the source offered, the enrich/no-enrich decision, and — if
enriched — before/after coverage and any new columns. State the **final weather coverage
002b can rely on** and whether tipper's `MatchRow` (`src/data/types.ts`) needs new fields
plumbed (a tiny tipper follow-up, noted for 002b/maintainer).

**Verify**: the doc exists and states the coverage number and the decision.

## Done criteria

ALL must hold:

- [ ] The weather writer + upstream source are identified (Step 1).
- [ ] A per-season D1 weather coverage table (2015–2026) is recorded (Step 2).
- [ ] An upstream-vs-D1 weather field/coverage comparison is recorded with a pre-registered
      enrich / no-enrich decision (Step 3).
- [ ] If enriched: a backfill ran **with maintainer sign-off**, coverage improved to target,
      and spot-checks pass (Step 4). If no-enrich: that decision is recorded with the
      reason.
- [ ] A findings doc states the final coverage 002b can rely on and any tipper plumbing
      needed.
- [ ] **No tipper-repo files were modified** by this plan.
- [ ] `plans/README.md` (in tipper) status row for 002a updated — or, if you cannot reach
      the tipper repo, report the outcome so the maintainer updates it.

## STOP conditions

Stop and report back (do not improvise) if:

- The afl-stats repo is not in this environment, or the weather writer cannot be located.
- A D1 **write** is required but maintainer sign-off or afl-stats Cloudflare credentials
  are unavailable — complete the read-only audit and stop.
- The upstream source's weather is no better than D1's current data — that's a NO-ENRICH
  result; record it and stop (success, not failure).
- You find yourself editing tipper source — that's plan 002b; out of scope here.

## Maintenance notes

- **Hand-off to 002b**: 002b's Step-1 coverage gate consumes this plan's coverage number.
  If 002a enriched D1 with new columns (e.g. rainfall), tipper's `MatchRow`
  (`src/data/types.ts`) and the match query (`src/data/queries.ts:106`) need those columns
  plumbed before 002b can use them — flag this as a small tipper task for the maintainer.
- **Backfill safety**: weather backfills, like the DOB one, should be idempotent and
  re-runnable; past seasons are append-only in tipper's cache, so a one-time correct
  backfill is permanent.
- A reviewer should scrutinise: the upstream source's weather provenance (is it
  match-day-actual or a forecast?), the timezone/locality of any temperature, and that the
  enrich decision was pre-registered before the coverage was seen.
