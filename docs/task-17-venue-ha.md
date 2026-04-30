# Task 17 — Ground-Specific Home Advantage

**Date:** 2026-04-30
**Baseline:** `pavfix-blend-w06` (K=25, HA=160, RTM=0.10, w=0.6, slope=6.986)
**Decision:** Not shipped. Static HA=160 outperforms all venue-specific variants.

---

## Part A — Venue HA derivation (2015-2020)

Regression: `actual_margin = intercept + slope × (home_elo - away_elo)`
per venue, controlling for team strength via Elo differential.
Derivation window: 2015-2020 (1,196 matches). Min matches per venue: 30.

| Venue | HA (pts) | HA (Elo) | n | R-squared |
|-------|---------|---------|---|-----------|
| Kardinia Park (Geelong) | 26.1 | 372 | 44 | 0.039 |
| Sydney Showground (GWS) | 13.4 | 191 | 52 | 0.103 |
| Subiaco | 13.0 | 186 | 71 | 0.410 |
| Adelaide Oval | 12.1 | 173 | 135 | 0.220 |
| Perth Stadium | 9.2 | 132 | 65 | 0.039 |
| SCG | 8.6 | 123 | 60 | 0.184 |
| Carrara (Gold Coast) | 5.0 | 71 | 93 | 0.180 |
| MCG | 2.9 | 42 | 259 | 0.149 |
| Gabba | 1.9 | 27 | 93 | 0.289 |
| Marvel Stadium | -1.2 | -17 | 237 | 0.168 |

Kardinia Park (372 Elo) is extreme — 2.3x the global default. Marvel
Stadium is negative (shared venue, no real home team). Low R-squared at
the extremes confirms these estimates are noisy.

## Part B — Backtest results

| Config | Shrinkage | Tip% | LogLoss | Brier | MAE | Delta vs static |
|--------|----------|------|---------|-------|-----|----------------|
| **Static HA=160** | **N/A** | **66.1%** | **0.8607** | **0.2060** | **26.75** | **0.0000** |
| Shrinkage 0.7 | 0.7 | 65.6% | 0.8623 | 0.2064 | 26.80 | +0.0016 |
| Shrinkage 0.5 | 0.5 | 65.8% | 0.8634 | 0.2067 | 26.85 | +0.0027 |
| Shrinkage 0.3 | 0.3 | 65.5% | 0.8646 | 0.2071 | 26.89 | +0.0039 |
| Raw venue HA | 0.0 | 65.4% | 0.8666 | 0.2076 | 26.96 | +0.0059 |

**Static wins at every shrinkage level.** More shrinkage helps but cannot
bridge the gap to static. The monotonic improvement toward static confirms
that the venue-specific estimates add noise, not signal.

## Analysis

Three factors explain the failure:

1. **Small samples at extreme venues.** Kardinia Park (44 matches) and
   Perth Stadium (65 matches) have the most extreme HA values but the
   smallest samples and lowest R-squared. These estimates are noisy and
   don't generalize.

2. **Era shift.** The derivation window (2015-2020) includes pre-COVID and
   COVID-affected seasons with different crowd sizes, travel patterns, and
   venue allocations. The 2021-2025 test window has different conditions.

3. **The global constant already captures most of the signal.** HA=160
   (11.2 scoreboard points) is a reasonable average. The variance across
   venues exists but is small relative to the estimation noise at
   individual venues.

## Decision

**Static HA=160 retained.** Venue-specific HA is architecturally sound
(the implementation works correctly) but the derivation is not reliable
enough with the available data.

To make venue HA work in the future:
- Use a longer derivation window (10+ years, 3000+ matches)
- Weight more recent seasons higher
- Use a hierarchical model that explicitly shares strength across venues
- Consider travel distance as a covariate rather than pure venue identity
