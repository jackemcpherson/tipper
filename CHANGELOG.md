# Changelog

User-visible production changes.

## Benchmark Tooling and Wheelo-Inspired Challenger

Add research tooling that scores Tipper against a fixed 2026 Squiggle baseline,
captures challenger predictions before each 2027 match and reports round and
season results. Add the separate `wheelo-inspired-v1` challenger with
attacking and defensive team ratings, accuracy-adjusted scores, named-lineup
Player Ratings and an explicit venue effect. Production predictions do not
change.

## Production Redesign

Replace the research CLI with one production Worker predictor, atomic captures,
per-match locks, stored-tip delivery and retained weekly scoring. Correct the
standard-normal probability calculation with a new model identity. Preserve
AFLM and AFLW predictions and existing direct database consumers.

This change requires the additive AFL-MCP schema and ingestion changes before
Worker activation. See [operations](docs/operations.md) for deployment and recovery.
Earlier release history remains at the [research revision](docs/research.md).
