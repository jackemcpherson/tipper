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
bun run typecheck
bun run check
bun run build
bun run test
rumdl check --deny-config-warnings .
vale --no-global .
```

Tests use Miniflare's native local D1. Build before running HTTP integration tests.
The build embeds the complete source revision. CI refuses to publish a dirty tree.

- [Model](docs/model.md) describes rating reconstruction and provisional lineups.
- [Operations](docs/operations.md) covers deployment, refresh, monitoring and recovery.
- [Domain terms](CONTEXT.md) define publication evidence.
- [Architecture decision](docs/adr/0001-production-publication.md) records the redesign.
- [Verification](docs/verification.md) records checks and local workload measurements.
- [Research reproduction](docs/research.md) identifies the preserved revision.

Merging publishes an immutable artefact to R2. The cloudflare-infra GitOps process
applies the pinned artefact. AFL-MCP owns all shared-schema migrations.
