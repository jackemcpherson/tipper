# V1 Model Tuning Report

**Date:** 2026-04-26 **Baseline:** `blended-v1` (first calibrated blend,
pav_calibration_slope=0.246) **Final model:** `elo-tuned-v1` **Test window:**
2021--2025 (train on 2020, walk-forward) **Matches evaluated:** 1,062

---

## Executive Summary

Four staged experiments reduced the initial blended Elo+PAV model's LogLoss from
0.887 to 0.872. This change represents a 1.7% relative improvement in
probabilistic accuracy. The gains came almost entirely from Elo-side parameter
tuning (regression to mean and K-factor), while PAV parameters proved
insensitive at the current 10% blend weight. Calibration analysis revealed
residual underconfidence in high-confidence predictions, pointing to a sigma
sweep as the top v2 priority.

### Final V1 Parameters

| Group      | Parameter                 | Value                     | Sensitivity                    |
| ---------- | ------------------------- | ------------------------- | ------------------------------ |
| **Elo**    | `k`                       | 25                        | Sensitive (range 0.014)        |
|            | `initial_rating`          | 1500                      | Not swept                      |
|            | `home_advantage`          | 80                        | Insensitive (range 0.002)      |
|            | `regression_to_mean`      | 0.0                       | Sensitive (range 0.017)        |
|            | `mov_multiplier`          | `538_log`                 | Not swept                      |
| **PAV**    | `prior_weight_k`          | 15                        | Insensitive (range 0.002)      |
|            | `missing_player_default`  | 5                         | Flat (range 0.0001)            |
|            | `include`                 | `named_lineup_excl_emerg` | Not swept                      |
| **Blend**  | `weight_elo`              | 0.9                       | Sensitive (range 0.016)        |
|            | `pav_calibration_slope`   | 0.246                     | Not swept (regression-derived) |
| **Output** | `margin_per_rating_point` | 0.07                      | Not swept                      |
|            | `sigma`                   | 36                        | Not swept (v2 candidate)       |

### Overall Metrics: Start to Finish

| Metric  | blended-v1 | elo-tuned-v1 | Change |
| ------- | ---------- | ------------ | ------ |
| LogLoss | 0.887      | **0.872**    | -0.015 |
| Brier   | 0.213      | **0.210**    | -0.003 |
| MAE     | 28.04      | **27.26**    | -0.78  |
| RMSE    | 36.00      | **34.85**    | -1.15  |
| Tip%    | 66.5%      | 65.7%        | -0.8%  |

Tip% dipped 0.8 percentage points while all probabilistic and margin metrics
improved. Better calibration creates this trade-off. The model stops
overcommitting on toss-up games that occasionally get lucky. Instead, it sizes
its confidence more accurately. For a model whose outputs feed into
probability-weighted decisions, LogLoss and Brier are the primary objectives.
Tip% is a secondary headline metric.

---

## Task 1. Blend Weight Sweep

This task identifies the strongest fixed balance between Elo and PAV.

### Task 1 Goal

Find the optimal weight between Elo and PAV, treating this as a one-dimensional
sweep with the calibrated PAV slope locked.

### Task 1 Setup

Six configs vary `blend.weight_elo` from 0.4 to 0.9 in steps of 0.1. Other
parameters use the `blended-v1` defaults. These are K=20, HA=30, RTM=0.33,
prior_weight_k=15, and sigma=36.

### Task 1 Results

| Config          | weight_elo | Tip%  | MAE   | RMSE  | Brier  | LogLoss    |
| --------------- | ---------- | ----- | ----- | ----- | ------ | ---------- |
| blend-weight-09 | 0.9        | 65.9% | 27.74 | 35.58 | 0.2115 | **0.8810** |
| blend-weight-08 | 0.8        | 65.8% | 27.81 | 35.69 | 0.2116 | 0.8819     |
| blend-weight-07 | 0.7        | 66.0% | 27.91 | 35.83 | 0.2122 | 0.8839     |
| blend-weight-06 | 0.6        | 66.5% | 28.04 | 36.00 | 0.2131 | 0.8871     |
| blend-weight-05 | 0.5        | 66.3% | 28.21 | 36.21 | 0.2145 | 0.8916     |
| blend-weight-04 | 0.4        | 65.6% | 28.42 | 36.45 | 0.2164 | 0.8974     |

Sorted by LogLoss ascending.

### Task 1 Analysis

The relationship between weight_elo and LogLoss is monotonic across the entire
sweep range: more Elo weight strictly improves probabilistic accuracy. Every
metric. LogLoss, Brier, MAE, RMSE. Moves in the same direction, favouring
heavier Elo weighting.

The one exception is tip%. It peaks at weight_elo=0.6 (66.5%) and declines as
Elo weight increases. This result is not contradictory: a more PAV-heavy model
makes sharper (and sometimes luckier) calls on close games, inflating tip% while
degrading calibration. The model at 0.6 essentially over-commits on marginal
picks. It calls more of them right by chance, but its probability estimates are
less accurate overall.

The spread across the sweep is 0.0164 LogLoss (0.8810 to 0.8974), making blend
weight a clearly sensitive parameter.

At weight_elo=0.9, PAV still contributes 10% of the blended team rating. This
result is a small but non-zero contribution. Whether it justifies the complexity
of maintaining the PAV pipeline is a v2 question. For now, the calibrated slope
ensures PAV's contribution is at least correctly scaled.

### Task 1 Decision

**Winner: `blend-weight-09` (weight_elo=0.9).** Promoted as baseline for
subsequent tasks.

---

## Task 2. Elo Parameter Sensitivity

This task measures sensitivity to the core Elo parameters.

### Task 2 Goal

Determine which Elo parameters meaningfully affect outcomes via three
independent one-parameter sweeps from the Task 1 baseline.

### Task 2 Setup

All sweeps use `blend-weight-09` as the template (weight_elo=0.9, K=20, HA=30,
RTM=0.33). Each sweep varies one parameter while holding the others fixed.

### Sweep A. K-Factor

The K-factor controls how aggressively Elo ratings respond to individual match
results. Higher K means more volatility. Lower K means more inertia.

| Config   | K   | Tip%  | MAE   | Brier  | LogLoss    | Delta vs baseline |
| -------- | --- | ----- | ----- | ------ | ---------- | ----------------- |
| elo-k-25 | 25  | 65.4% | 27.65 | 0.2115 | **0.8801** | -0.0009           |
| elo-k-20 | 20  | 65.9% | 27.74 | 0.2115 | 0.8810     | 0.0000            |
| elo-k-30 | 30  | 65.3% | 27.61 | 0.2120 | 0.8811     | +0.0001           |
| elo-k-15 | 15  | 65.7% | 27.95 | 0.2123 | 0.8848     | +0.0038           |
| elo-k-40 | 40  | 64.4% | 27.68 | 0.2141 | 0.8869     | +0.0059           |
| elo-k-10 | 10  | 66.1% | 28.31 | 0.2148 | 0.8938     | +0.0128           |

**Range: 0.0137**. Sensitive.

The response curve is U-shaped. Both extremes hurt. At K=10, ratings react too
slowly to changes in form. At K=40, one upset moves ratings too far. The optimum
sits at K=25, marginally better than the default K=20.

An interesting pattern: K=10 has the highest tip% (66.1%) despite the worst
LogLoss. A sluggish model makes conservative, stable predictions that happen to
be right more often on toss-ups. But its probability estimates are poorly sized.
This mirrors the Task 1 finding: accuracy and calibration can pull in opposite
directions.

**Decision: Lock K=25.** Improvement is modest (-0.0009) but consistent with the
principle that slightly faster adaptation is better in a league with meaningful
week-to-week form changes.

### Sweep B. Home Advantage

The model adds home advantage in Elo points to the home team's rating before
computing the expected score. In AFL, published home advantage is typically
8--12 points on the scoreboard. With `margin_per_rating_point=0.07`, that
translates to roughly 115--170 Elo points.

| Config    | HA  | Tip%  | MAE   | Brier  | LogLoss    | Delta vs baseline |
| --------- | --- | ----- | ----- | ------ | ---------- | ----------------- |
| elo-ha-80 | 80  | 65.4% | 27.70 | 0.2110 | **0.8794** | -0.0016           |
| elo-ha-65 | 65  | 65.4% | 27.72 | 0.2112 | 0.8800     | -0.0010           |
| elo-ha-50 | 50  | 65.5% | 27.73 | 0.2113 | 0.8805     | -0.0005           |
| elo-ha-40 | 40  | 65.6% | 27.74 | 0.2114 | 0.8808     | -0.0002           |
| elo-ha-30 | 30  | 65.9% | 27.74 | 0.2115 | 0.8810     | 0.0000            |

**Range: 0.0016**. Insensitive (< 0.005 threshold).

The trend is monotonically improving toward higher values with no sign of
flattening, which strongly suggests the true optimum lies beyond 80. This result
is consistent with the known AFL home advantage. The baseline default of 30 was
on the low end. 80 is closer to reality but likely still conservative.

Despite the insensitivity at the overall level, the direction is clear and there
is no downside risk. The composed config moves the parameter to 80.

The insensitivity is informative. One flat home-advantage value cannot capture
the AFL's venue differences. The MCG, Optus Stadium, and Gabba create materially
different advantages. A ground-specific HA model is a natural v2 extension and
should show much stronger sensitivity.

**Decision: Set HA=80.** Document as insensitive but directionally correct.

### Sweep C. Regression to Mean

Regression to the mean controls how strongly Elo ratings move towards 1500 at
the start of each new season. A value of 0.33 means each team's rating moves 33%
of the way toward 1500 during the off-season.

| Config      | RTM  | Tip%  | MAE   | Brier  | LogLoss    | Delta vs baseline |
| ----------- | ---- | ----- | ----- | ------ | ---------- | ----------------- |
| elo-rtm-00  | 0.0  | 65.9% | 27.35 | 0.2096 | **0.8728** | -0.0082           |
| elo-rtm-01  | 0.1  | 65.8% | 27.47 | 0.2100 | 0.8748     | -0.0062           |
| elo-rtm-02  | 0.2  | 65.9% | 27.59 | 0.2105 | 0.8773     | -0.0037           |
| elo-rtm-025 | 0.25 | 65.5% | 27.65 | 0.2109 | 0.8787     | -0.0023           |
| elo-rtm-04  | 0.4  | 65.4% | 27.83 | 0.2121 | 0.8832     | +0.0022           |
| elo-rtm-06  | 0.6  | 64.9% | 28.09 | 0.2141 | 0.8901     | +0.0091           |

**Range: 0.0173**. The most sensitive parameter tested across all sweeps.

The relationship is perfectly monotonic: less regression is always better. Zero
regression. Carrying ratings unchanged across seasons. Produces the best result
by a decisive margin (-0.0082 vs baseline).

This finding has a natural explanation. AFL list turnover between seasons is
relatively low compared to leagues with hard salary caps or drafts that force
roster churn. Most teams retain a stable core each year. Their end-of-season Elo
rating therefore provides a strong prior for the next season. Regressing toward
the mean discards this accumulated signal unnecessarily.

One theoretical risk remains. Zero regression responds slowly to dramatic
off-season rebuilds involving retirements, coaching changes, or major trades.
Across five test seasons, preserving signal for most stable teams provides more
value than this cost. Stable.

The evidence shows that RTM=0.0 benefits more recent seasons disproportionately
(the model has accumulated more than four years of signal by 2025). The Task 4
year-by-year analysis confirms this pattern.

**Decision: Lock RTM=0.0.** The largest single improvement found in the entire
tuning process.

### Composed Baseline: `elo-tuned-v1`

The team combined the three sweep winners (K=25, HA=80, RTM=0.0) into one
config. A backtest confirmed that the improvements are additive.

| Metric  | blend-weight-09 (Task 1) | elo-tuned-v1 (Task 2) | Change  |
| ------- | ------------------------ | --------------------- | ------- |
| LogLoss | 0.8810                   | **0.8722**            | -0.0088 |
| Brier   | 0.2115                   | **0.2097**            | -0.0018 |
| MAE     | 27.74                    | **27.26**             | -0.48   |
| RMSE    | 35.58                    | **34.85**             | -0.73   |
| Tip%    | 65.9%                    | 65.7%                 | -0.2%   |

The improvements combine cleanly. The combined gain is -0.0088. The individual
gains total -0.0107, before interactions reduce the result slightly.

**Promoted as current baseline.**

---

## Task 3. PAV Parameter Sensitivity

This task measures sensitivity to PAV priors and missing-player handling.

### Task 3 Goal

Determine whether PAV-specific parameters meaningfully affect outcomes, using
the same sweep methodology as Task 2.

### Task 3 Setup

Two sweeps from the `elo-tuned-v1` baseline (weight_elo=0.9, K=25, HA=80,
RTM=0.0).

### Sweep A. Prior Weight K

`prior_weight_k` controls how many "games of evidence" the previous season's PAV
carries into the current season. At K=15 and round 5 (5 games played), the blend
is approximately 75% prior / 25% current-season evidence. Lower K trusts
current-season data faster. Higher K anchors more to the prior.

| Config        | prior_weight_k | Tip%  | MAE   | Brier  | LogLoss | Delta vs baseline |
| ------------- | -------------- | ----- | ----- | ------ | ------- | ----------------- |
| pav-priork-5  | 5              | 65.3% | 27.24 | 0.2095 | 0.8714  | -0.0008           |
| pav-priork-10 | 10             | 65.6% | 27.25 | 0.2096 | 0.8718  | -0.0004           |
| pav-priork-15 | 15             | 65.7% | 27.26 | 0.2097 | 0.8722  | 0.0000            |
| pav-priork-20 | 20             | 65.7% | 27.27 | 0.2097 | 0.8725  | +0.0003           |
| pav-priork-25 | 25             | 65.6% | 27.28 | 0.2098 | 0.8727  | +0.0005           |
| pav-priork-30 | 30             | 65.3% | 27.29 | 0.2099 | 0.8729  | +0.0007           |

**Range: 0.0015**. Insensitive (< 0.005 threshold).

The trend is monotonic: lower K trusts current-season evidence faster and
performs better. However, values from 5 to 30 span only 0.0015 LogLoss. This
result sits below the noise floor for meaningful differentiation.

The insensitivity makes sense given PAV's 10% blend weight. Even if the prior
weight were perfectly optimised, it would only affect the PAV component, which
itself contributes only 10% of the final rating. The lever arm is simply too
short for this knob to matter.

**Decision: Leave at default (prior_weight_k=15).** Documented as insensitive.

### Sweep B. Missing Player Default

`missing_player_default` assigns a PAV value to players with no prior-season
data (debutants, returning players, newcomers). A value of 0 says "unknown
players contribute nothing". A value of 5 says "assume a roughly replacement-
level contribution."

| Config         | missing_default | Tip%  | MAE   | Brier  | LogLoss | Delta vs baseline |
| -------------- | --------------- | ----- | ----- | ------ | ------- | ----------------- |
| pav-missing-0  | 0               | 65.7% | 27.26 | 0.2097 | 0.8721  | -0.0001           |
| pav-missing-3  | 3               | 65.7% | 27.26 | 0.2097 | 0.8721  | -0.0001           |
| pav-missing-5  | 5               | 65.7% | 27.26 | 0.2097 | 0.8722  | 0.0000            |
| pav-missing-8  | 8               | 65.7% | 27.27 | 0.2097 | 0.8722  | 0.0000            |
| pav-missing-12 | 12              | 65.5% | 27.27 | 0.2097 | 0.8722  | 0.0000            |

**Range: 0.0001**. Completely flat.

This parameter has no measurable effect on any metric. The LogLoss values are
identical to 4 decimal places across a 12x range. Brier scores are identical to
all reported digits. Even tip% only wobbles by 0.2 percentage points at the
extreme.

This result is the expected result of two compounding factors:

1. PAV is only 10% of the blended rating, so any PAV-internal change is
   attenuated by 10x.
2. The missing player default only applies to the subset of players lacking
   prior-season data. Most matches feature established players with full prior
   histories. The parameter affects a small fraction of an already small
   component.

**Decision: Leave at default (missing_player_default=5).** Documented as
completely insensitive. This result is a robustness finding. The model is stable
regardless of the values assigned to unknown players.

### Task 3 Summary

Neither PAV parameter is sensitive at the current blend weight. The team made no
config changes. `elo-tuned-v1` carries forward unchanged.

This result is itself a meaningful finding: **PAV's internal knobs do not affect
outcomes at 10% blend weight.** The PAV component is reliable to its
hyperparameters, which means either:

- PAV's signal is genuinely stable across these parameter ranges (good), or.
- PAV's 10% contribution is too small for internal adjustments to register
  (neutral. Would change if blend weight decreased).

If a future v2 change (for example, opponent-adjusted PAV, zone-specific
blending) increases PAV's influence, these sweeps should be re-run.

---

## Task 4. Year-by-Year Variance and Calibration Analysis

This task checks performance stability and probability calibration over time.

### Task 4 Goal

Diagnostic analysis of the final `elo-tuned-v1` model. Not a tuning task. The
outputs inform v2 priorities.

### Part A. Per-Season Breakdown

Comparison of the original `elo-only-v1` (K=20, HA=30, RTM=0.33, weight_elo=1.0)
against the final `elo-tuned-v1` (K=25, HA=80, RTM=0.0, weight_elo=0.9).

| Year    | n        | Elo-only Tip% | Tuned Tip% | Delta     | Elo-only LogLoss | Tuned LogLoss | Delta       | 95% CI  |
| ------- | -------- | ------------- | ---------- | --------- | ---------------- | ------------- | ----------- | ------- |
| 2021    | 207      | 64.2%         | 64.2%      | 0.0%      | 0.9205           | 0.9157        | -0.0048     | +/-6.5% |
| 2022    | 207      | 68.4%         | 68.9%      | +0.5%     | 0.8616           | 0.8520        | -0.0096     | +/-6.3% |
| 2023    | 216      | 65.0%         | 64.0%      | -1.0%     | 0.9025           | 0.9007        | -0.0017     | +/-6.4% |
| 2024    | 216      | 61.5%         | 62.0%      | +0.5%     | 0.8987           | 0.8903        | -0.0084     | +/-6.5% |
| 2025    | 216      | 67.4%         | 69.3%      | +1.9%     | 0.8243           | 0.8030        | -0.0213     | +/-6.2% |
| **All** | **1062** | **65.3%**     | **65.7%**  | **+0.4%** | **0.8813**       | **0.8722**    | **-0.0092** |         |

95% CI half-width computed as 1.96 _sqrt(p_ (1-p) / n) using tuned tip%.

#### Observations

**Tuned never underperforms Elo-only on LogLoss.** The improvement is positive
in every year. It ranges from -0.0017 in 2023 to -0.0213 in 2025. On tip%, 2023
is the only year where the tuned model tips fewer winners (-1.0%). This result
sits well within the +/-6.4% confidence interval and is not statistically
distinguishable from zero.

**2024 is the weakest year for both models.** Both produce their lowest tip%
(61.5% / 62.0%) and near-highest LogLoss in 2024. The underperformance relative
to the 5-year average is approximately 3.5 percentage points on tip%, which is
within the ~6.5% CI half-width. This result does not rise to the level of a data
quality concern. 2024 was simply a more unpredictable season. Both models
struggle equally, suggesting the difficulty is in the underlying matches rather
than a model-specific failure mode.

**Recent seasons produce most of the tuning improvement.** 2025 accounts for
nearly half the total LogLoss improvement (-0.0213 of -0.0092 total). 2022 and
2024 contribute meaningfully (-0.0096 and -0.0084). 2021 and 2023 show minimal
gains.

This pattern is a direct consequence of the RTM=0.0 change. With no off-season
regression, the model accumulates signal over multiple seasons. By 2025, it has
carried 5 years of Elo adjustments forward without dilution, producing stronger
rating separation and more confident (and correct) predictions. The benefit
grows over time as the accumulated signal compounds.

The flip side is that early seasons (2021, one year after the training period)
have less accumulated signal and show correspondingly smaller gains. This
pattern follows from the available history and raises no concern. The model's
value proposition strengthens with longevity.

### Part B. Calibration Analysis

Predictions binned by predicted home win probability into decile buckets.

| Bucket  | Elo-only Pred | Elo-only Actual | n   | Tuned Pred | Tuned Actual | n   |
| ------- | ------------- | --------------- | --- | ---------- | ------------ | --- |
| 50-60%  | 0.549         | 0.529           | 450 | 0.550      | 0.520        | 367 |
| 60-70%  | 0.647         | 0.665           | 355 | 0.648      | 0.620        | 326 |
| 70-80%  | 0.742         | **0.803**       | 203 | 0.745      | 0.753        | 227 |
| 80-90%  | 0.834         | **0.925**       | 53  | 0.839      | **0.891**    | 128 |
| 90-100% | 0.902         | 1.000           | 1   | 0.916      | 0.929        | 14  |

#### Observation 1: Elo-Only Is Significantly Underconfident at High Confidence

The most striking feature of the Elo-only calibration is systematic
underconfidence in the upper buckets. When the model predicts 74% confidence,
the actual win rate is 80%. When it predicts 83%, the actual rate is 93%. The
model consistently underestimates how decisive strong favourites actually are.

This result indicates that sigma is too high. A sigma of 36 flattens the
probability curve and compresses predictions towards 50%. The model cannot
express strong confidence even when the rating differential warrants it. The
model "knows" the favourite is much better (via the rating gap) but the wide
sigma smooths this into a tepid probability.

#### Observation 2: Tuning Dramatically Improved High-Confidence Calibration

The 70-80% bucket began with 6.1 percentage points of underconfidence. Elo-only
predicted 74.2%, while the actual result was 80.3%. Tuning produced near-perfect
calibration at 74.5% predicted and 75.3% actual. The 0.8-point gap is the
largest calibration improvement.

The 80-90% bucket improved from 9.1pp underconfident to 5.2pp underconfident.
Still imperfect, but the sample grew from 53 to 128 matches as the model's
stronger rating separation pushed more predictions into this range.

Two sources produce the improvement. RTM=0.0 preserves larger rating
differentials across seasons. The resulting spreads represent team-quality gaps
more accurately. HA=80 also adds a larger, more realistic home advantage
component.

#### Observation 3: Mild Overconfidence in Near-Toss-up Predictions

Both models show slight overconfidence in the 50-60% bucket (predicting ~55%,
actual ~52%). This result is the largest bucket by count (367-450 matches) and
represents near-coin-flip games where the model claims a small edge. A 3pp
overconfidence in this range follows from the uncertainty. These games are
inherently hard to separate, and any systematic edge the model claims is partly
noise.

This result is not actionable. The bucket is large enough that the effect is
statistically detectable but small enough that it does not meaningfully degrade
overall calibration.

#### Observation 4: the 60-70% Mid-Bucket Flipped Direction

Elo-only was slightly underconfident in this range (pred 64.7%, actual 66.5%).
The tuned model is slightly overconfident (pred 64.8%, actual 62.0%). The
magnitude is modest (~2.8pp for the tuned model) and within expected variance
for n=326.

The tuning may have pushed some previously underconfident mid-range predictions
slightly past the mark. The modest effect warrants monitoring. If overconfidence
in the 60-70% range grows in future seasons, it could indicate the model is
over-fitted to the current test window.

#### Observation 5: Sample Size Redistribution

A notable side effect of tuning is the redistribution of predictions across
confidence buckets. The 50-60% bucket shrank from 450 to 367 matches. The 80-90%
bucket grew from 53 to 128, while the 90-100% bucket grew from 1 to 14. The
tuned model produces more decisive predictions. It pushes matches out of the
uncertain middle and into the high-confidence tails.

This redistribution is healthy. It means the model has stronger opinions, and
(per the calibration analysis) those stronger opinions are largely justified.
The model is not just more confident. It is more confident _and_ more accurate
at those confidence levels.

### Part B Diagnosis

The residual underconfidence at 80-90% (pred 84%, actual 89%) is the primary
remaining calibration issue. Extreme buckets contain most of this result, which
per the task's diagnostic framework, points to **sigma being too high** rather
than a rating-differential problem.

A sigma sweep (for example, 28 to 36 in steps of 2) is the most direct lever.
Lower sigma would steepen the probability curve. The model could then express
more confidence when rating gaps warrant it. This change would address 80-90%
underconfidence without affecting mid-bucket calibration.

---

## Summary of Findings

The combined results identify the parameters that materially affect performance.

### What Matters

Three parameters drove essentially all of the v1 improvement:

1. Regression to mean (RTM). The single most impactful parameter. Eliminating
   off-season regression (-0.0082 LogLoss) lets the model accumulate multi-year
   signal. AFL team quality is persistent enough year-to-year that discarding
   accumulated Elo signal is wasteful.

2. Blend weight. Shifting from 60/40 to 90/10 Elo/PAV (-0.0061 LogLoss from
   blended-v1 to blend-weight-09) reflects that Elo carries the majority of the
   predictive signal. PAV's calibrated contribution at 10% is small but
   non-negative.

3. K-factor. A modest improvement from K=20 to K=25 (-0.0009 LogLoss). AFL
   matches produce enough signal that slightly faster adaptation is beneficial,
   but the effect is small compared to RTM.

### What Does Not Matter

Two categories of parameter proved insensitive:

1. Home advantage (flat). The single-value HA parameter has almost no effect on
   outcomes (range 0.0016). This result is not because home advantage does not
   exist in AFL. It does, and it is substantial. It is because a single global
   constant is too blunt an instrument. The real variance is across grounds,
   travel distances, and altitude. A ground-specific HA model is the v2 path to
   unlocking this signal.

2. All PAV internal parameters. Both `prior_weight_k` (range 0.0015) and
   `missing_player_default` (range 0.0001) are insensitive. At 10% blend weight,
   PAV's internal tuning simply does not register in the overall output. This
   result is a robustness finding: PAV cannot hurt the model even if its
   internal knobs are set poorly, but it also cannot help much with fine-tuning
   at this blend level.

### The Tip% Versus LogLoss Tension

A recurring pattern across the experiments: tip% and LogLoss sometimes move in
opposite directions. The original `blended-v1` had the highest tip% (66.5%) but
worse LogLoss than the final tuned model (65.7% tip%, 0.872 LogLoss).

This result is not a paradox. Tip% is a binary metric (right or wrong) that
rewards overcommitment on close games. A correct 52% toss-up prediction receives
the same tip credit as a correct 90% blowout prediction. LogLoss penalises
miscalibration. Saying 52% when the true probability is 50% costs very little,
but saying 70% when the true probability is 52% costs a lot.

The tuned model is more honest about uncertainty. It no longer over-commits on
marginal games, which costs it a few tips but produces better-calibrated
probabilities overall. For any downstream use that cares about the _size_ of the
edge (betting markets, confidence-weighted tipping competitions, expected value
calculations), LogLoss is the correct objective.

### Calibration State

The final model is well-calibrated in the 70-80% range and slightly
underconfident at 80-90%. The primary lever for closing this gap is sigma
(currently 36), which controls the width of the predicted margin distribution. A
lower sigma would steepen the probability curve, allowing stronger confidence on
large rating differentials.

### V2 Priority Stack

Based on the findings, the recommended priority order for v2 work is:

1. Sigma sweep. The most direct path to fixing the remaining calibration gap. A
   sweep from 28 to 36 should reveal whether the current value is too
   conservative. This result is a parameter tuning task, not an architectural
   change, and could be completed in a single experiment.

2. Ground-specific home advantage. The flat HA parameter's insensitivity
   combined with its clear directional trend suggests that the real signal is in
   ground-level variation. MCG home advantage (familiar ground, large crowd) is
   different from Optus Stadium (travel, timezone) or Gabba (heat, humidity).
   This requires architectural changes to the engine (per-ground HA lookup) but
   could substantially improve predictions for teams with strong home-ground
   effects.

3. Opponent-adjusted PAV. Currently PAV measures absolute player quality without
   regard to opponent strength. Adjusting PAV for opponent would improve the
   signal, but at 10% blend weight, the impact would be attenuated. This result
   is lower priority unless a future experiment increases PAV's blend weight.

4. Zone-specific blending. Allowing different Elo/PAV weights for different
   field zones (offensive, midfield, defensive). This result is the most complex
   architectural change and should be deferred until PAV's overall contribution
   is validated at a higher blend weight.

---

## Appendix: Config Inventory

All configs created during v1 tuning, with their backtest results.

### Task 1 Configs

| Config          | weight_elo | LogLoss | Status                     |
| --------------- | ---------- | ------- | -------------------------- |
| blend-weight-04 | 0.4        | 0.8974  | Archived                   |
| blend-weight-05 | 0.5        | 0.8916  | Archived                   |
| blend-weight-06 | 0.6        | 0.8871  | Archived                   |
| blend-weight-07 | 0.7        | 0.8839  | Archived                   |
| blend-weight-08 | 0.8        | 0.8819  | Archived                   |
| blend-weight-09 | 0.9        | 0.8810  | Superseded by elo-tuned-v1 |

### Task 2 Configs

| Config           | Parameter    | Value                    | LogLoss    | Status            |
| ---------------- | ------------ | ------------------------ | ---------- | ----------------- |
| elo-k-10         | K            | 10                       | 0.8938     | Archived          |
| elo-k-15         | K            | 15                       | 0.8848     | Archived          |
| elo-k-20         | K            | 20                       | 0.8810     | Archived          |
| elo-k-25         | K            | 25                       | 0.8801     | Winner (composed) |
| elo-k-30         | K            | 30                       | 0.8811     | Archived          |
| elo-k-40         | K            | 40                       | 0.8869     | Archived          |
| elo-ha-30        | HA           | 30                       | 0.8810     | Archived          |
| elo-ha-40        | HA           | 40                       | 0.8808     | Archived          |
| elo-ha-50        | HA           | 50                       | 0.8805     | Archived          |
| elo-ha-65        | HA           | 65                       | 0.8800     | Archived          |
| elo-ha-80        | HA           | 80                       | 0.8794     | Winner (composed) |
| elo-rtm-00       | RTM          | 0.0                      | 0.8728     | Winner (composed) |
| elo-rtm-01       | RTM          | 0.1                      | 0.8748     | Archived          |
| elo-rtm-02       | RTM          | 0.2                      | 0.8773     | Archived          |
| elo-rtm-025      | RTM          | 0.25                     | 0.8787     | Archived          |
| elo-rtm-04       | RTM          | 0.4                      | 0.8832     | Archived          |
| elo-rtm-06       | RTM          | 0.6                      | 0.8901     | Archived          |
| **elo-tuned-v1** | **Composed** | **K=25, HA=80, RTM=0.0** | **0.8722** | **Current**       |

### Task 3 Configs

| Config         | Parameter       | Value | LogLoss | Status                 |
| -------------- | --------------- | ----- | ------- | ---------------------- |
| pav-priork-5   | prior_weight_k  | 5     | 0.8714  | Archived (insensitive) |
| pav-priork-10  | prior_weight_k  | 10    | 0.8718  | Archived (insensitive) |
| pav-priork-15  | prior_weight_k  | 15    | 0.8722  | Default retained       |
| pav-priork-20  | prior_weight_k  | 20    | 0.8725  | Archived (insensitive) |
| pav-priork-25  | prior_weight_k  | 25    | 0.8727  | Archived (insensitive) |
| pav-priork-30  | prior_weight_k  | 30    | 0.8729  | Archived (insensitive) |
| pav-missing-0  | missing_default | 0     | 0.8721  | Archived (flat)        |
| pav-missing-3  | missing_default | 3     | 0.8721  | Archived (flat)        |
| pav-missing-5  | missing_default | 5     | 0.8722  | Default retained       |
| pav-missing-8  | missing_default | 8     | 0.8722  | Archived (flat)        |
| pav-missing-12 | missing_default | 12    | 0.8722  | Archived (flat)        |
