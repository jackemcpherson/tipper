# Benchmark and Prospective Capture

The benchmark tooling answers two questions for every model change. Does the
candidate beat current Tipper? How would it have placed in the 2026 Squiggle
field? It also captures challenger predictions before each 2027 match and
reports round and season results. Production behaviour does not change.

## Commands

Run every command with `bun run research <command>`. The tooling reads the
shared database through the public AFL-MCP endpoint and caches seasons under
`.cache/research`. Completed seasons never fetch again. The current season
fetches again after six hours or on `--refresh`.

| Command    | Purpose                                                         |
| ---------- | --------------------------------------------------------------- |
| `fetch`    | Cache seasons, reference data and stored production predictions |
| `field`    | Store the Squiggle field and results for one season             |
| `tune`     | Select and freeze challenger parameters                         |
| `backtest` | Walk-forward challenger evaluation against production and field |
| `baseline` | The fixed Squiggle baseline with candidate ranks                |
| `capture`  | Append prospective challenger captures for upcoming matches     |
| `report`   | Round and season-to-date prospective report plus the baseline   |

## Fixed 2026 Baseline

`benchmark/squiggle/2026.json.gz` stores every Squiggle forecast and result
for 2026 as fetched. The file records its own observation time. The baseline
scores every model on the completed games that carry a stored Tipper
prediction and a Squiggle game. That set held 214 games at the time of
writing.

Squiggle's own per-tip results score the field. The same rules score Tipper
and candidates from stored or replayed forecasts. A test confirms that the two
scorers agree on more than 6,000 stored tips.

Tipper's 2026 entry is predominantly a historical replay. Tipper backfilled
213 of the 214 scored predictions after the fact. The baseline output states
this caveat every time. The 2026 figures support model development and
comparison. They are not equivalent to a prospective Squiggle submission.

```text
2026 Squiggle baseline (214 completed games)

                                  Tips    Bits     MAE  Coverage
Tipper production                  157   45.33   25.38  full
Challenger (wheelo-inspired-v1)    155   49.03   25.30  full
Wheelo Ratings                     157   50.95   24.79  full
s10                                158   53.96   25.03  full
Punters                            158   52.42   25.24  full
Don't Blame the Data               154   55.01   25.55  full
Aggregate                          157   51.38   25.07  full

Challenger (wheelo-inspired-v1) vs Tipper production
  Tips: -2
  Bits: +3.70
  MAE: -0.07
```

The table lists the major benchmarks first. `--full` adds the rest of the
stored field. Hypothetical ranks count only sources that cover every game in
the set with both a tip and a margin. Sources with partial coverage show their
coverage instead of an unqualified rank.

`--games` adds the game-level comparison. It lists games the candidate got
right that production missed and the reverse. It lists games each major
benchmark got right that both missed. It reports agreement with Wheelo,
consensus versus contrarian selections and margin-error correlation.

## Scoring Rules

Tips, Bits and MAE follow Squiggle's competition rules. A correct winner earns
one tip and every tipster earns the tip when a match is drawn. Bits reward the
confidence in the tipped team: `1 + log2(p)` when right, `1 + log2(1 - p)`
when wrong and `1 + 0.5 * log2(p * (1 - p))` for a draw. Margin error is the
absolute difference between the forecast and actual home margins. A draw
scores the forecast margin against zero.

Internal diagnostics report decisive-game accuracy, RMSE, Brier score, natural
log loss, calibration by confidence band, missing predictions and lead time.

## 2027 Prospective Capture

The shared database already captures production predictions before kickoff.
Each capture records its run, source revision, observation time, lineup
evidence and lock. The report reads those captures for the official entry. A
production prediction counts only when the Worker published its capture before
the recorded kickoff.

Challenger captures live under `benchmark/prospective/<season>/<model>.jsonl`.
The `capture` command appends one line per new prediction. Each line records
the match, model identity and version, parameter digest, source revision and
generation time. It records the lineup observation time, provisional or
lineup-ready state, selected winner, full-precision and issued margins, home
win probability and the input snapshot.

The command only appends lines. The issued prediction for scoring is the last
capture generated before its own recorded kickoff. Later captures or backfills
cannot replace it. Git history is the audit trail.

The `prospective` workflow runs the capture hourly on `main` and commits new
lines. Off-season runs find no upcoming matches and change nothing. The
production Worker and the challenger keep distinct identities. Nobody tunes a
development candidate against live 2027 results and then presents it as
frozen. The frozen parameter file records the selection time and the source
revision.

## Reports

`report --season 2027` prints round and season-to-date performance for
production, the challengers and the major benchmarks. It ranks full-coverage
entries and lists missing or late predictions, provisional captures and median
lead time. It lists the disagreements between production and each challenger.
The same report then shows the frozen candidates against the fixed 2026
baseline. Every report therefore carries a live view and a historical view.
The weekly workflow run stores the report as an artefact and in the job
summary.

## Reproducing

```sh
bun run research fetch
bun run research field --year 2026
bun run research tune
bun run research backtest --json benchmark/challenger/backtest-2023-2026.json
bun run research baseline --year 2026 --games
```

`fetch` needs network access to the AFL-MCP endpoint. Every other command
works from the cache and the stored field. Fetching a season's field again
replaces its snapshot and observation time. Refresh 2026 only for a deliberate
baseline update.
