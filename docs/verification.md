# Verification

The production redesign uses the incumbent regression fixture and real local D1
transactions. The upstream AFL-MCP suite passes 262 tests. Infrastructure's
complete CLI suite passes 57 tests. Tipper's replacement suite passes 27 tests
and covers prediction, publication, stored delivery and scoring interfaces.

## Local Workload Measurements

Measured on 5 September 2026. Synthetic AFLM workloads contain 18 teams and
207 completed matches per historical season from 2020 to 2025. Each workload has
nine upcoming target matches and
either nine or 207 completed target-season matches. The native D1
benchmark includes 46 player-stat and lineup rows per completed match. Priors are
absent in this workload. Production queries still retain historical league totals.

| Native local D1 measurement     | Legacy early | Production early | Legacy late | Production late |
| ------------------------------- | -----------: | ---------------: | ----------: | --------------: |
| Input queries                   |           61 |                7 |          65 |               7 |
| Returned input rows             |       117206 |             2090 |      135620 |           11396 |
| D1 rows read                    |       123936 |            52948 |      143340 |           63244 |
| Fetch and rebuild wall time, ms |          917 |               37 |        1025 |             110 |

Pure rebuild measurements use separate Bun processes and 21 iterations per
workload. They include the same matches and player statistics, with announced
lineups only for target fixtures. Report the median duration. Peak resident
memory includes Bun, imported modules and fixture construction.

| Pure rebuild measurement          | Legacy early | Production early | Legacy late | Production late |
| --------------------------------- | -----------: | ---------------: | ----------: | --------------: |
| Median time, ms                   |         2.93 |             0.62 |        3.38 |            1.85 |
| Heap after repeated rebuilds, MiB |         18.6 |              4.6 |        22.5 |            11.6 |
| Peak process resident memory, MiB |        105.5 |             75.7 |       110.5 |            85.6 |

The Worker bundle fell from 650.02 KiB to 589.54 KiB before compression.
Compressed size fell from 106.99 KiB to 91.35 KiB. Both builds use the
repository's pinned Wrangler.

These are synthetic local measurements, not production CPU or isolate-memory
measurements. Network latency, actual missing priors, full season data and D1
query plans can change them. The infrastructure contract has no explicit Worker
CPU limit, so production budget validation remains part of promotion. The
snapshot rejects more than 10000 historical matches, 30000 target-season player
rows, 2000 priors, 1200 lineup rows or 20 candidate matches.

## Migration and Workflow Review

The shared migration adds columns, tables, indexes and a fixture-change trigger.
It leaves existing prediction fields and Task 41 archives intact. The trigger
invalidates current predictions and mappings while retaining captures. Local D1
tests exercise rollback, replacement and invalidation behaviour.

CI builds before HTTP integration tests and requires a clean tracked source
revision when embedding the model identity. Artefact publication remains gated
by CI and writes only an immutable R2 object. The weekly monitor has read-only
permissions, takes no D1 credentials, attaches the downloaded report, then checks
its alert and coverage. It does not write to main or run a model.

Production migration application, source refresh, secret provisioning, pinned
promotion and Squiggle acceptance require the deployment sequence in
[operations](operations.md). These local checks changed no production data or deployments.
