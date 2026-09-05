# Changelog

User-visible production changes.

## Production Redesign

Replace the research CLI with one production Worker predictor, atomic captures,
per-match locks, stored-tip delivery and retained weekly scoring. Correct the
standard-normal probability calculation with a new model identity. Preserve
AFLM and AFLW predictions and existing direct database consumers.

This change requires the additive AFL-MCP schema and ingestion changes before
Worker activation. See [operations](docs/operations.md) for deployment and recovery.
Earlier release history remains at the [research revision](docs/research.md).
