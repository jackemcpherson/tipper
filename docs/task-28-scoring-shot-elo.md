# Task 28 (C1): Scoring-Shot (Luck-Adjusted) Elo Updates: Real, Sub-Bar, Parked

**Date:** 2026-06-12 **Baseline:** `predha-080` (v3): primary 0.8485 (n=1062) +
early window 0.8555 (n=828) **Verdict:** Parked as the strongest unshipped
candidate since v3. Pure shot-margin updates improve LogLoss in **both** windows
at w=1.0. The monotonic dose-response pools to −0.0047 and narrowly misses
significance (CI upper bound +0.0009) and the primary-window bar. Parked for the
A2 end-of-2026 re-test. The engine machinery ships (verified bit-inert when the
config field is absent, Task 23 precedent). **The 2026 gate was not touched.**

## Mechanism

The optional `elo.shot_margin_weight` changes the Elo update margin to
`(1−w)×actual + w×(shotDiff × 3.64)`. Shots equal goals plus behinds. The 3.64
constant is the league-average points per scoring shot. D1 reports 3.60-3.67 in
every season from 2015 to 2025, which supports the constant. The blended margin
drives both result sign and MOV magnitude. A team that generates more shots but
loses can gain rating.

This behaviour reflects the substantial luck in daily conversion, and the update
should track deserved performance. D1 verifies score-line integrity across all
2,258 matches from 2015 to 2025. Goals×6 plus behinds equals points. Team
behinds include rushed behinds as a known approximation. Counts only exist
2020+, see C6).

Implementation: `computeUpdateMargin` in `src/engine/elo.ts`. Schema field
`.optional()` (never `.default()`). 7 new unit tests. **Bit-identity verified**:
re-running `predha-080` with the new code reproduces every prediction and metric
exactly (hash 2641f46f).

## Results (Real Walk-Forward Backtests, Both Windows)

| Config         | primary LL | Δ             | early LL   | Δ             |
| -------------- | ---------- | ------------- | ---------- | ------------- |
| baseline (w=0) | 0.8485     | Not available | 0.8555     | Not available |
| w=0.25         | 0.8484     | −0.0001       |            |               |
| w=0.50         | 0.8478     | −0.0007       |            |               |
| w=0.75         | 0.8467     | −0.0018       | 0.8496     | −0.0059       |
| **w=1.00**     | **0.8451** | **−0.0034**   | **0.8491** | **−0.0064**   |

MAE also improves at w=1.0 (26.31 to 26.22 primary, 28.79 to 28.74 early). Tips
+0.4pp primary. Improvement is monotone in w in the primary window and confirmed
at both tested points in the early window: a dose-response, not a lucky cell.

### Significance (Task 25 Procedure, Seed 42 / 1000 Iter)

| w=1.0 vs baseline   | dLL         | 95% CI                 |
| ------------------- | ----------- | ---------------------- |
| primary 2021-25     | −0.0034     | [−0.0106, +0.0043]     |
| early 2016-19       | −0.0064     | [−0.0156, +0.0023]     |
| **pooled (n=1890)** | **−0.0047** | **[−0.0102, +0.0009]** |

Pooled Brier also negative (−0.0014, CI [−0.0032, +0.0003]). Everything points
the same way. The CI upper bound misses zero by 0.0009.

### K Re-Tune at W=1.0 (Post-Change Interaction Check)

A denoised update signal might support faster adaptation. K=30 to 0.8450 (flat),
K=35 to 0.8457 (worse). K stays 25. No hidden power there.

## Why Parked Rather Than Promoted or Rejected

- Against promotion: primary-window Δ (−0.0034) is below the 0.005 bar, and the
  pooled CI includes zero. The bar exists precisely so that one more
  plausible-looking −0.003 does not ship on vibes. W=1.0 is also a boundary
  optimum (v1.5 RTM lesson), though the early window replicating at both tested
  weights mitigates this.
- Against rejection: unlike every rejected candidate since v2, this one has (a)
  the right sign in two independent eras, (b) monotone dose-response, (c) strong
  theory and AFL-analytics literature precedent, (d) corroborating
  Brier/MAE/tips.
- Decision: park. Add to the A2 end-of-2026 bundle. ~210 further matches only
  narrows the CI ~5%, so if it re-tests at a similar point estimate the call
  will be a judgement one: flagged for Jack: does the promotion bar evolve to
  "pooled Δ > 0.005 + pooled CI" now that the two-window procedure exists? That
  choice should be made _before_ seeing the 2026-inclusive numbers, not after.

## Artefacts

- `src/config/schema.ts`: `elo.shot_margin_weight` (optional).
- `src/engine/elo.ts`: `computeUpdateMargin`, `LEAGUE_POINTS_PER_SHOT`.
- `tests/engine/elo.test.ts`: 7 new tests (120 green).
- Configs + results: `shotelo-w{025,050,075,100}`, `shotelo-w{075,100}-early`,
  `shotelo-w100-k{30,35}`.
- 2026 gate untouched. No promotion. `_current` remains `predha-080`.
