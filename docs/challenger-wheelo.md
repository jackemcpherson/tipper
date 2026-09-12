# Wheelo-Inspired Challenger

`wheelo-inspired-v1` is a separate challenger model. It follows the parts of
Andrew Whelan's published Wheelo methodology that Tipper's data supports. It is
not a reproduction of Wheelo. The exact Wheelo model, its coefficients and its
expected-score inputs are not public. The challenger competes with production
in the benchmark tooling and never publishes tips.

## Structure

```text
expected margin
    = w_team  * ((Att_h + Def_h) - (Att_a + Def_a))
    + w_player * (lineup strength_h - lineup strength_a)
    + venue
```

The model lives under `src/research/challenger`. Each component has one module
and its own unit tests.

### Team Ratings

Every club holds an attacking rating and a defensive rating in scoreboard
points. Expected scores follow the published structure. A club scores the
competition average plus its attack minus the opponent's defence. The venue
effect splits evenly between the two expected scores.

After a match each attack moves by `k` times the difference between the
adjusted score and the expected score. The opponent's defence moves by the
same amount in the other direction. Ratings shrink toward zero at each season
boundary. The competition average score is an exponentially weighted mean, so
scoring-era drift stays out of the ratings. The 2020 season scales scores by
1.25 for its shorter quarters. `TeamRatings.snapshot()` exposes every rating.

### Scoring-Accuracy Adjustment

The adjusted score blends the actual score with the score the same shots would
produce at an expected conversion rate. The expected rate shrinks a club's
season-to-date accuracy toward the competition rate over a fixed number of
shots. Shots are goals plus behinds in every season. The database records
rushed behinds only from 2020, so the approximation applies uniformly.

The tuner selected an actual-score weight of zero. A club kicking 10.2
receives the same update as a club kicking 6.6 from the same shots.
`adjusted-score.ts` is pure, and its tests run without the ratings.

### Player Component

Each named player's estimate is a recency-weighted average of their previous
official AFL Player Rating points from `player_match_stats.rating_points`,
shrunk toward a prior. The most recent match carries the greatest weight. Each
earlier match carries `decay` times the weight of the one after it. A player
without any history receives the prior itself. The tuner selected a fixed
prior of 4 points. The model skips missing observations and never treats them
as zero.

The player term compares each lineup with the club's typical recent lineup
strength rather than raw totals. The tuner preferred this relative form. The
raw-sum form remains available as `playerMode: "sum"`.

Historical replays use the source matchday lineup. Where a stored named lineup
holds more than one team's worth of players, the players who took the field
stand in. Prospective captures use only lineups observed before the match.
Without an observed lineup the capture is provisional and has no player term.

### Venue Component

The venue effect has three explicit terms and no per-venue residual bonus.

- A constant home advantage for the designated home club. A Grand Final only
  carries it when the home club is in its home state.
- A travel term from each club's base to the venue, using the square root of
  the great-circle distance in kilometres.
- A venue-experience term from matches each club played at the ground in the
  previous five seasons, using the square root of the count.

Earlier Tipper experiments found that naive per-venue bonuses fitted on
residuals did not transfer between seasons. The challenger therefore treats
venues through travel and experience only. Single-season residuals such as
the 2026 SCG result never become permanent bonuses.

### Probability

The home win probability is the standard-normal integral of the margin divided
by `sigma`. The model clamps the probability to 0.01 through 0.99. `sigma` is
the root mean square margin error of the fit window.

## Parameter Selection

`bun run research tune` selects parameters on 2016 through 2022 after warming
the ratings from 2012. Each stage searches a small documented grid for one
component while the others hold their current values. Every candidate refits
the two margin weights and `sigma` by least squares inside the window. The
objective is mean natural log loss, and margin MAE breaks ties. Evaluation
seasons never enter the objective. The selected parameters, the stage grids
and every candidate's score live in `benchmark/challenger`.

| Stage  | Selected                                             |
| ------ | ---------------------------------------------------- |
| Team   | k 0.07, regression 0.5, actual-score weight 0        |
| Player | decay 0.99, prior weight 3, prior 4, relative lineup |
| Venue  | home advantage 4, travel 0.1, experience 0.5         |

Backtests refit the margin weights for each evaluated season on the seasons
before it. Live captures use weights fitted on every completed season at freeze
time, recorded in `prospectiveFit`.

## Results

`bun run research backtest` compares the challenger with a replay of the
production predictor and the stored Squiggle field. It uses the games every
source covers. The 2023 through 2026 window holds 862 shared games.

| Model                  | Tips |   Bits |   MAE | Log loss |
| ---------------------- | ---: | -----: | ----: | -------: |
| Challenger             |  600 | 155.04 | 26.12 |   0.5685 |
| Tipper production      |  602 | 152.44 | 26.11 |   0.5706 |
| Wheelo Ratings         |  598 | 166.21 | 25.58 |   0.5595 |
| s10                    |  608 | 165.21 | 25.73 |   0.5603 |
| Punters                |  602 | 166.96 | 25.84 |   0.5589 |
| `Don't Blame the Data` |  607 | 151.59 | 26.41 |   0.5713 |
| Aggregate              |  606 | 160.23 | 25.82 |   0.5643 |

On the fixed 2026 baseline the challenger scores 155 tips, 49.03 bits and a
25.30-point MAE. Production scores 157, 45.33 and 25.38. Wheelo scores 157,
50.95 and 24.79. The challenger's hypothetical 2026 ranks are 12th of 26 on
tips, 16th on bits and 8th on MAE.

The challenger and production agree on 761 of 862 selections. Their margin
errors correlate at 0.96. Against Wheelo the challenger agrees on 808 of 862
selections with an error correlation of 0.99. The structure lands close to
Wheelo's selections while trailing on bits. The challenger is not a
replacement for production. It offers a different set of mistakes with better
probability calibration, which is the useful property for an ensemble.

## Interpretation and Limits

- Historical lineups are source matchday lineups without observation times.
  Prospective captures record observation state explicitly.
- Squiggle's Wheelo forecasts start in 2022, so Wheelo comparisons cover 2022
  onward and the 2023 through 2026 evaluation window.
- The production replay reproduces the stored 2026 predictions within 0.1
  points on 211 of 214 games and matches the season totals. Earlier seasons
  have no stored production predictions, so the replay stands in for them.
- No production behaviour changes. The challenger reads the shared database
  through the public AFL-MCP endpoint and writes only under `benchmark`.

## References

- [Wheelo AFL methodology](https://www.wheeloratings.com/afl_methodology.html)
- [Wheelo Ratings](https://www.wheeloratings.com/)
- [Demonland statistics discussion](https://demonland.com/forums/topic/66998-stats-file-2026-season/)
- [Benchmark and prospective capture](benchmark.md)
