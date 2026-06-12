# Task 21: Per-Zone Blend Slopes (and Global Slope Refit)

**Date:** 2026-06-12
**Verdict:** Rejected — no improvement even with in-sample-fitted slopes. Global slope confirmed still calibrated (6.984 vs 6.986).

## Hypothesis

`blend.pav_calibration_slope` collapses offence/midfield/defence PAV into one number before blending. If one zone is more predictive of margin, a per-zone weighting should recover diluted signal.

## Design

New optional config field `blend.pav_zone_slopes {off, mid, def}` replacing the global slope when present (equal slopes = global slope exactly; identity verified). `sumTeamPav` now returns per-zone sums, and match-level results include `homePavZones`/`awayPavZones` — which also closes the long-standing match-level diagnostics gap noted in the v2 validation.

Slopes fitted by joint through-origin OLS of actual margin on per-zone PAV diffs, 2021–2024 only (846 matches; same window precedent as the 6.986 fit, 2025 held out, 2026 untouched):

| Zone | Margin slope | Rating slope (÷0.07) |
|---|---|---|
| Offence | 0.2308 | 3.297 |
| Midfield | 0.7661 | **10.945** |
| Defence | 0.3336 | 4.765 |

Constrained (single-slope) refit on the same window: **6.984** vs the promoted 6.986 — the v3 backlog item "periodic slope re-calibration" is confirmed unnecessary.

## Results (2021–2025, fitted zone slopes, vs baseline 0.8612)

| weight_elo | Tips | LogLoss | Δ |
|---|---|---|---|
| 0.4 | 66.3% | 0.8627 | +0.0015 |
| 0.5 | 66.2% | 0.8614 | +0.0002 |
| 0.6 | 66.0% | 0.8612 | 0.0000 |
| 0.7 | 66.4% | 0.8623 | +0.0011 |

## Conclusion

Midfield PAV is ~3× more predictive than offence in isolation, but the zone diffs are correlated enough that re-weighting them changes the blended prediction immaterially — best case exactly ties the baseline *despite the slopes being fitted in-sample on 4 of the 5 scored seasons*. Out-of-sample it could only be worse. Rejected.

Combination with Task 20's prediction HA was not tested: zone slopes showed zero effect with and without the systematic home bias present, so no interaction is plausible. The engine support remains (inert when unset), and the per-zone match output is kept for diagnostics.
