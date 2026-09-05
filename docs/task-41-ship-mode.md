# Task 41: Ship Mode

This report records work toward the prospective 2027 trial and Squiggle entry.
The release is incomplete. The primary model remains `predha-080`.

## Publish and Archive

A due tick publishes the primary row first. It then captures the field and
appends the prediction's consumed inputs. At-lock selection uses the latest
capture strictly before both archived deadlines. A late capture cannot stand
in for a missing earlier prediction.

<!-- diagram:tick -->

## Shadow Data Path

The primary upserts `match_predictions` and appends an archive capture.
`t40-od` calls the read-only predictor and appends only to the archive.
Each model retains its own consumed lineups. Neither model's archive failure
can turn a successful primary publication into a failure.

<!-- diagram:shadows -->

## Frozen Adjudication

Pair exact match ids from the two frozen model versions. Score the common
close band and the incumbent's archived field. The 30-tip floor applies before
either promotion rule. Retrospective and incomplete evidence remain PARK.

<!-- diagram:adjudication -->

## Squiggle Pull Path

After Jack separately authorises entry, SquiggleBot can pull the agreed URL.
The endpoint reads only the primary table and resolves canonical game ids
through the cached games API. Its shared formatter also drives `export-tips`.
No contact or submission has occurred.

<!-- diagram:pull -->

## Execution Log

Each entry records completed work or a concrete blocker.

### 2026-09-05

- Read the ship-mode prompt and inspected repository state. Task 40 was local
  without a remote branch. Preserved all initial dirty files in a named Git
  stash.
- Fetched remote main at `dd6778f`. Created `chore/docs-lint-2026-09` from
  main and rebased its docs commits onto the updated remote base.
- Committed the authorised docs pass, guide rename, plans, and documentation
  workflow. Fixed 99 remaining Vale errors. Excluded adviser worktrees and
  generated lint cache from local checks. Docs branch ends at `6199e15`.
- Local Markdown structure and prose checks pass. Typecheck, Biome, build,
  and 193 tests pass. Installed the updated lock file after these checks.
  final validation will use its exact dependencies.
- BLOCKED: `git push -u origin chore/docs-lint-2026-09`. Automatic approval
  review rejected public publishing twice. Verified that origin is the
  public `jackemcpherson/tipper` repository and Jack has ADMIN access.
  Requested explicit publishing approval. No remote write occurred.
- Rebased Task 40 locally onto the docs branch while publishing awaits approval.
  Preserved all 11 research commits. Resolved Vitest and CHANGELOG overlaps.
  The rebased research tip before review repairs is `3004736`.
- Independent reviewer inspected original Task 40 commit `07daf343` against
  original main `8b7ed5b`. Found two defects described below.
- BLOCKED pending credential refresh: `bun analysis/task41-gate.ts` reports
  no Cloudflare credentials. The script only reads D1 and writes local
  evidence. It never publishes predictions or changes existing results.

## Task 40 Review

The independent review verified 201 result files containing 140,767 rows.
All stored overall metrics reproduce exactly. Every file has a matching
config hash and unique match IDs. All 155 historical configs parse identically.
New schema fields remain optional without defaults.

Legacy probabilities match original main at 20,001 grid points. Bootstrap
validation rejects duplicate IDs, mismatched outcomes, overlapping strata,
and invalid draw counts. A valid reordered 211-match comparison succeeds.
Optional engine branches have configuration guards.

The optional standard-normal head missed the required 1e-9 accuracy.
Its largest measured error was 6.96874e-8 at z=0.064. The replacement uses
an integral series. A Python `math.erf` fixture checks 8,001 grid points.
The legacy expression remains unchanged.

`runCompare` omitted PAV priors for gap years. The reviewer reproduced all 211
margins differing for `t40-offset-v4-2026`. Comparison LL was 0.7706779281 in
the comparison. Standalone backtest LL was 0.7723277863. Repair now fetches
priors for every non-training warm-up season. A regression test failed before
the fix and passes after it.

## Remaining Delivery Gates

1. Publish and merge the docs PR after green CI.
2. Repair both Task 40 defects, reproduce the primary baseline, and compare
   a published 2026 round against D1. Publish and merge the research PR.
3. Cherry-pick and adapt all four approved adviser commits. Merge after CI.
4. Open the additive archive migration PR in AFL-MCP without merging it.
5. Land archive capture, shadow publishing, the trial scorer, its 2026 golden
   test, and frozen 2027 adjudication in separate PRs.
6. Land game ID resolution, the tips endpoint, and scheduled monitoring.
7. Open infrastructure and homepage PRs without merging them.
8. Write the contact and soak checklist, release notes, and HANDOFF addendum.
9. Publish v3.5.0 and verify its Release workflow.
10. Finish this report and its four diagrams. Render the standalone HTML,
    inspect both themes, open it in the maintainer's browser, and merge it.

## Maintainer Checklist

The final handover will replace this provisional list with exact commands,
PR links, and the public URL. Deployment and Squiggle contact remain manual.

1. Merge and apply the additive AFL-MCP migration after review.
2. Merge the infrastructure pin and route, then deploy through GitOps.
3. Configure the monitor token secret.
4. Contact Squiggle, agree the endpoint format, and complete the soak checks.

### Gate Evidence, 2026-09-05

Wrangler refreshed the existing OAuth login. The read-only gate then passed.
Fresh D1-backed `predha-080` reproduced hash `2641f46f`, 716 tips, and
LL 0.8484598529648077. All 1,062 serialised prediction rows match the stored
2026-09-05 result exactly. Existing result files remain unchanged.

The latest published AFLM round is 2026 R27, with one row, match 19707949.
Its publish timestamp is 2026-09-05T06:31:02.563Z. Replay matches the stored
0.8-point home margin and home probability exactly. Evidence lives in
`/tmp/tipper-task41-gate-1788591196169.json`.

The historical Task 40 report records a maximum 0.0226-point live-path
repair on 2025 R10. That historical figure differs in scope from the zero
published-row difference verified above.

CDF repair commit: `3ca1bd6`. The optional head now meets 1e-9 accuracy.
The frozen Task 40 report remains a historical generated artefact. Its
source is `analysis/task40-report.ts`. Documentation checks exclude that
file to preserve the original research record, including its stored CDF
figures. New report prose continues through the normal documentation checks.

The comparison repair is commit `37208b4`. Full validation passes with the
updated dependencies: 24 test files and 224 tests. The primary baseline
and published-row gate passed again after the comparison fix.

`bun run bake-config` initially changed only TypeScript string formatting.
The generator emits double-quoted JSON, while the committed file uses
Biome's formatted string. Running Biome restores byte identity. The primary
config and content hash never changed.

## Adviser Integration, 2026-09-05

All four commits now exist on local `chore/land-advisor-branches`.
The cherry-picks are `0b87f3d`, `089f1c2`, `56e5d6f`, and `148e9ca`.
Both CLI conflicts retain every command. The Worker directory remains intact.
The historical Task 39 spike has a dated correction for the restored Worker.

The monitor's log path originally resolved above the repository. The corrected
path points to tipper's `analysis/monitor-log.csv`. Both `export-tips` and
`monitor` appear in the built CLI help. README usage lists both commands.
The homepage worktree at `/private/tmp/tipper-ship-homepage` documents them.

`bun analysis/task41-monitor-golden.ts` passes against the original Python
scoring functions for 422 frozen 2026 predictions. The combined model-specific
close bands contain 171 non-draw predictions, with 104 correct signs.
This checks each model's own close band. The live command uses v3's common
close band for cross-model comparison.

`bun src/cli/index.ts monitor --season 2026` also succeeds against live D1
and Squiggle. On 211 completed games, comp totals are v3 155, OD 156, v4 149,
and Punters 156. V3's common close band has 83 games, with correct signs
of 52 for v3, 53 for OD, 46 for v4, and 53 for Punters. The market gap is -1.
No log flag or prediction write command ran.

The independent follow-up review confirmed both Task 40 repairs. Standard
normal error peaks at 4.44e-16 across all 8,001 reference points. The Python
fixture also passed independent regeneration. Legacy output remains exact.

The frozen 2025 R10 replay has nine changed margins versus original main.
The maximum change is 0.0225728046 points, with no winner changes. Its maximum
home probability change is 0.0002764122. Original Task 40 and repaired Task 40
produce identical objects for all nine matches.

AFL-MCP already has migrations through `0020_drop_legacy_weather_columns.sql`.
The archive must use `0021`, rather than the prompt's stale `0016` number.

The full Python monitor also ran with frozen campaign results, live Squiggle
reads, refresh disabled, and its CSV redirected to `/private/tmp/`.
Its tips, ranks, common close-band scores, field percentage, and market gap
match the typed live command. The Python CSV is
`/private/tmp/tipper-monitor-python.csv`. Integration validation passes:
26 test files, 259 tests, typecheck, Biome, and build.

## Archive Contract, 2026-09-05

The draft migration lives in `/private/tmp/tipper-ship-afl-mcp` on
`feat/prediction-archive`, based on AFL-MCP main `c3f964c`.
It adds one table, `prediction_archive`, with one match/model/capture key.
The writer will use inserts only. The key prevents duplicate captures from
replacing earlier evidence. Each row stores the game's subset of a round's
Squiggle response, including all available sources. This avoids repeating
the complete round response in every match row.

```text
publish tick
  primary prediction reads named lineups
  primary upserts match_predictions
  capture field for round
  append primary outputs + exact consumed lineups + rating inputs
  run shadow with its own consumed lineups
  append shadow outputs + inputs only

at lock
  captured_at in Melbourne < round_first_kickoff
  captured_at in Melbourne < match_kickoff
  select latest eligible row per match and model
  pair models on match_id
```

The capture instant follows prediction completion. Captures that finish after
kickoff cannot become at-lock evidence. The archive retains both kickoff
values in Melbourne wall time. Unknown kickoff times use midnight, matching
the existing publisher's conservative freeze. The implementation must retain
lineups from the prediction fetch, without a second lineup query.

AFL-MCP's schema SQL, MCP schema output, coverage contract, integration setup,
and schema document include the new table. The migration tests exercise
multiple captures, duplicate rejection, home orientation, unchanged primary
rows, probability bounds, and JSON validity. No production migration ran.

The sibling typecheck and Biome checks pass. Its full test suite requires
Miniflare to bind `localhost`, which the sandbox initially denied. The retry
uses permission for local test execution. Existing sibling documentation has
75 Vale errors. New sections receive a separate prose check.

AFL-MCP's local retry passed all 34 test files and 265 tests, including the
new migration tests. Its PR description is ready at
`/private/tmp/tipper-afl-pr.md`. Opening the PR still awaits publishing
approval. The tests only applied migrations to Miniflare's local D1 database.

The local AFL-MCP migration commit is `4231484`.

## Archive Implementation, 2026-09-05

The local archive branch retains fixtures and named lineups from the
prediction's own read. Each capture stores published precision, full-precision
rating inputs, and all available Squiggle sources for that game. It omits
outcomes. Captures use the completion clock, not the tick's scheduled time.

The primary upsert finishes before the field fetch. Squiggle has a five-second
timeout. Missing archive tables produce a warning. Other capture failures also
leave the successful primary result intact. SQL uses inserts with duplicate
keys ignored, so retries cannot replace evidence.

Tests cover both margin orientations, consumed lineup flags, field outages,
missing tables, bounded SQL batches, and successful publication despite archive
failure. The frozen replay still gives hash `2641f46f`, 716 tips, and log loss
0.848459853. Every stored prediction remains identical. The published R27 row
also matches exactly. Validation uses stubbed Worker ticks and read-only D1
replays. No production publishing command ran.

## Shadow Implementation, 2026-09-05

`configs/_shadows.json` freezes `t40-od`, the campaign's plain OD challenger.
Its content hash matches `od-w100-k008`. The baker validates the list and
rejects duplicate ids. It omits the promoted id from shadow runs, so the
existing promotion and baking commands remain sufficient. Its output includes
both model configs. The primary block remains byte-identical, and a second
bake produces identical bytes.

Each shadow calls the read-only prediction function directly. It never calls
the primary publisher. The tick appends shadow captures with `is_primary = 0`.
A failed primary archive write cannot stop a shadow run. A failed shadow
cannot change the primary outcome. Both models use the round's single field fetch.

Worker tests use the real SQL builders against a stubbed database. They assert
one primary upsert, separate archive inserts, opposite prediction orientations,
and continued primary success when the shadow fails. The full suite passes
270 tests in 27 files, with typecheck, Biome, and build.

## Frozen Scorer, 2026-09-05

`tipper trial` reads paged archive captures and separately joined final scores.
It selects the last eligible capture before both deadlines, then pairs exact
match ids and the two frozen model versions. Missing pairs remain visible.
Incomplete seasons, retrospective inputs, and finals diagnostics cannot
produce PROMOTE. The scorer never changes a config pointer.

The 2026 golden fixture has 422 synthetic captures. It reproduces 211 paired
games, 152 incumbent tips, 153 OD tips, and three draws. Competition totals are
155 and 156.

The common close band has 83 games and an OD gain of one tip.
Consensus-wrong has 51 games and an OD loss of three tips. The paired interval
is -6 to +7 tips. Both legacy losses match Task 40 within numerical precision.

The fixture has explicit retrospective provenance, synthetic capture times,
and empty lineup lists. It establishes scorer agreement only. It cannot prove
deadline inputs or qualify for promotion. Gzip keeps the committed fixture
small. `analysis/task41-reconstruct.ts` rebuilds it from frozen campaign results
and the retained Squiggle response without replacing existing evidence.

The frozen document specifies the primary CI rule, fallback cuts, 30-tip
promotion floor, complete-season requirement, and September decision date.
A drift test compares its constants with the scorer. Tests also exercise
strict kickoff boundaries across daylight saving, duplicate rejection, field
coverage, draw treatment, full-precision close margins, and promotion guards.
Validation passes 279 tests in 29 files, typecheck, Biome, and build.

The weather schema retains one row per match and kind, not every forecast
refresh. Analysis can join a retained forecast only when its fetch preceded
lock. A later replacement makes that weather input unavailable. The trial
document records this limitation and forbids substituting observed weather.

## Competition Endpoint, 2026-09-05

`GET /tips?year=2026&round=24` reads only the baked primary model's published
rows. Without parameters, it selects the next published round or the most
recent published round when none is ahead. Unknown rounds return 404.
Known rounds without predictions return an empty tips array.

The shared formatter includes canonical game and tipped-team ids when
Squiggle resolves them. It maps GWS and preserves both margin orientations.
Worker Cache API and CLI disk caching each use one hour. Squiggle outages
leave valid primary tips available without invented ids. Such a response
needs a later successful refresh before competition ingestion.

The exported handler passed a read-only smoke test against live D1 and
Squiggle. It returned all nine 2026 R24 tips with nine distinct canonical
game ids. `analysis/task41-tips-gate.ts` records the check. The full suite
passes 293 tests in 31 files, typecheck, Biome, and build.

Infra already enables the Worker's public hostname. The intended URL is
`https://tipper.jackemcpherson.workers.dev/tips`. The prompt's statement that
the Worker has no public hostname is stale. The endpoint needs no new DNS resource.
The sibling change must pin the new artefact after a green main build.

## Weekly Monitor, 2026-09-05

The workflow runs Monday at 22:00 UTC or by manual dispatch from main.
It derives the current season unless the maintainer supplies one year.
Credential failures use exit 3, Squiggle failures use exit 4, and genuine
market-gap alerts retain exit 2. Other failures remain exit 1.

The scoring job has read permission and receives the D1 token only in the
steps that need it. A separate job merges one CSV row into the latest log
with repository write permission. It commits alert evidence before failing
the run. The workflow caches season data with the season in its key.

`actionlint` 1.7.12 passes. Its downloaded binary matched the official checksum.
The log merge passed local checks for history preservation, same-date retries,
and header-drift rejection. The permission review found no hard violations.
It follows GitHub's documented
[job permission scope](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idpermissions)
and uses full commit pins for every action.

The live typed monitor still reports 211 paired games, v3 155, Punters 156,
and market gap -1. It wrote the local 2026-09-05 CSV row. The Python golden
check passes. Full validation passes 301 tests in 32 files, typecheck, Biome,
and build. No GitHub workflow ran during local preparation.

## Maintainer Hold, 2026-09-05

The maintainer explicitly asked for no Squiggle contact or submission of any
changes until further instruction. All pushes, PR creation, merges, release
publishing, deployment, and external contact remain on hold. Preparation and
verification continue locally. No remote write has occurred during this task.

## GitHub Authorization Clarified, 2026-09-05

The maintainer authorised pushes, PRs, merges, and releases on the owned
GitHub repositories. The hold applies to Squiggle contact and submissions.
Tipper PRs may merge after green CI. Sibling PRs remain open for the maintainer
to merge.
Deployment and production migrations remain manual under the original scope.
