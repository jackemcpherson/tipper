# Task 32 (A3): Squiggle Comp Re-Rank 2023–2026 — v4 Reverted to v3

**Date:** 2026-06-12
**Verdict:** **`_current` reverted to v3 (`predha-080`)**, hours after the v4 promotion.
The product goal (stated by Jack this session) is Squiggle's model comp in 2027, which is
**scored on tips**. Re-ranking both configs against the live Squiggle field on the comp
metric shows v4 trails v3 on tips in every recent season despite better LogLoss/MAE.
The v4 machinery (shot-margin Elo, team offsets) stays in the engine, bit-inert when
unset, for a tips-first re-evaluation at 2026 season end.

## Method

Squiggle API (`q=tips` / `q=games;complete=100`, years 2023–2026), scored exactly as the
comp scores: tips on completed games, draws correct for every source, sources ranked only
with full-season coverage. Tipper configs scored on the identical game sets with the same
conventions (v3 `predha-080`, v4 `v4-shotoff`, walk-forward records; team-name map
GWS Giants → Greater Western Sydney). Script: `/tmp/sq_rank_multi.py`.

**Caveat:** 2023–2025 flatter both tipper configs — parameters were tuned on those
seasons; the field tipped them ex-ante. The v3↔v4 *comparison* is clean (both equally
flattered). 2026 is genuine OOS for both.

## Results (tips = the comp metric)

| Year | Games | v3 rank (tips) | v4 rank (tips) | v4−v3 | Season winner |
|---|---|---|---|---|---|
| 2023 | 216 | 25/28 (146) | 23/28 (146) | +0 | Elo Predicts! (156) |
| 2024 | 216 | **2/25 (143)** | 13/25 (139) | **−4** | Live Ladders (156) |
| 2025 | 216 | 12/25 (156) | 13/25 (155) | −1 | Don't Blame the Data (163) |
| 2026 (R13) | 115 | **4/29 (85)** | 12/29 (81) | **−4** | Wheelo Ratings (87) |

v4−v3 tips by era: **+7** (2016–19), **+5** (2021–22), **−5** (2023–25), **−4** (2026).

## Findings

1. **v4's tip deficit is directional, not noise.** Across the four comp-relevant seasons:
   0 / −4 / −1 / −4 — never positive, −9 cumulative over 763 games. Its pooled tip gains
   live entirely in 2016–2022; the losses are concentrated in the three most recent
   seasons — the conditions 2027 will resemble. Mechanism: shot-margin updates and team
   offsets improve margins mostly on already-decided games (the cellar-dweller blowouts
   that motivated them) while perturbing signs near the 50/50 boundary. Good LogLoss
   trade, bad tips trade.
2. **v3 has comp pedigree.** 2nd of 25 in 2024, 4th of 29 in 2026 to date. v4's best
   showing anywhere is 12th–13th.
3. **The comp is high-variance at the top.** The winner rotated all four seasons;
   Elo Predicts! won 2023 and ran last in 2025 and 2026; v3 itself swung 25th → 2nd in
   consecutive seasons. Single-season rank carries ~±10 tips of luck. Expectation for
   2027: a top-quartile-skill model contends; nobody wins reliably.
4. (Context) On MAE v3/v4 would rank 2nd–3rd in most seasons — margin accuracy is not
   tipper's weakness; close-game sign accuracy is where comp placings are decided.

## Decision and process changes

- **Reverted `_current` to `predha-080`** (promotion reason records the evidence).
  CHANGELOG 3.3.1. The v4 promotion (Task 31) was correct under the bar as written; the
  bar was measuring the wrong currency for the product. Both promotions happened the same
  day; no live predictions were issued under v4.
- **Promotion bar amended** (now in HANDOFF): in addition to ΔLogLoss > 0.005 (primary) +
  pooled stratified CI excluding zero + no OOS-gate regression, a candidate must show
  **no tip regression vs the incumbent on the pooled scored windows**, with the
  last-three-seasons tip delta reported separately and a deficit there treated as
  disqualifying for comp-facing promotions.
- **A3 monitoring spec:** weekly 2026 scoring of v3 (and v4 shadow) against the Squiggle
  field on tips, plus close-game (|pred margin| < 12) sign accuracy — the band where comp
  placings are decided.
- **v4 re-evaluation** at 2026 season end, tips-first, folded into the A2 bundle.

## Artifacts

- `configs/_current.json` → `predha-080` (v3)
- Scripts `/tmp/sq_rank.py`, `/tmp/sq_rank_multi.py` (Squiggle API, read-only)
- No engine changes; v4 configs/results retained for the season-end re-evaluation
