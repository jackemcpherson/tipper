# 2026 Kickoff Reconstruction

This research revision replays the production model for 244 completed fixtures before
Tipper's activation: 213 AFLM and 31 AFLW matches. These estimates describe a
historical reconstruction. They cannot establish the exact tips available then.

## Rating Development

Every match calls the unchanged production predictor at source revision
`da587769fdd23c7f084fa4e436b628a3e91eecfc`. The replay verifies its source checksum.

Elo rebuilds chronologically from 2020, with regression at season transitions.
PAV develops from eligible 2026 player performances, blended with fixed final
2025 player priors. The cumulative 2021 through 2025 league totals remain fixed.
Neither target-match statistics nor later results enter the prediction inputs.
The replay never reads current 2026 season PAV ratings.

Only completed games from earlier Melbourne calendar days enter the rebuild.
There is no reliable historical completion timestamp. The replay therefore
excludes same-day results, even when a game may have finished before the target.
This affects 128 predictions. Evidence lists the omitted earlier same-day games.

## Lineup and Source Assumptions

All 244 matchday rosters came from the official source through Fitzroy 4.0.0.
The replay validates fixture identity, canonical player IDs, ownership,
uniqueness, emergencies, and 23 AFLM or 21 AFLW active players per team.
All historical targets have usable lineup proxies, so none is provisional.
Twenty-three stored active rosters differed from the refreshed source.
Twenty-one were overfull and two contained same-size player swaps.

These are current historical rosters, without pre-kickoff announcement records.
Their actual September observation times remain in each row's evidence.
`simulatedLineupAvailableAt` explicitly marks assumed availability.
The predictor's synthetic `observedAt` is one millisecond before kickoff.
Neither field claims a historical collection or publication event.

Extracted fixtures, scores, statistics, and 2025 priors may contain corrections
made after the simulated cutoff. The retained source audit includes a May match
whose player statistics changed in June. The reconstruction does not remove that
uncertainty or prove historical data availability.

## Locally Retained Files

The data files stay in the local reconstruction archive and do not enter Git.
Copy them into this directory before reproducing the replay.

- `d1.json.gz` contains the seven responses from `extract.sql`, observed at
  `2026-09-06T00:18:54.765Z`. It retains inputs for both competitions.
- `lineups.json.gz` contains normalised roster proxies with actual observations,
  source endpoints, checksums, and canonical player IDs.
- `source-rosters.json.gz` retains the exact Fitzroy response file strings.
  Each normalised roster links to its retained source checksum.
- `source-audit.json.gz` retains player identity lookup rows, the lineup audit,
  and an example of a later player-statistics correction.
- `manifest.json` pins model, adapter, inputs, output checksum, assumptions,
  coverage, and batch identity.
- `output.json.gz` retains all generated reconstruction rows.
- `0022_tipper_reconstructions.sql` is a test copy of AFL-MCP's migration.
  AFL-MCP remains the schema owner.

## Reproduce and Verify

Use the research revision with Bun and the retained `bun.lock`.
Regenerating the outputs requires no D1 credentials or upstream requests.

```sh
bun install --frozen-lockfile
bun research/2026/replay.ts
bun research/2026/verify-d1.ts
bunx vitest run --config research/2026/vitest.config.ts
bun run build
bun run test
```

`replay.ts` creates ignored `output.json` and `import.sql` files.
The output checksum must match `manifest.json` and the archived output.
SQL creation timestamps vary between executions. Prediction outputs and batch
identity remain deterministic for the pinned adapter and frozen inputs.
`verify-d1.ts` runs all 246 generated statements against local D1, checks an
exact readback, and proves incomplete finalisation rolls back the entire batch.

The offline replay takes about 3.2 seconds and peaks near 230 MiB of process
memory on the development machine. It is not part of the Worker bundle.
Production prediction and publication implementations remain unchanged.

## D1 Admission and Use

Apply AFL-MCP migration `0022` through its pinned GitOps artefact first.
Review the generated manifest and SQL, then import the exact reviewed file
through authenticated Wrangler. The SQL writes only the reconstruction tables.
After an ambiguous response, inspect that batch before retrying. Duplicate
inserts fail instead of replacing records.

Read only batches with a non-null `completed_at`. Confirm all rows and their
output checksum after admission. The completion trigger rejects an incomplete
batch. A second trigger rejects inserts into a completed batch.

```sql
SELECT r.*, b.model_version, b.policy, b.created_at
FROM tipper_reconstructions r
JOIN tipper_reconstruction_batches b ON b.id = r.batch_id
WHERE b.completed_at IS NOT NULL AND b.season = 2026;
```

Current projections, genuine captures, feed delivery, and weekly competition
reports use their existing tables. These reconstructions never fill a missed
prospective tip. Fixtures after activation use the normal publisher and locks.
