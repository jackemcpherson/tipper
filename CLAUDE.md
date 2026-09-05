# Tipper repository guidance

Apply the project-standards skill for TypeScript, Markdown and workflow changes.
Use the configured Bun, Biome, TypeScript and Vitest commands in `package.json`.

Read `docs/model.md` before changing prediction behavior, `docs/operations.md`
before changing publication or deployment, and `CONTEXT.md` for domain terms.
`docs/adr/0001-production-publication.md` records the permanent-lock decision.

The pure predictor owns rebuilding ratings. Publication owns native D1 reads,
atomic captures and locks. Competition evidence serves and scores stored tips.
Use prepared SQL under this repository's minimal-Worker exception. AFL-MCP owns
shared migrations; Tipper's SQL files are integration-test fixtures only.

Worker source uses Web Standard APIs. Generated `src/env.d.ts` defines bindings.
Regenerate it when Wrangler configuration changes. Build embeds the full source
revision, and CI publishes only a clean tracked revision through GitOps.

When public endpoints, schema, model scope or cadence change, update the homepage
repository's `public/docs/afl-data-ecosystem.md` in the same work.
