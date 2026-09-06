# 2026 Prediction Backfill

The completed 2026 backfill contains 213 AFLM and 31 AFLW predictions in
`match_predictions`. FootyBot, AFL-MCP, and other consumers read these alongside
real-time predictions through the same table.

## Method

Each match uses team Elo and player PAV rebuilt from eligible earlier matches.
Elo starts in 2020 and regresses between seasons. PAV develops through 2026,
blending current performance with the fixed final 2025 player prior.
The replay uses source matchday lineups and excludes target and later results.
It conservatively excludes same-day results because completion times are unknown.
Historical source corrections are acceptable for this backfill.

The production predictor revision is
`da587769fdd23c7f084fa4e436b628a3e91eecfc`. Stored probabilities, one-decimal
margins, and model versions match its replay outputs. `generated_at` records the
actual backfill time. Backfilled rows have a null `tipper_run_id`.
Existing predictions always take precedence, and ordinary live publication
continues using its existing kickoff locks.

## Consumer Queries

Use AFL-MCP's `tipping_performance` recipe for a competition and season.
It joins `match_predictions` to completed matches and reports coverage,
correct winners, draws, accuracy excluding draws, and margin MAE.
The probability determines the tipped team when a margin rounds to zero.

At backfill verification, AFLM had 153 correct winners from 210 decisive games,
plus three draws, with a 25.4-point margin MAE across all 213 games.
AFLW had 24 correct winners from 31 games and a 19.9-point margin MAE.

## Cleanup and Reproduction

AFL-MCP migration `0023` consolidates the backfill and removes the temporary
reconstruction tables and triggers. The cleanup removes their obsolete
production tests and schema definitions. Applied migrations remain in migration
history.
Consumers need no reconstruction-specific queries or tables.

The [research revision][research] retains the one-time replay code.
Frozen inputs, outputs, and verification records remain in the local
`.scratch/reconstruction-2026/` archive, excluded from Git.
No permanent backfill command or second prediction implementation is part of
production. Verification compared all 244 ordinary prediction rows against the replay.
Existing genuine captures remained unchanged.

[research]: https://github.com/jackemcpherson/tipper/tree/research/2026-kickoff-reconstruction-2026-09-06/research/2026
