# Production Model

`elo-pav-normal-v1@<full source revision>` identifies issued behaviour. The corrected
standard-normal probability calculation has a new identity. There is one typed
model definition in `src/prediction.ts`. Changes arrive through reviewed branches.

| Component                    | Value                               |
| ---------------------------- | ----------------------------------- |
| Initial Elo                  | 1500                                |
| Elo K                        | 25                                  |
| Elo update home advantage    | 160                                 |
| MOV multiplier               | Existing 538 logarithmic multiplier |
| Season regression            | 0.1 toward 1500                     |
| PAV zone pool                | 100 per team                        |
| Previous-season prior weight | 15 team games                       |
| Missing-player prior         | 5 total PAV                         |
| Elo blend weight             | 0.6                                 |
| PAV calibration slope        | 6.986                               |
| Prediction home advantage    | 80 rating points                    |
| Margin multiplier            | 0.07                                |
| Probability sigma            | 36 points                           |

Rebuild Elo chronologically from completed matches beginning in 2020. Only
`Complete` matches with valid final scores update ratings. Regress at season
transitions. Initialise cumulative PAV league totals from completed matches in
2021 onward seasons before the target season, then process player statistics only
for the target season. Load only the immediately previous season's final player
PAV as the lineup prior. Match points and player inside-fifty totals use separate
aggregates, so joins cannot multiply scores.

Both teams need valid announced lineups. Non-emergency team sizes are 23 for AFLM
and 21 for AFLW. Substitutes count. Validate unique players, fixture team ownership
and observation times.

Until both teams are ready, both lineup contributions are zero. The 0.6 Elo
weighting and prediction home advantage remain. The capture is provisional.
Review these sizes against published 2027 rules before launch.

The HPN involvement formulas and fixed zone pools retain the incumbent PAV scale.
Historical league totals stay cumulative. They do not reset at the target season.
The previous-season prior blends with current PAV using team games played.

Full-precision margin selects the winner. Exact zero selects home. The home win
probability is the standard-normal integral of margin divided by 36, clamped to
0.01 through 0.99. Compatibility storage keeps the full probability and rounds
the signed
home margin to one decimal. The feed converts these issued values to integer
margins and percentages while preserving the recorded winner.

The snapshot boundary rejects oversized and duplicate inputs. Live scores,
future results and target-match statistics cannot update ratings. Earlier games
that become complete can change later unlocked predictions in the same round.
