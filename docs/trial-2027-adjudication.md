# Frozen 2027 Trial Adjudication

Frozen on 2026-09-05, before the first 2027 prediction. The competition scores
winner tips. Neither log loss nor a historical replay can promote a model.

The incumbent is `predha-080`. The sole challenger is plain OD, `t40-od`.
Its hash matches `od-w100-k008`. Promotion remains a separate human decision
through `tipper config promote` and config baking.

## Decision Bar

PROMOTE requires a complete prospective 2027 home-and-away season and at least
30 more correct non-draw tips for the challenger. It also requires either the
primary rule or the fallback rule below. Every other result is PARK.

The primary rule requires a positive paired tip delta whose paired 95%
bootstrap interval has a lower bound strictly above zero.

The fallback rule requires a positive paired tip delta. Tip deltas must be
non-negative in both the incumbent close band and the consensus-wrong cut.
No team's absolute signed residual bias may worsen by more than 2 points where
that team has at least 10 paired games. Both cuts must contain at least one
non-draw game. Missing field data cannot count as a passing empty cut.

A season of about 207 games detects roughly a 30-tip difference at 80% power.
That Task 40 planning estimate is approximate. The 30-tip promotion floor is
conservative and fixed. A smaller positive result is PARK, even if its
bootstrap interval excludes zero. Log loss cannot rescue it.

## Population and Pairing

Use AFLM regular-season fixtures, including Opening Round. Exclude finals
from adjudication. `--include-finals` reports a diagnostic that cannot return
PROMOTE. Read all scheduled fixtures, including unplayed games. Completion
requires at least 200 scheduled regular-season games, final scores for every
one, and an eligible capture from both frozen models for every one.

Do not decide before 2027-09-01. This date prevents a partly populated early
fixture list from looking like a completed season. A missing prediction stays
missing. Never substitute a replacement backtest, nearest-time match, or model.
Pair exact match ids and frozen model-version hashes only.

The recent-seasons label always means 2024, 2025, and 2026. Those seasons are
historical diagnostics already exposed during model selection. They never
enter the 2027 promotion population or replace missing prospective games.

## At-Lock Inputs

Project each UTC `captured_at` onto Melbourne wall time with the IANA zone.
An eligible capture must be strictly earlier than both its archived round's
first kickoff and its archived match kickoff. Select the latest eligible
capture per match and model. Duplicate capture keys fail closed.

The Worker freezes the whole round at its first kickoff. Saturday and Sunday
team changes after that deadline are unavailable to both models. A missing
kickoff time means midnight, matching the publisher's conservative rule.
The archive contains the named lineups each prediction read, with emergency
and substitute flags. Later lineup changes cannot replace those inputs.

Each game's field JSON retains all available sources from the round fetch.
Use the incumbent capture's field so both models face the same information
cut.

Its fetch instant must also precede both deadlines and must not follow
the prediction capture. Count distinct sources with a valid team tip and a
finite confidence. Conflicting tips from one source fail closed. With at
least 8 sources, a game is consensus-wrong when at least 65% tipped the losing
team. Compute that cut after joining final scores, never from a source's
post-game `correct` flag. Missing or insufficient field coverage is unknown.

Forecast weather stays in `match_weather`. Join by `match_id`, select
`kind = 'forecast'`, retain source provenance, and take the latest `fetched_at`
strictly before the same lock. Observed weather never supplies input evidence.
The archive does not duplicate weather data.

The weather table keeps one row per match and kind. If a later refresh has
replaced its pre-lock forecast, mark that weather input unavailable. Do not
claim a historical forecast snapshot that the table no longer retains.

## Scoring Definitions

Tip delta is challenger correct signs minus incumbent correct signs. Use
full-precision archived engine margins. Zero predicts home. Exclude drawn
games from winner tips, the close band, consensus-wrong, and bootstrap draws.
For competition totals, credit a draw to both models. Report draws separately.

The close band is the common paired subset with incumbent absolute margin
strictly below 12 points. Both models use the same denominator for accuracy. Never
select each model's own close band.

Resample non-draw pairs with replacement, seed 42, for 1,000 draws. Each draw
has the original non-draw sample size. Sort summed tip deltas and take
zero-based entries 25 and 975 as the 95% interval. Sort pairs by match id
before sampling. Read interval bounds directly, without an epsilon.

Team residuals are actual home margin minus predicted home margin for the
home team, negated for the away team. Include drawn games in residual bias.
Average by team. Worsening is challenger absolute mean bias minus incumbent
absolute mean bias, measured in points.

Report log loss in bits under both the unchanged legacy probability head and
`standard_normal`, using each archived full-precision margin and sigma.
Clamp probabilities to 0.01 through 0.99. For Task 40 compatibility, these
log-loss diagnostics use target zero for a draw. That convention affects
neither competition totals nor the promotion decision.

## Reproduction and Change Control

Run the adjudication with:

```sh
bun src/cli/index.ts trial --season 2027 --out /tmp/trial-2027.json
```

The command reads D1 and writes only its optional local output. It never
changes a model pointer. A missing archive migration is an error, not a
successful empty trial.

The golden fixture reconstructs 422 captures from Task 40's stored 2026
results and retained Squiggle response. Its timestamps and empty lineup lists
are synthetic. It cannot prove what anyone knew at lock. Its explicit
`reconstructed` provenance prevents promotion, even if relabelled as 2027.
It reproduces the full campaign window with `--include-finals`.

```sh
bun analysis/task41-reconstruct.ts /tmp/tipper-task40-squiggle-2026.json \
  /tmp/tipper-trial-2026.json
bun src/cli/index.ts trial --season 2026 \
  --archive /tmp/tipper-trial-2026.json --include-finals
```

The bar and definitions cannot change after publication of 2027 round 1.
Document any later defect, its impact, and a separate future trial.
It cannot relax this trial's bar. The test compares the following
machine-readable constants with the scorer, so either changing alone fails.

```json
{
  "season": 2027,
  "primary": "predha-080 (2641f46f)",
  "challenger": "t40-od (c8c7b6b7)",
  "seed": 42,
  "bootstrapDraws": 1000,
  "confidence": 0.95,
  "closeMarginExclusive": 12,
  "minimumSources": 8,
  "wrongShareInclusive": 0.65,
  "maximumBiasWorsening": 2,
  "minimumTeamGames": 10,
  "minimumPromotionTipDelta": 30,
  "minimumSeasonGames": 200,
  "recentSeasons": [
    2024,
    2025,
    2026
  ],
  "earliestDecision": "2027-09-01"
}
```
