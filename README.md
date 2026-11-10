# Tipper

Tipper publishes AFLM and AFLW predictions from one Cloudflare Worker. It combines
MOV-Elo and player PAV, stores the evidence for every issued prediction, and locks
each match at its recorded UTC kickoff. Squiggle delivery covers AFLM only.

## Interfaces

| Operation                     | Result                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------- |
| `GET /tips?year=2027&round=1` | Stored Squiggle-shaped AFLM tips. Omit both parameters for the current round. |
| `GET /health`                 | Publication, input and reporting diagnostics.                                 |
| `GET /performance?year=2027`  | Latest retained weekly report and collection status.                          |
| `POST /admin/refresh`         | Bearer-authenticated publication for one competition, season and round.       |

A known round with incomplete predictions or identities returns 503. Unknown rounds
return 404. Feed requests never fetch Squiggle or generate predictions.
FootyBot and AFL-MCP continue reading the existing `match_predictions` fields.

## Development

```sh
bun install --frozen-lockfile
bun run types
bun run check
bun run typecheck
bun run test
bun run build
rumdl check --deny-config-warnings .
vale --no-global .
```

Tests use Miniflare's native local D1 and build the bundle before they start.
The build embeds the complete source revision. CI refuses to publish a dirty tree.

| Module               | Responsibility                                                      |
| -------------------- | ------------------------------------------------------------------- |
| `src/types.ts`       | Schemas for every external input and the types derived from them.   |
| `src/d1.ts`          | Decodes database rows once, at the boundary.                        |
| `src/model.ts`       | The pure predictor: rebuilds ratings and predicts eligible matches. |
| `src/publication.ts` | Snapshots, atomic captures, locks and stored-tip reads.             |
| `src/report.ts`      | Scores issued tips and retains the weekly report.                   |
| `src/squiggle.ts`    | The Squiggle client and game identities.                            |
| `src/worker.ts`      | Routes, authentication and the scheduled run.                       |

- [Model](docs/model.md) describes rating reconstruction and provisional lineups.
- [Operations](docs/operations.md) covers deployment, refresh, monitoring and recovery.
- [Domain terms](CONTEXT.md) define publication evidence.
- [Architecture decision](docs/adr/0001-production-publication.md) records the redesign.
- [Submission](docs/submission.md) contains the feed contract and draft message.
- [Production deployment](docs/rollout-2026-09-06.md) records live evidence and observation gates.
- [Research reproduction](docs/research.md) identifies the preserved revision.
- [2026 backfill](docs/backfill-2026.md) documents historical predictions and consumer queries.

Merging publishes an immutable artefact to R2. The cloudflare-infra GitOps process
applies the pinned artefact. AFL-MCP owns all shared-schema migrations.
