# Task 34 (D4-I): Market Benchmark: V3 Versus the Closing Market, 2016-2026

**Date:** 2026-06-13 **Product decision (Jack, this session):** benchmark only.
Tipper stays market-independent, and the D4-ii ensemble is off the table. This
task measures the distance, establishes weekly monitoring, and closes D4.

**Headline:** The closing market beats v3 by **+10 tips on 2016-19** but only
**+2 on 2021-25 and +0 on 2026**. V3 _beat the market by 6 tips in 2024_. The
market's real edge is probability calibration (LogLoss −0.015 to −0.035), which
the comp does not score. **The closing market would have won none of the last
four Squiggle comps.** Market-grade information is worth ~1-2 tips/season at
today's v3: well inside the comp's ±10-tip luck band (T32).

## Data and Conventions (Fixed Before Running)

- Market: vig-removed closing H2H from the
  [Australia Sports Betting AFL workbook](https://www.aussportsbetting.com/historical_data/afl.xlsx).
  The conversion uses the Data sheet and covers 2016-2026 with no missing odds.
  PH = (1/h)/(1/h+1/a).
- Punters cross-check: Squiggle tips source 5 (`q=tips;source=5`), 2017+.
- v3: official records (909461e1 early / 2641f46f primary / e8e0cede 2026).
- Scoring per engine `metrics.ts` (LogLoss bits, clamp, draws to away. Draws
  excluded from tip%). Windows early 2016-19 / primary 2021-25 / 2026 R1-13.
  Paired on matched games (2,004 of 2,005: one 2026 game postdates the odds
  file).
- Script: `analysis/market-benchmark-2016-2026.py`. Aggregates + T33
  triangulation only. No residual mining (T33 negative).

## Results

| Window          | n    | v3 tips     | Market tips | Δ       | v3 LL  | Mkt LL |
| --------------- | ---- | ----------- | ----------- | ------- | ------ | ------ |
| Early 2016-19   | 828  | 554 (67.2%) | 564 (68.4%) | **+10** | 0.8555 | 0.8361 |
| Primary 2021-25 | 1062 | 716 (68.1%) | 718 (68.3%) | **+2**  | 0.8485 | 0.8340 |
| 2026 R1-13      | 114  | 84 (74.3%)  | 84 (74.3%)  | **+0**  | 0.7887 | 0.7534 |

The per-season market-minus-v3 differences were +2, +1, +3, and +4 for 2016-19.
They were +3, −1, +2, **−6**, and +4 for 2021-25, then zero in 2026. The
market's tip edge shrank from about 2.5 per season to zero in recent seasons. In
2024, v3 out-tipped the closing market by six and ranked second in the
competition.

- Close band (|v3 pred| < 12): market +9 (early), +3 (primary), +0 (2026).
- Distance: mean |Δp| 0.058-0.067, corr 0.92-0.94. |Δp| > 0.15 in ~5% of games.
- Sign disagreements (~10% of games): early era market wins 47-37. Primary
  54-52. 2026 6-6. Recent seasons: a coin flip.
- Punters ≈ closing odds: mean |Δp| 0.011 over 1,797 overlap games (3 outliers
  > 0.2, early-line/team-news artefacts). Tips within 1. The A3 weekly pull
  > already includes Punters, so the market column costs nothing to monitor.

## Comp Framing (Tips, Comp Conventions: Draws Correct for All)

| Season   | Market | v3  | Comp winner (T32) |
| -------- | ------ | --- | ----------------- |
| 2023     | 148    | 146 | 156               |
| 2024     | 137    | 143 | 156               |
| 2025     | 160    | 156 | 163               |
| 2026 R13 | 86*    | 85  | 87                |

*one game unmatched. The comp's annual winner beat the closing market all four
seasons by 3-19 tips. The competition leader is not simply closest to the
market. Winning combines top-quartile skill with that year's luck, matching the
T32 expectation.

## T33 Triangulation

- The 24 tipper-specific misses: market right on 17 (71%): confirms T33: the
  information v3 lacked on those games was market-known (and field-known), not
  exotic.
- The 23 mirror games (v3 right, ≥65% of field wrong): the market was wrong on
  17 (74%). V3's against-the-field edge is also an against-the-market edge. It
  is genuine independent signal, and the strongest argument for staying
  market-independent: in an ensemble, exactly these calls would be dragged back
  toward the consensus.

## Conclusions

1. The benchmark validates the product decision. D4-ii's expected value at
   today's v3 is ~+1-2 tips/season: sub-luck for comp placings: and it would
   dilute the mirror-game edge that earned v3 its 2024 2nd place.
2. The market's superiority is calibration, not signs. LogLoss −0.015 to −0.035
   is real and stable, but the comp scores tips. (If a bits-scored comp ever
   matters, revisit.).
3. T33's ceiling argument is now quantified: even the strongest
   public-information aggregate available adds ~nothing to v3's recent sign
   accuracy. Comp strategy for 2027 = keep v3-class skill, accept variance:
   consistent with T32's "a top-quartile-skill model contends. Nobody wins
   reliably".
4. A3 monitoring gains a market column: weekly, score v3 vs Punters (source 5)
   on tips + close-band alongside the field re-rank. Drift of the market gap
   beyond ~±3 tips season-to-date is the alert worth investigating.

## Artefacts

- `analysis/market-benchmark-2016-2026.py` (+ odds to JSON conversion documented
  above).
- No engine or config changes. No promotion. D4 closed (benchmark-only).

## References

- [Australia Sports Betting data catalogue](https://www.aussportsbetting.com/data/)
- [Squiggle API documentation](https://api.squiggle.com.au/)
