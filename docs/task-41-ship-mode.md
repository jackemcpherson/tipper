# Task 41: Ship Mode

This report records work toward the prospective 2027 trial and Squiggle entry.
The release is incomplete. The primary model remains `predha-080`.

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
