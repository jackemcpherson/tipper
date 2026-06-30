# Weather Univariate Spike — Verdict

**Date:** 2026-06-30
**Plan:** 002b
**Script:** `analysis/weather-univariate.py`

## WEATHER SPIKE VERDICT: NO-GO

Weather joins the documented-negatives list alongside travel, rest, round-phase (Tasks 33–35).

---

## Coverage

D1 `weather_type` and `weather_temp_c` are **100% non-null** for every AFLM season
2016–2025 (2052 matches). Coverage gate (≥ 60%) passed without issue.

Distinct `weather_type` values in 2016–2025:

| value | n |
|---|---|
| MOSTLY_SUNNY | 975 |
| RAIN | 673 |
| SUNNY | 195 |
| OVERCAST | 120 |
| CLEAR_NIGHT | 45 |
| WINDY | 28 |
| THUNDERSTORMS | 16 |

---

## Bucket definitions (frozen pre-registration)

- **wet** = {RAIN, THUNDERSTORMS}
- **dry** = {MOSTLY_SUNNY, SUNNY, CLEAR_NIGHT}
- **other** = {OVERCAST, WINDY} — excluded from wet/dry comparisons
- **extreme_temp** = top/bottom 5% of `weather_temp_c` within each season year (secondary)

---

## Per-window results

### Primary window 2021–2025 (predha-080, 1062 matches)

Sanity cross-check: computed tip% 716/1062, logLoss 0.8485 — match results-file exactly.

| bucket | n | tip% | mean residual | close-band n | close-band tip% |
|---|---|---|---|---|---|
| wet | 387 | 68.7% | −0.58 pts | 201 | 57.7% |
| dry | 611 | 68.4% | +0.84 pts | 304 | 55.3% |
| other | 64 | 60.9% | −4.82 pts | 28 | 53.6% |

Bootstrap CI on wet−dry mean residual (2000 iters, seed=42):
**Δresid = −1.42 pts, CI₉₅ [−5.53, +2.64] — includes zero.**

Close-band wet−dry tip% diff: **2.4 pp** (threshold: 3 pp, not met).

### Confirmatory window 2016–2019 (predha80-early, 828 matches)

Sanity cross-check: computed tip% 554/828, logLoss 0.8555 — match results-file exactly.

| bucket | n | tip% | mean residual | close-band n | close-band tip% |
|---|---|---|---|---|---|
| wet | 254 | 70.8% | +0.89 pts | 127 | 58.3% |
| dry | 498 | 65.6% | −0.43 pts | 242 | 54.1% |
| other | 76 | 66.2% | +7.13 pts | 41 | 61.0% |

Bootstrap CI on wet−dry mean residual:
**Δresid = +1.32 pts, CI₉₅ [−4.03, +6.61] — includes zero.**

---

## Pre-registered bar evaluation

**Criterion (a) — residual CI excludes zero:**
Primary CI includes zero (−5.53, +2.64). Additionally, the sign of the
wet−dry residual *flips* between windows: primary shows wet teams
underperforming predictions (−1.42 pts) while the early window shows them
overperforming (+1.32 pts). The direction does not replicate.
Criterion (a): **NOT MET**.

**Criterion (b) — close-band tip% diff ≥ 3 pp with n ≥ 50 each:**
Primary close-band diff is 2.4 pp (wet 57.7% vs dry 55.3%), below the 3 pp
threshold. Note: the direction does replicate in the early window (wet 58.3%
vs dry 54.1%, diff 4.2 pp), but criterion (b) requires the primary window to
meet threshold first.
Criterion (b): **NOT MET** (primary diff below threshold).

---

## Reasoning

The data shows no stable weather signal. The residual difference reverses
direction between windows and both CIs comfortably include zero. The
close-band diff (2.4 pp in primary) is below threshold and would require
one additional tip per ~40 wet close-band games to cross it — consistent
with noise. The early-window close-band numbers (4.2 pp) look marginally
interesting in isolation but: (a) they don't unlock the primary criterion,
and (b) a within-noise result is NO-GO per the pre-registered rule.

Weather likely affects total score and variance (scoring-rate compression
under rain is real in AFL) more than it affects margin *sign*, which is all
that matters for the tips-scored Squiggle competition. Elo/PAV already
captures team-level adaptability; a global wet/dry bias correction has no
coherent direction to correct toward.

**Weather is exhausted as a candidate feature at this level of D1 coverage.**
No engine work warranted.

---

## Secondary cut: extreme temperature (top/bottom 5% per year)

| window | extreme n | extreme tip% | normal n | normal tip% |
|---|---|---|---|---|
| primary 2021-25 | 158 | 61.5% | 904 | 69.2% |
| early 2016-19 | 118 | 69.8% | 710 | 66.8% |

Extreme-temp tip% is *lower* in primary but *higher* in early — same
direction-reversal pattern as wet/dry. Not a signal.

---

## What this closes

- Weather (both `weather_type` bucket and `weather_temp_c` extremes) added
  to documented-negatives list.
- No follow-up engine plan is warranted.
- The do-not-redo list for the research ledger should record:
  **weather_type / weather_temp_c: univariate test, 2016–19 + 2021–25,
  NO-GO (residual CI includes zero, close-band diff < 3pp, direction
  reverses across windows).**
