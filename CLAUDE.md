# Tipper repository guidance

Apply the project-standards skill for TypeScript, Markdown and workflow changes.
Run `bun run check`, `bun run typecheck` and `bun run test` before finishing.

Read `docs/model.md` before changing prediction behavior, `docs/operations.md`
before changing publication or deployment, and `CONTEXT.md` for domain terms.
`docs/adr/0001-production-publication.md` records the permanent-lock decision.

## Ownership

`src/model.ts` is the pure predictor and owns rebuilding ratings.
`src/publication.ts` owns native D1 reads, atomic captures, locks and the
stored-tip read path. Each publication invariant is one SQL fragment there.
`src/report.ts` scores stored tips and retains the weekly report.
`src/squiggle.ts` owns the Squiggle client and game identities.
`src/worker.ts` is routes, authentication and the scheduled run only.

`src/types.ts` holds the schema for every external input. `src/d1.ts` decodes
database rows once. Code past those boundaries trusts its types and adds no
fallbacks or re-validation.

AFL-MCP owns shared migrations. Tipper's SQL files are integration-test fixtures.
Generated `src/env.d.ts` defines bindings. Regenerate it with `bun run types`
when Wrangler configuration changes. Build embeds the full source revision, and
CI publishes only a clean tracked revision through GitOps.

When public endpoints, schema, model scope or cadence change, update the homepage
repository's `public/docs/afl-data-ecosystem.md` in the same work.

## Minimal-Worker Exception

Tipper applies the style guide's Minimal-Worker Exception. It uses Web Standard
routing, prepared SQL and Wrangler. It omits Effect `Layer` composition, Alchemy,
Drizzle and Hono. It validates all external inputs with `effect/Schema`.

The owner accepted these departures from the exception's conditions in
November 2026:

- Four routes, where the exception allows three.
- About 30 prepared statements, where the exception expects few.

These parts of the full stack conflict with recorded ownership and stay out:

- Drizzle, because AFL-MCP owns the schema and its migrations.
- Alchemy and a `deploy` script, because cloudflare-infra owns bindings, cron
  and promotion.

Stored and public names keep their existing form: snake_case row fields, the
`home` and `away` values, and Boolean fields such as `ok`, `stale` and `alert`.
Renaming them would change stored rows and HTTP bodies.

`UnknownRound` is the one failure a caller handles, and it is a tagged error.
Every other failure is a broken invariant. It throws, the round fails closed and
the next scheduled run retries.

Move to the full stack when any of these becomes true:

- Tipper gains a fifth route.
- A second person maintains it.
- Tipper owns a table or a migration.
- It calls a second outside service, or needs retries or background work that
  outlive one scheduled run.
