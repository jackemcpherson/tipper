# Task 40: Adversarial review and experiment campaign

This report audits the promoted AFL model and its research ledger for Jack's
2027 Squiggle entry. The competition objective is correct winner picks.
Research is in progress. No promotion recommendation has been validated.

## Executive summary

The four historical reproduction targets pass on the original engine at
`8b7ed5b`. This establishes a starting point, not the validity of the model.
The campaign must finish the correctness audit before comparing candidates.

## Candidate verdict table

The following ranking is frozen before campaign candidate results. Rank
reflects likely close-game value, prior evidence and implementation cost.
Each row expands into the fixed doses listed in the registration below.
Pending means not yet run, not a verdict. Every completed row will receive
PROMOTE-CANDIDATE, PARK, KILL or an evidenced BLOCKED status.

| Rank | Candidate | Hypothesis and sign mechanism | Config prefix | Command family | Result | Verdict |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | A1 OD re-adjudication | Margin residual updates can correct close-game team ordering | t40-od | A | Pending | Pending |
| 2 | A2 Shot Elo doses | Discount conversion luck before updating team ratings | t40-shot | A | Pending | Pending |
| 3 | B1 OD shot targets | Discount conversion luck in OD's residual update | t40-od-shot | B | Pending | Pending |
| 4 | A3 Bucket and neutral HA | Reduce false home advantage at shared or displaced grounds | t40-ha | A | Pending | Pending |
| 5 | B2 OD HA and buckets | Calibrate the prediction intercept for a different rating update | t40-od-ha | B | Pending | Pending |
| 6 | B3 Reverse OD selection | Stable learning rate and carry should survive reversed selection | t40-od-reverse | B | Pending | Pending |
| 7 | C1 Lineup delta | Player ins and outs matter beyond team quality already in Elo | t40-lineup-delta | C | Pending | Pending |
| 8 | C2 Position weights | Named roles identify which PAV zones will matter tonight | t40-position | C | Pending | Pending |
| 9 | C3 Prior TOG | Expected playing time distinguishes nominal from effective lineup strength | t40-tog | C | Pending | Pending |
| 10 | C4 Position prior | Shrink noisy individual priors toward comparable roles | t40-position-prior | C | Pending | Pending |
| 11 | C5 Rich involvement | Direct chance creation and pressure improve player credit assignment | t40-rich | C | Pending | Pending |
| 12 | D1 Travel probe | Asymmetric travel burden leaves a replicating residual and close-game gap | t40-travel-probe | D | Pending | Pending |
| 13 | A4 Offset repair doses | Smaller memory and tail isolation separate margin gains from harmful flips | t40-offset | A | Pending | Pending |
| 14 | E1 Derived gain | Estimate rating noise and drift before choosing memory | t40-derived | E | Pending | Pending |
| 15 | E2 Points residual | Scalar residual updates reproduce OD without an unsupported split-state story | t40-points | E | Pending | Pending |
| 16 | E3 Finals HA/K | Shared finals venues and stronger information per game need different HA or gain | t40-finals | E | Pending | Pending |
| 17 | A5 Venue alternatives | Shrunk team-venue effects or historical fixed HA outperform noisy venue means | t40-venue | A | Pending | Pending |
| 18 | C6 Age resurrection | Early-season or zone-specific priors have a usable age effect | t40-age | C | Pending | Pending |
| 19 | D2 Quarter luck | Sustained control is more repeatable than a last-quarter scoring burst | t40-quarter | D | Pending | Pending |
| 20 | D3 Weather/roof | Forecast surprises alter update reliability, conditional on exposure to rain | t40-weather | D | Pending | Pending |
| 21 | D4 Rushed behinds | Pressure-induced scoring survives conversion-luck adjustment | t40-rushed | D | Pending | Pending |
| 22 | C7 Rating points | A within-team player rating signal adds information despite high total correlation | t40-rating-points | C | Pending | Pending |
| 23 | F2 PAV accounting | Current-season league totals and exact pools remove inconsistent units | t40-pav | F | Pending | Pending |
| 24 | F1 Probability correctness | Correct probabilities change scoring only, never the winner sign | t40-cdf | F | Pending | Pending |

## V3 findings

### Historical reproduction

Fresh D1-backed backtests on 2026-09-05 reproduce all required historical
targets. Historical match data uses the existing CLI cache; prior PAV, season
metadata and player dates of birth come from D1. Data-through is 2026-09-04.

| Config | Hash | Matches | Tips | LogLoss, rounded | Evidence |
| --- | --- | ---: | ---: | ---: | --- |
| predha-080 | 2641f46f | 1062 | 716 | 0.8485 | configs/predha-080/results-2026-09-05-2641f46f.json |
| predha80-early | 909461e1 | 828 | 554 | 0.8555 | configs/predha80-early/results-2026-09-05-909461e1.json |
| v4-shotoff | 7af312c5 | 1062 | 716 | 0.8409 | configs/v4-shotoff/results-2026-09-05-7af312c5.json |
| od-w100-k008 | c8c7b6b7 | 1062 | 728 | 0.8427 | configs/od-w100-k008/results-2026-09-05-c8c7b6b7.json |

### Issues awaiting isolated checks

These are code observations. Their effects on scored matches are not yet
measured, so they are not final findings.

- Both harness entry points retain `priorPavMap` if the previous calendar
  year is absent. An older prior can therefore survive a season boundary.
- `normalCdf` uses error-function coefficients with `abs(x)` in the polynomial
  and `exp(-x*x/2)` in the exponential. Check against known normal quantiles.
- The league accumulator copied at a PAV season boundary is never removed.
  The comment says current-season averages take over from round two, but
  `updatePavState` adds current data to the copied historical totals.
- `runPredict` updates PAV during training years; `runHarness` does not.
  This can give live predictions and backtests different league accumulators.
- `runBacktest` fetches priors for scored years only. Warm-up predictions for
  offsets and venue HA can therefore have different priors in scoped runs.
- `starting_18_only` filters emergency and substitute flags, without checking
  lineup position. It can include interchange players.
- `getVenueHaPred` divides by zero for an unseen venue when `min_n=0`, which
  the schema permits.
- OD's consumed state is `(attack-concede)/2`. Algebra suggests its update
  is exactly a scalar margin-residual update with gain `k/2`; test this
  identity before crediting the gain to independent scoring information.
- Calibration treats draws as incorrect while LogLoss treats them as away
  wins and tip accuracy excludes them. Quantify the disagreement.

## Ledger findings

The following discrepancies matter to interpretation:

- Tasks 36 and 38b mix candidate-minus-baseline point estimates with
  baseline-minus-candidate confidence intervals. Recompute both from one
  orientation. The claim that more matches must resolve significance is not
  a statistical guarantee.
- Task 21's 6.984 slope was fitted on 2021-2024, according to its own report.
  It is not evidence that the present train-only calibration reproduces 6.986.
- Task 33's stated kill condition was not met. Its report acknowledges this
  and substitutes the condition's "spirit" after observing the results.
- Task 29 used correlation to reject rating points without testing their
  incremental predictive contribution. Correlation alone cannot establish
  that contribution is zero.
- Task 37 says the K=15 prior loses dominance by round eight. The implemented
  weight is `15/(15+teamGamesPlayed)`, which remains above one half then.
- Task 38a labels a primary-window loss of four tips as a pooled loss. Its
  early-window gains yield totals of minus one and zero for the two doses.
- Task 38 describes Task 17 as contextual-K work, but Task 17 actually fitted
  a venue HA table. It also converts update and prediction HA into the wrong
  scoreboard contributions. Prediction HA 80 contributes 5.6 points.

### Task-by-task adjudication

These are judgments of the historical tests, not claims that unrun campaign
variants pass. A narrow negative can stand without exhausting a feature.
The original windows are too reused to give any historical kill a clean
prospective interpretation. Matched candidate-level power is quantified
later; an absolute-metric CI is not a substitute for paired effect power.

| Task | Test and implementation | What the numbers justify | Gate/history issue and campaign action |
| --- | --- | --- | --- |
| 1-8 | Elo, HA, RTM and confidence sweeps; cold scoped OOS skipped intervening seasons | Primary tuning results describe selected configurations, not external validation | Cold OOS did not test the trained model. Some confidence narratives imply tip effects that a monotonic head cannot cause. Preserve as development history. |
| 9-12 | Corrected-window comparisons, absolute bootstrap intervals and v1.5 selection | RTM benefit was about 0.006, not the earlier cold-window 0.022 claim | The warm-up fix did not land in the reusable path until Task 19. Wide standalone CIs do not establish a universal 0.005 noise floor. |
| 13-14 | PAV defence scaling fixed; historical versus cumulative checks | The factor-of-100 repair was necessary. Small remaining unit differences are measurable | A season-only ordering assertion cannot prove absence of same-season leakage. Prior league accumulation was observed but accepted. F2 tests it explicitly. |
| 15 | Primary-window slope and blend selection restored PAV after its bug fix | LL gain about 0.012 over old Elo supports PAV as a candidate signal | The fitted slope is in-sample. Current cold train-only calibration does not reproduce it. C1 tests the source of incremental PAV value. |
| 16 | Context-sensitive K doses 0.01/0.02 gave about 0.0005 LL; larger dose diverged | Kill stands for this dose grid and volatility proxy | Paired CI [-0.0018,0.0008] includes zero. This does not kill variance-derived gain E1. |
| 17 | Venue HA fitted on 2015-2020, shrunk by 0.7/0.5/0.3, update side only | Tested variants worsened LL by at least about 0.0016 | Kill stands for those tables. Not a test of contextual K, prediction HA or team-venue interactions. A5 tests the stated alternatives. |
| 18 | Backward v2 validation plus selected per-team improvements | V2's overall gain was useful development evidence | Era gap 0.024 exceeded the 0.020 criterion; 2/7 teams improved versus a half-teams requirement. Promotion relaxed gates after results. |
| 19 | Schedule-strength multiplier on team PAV pools; alpha0.25 was nearly flat | Kill stands for this aggregate opponent-quality proxy | It does not adjust each player's match production for each opponent. The separate warm-up repair was valid. |
| 20 | Added missing prediction-side HA, selected 80 on primary | A real omission in prediction was corrected | Fitting mean residual on the same window is not independent derivation. 60/100 update-HA followups were nearly flat. A3 and B2 recheck the intercept. |
| 21 | Zone slopes fitted on 2021-2024; negligible change | Kill stands for extra zone coefficients under the registered bar | It did not establish a train-only 6.984 slope or jointly retest all HA choices. More parameters without independent gain are unjustified. |
| 22 | Derby/true-home buckets, flat HA doses and probability heads | Small HA structure is plausible; tested effects were below the promotion bar | Many doses were inspected. Sigma was interpreted as normal despite the CDF bug. A3 rechecks HA; F1 isolates scoring. |
| 23 | Joint blend/regression-target grid, worse with increased target weight | Kill stands for a noisy first-lineup regression target | Boundary targets mean-centre future first lineups, including teams not yet named in Opening Round. The target proxy also conflates PAV level and regression. |
| 24 | Convex tail maps and team exclusions | Kill stands for tested margin maps; team-dependent tails warrant diagnosis | Excluding teams after seeing residuals does not prove their causal mechanism. Convex sign-preserving maps cannot win tips. |
| 25 | Added 828 early matches and era-stratified paired bootstrap | Pairing and fixed era sizes improve uncertainty estimates | Match resampling ignores temporal dependence. Early has since been used for selection. No longer a fresh confirmation window. |
| 26 | Binary interstate travel and rest; travel gain about 0.0002 | Kill stands for binary flags and tested positive rest slopes | Rest slope -0.57, t=-1.48, did not support the positive sweep. Binary travel is a weak proxy for kilometres and timezones. D1 follows Plan 008. |
| 27 | 48 monotonic round-phase blend schedules | Kill stands for this family; no configuration beat baseline coherently across eras | Does not test revalued lineup changes or early-only age. Do not resurrect the same ramp without new information. |
| 28 | Shot-Elo full dose improved primary about 0.0034 and early 0.0064 | Park was consistent with a sub-bar primary gain and pooled CI [-0.0102,0.0009] | The 3.64 conversion constant used evaluation-era data. Keep it fixed for reproduction and flag the exposure. A2 and B1 test dose and update mechanism. |
| 29 | PAV/rating-points correlations, no incremental model test | High correlation alone cannot kill the rating-points feature | Season totals share exposure volume. Rate correlation 0.764 leaves possible increment. C7 is the missing direct test. |
| 30 | Age work blocked on dates of birth | Historical blocker was real then | DOB now exists; Task 37 supersedes this status. |
| 31 | Online team offsets plus shot Elo, significant pooled LL gain | Margin calibration improved on the reused historical pool | Promotion bundled mechanisms before a stable tips guard. Claim that scoped and full warm-up are equivalent ignored missing gap-year priors. A4 separates dose, carry and tail use. |
| 32 | Tips-first rerank found v4 down nine recent tips | Reversion honoured the product objective | Calling nine lost tips definitively non-noise without a paired test was too strong. The product veto can still be a fixed point-estimate rule. A4 uses full 2026. |
| 33 | Classified misses; neutral HA gained one pooled tip | A small neutral effect survived the narrow test | The >=80% consensus kill was missed at 79%, and another cluster remained. Substituting the kill's spirit after results was not preregistration. No proof of an irreducible model ceiling. |
| 34 | Market matchup on a selected set of disagreements | Market won 17/24 in the cited comparison | Task 38 reverses this to 7/24. Closing market versus reconstructed v3 is not a contemporaneous upper bound. The market-independent product decision stands. |
| 35 | Walk-forward ridge/logistic/shrink stacking over existing features | Kill stands; both LL and tips were worse | A lite replica correlated 0.99 but differed by several margin points, so it did not prove exact engine equivalence. New-feature stacking requires a new surviving feature first. |
| 36 | Selected OD k/weight/RTM/HA, then checked early | OD's pooled historical tip gain is 18, not 12 | LL point direction and CI orientation were mixed. Split-state mechanism attribution fails the scalar identity test. A1/B3 rerun fixed/reverse choices. |
| 37 | Age ratios among players with PAV>3 in both seasons | Original implementation's LL reversal justified no promotion | Selection excludes exits and poor next seasons. K15 prior still weighs 68.2% after seven team games, contrary to the R8 argument. Full-dose confirmation did not follow selection of quarter dose. C6 tests the named resurrection conditions. |
| 38 | Wheelo head-to-head, parameter fit and roadmap | Close-game disagreements and team biases justify targeted probes | The panel already included team-season fixed effects on both models. Correlation of ratings with stats does not identify Wheelo's update rule. Repeat the panel, do not describe it as a new adjustment. |
| 38a | Online residual venue means, small-sample shrinkage | Primary gains reversed in early, supporting no promotion | Primary -4 tips is not pooled -4; early adds 3/4, yielding -1/0. Running averages of corrected residuals do not converge to zero correction error. A5 tests alternatives. |
| 38b | Primary plus partial 2026 replaced the early/primary pool | The newer point estimate was encouraging, not proof of significance | Changing pool composition is not pure sample growth. No new CI was computed, and more data need not exclude zero. A1 computes two- and three-stratum CIs. |
| 38c | Shot Elo rechecked on 121 games in 2026 | Re-park was understandable at small n, with an explicit later kill | Reported recent tips were -4. A2 applies the stated full-2026 condition without changing it after the result. |

### Advisor plans and branch implementations

| Plan | Audit | Consequence |
| --- | --- | --- |
| 001 | Exact ID-set pairing is good. Loader unions latest files across every hash, potentially mixing models/scopes, and its sanity tolerance permits one tip/0.001 LL mismatch | Campaign uses explicit filenames and exact assertions. June pooled contrarian +1 masked 2026 -2; full-season and R14 cuts are mandatory. Sources need unique source/game keys. |
| 002a | Weather coverage work depended on obsolete match columns | Current observed and retained forecast rows have distinct provenance. Non-null coverage is not pre-match availability. |
| 002b | Coarse observed wet/dry residual test reversed across eras; close difference 2.4pp missed its 3pp bar | NO-GO stands for this test. The claim that weather is exhausted does not follow. Roof, forecast surprises and update reliability were not tested. |
| 003 | Pull export was a reasonable bounded deliverable; actual ingest contract was inferred from the read API | Per-game locking is inferred, not established by an hourly fetch statement. No external submission is authorised in this campaign. |
| 004 | Typed scorer keeps draws correct for comp totals and excluded in close signs | Golden Python equality proves parity with that script, not independent correctness. Candidate-defined close sets are unsuitable for paired model comparisons. |
| 005 | Integration plan predates current Worker and assumes old branch diffs are safe | Do not merge. Its operational checklist is not a research dependency. |
| 006 | October bundle was concrete but depends unnecessarily on branch integration | Early direction, pooled point thresholds and neutral-tip summaries drift between notes. The campaign freezes one numerical interpretation before execution. |
| 007 | Competition pipeline guidance is stale relative to the existing Worker | Record deployment/lockout uncertainty, but do not implement or contact anyone. |
| 008 | The claim of absent geodata came from a narrow SELECT, not database inspection | Current schema has coordinates/timezones. The two-test prose and weaker final GO rule differ; report both verbatim interpretations. Binary flags did not exhaust this question. |
| 009 | Monitor scheduling hardcodes 2026 and distinguishes few failure classes | This is operational debt, not a reason to block experiments or silently add a new deployment. |

The advisor branch verdict on 2026 already used rounds 1-17 on June 30.
That extends the known OOS contamination beyond round 14. No later
September design should call all R14+ outcomes untouched.

## Methodology

## Frozen candidate registration

All variants use the same frozen data and three separate config directories.
The bare ID scores 2021-2025 after training 2020; `-early` scores 2016-2019
after training 2015; `-2026` scores 2026 after training 2020 and walking
2021-2025. Never score 2020. Split 2026 into rounds 0-13 and 14+ in every
analysis. A data-limited experiment retains missing-feature matches as
baseline predictions and reports its covered subset separately.

Run a family with `bun analysis/task40-campaign.ts --family A`, replacing
the letter with B, C, D, E or F. Run all with
`bun analysis/task40-campaign.ts`. `--ids` accepts comma-separated base IDs
to resume a subset without changing its registration. Score with
`bun analysis/task40-score.ts`. The runner writes validated config JSON and
hash-matched results under each new directory, refusing any overwrite.
The analysis scripts are the authoritative commands for fitted tables and
feature probes; ordinary config backtests remain available for engine modes.
Preprocessing tables, coefficients and source hashes accompany results.

### Gates and verdict rules

Incumbent bar I requires primary candidate-minus-v3 LL below -0.005,
early LL below zero with magnitude in [0.5, 1.5] times primary's magnitude,
and primary/early era-stratified pooled LL CI wholly below zero. Use the
engine bootstrap, seed 42, 1,000 draws. Require nonnegative primary/early
pooled tips, nonnegative pooled tips after adding R14+, nonnegative recent
2024-2026 tips, and R14+ LL at most zero with nonnegative tip delta.
Consensus-wrong tips over paired primary plus full 2026 must be nonnegative
with at least 30 decisive matches. Report primary, full 2026 and R14+
separately. Require each team's increase in absolute mean signed residual
to be at most 2 points at n>=50, on both historical and extended pools.
Report all venues, without hiding small samples. Close bands always use
the incumbent's absolute margin below 12, never a candidate-selected set.

The corrected bar C retains I, adds pooled LL below -0.005, applies the
correct normal head to candidate and incumbent, reports draw exclusion and
half-target sensitivity, and requires a negative round-block LL upper CI.
Report family-wise Holm-adjusted evidence across tested candidates. No
September-selected candidate can satisfy the prospective requirement using
already disclosed 2026 outcomes. A survivor is PARK for a frozen 2027 trial,
even if it clears I. Pre-existing frozen OD can be labelled an I survivor,
but its exposed OOS evidence must remain explicit.

A non-improving primary or early LL, any negative required tip guard, or
team-bias failure is KILL for this registered implementation. Improvements
that miss the size, precision, coverage or prospective gate are PARK.
PROMOTE-CANDIDATE requires every applicable gate. A missing required input
after two documented read-only attempts is BLOCKED, never imputed from
future outcomes. There is no unregistered dose search after failure.

### Exact variant definitions

Unlisted parameters inherit v3. New fields below are optional, with absence
bit-identical to existing configs. The OD base inherits `od-w100-k008`.
Every ID below receives the early and 2026 suffixes, except where noted.

| Family | Exact IDs and change | Mechanism and fixed kill scope |
| --- | --- | --- |
| A1 | `t40-od`, exact OD base | Re-adjudicate the frozen update, no new tuning. I and C. |
| A2 | `t40-shot-025/050/075/100`, `elo.shot_margin_weight` 0.25/0.5/0.75/1 | Target becomes actual times 1-w plus 3.64 times shot difference times w. I and C; full-dose 2026 LL>0 or tips<0 also triggers T38c's original kill. |
| A3 | `t40-ha-neutral`, `t40-ha-bucket`; flat `t40-ha-070/090/100` | Neutral uses Task 33's declared-home-ground exception and zero HA. Bucket uses neutral 0, same-state derby at MCG/Marvel 20, home-local/away-interstate 110, otherwise 80 rating points. Flat doses change only prediction HA. I and C. |
| A4 | `t40-offset-v4`; `t40-offset-k08/k16`; `t40-offset-c0/c1`; `t40-offset-tail` | Clone v4. Smaller k is 8/16 versus 32; carries are 0/1 versus 0.5. Tail uses the v4 update formula against its emitted prediction, but applies the offset only when pre-offset absolute margin exceeds 24, with a sign-preserving cap. I and C. |
| A5 | `t40-venue-team`, `t40-venue-static`, `t40-venue-geo` | Team-venue running residual mean, ridge 32 appearances, half residual to each team, carry 0.5, actual minus pre-correction prediction. Static uses `deriveVenueHA` on 2010-2019 with shrinkage 0.5. Do not treat the overlapping early results as confirmation. Geo buckets use <150 km local base distance: both local 20, only home local 110, only away local -30, neither local 0. I/C, static PARK without independent early confirmation. |
| B1 | `t40-od-shot-025/050/075/100`, `elo.od.shot_score_weight` doses | Same targets as A2 in score-residual updates. I and C. |
| B2 | `t40-od-ha-060/100/120`, `t40-od-ha-bucket` | OD with independent prediction HA 60/100/120, or A3 buckets. Update HA remains 10 scoreboard points. I and C. |
| B3 | `t40-od-reverse-k04/k08/k12-r10/r20/r40`, full Cartesian grid | Select lowest early LL, ties within 1e-12 resolved by ID. Confirm selected config only on primary and R14+. Show all grid results and selection optimism; I/C apply to selected variant. |
| C1 | `t40-lineup-delta` | `pav.signal=lineup_delta`. Subtract the mean of previous same-season named lineups, all revalued at the current pre-match player PAV. No previous lineup means zero delta. Elo stays at weight 0.6. I and C. |
| C2 | `t40-position` | `pav.position_weight=1`. Forward zone weights off/mid/def=1.5/1/0.5, defender=0.5/1/1.5, midfielder=0.75/1.5/0.75, INT/SUB/unknown=1/1/1. I and C. |
| C3 | `t40-tog` | `pav.tog_weight=1`. Multiply each player's PAV by previous five appearances' mean TOG divided by 80, clipped [0.5,1.25]. No prior appearance means factor 1. Never use target-match TOG. I and C. |
| C4 | `t40-position-prior` | `pav.position_prior_k=5`. Prior=(n*individual prior+5*previous-season position mean)/(n+5), n previous-season appearances. Position is the player's modal prior-season role. No role cohort falls back to league prior mean, and no prior data to flat 5. I and C. |
| C5 | `t40-rich-involvement/intercepts/pressure/shots` | `pav.involvement_feature` selects one addition: off+=3*score_involvements; def+=12*intercepts; mid+=3*pressure_acts; replace goals*6+behinds with 3.64*shots_at_goal. Each changes player and team involvement denominators together, only after matches. Null means legacy formula. Pressure available 2017+, so report partial early coverage. I and C. |
| C6 | `t40-age-r4`, `t40-age-zone`, `t40-age-k30`, plus `t40-prior-k30` control | Weight 0.5. R4 applies only rounds 0-4. Zone curves use prior-only 2010-2014 adjacent transitions, age buckets <=22/23-27/28-31/32+, ratio of pooled next-year to previous-year zone PAV with 20 pseudo-pairs at ratio 1; retain next-year zeros. K30 uses existing curve jointly with prior K=30; control isolates K. I and C. |
| C7 | `t40-rating-points` | Replace player total PAV shares with prior-only mean rating_points shares, normalised to the current team PAV total, 5 pseudo-appearances at prior-season league mean. Use last season plus current past games; never today's rating. I/C tests increment beyond season-total correlation. |
| D1 | `t40-travel-probe` | Read-only Plan 008 slopes and close split. Signed timezone shift is venue offset minus home-base offset. Test 1 requires absolute slope >=1 point/1000km or >=1.5/hour, primary 95% CI excludes zero and early same sign. Test 2 requires high-travel minus rest tip gap CI excludes zero, same direction. Report the plan's weaker GO rule, Test 1 plus Test 2 direction, and the stronger both-tests rule separately. NO-GO is KILL for this probe, GO is PARK for predictive follow-up. |
| D2 | `t40-quarter`, `t40-minutes` | OD update target blend weight 0.5. Quarter control target is 4 times mean of the four quarter margins, with final quarter downweighted 0.5 and weights renormalised. Minutes target is 36*(homeMinutes-awayMinutes)/120, clipped [-36,36]. Missing inputs use actual margin. Post-match update only. No pre-2020 quarter confirmation; PARK at best if I's early gate is unavailable. |
| D3 | `t40-weather` | On unroofed venues, surprise=max(0,observed rain-forecast rain); OD update k scaled by 1/(1+0.25*surprise), floored at 0.5. Forecast timestamp must precede kickoff. Roofed venues unchanged. Missing or post-kickoff forecast uses baseline update. Report coverage, observed/forecast interactions and roof cuts. No adequate historical forecast coverage means BLOCKED for a promotion-capable test, not evidence that weather has no effect. |
| D4 | `t40-rushed` | OD update target subtracts home-rushed minus away-rushed from actual margin, then adds half that difference back. This discounts half of non-shot scoring while retaining pressure credit. Missing values use actual. I/C with covered-era reporting. |
| E1 | `t40-derived` | Fit training-only scalar residual gain by method of moments: R is residual variance around team-season mean margins; Q=max(0,variance of adjacent team-season mean changes minus sampling variance). P=(-Q+sqrt(Q*Q+4*Q*R))/2, gain=(P+Q)/(P+Q+R), clipped [0.01,0.15]; OD k=2*gain. RTM is 1 minus training adjacent-season slope, clipped [0,1]. Fit 2010-2014 only, before scored windows. I and C. |
| E2 | `t40-points` | `elo.points_residual_k=0.04`, HA=10 points, RTM=0.2. Single state in points transformed to Elo scale for the existing blend. Must match OD margins within 1e-10 before scoring. Numerical failure is an implementation bug, not a model result. I/C identical to A1 if identity holds. |
| E3 | `t40-finals-ha`, `t40-finals-k`, `t40-finals-both` | For round_type other than Regular, prediction HA=0, update K multiplier=1.5, or both. No finals-specific fitting. Apply to scalar and OD gains consistently. I/C; report finals subset and full windows. |
| F1 | `t40-cdf`, plus `t40-sigma-032/040` diagnostic controls | Correct head sigma36; controls use legacy sigma32/40. Recompute every candidate with matched standard-normal baseline sigma36. No sign change means PARK for comp promotion regardless of LL. |
| F2 | `t40-pav-current/normalized/corrected` | `pav.league_average=current_season` starts each season's league totals at zero; `pav.normalize_zone_pools=true` divides each zone strength by current mean strength across teams that have played. Combined enables both. I and C. |

No stacked head is authorised by a mere point-estimate gain. Only a new
information feature that clears its registered univariate test permits a
subsequent pre-registered stack. If several I survivors exist, freeze
pairwise comparisons and additive combinations before running them. Keep
the single-change recommendation separate from a bundle's performance.

Implementation clarifications frozen before these variants run: E2 expresses
the 10-point update HA as `elo.home_advantage=10/0.07`, with
`elo.points_residual_k=0.04` and `elo.regression_to_mean=0.2`. D2/D4 use
`elo.od.update_target=quarter/minutes/rushed`; D3 uses
`elo.od.weather_luck_weight=0.25`. A missing quarter, minutes or rushed
value leaves the observed update target unchanged. Forecast errors are
constructed only when the retained forecast's timestamp precedes the
venue-local scheduled kickoff and the roof is `none`.

The CLI's old historical cache omits newly selected stat columns. Use the
campaign runner and frozen supplementary snapshot for these experiments.
A fresh CLI rich-stat backtest requires `--no-cache`; the weather surprise
preprocessing is currently analysis-only. No weather config is ready for
deployment merely because it can be replayed here.

## Methodology details

### Correctness checkpoint and frozen inputs

`analysis/task40-data.ts` froze 3,475 fixtures from 2010-2026 plus their
stats, lineups, prior PAV and dimensions. The temporary snapshot is
`/tmp/tipper-task40-data.json`, SHA-256
`705f3d2bed9f5db50d726718adf41ef732d56f590255041590f77a6849bbdd17`.
`bun analysis/task40-audit.ts` reproduced every persisted prediction field
for all four historical baselines, not merely their rounded metrics.
Evidence is in `analysis/task40-audit-results.json`.

The probability function is not a normal CDF. At z=0.5 it returns
0.728328 instead of 0.691462; at z=1 it returns 0.870329 instead of
0.841345. An independent Simpson integration verifies these reference
values against the [NIST normal density definition](https://www.itl.nist.gov/div898/handbook/eda/section3/eda3661.htm).
Severity: biases comparison and invalidates the claimed meaning of sigma.
The repair will expose an optional `output.probability_model` value
`standard_normal`. Absence retains the explicitly labelled legacy head,
so historical identities remain reproducible. Every campaign candidate
will be evaluated against an incumbent with the same probability head.
No probability-only repair earns a tips-based promotion recommendation.

OD reduces to `q=(attack-concede)/2`, with home update
`q += k/2 * (actualMargin - (qHome-qAway+ha))` and the opposite away update.
The scalar and split implementations agree within 3.20e-14 points over
the frozen 2010-2026 fixture set. Separate scoring totals cancel exactly.
Severity: the ledger's mechanism attribution is wrong; the measured gain
remains real as a point estimate.

Current data has zero missing local times in every fetched year, including
2026. The supplied NULL-time premise is stale. The early window has nine
missing lineups in each of 2017, 2018 and 2019. No row contradicts the
contract that `is_substitute` covers INT and SUB. The suspected starting-18
filter bug is withdrawn. Post-change lineups still lack deadline snapshots,
so historical availability at Thursday lock cannot be established.

The upstream PAV formula normalises each zone to 1,800 across 18 teams.
The engine approximates each team pool as 100 times its zone strength.
These are close but not identical units. With current-season league totals,
2025 engine zone sums are 1789.53, 1805.57 and 1797.81 versus upstream
1800.17, 1799.98 and 1800.07. Mean absolute player total error is 0.0113.
There is no factor-of-100 mismatch left. A separate normalisation experiment
will measure the approximation and accumulated-league effects.

The present train-only calibration method returns slope 10.1867 on 2020,
not 6.984 or 6.986. Single-season fits are 15.2923 on 2015, 12.8150 on
2019 and 14.3447 on 2025. They are cold fits without previous-year priors,
not comparable independent estimates of the promoted joint blend slope.
The 2025 R10 live path differs from backtest margins by up to 0.0226 points
because it accumulates training-year PAV. This is an implementation mismatch,
even though the observed effect is small.

### Repair pre-registration, before repaired results

F1 will compare legacy probabilities with a correct standard normal head,
sigma 36 unchanged. Use `t40-cdf`, `t40-cdf-early` and `t40-cdf-2026`.
F2 will compare current-season league totals and exact zone-pool
normalisation, individually and together, with legacy PAV. Configs will be
`t40-pav-current`, `t40-pav-normalized`, `t40-pav-corrected`, each with
`-early` and `-2026` variants. The campaign runner will create these configs
and score both probability heads. Commands will be
`bun analysis/task40-campaign.ts --family F` and
`bun analysis/task40-score.ts`.

F1 cannot change winner signs and is therefore PARK for competition
promotion regardless of LL. It is a correctness repair, not evidence of a
better tipping model. F2 uses the incumbent gates below. A non-improving
primary or early LL, or any tips/bias guard failure, is KILL for promotion;
improvement without sufficient precision is PARK. Correctness work is not
undone merely because a wrong implementation scores better on reused data.

Clear missing priors at every boundary, protect the empty venue mean, and
align live training semantics with backtest. These are bug fixes, not
selected candidates. Fetch all warm-up priors for residual-learning models.
Assert v3's historical hash and records after each change. Record changed
scoped candidate results against newly generated matched baselines.

The corrected promotion standard adds a positive tipping rationale, a
season/round-block uncertainty sensitivity check, and genuinely prospective
confirmation to all incumbent gates. September-designed candidates cannot
be validated prospectively on the already exposed 2026 season. Report
incumbent-bar success separately, and PARK such survivors pending a frozen
2027 trial. Never lower a gate after inspecting a candidate result.

Candidate deltas will consistently mean candidate minus incumbent. Negative
LogLoss deltas improve probability scoring; positive tip deltas improve the
competition score. Report primary 2021-2025, early 2016-2019, 2026 rounds
0-13, and 2026 round 14 onward separately. Never score 2020.

The supplied September 2026 v3 and OD results already disclose full-season
performance. June reports also inspected round 14. Treat the nominal R14+
gate as later temporal evidence, and audit its exposure history before calling
it untouched confirmation. New September designs cannot acquire independence
by labelling already-observed 2026 results out of sample.

Every candidate needs a written mechanism, exact config, runnable command,
numeric gates and kill condition before its first campaign result. Preserve
the incumbent standard alongside any corrected standard. Probability-only
repairs require separate accounting because they cannot change winner signs.

## Completion checklist

- [x] Read the complete supplied campaign instructions.
- [x] Create `research/adversarial-campaign-2026-09` from current HEAD.
- [x] Reproduce the four specified historical baselines.
- [ ] Finish the ordered source, ledger, advisor-plan and analysis-script reads.
- [ ] Audit leakage, lineups, ordering, priors, PAV units and calibration.
- [ ] Quantify power, selection bias, residual cuts and scoring sensitivity.
- [ ] Fix outright bugs and record baseline identity or complete re-baselining.
- [ ] Audit every Task 15-38c and both rounds of advisor plans.
- [ ] Pre-register every required candidate class A-F and its exact variants.
- [ ] Run each candidate, its windows and all regression guards.
- [ ] Produce team/venue tables and the Wheelo fixed-effects re-fit.
- [ ] Check any surviving candidates pairwise and in combination.
- [ ] Finalise verdicts, recommendation and unresolved experiments.
- [ ] Add a mechanism sketch and result figure for every candidate.
- [ ] Append HANDOFF and add only the campaign's CHANGELOG entry.
- [ ] Pass typecheck, check and test; preserve protected files.
- [ ] Render, inspect and open `docs/task-40-report.html`.
- [ ] Commit only campaign-owned files and changes. Do not push.

## Running log

### 2026-09-05

Started at HEAD `8b7ed5b`. The worktree contains the unrelated documentation
lint pass described in the brief, plus two supplied September 2026 results.
Preserve those files and exclude their existing changes from campaign commits.

Created the requested local branch. `bun install --frozen-lockfile` and
`bun run build` pass. Sandbox DNS blocked the first baseline attempts.
Network-enabled retries succeeded. All four historical baselines reproduce.
No engine changes or candidate experiments have run yet.

Completed the correctness checkpoint. Added an optional standard-normal
probability head, cleared stale priors, guarded empty venue estimates and
aligned live training with backtest. Warm-up priors now cover gap years.
All four historical result arrays remain exact replicas after each engine
change. The checked live/backtest difference is now exactly zero.
`bun run typecheck`, `bun run check` and `bun run test --run` pass, with
199 tests in 20 files. Lint and test discovery now exclude nested `.claude`
checkout copies; lint also excludes the unrelated generated `.rumdl_cache`.
No source, cache or history inside those directories was edited.

Fetched supplementary inputs read-only to `/tmp/tipper-task40-extra.json`:
107 venues, 3,475 matches, 3,532 weather rows and player-stat rows by season.
No new model candidate results have been computed yet. F1/F2 are registered
above; the remaining candidate matrix follows the completed ledger review.

Completed the first 39 variants, each on all three windows, at engine commit
`c115982`. Stored results include the frozen source hash and full config hash.
`analysis/task40-score-stage1.json` contains exact metric checks, historical
and extended paired CIs, round-block CIs, both probability heads, every
season, team and venue, and the consensus guards. No historical results were
overwritten. Source snapshots contain no 2016 field tips; the consensus gate
uses its registered primary/full-2026 scope, not fabricated early coverage.

V3 has 152 tips in 211 scored 2026 matches. OD has 153, full-dose shot Elo
150, and v4 146. T38c's registered full-season kill is met. OD's historical
pooled LL delta is -0.005433 with CI [-0.011012,0.000785]; adding R14+
gives -0.005543 with CI [-0.011347,0.000400]. More data did not resolve
its uncertainty. The early-selected reverse-grid variant is k=0.12,
RTM=0.4, but it loses two consensus-wrong tips and fails that guard.

One first-batch variant clears all incumbent numerical gates,
`t40-od-shot-075`. Its corrected-head and prospective status must remain
separate from that fact. Other registered candidate families are unfinished;
this is not a final recommendation.

The corrected normal head reduces OD-shot0.75's primary LL improvement
from 0.006891 to 0.003810. Its historical pooled corrected-head CI is
[-0.008939,0.001898]. It therefore fails the corrected numerical bar as
well as lacking prospective confirmation. The incumbent numerical pass is
real under its frozen definition; it is not a validated promotion.

Ran rich-involvement and PAV-accounting variants at `858b0bf`. Primary
LL changes are small, from -0.000089 for pressure to +0.000070 for
score involvements. Neither a direct rich statistic nor exact zone pools
has yet shown a promotion-sized effect. Full guards remain to be scored.

`bun analysis/task40-travel.ts` completed Plan 008, recorded in
`analysis/task40-travel-results.json`. All 20 primary and 22 early venues
map, and the historical binary counts exactly reproduce 1115 away-only,
17 home-only, 165 both-travelled and 593 both-local matches. Primary
residual slope is 1.066 points/1000km, CI [-0.935,3.001], and 4.121
points/timezone hour, CI [1.652,6.851]. The early timezone slope has the
same sign. Close-game high-travel accuracy is 5.50pp lower in primary
but 2.32pp higher in early, so both the weak and strong Plan 008 rules
return NO-GO. This kills the registered probe, not all travel modelling.

Remaining execution includes lineup signal shape, position/TOG/shrinkage,
age variants, rating points, team-venue interactions, quarter/minutes,
weather/roof, rushed behinds, derived/scalar gains and finals gain. The
power/selection audit, complete result figures, final report and handoff
are also unfinished. Do not infer campaign completion from these checkpoints.

## Appendix: commands and provenance

```sh
bun install --frozen-lockfile
bun run build
bun run dist/cli/index.js backtest -c predha-080
bun run dist/cli/index.js backtest -c predha80-early
bun run dist/cli/index.js backtest -c v4-shotoff
bun run dist/cli/index.js backtest -c od-w100-k008
```

These commands created new results files. Do not rerun them through the CLI
on the same date and hash, because its writer would overwrite the files.
Subsequent reproduction checks must call `runBacktest` without saving or use
new campaign config directories.

The full task is specified in
`/Users/jackmcpherson/.codex/attachments/4d26770e-5743-4bf5-9647-cf261581bf37/pasted-text-1.txt`.
This checklist tracks that task without replacing its requirements.
