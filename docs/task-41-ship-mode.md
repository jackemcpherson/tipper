# Task 41: Ship Mode

Tipper now has the prospective 2027 trial and the competition feed. The
primary remains `predha-080`, hash `2641f46f`. Task 40 found no promotion
candidate. Plain OD, `t40-od`, runs only as an archived shadow.

[Release v3.5.0](https://github.com/jackemcpherson/tipper/releases/tag/v3.5.0)
is available. Its [Release workflow](https://github.com/jackemcpherson/tipper/actions/runs/33955699718)
is green. All implementation PRs have merged to main with green CI.

Jack must review the sibling PRs, apply the migration and Worker release,
create the monitor secret, and verify the feed. Squiggle contact and submission
remain prohibited until Jack separately says so. No production deployment,
migration, manual prediction publishing, contact, or submission occurred.

## Publish and Archive

A due tick publishes the primary row first. It then captures the field and
appends the prediction's consumed inputs. At-lock selection uses the latest
capture strictly before both archived deadlines. Late captures cannot replace
missing earlier evidence.

<!-- diagram:tick -->

One additive table stores each match, model, and capture. The writer uses
inserts only and ignores duplicate capture keys. It stores published precision,
full-precision rating inputs, named lineup flags, and the game's available
field tips. A five-second field timeout or missing table cannot fail primary
publication or health.

The round freezes at its first kickoff. Later weekend team changes are outside
the model's information window. Unknown match times mean midnight. Minute-only
kickoff values gain seconds before storage. Forecast weather stays separate.
If a refresh replaced its retained row after lock, analysis marks it unavailable.

## Shadow Data Path

The primary upserts `match_predictions` and appends an archive capture.
`t40-od` calls the read-only predictor and appends only to the archive.
Each model retains its own consumed lineups. Archive and shadow failures
cannot turn a successful primary publication into a failure.

<!-- diagram:shadows -->

The challenger has the same content hash as `od-w100-k008`, `c8c7b6b7`.
The baker reads `configs/_shadows.json`, rejects duplicates, and omits the
promoted id from shadows. Existing promotion and baking commands remain the
only promotion path. Repeated baking produces identical bytes.

## Frozen Adjudication

Pair exact match ids from the two frozen model versions. Score the common
incumbent close band and its archived field. A complete prospective season
must precede any promotion decision. Historical reconstructions never qualify.

<!-- diagram:adjudication -->

The following bar is verbatim from
[the frozen adjudication](trial-2027-adjudication.md).

PROMOTE requires a complete prospective 2027 home-and-away season and at least
30 more correct non-draw tips for the challenger. It also requires either the
primary rule or the fallback rule below. Every other result is PARK.

The primary rule requires a positive paired tip delta whose paired 95%
bootstrap interval has a lower bound strictly above zero.

The fallback rule requires a positive paired tip delta. Tip deltas must be
non-negative in both the incumbent close band and the consensus-wrong cut.
No team's absolute signed residual bias may worsen by more than 2 points where
that team has at least 10 paired games. Both cuts must contain at least one
non-draw game. Missing field data cannot count as a passing empty cut.

A season of about 207 games detects roughly a 30-tip difference at 80% power.
That Task 40 planning estimate is approximate. The 30-tip promotion floor is
conservative and fixed. A smaller positive result is PARK, even if its
bootstrap interval excludes zero. Log loss cannot rescue it.

The command is `tipper trial --season 2027`. It reports tips, paired intervals,
close and consensus-wrong cuts, team bias, both probability heads, draw totals,
and missing pairs. The document also fixes source coverage, recent seasons,
lock times, the September decision date, and the complete-season requirement.
A test fails if its constants diverge from the scorer.

The 2026 reconstruction reproduces 211 paired games, 152 incumbent tips,
153 OD tips, and three draws. Competition totals are 155 and 156.
The common close band has 83 games and an OD gain of one tip.
Consensus-wrong has 51 games and an OD loss of three tips.
The frozen non-draw bootstrap interval is -6 to +7 tips.

Legacy log losses match Task 40 within numerical precision. Standard-normal
losses are 0.7865320726 for v3 and 0.7749803334 for OD. The compressed fixture
contains synthetic timestamps and empty lineup lists. Its provenance forces
PARK. It proves scorer agreement, not historical deadline knowledge.

## Squiggle Pull Path

After Jack separately authorises entry, SquiggleBot can pull the agreed URL.
The endpoint reads only the primary table and resolves canonical game ids
through the cached games API. The shared formatter also drives `export-tips`.

<!-- diagram:pull -->

The intended URL is `https://tipper.jackemcpherson.workers.dev/tips`.
It accepts `year` and `round`. Without them, it selects the next published
round or the most recent one. The existing hostname needs no new DNS resource.

Open GET CORS, unknown-round 404s, GWS mapping, both margin orientations, and
one-hour caches have tests. During Squiggle outages, valid primary tips remain
available without invented ids. Wait for ids before verifying ingestion.

A read-only smoke test against live D1 and Squiggle returned nine R24 tips
with nine canonical game ids. That test invoked the exported handler locally.
It did not deploy the endpoint or submit its response.

## Task 40 Review Findings

Independent review found and repaired two defects in separate commits.
The standard-normal approximation missed the 1e-9 gate. Its replacement peaks
at 4.44e-16 error across 8,001 reference points. The legacy head remains exact
across 20,001 checked points. Comparisons now fetch the same gap priors as
separate backtests.

The live training-PAV repair changes the frozen 2025 R10 replay by at most
0.0225728046 margin points and 0.0002764122 home probability. No winner changes.
The currently published 2026 R27 row replays exactly. The baseline remains
hash `2641f46f`, 716 tips, and log loss 0.848459853. All 1,062 stored predictions
match. No engine mode gained a schema default.

The review also checked optional evaluation guards, bootstrap duplicate and
strata rejection, config compatibility, and 201 campaign result files covering
140,767 rows. The original research commit trail and cited evidence remain.
The four adviser changes landed by cherry-pick, preserving the existing Worker.

## Landed Changes and Sibling Reviews

| Change                      | PR                                                                                 | Merge commit                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Documentation lint          | [#58](https://github.com/jackemcpherson/tipper/pull/58)                            | [`0a520cf`](https://github.com/jackemcpherson/tipper/commit/0a520cff9e662792a256058f4d37ea11caabe436) |
| Task 40 review and research | [#59](https://github.com/jackemcpherson/tipper/pull/59)                            | [`bfabf5c`](https://github.com/jackemcpherson/tipper/commit/bfabf5ceb664e1b6a3b55ff2a19d754e9541c4d5) |
| Four adviser changes        | [#60](https://github.com/jackemcpherson/tipper/pull/60)                            | [`6b8e08e`](https://github.com/jackemcpherson/tipper/commit/6b8e08e51c6b8a2fa195009764dd379c1cec720d) |
| Append-only archive         | [#61](https://github.com/jackemcpherson/tipper/pull/61)                            | [`b9133b7`](https://github.com/jackemcpherson/tipper/commit/b9133b79a0d4c5fbda1439c1fee51a0bb7f12f58) |
| OD shadow                   | [#62](https://github.com/jackemcpherson/tipper/pull/62)                            | [`d242a0b`](https://github.com/jackemcpherson/tipper/commit/d242a0b90d6d7549737df5545e296322695b3d96) |
| Frozen trial scorer         | [#63](https://github.com/jackemcpherson/tipper/pull/63)                            | [`d6d0e6e`](https://github.com/jackemcpherson/tipper/commit/d6d0e6e24303e5f585cc1212883a4c7b23d4f852) |
| Primary tips feed           | [#64](https://github.com/jackemcpherson/tipper/pull/64)                            | [`9612df1`](https://github.com/jackemcpherson/tipper/commit/9612df197d8d4719f1c26e7963fd1a475b5b65d2) |
| Weekly monitor              | [#65](https://github.com/jackemcpherson/tipper/pull/65)                            | [`8e448a6`](https://github.com/jackemcpherson/tipper/commit/8e448a6f2c9efb0f6fbfd9ca0c709b56e7f6f068) |
| Release and handover        | [#66](https://github.com/jackemcpherson/tipper/pull/66)                            | [`eb285fe`](https://github.com/jackemcpherson/tipper/commit/eb285feb53c3869f529b6b6eba161ef4300cb205) |
| Archive migration           | [AFL-MCP #183](https://github.com/jackemcpherson/AFL-MCP/pull/183)                 | Open                                                                                                  |
| Verified release pin        | [Infrastructure #160](https://github.com/jackemcpherson/cloudflare-infra/pull/160) | Open                                                                                                  |
| Public ecosystem document   | [Homepage #21](https://github.com/jackemcpherson/homepage/pull/21)                 | Open                                                                                                  |

AFL-MCP already had migrations through `0020`, so the additive archive uses
`0021`. Its isolated Miniflare suite passed 265 tests in 34 files. Its existing
historical prose errors remain documented in the PR. New sections passed.
No migration ran against production.

The infrastructure pin names release commit
`eb285feb53c3869f529b6b6eba161ef4300cb205`. Its
[artefact workflow](https://github.com/jackemcpherson/tipper/actions/runs/33955697041)
is green. A read-only R2 download verified SHA-256
`d81347be1081e3b41e6a8d21f365aec0332adc086a25f775bcb61fffe30185c9`.
Merging that PR does not apply production. Homepage's
PR updates the public ecosystem document. Leave all sibling merges to Jack.

## Verification

- Main passes typecheck, Biome, build, and 302 tests in 32 files.
- Full rumdl and the documentation workflow's exact Vale command pass.
- The monitor still matches the Python oracle. Its live 2026 run recorded
  211 games, v3 155, Punters 156, and market gap -1.
- The Monday 22:00 UTC workflow passes `actionlint` and permission review.
  Exit 3 means credentials, exit 4 means Squiggle, and exit 2 means an alert.
  It commits alert evidence before failing. CSV retries preserve history.
- Package inspection includes the trial CLI and shadow pointer, with no
  stored result files, tests, or environment files. The Worker bundle builds.
- All four diagrams passed visual inspection in light and dark themes.
  Labels fit. The page has no phone-width overflow. The report has no external
  scripts, style sheets, fonts, or tracking.

## Maintainer Checklist

1. Review and merge AFL-MCP PR #183 when ready for its separate migration
   process. Apply additive migration `0021` through the established pipeline.
2. Review infrastructure PR #160 and its verified artefact digest. Merge
   it, then manually apply `stacks/prod/workers/tipper`. The existing route suffices.
3. Review and merge homepage PR #21 to publish the ecosystem documentation.
4. Create tipper's `CLOUDFLARE_API_TOKEN` repository secret with D1 read access.
   Run the monitor once from main and verify its CSV commit.
5. Check `/health`, a known `/tips` round, canonical ids, and both archive
   models at the next due tick. Confirm successive captures do not replace
   earlier evidence. Do not run a manual `tipper publish`.
6. Use [the contact-and-soak checklist](comp-entry-checklist.md) for the exact
   draft, curl commands, finals rehearsal, and September to October calendar.
   Do not contact Squiggle or submit anything until Jack explicitly authorises it.
7. After separate acceptance and submission permission, verify ingested tips
   through Squiggle's read API. Confirm the agreed format and lock behaviour.
8. Before 2027 round 1, confirm both models' captures and the frozen document.
   After first publication, do not change the bar.

## Command and File Appendix

```sh
bun run typecheck
bun run check
bun run test -- --run
bun run build
bun run bake-config
bun analysis/task41-gate.ts
bun analysis/task41-monitor-golden.ts
bun analysis/task41-tips-gate.ts
bun src/cli/index.ts trial --season 2027 --out /tmp/trial-2027.json
bun src/cli/index.ts export-tips --season 2026 --round 24 --with-gameid
bun analysis/task41-report.ts
open docs/task-41-report.html
```

Core files are `src/data/archive.ts`, `src/worker/tick.ts`,
`src/trial/score.ts`, `src/worker/tips.ts`, `.github/workflows/monitor.yml`,
and `scripts/bake-config.ts`. The one-off reconstruction lives in
`analysis/task41-reconstruct.ts`. Its compressed fixture is
`tests/fixtures/trial-2026.json.gz`.

The original dirty-work backup remains in the named ship-mode Git stash.
The two original untracked result files remain untouched. Public publishing
initially failed automatic approval review twice. Jack then explicitly
authorised GitHub work and clarified that the prohibition applies to Squiggle
contact and submissions. The engineering decisions and verification above
reflect the completed 2026-09-05 work.
