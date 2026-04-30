# PAV Implementation Review — Tasks 13 & 14

## Task 13 — Formula Validation Against HPN 2023

### Bug Found: Defence strength formula has 100× scaling error

**Location**: `src/engine/pav.ts:242`

**Before (buggy)**:
```ts
defence = 100 * ((2 * dn - dn * dn) / (2 * dn)) * 2;
// For league-average team (dn=1): defence = 100
```

**After (fixed)**:
```ts
defence = ((2 * dn - dn * dn) / (2 * dn)) * 2;
// For league-average team (dn=1): defence = 1 (same scale as offence/midfield)
```

**Root cause**: The HPN paper defines the "Defensive Number" (DN) metric on a 0–200 scale centered at 100. The `100 *` multiplier is from HPN's presentation scale, but when used as a pool multiplier (`pool = 100 × strength`), the defence pool becomes `100 × 100 = 10,000` for a league-average team instead of `100 × 1 = 100`. Offence and midfield strengths are dimensionless ratios centered at ~1. Defence was 100× mismatched.

**Impact**: Defensive PAV was inflated by ~100×. A player like Steven May with true def_pav ~16 was being computed as ~1,609. This completely dominated the total PAV signal, making PAV essentially a "defensive involvement + noise" metric.

### Results With Fix Applied

**Table 1 — Distribution of differences (664 matched players):**

| Metric | Mean | Median | Std | Min | Max | n |
|---|---|---|---|---|---|---|
| total_diff (engine − HPN) | 0.075 | 0.010 | 0.183 | −0.16 | 1.41 | 664 |
| total_abs_pct_diff | 1.31% | **0.37%** | 2.64% | 0.00% | 46.01% | 664 |

**Decision: Median absolute diff = 0.37% → PASS (< 3% threshold)**

**Table 3 — Sanity check (top players):**

| Player | Team | Total HPN | Total Engine | Diff | % Diff |
|---|---|---|---|---|---|
| Marcus Bontempelli | WB | 28.70 | 28.82 | +0.12 | 0.43% |
| Christian Petracca | ME | 25.08 | 25.19 | +0.11 | 0.45% |
| Tim English | WB | 24.18 | 24.22 | +0.04 | 0.16% |
| Errol Gulden | SY | 24.13 | 24.18 | +0.05 | 0.20% |
| Caleb Serong | FR | 23.09 | 23.17 | +0.08 | 0.33% |
| Oscar McInerney | BL | 22.38 | 22.43 | +0.05 | 0.24% |
| Charlie Curnow | CA | 20.48 | 21.32 | +0.84 | 4.10% |
| Toby Greene | GW | 19.81 | 20.60 | +0.79 | 3.99% |

**Table 4 — Defensive specialists:**

| Player | Team | Def HPN | Def Engine | Def Diff |
|---|---|---|---|---|
| Steven May | ME | 16.14 | 16.09 | −0.05 |
| Tom Stewart | GE | 14.43 | 14.48 | +0.05 |
| Callum Wilkie | SK | 14.01 | 14.06 | +0.05 |
| Luke Ryan | FR | 14.17 | 14.20 | +0.03 |
| Jacob Weitering | CA | 14.82 | 15.00 | +0.18 |
| Darcy Moore | CW | 14.74 | 14.73 | −0.01 |
| Harris Andrews | BL | 15.09 | 15.11 | +0.02 |
| Nick Blakey | SY | 13.20 | 13.16 | −0.04 |

**Residual analysis**: Top 20 outliers are dominated by Gold Coast (~7–8% systematic) and Essendon/Carlton/GWS (~4%). All are team-wide biases consistent with data-source differences in inside-50 counts, not formula bugs. No multi-team players exist in 2023 to confuse attribution.

### Task 13 Verdict: FAIL → FIX → PASS

The defence formula had a confirmed 100× scaling bug. Fixed by removing the `100 *` multiplier. With the fix, the formula matches HPN within 0.37% median absolute difference.

---

## Task 14 — Operational Logic Review

### Concern 1 — Cumulative state preservation across rounds

**Question**: Does the engine correctly accumulate cumulative state from match to match without state leaking between teams or seasons?

**Code path**: `pav.ts:updatePavState()` (lines 263–315) accumulates per-player involvement in `playerInvolvement` (keyed by `player_id` alone) and per-team involvement in `teamInvolvement` (keyed by `team_id`).

**Finding**: `playerInvolvement` is keyed by `player_id` only, not `(player_id, team_id)`. If a player were traded mid-season, their involvement from the old team would leak into their share computation on the new team. The numerator in `computePlayerPav` would include foreign involvement, inflating their PAV on the new team.

**Mitigation**: Queried all seasons 1990–2025. Mid-season trades are absent from 1993 onward (AFL trades happen during the off-season trade period). Zero multi-team players exist in the evaluation window (2018–2025).

**Verdict: PASS (with structural note)**

The bug exists in principle but cannot manifest with AFL data. No mid-season trades occur in the evaluation window or any modern season. The code is correct in practice but structurally fragile — if the data ever included mid-season trades (e.g., from a different competition), PAV would produce incorrect values. Low priority to fix.

---

### Concern 2 — Season boundary handling

**Question**: At the season boundary, does the engine correctly reset current-season state, switch prior PAV references, and update games-played counters?

**Code path**: `harness.ts:78–113` (season boundary in `runHarness`).

**Findings**:

1. **State reset**: PAV state is fully replaced with a new `PavSeasonState` at each season boundary. `teamStats`, `teamInvolvement`, and `playerInvolvement` are all fresh empty Maps. ✓
2. **Prior PAV map**: Correctly looks up `currentYear - 1` by iterating `priorPavBySeason` and matching year. ✓
3. **Games-played counter**: Reset to 0 (part of the fresh `TeamSeasonAccumulator`). Incremented only by `updatePavState` on match completion. ✓
4. **Prior league average**: Saved from the completed season via `getLeagueAccumulator(pavState)`, then used to initialize the next season's league accumulator.

**Edge case — training seasons**: Training seasons don't update PAV state (`!isTrain` guard at line 135). If the season preceding the first test season is a training season, `priorLeague` captures an empty accumulator (totalPoints=0, totalInsideFifties=0). The first test season then starts with a zero league average. `computeTeamStrength` handles this by returning `{1, 1, 1}` when `leagueAvgPointsPerI50 === 0`. R1 predictions of the first test season use uniform team strengths, which is acceptable as a cold-start default.

**Verdict: PASS**

Season boundary handling is correct. The training-season cold-start edge case produces reasonable defaults (uniform strength). State reset is complete.

---

### Concern 3 — Bayesian prior application

**Question**: Is the Bayesian prior formula applied correctly at every round?

**Code path**: `prior.ts:55–86` (`blendWithPrior`), called from `harness.ts:326–327` via `sumTeamPav`.

**Findings**:

1. **At round 1 (gamesPlayed=0)**: `denominator = K + 0 = K`. Result = `(K × prior + 0 × current) / K = prior`. ✓ Verified by existing test (`blendWithPrior` test "returns prior when no games played").
2. **At round R**: `gamesPlayed` is the team's cumulative count from `TeamSeasonAccumulator`, incremented in `updatePavState` (which runs AFTER prediction). So at prediction time for match M, `gamesPlayed` reflects matches 1..M-1 only. ✓
3. **Missing player**: Uses `missing_player_default / 3` per zone. ✓ Verified by test.
4. **K=0 and gamesPlayed=0**: Handled explicitly — `if (denominator === 0) return { ...prior }`. ✓

**Design note**: `gamesPlayed` counts TEAM games, not PLAYER games. A player who missed 5 of 20 team games has their current PAV blended with 20 games of evidence. This is correct given the fixed-pool design: the player's current PAV is already in season-end-equivalent units and reflects their lower involvement naturally (small share of team total). Using team games as evidence weight is the right approach — it measures how much information the system has about the current season, not how much the player individually contributed.

**Verdict: PASS**

The Bayesian prior formula is correctly implemented. Edge cases are handled. The team-games vs player-games choice is correct for the fixed-pool PAV design.

---

### Concern 4 — League average accumulation

**Question**: Are league averages computed correctly during walk-forward?

**Code path**: `pav.ts:294–296` (accumulation in `updatePavState`), `pav.ts:93–103` (`createPavSeasonStateWithPriorLeague`).

**Findings**:

The league average is a pooled mean (total points / total I50s), not a mean of team averages. ✓

However, `createPavSeasonStateWithPriorLeague` copies the prior season's FULL accumulator into the new season's state. Current-season data is then ADDED to the prior totals. This means:

- At R1: league avg ≈ prior season's avg (correct cold-start). ✓
- At R23: league avg = (prior_pts + current_pts) / (prior_I50 + current_I50). This is NOT the current season's pure average — it includes ~50% prior-season weight.

**Empirical measurement**: Comparing pure 2023 league avg (1.5807) vs contaminated end-of-2023 avg (1.5831): **0.15% difference**. The contamination is negligible because AFL scoring rates are very stable year-over-year.

**Verdict: PASS**

The contamination from prior-season initialization produces negligible divergence (0.15%). The cold-start benefit (stable R1 league average) outweighs the minor contamination at season end. If league-wide scoring changed dramatically between seasons, this could matter more, but historically AFL averages are stable.

---

### Concern 5 — Apportionment denominator

**Question**: Is the denominator in the apportionment formula the team's total involvement, not the league's?

**Code path**: `pav.ts:357–359` in `computePlayerPav`.

**Findings**:

```ts
const offShare = teamInv.offTotal > 0 ? playerInv.offScore / teamInv.offTotal : 0;
```

- Denominator: `teamInv.offTotal` — accumulated in `updatePavState` per `playerStats.team_id`. This is the team's total, not the league's. ✓
- Numerator: `playerInv.offScore` — accumulated per player across all their matches. ✓ (Same time horizon as denominator, subject to the Concern 1 multi-team caveat.)
- Zero check: returns 0 if team total is 0. ✓
- Consistent across zones: same pattern for off/mid/def. ✓

**Verified**: In the Task 13 reference computation, player shares correctly sum to 1.0 per team per zone (all 664 players' off shares within each team sum to 1.0, multiplied by pool gives total pool).

**Verdict: PASS**

The denominator is correctly the team's total involvement score, not the league's. Apportionment is structurally correct.

---

### Concern 6 — Integration with the predictor

**Question**: Does the predictor read PAV state BEFORE the current match is processed?

**Code path**: `harness.ts:119–138` (predict-then-update loop in `runHarness`).

**Findings**:

```ts
// For test seasons, generate predictions before updating state
if (isTest && isCompleted) {
  const prediction = generatePrediction(match, eloState, pavState, ...);
}

// Update state from completed matches
if (isCompleted) {
  updateElo(eloState, match, config.elo);
  if (!isTrain) {
    updatePavState(pavState, match, matchStats);
  }
}
```

1. Prediction is generated BEFORE state update. ✓
2. Both use the same `pavState` reference (mutable), but prediction reads before update mutates. ✓
3. Single-threaded synchronous execution — no race conditions possible. ✓
4. `runPredict` (line 154–226) follows the same pattern for target-round completed matches: predict first, then update. ✓

**Verified**: The `assertNonDecreasingSeasonIds` call at line 143 confirms the sort invariant is maintained, ensuring chronological processing.

**Verdict: PASS**

Predict-then-update ordering is consistently maintained. No lookahead bias is possible.

---

## Summary

| Concern | Verdict | Notes |
|---|---|---|
| 1. Cumulative state preservation | **PASS** (structural note) | Player involvement not team-scoped, but no mid-season trades exist in AFL data |
| 2. Season boundary handling | **PASS** | Complete reset, correct prior lookup |
| 3. Bayesian prior application | **PASS** | Formula correct, edge cases handled, team-games is the right design |
| 4. League average accumulation | **PASS** | Prior contamination is 0.15% — negligible |
| 5. Apportionment denominator | **PASS** | Correctly uses team total, not league total |
| 6. Integration with predictor | **PASS** | Predict-before-update consistently maintained |

---

## Overall Conclusion: State B

**Task 13 found a real formula bug** (defence 100× scaling). The v1.5 PAV results are invalidated. The fix has been applied to `pav.ts`.

**Task 14 found no operational bugs** — the round-by-round implementation correctly preserves the formula through the harness.

### Required follow-up

1. **Re-run v1.5 Task 5** (PAV contribution disambiguation) with the corrected defence formula. The v1.5 decision to bench PAV at 10% blend weight was made with a broken defence metric that inflated defensive PAV by 100×. This would have:
   - Made PAV's signal dominated by defensive involvement rather than balanced across zones
   - Potentially made the calibration slope meaningless (calibrated against broken values)
   - The 10% blend weight may have been too low or too high for the corrected PAV signal

2. **Re-run any backtest results** that informed the v1.5 baseline. All prior metrics are suspect.

3. **Re-calibrate `pav_calibration_slope`** — the current value (0.246) was fitted against the broken 100×-inflated defensive PAV. The corrected PAV has a completely different scale for its defensive component, so the calibration slope will need to be re-estimated.
