# Task 31 (B2): Walk-Forward Team Offsets to V4 Promotion (`v4-shotoff`)

**Date:** 2026-06-12

**Baseline:** `predha-080` (v3): primary 0.8485 and early 0.8555

**Verdict:** **V4 promoted.** Team offsets alone are real but below the bar.
They have the same shape as Task 28's scoring-shot Elo. The two mechanisms are
nearly additive, and the combination clears every Task 25 promotion criterion.
The promotion is the first since v3 and the first under the new procedure. This
decision consumed the 2026 gate and came back flat.

## 1. The Offset Mechanism (B1's Routing, Implemented)

Per-team running estimate of "plays above/below its blended rating", in margin
points:

- `offset(team) = sum / (n + k)`: shrunk mean of attributed residuals (zero-mean
  prior worth k games of evidence).
- After each completed match: home-oriented residual
  `r = actual − adjusted prediction` splits **half to each side**
  (`sum_home += r/2`, `sum_away −= r/2`, `n += 0.5` each). Learning against the
  _adjusted_ prediction makes the estimator self-correcting.
- Season boundary: `sum` and `n` decay by `season_carry`.
- Symmetric mechanism: no team identity anywhere. The data finds WCE/North on
  its own.

Offline-exact evaluation first (offsets depend only on persisted
predictions+actuals):

| K      | carry   | primary dLL | early dLL   | pooled dLL  |
| ------ | ------- | ----------- | ----------- | ----------- |
| 16     | 0.5     | −0.0035     | −0.0030     | −0.0033     |
| **32** | **0.5** | **−0.0036** | **−0.0033** | **−0.0035** |
| 32     | 1.0     | −0.0043     | −0.0013     | −0.0030     |
| 64     | 0.5     | −0.0029     | −0.0026     | −0.0028     |

A reliable plateau spans K 16-64 and improves both windows. It is not a spike.
The cross-era consistency is unusual. Alone, its pooled CI [−0.0073, +0.0001]
falls below the bar. It captures about 25% of Task 24's −0.012 oracle ceiling.
Offsets only partially absorb WCE, moving from −16.7 to −12.9.

## 2. The Combination with Scoring-Shot Elo (Task 28)

The two parked candidates attack independent error sources (update-signal noise
vs prediction-tail bias) and prove nearly additive:

| Candidate                  | primary     | early       | pooled      |
| -------------------------- | ----------- | ----------- | ----------- |
| shot-Elo w=1.0 alone (T28) | −0.0034     | −0.0064     | −0.0047     |
| offsets K=32/c=0.5 alone   | −0.0036     | −0.0033     | −0.0035     |
| **combined**               | **−0.0075** | **−0.0100** | **−0.0087** |

Reliable to offset hyperparameters (K=16/c=0.5 and K=32/c=0 give the same pooled
−0.0087).

## 3. Engine Implementation

- `src/engine/offset.ts`: offset state (4 unit tests).
- `output.team_offset: {k, season_carry}` (`.optional()`, never `.default()`).
- `harness.ts`: offsets decay at season boundaries. Applied to predicted margins
  via a `marginAdjust` term. Offsets learn from predictions for
  **all completed non-train-season matches**, including unrecorded predictions.
  This keeps `backtest`, `backtest -s`, and live `predict` consistent. The live
  path generates virtual predictions for completed matches to keep offset state
  warm, applying the T19 lesson.
- Bit-inertness verified: `predha-080` re-run reproduces all predictions
  exactly.
- Offline↔engine equivalence verified: real backtests reproduce the offline
  combo numbers exactly (primary 0.8409, early 0.8454).

## 4. Promotion Evidence (`v4-shotoff`, Real Walk-Forward Runs)

| Criterion                                                    | Result                                                                      |
| ------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Primary Δ > 0.005 (2021-25)                                  | **−0.0075** (0.8485 to 0.8409) ✓                                            |
| Significance (Task 25 headline: pooled stratified bootstrap) | **CI [−0.0144, −0.0026] excludes zero** ✓ (Brier CI [−0.0040, −0.0004] too) |
| No 2026 regression (gate burned 2026-06-12)                  | dLL **+0.0003**, CI [−0.0200, +0.0198]: flat ✓                              |

Under the _old_ single-window rule the primary-only CI is [−0.0153, +0.0007]:
short by 0.0007. The promotion leans on the pooled test, which is exactly what
the Task 25 procedure introduced the confirmatory window for. Jack approved this
basis explicitly before the process consumed the gate.

In 2026, tips drop from 73.7% to 70.2%, while the dTip CI includes zero. All
eight flipped tips have absolute margins below seven. Six move against and two
move for the model. LogLoss/Brier/MAE-class metrics are flat. Gate context: the
2026 evaluation used the warm-chain run (`-s 2021,…,2026`) so offsets entered
2026 properly warmed. The cold `-s 2026` run gives the same answer (0.7924).

MAE improves 26.31 to 25.97 (primary) and 28.79 to 28.45 (early).

## 5. What V4 Means for Open Items

- WCE/North residual: partially absorbed (−16.7 to ~−12.9 by offsets. Shot-Elo
  helps further). Re-run the Task 24 per-team diagnostic on v4 records next
  session: the remaining residual is the new target.
- 2026 no longer provides an untouched gate. 2026 monitoring continues but is no
  longer untouched OOS for this candidate family. The next gate is the remainder
  of 2026 (R14 onward).
- A2 end-of-2026 bundle now re-tests against v4 baselines (bucketed HA, sigma,
  flat HA re-sweep, finals HA: all offline-exact from v4 results files).
- The promotion bar formally becomes: primary Δ > 0.005 + pooled stratified CI
  excluding zero + no regression on the current OOS gate.

## Artefacts

- `src/engine/offset.ts`, `harness.ts` integration, `schema.ts` field.
- `tests/engine/offset.test.ts`.
- Configs + results: `v4-shotoff` (full-window 7af312c5 = promotion-valid.
  56ff8e2b / b01d56de = 2026 override runs), `v4-shotoff-early`.
- `_current.json` to `v4-shotoff`. CHANGELOG 3.3.0.
- Scripts `/tmp/b2_team_offsets.ts`, `/tmp/b2_combo.ts`, `/tmp/v4_verify.ts`,
  `/tmp/v4_gate.ts`.
