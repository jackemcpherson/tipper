# Task 38: Wheelo Closure Roadmap — Closing the Gap Where It Counts

**Date:** 2026-06-16
**Trigger:** Adversarial review against Wheelo Ratings (Liam, Squiggle source=26). See `analysis/wheelo-headhead-2026-06-16.md` for the full evidence.
**Goal:** identify and ship structural changes that move tipper toward Wheelo's per-team and per-venue accuracy **without eroding v3's against-the-field contrarian edge** (the +14 over 256 consensus-wrong games that nets out the comp gap).
**Status:** roadmap — three candidate tasks proposed (38a/38b/38c), each with its own pre-registration. None ship until backtested against the amended T32 bar.

## 0. State of play (the headline that wasn't)

Over **971 paired matches 2022–26**, Wheelo is **−2 tips vs v3 pooled** (CI [−0.022, +0.019]). Statistically tied. ΔLogLoss = −0.014 bits in Wheelo's favour, CI [−0.030, +0.003] — directional only. Sign agreement 88.8%.

**The "Wheelo consistently beats us" narrative was small-window noise.** Per-season:

| Season | n | v3 tips | Wheelo tips | Δ |
|---|---:|---:|---:|---:|
| 2022 | 206 | 146 | 146 | +0 |
| 2023 | 214 | 144 | 143 | −1 |
| 2024 | 213 | 140 | 140 | +0 |
| 2025 | 215 | 155 | 152 | **−3 (v3 ahead)** |
| 2026 R1–14 | 116 | 85 | 87 | +2 |
| **Pool** | **971** | **670** | **668** | **−2** |

But the decomposition split into two opposite-sign cuts that reveal a real structural difference:

- **T33 24 tipper-specific misses**: Wheelo got **22/24 right** (market got 7/24). v3 has a specific consensus-tipping blind spot Wheelo handles.
- **256 consensus-wrong games**: **v3 +14** (28 right vs 14). v3's against-the-field contrarian edge is real and load-bearing.

The two cuts cancel at the headline. **Closing the gap means picking up the +22 cut without losing the +14 cut.**

## 1. Where the structural difference lives (Phase B fit)

Panel regression `predicted_margin ~ HomeTeam_season − AwayTeam_season + Venue + ε` on both models' predictions identifies the parameter differences (`analysis/wheelo-paramfit.py`, `/tmp/wheelo/paramfit_summary.json`):

| Parameter | v3 (`predha-080`) | Wheelo | Δ |
|---|---|---|---|
| Margin → Prob | Φ-CDF, σ=36 | Φ-CDF, σ=32.4 | similar shape, sharper σ |
| **HGA** | Single global, ~8.4 margin pts | **Per-venue, MCG-relative range −9.2 to +12.7** | **load-bearing** |
| **Update mechanic** | MOV-Elo on team rating | **OD split; Attack r=+0.93 with xScore, Def r=−0.94 with TotalPoints_Opposition** | **load-bearing** |
| K-factor | k=25 | ~20% wider rating spread | likely downstream of OD (2 channels) |
| Carryover | RTM 0.1 | Similar slopes (0.74–0.96) | similar |

Two load-bearing differences: **per-venue HGA** and **stat-driven OD update mechanic**. Sigma, K and carryover are not where the gap is.

## 2. Candidate tasks

Three candidates, ranked by *novel evidence weight + tractability*.

### Task 38a — per-venue HGA (new lead, highest priority)

**Mechanism.** Replace v3's static `elo.home_advantage: 160` rating points (≈5.6 margin pts) + `output.prediction_home_advantage: 80` (≈2.8 margin pts) with a per-venue table fit from training data. Wheelo's panel-fit per-venue HGA (MCG-relative):

| Venue | n | v3 HGA | Wheelo HGA | Δ |
|---|---:|---:|---:|---:|
| Perth Stadium | 103 | +3.08 | +12.69 | +9.61 |
| Gabba | 55 | +1.33 | +9.74 | +8.41 |
| Carrara | 41 | +0.70 | +9.30 | +8.59 |
| Kardinia Park | 43 | +3.03 | +9.50 | +6.47 |
| TIO Stadium | 10 | −1.34 | +8.24 | +9.58 |
| Sydney Showground | 36 | +1.28 | +8.65 | +7.37 |
| SCG | 54 | −0.21 | +6.12 | +6.33 |
| Adelaide Oval | 125 | +0.36 | +4.32 | +3.96 |
| Marvel Stadium | 195 | +1.17 | +2.43 | +1.25 |
| MCG | 232 | 0.00 (gauge) | 0.00 (gauge) | — |
| Barossa Park (neutral) | 7 | −1.56 | −9.18 | −7.62 |

v3 spread 4.6 pts. Wheelo spread 21.9 pts. The biggest measured parameter gap in the review.

**What's in the existing ledger that's adjacent?** T17 (venue-HA) explored context-K, not the venue-HGA value itself. T20 (prediction-home-advantage) is the source of the current static +80 split. T22 (HA follow-ups) closed negative on team-side per-venue tweaks. **None of these implemented an empirical per-venue HGA table** — T38a is novel.

**Why this is not a residual-mining redo of T33.** T33 found a +1 tip / −0.0011 LL signal from "HA=0 at neutral venues", folded into the A2 bucketed-HA bundle. T38a is bigger and structural: the Perth +9.6 / Kardinia +6.5 / Gabba +8.4 gaps dwarf the T33 finding. The neutral-venue piece is a special case of T38a (Barossa, Norwood, Traeger map to negative HGA values).

**Pre-registered design (must be set before fitting):**

- **Scope.** Per-venue HGA on the prediction side (margin space), replacing `output.prediction_home_advantage` with a per-venue lookup. Update side stays at `elo.home_advantage: 160` for now (separate decision; mixing both is a v4-class risk).
- **Estimator.** Walk-forward leave-one-season-out: for each season Y, fit per-venue HGA from completed matches in training_seasons + (2016..Y−1). Pre-train on 2015–2020 (the train_seasons block) so seasons 2016–2025 each have an honest leave-one-out fit. No look-ahead.
- **Shrinkage.** Empirical Bayes: shrink each venue's HGA toward the global mean by weight `α = n_global / (n_global + n_venue)`. Pre-register `α=1` (no shrinkage) and `α=0.5` (moderate shrinkage) variants; pick whichever wins on the primary window.
- **Venue identity.** Use D1's `matches.venue` string verbatim. Don't dedup venue names across naming conventions — the data layer is the canonical surface.
- **New-venue fallback.** If a venue has <5 prior matches in the training set, fall back to the global HGA. Log fallback rate per season.
- **Pre-registered bar.** Amended T32 bar:
  - Primary 2021–25: Δ LL < −0.005 with pooled CI excluding zero.
  - Confirmatory 2016–19: same direction, magnitude within 50% of primary.
  - **No pooled tip regression** vs v3; last-3-season tip delta non-negative (disqualifying if negative).
  - **Regression guard**: ΔTips on consensus_wrong-bucket games ≥ 0 (must not erode the +14 contrarian edge from `wheelo-headhead-2026-06-16.md` §field-consensus).
  - 2026 R14+ post-October as OOS gate.
- **Sigma.** Hold σ=36 constant; per-venue HGA shifts the mean, not the spread, so sigma re-tune is a follow-up not a co-shipped change.

**Estimated effect**: from Phase A per-venue residuals, ~1–3 tips/season pooled, possibly more on Perth/Kardinia/Gabba/Carrara-heavy rounds. Should also tighten margin MAE (Wheelo's MAE 25.5 vs v3's 26.2 on the paired set; per-venue HGA likely accounts for most of the 0.7 pt gap).

**Engine work**: `src/engine/predict.ts` reads HGA. New `output.prediction_home_advantage_per_venue: { ... } | null` config field (`.optional()`, never `.default()` for hash stability). Walk-forward training in `harness.ts` accumulates per-venue residual averages as it walks; predict consumes the per-venue lookup. Bit-inertness verified: predha-080 re-run reproduces `2641f46f`.

### Task 38b — T36 OD-split R14+ re-evaluation (already queued, now with Wheelo evidence)

**No change to spec** — already documented in `docs/task-36-split-ratings.md`. Bumped in priority because the Wheelo review provides external validation:

- Wheelo's Attack rating loads r=+0.93 on xScore (own offensive expected scoring).
- Wheelo's Defence loads r=−0.94 on opposition TotalPoints.
- Per-team residual halving in Wheelo's column (WCE −16→−10, North −11→−5, Geelong +9→+4, Carlton +6→+2) is the OD-split fingerprint.

**Action**: at end of 2026 R14+ window (per T36 plan), re-run promotion check with the additional 2026 OOS evidence + the consensus-wrong regression guard from this review. CI lower bound was −0.0007 at n=1062; expect convergence with more data.

### Task 38c — T28 shot-margin Elo standalone re-test (already queued)

**No change to spec** — documented in `docs/task-28-scoring-shot-elo.md`. Bumped in priority because Wheelo's update target IS xScore-style (per B.4).

**Action**: re-run T28's standalone variant (decoupled from v4's team-offset bundle that killed it on tips) against the amended T32 bar. Specifically test on the same paired set used for the v4 reversion (T32) so the tips-side comparison is direct.

## 3. Regression guards (non-negotiable for all three tasks)

Every candidate must pass these *in addition to* the amended T32 bar:

1. **Consensus-wrong cut**: ΔTips on the 256 games where field consensus (≥8 sources, ≥65% wrong) was wrong must be ≥ 0. This is v3's against-the-field edge. Any change that pulls v3 closer to field consensus erodes the +14 advantage. Reuse `analysis/wheelo-headhead.py`'s `field_share` bucketing.
2. **Per-team residual non-degradation**: no team's |bias| in the post-change backtest exceeds v3's by more than 2 pts on any team with n ≥ 50 in the window.
3. **Per-venue residual monitor**: report the same per-venue residual table as `wheelo-headhead-2026-06-16.md` §A.3; flag any venue whose post-change bias moves > 2 pts away from zero.

## 4. Sequencing

Per Jack's product preference (single-bundle changes get burned, see T31/v4):

1. **38a first, standalone.** Per-venue HGA is the largest measured gap, the most novel, and prediction-side only — minimal blast radius. Ship as a config variant first (`predha-080-venha`), backtest, evaluate against the bar, only then promote.
2. **38c (T28 standalone) second.** Engine work already exists. Re-test against the amended bar; if it passes, promote alongside 38a or after. **Do not bundle with 38a** — the v4 lesson was that bundling LL-positive changes with tips-flat changes loses both.
3. **38b (T36 R14+) at end of 2026.** Scheduled per T36 doc; the Wheelo evidence raises the prior that it'll clear the bar with more 2026 data, but the actual gate is still the same CI test.

Run them as **three separate experiments with three separate promotion decisions**. Do not combine into a "v5". The v4 reversion is the cautionary tale.

## 5. Don't-redo list (pre-default-rejects unchanged)

These don't get re-litigated as part of the Wheelo work:

- T16–T23 residual mining, ensembling/stacking attempts (T34/T35).
- T26 rest/travel, T27 round-phase, T29 rating-points-in-blend, T30/T37 age curves.
- Hand-rolled positional/closeness rules (T33 close-band MC).
- Mimicking Wheelo's stat-pipeline directly (forward-half time, etc.) — requires afl-stats schema changes outside this scope and Wheelo's stats inputs aren't load-bearing once OD-split is captured (B.4 cross-leak r~0.6 already absorbs most stat variance through team rating).

## 6. Evidence anchors (for future-Claude reading this cold)

- `analysis/wheelo-headhead-2026-06-16.md` — Phase A (head-to-head) + Phase B (parameter fit) writeup.
- `analysis/wheelo-headhead.py` — pairing + decomposition cuts + bootstrap CIs. Reproducible from cached `/tmp/sq_tips_wheelo_*.json`.
- `analysis/wheelo-paramfit.py` — sigma fit + panel regression + OD identification.
- `analysis/wheelo-paired-2022-2026.csv` — 971-row paired prediction set.
- `analysis/wheelo-flips-2022-2026.csv` — 108-row flip subset.
- `/tmp/wheelo/paramfit_summary.json` — consolidated parameter table.
- Wheelo's data endpoints (publicly hosted, GitHub Pages, `access-control-allow-origin: *`):
  - `https://www.wheeloratings.com/src/afl_stats/team_stats/afl/{year}.json` (2012–26 available)
  - `https://www.wheeloratings.com/src/xscores/xscores_data.json`
  - Inline JSON in `afl_ratings.html` (current OD ratings; URL season param ignored)
  - Squiggle API `q=tips;source=26` (2022 onward; per-match hmargin/hconfidence/bits/err)
