# Changelog

User-visible production changes.

## 4.0.0 - 2026-10-04

Use explicit competition-season keys. AFLW 2022 requests require `2022-S6` or
`2022-S7`. The prior comes from the immediately previous competition season,
including season six before season seven. Ordinary years remain valid.

Reject active public repair markers and input revisions that change before
publication. Preserve issued captures and their recorded kickoff locks.
AFL-MCP expansion migrations must deploy before this reader. Apply the separate
season-key contract only after compatible readers deploy.

## Production Redesign

Replace the research CLI with one production Worker predictor, atomic captures,
per-match locks, stored-tip delivery and retained weekly scoring. Correct the
standard-normal probability calculation with a new model identity. Preserve
AFLM and AFLW predictions and existing direct database consumers.

This change requires the additive AFL-MCP schema and ingestion changes before
Worker activation. See [operations](docs/operations.md) for deployment and recovery.
Earlier release history remains at the [research revision](docs/research.md).
