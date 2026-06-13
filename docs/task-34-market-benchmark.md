# Task 34 (D4-i): Market Benchmark — v3 vs the Closing Market, 2016–2026

**Date:** 2026-06-13
**Product decision (Jack, this session):** benchmark only — tipper stays
market-independent. The D4-ii ensemble is off the table; this task measures the
distance, establishes the weekly monitoring hook, and closes D4.
**Headline:** the closing market beats v3 by **+10 tips on 2016–19** but only **+2 on
2021–25 and +0 on 2026** — and v3 *beat the market by 6 tips in 2024*. The market's real
edge is probability calibration (LogLoss −0.015 to −0.035), which the comp doesn't
score. **The closing market would have won none of the last four Squiggle comps.**
Market-grade information is worth ~1–2 tips/season at today's v3 — well inside the
comp's ±10-tip luck band (T32).

## Data and conventions (fixed before running)

- **Market**: vig-removed closing H2H from the aussportsbetting.com historical file
  (Data sheet → `/tmp/afl_odds.json`; 2016–2026, zero missing odds; re-download:
  `https://www.aussportsbetting.com/historical_data/afl.xlsx`). pH = (1/h)/(1/h+1/a).
- **Punters cross-check**: Squiggle tips source 5 (`q=tips;source=5`), 2017+.
- **v3**: official records (909461e1 early / 2641f46f primary / e8e0cede 2026).
- Scoring per engine `metrics.ts` (LogLoss bits, clamp, draws→away; draws excluded from
  tip%); windows early 2016–19 / primary 2021–25 / 2026 R1–13; paired on matched games
  (2,004 of 2,005 — one 2026 game postdates the odds file).
- Script: `analysis/market-benchmark-2016-2026.py`. Aggregates + T33 triangulation only;
  no residual mining (T33 negative).

## Results

| Window | n | v3 tips | Market tips | Δ | v3 LL | Mkt LL |
|---|---|---|---|---|---|---|
| Early 2016–19 | 828 | 554 (67.2%) | 564 (68.4%) | **+10** | 0.8555 | 0.8361 |
| Primary 2021–25 | 1062 | 716 (68.1%) | 718 (68.3%) | **+2** | 0.8485 | 0.8340 |
| 2026 R1–13 | 114 | 84 (74.3%) | 84 (74.3%) | **+0** | 0.7887 | 0.7534 |

Per-season Δ (market − v3): +2 +1 +3 +4 | +3 −1 +2 **−6** +4 | +0. The market's tip
edge has shrunk from ~+2.5/season (2016–19) to ~0/season (2023–26). 2024 — the chaos
season where v3 ranked 2nd in the comp — v3 out-tipped the closing market by 6.

- **Close band** (|v3 pred| < 12): market +9 (early), +3 (primary), +0 (2026).
- **Distance**: mean |Δp| 0.058–0.067, corr 0.92–0.94; |Δp| > 0.15 in ~5% of games.
- **Sign disagreements** (~10% of games): early era market wins 47–37; primary 54–52;
  2026 6–6. Recent seasons: a coin flip.
- **Punters ≈ closing odds**: mean |Δp| 0.011 over 1,797 overlap games (3 outliers
  > 0.2, early-line/team-news artifacts); tips within 1. The A3 weekly pull already
  includes Punters, so the market column costs nothing to monitor.

## Comp framing (tips, comp conventions — draws correct for all)

| Season | Market | v3 | Comp winner (T32) |
|---|---|---|---|
| 2023 | 148 | 146 | 156 |
| 2024 | 137 | 143 | 156 |
| 2025 | 160 | 156 | 163 |
| 2026 R13 | 86* | 85 | 87 |

*one game unmatched. The comp's annual winner beat the closing market all four seasons,
by 3–19 tips. The top of the comp is not "whoever is closest to the market" — it's
top-quartile skill plus the year's luck draw, exactly the T32 expectation.

## T33 triangulation

- **The 24 tipper-specific misses: market right on 17 (71%)** — confirms T33: the
  information v3 lacked on those games was market-known (and field-known), not exotic.
- **The 23 mirror games (v3 right, ≥65% of field wrong): market wrong on 17 (74%)** —
  v3's against-the-field edge is also an against-the-market edge. It is genuine
  independent signal, and the strongest argument for staying market-independent: in an
  ensemble, exactly these calls would be dragged back toward the consensus.

## Conclusions

1. **The benchmark validates the product decision.** D4-ii's expected value at today's
   v3 is ~+1–2 tips/season — sub-luck for comp placings — and it would dilute the
   mirror-game edge that earned v3 its 2024 2nd place.
2. **The market's superiority is calibration, not signs.** LogLoss −0.015 to −0.035 is
   real and stable, but the comp scores tips. (If a bits-scored comp ever matters,
   revisit.)
3. **T33's ceiling argument is now quantified**: even the strongest public-information
   aggregate available adds ~nothing to v3's recent sign accuracy. Comp strategy for
   2027 = keep v3-class skill, accept variance — consistent with T32's "a
   top-quartile-skill model contends; nobody wins reliably".
4. **A3 monitoring gains a market column**: weekly, score v3 vs Punters (source 5) on
   tips + close-band alongside the field re-rank. Drift of the market gap beyond
   ~±3 tips season-to-date is the alert worth investigating.

## Artifacts

- `analysis/market-benchmark-2016-2026.py` (+ odds→JSON conversion documented above)
- No engine or config changes; no promotion; D4 closed (benchmark-only)
