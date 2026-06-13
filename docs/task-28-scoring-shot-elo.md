# Task 28 (C1): Scoring-Shot (Luck-Adjusted) Elo Updates — Real, Sub-Bar, Parked

**Date:** 2026-06-12
**Baseline:** `predha-080` (v3) — primary 0.8485 (n=1062) + early window 0.8555 (n=828)
**Verdict:** Not promoted — but this is the strongest unshipped candidate since v3.
Pure shot-margin updates (w=1.0) improve LogLoss in **both** windows with a monotone
dose-response (pooled −0.0047), narrowly missing significance (CI upper bound +0.0009)
and the primary-window bar. Parked for the A2 end-of-2026 re-test. The engine machinery
ships (verified bit-inert when the config field is absent, Task 23 precedent). **The 2026
gate was not touched.**

## Mechanism

New optional `elo.shot_margin_weight` (w): the Elo update margin becomes
`(1−w)×actual + w×(shotDiff × 3.64)`, where shots = goals + behinds and 3.64 is the
league-average points per scoring shot (measured from D1: 3.60–3.67 in every season
2015–2025; constant is justified). The blended margin drives result sign and MOV
magnitude alike — a team that out-shoots but loses can gain rating, which is the point:
conversion on the day is substantially luck, and the update should track deserved
performance. Score-line integrity verified in D1 (goals×6+behinds = points on all 2,258
matches 2015–2025; note team behinds include rushed behinds, a known approximation —
rushed-behind counts only exist 2020+, see C6).

Implementation: `computeUpdateMargin` in `src/engine/elo.ts`; schema field `.optional()`
(never `.default()`); 7 new unit tests. **Bit-identity verified**: re-running `predha-080`
with the new code reproduces every prediction and metric exactly (hash 2641f46f).

## Results (real walk-forward backtests, both windows)

| Config | primary LL | Δ | early LL | Δ |
|---|---|---|---|---|
| baseline (w=0) | 0.8485 | — | 0.8555 | — |
| w=0.25 | 0.8484 | −0.0001 | | |
| w=0.50 | 0.8478 | −0.0007 | | |
| w=0.75 | 0.8467 | −0.0018 | 0.8496 | −0.0059 |
| **w=1.00** | **0.8451** | **−0.0034** | **0.8491** | **−0.0064** |

MAE also improves at w=1.0 (26.31→26.22 primary, 28.79→28.74 early); tips +0.4pp primary.
Improvement is monotone in w in the primary window and confirmed at both tested points in
the early window — a dose-response, not a lucky cell.

### Significance (Task 25 procedure, seed 42 / 1000 iter)

| w=1.0 vs baseline | dLL | 95% CI |
|---|---|---|
| primary 2021–25 | −0.0034 | [−0.0106, +0.0043] |
| early 2016–19 | −0.0064 | [−0.0156, +0.0023] |
| **pooled (n=1890)** | **−0.0047** | **[−0.0102, +0.0009]** |

Pooled Brier also negative (−0.0014, CI [−0.0032, +0.0003]). Everything points the same
way; the CI upper bound misses zero by 0.0009.

### K re-tune at w=1.0 (post-change interaction check)

A de-noised update signal might support faster adaptation. K=30 → 0.8450 (flat),
K=35 → 0.8457 (worse). K stays 25; no hidden power there.

## Why parked rather than promoted or rejected

- **Against promotion:** primary-window Δ (−0.0034) is below the 0.005 bar, and the
  pooled CI includes zero. The bar exists precisely so that one more plausible-looking
  −0.003 doesn't ship on vibes. w=1.0 is also a boundary optimum (v1.5 RTM lesson),
  though the early window replicating at both tested weights mitigates this.
- **Against rejection:** unlike every rejected candidate since v2, this one has (a) the
  right sign in two independent eras, (b) monotone dose-response, (c) strong theory and
  AFL-analytics literature precedent, (d) corroborating Brier/MAE/tips.
- **Decision:** park. Add to the A2 end-of-2026 bundle. ~210 further matches only narrows
  the CI ~5%, so if it re-tests at a similar point estimate the call will be a judgment
  one — flagged for Jack: does the promotion bar evolve to "pooled Δ > 0.005 + pooled CI"
  now that the two-window procedure exists? That choice should be made *before* seeing
  the 2026-inclusive numbers, not after.

## Artifacts

- `src/config/schema.ts` — `elo.shot_margin_weight` (optional)
- `src/engine/elo.ts` — `computeUpdateMargin`, `LEAGUE_POINTS_PER_SHOT`
- `tests/engine/elo.test.ts` — 7 new tests (120 green)
- Configs + results: `shotelo-w{025,050,075,100}`, `shotelo-w{075,100}-early`,
  `shotelo-w100-k{30,35}`
- 2026 gate untouched; no promotion; `_current` remains `predha-080`
