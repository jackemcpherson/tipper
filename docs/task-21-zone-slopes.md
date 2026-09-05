# Task 21: per-Zone Blend Slopes (And Global Slope Refit)

**Date:** 2026-06-12 **Verdict:** Rejected: no improvement even with
in-sample-fitted slopes. Global slope confirmed still calibrated (6.984 vs
6.986).

## Hypothesis

`blend.pav_calibration_slope` collapses offence/midfield/defence PAV into one
number before blending. If one zone is more predictive of margin, a per-zone
weighting should recover diluted signal.

## Design

New optional config field `blend.pav_zone_slopes {off, mid, def}` replacing the
global slope when present (equal slopes = global slope exactly. Identity
verified). `sumTeamPav` now returns per-zone sums, and match-level results
include `homePavZones`/`awayPavZones`: which also closes the long-standing
match-level diagnostics gap noted in the v2 validation.

Slopes fitted by joint through-origin OLS of actual margin on per-zone PAV
diffs, 2021-2024 only (846 matches. Same window precedent as the 6.986 fit, 2025
held out, 2026 untouched):

| Zone     | Margin slope | Rating slope (÷0.07) |
| -------- | ------------ | -------------------- |
| Offence  | 0.2308       | 3.297                |
| Midfield | 0.7661       | **10.945**           |
| Defence  | 0.3336       | 4.765                |

Constrained (single-slope) refit on the same window: **6.984** vs the promoted
6.986. This result confirms that the v3 backlog item "periodic slope
re-calibration" is unnecessary.

## Results (2021-2025, Fitted Zone Slopes, Versus Baseline 0.8612)

| weight_elo | Tips  | LogLoss | Δ       |
| ---------- | ----- | ------- | ------- |
| 0.4        | 66.3% | 0.8627  | +0.0015 |
| 0.5        | 66.2% | 0.8614  | +0.0002 |
| 0.6        | 66.0% | 0.8612  | 0.0000  |
| 0.7        | 66.4% | 0.8623  | +0.0011 |

## Conclusion

Midfield PAV is ~3× more predictive than offence in isolation, but the zone
differences correlate enough that re-weighting them changes the blended
prediction immaterially. The best case exactly ties the baseline, although the
analysis fits the slopes in-sample on four of the five scored seasons.
Out-of-sample it could only be worse. Rejected.

The analysis did not combine zone slopes with Task 20's prediction HA. Zone
slopes had no effect with or without systematic home bias, so no interaction is
plausible. The engine support remains (inert when unset), and the per-zone match
output is kept for diagnostics.
