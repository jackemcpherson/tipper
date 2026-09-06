# 2026 Reconstruction

The one-time replay covers 213 AFLM and 31 AFLW completed matches before
Tipper's activation. These records carry the label `reconstructed` and remain
separate from issued tips, live feeds, prospective coverage, and weekly reports.

## Model and Historical Inputs

The replay uses the deployed production predictor at revision
`da587769fdd23c7f084fa4e436b628a3e91eecfc`, with its source checksum verified.
Each match rebuilds team Elo and player PAV from eligible earlier performances.
Elo starts in 2020 and regresses at season transitions. PAV develops throughout
2026, blending current performance with the fixed final 2025 player prior.
Historical league totals remain cumulative. Current 2026 season PAV ratings
never enter the replay.

Only completed matches from earlier Melbourne calendar days enter ratings.
The source lacks reliable completion timestamps, so the replay excludes
same-day results. This affects 128 predictions. Each row lists those exclusions.
Target-match statistics, live results, and later results cannot affect outputs.

All 244 refreshed source rosters have valid player identities and team ownership.
Each team has 23 AFLM or 21 AFLW active players, with emergencies excluded.
Twenty-three stored active rosters differed from the source: 21 were overfull
and two contained same-size player swaps.

The rosters are historical lineup proxies observed in September. No retained
announcement history proves their pre-kickoff availability. Each row preserves
the actual observation time and explicitly labels simulated lineup availability.
Extracted scores, statistics, fixtures, and priors may also contain later
corrections. These limitations prevent an exact claim about the tip available
at the historical kickoff.

## Records and Reproduction

AFL-MCP migration `0022` owns `tipper_reconstruction_batches` and
`tipper_reconstructions`. A batch retains model identity, policy, real extraction
and creation times, expected coverage, checksums, and completion time.
Match rows retain fixture identity, simulated cutoff, prediction outputs,
winner, rating inputs, lineup evidence, and historical-input assumptions.

Read only batches with a non-null `completed_at`. Database triggers reject
incomplete finalisation and inserts into completed batches. The writer only
appends records and never writes current predictions or genuine captures.

```sql
SELECT r.match_id, r.competition, r.margin, r.home_probability,
       r.winner, b.model_version, b.policy, b.created_at
FROM tipper_reconstructions r
JOIN tipper_reconstruction_batches b ON b.id = r.batch_id
WHERE b.completed_at IS NOT NULL AND b.season = 2026;
```

The [research revision][research] retains the replay code, extraction query,
migration test copy, regression tests, and reproduction instructions.
Frozen inputs, source observations, manifest, SQL, and outputs stay in the local
`.scratch/reconstruction-2026/` archive, excluded from Git. Copy the retained
data files into `research/2026/` in that revision to reproduce the run offline.

The offline replay takes about 3.2 seconds and peaks near 230 MiB of process
memory on the development machine. It is not part of the production Worker.

## Verification

Seven replay tests cover evolving Elo and PAV, target and future result
exclusion, and live results. They also check lineup fallback, fixture identity,
duplicate inputs, scope, ordering, and output orientation.
The full 244-row import passes an exact local D1 readback and checksum check.
Removing one row makes finalisation roll back the entire batch.
AFL-MCP's 271 tests include nine dedicated reconstruction storage checks.

Production D1 admitted all 244 rows at `2026-09-06T00:40:50.599Z`.
Every stored row matched the local output exactly, including the output
checksum. All 16 existing genuine captures remained unchanged, as did the
historical compatibility projections. Worker health passed with all 11 expected
upcoming predictions present and fresh.

Fixtures after activation continue through the normal publisher and permanent
kickoff locks. A reconstruction cannot repair a missed prospective tip.

[research]: https://github.com/jackemcpherson/tipper/tree/research/2026-kickoff-reconstruction-2026-09-06/research/2026
