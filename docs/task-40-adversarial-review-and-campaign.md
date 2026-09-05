# Task 40: Adversarial review and experiment campaign

This report audits the promoted AFL model and its research ledger for Jack's
2027 Squiggle entry. The competition objective is correct winner picks.
The campaign tested 66 variants and diagnostics on three matched windows.
No candidate cleared the corrected promotion standard.

## Executive summary

Keep `predha-080` as the competition model. Freeze plain OD as the single
challenger for a prospective 2027 trial, with deadline snapshots captured
before results. Do not promote from this campaign.

V3's four required historical baselines reproduce exactly, including every
stored prediction field. Its probability function is not a normal CDF.
The live path also accumulated training-year PAV that the backtest skipped.
That mismatch, stale prior maps, unseen-venue division and unsafe bootstrap
pairing are repaired. New prediction and update modes are optional. The
promoted hash remains `2641f46f`, with 716 primary tips and 0.848459853 LL.

The ledger credited OD's gain to separate attack and defence information.
The consumed state is algebraically a scalar margin-residual update.
Several historical kills were broader than their tests, and several gates
were relaxed after results. Direct tests now close the main gaps.

Plain OD adds 18 historical tips and one full-2026 tip, but its pooled
LL interval still includes zero. OD-shot0.75 alone clears the incumbent
numerical gates. With a correct, matched normal head its pooled improvement
falls below 0.005 and its interval includes zero. It also loses ten
historical tips against plain OD. No new feature qualifies for stacking.

V4 still loses six tips in 2026. Every tested offset variant loses recent
tips. Age, rating points, lineup delta, position weighting and the travel
probe provide no validated replacement. Forecast-weather promotion testing
is blocked by absent historical forecasts. Its limited 2026 run completed.

The nominal R14+ gate has 97 matches, but earlier advisor work already
inspected rounds through 17 and this request disclosed full-2026 results.
It is later temporal evidence, not untouched September confirmation.

## Candidate verdict table

The following ranking is frozen before campaign candidate results. Rank
reflects likely close-game value, prior evidence and implementation cost.
Each row expands into the fixed doses listed in the registration below.
The generated variant sections below give exact results, confidence
intervals, guards, files and verdicts. Family verdicts never promote a
family merely because one dose has an attractive point estimate.

| Rank | Candidate | Hypothesis and sign mechanism | Config prefix | Command family | Result | Verdict |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | A1 OD re-adjudication | Margin residual updates can correct close-game team ordering | t40-od | A | 1 completed; 0 pass I | PARK |
| 2 | A2 Shot Elo doses | Discount conversion luck before updating team ratings | t40-shot | A | 4 completed; 0 pass I | KILL |
| 3 | B1 OD shot targets | Discount conversion luck in OD's residual update | t40-od-shot | B | 4 completed; 1 pass I | PARK |
| 4 | A3 Bucket and neutral HA | Reduce false home advantage at shared or displaced grounds | t40-ha | A | 5 completed; 0 pass I | KILL |
| 5 | B2 OD HA and buckets | Calibrate the prediction intercept for a different rating update | t40-od-ha | B | 4 completed; 0 pass I | PARK |
| 6 | B3 Reverse OD selection | Stable learning rate and carry should survive reversed selection | t40-od-reverse | B | 9 completed; 0 pass I | PARK |
| 7 | C1 Lineup delta | Player ins and outs matter beyond team quality already in Elo | t40-lineup-delta | C | 1 completed; 0 pass I | KILL |
| 8 | C2 Position weights | Named roles identify which PAV zones will matter tonight | t40-position | C | 1 completed; 0 pass I | KILL |
| 9 | C3 Prior TOG | Expected playing time distinguishes nominal from effective lineup strength | t40-tog | C | 1 completed; 0 pass I | KILL |
| 10 | C4 Position prior | Shrink noisy individual priors toward comparable roles | t40-position-prior | C | 1 completed; 0 pass I | KILL |
| 11 | C5 Rich involvement | Direct chance creation and pressure improve player credit assignment | t40-rich | C | 4 completed; 0 pass I | KILL |
| 12 | D1 Travel probe | Asymmetric travel burden leaves a replicating residual and close-game gap | t40-travel-probe | D | 1 completed; 0 pass I | KILL |
| 13 | A4 Offset repair doses | Smaller memory and tail isolation separate margin gains from harmful flips | t40-offset | A | 6 completed; 0 pass I | KILL |
| 14 | E1 Derived gain | Estimate rating noise and drift before choosing memory | t40-derived | E | 1 completed; 0 pass I | KILL |
| 15 | E2 Points residual | Scalar residual updates reproduce OD without an unsupported split-state story | t40-points | E | 1 completed; 0 pass I | PARK |
| 16 | E3 Finals HA/K | Shared finals venues and stronger information per game need different HA or gain | t40-finals | E | 3 completed; 0 pass I | KILL |
| 17 | A5 Venue alternatives | Shrunk team-venue effects or historical fixed HA outperform noisy venue means | t40-venue | A | 3 completed; 0 pass I | KILL |
| 18 | C6 Age resurrection | Early-season or zone-specific priors have a usable age effect | t40-age | C | 4 completed; 0 pass I | KILL |
| 19 | D2 Quarter luck | Sustained control is more repeatable than a last-quarter scoring burst | t40-quarter | D | 2 completed; 0 pass I | KILL |
| 20 | D3 Weather/roof | Forecast surprises alter update reliability, conditional on exposure to rain | t40-weather | D | 1 completed; 0 pass I | BLOCKED, limited run complete |
| 21 | D4 Rushed behinds | Pressure-induced scoring survives conversion-luck adjustment | t40-rushed | D | 1 completed; 0 pass I | PARK |
| 22 | C7 Rating points | A within-team player rating signal adds information despite high total correlation | t40-rating-points | C | 1 completed; 0 pass I | KILL |
| 23 | F2 PAV accounting | Current-season league totals and exact pools remove inconsistent units | t40-pav | F | 3 completed; 0 pass I | KILL |
| 24 | F1 Probability correctness | Correct probabilities change scoring only, never the winner sign | t40-cdf | F | 3 completed; 0 pass I | PARK |
| 25 | F3 Availability sensitivity | Delay same-day PAV updates to remove shared league information from overlapping fixtures | t40-pav-day-end | F | 1 completed; 0 pass I | KILL |

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

### Correctness and availability findings

| Finding | Severity and evidence | Disposition |
| --- | --- | --- |
| Incorrect normal CDF | Biases comparisons. At z=1, 0.870329 instead of 0.841345 | Optional correct head tested for every candidate. Legacy default retained explicitly for reproduction. |
| Live training-year PAV | Biases live/backtest comparison. Maximum 2025 R10 margin discrepancy 0.0226 | Fixed both orchestration paths. Nine paired margins now agree exactly. |
| Stale prior map and incomplete warm-up priors | Blocks trust in affected sparse/scoped runs | Clear each season and fetch intervening priors. Four historical baselines unchanged. |
| Accumulated league totals and approximate zone pools | Biases PAV interpretation, but small measured unit error | F2 tests current-season totals and exact normalisation separately and together. No promotion. |
| Unseen venue with min_n=0 | Blocks affected optional runs through NaN | Guarded and tested. |
| Duplicate bootstrap IDs, overlapping strata, inconsistent outcomes | Blocks trust in malformed comparisons | Fail closed, with tests. Valid historical comparisons unchanged. |
| Non-finite or negative MOV multiplier | Blocks invalid updates | Reject both cases before updating ratings. |
| Fixed 1500 regression centre with a custom initial rating | Biases nonstandard configurations | Regression and prior-target centring now respect `elo.initial_rating`. Default 1500 behaviour is unchanged and tested. |
| Local-time ordering and overlapping games | Biases pre-match availability claims. 156 UTC-order inversions across 2010-2026 | F3 delays shared PAV updates until the next day. No tip changed in the scored windows. This bounds one conservative timing perturbation, not all deadline bias. |
| Post-change lineups | Blocks exact competition-deadline validation | No archived Thursday snapshots. All historical lineup experiments retain this limitation. |
| Task 23 first-lineup targets | Blocks a prospective reading of the historical optional experiment | Fixed the entry points to supply only the first fixture's lineup at the season boundary. Later teams fall back to neutral regression. V3 and all campaign candidates leave this feature off. The old all-team target still needs archived, pre-deadline rosters before any retest. |
| Starting-18 flags | Suspected bug withdrawn | All fetched INT/SUB rows carry the substitute flag. Zero counterexamples. |
| Draw conventions | Biases probability interpretation slightly | Report legacy, half-target and draw-excluded LL. Tips exclude draws throughout; adding universal comp draw credits leaves paired tip deltas unchanged. |

Predictions precede their own Elo, OD and PAV updates. Opponent-quality
inputs use pre-match ratings. Prior blending uses team games already played,
not round number, so a bye, split round or Opening Round does not create an
extra observation. Finals use the same denominator. K15 still has weight
15/22, or 68.2%, after seven team games.

OD at weight one does not consume the scalar Elo MOV multiplier. Scalar
Elo remains a parallel diagnostic. For partial OD mixes its dynamics still
matter, but none of the campaign's OD refinements changes that weight.
The main timing risk is shared PAV information and publication availability,
not feeding a match's own score into its prediction.

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















<!-- TASK40 GENERATED START -->

## Candidate results

Every delta is candidate minus v3. Negative LL and positive tips improve the score.
Each named variant was frozen before its first run. The original registration
and commit history remain the authority for its hypothesis and kill rule.

### t40-age-k30: KILL

non-improving primary LL, non-improving early LL.

Mechanism: DOB and prior PAV → Age/zone prior scaling → Early rating signal.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-age-k30 mechanism"><title>t40-age-k30 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">DOB and prior PAV</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Age/zone prior scaling</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Early rating signal</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
pav.prior_weight_k=30
pav.age_curve_weight=0.5
```

Run: `bun analysis/task40-campaign.ts --ids t40-age-k30`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 716 | 0 | +0.002486 | 0 / 533 |
| Early 2016-2019 | 828 | 557 | +3 | +0.002111 | +3 / 410 |
| 2026 R0-13, burned | 114 | 83 | -1 | -0.000658 | -1 / 48 |
| 2026 R14+ | 97 | 68 | 0 | +0.003746 | 0 / 35 |
| Full 2026 | 211 | 151 | -1 | +0.001367 | -1 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-age-k30 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="295.3330635465852" x2="295.3330635465852" y1="20" y2="143" class="zero"/><line x1="186.74790665573448" x2="186.74790665573448" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="294.8555785763773" x2="405.14075368593944" y1="38" y2="38" class="interval"/><circle cx="349.33208426967076" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">+0.002486; tips 0</text><text x="5" y="85">Early</text><line x1="276.46203213872025" x2="406.9790487924341" y1="80" y2="80" class="interval"/><circle cx="341.1863096589324" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">+0.002111; tips +3</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="376.68583691795277" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">+0.003746; tips 0</text><text x="160" y="165" class="small">-0.0062</text><text x="610" y="165" text-anchor="end" class="small">+0.0145</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL +0.002322, 95% CI [+0.000265, +0.004357].
With R14+ as a third stratum: +0.002392, CI [+0.000272, +0.004384].
Historical round-block CI [+0.000126, +0.004382].

Correct normal head: historical pooled LL +0.001943,
CI [+0.000235, +0.003645]. Round-block CI [+0.000118, +0.003611].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +1. Consensus-wrong tips
+3 / 342 paired games; primary +4 / 291,
full 2026 -1 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Geelong,
+0.721 points at n=221; allowed maximum +2.
Historical LL draw sensitivity: half-target +0.002269.
Primary excluding draws +0.002509; early +0.002056.

Evidence files, with effective config hashes:

- [t40-age-k30 config](../configs/t40-age-k30/config.json), [full result 8635b3f1](../configs/t40-age-k30/results-2026-09-05-8635b3f1.json).
- [t40-age-k30-early config](../configs/t40-age-k30-early/config.json), [full result 201c393a](../configs/t40-age-k30-early/results-2026-09-05-201c393a.json).
- [t40-age-k30-2026 config](../configs/t40-age-k30-2026/config.json), [full result ca5733e7](../configs/t40-age-k30-2026/results-2026-09-05-ca5733e7.json).

### t40-age-r4: KILL

non-improving primary LL, non-improving early LL, recent tip regression, consensus-wrong guard.

Mechanism: DOB and prior PAV → Age/zone prior scaling → Early rating signal.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-age-r4 mechanism"><title>t40-age-r4 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">DOB and prior PAV</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Age/zone prior scaling</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Early rating signal</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
pav.age_curve_weight=0.5
pav.age_curve_max_round=4
```

Run: `bun analysis/task40-campaign.ts --ids t40-age-r4`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 716 | 0 | +0.000026 | 0 / 533 |
| Early 2016-2019 | 828 | 555 | +1 | +0.000040 | +1 / 410 |
| 2026 R0-13, burned | 114 | 83 | -1 | +0.000522 | -1 / 48 |
| 2026 R14+ | 97 | 68 | 0 | 0.000000 | 0 / 35 |
| Full 2026 | 211 | 151 | -1 | +0.000282 | -1 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-age-r4 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="497.5" x2="497.5" y1="20" y2="143" class="zero"/><line x1="216.25" x2="216.25" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="447.99947016938864" x2="553.5681549891486" y1="38" y2="38" class="interval"/><circle cx="498.9638035945931" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">+0.000026; tips 0</text><text x="5" y="85">Early</text><line x1="435.149796541319" x2="563.6329578708903" y1="80" y2="80" class="interval"/><circle cx="499.77271711504136" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">+0.000040; tips +1</text><text x="5" y="127">2026 R14+</text><line x1="497.5" x2="497.5" y1="122" y2="122" class="interval"/><circle cx="497.5" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">0.000000; tips 0</text><text x="160" y="165" class="small">-0.0060</text><text x="610" y="165" text-anchor="end" class="small">+0.0020</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL +0.000032, 95% CI [-0.000663, +0.000786].
With R14+ as a third stratum: +0.000031, CI [-0.000639, +0.000699].
Historical round-block CI [-0.000513, +0.000630].

Correct normal head: historical pooled LL +0.000026,
CI [-0.000528, +0.000650]. Round-block CI [-0.000432, +0.000502].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -2. Consensus-wrong tips
-1 / 342 paired games; primary -1 / 291,
full 2026 0 / 51, R14+ 0 / 23.

Largest eligible absolute team-bias worsening: Gold Coast,
+0.134 points at n=203; allowed maximum +2.
Historical LL draw sensitivity: half-target +0.000048.
Primary excluding draws +0.000065; early +0.000041.

Evidence files, with effective config hashes:

- [t40-age-r4 config](../configs/t40-age-r4/config.json), [full result ba02c71a](../configs/t40-age-r4/results-2026-09-05-ba02c71a.json).
- [t40-age-r4-early config](../configs/t40-age-r4-early/config.json), [full result 7327877f](../configs/t40-age-r4-early/results-2026-09-05-7327877f.json).
- [t40-age-r4-2026 config](../configs/t40-age-r4-2026/config.json), [full result 2526ed12](../configs/t40-age-r4-2026/results-2026-09-05-2526ed12.json).

### t40-age-zone: KILL

non-improving primary LL, non-improving early LL, recent tip regression, R14+ tip regression.

Mechanism: DOB and prior PAV → Age/zone prior scaling → Early rating signal.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-age-zone mechanism"><title>t40-age-zone mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">DOB and prior PAV</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Age/zone prior scaling</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Early rating signal</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
pav.age_curve_weight=0.5
pav.age_zone_ratios=[[1.1556723408864842,1.1696203961398814,1.1441861752600728],[0.9104291666306297,0.9345527910503828,0.9260151137499],[0.8066711584323716,0.8174735337929652,0.8244959758381014],[0.6555943405969225,0.6148849222901157,0.6625991420356028]]
```

Run: `bun analysis/task40-campaign.ts --ids t40-age-zone`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 718 | +2 | +0.000804 | +2 / 533 |
| Early 2016-2019 | 828 | 559 | +5 | +0.000914 | +5 / 410 |
| 2026 R0-13, burned | 114 | 82 | -2 | +0.001000 | -2 / 48 |
| 2026 R14+ | 97 | 66 | -2 | +0.003532 | -2 / 35 |
| Full 2026 | 211 | 148 | -4 | +0.002164 | -4 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-age-zone per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="367.7873858114192" x2="367.7873858114192" y1="20" y2="143" class="zero"/><line x1="194.63123096856987" x2="194.63123096856987" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="341.7226639617527" x2="453.79861526777864" y1="38" y2="38" class="interval"/><circle cx="395.62397146055906" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">+0.000804; tips +2</text><text x="5" y="85">Early</text><line x1="332.2090499763344" x2="461.6895316344684" y1="80" y2="80" class="interval"/><circle cx="399.45207894434225" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">+0.000914; tips +5</text><text x="5" y="127">2026 R14+</text><line x1="366.1049021845379" x2="610" y1="122" y2="122" class="interval"/><circle cx="490.10620079397427" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">+0.003532; tips -2</text><text x="160" y="165" class="small">-0.0060</text><text x="610" y="165" text-anchor="end" class="small">+0.0070</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL +0.000852, 95% CI [-0.000368, +0.002087].
With R14+ as a third stratum: +0.000983, CI [-0.000210, +0.002130].
Historical round-block CI [-0.000282, +0.002120].

Correct normal head: historical pooled LL +0.001387,
CI [+0.000351, +0.002451]. Round-block CI [+0.000409, +0.002450].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -4. Consensus-wrong tips
0 / 342 paired games; primary +1 / 291,
full 2026 -1 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Geelong,
+0.811 points at n=245; allowed maximum +2.
Historical LL draw sensitivity: half-target +0.000771.
Primary excluding draws +0.000780; early +0.000865.

Evidence files, with effective config hashes:

- [t40-age-zone config](../configs/t40-age-zone/config.json), [full result e1c882e3](../configs/t40-age-zone/results-2026-09-05-e1c882e3.json).
- [t40-age-zone-early config](../configs/t40-age-zone-early/config.json), [full result b54becb8](../configs/t40-age-zone-early/results-2026-09-05-b54becb8.json).
- [t40-age-zone-2026 config](../configs/t40-age-zone-2026/config.json), [full result 5839021a](../configs/t40-age-zone-2026/results-2026-09-05-5839021a.json).

### t40-cdf: PARK

Probability-only change cannot improve the competition's winner picks.

Mechanism: Unchanged margin → Change probability head → Same winner sign.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-cdf mechanism"><title>t40-cdf mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Unchanged margin</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Change probability head</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Same winner sign</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
output.probability_model="standard_normal"
```

Run: `bun analysis/task40-campaign.ts --ids t40-cdf`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 716 | 0 | +0.004830 | 0 / 533 |
| Early 2016-2019 | 828 | 554 | 0 | +0.005455 | 0 / 410 |
| 2026 R0-13, burned | 114 | 84 | 0 | +0.009886 | 0 / 48 |
| 2026 R14+ | 97 | 68 | 0 | +0.008319 | 0 / 35 |
| Full 2026 | 211 | 152 | 0 | +0.009166 | 0 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-cdf per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="269.5990754842611" x2="269.5990754842611" y1="20" y2="143" class="zero"/><line x1="200.16031335035024" x2="200.16031335035024" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="255.39920433358" x2="407.14265872407327" y1="38" y2="38" class="interval"/><circle cx="336.6700341955616" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">+0.004830; tips 0</text><text x="5" y="85">Early</text><line x1="262.60165971039135" x2="426.7530830500209" y1="80" y2="80" class="interval"/><circle cx="345.3598642993228" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">+0.005455; tips 0</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="385.13034138822456" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">+0.008319; tips 0</text><text x="160" y="165" class="small">-0.0079</text><text x="610" y="165" text-anchor="end" class="small">+0.0245</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL +0.005104, 95% CI [+0.001209, +0.009123].
With R14+ as a third stratum: +0.005261, CI [+0.001346, +0.009140].
Historical round-block CI [+0.001106, +0.009170].

Correct normal head: historical pooled LL 0.000000,
CI [0.000000, 0.000000]. Round-block CI [0.000000, 0.000000].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips 0. Consensus-wrong tips
0 / 342 paired games; primary 0 / 291,
full 2026 0 / 51, R14+ 0 / 23.

Largest eligible absolute team-bias worsening: Adelaide,
0.000 points at n=208; allowed maximum +2.
Historical LL draw sensitivity: half-target +0.005005.
Primary excluding draws +0.005194; early +0.005426.

Evidence files, with effective config hashes:

- [t40-cdf config](../configs/t40-cdf/config.json), [full result 6a9b9cfc](../configs/t40-cdf/results-2026-09-05-6a9b9cfc.json).
- [t40-cdf-early config](../configs/t40-cdf-early/config.json), [full result ea69e2f8](../configs/t40-cdf-early/results-2026-09-05-ea69e2f8.json).
- [t40-cdf-2026 config](../configs/t40-cdf-2026/config.json), [full result 98906e3d](../configs/t40-cdf-2026/results-2026-09-05-98906e3d.json).

### t40-derived: KILL

pooled tip regression, recent tip regression, consensus-wrong guard.

Mechanism: 2010-2014 variance → Freeze gain and RTM → Walk later seasons.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-derived mechanism"><title>t40-derived mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">2010-2014 variance</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Freeze gain and RTM</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Walk later seasons</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.od.weight=1
elo.od.k=0.3
elo.od.home_advantage_points=10
elo.od.initial_score=85
elo.od.regression_to_mean=0.34805048708581976
```

Run: `bun analysis/task40-campaign.ts --ids t40-derived`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 713 | -3 | -0.001251 | -3 / 533 |
| Early 2016-2019 | 828 | 555 | +1 | -0.001076 | +1 / 410 |
| 2026 R0-13, burned | 114 | 84 | 0 | -0.019269 | 0 / 48 |
| 2026 R14+ | 97 | 68 | 0 | +0.003749 | 0 / 35 |
| Full 2026 | 211 | 152 | 0 | -0.008688 | 0 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-derived per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="351.95978296769727" x2="351.95978296769727" y1="20" y2="143" class="zero"/><line x1="318.5933885768606" x2="318.5933885768606" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="264.6284679147982" x2="428.6271186554573" y1="38" y2="38" class="interval"/><circle cx="343.6082664279022" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.001251; tips -3</text><text x="5" y="85">Early</text><line x1="248.16711256576033" x2="441.2853574606756" y1="80" y2="80" class="interval"/><circle cx="344.77642940792794" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.001076; tips +1</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="376.9753475496494" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">+0.003749; tips 0</text><text x="160" y="165" class="small">-0.0288</text><text x="610" y="165" text-anchor="end" class="small">+0.0387</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.001175, 95% CI [-0.011220, +0.008873].
With R14+ as a third stratum: -0.000934, CI [-0.010235, +0.008466].
Historical round-block CI [-0.010894, +0.008288].

Correct normal head: historical pooled LL -0.008579,
CI [-0.017075, -0.000029]. Round-block CI [-0.017189, -0.000404].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -3. Consensus-wrong tips
-6 / 342 paired games; primary -5 / 291,
full 2026 -1 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Port Adelaide,
+0.518 points at n=232; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.001161.
Primary excluding draws -0.001860; early -0.000738.

Direct increment over plain OD, primary / early / full 2026:
LL +0.004511 / +0.003934 / +0.005403;
tips -15 / -5 / -1.

Evidence files, with effective config hashes:

- [t40-derived config](../configs/t40-derived/config.json), [full result 30df2308](../configs/t40-derived/results-2026-09-05-30df2308.json).
- [t40-derived-early config](../configs/t40-derived-early/config.json), [full result 44887292](../configs/t40-derived-early/results-2026-09-05-44887292.json).
- [t40-derived-2026 config](../configs/t40-derived-2026/config.json), [full result 22c096c1](../configs/t40-derived-2026/results-2026-09-05-22c096c1.json).

### t40-finals-both: KILL

pooled tip regression, recent tip regression.

Mechanism: Fixture is a final → Change HA or gain → Now/next rating gap.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-finals-both mechanism"><title>t40-finals-both mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Fixture is a final</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Change HA or gain</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Now/next rating gap</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.finals_k_multiplier=1.5
output.finals_home_advantage=0
```

Run: `bun analysis/task40-campaign.ts --ids t40-finals-both`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 709 | -7 | -0.000140 | -7 / 533 |
| Early 2016-2019 | 828 | 548 | -6 | -0.000804 | -6 / 410 |
| 2026 R0-13, burned | 114 | 83 | -1 | +0.002629 | -1 / 48 |
| 2026 R14+ | 97 | 70 | +2 | -0.002218 | +2 / 35 |
| Full 2026 | 211 | 153 | +1 | +0.000401 | +1 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-finals-both per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="443.71654079778125" x2="443.71654079778125" y1="20" y2="143" class="zero"/><line x1="328.4327548737439" x2="328.4327548737439" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="368.86644430137187" x2="509.5593201397893" y1="38" y2="38" class="interval"/><circle cx="440.48165909723593" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.000140; tips -7</text><text x="5" y="85">Early</text><line x1="328.5589105895023" x2="508.52287737266704" y1="80" y2="80" class="interval"/><circle cx="425.18429585853755" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.000804; tips -6</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="392.5784469145343" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.002218; tips +2</text><text x="160" y="165" class="small">-0.0123</text><text x="610" y="165" text-anchor="end" class="small">+0.0072</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.000431, 95% CI [-0.002854, +0.001892].
With R14+ as a third stratum: -0.000518, CI [-0.002997, +0.001817].
Historical round-block CI [-0.002553, +0.001466].

Correct normal head: historical pooled LL -0.000307,
CI [-0.002206, +0.001571]. Round-block CI [-0.001965, +0.001256].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -1. Consensus-wrong tips
+3 / 342 paired games; primary +2 / 291,
full 2026 +1 / 51, R14+ +1 / 23.

Largest eligible absolute team-bias worsening: Port Adelaide,
+0.370 points at n=209; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.000369.
Primary excluding draws -0.000078; early -0.000822.

Evidence files, with effective config hashes:

- [t40-finals-both config](../configs/t40-finals-both/config.json), [full result 28cae19d](../configs/t40-finals-both/results-2026-09-05-28cae19d.json).
- [t40-finals-both-early config](../configs/t40-finals-both-early/config.json), [full result d00050fd](../configs/t40-finals-both-early/results-2026-09-05-d00050fd.json).
- [t40-finals-both-2026 config](../configs/t40-finals-both-2026/config.json), [full result 63797ce3](../configs/t40-finals-both-2026/results-2026-09-05-63797ce3.json).

### t40-finals-ha: KILL

pooled tip regression.

Mechanism: Fixture is a final → Change HA or gain → Now/next rating gap.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-finals-ha mechanism"><title>t40-finals-ha mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Fixture is a final</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Change HA or gain</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Now/next rating gap</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
output.finals_home_advantage=0
```

Run: `bun analysis/task40-campaign.ts --ids t40-finals-ha`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 712 | -4 | -0.000111 | -4 / 533 |
| Early 2016-2019 | 828 | 552 | -2 | -0.000634 | -2 / 410 |
| 2026 R0-13, burned | 114 | 84 | 0 | 0.000000 | 0 / 48 |
| 2026 R14+ | 97 | 69 | +1 | -0.001938 | +1 / 35 |
| Full 2026 | 211 | 153 | +1 | -0.000891 | +1 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-finals-ha per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="445.30319686564127" x2="445.30319686564127" y1="20" y2="143" class="zero"/><line x1="319.2758600765958" x2="319.2758600765958" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="372.77398810555775" x2="510.5916643764562" y1="38" y2="38" class="interval"/><circle cx="442.5095902726038" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.000111; tips -4</text><text x="5" y="85">Early</text><line x1="340.0794474291814" x2="510.17067815919" y1="80" y2="80" class="interval"/><circle cx="429.31520893663173" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.000634; tips -2</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="396.44281607656626" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.001938; tips +1</text><text x="160" y="165" class="small">-0.0113</text><text x="610" y="165" text-anchor="end" class="small">+0.0065</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.000340, 95% CI [-0.002332, +0.001701].
With R14+ as a third stratum: -0.000418, CI [-0.002616, +0.001473].
Historical round-block CI [-0.002099, +0.001198].

Correct normal head: historical pooled LL -0.000056,
CI [-0.001631, +0.001599]. Round-block CI [-0.001432, +0.001153].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +1. Consensus-wrong tips
+3 / 342 paired games; primary +2 / 291,
full 2026 +1 / 51, R14+ +1 / 23.

Largest eligible absolute team-bias worsening: Geelong,
+0.206 points at n=245; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.000340.
Primary excluding draws -0.000112; early -0.000637.

Evidence files, with effective config hashes:

- [t40-finals-ha config](../configs/t40-finals-ha/config.json), [full result 1097604c](../configs/t40-finals-ha/results-2026-09-05-1097604c.json).
- [t40-finals-ha-early config](../configs/t40-finals-ha-early/config.json), [full result e6be119f](../configs/t40-finals-ha-early/results-2026-09-05-e6be119f.json).
- [t40-finals-ha-2026 config](../configs/t40-finals-ha-2026/config.json), [full result 521cc531](../configs/t40-finals-ha-2026/results-2026-09-05-521cc531.json).

### t40-finals-k: KILL

pooled tip regression, recent tip regression.

Mechanism: Fixture is a final → Change HA or gain → Now/next rating gap.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-finals-k mechanism"><title>t40-finals-k mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Fixture is a final</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Change HA or gain</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Now/next rating gap</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.finals_k_multiplier=1.5
```

Run: `bun analysis/task40-campaign.ts --ids t40-finals-k`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 714 | -2 | -0.000120 | -2 / 533 |
| Early 2016-2019 | 828 | 548 | -6 | -0.000238 | -6 / 410 |
| 2026 R0-13, burned | 114 | 83 | -1 | +0.002629 | -1 / 48 |
| 2026 R14+ | 97 | 69 | +1 | -0.000343 | +1 / 35 |
| Full 2026 | 211 | 152 | 0 | +0.001263 | 0 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-finals-k per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="497.5" x2="497.5" y1="20" y2="143" class="zero"/><line x1="216.25" x2="216.25" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="425.9270749212573" x2="551.9255242728132" y1="38" y2="38" class="interval"/><circle cx="490.743159602857" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.000120; tips -2</text><text x="5" y="85">Early</text><line x1="391.5735051922006" x2="571.1792701654729" y1="80" y2="80" class="interval"/><circle cx="484.1299038634464" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.000238; tips -6</text><text x="5" y="127">2026 R14+</text><line x1="373.5917302128499" x2="593.0245476670784" y1="122" y2="122" class="interval"/><circle cx="478.21276908842634" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.000343; tips +1</text><text x="160" y="165" class="small">-0.0060</text><text x="610" y="165" text-anchor="end" class="small">+0.0020</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.000172, 95% CI [-0.001117, +0.000728].
With R14+ as a third stratum: -0.000180, CI [-0.001080, +0.000721].
Historical round-block CI [-0.000976, +0.000640].

Correct normal head: historical pooled LL -0.000320,
CI [-0.001101, +0.000443]. Round-block CI [-0.000995, +0.000364].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -1. Consensus-wrong tips
+1 / 342 paired games; primary +1 / 291,
full 2026 0 / 51, R14+ 0 / 23.

Largest eligible absolute team-bias worsening: Port Adelaide,
+0.262 points at n=209; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.000110.
Primary excluding draws -0.000057; early -0.000253.

Evidence files, with effective config hashes:

- [t40-finals-k config](../configs/t40-finals-k/config.json), [full result d86d4027](../configs/t40-finals-k/results-2026-09-05-d86d4027.json).
- [t40-finals-k-early config](../configs/t40-finals-k-early/config.json), [full result e3f8e645](../configs/t40-finals-k-early/results-2026-09-05-e3f8e645.json).
- [t40-finals-k-2026 config](../configs/t40-finals-k-2026/config.json), [full result 8549b29a](../configs/t40-finals-k-2026/results-2026-09-05-8549b29a.json).

### t40-ha-070: KILL

non-improving primary LL, non-improving early LL, pooled tip regression, recent tip regression.

Mechanism: Pre-match venue context → Change prediction HA → Margin crosses zero?.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-ha-070 mechanism"><title>t40-ha-070 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Pre-match venue context</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Change prediction HA</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Margin crosses zero?</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
output.prediction_home_advantage=70
```

Run: `bun analysis/task40-campaign.ts --ids t40-ha-070`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 713 | -3 | +0.000095 | -3 / 533 |
| Early 2016-2019 | 828 | 554 | 0 | +0.000410 | 0 / 410 |
| 2026 R0-13, burned | 114 | 82 | -2 | +0.003875 | -2 / 48 |
| 2026 R14+ | 97 | 69 | +1 | -0.002804 | +1 / 35 |
| Full 2026 | 211 | 151 | -1 | +0.000805 | -1 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-ha-070 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="514.617750939655" x2="514.617750939655" y1="20" y2="143" class="zero"/><line x1="276.16212828879264" x2="276.16212828879264" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="448.3739361607106" x2="591.3521916151158" y1="38" y2="38" class="interval"/><circle cx="519.164965528027" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">+0.000095; tips -3</text><text x="5" y="85">Early</text><line x1="462.3189556748297" x2="609.7643981694002" y1="80" y2="80" class="interval"/><circle cx="534.169382895158" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">+0.000410; tips 0</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="600.9856697671519" y1="122" y2="122" class="interval"/><circle cx="380.90480002546144" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.002804; tips +1</text><text x="160" y="165" class="small">-0.0074</text><text x="610" y="165" text-anchor="end" class="small">+0.0020</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL +0.000233, 95% CI [-0.000866, +0.001375].
With R14+ as a third stratum: +0.000085, CI [-0.000932, +0.001186].
Historical round-block CI [-0.000842, +0.001335].

Correct normal head: historical pooled LL +0.000566,
CI [-0.000314, +0.001497]. Round-block CI [-0.000355, +0.001491].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -3. Consensus-wrong tips
+1 / 342 paired games; primary 0 / 291,
full 2026 +1 / 51, R14+ +1 / 23.

Largest eligible absolute team-bias worsening: Adelaide,
+0.027 points at n=231; allowed maximum +2.
Historical LL draw sensitivity: half-target +0.000440.
Primary excluding draws +0.000367; early +0.000523.

Evidence files, with effective config hashes:

- [t40-ha-070 config](../configs/t40-ha-070/config.json), [full result 53dd87b0](../configs/t40-ha-070/results-2026-09-05-53dd87b0.json).
- [t40-ha-070-early config](../configs/t40-ha-070-early/config.json), [full result 3aef69a2](../configs/t40-ha-070-early/results-2026-09-05-3aef69a2.json).
- [t40-ha-070-2026 config](../configs/t40-ha-070-2026/config.json), [full result 247d578c](../configs/t40-ha-070-2026/results-2026-09-05-247d578c.json).

### t40-ha-090: KILL

non-improving primary LL, non-improving early LL.

Mechanism: Pre-match venue context → Change prediction HA → Margin crosses zero?.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-ha-090 mechanism"><title>t40-ha-090 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Pre-match venue context</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Change prediction HA</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Margin crosses zero?</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
output.prediction_home_advantage=90
```

Run: `bun analysis/task40-campaign.ts --ids t40-ha-090`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 722 | +6 | +0.000335 | +6 / 533 |
| Early 2016-2019 | 828 | 551 | -3 | +0.000027 | -3 / 410 |
| 2026 R0-13, burned | 114 | 83 | -1 | -0.003447 | -1 / 48 |
| 2026 R14+ | 97 | 68 | 0 | +0.003198 | 0 / 35 |
| Full 2026 | 211 | 151 | -1 | -0.000392 | -1 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-ha-090 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="354.88318515931803" x2="354.88318515931803" y1="20" y2="143" class="zero"/><line x1="192.48053085988636" x2="192.48053085988636" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="316.7667357928954" x2="414.4573933391756" y1="38" y2="38" class="interval"/><circle cx="365.75581538414224" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">+0.000335; tips +6</text><text x="5" y="85">Early</text><line x1="304.331940994104" x2="405.28183854793957" y1="80" y2="80" class="interval"/><circle cx="355.74867291518257" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">+0.000027; tips -3</text><text x="5" y="127">2026 R14+</text><line x1="311.59749191134983" x2="610" y1="122" y2="122" class="interval"/><circle cx="458.77204761025644" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">+0.003198; tips 0</text><text x="160" y="165" class="small">-0.0060</text><text x="610" y="165" text-anchor="end" class="small">+0.0079</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL +0.000200, 95% CI [-0.000935, +0.001320].
With R14+ as a third stratum: +0.000346, CI [-0.000747, +0.001375].
Historical round-block CI [-0.000893, +0.001341].

Correct normal head: historical pooled LL -0.000251,
CI [-0.001181, +0.000646]. Round-block CI [-0.001162, +0.000682].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +4. Consensus-wrong tips
0 / 342 paired games; primary +1 / 291,
full 2026 -1 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: GWS Giants,
+0.032 points at n=220; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.000007.
Primary excluding draws +0.000064; early -0.000087.

Evidence files, with effective config hashes:

- [t40-ha-090 config](../configs/t40-ha-090/config.json), [full result 8d53b08b](../configs/t40-ha-090/results-2026-09-05-8d53b08b.json).
- [t40-ha-090-early config](../configs/t40-ha-090-early/config.json), [full result a277cfcf](../configs/t40-ha-090-early/results-2026-09-05-a277cfcf.json).
- [t40-ha-090-2026 config](../configs/t40-ha-090-2026/config.json), [full result 880c2b64](../configs/t40-ha-090-2026/results-2026-09-05-880c2b64.json).

### t40-ha-100: KILL

non-improving primary LL, non-improving early LL.

Mechanism: Pre-match venue context → Change prediction HA → Margin crosses zero?.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-ha-100 mechanism"><title>t40-ha-100 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Pre-match venue context</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Change prediction HA</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Margin crosses zero?</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
output.prediction_home_advantage=100
```

Run: `bun analysis/task40-campaign.ts --ids t40-ha-100`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 728 | +12 | +0.001101 | +12 / 533 |
| Early 2016-2019 | 828 | 553 | -1 | +0.000486 | -1 / 410 |
| 2026 R0-13, burned | 114 | 82 | -2 | -0.006471 | -2 / 48 |
| 2026 R14+ | 97 | 68 | 0 | +0.006792 | 0 / 35 |
| Full 2026 | 211 | 150 | -2 | -0.000373 | -2 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-ha-100 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="282.3966016645057" x2="282.3966016645057" y1="20" y2="143" class="zero"/><line x1="180.39943361075095" x2="180.39943361075095" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="243.52932041010945" x2="366.32840005491175" y1="38" y2="38" class="interval"/><circle cx="304.8610858988125" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">+0.001101; tips +12</text><text x="5" y="85">Early</text><line x1="227.61293988162362" x2="354.2646088098354" y1="80" y2="80" class="interval"/><circle cx="292.3039214514437" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">+0.000486; tips -1</text><text x="5" y="127">2026 R14+</text><line x1="235.8713495989416" x2="610" y1="122" y2="122" class="interval"/><circle cx="420.95932128513505" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">+0.006792; tips 0</text><text x="160" y="165" class="small">-0.0060</text><text x="610" y="165" text-anchor="end" class="small">+0.0161</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL +0.000832, 95% CI [-0.001444, +0.003066].
With R14+ as a third stratum: +0.001123, CI [-0.001059, +0.003177].
Historical round-block CI [-0.001347, +0.003114].

Correct normal head: historical pooled LL -0.000188,
CI [-0.002048, +0.001606]. Round-block CI [-0.002012, +0.001677].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +3. Consensus-wrong tips
+1 / 342 paired games; primary +2 / 291,
full 2026 -1 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: GWS Giants,
+0.064 points at n=220; allowed maximum +2.
Historical LL draw sensitivity: half-target +0.000418.
Primary excluding draws +0.000559; early +0.000258.

Evidence files, with effective config hashes:

- [t40-ha-100 config](../configs/t40-ha-100/config.json), [full result 2dd30ede](../configs/t40-ha-100/results-2026-09-05-2dd30ede.json).
- [t40-ha-100-early config](../configs/t40-ha-100-early/config.json), [full result 73580076](../configs/t40-ha-100-early/results-2026-09-05-73580076.json).
- [t40-ha-100-2026 config](../configs/t40-ha-100-2026/config.json), [full result 6c417fda](../configs/t40-ha-100-2026/results-2026-09-05-6c417fda.json).

### t40-ha-bucket: KILL

recent tip regression, consensus-wrong guard.

Mechanism: Pre-match venue context → Change prediction HA → Margin crosses zero?.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-ha-bucket mechanism"><title>t40-ha-bucket mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Pre-match venue context</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Change prediction HA</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Margin crosses zero?</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
output.prediction_ha_mode="bucket"
```

Run: `bun analysis/task40-campaign.ts --ids t40-ha-bucket`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 717 | +1 | -0.002161 | +1 / 533 |
| Early 2016-2019 | 828 | 555 | +1 | -0.000574 | +1 / 410 |
| 2026 R0-13, burned | 114 | 80 | -4 | +0.002869 | -4 / 48 |
| 2026 R14+ | 97 | 70 | +2 | -0.021087 | +2 / 35 |
| Full 2026 | 211 | 150 | -2 | -0.008144 | -2 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-ha-bucket per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="545.8231381214919" x2="545.8231381214919" y1="20" y2="143" class="zero"/><line x1="494.9158297565145" x2="494.9158297565145" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="461.0501529468357" x2="584.8273857867418" y1="38" y2="38" class="interval"/><circle cx="523.8251035260284" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.002161; tips +1</text><text x="5" y="85">Early</text><line x1="467.5344973703809" x2="610" y1="80" y2="80" class="interval"/><circle cx="539.9812197163535" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.000574; tips +1</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="503.0966352587776" y1="122" y2="122" class="interval"/><circle cx="331.12608258354584" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.021087; tips +2</text><text x="160" y="165" class="small">-0.0379</text><text x="610" y="165" text-anchor="end" class="small">+0.0063</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.001465, 95% CI [-0.005927, +0.003337].
With R14+ as a third stratum: -0.002423, CI [-0.007029, +0.002244].
Historical round-block CI [-0.005684, +0.003247].

Correct normal head: historical pooled LL -0.001634,
CI [-0.005385, +0.002318]. Round-block CI [-0.005047, +0.002239].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -8. Consensus-wrong tips
-9 / 342 paired games; primary -9 / 291,
full 2026 0 / 51, R14+ +1 / 23.

Largest eligible absolute team-bias worsening: Melbourne,
+0.352 points at n=211; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.001437.
Primary excluding draws -0.001768; early -0.000859.

Evidence files, with effective config hashes:

- [t40-ha-bucket config](../configs/t40-ha-bucket/config.json), [full result 16705247](../configs/t40-ha-bucket/results-2026-09-05-16705247.json).
- [t40-ha-bucket-early config](../configs/t40-ha-bucket-early/config.json), [full result 5aa82e37](../configs/t40-ha-bucket-early/results-2026-09-05-5aa82e37.json).
- [t40-ha-bucket-2026 config](../configs/t40-ha-bucket-2026/config.json), [full result ab5c9fdf](../configs/t40-ha-bucket-2026/results-2026-09-05-ab5c9fdf.json).

### t40-ha-neutral: KILL

consensus-wrong guard.

Mechanism: Pre-match venue context → Change prediction HA → Margin crosses zero?.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-ha-neutral mechanism"><title>t40-ha-neutral mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Pre-match venue context</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Change prediction HA</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Margin crosses zero?</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
output.prediction_ha_mode="neutral"
```

Run: `bun analysis/task40-campaign.ts --ids t40-ha-neutral`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 716 | 0 | -0.001064 | 0 / 533 |
| Early 2016-2019 | 828 | 555 | +1 | -0.001197 | +1 / 410 |
| 2026 R0-13, burned | 114 | 84 | 0 | +0.003550 | 0 / 48 |
| 2026 R14+ | 97 | 68 | 0 | +0.000236 | 0 / 35 |
| Full 2026 | 211 | 152 | 0 | +0.002026 | 0 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-ha-neutral per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="465.57345755864816" x2="465.57345755864816" y1="20" y2="143" class="zero"/><line x1="210.92890959310802" x2="210.92890959310802" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="275.05797673726346" x2="547.0953960764459" y1="38" y2="38" class="interval"/><circle cx="411.38551341096803" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.001064; tips 0</text><text x="5" y="85">Early</text><line x1="305.5117082727878" x2="494.4679214789619" y1="80" y2="80" class="interval"/><circle cx="404.60960528808926" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.001197; tips +1</text><text x="5" y="127">2026 R14+</text><line x1="357.1371793639936" x2="610" y1="122" y2="122" class="interval"/><circle cx="477.5702123075476" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">+0.000236; tips 0</text><text x="160" y="165" class="small">-0.0060</text><text x="610" y="165" text-anchor="end" class="small">+0.0028</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.001122, 95% CI [-0.002757, +0.000585].
With R14+ as a third stratum: -0.001056, CI [-0.002692, +0.000587].
Historical round-block CI [-0.003008, +0.000651].

Correct normal head: historical pooled LL -0.000808,
CI [-0.002152, +0.000567]. Round-block CI [-0.002398, +0.000684].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +1. Consensus-wrong tips
-2 / 342 paired games; primary -2 / 291,
full 2026 0 / 51, R14+ 0 / 23.

Largest eligible absolute team-bias worsening: Melbourne,
+0.212 points at n=211; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.001122.
Primary excluding draws -0.001074; early -0.001203.

Evidence files, with effective config hashes:

- [t40-ha-neutral config](../configs/t40-ha-neutral/config.json), [full result 95bb98ab](../configs/t40-ha-neutral/results-2026-09-05-95bb98ab.json).
- [t40-ha-neutral-early config](../configs/t40-ha-neutral-early/config.json), [full result 35336583](../configs/t40-ha-neutral-early/results-2026-09-05-35336583.json).
- [t40-ha-neutral-2026 config](../configs/t40-ha-neutral-2026/config.json), [full result 62a3803a](../configs/t40-ha-neutral-2026/results-2026-09-05-62a3803a.json).

### t40-lineup-delta: KILL

non-improving primary LL, non-improving early LL, pooled tip regression, recent tip regression, R14+ tip regression, team-bias guard.

Mechanism: Current prior PAV → Subtract typical lineup → Ins/outs rating signal.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-lineup-delta mechanism"><title>t40-lineup-delta mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Current prior PAV</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Subtract typical lineup</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Ins/outs rating signal</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
pav.signal="lineup_delta"
```

Run: `bun analysis/task40-campaign.ts --ids t40-lineup-delta`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 716 | 0 | +0.024812 | 0 / 533 |
| Early 2016-2019 | 828 | 537 | -17 | +0.030184 | -14 / 410 |
| 2026 R0-13, burned | 114 | 78 | -6 | +0.040292 | -6 / 48 |
| 2026 R14+ | 97 | 66 | -2 | +0.046832 | -1 / 35 |
| Full 2026 | 211 | 144 | -8 | +0.043299 | -7 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-lineup-delta per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="189.31415861932857" x2="189.31415861932857" y1="20" y2="143" class="zero"/><line x1="164.88569310322143" x2="164.88569310322143" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="247.80885328913115" x2="374.97489312138896" y1="38" y2="38" class="interval"/><circle cx="310.53925599047693" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">+0.024812; tips 0</text><text x="5" y="85">Early</text><line x1="268.2741573740436" x2="406.91852334991626" y1="80" y2="80" class="interval"/><circle cx="336.78411216370944" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">+0.030184; tips -17</text><text x="5" y="127">2026 R14+</text><line x1="224.60418422085903" x2="610" y1="122" y2="122" class="interval"/><circle cx="418.1208203240775" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">+0.046832; tips -2</text><text x="160" y="165" class="small">-0.0060</text><text x="610" y="165" text-anchor="end" class="small">+0.0861</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL +0.027166, 95% CI [+0.017320, +0.036921].
With R14+ as a third stratum: +0.028126, CI [+0.018209, +0.037483].
Historical round-block CI [+0.018022, +0.036729].

Correct normal head: historical pooled LL +0.033250,
CI [+0.024677, +0.041756]. Round-block CI [+0.025223, +0.041481].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -9. Consensus-wrong tips
+12 / 342 paired games; primary +11 / 291,
full 2026 +1 / 51, R14+ +2 / 23.

Largest eligible absolute team-bias worsening: North Melbourne,
+3.954 points at n=202; allowed maximum +2.
Historical LL draw sensitivity: half-target +0.026544.
Primary excluding draws +0.025311; early +0.029588.

Evidence files, with effective config hashes:

- [t40-lineup-delta config](../configs/t40-lineup-delta/config.json), [full result d6787cb0](../configs/t40-lineup-delta/results-2026-09-05-d6787cb0.json).
- [t40-lineup-delta-early config](../configs/t40-lineup-delta-early/config.json), [full result 3d8d24ef](../configs/t40-lineup-delta-early/results-2026-09-05-3d8d24ef.json).
- [t40-lineup-delta-2026 config](../configs/t40-lineup-delta-2026/config.json), [full result 0d40e414](../configs/t40-lineup-delta-2026/results-2026-09-05-0d40e414.json).

### t40-minutes: KILL

non-improving primary LL, team-bias guard.

Mechanism: Completed control stats → Adjust OD margin target → Next-match rating gap.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-minutes mechanism"><title>t40-minutes mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Completed control stats</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Adjust OD margin target</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Next-match rating gap</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.od.weight=1
elo.od.k=0.08
elo.od.home_advantage_points=10
elo.od.initial_score=85
elo.od.regression_to_mean=0.2
elo.od.update_target="minutes"
```

Run: `bun analysis/task40-campaign.ts --ids t40-minutes`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 722 | +6 | +0.001545 | +6 / 533 |
| Early 2016-2019 | 828 | 558 | +4 | -0.003169 | +4 / 410 |
| 2026 R0-13, burned | 114 | 85 | +1 | -0.009141 | +1 / 48 |
| 2026 R14+ | 97 | 68 | 0 | +0.005126 | 0 / 35 |
| Full 2026 | 211 | 153 | +1 | -0.002582 | +1 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-minutes per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="349.73096825063516" x2="349.73096825063516" y1="20" y2="143" class="zero"/><line x1="305.7336960564355" x2="305.7336960564355" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="291.1802241227875" x2="432.2128573326232" y1="38" y2="38" class="interval"/><circle cx="363.32478338702947" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">+0.001545; tips +6</text><text x="5" y="85">Early</text><line x1="246.65661646756797" x2="396.68970220654967" y1="80" y2="80" class="interval"/><circle cx="321.84902682470204" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.003169; tips +4</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="394.83512895335036" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">+0.005126; tips 0</text><text x="160" y="165" class="small">-0.0216</text><text x="610" y="165" text-anchor="end" class="small">+0.0296</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.000520, 95% CI [-0.006084, +0.005509].
With R14+ as a third stratum: -0.000244, CI [-0.006120, +0.005801].
Historical round-block CI [-0.006772, +0.005402].

Correct normal head: historical pooled LL +0.003158,
CI [-0.001573, +0.008392]. Round-block CI [-0.002080, +0.008135].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +5. Consensus-wrong tips
0 / 342 paired games; primary +1 / 291,
full 2026 -1 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: North Melbourne,
+2.594 points at n=202; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.000814.
Primary excluding draws +0.001446; early -0.003030.

Direct increment over plain OD, primary / early / full 2026:
LL +0.007307 / +0.001841 / +0.011508;
tips -6 / -2 / 0.

Evidence files, with effective config hashes:

- [t40-minutes config](../configs/t40-minutes/config.json), [full result 057f7330](../configs/t40-minutes/results-2026-09-05-057f7330.json).
- [t40-minutes-early config](../configs/t40-minutes-early/config.json), [full result a35fb8a9](../configs/t40-minutes-early/results-2026-09-05-a35fb8a9.json).
- [t40-minutes-2026 config](../configs/t40-minutes-2026/config.json), [full result dc334f71](../configs/t40-minutes-2026/results-2026-09-05-dc334f71.json).

### t40-od: PARK

Insufficient evidence under I: pooledCI. No corrected prospective validation.

Mechanism: Completed margin → Residual gain 0.04 → Next team ordering.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-od mechanism"><title>t40-od mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Completed margin</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Residual gain 0.04</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Next team ordering</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.od.weight=1
elo.od.k=0.08
elo.od.home_advantage_points=10
elo.od.initial_score=85
elo.od.regression_to_mean=0.2
```

Run: `bun analysis/task40-campaign.ts --ids t40-od`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 728 | +12 | -0.005762 | +12 / 533 |
| Early 2016-2019 | 828 | 560 | +6 | -0.005010 | +6 / 410 |
| 2026 R0-13, burned | 114 | 84 | 0 | -0.019541 | 0 / 48 |
| 2026 R14+ | 97 | 69 | +1 | -0.007685 | +1 / 35 |
| Full 2026 | 211 | 153 | +1 | -0.014090 | +1 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-od per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="469.61819758399326" x2="469.61819758399326" y1="20" y2="143" class="zero"/><line x1="417.58121608174633" x2="417.58121608174633" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="328.9166231402546" x2="489.1625163846666" y1="38" y2="38" class="interval"/><circle cx="409.6502115497678" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.005762; tips +12</text><text x="5" y="85">Early</text><line x1="321.2010272311548" x2="512.8081058922618" y1="80" y2="80" class="interval"/><circle cx="417.4764648675377" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.005010; tips +6</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="389.64251657022066" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.007685; tips +1</text><text x="160" y="165" class="small">-0.0297</text><text x="610" y="165" text-anchor="end" class="small">+0.0135</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.005433, 95% CI [-0.011012, +0.000785].
With R14+ as a third stratum: -0.005543, CI [-0.011347, +0.000400].
Historical round-block CI [-0.011210, +0.000518].

Correct normal head: historical pooled LL -0.004143,
CI [-0.008665, +0.001128]. Round-block CI [-0.008923, +0.000912].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +4. Consensus-wrong tips
0 / 342 paired games; primary +3 / 291,
full 2026 -3 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Carlton,
+1.056 points at n=205; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.005554.
Primary excluding draws -0.005965; early -0.004778.

Evidence files, with effective config hashes:

- [t40-od config](../configs/t40-od/config.json), [full result c8c7b6b7](../configs/t40-od/results-2026-09-05-c8c7b6b7.json).
- [t40-od-early config](../configs/t40-od-early/config.json), [full result e5ca5027](../configs/t40-od-early/results-2026-09-05-e5ca5027.json).
- [t40-od-2026 config](../configs/t40-od-2026/config.json), [full result 193a0012](../configs/t40-od-2026/results-2026-09-05-193a0012.json).

### t40-od-ha-060: KILL

recent tip regression, consensus-wrong guard.

Mechanism: Pre-match venue context → Change prediction HA → Margin crosses zero?.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-od-ha-060 mechanism"><title>t40-od-ha-060 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Pre-match venue context</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Change prediction HA</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Margin crosses zero?</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.od.weight=1
elo.od.k=0.08
elo.od.home_advantage_points=10
elo.od.initial_score=85
elo.od.regression_to_mean=0.2
output.prediction_home_advantage=60
```

Run: `bun analysis/task40-campaign.ts --ids t40-od-ha-060`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 712 | -4 | -0.005141 | -4 / 533 |
| Early 2016-2019 | 828 | 558 | +4 | -0.003549 | +4 / 410 |
| 2026 R0-13, burned | 114 | 85 | +1 | -0.011495 | +1 / 48 |
| 2026 R14+ | 97 | 69 | +1 | -0.012554 | +1 / 35 |
| Full 2026 | 211 | 154 | +2 | -0.011982 | +2 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-od-ha-060 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="517.9248028569634" x2="517.9248028569634" y1="20" y2="143" class="zero"/><line x1="468.2991257184401" x2="468.2991257184401" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="383.78870324625854" x2="549.4685570444346" y1="38" y2="38" class="interval"/><circle cx="466.8977666487384" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.005141; tips -4</text><text x="5" y="85">Early</text><line x1="387.3119657731031" x2="581.084934804305" y1="80" y2="80" class="interval"/><circle cx="482.7047745272888" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.003549; tips +4</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="393.3199128478155" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.012554; tips +1</text><text x="160" y="165" class="small">-0.0361</text><text x="610" y="165" text-anchor="end" class="small">+0.0093</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.004443, 95% CI [-0.010240, +0.002100].
With R14+ as a third stratum: -0.004839, CI [-0.011100, +0.001793].
Historical round-block CI [-0.010710, +0.002294].

Correct normal head: historical pooled LL -0.002598,
CI [-0.007477, +0.002986]. Round-block CI [-0.007810, +0.002954].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -3. Consensus-wrong tips
-2 / 342 paired games; primary 0 / 291,
full 2026 -2 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Carlton,
+1.076 points at n=205; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.004157.
Primary excluding draws -0.004797; early -0.003093.

Direct increment over plain OD, primary / early / full 2026:
LL +0.000621 / +0.001461 / +0.002108;
tips -16 / -2 / +1.

Evidence files, with effective config hashes:

- [t40-od-ha-060 config](../configs/t40-od-ha-060/config.json), [full result c23b77e5](../configs/t40-od-ha-060/results-2026-09-05-c23b77e5.json).
- [t40-od-ha-060-early config](../configs/t40-od-ha-060-early/config.json), [full result 4ce757be](../configs/t40-od-ha-060-early/results-2026-09-05-4ce757be.json).
- [t40-od-ha-060-2026 config](../configs/t40-od-ha-060-2026/config.json), [full result 5f3c0d7c](../configs/t40-od-ha-060-2026/results-2026-09-05-5f3c0d7c.json).

### t40-od-ha-100: PARK

Insufficient evidence under I: primary, pooledCI. No corrected prospective validation.

Mechanism: Pre-match venue context → Change prediction HA → Margin crosses zero?.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-od-ha-100 mechanism"><title>t40-od-ha-100 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Pre-match venue context</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Change prediction HA</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Margin crosses zero?</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.od.weight=1
elo.od.k=0.08
elo.od.home_advantage_points=10
elo.od.initial_score=85
elo.od.regression_to_mean=0.2
output.prediction_home_advantage=100
```

Run: `bun analysis/task40-campaign.ts --ids t40-od-ha-100`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 723 | +7 | -0.004625 | +7 / 533 |
| Early 2016-2019 | 828 | 557 | +3 | -0.004706 | +3 / 410 |
| 2026 R0-13, burned | 114 | 82 | -2 | -0.025830 | -2 / 48 |
| 2026 R14+ | 97 | 68 | 0 | -0.001320 | 0 / 35 |
| Full 2026 | 211 | 150 | -2 | -0.014562 | -2 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-od-ha-100 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="389.9910585865848" x2="389.9910585865848" y1="20" y2="143" class="zero"/><line x1="342.1513766666727" x2="342.1513766666727" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="266.17841911045156" x2="419.2249439425727" y1="38" y2="38" class="interval"/><circle cx="345.737502109792" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.004625; tips +7</text><text x="5" y="85">Early</text><line x1="253.39949252435707" x2="433.55679661912416" y1="80" y2="80" class="interval"/><circle cx="344.9670515500085" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.004706; tips +3</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="377.35962227787746" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.001320; tips 0</text><text x="160" y="165" class="small">-0.0240</text><text x="610" y="165" text-anchor="end" class="small">+0.0230</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.004660, 95% CI [-0.010466, +0.001675].
With R14+ as a third stratum: -0.004497, CI [-0.010292, +0.001572].
Historical round-block CI [-0.010917, +0.001248].

Correct normal head: historical pooled LL -0.004430,
CI [-0.009210, +0.000872]. Round-block CI [-0.009573, +0.000573].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +1. Consensus-wrong tips
+1 / 342 paired games; primary +3 / 291,
full 2026 -2 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Carlton,
+1.035 points at n=205; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.005189.
Primary excluding draws -0.005373; early -0.004698.

Direct increment over plain OD, primary / early / full 2026:
LL +0.001137 / +0.000304 / -0.000472;
tips -5 / -3 / -3.

Evidence files, with effective config hashes:

- [t40-od-ha-100 config](../configs/t40-od-ha-100/config.json), [full result cc8b7f58](../configs/t40-od-ha-100/results-2026-09-05-cc8b7f58.json).
- [t40-od-ha-100-early config](../configs/t40-od-ha-100-early/config.json), [full result 50c22519](../configs/t40-od-ha-100-early/results-2026-09-05-50c22519.json).
- [t40-od-ha-100-2026 config](../configs/t40-od-ha-100-2026/config.json), [full result a06277ef](../configs/t40-od-ha-100-2026/results-2026-09-05-a06277ef.json).

### t40-od-ha-120: PARK

Insufficient evidence under I: primary, early, pooledCI, oos. No corrected prospective validation.

Mechanism: Pre-match venue context → Change prediction HA → Margin crosses zero?.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-od-ha-120 mechanism"><title>t40-od-ha-120 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Pre-match venue context</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Change prediction HA</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Margin crosses zero?</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.od.weight=1
elo.od.k=0.08
elo.od.home_advantage_points=10
elo.od.initial_score=85
elo.od.regression_to_mean=0.2
output.prediction_home_advantage=120
```

Run: `bun analysis/task40-campaign.ts --ids t40-od-ha-120`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 727 | +11 | -0.001751 | +11 / 533 |
| Early 2016-2019 | 828 | 557 | +3 | -0.002661 | +3 / 410 |
| 2026 R0-13, burned | 114 | 81 | -3 | -0.030461 | -3 / 48 |
| 2026 R14+ | 97 | 68 | 0 | +0.006515 | 0 / 35 |
| Full 2026 | 211 | 149 | -3 | -0.013463 | -3 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-od-ha-120 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="327.7046413639637" x2="327.7046413639637" y1="20" y2="143" class="zero"/><line x1="288.04515232727147" x2="288.04515232727147" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="238.7923123344533" x2="382.92778342713757" y1="38" y2="38" class="interval"/><circle cx="313.8196167716199" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.001751; tips +11</text><text x="5" y="85">Early</text><line x1="223.04400066540364" x2="392.87542990631806" y1="80" y2="80" class="interval"/><circle cx="306.5995476262877" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.002661; tips +3</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="379.3823212243017" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">+0.006515; tips 0</text><text x="160" y="165" class="small">-0.0211</text><text x="610" y="165" text-anchor="end" class="small">+0.0356</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.002149, 95% CI [-0.008843, +0.005024].
With R14+ as a third stratum: -0.001726, CI [-0.008355, +0.005161].
Historical round-block CI [-0.009195, +0.004953].

Correct normal head: historical pooled LL -0.003463,
CI [-0.009048, +0.002645]. Round-block CI [-0.009198, +0.002525].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +1. Consensus-wrong tips
+1 / 342 paired games; primary +3 / 291,
full 2026 -2 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Carlton,
+1.015 points at n=205; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.003086.
Primary excluding draws -0.003043; early -0.002879.

Direct increment over plain OD, primary / early / full 2026:
LL +0.004012 / +0.002349 / +0.000628;
tips -1 / -3 / -4.

Evidence files, with effective config hashes:

- [t40-od-ha-120 config](../configs/t40-od-ha-120/config.json), [full result 20823895](../configs/t40-od-ha-120/results-2026-09-05-20823895.json).
- [t40-od-ha-120-early config](../configs/t40-od-ha-120-early/config.json), [full result 0c27691d](../configs/t40-od-ha-120-early/results-2026-09-05-0c27691d.json).
- [t40-od-ha-120-2026 config](../configs/t40-od-ha-120-2026/config.json), [full result a5ad7d7f](../configs/t40-od-ha-120-2026/results-2026-09-05-a5ad7d7f.json).

### t40-od-ha-bucket: KILL

recent tip regression, consensus-wrong guard.

Mechanism: Pre-match venue context → Change prediction HA → Margin crosses zero?.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-od-ha-bucket mechanism"><title>t40-od-ha-bucket mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Pre-match venue context</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Change prediction HA</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Margin crosses zero?</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.od.weight=1
elo.od.k=0.08
elo.od.home_advantage_points=10
elo.od.initial_score=85
elo.od.regression_to_mean=0.2
output.prediction_ha_mode="bucket"
```

Run: `bun analysis/task40-campaign.ts --ids t40-od-ha-bucket`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 721 | +5 | -0.007741 | +5 / 533 |
| Early 2016-2019 | 828 | 556 | +2 | -0.005737 | +2 / 410 |
| 2026 R0-13, burned | 114 | 78 | -6 | -0.017761 | -6 / 48 |
| 2026 R14+ | 97 | 70 | +2 | -0.027608 | +2 / 35 |
| Full 2026 | 211 | 148 | -4 | -0.022288 | -4 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-od-ha-bucket per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="569.3028725100833" x2="569.3028725100833" y1="20" y2="143" class="zero"/><line x1="533.167124469132" x2="533.167124469132" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="441.58016035593164" x2="584.720985615887" y1="38" y2="38" class="interval"/><circle cx="513.3574458559247" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.007741; tips +5</text><text x="5" y="85">Early</text><line x1="445.2179729908409" x2="610" y1="80" y2="80" class="interval"/><circle cx="527.8403194500163" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.005737; tips +2</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="558.7229649270155" y1="122" y2="122" class="interval"/><circle cx="369.7782458660547" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.027608; tips +2</text><text x="160" y="165" class="small">-0.0566</text><text x="610" y="165" text-anchor="end" class="small">+0.0056</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.006863, 95% CI [-0.013875, +0.000554].
With R14+ as a third stratum: -0.007876, CI [-0.015109, -0.000572].
Historical round-block CI [-0.014383, +0.000810].

Correct normal head: historical pooled LL -0.005809,
CI [-0.011767, +0.000448]. Round-block CI [-0.012077, +0.000738].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -7. Consensus-wrong tips
-12 / 342 paired games; primary -8 / 291,
full 2026 -4 / 51, R14+ 0 / 23.

Largest eligible absolute team-bias worsening: Carlton,
+0.892 points at n=205; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.006959.
Primary excluding draws -0.007591; early -0.005779.

Direct increment over plain OD, primary / early / full 2026:
LL -0.001979 / -0.000727 / -0.008198;
tips -7 / -4 / -5.

Evidence files, with effective config hashes:

- [t40-od-ha-bucket config](../configs/t40-od-ha-bucket/config.json), [full result 690880ef](../configs/t40-od-ha-bucket/results-2026-09-05-690880ef.json).
- [t40-od-ha-bucket-early config](../configs/t40-od-ha-bucket-early/config.json), [full result e1d568ed](../configs/t40-od-ha-bucket-early/results-2026-09-05-e1d568ed.json).
- [t40-od-ha-bucket-2026 config](../configs/t40-od-ha-bucket-2026/config.json), [full result e0a651ba](../configs/t40-od-ha-bucket-2026/results-2026-09-05-e0a651ba.json).

### t40-od-reverse-k04-r10: KILL

non-improving primary LL, non-improving early LL, recent tip regression.

Mechanism: Early-window grid → Select k and RTM → Confirm on primary.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-od-reverse-k04-r10 mechanism"><title>t40-od-reverse-k04-r10 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Early-window grid</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Select k and RTM</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Confirm on primary</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.od.weight=1
elo.od.k=0.04
elo.od.home_advantage_points=10
elo.od.initial_score=85
elo.od.regression_to_mean=0.1
```

Run: `bun analysis/task40-campaign.ts --ids t40-od-reverse-k04-r10`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 722 | +6 | +0.001872 | +6 / 533 |
| Early 2016-2019 | 828 | 557 | +3 | +0.004603 | +3 / 410 |
| 2026 R0-13, burned | 114 | 82 | -2 | -0.009607 | -2 / 48 |
| 2026 R14+ | 97 | 69 | +1 | -0.004253 | +1 / 35 |
| Full 2026 | 211 | 151 | -1 | -0.007146 | -1 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-od-reverse-k04-r10 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="427.75612656438386" x2="427.75612656438386" y1="20" y2="143" class="zero"/><line x1="389.50527125931876" x2="389.50527125931876" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="368.0069221878766" x2="515.8936861329692" y1="38" y2="38" class="interval"/><circle cx="442.07994445864085" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">+0.001872; tips +6</text><text x="5" y="85">Early</text><line x1="375.03033329528273" x2="547.0202445832385" y1="80" y2="80" class="interval"/><circle cx="462.9672316126516" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">+0.004603; tips +3</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="395.2161587034511" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.004253; tips +1</text><text x="160" y="165" class="small">-0.0350</text><text x="610" y="165" text-anchor="end" class="small">+0.0238</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL +0.003068, 95% CI [-0.004273, +0.010710].
With R14+ as a third stratum: +0.002711, CI [-0.004489, +0.010400].
Historical round-block CI [-0.004816, +0.010632].

Correct normal head: historical pooled LL +0.007124,
CI [+0.000990, +0.013510]. Round-block CI [+0.000557, +0.013481].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -2. Consensus-wrong tips
+8 / 342 paired games; primary +9 / 291,
full 2026 -1 / 51, R14+ 0 / 23.

Largest eligible absolute team-bias worsening: North Melbourne,
+1.962 points at n=202; allowed maximum +2.
Historical LL draw sensitivity: half-target +0.002791.
Primary excluding draws +0.001974; early +0.004632.

Direct increment over plain OD, primary / early / full 2026:
LL +0.007634 / +0.009613 / +0.006944;
tips -6 / -3 / -2.

Evidence files, with effective config hashes:

- [t40-od-reverse-k04-r10 config](../configs/t40-od-reverse-k04-r10/config.json), [full result c88b8d06](../configs/t40-od-reverse-k04-r10/results-2026-09-05-c88b8d06.json).
- [t40-od-reverse-k04-r10-early config](../configs/t40-od-reverse-k04-r10-early/config.json), [full result d5b1e07b](../configs/t40-od-reverse-k04-r10-early/results-2026-09-05-d5b1e07b.json).
- [t40-od-reverse-k04-r10-2026 config](../configs/t40-od-reverse-k04-r10-2026/config.json), [full result eb1e98a0](../configs/t40-od-reverse-k04-r10-2026/results-2026-09-05-eb1e98a0.json).

### t40-od-reverse-k04-r20: KILL

non-improving primary LL, non-improving early LL, team-bias guard.

Mechanism: Early-window grid → Select k and RTM → Confirm on primary.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-od-reverse-k04-r20 mechanism"><title>t40-od-reverse-k04-r20 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Early-window grid</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Select k and RTM</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Confirm on primary</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.od.weight=1
elo.od.k=0.04
elo.od.home_advantage_points=10
elo.od.initial_score=85
elo.od.regression_to_mean=0.2
```

Run: `bun analysis/task40-campaign.ts --ids t40-od-reverse-k04-r20`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 725 | +9 | +0.003347 | +9 / 533 |
| Early 2016-2019 | 828 | 557 | +3 | +0.004780 | +3 / 410 |
| 2026 R0-13, burned | 114 | 85 | +1 | -0.008149 | +1 / 48 |
| 2026 R14+ | 97 | 68 | 0 | +0.006337 | 0 / 35 |
| Full 2026 | 211 | 153 | +1 | -0.001490 | +1 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-od-reverse-k04-r20 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="351.3603934080801" x2="351.3603934080801" y1="20" y2="143" class="zero"/><line x1="311.4717155040063" x2="311.4717155040063" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="303.42562972603264" x2="453.2637312522944" y1="38" y2="38" class="interval"/><circle cx="378.06016428391285" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">+0.003347; tips +9</text><text x="5" y="85">Early</text><line x1="302.38364019660526" x2="473.95893957391075" y1="80" y2="80" class="interval"/><circle cx="389.4937915332516" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">+0.004780; tips +3</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="401.9122092580162" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">+0.006337; tips 0</text><text x="160" y="165" class="small">-0.0240</text><text x="610" y="165" text-anchor="end" class="small">+0.0324</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL +0.003975, 95% CI [-0.003092, +0.011532].
With R14+ as a third stratum: +0.004090, CI [-0.002809, +0.011518].
Historical round-block CI [-0.003898, +0.011312].

Correct normal head: historical pooled LL +0.009085,
CI [+0.003077, +0.015423]. Round-block CI [+0.002587, +0.015260].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +6. Consensus-wrong tips
+8 / 342 paired games; primary +9 / 291,
full 2026 -1 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: North Melbourne,
+2.806 points at n=202; allowed maximum +2.
Historical LL draw sensitivity: half-target +0.003542.
Primary excluding draws +0.003365; early +0.004741.

Direct increment over plain OD, primary / early / full 2026:
LL +0.009109 / +0.009790 / +0.012600;
tips -3 / -3 / 0.

Evidence files, with effective config hashes:

- [t40-od-reverse-k04-r20 config](../configs/t40-od-reverse-k04-r20/config.json), [full result fd5007c5](../configs/t40-od-reverse-k04-r20/results-2026-09-05-fd5007c5.json).
- [t40-od-reverse-k04-r20-early config](../configs/t40-od-reverse-k04-r20-early/config.json), [full result cebbeb0d](../configs/t40-od-reverse-k04-r20-early/results-2026-09-05-cebbeb0d.json).
- [t40-od-reverse-k04-r20-2026 config](../configs/t40-od-reverse-k04-r20-2026/config.json), [full result 77828b53](../configs/t40-od-reverse-k04-r20-2026/results-2026-09-05-77828b53.json).

### t40-od-reverse-k04-r40: KILL

non-improving primary LL, non-improving early LL, R14+ tip regression, team-bias guard.

Mechanism: Early-window grid → Select k and RTM → Confirm on primary.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-od-reverse-k04-r40 mechanism"><title>t40-od-reverse-k04-r40 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Early-window grid</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Select k and RTM</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Confirm on primary</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.od.weight=1
elo.od.k=0.04
elo.od.home_advantage_points=10
elo.od.initial_score=85
elo.od.regression_to_mean=0.4
```

Run: `bun analysis/task40-campaign.ts --ids t40-od-reverse-k04-r40`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 722 | +6 | +0.007669 | +6 / 533 |
| Early 2016-2019 | 828 | 554 | 0 | +0.006904 | 0 / 410 |
| 2026 R0-13, burned | 114 | 83 | -1 | -0.000352 | -1 / 48 |
| 2026 R14+ | 97 | 67 | -1 | +0.026070 | -1 / 35 |
| Full 2026 | 211 | 150 | -2 | +0.011794 | -2 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-od-reverse-k04-r40 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="205.11704381265423" x2="205.11704381265423" y1="20" y2="143" class="zero"/><line x1="167.84002407817067" x2="167.84002407817067" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="184.97876481753454" x2="336.8412861397003" y1="38" y2="38" class="interval"/><circle cx="262.29406617659225" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">+0.007669; tips +6</text><text x="5" y="85">Early</text><line x1="173.86021271418906" x2="339.0994679263211" y1="80" y2="80" class="interval"/><circle cx="256.5884604863369" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">+0.006904; tips 0</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="399.47954683489854" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">+0.026070; tips -1</text><text x="160" y="165" class="small">-0.0061</text><text x="610" y="165" text-anchor="end" class="small">+0.0543</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL +0.007334, 95% CI [-0.000011, +0.014928].
With R14+ as a third stratum: +0.008249, CI [+0.000570, +0.016059].
Historical round-block CI [-0.000636, +0.014915].

Correct normal head: historical pooled LL +0.013921,
CI [+0.007573, +0.020496]. Round-block CI [+0.007081, +0.020658].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +1. Consensus-wrong tips
+7 / 342 paired games; primary +7 / 291,
full 2026 0 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: North Melbourne,
+4.231 points at n=202; allowed maximum +2.
Historical LL draw sensitivity: half-target +0.006643.
Primary excluding draws +0.007553; early +0.006741.

Direct increment over plain OD, primary / early / full 2026:
LL +0.013431 / +0.011914 / +0.025885;
tips -6 / -6 / -3.

Evidence files, with effective config hashes:

- [t40-od-reverse-k04-r40 config](../configs/t40-od-reverse-k04-r40/config.json), [full result 3e9f4aa2](../configs/t40-od-reverse-k04-r40/results-2026-09-05-3e9f4aa2.json).
- [t40-od-reverse-k04-r40-early config](../configs/t40-od-reverse-k04-r40-early/config.json), [full result ff51e9ee](../configs/t40-od-reverse-k04-r40-early/results-2026-09-05-ff51e9ee.json).
- [t40-od-reverse-k04-r40-2026 config](../configs/t40-od-reverse-k04-r40-2026/config.json), [full result 781c8ee6](../configs/t40-od-reverse-k04-r40-2026/results-2026-09-05-781c8ee6.json).

### t40-od-reverse-k08-r10: KILL

recent tip regression, consensus-wrong guard.

Mechanism: Early-window grid → Select k and RTM → Confirm on primary.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-od-reverse-k08-r10 mechanism"><title>t40-od-reverse-k08-r10 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Early-window grid</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Select k and RTM</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Confirm on primary</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.od.weight=1
elo.od.k=0.08
elo.od.home_advantage_points=10
elo.od.initial_score=85
elo.od.regression_to_mean=0.1
```

Run: `bun analysis/task40-campaign.ts --ids t40-od-reverse-k08-r10`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 720 | +4 | -0.006305 | +4 / 533 |
| Early 2016-2019 | 828 | 561 | +7 | -0.004338 | +7 / 410 |
| 2026 R0-13, burned | 114 | 83 | -1 | -0.020378 | -1 / 48 |
| 2026 R14+ | 97 | 69 | +1 | -0.014185 | +1 / 35 |
| Full 2026 | 211 | 152 | 0 | -0.017531 | 0 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-od-reverse-k08-r10 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="520.3339335744608" x2="520.3339335744608" y1="20" y2="143" class="zero"/><line x1="471.7931829648899" x2="471.7931829648899" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="377.48799533972544" x2="535.9908792096055" y1="38" y2="38" class="interval"/><circle cx="459.1268085929129" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.006305; tips +4</text><text x="5" y="85">Early</text><line x1="380.68250800104613" x2="574.3270865683742" y1="80" y2="80" class="interval"/><circle cx="478.2220260450551" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.004338; tips +7</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="382.6274444485549" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.014185; tips +1</text><text x="160" y="165" class="small">-0.0371</text><text x="610" y="165" text-anchor="end" class="small">+0.0092</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.005443, 95% CI [-0.011342, +0.001361].
With R14+ as a third stratum: -0.005870, CI [-0.012382, +0.000787].
Historical round-block CI [-0.011511, +0.000764].

Correct normal head: historical pooled LL -0.005358,
CI [-0.010205, +0.000240]. Round-block CI [-0.010334, -0.000122].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -1. Consensus-wrong tips
-4 / 342 paired games; primary -1 / 291,
full 2026 -3 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Port Adelaide,
+0.873 points at n=232; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.005426.
Primary excluding draws -0.006455; early -0.004042.

Direct increment over plain OD, primary / early / full 2026:
LL -0.000543 / +0.000672 / -0.003441;
tips -8 / +1 / -1.

Evidence files, with effective config hashes:

- [t40-od-reverse-k08-r10 config](../configs/t40-od-reverse-k08-r10/config.json), [full result e5ef95e4](../configs/t40-od-reverse-k08-r10/results-2026-09-05-e5ef95e4.json).
- [t40-od-reverse-k08-r10-early config](../configs/t40-od-reverse-k08-r10-early/config.json), [full result 8bdedf80](../configs/t40-od-reverse-k08-r10-early/results-2026-09-05-8bdedf80.json).
- [t40-od-reverse-k08-r10-2026 config](../configs/t40-od-reverse-k08-r10-2026/config.json), [full result 3be7402b](../configs/t40-od-reverse-k08-r10-2026/results-2026-09-05-3be7402b.json).

### t40-od-reverse-k08-r20: PARK

Insufficient evidence under I: pooledCI. No corrected prospective validation.

Mechanism: Early-window grid → Select k and RTM → Confirm on primary.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-od-reverse-k08-r20 mechanism"><title>t40-od-reverse-k08-r20 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Early-window grid</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Select k and RTM</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Confirm on primary</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.od.weight=1
elo.od.k=0.08
elo.od.home_advantage_points=10
elo.od.initial_score=85
elo.od.regression_to_mean=0.2
```

Run: `bun analysis/task40-campaign.ts --ids t40-od-reverse-k08-r20`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 728 | +12 | -0.005762 | +12 / 533 |
| Early 2016-2019 | 828 | 560 | +6 | -0.005010 | +6 / 410 |
| 2026 R0-13, burned | 114 | 84 | 0 | -0.019541 | 0 / 48 |
| 2026 R14+ | 97 | 69 | +1 | -0.007685 | +1 / 35 |
| Full 2026 | 211 | 153 | +1 | -0.014090 | +1 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-od-reverse-k08-r20 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="469.61819758399326" x2="469.61819758399326" y1="20" y2="143" class="zero"/><line x1="417.58121608174633" x2="417.58121608174633" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="328.9166231402546" x2="489.1625163846666" y1="38" y2="38" class="interval"/><circle cx="409.6502115497678" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.005762; tips +12</text><text x="5" y="85">Early</text><line x1="321.2010272311548" x2="512.8081058922618" y1="80" y2="80" class="interval"/><circle cx="417.4764648675377" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.005010; tips +6</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="389.64251657022066" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.007685; tips +1</text><text x="160" y="165" class="small">-0.0297</text><text x="610" y="165" text-anchor="end" class="small">+0.0135</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.005433, 95% CI [-0.011012, +0.000785].
With R14+ as a third stratum: -0.005543, CI [-0.011347, +0.000400].
Historical round-block CI [-0.011210, +0.000518].

Correct normal head: historical pooled LL -0.004143,
CI [-0.008665, +0.001128]. Round-block CI [-0.008923, +0.000912].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +4. Consensus-wrong tips
0 / 342 paired games; primary +3 / 291,
full 2026 -3 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Carlton,
+1.056 points at n=205; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.005554.
Primary excluding draws -0.005965; early -0.004778.

Direct increment over plain OD, primary / early / full 2026:
LL 0.000000 / 0.000000 / 0.000000;
tips 0 / 0 / 0.

Evidence files, with effective config hashes:

- [t40-od-reverse-k08-r20 config](../configs/t40-od-reverse-k08-r20/config.json), [full result c8c7b6b7](../configs/t40-od-reverse-k08-r20/results-2026-09-05-c8c7b6b7.json).
- [t40-od-reverse-k08-r20-early config](../configs/t40-od-reverse-k08-r20-early/config.json), [full result e5ca5027](../configs/t40-od-reverse-k08-r20-early/results-2026-09-05-e5ca5027.json).
- [t40-od-reverse-k08-r20-2026 config](../configs/t40-od-reverse-k08-r20-2026/config.json), [full result 193a0012](../configs/t40-od-reverse-k08-r20-2026/results-2026-09-05-193a0012.json).

### t40-od-reverse-k08-r40: PARK

Insufficient evidence under I: primary, pooledCI, oos. No corrected prospective validation.

Mechanism: Early-window grid → Select k and RTM → Confirm on primary.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-od-reverse-k08-r40 mechanism"><title>t40-od-reverse-k08-r40 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Early-window grid</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Select k and RTM</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Confirm on primary</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.od.weight=1
elo.od.k=0.08
elo.od.home_advantage_points=10
elo.od.initial_score=85
elo.od.regression_to_mean=0.4
```

Run: `bun analysis/task40-campaign.ts --ids t40-od-reverse-k08-r40`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 726 | +10 | -0.003359 | +10 / 533 |
| Early 2016-2019 | 828 | 562 | +8 | -0.004536 | +8 / 410 |
| 2026 R0-13, burned | 114 | 85 | +1 | -0.013614 | +1 / 48 |
| 2026 R14+ | 97 | 68 | 0 | +0.005213 | 0 / 35 |
| Full 2026 | 211 | 153 | +1 | -0.004959 | +1 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-od-reverse-k08-r40 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="334.27534672082743" x2="334.27534672082743" y1="20" y2="143" class="zero"/><line x1="278.9314843669068" x2="278.9314843669068" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="212.30017133989162" x2="380.5933129801477" y1="38" y2="38" class="interval"/><circle cx="297.0946452739664" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.003359; tips +10</text><text x="5" y="85">Early</text><line x1="194.40337934266788" x2="374.62695274109376" y1="80" y2="80" class="interval"/><circle cx="284.06413097252084" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.004536; tips +8</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="391.97224845359517" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">+0.005213; tips 0</text><text x="160" y="165" class="small">-0.0157</text><text x="610" y="165" text-anchor="end" class="small">+0.0249</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.003875, 95% CI [-0.009312, +0.002043].
With R14+ as a third stratum: -0.003431, CI [-0.009178, +0.002095].
Historical round-block CI [-0.009896, +0.001985].

Correct normal head: historical pooled LL -0.000590,
CI [-0.005109, +0.004387]. Round-block CI [-0.005632, +0.004444].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +5. Consensus-wrong tips
+4 / 342 paired games; primary +5 / 291,
full 2026 -1 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: North Melbourne,
+1.922 points at n=202; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.004245.
Primary excluding draws -0.003661; early -0.004421.

Direct increment over plain OD, primary / early / full 2026:
LL +0.002403 / +0.000474 / +0.009131;
tips -2 / +2 / 0.

Evidence files, with effective config hashes:

- [t40-od-reverse-k08-r40 config](../configs/t40-od-reverse-k08-r40/config.json), [full result 74d91cf8](../configs/t40-od-reverse-k08-r40/results-2026-09-05-74d91cf8.json).
- [t40-od-reverse-k08-r40-early config](../configs/t40-od-reverse-k08-r40-early/config.json), [full result 724cd1f6](../configs/t40-od-reverse-k08-r40-early/results-2026-09-05-724cd1f6.json).
- [t40-od-reverse-k08-r40-2026 config](../configs/t40-od-reverse-k08-r40-2026/config.json), [full result 165f7c19](../configs/t40-od-reverse-k08-r40-2026/results-2026-09-05-165f7c19.json).

### t40-od-reverse-k12-r10: KILL

consensus-wrong guard.

Mechanism: Early-window grid → Select k and RTM → Confirm on primary.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-od-reverse-k12-r10 mechanism"><title>t40-od-reverse-k12-r10 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Early-window grid</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Select k and RTM</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Confirm on primary</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.od.weight=1
elo.od.k=0.12
elo.od.home_advantage_points=10
elo.od.initial_score=85
elo.od.regression_to_mean=0.1
```

Run: `bun analysis/task40-campaign.ts --ids t40-od-reverse-k12-r10`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 720 | +4 | -0.007691 | +4 / 533 |
| Early 2016-2019 | 828 | 566 | +12 | -0.006837 | +12 / 410 |
| 2026 R0-13, burned | 114 | 84 | 0 | -0.024938 | 0 / 48 |
| 2026 R14+ | 97 | 70 | +2 | -0.013880 | +2 / 35 |
| Full 2026 | 211 | 154 | +2 | -0.019854 | +2 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-od-reverse-k12-r10 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="533.8626051091411" x2="533.8626051091411" y1="20" y2="143" class="zero"/><line x1="481.0831624066079" x2="481.0831624066079" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="369.19986823432856" x2="538.4668399073482" y1="38" y2="38" class="interval"/><circle cx="452.6818418280022" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.007691; tips +4</text><text x="5" y="85">Early</text><line x1="354.6554262035305" x2="576.6875700656192" y1="80" y2="80" class="interval"/><circle cx="461.69219570785236" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.006837; tips +12</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="387.344075160226" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.013880; tips +2</text><text x="160" y="165" class="small">-0.0354</text><text x="610" y="165" text-anchor="end" class="small">+0.0072</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.007317, 95% CI [-0.013464, -0.000617].
With R14+ as a third stratum: -0.007637, CI [-0.014043, -0.001158].
Historical round-block CI [-0.013221, -0.001144].

Correct normal head: historical pooled LL -0.009740,
CI [-0.014966, -0.004081]. Round-block CI [-0.014808, -0.004418].
Holm-adjusted round-sign p=0.0305.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +1. Consensus-wrong tips
-6 / 342 paired games; primary -3 / 291,
full 2026 -3 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Port Adelaide,
+0.897 points at n=232; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.007193.
Primary excluding draws -0.007995; early -0.006452.

Direct increment over plain OD, primary / early / full 2026:
LL -0.001929 / -0.001827 / -0.005764;
tips -8 / +6 / +1.

Evidence files, with effective config hashes:

- [t40-od-reverse-k12-r10 config](../configs/t40-od-reverse-k12-r10/config.json), [full result e7655b15](../configs/t40-od-reverse-k12-r10/results-2026-09-05-e7655b15.json).
- [t40-od-reverse-k12-r10-early config](../configs/t40-od-reverse-k12-r10-early/config.json), [full result fac36a3d](../configs/t40-od-reverse-k12-r10-early/results-2026-09-05-fac36a3d.json).
- [t40-od-reverse-k12-r10-2026 config](../configs/t40-od-reverse-k12-r10-2026/config.json), [full result 39bc3aca](../configs/t40-od-reverse-k12-r10-2026/results-2026-09-05-39bc3aca.json).

### t40-od-reverse-k12-r20: KILL

consensus-wrong guard.

Mechanism: Early-window grid → Select k and RTM → Confirm on primary.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-od-reverse-k12-r20 mechanism"><title>t40-od-reverse-k12-r20 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Early-window grid</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Select k and RTM</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Confirm on primary</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.od.weight=1
elo.od.k=0.12
elo.od.home_advantage_points=10
elo.od.initial_score=85
elo.od.regression_to_mean=0.2
```

Run: `bun analysis/task40-campaign.ts --ids t40-od-reverse-k12-r20`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 725 | +9 | -0.007730 | +9 / 533 |
| Early 2016-2019 | 828 | 568 | +14 | -0.007827 | +14 / 410 |
| 2026 R0-13, burned | 114 | 84 | 0 | -0.024254 | 0 / 48 |
| 2026 R14+ | 97 | 69 | +1 | -0.009753 | +1 / 35 |
| Full 2026 | 211 | 153 | +1 | -0.017588 | +1 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-od-reverse-k12-r20 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="499.29645750390216" x2="499.29645750390216" y1="20" y2="143" class="zero"/><line x1="442.5045069094276" x2="442.5045069094276" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="329.46619645472407" x2="497.63974112454304" y1="38" y2="38" class="interval"/><circle cx="411.49599773975524" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.007730; tips +9</text><text x="5" y="85">Early</text><line x1="308.17882410440313" x2="518.6342900470258" y1="80" y2="80" class="interval"/><circle cx="410.39094452115404" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.007827; tips +14</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="388.5133755304339" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.009753; tips +1</text><text x="160" y="165" class="small">-0.0299</text><text x="610" y="165" text-anchor="end" class="small">+0.0097</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.007773, 95% CI [-0.013546, -0.001507].
With R14+ as a third stratum: -0.007869, CI [-0.013942, -0.002045].
Historical round-block CI [-0.013542, -0.001844].

Correct normal head: historical pooled LL -0.009097,
CI [-0.013810, -0.003898]. Round-block CI [-0.013782, -0.003986].
Holm-adjusted round-sign p=0.0305.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +6. Consensus-wrong tips
-4 / 342 paired games; primary -1 / 291,
full 2026 -3 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Port Adelaide,
+0.637 points at n=232; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.007762.
Primary excluding draws -0.008072; early -0.007492.

Direct increment over plain OD, primary / early / full 2026:
LL -0.001968 / -0.002817 / -0.003497;
tips -3 / +8 / 0.

Evidence files, with effective config hashes:

- [t40-od-reverse-k12-r20 config](../configs/t40-od-reverse-k12-r20/config.json), [full result 978661e6](../configs/t40-od-reverse-k12-r20/results-2026-09-05-978661e6.json).
- [t40-od-reverse-k12-r20-early config](../configs/t40-od-reverse-k12-r20-early/config.json), [full result 7f217ed7](../configs/t40-od-reverse-k12-r20-early/results-2026-09-05-7f217ed7.json).
- [t40-od-reverse-k12-r20-2026 config](../configs/t40-od-reverse-k12-r20-2026/config.json), [full result e31fd02b](../configs/t40-od-reverse-k12-r20-2026/results-2026-09-05-e31fd02b.json).

### t40-od-reverse-k12-r40: KILL

consensus-wrong guard.

Mechanism: Early-window grid → Select k and RTM → Confirm on primary.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-od-reverse-k12-r40 mechanism"><title>t40-od-reverse-k12-r40 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Early-window grid</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Select k and RTM</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Confirm on primary</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.od.weight=1
elo.od.k=0.12
elo.od.home_advantage_points=10
elo.od.initial_score=85
elo.od.regression_to_mean=0.4
```

Run: `bun analysis/task40-campaign.ts --ids t40-od-reverse-k12-r40`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 724 | +8 | -0.006709 | +8 / 533 |
| Early 2016-2019 | 828 | 564 | +10 | -0.008292 | +10 / 410 |
| 2026 R0-13, burned | 114 | 86 | +2 | -0.019276 | +2 / 48 |
| 2026 R14+ | 97 | 69 | +1 | -0.001210 | +1 / 35 |
| Full 2026 | 211 | 155 | +3 | -0.010971 | +3 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-od-reverse-k12-r40 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="410.63433141561416" x2="410.63433141561416" y1="20" y2="143" class="zero"/><line x1="348.9403982886224" x2="348.9403982886224" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="235.04703726557824" x2="418.1764530345815" y1="38" y2="38" class="interval"/><circle cx="327.85785725712753" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.006709; tips +8</text><text x="5" y="85">Early</text><line x1="210.26865761076752" x2="413.87856046339243" y1="80" y2="80" class="interval"/><circle cx="308.31647467146536" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.008292; tips +10</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="395.6999925160057" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.001210; tips +1</text><text x="160" y="165" class="small">-0.0203</text><text x="610" y="165" text-anchor="end" class="small">+0.0162</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.007402, 95% CI [-0.012485, -0.001533].
With R14+ as a third stratum: -0.007100, CI [-0.012540, -0.001929].
Historical round-block CI [-0.012901, -0.001623].

Correct normal head: historical pooled LL -0.006778,
CI [-0.011041, -0.001934]. Round-block CI [-0.011358, -0.001947].
Holm-adjusted round-sign p=0.2016.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +7. Consensus-wrong tips
-2 / 342 paired games; primary -1 / 291,
full 2026 -1 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Carlton,
+1.029 points at n=205; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.007607.
Primary excluding draws -0.007129; early -0.008047.

Direct increment over plain OD, primary / early / full 2026:
LL -0.000947 / -0.003282 / +0.003119;
tips -4 / +4 / +2.

Evidence files, with effective config hashes:

- [t40-od-reverse-k12-r40 config](../configs/t40-od-reverse-k12-r40/config.json), [full result 213c2410](../configs/t40-od-reverse-k12-r40/results-2026-09-05-213c2410.json).
- [t40-od-reverse-k12-r40-early config](../configs/t40-od-reverse-k12-r40-early/config.json), [full result 78f149f3](../configs/t40-od-reverse-k12-r40-early/results-2026-09-05-78f149f3.json).
- [t40-od-reverse-k12-r40-2026 config](../configs/t40-od-reverse-k12-r40-2026/config.json), [full result dbc1f077](../configs/t40-od-reverse-k12-r40-2026/results-2026-09-05-dbc1f077.json).

### t40-od-shot-025: KILL

consensus-wrong guard.

Mechanism: Completed scoring shots → Mix OD score target → Next-match rating gap.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-od-shot-025 mechanism"><title>t40-od-shot-025 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Completed scoring shots</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Mix OD score target</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Next-match rating gap</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.od.weight=1
elo.od.k=0.08
elo.od.home_advantage_points=10
elo.od.initial_score=85
elo.od.regression_to_mean=0.2
elo.od.shot_score_weight=0.25
```

Run: `bun analysis/task40-campaign.ts --ids t40-od-shot-025`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 723 | +7 | -0.006428 | +7 / 533 |
| Early 2016-2019 | 828 | 555 | +1 | -0.006020 | +1 / 410 |
| 2026 R0-13, burned | 114 | 85 | +1 | -0.018669 | +1 / 48 |
| 2026 R14+ | 97 | 69 | +1 | -0.007103 | +1 / 35 |
| Full 2026 | 211 | 154 | +2 | -0.013352 | +2 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-od-shot-025 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="469.47393342331543" x2="469.47393342331543" y1="20" y2="143" class="zero"/><line x1="416.4538864778383" x2="416.4538864778383" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="320.0409235739012" x2="481.4745211010133" y1="38" y2="38" class="interval"/><circle cx="401.3083566798846" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.006428; tips +7</text><text x="5" y="85">Early</text><line x1="312.0422999079065" x2="501.6691296946879" y1="80" y2="80" class="interval"/><circle cx="405.6339577080091" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.006020; tips +1</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="394.15799677573614" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.007103; tips +1</text><text x="160" y="165" class="small">-0.0292</text><text x="610" y="165" text-anchor="end" class="small">+0.0133</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.006250, 95% CI [-0.011632, -0.000072].
With R14+ as a third stratum: -0.006291, CI [-0.012003, -0.000460].
Historical round-block CI [-0.012250, -0.000274].

Correct normal head: historical pooled LL -0.004289,
CI [-0.008954, +0.000848]. Round-block CI [-0.009266, +0.000786].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +2. Consensus-wrong tips
-3 / 342 paired games; primary -1 / 291,
full 2026 -2 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Carlton,
+1.248 points at n=205; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.006358.
Primary excluding draws -0.006539; early -0.005846.

Direct increment over plain OD, primary / early / full 2026:
LL -0.000666 / -0.001010 / +0.000739;
tips -5 / -5 / +1.

Evidence files, with effective config hashes:

- [t40-od-shot-025 config](../configs/t40-od-shot-025/config.json), [full result 1bd8c068](../configs/t40-od-shot-025/results-2026-09-05-1bd8c068.json).
- [t40-od-shot-025-early config](../configs/t40-od-shot-025-early/config.json), [full result 919b90ad](../configs/t40-od-shot-025-early/results-2026-09-05-919b90ad.json).
- [t40-od-shot-025-2026 config](../configs/t40-od-shot-025-2026/config.json), [full result 03341135](../configs/t40-od-shot-025-2026/results-2026-09-05-03341135.json).

### t40-od-shot-050: KILL

consensus-wrong guard.

Mechanism: Completed scoring shots → Mix OD score target → Next-match rating gap.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-od-shot-050 mechanism"><title>t40-od-shot-050 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Completed scoring shots</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Mix OD score target</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Next-match rating gap</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.od.weight=1
elo.od.k=0.08
elo.od.home_advantage_points=10
elo.od.initial_score=85
elo.od.regression_to_mean=0.2
elo.od.shot_score_weight=0.5
```

Run: `bun analysis/task40-campaign.ts --ids t40-od-shot-050`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 727 | +11 | -0.006807 | +11 / 533 |
| Early 2016-2019 | 828 | 555 | +1 | -0.006652 | +1 / 410 |
| 2026 R0-13, burned | 114 | 85 | +1 | -0.017538 | +1 / 48 |
| 2026 R14+ | 97 | 69 | +1 | -0.006145 | +1 / 35 |
| Full 2026 | 211 | 154 | +2 | -0.012300 | +2 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-od-shot-050 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="449.02453192381705" x2="449.02453192381705" y1="20" y2="143" class="zero"/><line x1="397.29214128384376" x2="397.29214128384376" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="296.633089212982" x2="458.92661870760116" y1="38" y2="38" class="interval"/><circle cx="378.5918684135802" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.006807; tips +11</text><text x="5" y="85">Early</text><line x1="289.59075338954835" x2="474.635097551001" y1="80" y2="80" class="interval"/><circle cx="380.19904104445266" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.006652; tips +1</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="385.4471145748644" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.006145; tips +1</text><text x="160" y="165" class="small">-0.0279</text><text x="610" y="165" text-anchor="end" class="small">+0.0156</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.006739, 95% CI [-0.012391, -0.000258].
With R14+ as a third stratum: -0.006710, CI [-0.012481, -0.000705].
Historical round-block CI [-0.012657, -0.000743].

Correct normal head: historical pooled LL -0.004187,
CI [-0.009151, +0.001145]. Round-block CI [-0.009082, +0.000869].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +3. Consensus-wrong tips
-1 / 342 paired games; primary +1 / 291,
full 2026 -2 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Carlton,
+1.440 points at n=205; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.006836.
Primary excluding draws -0.006824; early -0.006536.

Direct increment over plain OD, primary / early / full 2026:
LL -0.001045 / -0.001642 / +0.001790;
tips -1 / -5 / +1.

Evidence files, with effective config hashes:

- [t40-od-shot-050 config](../configs/t40-od-shot-050/config.json), [full result 05e46d84](../configs/t40-od-shot-050/results-2026-09-05-05e46d84.json).
- [t40-od-shot-050-early config](../configs/t40-od-shot-050-early/config.json), [full result 2ec19d59](../configs/t40-od-shot-050-early/results-2026-09-05-2ec19d59.json).
- [t40-od-shot-050-2026 config](../configs/t40-od-shot-050-2026/config.json), [full result 59efc071](../configs/t40-od-shot-050-2026/results-2026-09-05-59efc071.json).

### t40-od-shot-075: PARK

Passes I. Fails the corrected-head magnitude/precision test and has no prospective validation.

Mechanism: Completed scoring shots → Mix OD score target → Next-match rating gap.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-od-shot-075 mechanism"><title>t40-od-shot-075 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Completed scoring shots</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Mix OD score target</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Next-match rating gap</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.od.weight=1
elo.od.k=0.08
elo.od.home_advantage_points=10
elo.od.initial_score=85
elo.od.regression_to_mean=0.2
elo.od.shot_score_weight=0.75
```

Run: `bun analysis/task40-campaign.ts --ids t40-od-shot-075`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 724 | +8 | -0.006891 | +8 / 533 |
| Early 2016-2019 | 828 | 554 | 0 | -0.006900 | 0 / 410 |
| 2026 R0-13, burned | 114 | 85 | +1 | -0.016140 | +1 / 48 |
| 2026 R14+ | 97 | 68 | 0 | -0.004802 | 0 / 35 |
| Full 2026 | 211 | 153 | +1 | -0.010928 | +1 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-od-shot-075 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="438.74521181076324" x2="438.74521181076324" y1="20" y2="143" class="zero"/><line x1="390.44021949368687" x2="390.44021949368687" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="291.0206627522331" x2="449.23988966151836" y1="38" y2="38" class="interval"/><circle cx="372.1746645310486" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.006891; tips +8</text><text x="5" y="85">Early</text><line x1="284.5602789294473" x2="463.80992934690244" y1="80" y2="80" class="interval"/><circle cx="372.07977888694654" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.006900; tips 0</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="392.35650123079733" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.004802; tips 0</text><text x="160" y="165" class="small">-0.0289</text><text x="610" y="165" text-anchor="end" class="small">+0.0177</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.006895, 95% CI [-0.012872, -0.000071].
With R14+ as a third stratum: -0.006793, CI [-0.012799, -0.000637].
Historical round-block CI [-0.012990, -0.000708].

Correct normal head: historical pooled LL -0.003838,
CI [-0.008939, +0.001898]. Round-block CI [-0.009096, +0.001474].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: PASS. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +1. Consensus-wrong tips
0 / 342 paired games; primary +2 / 291,
full 2026 -2 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Carlton,
+1.632 points at n=205; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.006980.
Primary excluding draws -0.006814; early -0.006844.

Direct increment over plain OD, primary / early / full 2026:
LL -0.001129 / -0.001890 / +0.003162;
tips -4 / -6 / 0.

Evidence files, with effective config hashes:

- [t40-od-shot-075 config](../configs/t40-od-shot-075/config.json), [full result 2dd2e10f](../configs/t40-od-shot-075/results-2026-09-05-2dd2e10f.json).
- [t40-od-shot-075-early config](../configs/t40-od-shot-075-early/config.json), [full result 09445db5](../configs/t40-od-shot-075-early/results-2026-09-05-09445db5.json).
- [t40-od-shot-075-2026 config](../configs/t40-od-shot-075-2026/config.json), [full result e9e2ff4d](../configs/t40-od-shot-075-2026/results-2026-09-05-e9e2ff4d.json).

### t40-od-shot-100: PARK

Insufficient evidence under I: pooledCI. No corrected prospective validation.

Mechanism: Completed scoring shots → Mix OD score target → Next-match rating gap.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-od-shot-100 mechanism"><title>t40-od-shot-100 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Completed scoring shots</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Mix OD score target</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Next-match rating gap</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.od.weight=1
elo.od.k=0.08
elo.od.home_advantage_points=10
elo.od.initial_score=85
elo.od.regression_to_mean=0.2
elo.od.shot_score_weight=1
```

Run: `bun analysis/task40-campaign.ts --ids t40-od-shot-100`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 727 | +11 | -0.006673 | +11 / 533 |
| Early 2016-2019 | 828 | 553 | -1 | -0.006764 | -1 / 410 |
| 2026 R0-13, burned | 114 | 85 | +1 | -0.014473 | +1 / 48 |
| 2026 R14+ | 97 | 68 | 0 | -0.003081 | 0 / 35 |
| Full 2026 | 211 | 153 | +1 | -0.009236 | +1 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-od-shot-100 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="426.93697889201013" x2="426.93697889201013" y1="20" y2="143" class="zero"/><line x1="382.6737830699395" x2="382.6737830699395" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="288.25219324567485" x2="442.74705254305877" y1="38" y2="38" class="interval"/><circle cx="367.86468240155057" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.006673; tips +11</text><text x="5" y="85">Early</text><line x1="278.25118543435815" x2="457.04700868278627" y1="80" y2="80" class="interval"/><circle cx="367.058543992712" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.006764; tips -1</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="399.66419564652017" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.003081; tips 0</text><text x="160" y="165" class="small">-0.0302</text><text x="610" y="165" text-anchor="end" class="small">+0.0207</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.006713, 95% CI [-0.013207, +0.000599].
With R14+ as a third stratum: -0.006535, CI [-0.013075, -0.000006].
Historical round-block CI [-0.013145, +0.000058].

Correct normal head: historical pooled LL -0.003238,
CI [-0.008832, +0.002896]. Round-block CI [-0.008796, +0.002440].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +5. Consensus-wrong tips
+1 / 342 paired games; primary +3 / 291,
full 2026 -2 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Carlton,
+1.824 points at n=205; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.006787.
Primary excluding draws -0.006501; early -0.006766.

Direct increment over plain OD, primary / early / full 2026:
LL -0.000911 / -0.001754 / +0.004855;
tips -1 / -7 / 0.

Evidence files, with effective config hashes:

- [t40-od-shot-100 config](../configs/t40-od-shot-100/config.json), [full result fe139ab9](../configs/t40-od-shot-100/results-2026-09-05-fe139ab9.json).
- [t40-od-shot-100-early config](../configs/t40-od-shot-100-early/config.json), [full result ea8c82b7](../configs/t40-od-shot-100-early/results-2026-09-05-ea8c82b7.json).
- [t40-od-shot-100-2026 config](../configs/t40-od-shot-100-2026/config.json), [full result 6019874f](../configs/t40-od-shot-100-2026/results-2026-09-05-6019874f.json).

### t40-offset-c0: KILL

recent tip regression, R14+ tip regression, consensus-wrong guard.

Mechanism: Past prediction residual → Shrunk team correction → Adjusted margin sign.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-offset-c0 mechanism"><title>t40-offset-c0 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Past prediction residual</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Shrunk team correction</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Adjusted margin sign</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.shot_margin_weight=1
output.team_offset.k=32
output.team_offset.season_carry=0
```

Run: `bun analysis/task40-campaign.ts --ids t40-offset-c0`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 715 | -1 | -0.007232 | -1 / 533 |
| Early 2016-2019 | 828 | 559 | +5 | -0.010636 | +5 / 410 |
| 2026 R0-13, burned | 114 | 83 | -1 | +0.004352 | -1 / 48 |
| 2026 R14+ | 97 | 66 | -2 | -0.004330 | -2 / 35 |
| Full 2026 | 211 | 149 | -3 | +0.000361 | -3 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-offset-c0 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="410.7677002301642" x2="410.7677002301642" y1="20" y2="143" class="zero"/><line x1="378.4664094211848" x2="378.4664094211848" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="316.45638022352256" x2="416.69167602253805" y1="38" y2="38" class="interval"/><circle cx="364.04692048318407" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.007232; tips -1</text><text x="5" y="85">Early</text><line x1="279.36415381409915" x2="399.5761029006939" y1="80" y2="80" class="interval"/><circle cx="342.05729842700816" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.010636; tips +5</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="382.7925622896299" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.004330; tips -2</text><text x="160" y="165" class="small">-0.0388</text><text x="610" y="165" text-anchor="end" class="small">+0.0308</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.008723, 95% CI [-0.014552, -0.002736].
With R14+ as a third stratum: -0.008509, CI [-0.014475, -0.002534].
Historical round-block CI [-0.014350, -0.003184].

Correct normal head: historical pooled LL -0.009839,
CI [-0.014698, -0.004864]. Round-block CI [-0.014731, -0.005221].
Holm-adjusted round-sign p=0.0066.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -8. Consensus-wrong tips
-5 / 342 paired games; primary -3 / 291,
full 2026 -2 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Sydney,
+0.793 points at n=216; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.008431.
Primary excluding draws -0.007181; early -0.010422.

Evidence files, with effective config hashes:

- [t40-offset-c0 config](../configs/t40-offset-c0/config.json), [full result 683a6cff](../configs/t40-offset-c0/results-2026-09-05-683a6cff.json).
- [t40-offset-c0-early config](../configs/t40-offset-c0-early/config.json), [full result b29f1385](../configs/t40-offset-c0-early/results-2026-09-05-b29f1385.json).
- [t40-offset-c0-2026 config](../configs/t40-offset-c0-2026/config.json), [full result 18bd79fd](../configs/t40-offset-c0-2026/results-2026-09-05-18bd79fd.json).

### t40-offset-c1: KILL

recent tip regression, consensus-wrong guard.

Mechanism: Past prediction residual → Shrunk team correction → Adjusted margin sign.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-offset-c1 mechanism"><title>t40-offset-c1 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Past prediction residual</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Shrunk team correction</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Adjusted margin sign</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.shot_margin_weight=1
output.team_offset.k=32
output.team_offset.season_carry=1
```

Run: `bun analysis/task40-campaign.ts --ids t40-offset-c1`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 714 | -2 | -0.007611 | -2 / 533 |
| Early 2016-2019 | 828 | 559 | +5 | -0.007454 | +5 / 410 |
| 2026 R0-13, burned | 114 | 78 | -6 | +0.004375 | -6 / 48 |
| 2026 R14+ | 97 | 68 | 0 | -0.025301 | 0 / 35 |
| Full 2026 | 211 | 146 | -6 | -0.009267 | -6 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-offset-c1 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="584.3919081890625" x2="584.3919081890625" y1="20" y2="143" class="zero"/><line x1="544.6334417447398" x2="544.6334417447398" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="456.43828712116215" x2="595.5327546053355" y1="38" y2="38" class="interval"/><circle cx="523.8695752490545" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.007611; tips -2</text><text x="5" y="85">Early</text><line x1="433.12211598485993" x2="610" y1="80" y2="80" class="interval"/><circle cx="525.1170745966951" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.007454; tips +5</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="599.4234970793557" y1="122" y2="122" class="interval"/><circle cx="383.20647619674554" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.025301; tips 0</text><text x="160" y="165" class="small">-0.0534</text><text x="610" y="165" text-anchor="end" class="small">+0.0032</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.007543, 95% CI [-0.014200, -0.000630].
With R14+ as a third stratum: -0.008409, CI [-0.014880, -0.001796].
Historical round-block CI [-0.013738, -0.001234].

Correct normal head: historical pooled LL -0.011064,
CI [-0.016544, -0.005060]. Round-block CI [-0.016328, -0.005905].
Holm-adjusted round-sign p=0.0124.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -12. Consensus-wrong tips
-7 / 342 paired games; primary -3 / 291,
full 2026 -4 / 51, R14+ 0 / 23.

Largest eligible absolute team-bias worsening: Port Adelaide,
+1.294 points at n=232; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.006929.
Primary excluding draws -0.007399; early -0.007103.

Evidence files, with effective config hashes:

- [t40-offset-c1 config](../configs/t40-offset-c1/config.json), [full result 94fbe33d](../configs/t40-offset-c1/results-2026-09-05-94fbe33d.json).
- [t40-offset-c1-early config](../configs/t40-offset-c1-early/config.json), [full result 20918b81](../configs/t40-offset-c1-early/results-2026-09-05-20918b81.json).
- [t40-offset-c1-2026 config](../configs/t40-offset-c1-2026/config.json), [full result 2e95e258](../configs/t40-offset-c1-2026/results-2026-09-05-2e95e258.json).

### t40-offset-k08: KILL

recent tip regression, R14+ tip regression, consensus-wrong guard.

Mechanism: Past prediction residual → Shrunk team correction → Adjusted margin sign.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-offset-k08 mechanism"><title>t40-offset-k08 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Past prediction residual</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Shrunk team correction</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Adjusted margin sign</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.shot_margin_weight=1
output.team_offset.k=8
output.team_offset.season_carry=0.5
```

Run: `bun analysis/task40-campaign.ts --ids t40-offset-k08`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 715 | -1 | -0.006920 | -1 / 533 |
| Early 2016-2019 | 828 | 559 | +5 | -0.008828 | +5 / 410 |
| 2026 R0-13, burned | 114 | 81 | -3 | -0.000759 | -3 / 48 |
| 2026 R14+ | 97 | 67 | -1 | -0.016301 | -1 / 35 |
| Full 2026 | 211 | 148 | -4 | -0.007904 | -4 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-offset-k08 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="499.08390500592066" x2="499.08390500592066" y1="20" y2="143" class="zero"/><line x1="463.2078204341813" x2="463.2078204341813" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="383.5059090327661" x2="521.5434035249677" y1="38" y2="38" class="interval"/><circle cx="449.4347316343452" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.006920; tips -1</text><text x="5" y="85">Early</text><line x1="342.6613591510136" x2="525.5960328612347" y1="80" y2="80" class="interval"/><circle cx="435.74165044868323" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.008828; tips +5</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="382.1233698668523" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.016301; tips -1</text><text x="160" y="165" class="small">-0.0473</text><text x="610" y="165" text-anchor="end" class="small">+0.0155</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.007756, 95% CI [-0.016163, -0.000066].
With R14+ as a third stratum: -0.008173, CI [-0.015890, -0.000281].
Historical round-block CI [-0.014741, -0.000543].

Correct normal head: historical pooled LL -0.013248,
CI [-0.020246, -0.006291]. Round-block CI [-0.019438, -0.006903].
Holm-adjusted round-sign p=0.0066.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -10. Consensus-wrong tips
-6 / 342 paired games; primary -4 / 291,
full 2026 -2 / 51, R14+ 0 / 23.

Largest eligible absolute team-bias worsening: Port Adelaide,
+0.906 points at n=232; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.007073.
Primary excluding draws -0.006793; early -0.008408.

Evidence files, with effective config hashes:

- [t40-offset-k08 config](../configs/t40-offset-k08/config.json), [full result 30c80d02](../configs/t40-offset-k08/results-2026-09-05-30c80d02.json).
- [t40-offset-k08-early config](../configs/t40-offset-k08-early/config.json), [full result 82dfe148](../configs/t40-offset-k08-early/results-2026-09-05-82dfe148.json).
- [t40-offset-k08-2026 config](../configs/t40-offset-k08-2026/config.json), [full result 95fc048e](../configs/t40-offset-k08-2026/results-2026-09-05-95fc048e.json).

### t40-offset-k16: KILL

recent tip regression, R14+ tip regression, consensus-wrong guard.

Mechanism: Past prediction residual → Shrunk team correction → Adjusted margin sign.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-offset-k16 mechanism"><title>t40-offset-k16 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Past prediction residual</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Shrunk team correction</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Adjusted margin sign</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.shot_margin_weight=1
output.team_offset.k=16
output.team_offset.season_carry=0.5
```

Run: `bun analysis/task40-campaign.ts --ids t40-offset-k16`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 717 | +1 | -0.007737 | +1 / 533 |
| Early 2016-2019 | 828 | 560 | +6 | -0.010015 | +6 / 410 |
| 2026 R0-13, burned | 114 | 80 | -4 | +0.000350 | -4 / 48 |
| 2026 R14+ | 97 | 66 | -2 | -0.015353 | -2 / 35 |
| Full 2026 | 211 | 146 | -6 | -0.006869 | -6 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-offset-k16 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="493.7092364392698" x2="493.7092364392698" y1="20" y2="143" class="zero"/><line x1="457.0139368561127" x2="457.0139368561127" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="375.2423336146557" x2="502.407224126102" y1="38" y2="38" class="interval"/><circle cx="436.92738432977825" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.007737; tips +1</text><text x="5" y="85">Early</text><line x1="336.4811802264071" x2="497.41905655185263" y1="80" y2="80" class="interval"/><circle cx="420.209534535612" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.010015; tips +6</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="381.0293271709704" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.015353; tips -2</text><text x="160" y="165" class="small">-0.0455</text><text x="610" y="165" text-anchor="end" class="small">+0.0158</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.008735, 95% CI [-0.015594, -0.001869].
With R14+ as a third stratum: -0.009058, CI [-0.015587, -0.002483].
Historical round-block CI [-0.014799, -0.002664].

Correct normal head: historical pooled LL -0.012587,
CI [-0.018439, -0.006655]. Round-block CI [-0.017842, -0.007197].
Holm-adjusted round-sign p=0.0066.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -14. Consensus-wrong tips
-6 / 342 paired games; primary -2 / 291,
full 2026 -4 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Port Adelaide,
+0.838 points at n=232; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.008154.
Primary excluding draws -0.007594; early -0.009659.

Evidence files, with effective config hashes:

- [t40-offset-k16 config](../configs/t40-offset-k16/config.json), [full result 5536fcd6](../configs/t40-offset-k16/results-2026-09-05-5536fcd6.json).
- [t40-offset-k16-early config](../configs/t40-offset-k16-early/config.json), [full result c8452e5c](../configs/t40-offset-k16-early/results-2026-09-05-c8452e5c.json).
- [t40-offset-k16-2026 config](../configs/t40-offset-k16-2026/config.json), [full result 7edaad24](../configs/t40-offset-k16-2026/results-2026-09-05-7edaad24.json).

### t40-offset-tail: KILL

recent tip regression, consensus-wrong guard.

Mechanism: Past prediction residual → Apply only beyond 24 → Adjusted margin sign.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-offset-tail mechanism"><title>t40-offset-tail mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Past prediction residual</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Apply only beyond 24</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Adjusted margin sign</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.shot_margin_weight=1
output.team_offset.k=32
output.team_offset.season_carry=0.5
output.team_offset.tail_threshold=24
```

Run: `bun analysis/task40-campaign.ts --ids t40-offset-tail`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 721 | +5 | -0.005775 | +5 / 533 |
| Early 2016-2019 | 828 | 560 | +6 | -0.009295 | +6 / 410 |
| 2026 R0-13, burned | 114 | 81 | -3 | +0.002874 | -3 / 48 |
| 2026 R14+ | 97 | 69 | +1 | -0.008877 | +1 / 35 |
| Full 2026 | 211 | 150 | -2 | -0.002528 | -2 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-offset-tail per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="444.6126757340247" x2="444.6126757340247" y1="20" y2="143" class="zero"/><line x1="410.0000853438395" x2="410.0000853438395" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="351.19775882450654" x2="460.2392467201292" y1="38" y2="38" class="interval"/><circle cx="404.6350532713935" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.005775; tips +5</text><text x="5" y="85">Early</text><line x1="313.0462557440203" x2="443.0130335227189" y1="80" y2="80" class="interval"/><circle cx="380.2653093648751" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.009295; tips +6</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="383.1629410939995" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.008877; tips +1</text><text x="160" y="165" class="small">-0.0411</text><text x="610" y="165" text-anchor="end" class="small">+0.0239</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.007317, 95% CI [-0.012839, -0.001194].
With R14+ as a third stratum: -0.007393, CI [-0.013346, -0.001560].
Historical round-block CI [-0.012768, -0.001819].

Correct normal head: historical pooled LL -0.008058,
CI [-0.012767, -0.002980]. Round-block CI [-0.012713, -0.003324].
Holm-adjusted round-sign p=0.0354.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -4. Consensus-wrong tips
-2 / 342 paired games; primary 0 / 291,
full 2026 -2 / 51, R14+ 0 / 23.

Largest eligible absolute team-bias worsening: Port Adelaide,
+0.953 points at n=232; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.007193.
Primary excluding draws -0.005789; early -0.009317.

Evidence files, with effective config hashes:

- [t40-offset-tail config](../configs/t40-offset-tail/config.json), [full result 0eb3fe65](../configs/t40-offset-tail/results-2026-09-05-0eb3fe65.json).
- [t40-offset-tail-early config](../configs/t40-offset-tail-early/config.json), [full result 9cc916ae](../configs/t40-offset-tail-early/results-2026-09-05-9cc916ae.json).
- [t40-offset-tail-2026 config](../configs/t40-offset-tail-2026/config.json), [full result 97170510](../configs/t40-offset-tail-2026/results-2026-09-05-97170510.json).

### t40-offset-v4: KILL

recent tip regression, R14+ tip regression, consensus-wrong guard.

Mechanism: Past prediction residual → Shrunk team correction → Adjusted margin sign.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-offset-v4 mechanism"><title>t40-offset-v4 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Past prediction residual</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Shrunk team correction</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Adjusted margin sign</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.shot_margin_weight=1
output.team_offset.k=32
output.team_offset.season_carry=0.5
```

Run: `bun analysis/task40-campaign.ts --ids t40-offset-v4`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 716 | 0 | -0.007536 | 0 / 533 |
| Early 2016-2019 | 828 | 561 | +7 | -0.010083 | +7 / 410 |
| 2026 R0-13, burned | 114 | 80 | -4 | +0.001917 | -4 / 48 |
| 2026 R14+ | 97 | 66 | -2 | -0.013213 | -2 / 35 |
| Full 2026 | 211 | 146 | -6 | -0.005039 | -6 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-offset-v4 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="485.63821753229337" x2="485.63821753229337" y1="20" y2="143" class="zero"/><line x1="447.57751540918036" x2="447.57751540918036" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="369.16444669342224" x2="491.1618199824036" y1="38" y2="38" class="interval"/><circle cx="428.2721229007243" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.007536; tips 0</text><text x="5" y="85">Early</text><line x1="332.44194078749547" x2="476.33378534813414" y1="80" y2="80" class="interval"/><circle cx="408.8866249198435" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.010083; tips +7</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="385.0603551467266" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.013213; tips -2</text><text x="160" y="165" class="small">-0.0428</text><text x="610" y="165" text-anchor="end" class="small">+0.0163</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.008652, 95% CI [-0.014439, -0.002583].
With R14+ as a third stratum: -0.008874, CI [-0.014805, -0.003119].
Historical round-block CI [-0.014071, -0.003078].

Correct normal head: historical pooled LL -0.010961,
CI [-0.015776, -0.005753]. Round-block CI [-0.015577, -0.006313].
Holm-adjusted round-sign p=0.0066.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -11. Consensus-wrong tips
-7 / 342 paired games; primary -3 / 291,
full 2026 -4 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Port Adelaide,
+0.776 points at n=232; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.008191.
Primary excluding draws -0.007376; early -0.009816.

Evidence files, with effective config hashes:

- [t40-offset-v4 config](../configs/t40-offset-v4/config.json), [full result 7af312c5](../configs/t40-offset-v4/results-2026-09-05-7af312c5.json).
- [t40-offset-v4-early config](../configs/t40-offset-v4-early/config.json), [full result a3646e29](../configs/t40-offset-v4-early/results-2026-09-05-a3646e29.json).
- [t40-offset-v4-2026 config](../configs/t40-offset-v4-2026/config.json), [full result 56ff8e2b](../configs/t40-offset-v4-2026/results-2026-09-05-56ff8e2b.json).

### t40-pav-corrected: KILL

non-improving primary LL, non-improving early LL, pooled tip regression.

Mechanism: Completed player stats → Correct league/pools → Next PAV calculation.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-pav-corrected mechanism"><title>t40-pav-corrected mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Completed player stats</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Correct league/pools</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Next PAV calculation</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
pav.league_average="current_season"
pav.normalize_zone_pools=true
```

Run: `bun analysis/task40-campaign.ts --ids t40-pav-corrected`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 716 | 0 | +0.000059 | 0 / 533 |
| Early 2016-2019 | 828 | 553 | -1 | +0.000000 | -1 / 410 |
| 2026 R0-13, burned | 114 | 84 | 0 | +0.000219 | 0 / 48 |
| 2026 R14+ | 97 | 68 | 0 | +0.000439 | 0 / 35 |
| Full 2026 | 211 | 152 | 0 | +0.000320 | 0 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-pav-corrected per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="497.5" x2="497.5" y1="20" y2="143" class="zero"/><line x1="216.25" x2="216.25" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="496.9492092910764" x2="504.3532417931863" y1="38" y2="38" class="interval"/><circle cx="500.8204795355103" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">+0.000059; tips 0</text><text x="5" y="85">Early</text><line x1="488.87949684975024" x2="506.6450004926352" y1="80" y2="80" class="interval"/><circle cx="497.50801384648645" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">+0.000000; tips -1</text><text x="5" y="127">2026 R14+</text><line x1="496.03942857191214" x2="546.6078838773077" y1="122" y2="122" class="interval"/><circle cx="522.2184940332018" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">+0.000439; tips 0</text><text x="160" y="165" class="small">-0.0060</text><text x="610" y="165" text-anchor="end" class="small">+0.0020</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL +0.000033, 95% CI [-0.000048, +0.000121].
With R14+ as a third stratum: +0.000053, CI [-0.000023, +0.000139].
Historical round-block CI [-0.000046, +0.000110].

Correct normal head: historical pooled LL +0.000046,
CI [-0.000023, +0.000122]. Round-block CI [-0.000024, +0.000113].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips 0. Consensus-wrong tips
0 / 342 paired games; primary 0 / 291,
full 2026 0 / 51, R14+ 0 / 23.

Largest eligible absolute team-bias worsening: West Coast,
+0.032 points at n=232; allowed maximum +2.
Historical LL draw sensitivity: half-target +0.000033.
Primary excluding draws +0.000060; early +0.000001.

Evidence files, with effective config hashes:

- [t40-pav-corrected config](../configs/t40-pav-corrected/config.json), [full result 0d90b18d](../configs/t40-pav-corrected/results-2026-09-05-0d90b18d.json).
- [t40-pav-corrected-early config](../configs/t40-pav-corrected-early/config.json), [full result 844f02f9](../configs/t40-pav-corrected-early/results-2026-09-05-844f02f9.json).
- [t40-pav-corrected-2026 config](../configs/t40-pav-corrected-2026/config.json), [full result e2eb7ee8](../configs/t40-pav-corrected-2026/results-2026-09-05-e2eb7ee8.json).

### t40-pav-current: KILL

non-improving primary LL, pooled tip regression.

Mechanism: Completed player stats → Correct league/pools → Next PAV calculation.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-pav-current mechanism"><title>t40-pav-current mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Completed player stats</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Correct league/pools</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Next PAV calculation</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
pav.league_average="current_season"
```

Run: `bun analysis/task40-campaign.ts --ids t40-pav-current`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 716 | 0 | +0.000024 | 0 / 533 |
| Early 2016-2019 | 828 | 553 | -1 | -0.000057 | -1 / 410 |
| 2026 R0-13, burned | 114 | 84 | 0 | +0.000200 | 0 / 48 |
| 2026 R14+ | 97 | 68 | 0 | +0.000443 | 0 / 35 |
| Full 2026 | 211 | 152 | 0 | +0.000312 | 0 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-pav-current per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="497.5" x2="497.5" y1="20" y2="143" class="zero"/><line x1="216.25" x2="216.25" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="495.6159311015187" x2="501.9684682404634" y1="38" y2="38" class="interval"/><circle cx="498.8776306320275" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">+0.000024; tips 0</text><text x="5" y="85">Early</text><line x1="485.58634866994896" x2="503.4930649772036" y1="80" y2="80" class="interval"/><circle cx="494.28467090486953" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.000057; tips -1</text><text x="5" y="127">2026 R14+</text><line x1="495.51628717946585" x2="547.2754100644541" y1="122" y2="122" class="interval"/><circle cx="522.3959313211894" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">+0.000443; tips 0</text><text x="160" y="165" class="small">-0.0060</text><text x="610" y="165" text-anchor="end" class="small">+0.0020</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.000011, 95% CI [-0.000091, +0.000070].
With R14+ as a third stratum: +0.000011, CI [-0.000062, +0.000094].
Historical round-block CI [-0.000091, +0.000069].

Correct normal head: historical pooled LL -0.000007,
CI [-0.000076, +0.000063]. Round-block CI [-0.000076, +0.000062].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips 0. Consensus-wrong tips
0 / 342 paired games; primary 0 / 291,
full 2026 0 / 51, R14+ 0 / 23.

Largest eligible absolute team-bias worsening: West Coast,
+0.026 points at n=232; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.000010.
Primary excluding draws +0.000025; early -0.000056.

Evidence files, with effective config hashes:

- [t40-pav-current config](../configs/t40-pav-current/config.json), [full result 82d1ec89](../configs/t40-pav-current/results-2026-09-05-82d1ec89.json).
- [t40-pav-current-early config](../configs/t40-pav-current-early/config.json), [full result 036cffb6](../configs/t40-pav-current-early/results-2026-09-05-036cffb6.json).
- [t40-pav-current-2026 config](../configs/t40-pav-current-2026/config.json), [full result 49f2c533](../configs/t40-pav-current-2026/results-2026-09-05-49f2c533.json).

### t40-pav-normalized: KILL

non-improving primary LL, non-improving early LL, pooled tip regression, recent tip regression.

Mechanism: Completed player stats → Correct league/pools → Next PAV calculation.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-pav-normalized mechanism"><title>t40-pav-normalized mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Completed player stats</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Correct league/pools</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Next PAV calculation</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
pav.normalize_zone_pools=true
```

Run: `bun analysis/task40-campaign.ts --ids t40-pav-normalized`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 716 | 0 | +0.000034 | 0 / 533 |
| Early 2016-2019 | 828 | 553 | -1 | +0.000004 | -1 / 410 |
| 2026 R0-13, burned | 114 | 83 | -1 | +0.000145 | -1 / 48 |
| 2026 R14+ | 97 | 68 | 0 | +0.000179 | 0 / 35 |
| Full 2026 | 211 | 151 | -1 | +0.000161 | -1 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-pav-normalized per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="497.5" x2="497.5" y1="20" y2="143" class="zero"/><line x1="216.25" x2="216.25" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="495.46444359738615" x2="503.0990751923857" y1="38" y2="38" class="interval"/><circle cx="499.4152405532269" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">+0.000034; tips 0</text><text x="5" y="85">Early</text><line x1="488.95496997357304" x2="506.1380729303898" y1="80" y2="80" class="interval"/><circle cx="497.7415910338408" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">+0.000004; tips -1</text><text x="5" y="127">2026 R14+</text><line x1="488.1149348492093" x2="526.6468947026772" y1="122" y2="122" class="interval"/><circle cx="507.5725047548718" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">+0.000179; tips 0</text><text x="160" y="165" class="small">-0.0060</text><text x="610" y="165" text-anchor="end" class="small">+0.0020</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL +0.000021, 95% CI [-0.000052, +0.000094].
With R14+ as a third stratum: +0.000029, CI [-0.000043, +0.000098].
Historical round-block CI [-0.000054, +0.000102].

Correct normal head: historical pooled LL +0.000030,
CI [-0.000031, +0.000091]. Round-block CI [-0.000032, +0.000100].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -1. Consensus-wrong tips
0 / 342 paired games; primary 0 / 291,
full 2026 0 / 51, R14+ 0 / 23.

Largest eligible absolute team-bias worsening: Geelong,
+0.022 points at n=221; allowed maximum +2.
Historical LL draw sensitivity: half-target +0.000022.
Primary excluding draws +0.000035; early +0.000004.

Evidence files, with effective config hashes:

- [t40-pav-normalized config](../configs/t40-pav-normalized/config.json), [full result fcedc719](../configs/t40-pav-normalized/results-2026-09-05-fcedc719.json).
- [t40-pav-normalized-early config](../configs/t40-pav-normalized-early/config.json), [full result b40faee5](../configs/t40-pav-normalized-early/results-2026-09-05-b40faee5.json).
- [t40-pav-normalized-2026 config](../configs/t40-pav-normalized-2026/config.json), [full result d01ee183](../configs/t40-pav-normalized-2026/results-2026-09-05-d01ee183.json).

### t40-points: PARK

Insufficient evidence under I: pooledCI. No corrected prospective validation.

Mechanism: Completed margin → Residual gain 0.04 → Next team ordering.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-points mechanism"><title>t40-points mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Completed margin</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Residual gain 0.04</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Next team ordering</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.home_advantage=142.85714285714283
elo.regression_to_mean=0.2
elo.points_residual_k=0.04
```

Run: `bun analysis/task40-campaign.ts --ids t40-points`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 728 | +12 | -0.005762 | +12 / 533 |
| Early 2016-2019 | 828 | 560 | +6 | -0.005010 | +6 / 410 |
| 2026 R0-13, burned | 114 | 84 | 0 | -0.019541 | 0 / 48 |
| 2026 R14+ | 97 | 69 | +1 | -0.007685 | +1 / 35 |
| Full 2026 | 211 | 153 | +1 | -0.014090 | +1 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-points per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="469.6181975839936" x2="469.6181975839936" y1="20" y2="143" class="zero"/><line x1="417.5812160817466" x2="417.5812160817466" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="328.9166231402544" x2="489.1625163846668" y1="38" y2="38" class="interval"/><circle cx="409.65021154976927" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.005762; tips +12</text><text x="5" y="85">Early</text><line x1="321.2010272311552" x2="512.8081058922619" y1="80" y2="80" class="interval"/><circle cx="417.47646486753683" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.005010; tips +6</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="389.6425165702198" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.007685; tips +1</text><text x="160" y="165" class="small">-0.0297</text><text x="610" y="165" text-anchor="end" class="small">+0.0135</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.005433, 95% CI [-0.011012, +0.000785].
With R14+ as a third stratum: -0.005543, CI [-0.011347, +0.000400].
Historical round-block CI [-0.011210, +0.000518].

Correct normal head: historical pooled LL -0.004143,
CI [-0.008665, +0.001128]. Round-block CI [-0.008923, +0.000912].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +4. Consensus-wrong tips
0 / 342 paired games; primary +3 / 291,
full 2026 -3 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Carlton,
+1.056 points at n=205; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.005554.
Primary excluding draws -0.005965; early -0.004778.

Direct increment over plain OD, primary / early / full 2026:
LL +0.000000 / -0.000000 / -0.000000;
tips 0 / 0 / 0.

Evidence files, with effective config hashes:

- [t40-points config](../configs/t40-points/config.json), [full result 2e84e84c](../configs/t40-points/results-2026-09-05-2e84e84c.json).
- [t40-points-early config](../configs/t40-points-early/config.json), [full result 9bdd6084](../configs/t40-points-early/results-2026-09-05-9bdd6084.json).
- [t40-points-2026 config](../configs/t40-points-2026/config.json), [full result c33a1569](../configs/t40-points-2026/results-2026-09-05-c33a1569.json).

### t40-position: KILL

pooled tip regression, recent tip regression, R14+ tip regression.

Mechanism: Named positions → Weight PAV zones → Lineup rating gap.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-position mechanism"><title>t40-position mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Named positions</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Weight PAV zones</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Lineup rating gap</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
pav.position_weight=1
```

Run: `bun analysis/task40-campaign.ts --ids t40-position`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 711 | -5 | -0.000610 | -5 / 533 |
| Early 2016-2019 | 828 | 555 | +1 | -0.005430 | +1 / 410 |
| 2026 R0-13, burned | 114 | 83 | -1 | -0.003591 | -1 / 48 |
| 2026 R14+ | 97 | 67 | -1 | +0.002333 | -1 / 35 |
| Full 2026 | 211 | 150 | -2 | -0.000868 | -2 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-position per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="345.33466886858423" x2="345.33466886858423" y1="20" y2="143" class="zero"/><line x1="271.9161552147889" x2="271.9161552147889" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="277.3932794777022" x2="404.98184553084866" y1="38" y2="38" class="interval"/><circle cx="336.37495810928635" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.000610; tips -5</text><text x="5" y="85">Early</text><line x1="195.256748952772" x2="339.49746128323306" y1="80" y2="80" class="interval"/><circle cx="265.59979020747045" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.005430; tips +1</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="379.59256942643117" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">+0.002333; tips -1</text><text x="160" y="165" class="small">-0.0126</text><text x="610" y="165" text-anchor="end" class="small">+0.0180</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.002722, 95% CI [-0.005702, +0.000496].
With R14+ as a third stratum: -0.002475, CI [-0.005628, +0.000785].
Historical round-block CI [-0.006082, +0.000405].

Correct normal head: historical pooled LL -0.005304,
CI [-0.007903, -0.002530]. Round-block CI [-0.008235, -0.002583].
Holm-adjusted round-sign p=0.0406.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -5. Consensus-wrong tips
+2 / 342 paired games; primary +3 / 291,
full 2026 -1 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Western Bulldogs,
+0.988 points at n=236; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.002444.
Primary excluding draws -0.000671; early -0.005229.

Evidence files, with effective config hashes:

- [t40-position config](../configs/t40-position/config.json), [full result cd8f66d0](../configs/t40-position/results-2026-09-05-cd8f66d0.json).
- [t40-position-early config](../configs/t40-position-early/config.json), [full result 29db5ed3](../configs/t40-position-early/results-2026-09-05-29db5ed3.json).
- [t40-position-2026 config](../configs/t40-position-2026/config.json), [full result 07b607b7](../configs/t40-position-2026/results-2026-09-05-07b607b7.json).

### t40-position-prior: KILL

non-improving primary LL, non-improving early LL, recent tip regression, consensus-wrong guard.

Mechanism: Previous role cohort → Shrink player prior → Blended lineup PAV.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-position-prior mechanism"><title>t40-position-prior mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Previous role cohort</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Shrink player prior</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Blended lineup PAV</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
pav.position_prior_k=5
```

Run: `bun analysis/task40-campaign.ts --ids t40-position-prior`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 725 | +9 | +0.000874 | +9 / 533 |
| Early 2016-2019 | 828 | 554 | 0 | +0.011280 | +3 / 410 |
| 2026 R0-13, burned | 114 | 80 | -4 | +0.008790 | -4 / 48 |
| 2026 R14+ | 97 | 69 | +1 | +0.003202 | +1 / 35 |
| Full 2026 | 211 | 149 | -3 | +0.006221 | -3 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-position-prior per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="271.9670493051224" x2="271.9670493051224" y1="20" y2="143" class="zero"/><line x1="178.66117488418706" x2="178.66117488418706" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="238.04257480165728" x2="343.0181060891842" y1="38" y2="38" class="interval"/><circle cx="288.2763690312938" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">+0.000874; tips +9</text><text x="5" y="85">Early</text><line x1="361.3793677372177" x2="610" y1="80" y2="80" class="interval"/><circle cx="482.45885005177195" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">+0.011280; tips 0</text><text x="5" y="127">2026 R14+</text><line x1="241.18162069631666" x2="423.46778080167724" y1="122" y2="122" class="interval"/><circle cx="331.7189763500602" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">+0.003202; tips +1</text><text x="160" y="165" class="small">-0.0060</text><text x="610" y="165" text-anchor="end" class="small">+0.0181</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL +0.005433, 95% CI [+0.001680, +0.008918].
With R14+ as a third stratum: +0.005324, CI [+0.002076, +0.008632].
Historical round-block CI [+0.002087, +0.008386].

Correct normal head: historical pooled LL +0.006722,
CI [+0.003466, +0.009697]. Round-block CI [+0.003967, +0.009326].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -5. Consensus-wrong tips
-1 / 342 paired games; primary -1 / 291,
full 2026 0 / 51, R14+ +1 / 23.

Largest eligible absolute team-bias worsening: Carlton,
+1.287 points at n=205; allowed maximum +2.
Historical LL draw sensitivity: half-target +0.005309.
Primary excluding draws +0.000751; early +0.011288.

Evidence files, with effective config hashes:

- [t40-position-prior config](../configs/t40-position-prior/config.json), [full result 3d63e55b](../configs/t40-position-prior/results-2026-09-05-3d63e55b.json).
- [t40-position-prior-early config](../configs/t40-position-prior-early/config.json), [full result c9d21a96](../configs/t40-position-prior-early/results-2026-09-05-c9d21a96.json).
- [t40-position-prior-2026 config](../configs/t40-position-prior-2026/config.json), [full result f65631af](../configs/t40-position-prior-2026/results-2026-09-05-f65631af.json).

### t40-prior-k30: KILL

non-improving primary LL, non-improving early LL, pooled tip regression.

Mechanism: Previous-season PAV → Prior K rises to 30 → Slower prior decay.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-prior-k30 mechanism"><title>t40-prior-k30 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Previous-season PAV</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Prior K rises to 30</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Slower prior decay</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
pav.prior_weight_k=30
```

Run: `bun analysis/task40-campaign.ts --ids t40-prior-k30`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 713 | -3 | +0.001726 | -3 / 533 |
| Early 2016-2019 | 828 | 555 | +1 | +0.001473 | +1 / 410 |
| 2026 R0-13, burned | 114 | 83 | -1 | -0.000229 | -1 / 48 |
| 2026 R14+ | 97 | 69 | +1 | -0.000079 | +1 / 35 |
| Full 2026 | 211 | 152 | 0 | -0.000160 | 0 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-prior-k30 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="372.6674160555543" x2="372.6674160555543" y1="20" y2="143" class="zero"/><line x1="237.97542138440994" x2="237.97542138440994" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="362.84945991145105" x2="471.05181689921693" y1="38" y2="38" class="interval"/><circle cx="419.1720603926706" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">+0.001726; tips -3</text><text x="5" y="85">Early</text><line x1="349.0667664068642" x2="481.9939537590098" y1="80" y2="80" class="interval"/><circle cx="412.34138983234413" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">+0.001473; tips +1</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="370.5282731271211" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.000079; tips +1</text><text x="160" y="165" class="small">-0.0079</text><text x="610" y="165" text-anchor="end" class="small">+0.0088</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL +0.001615, 95% CI [-0.000162, +0.003247].
With R14+ as a third stratum: +0.001533, CI [-0.000083, +0.002998].
Historical round-block CI [-0.000012, +0.003198].

Correct normal head: historical pooled LL +0.001298,
CI [-0.000164, +0.002633]. Round-block CI [-0.000012, +0.002599].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips 0. Consensus-wrong tips
0 / 342 paired games; primary 0 / 291,
full 2026 0 / 51, R14+ 0 / 23.

Largest eligible absolute team-bias worsening: GWS Giants,
+0.291 points at n=220; allowed maximum +2.
Historical LL draw sensitivity: half-target +0.001686.
Primary excluding draws +0.001906; early +0.001483.

Evidence files, with effective config hashes:

- [t40-prior-k30 config](../configs/t40-prior-k30/config.json), [full result 936a9753](../configs/t40-prior-k30/results-2026-09-05-936a9753.json).
- [t40-prior-k30-early config](../configs/t40-prior-k30-early/config.json), [full result 871d816f](../configs/t40-prior-k30-early/results-2026-09-05-871d816f.json).
- [t40-prior-k30-2026 config](../configs/t40-prior-k30-2026/config.json), [full result 771136ce](../configs/t40-prior-k30-2026/results-2026-09-05-771136ce.json).

### t40-quarter: KILL

consensus-wrong guard.

Mechanism: Completed control stats → Adjust OD margin target → Next-match rating gap.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-quarter mechanism"><title>t40-quarter mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Completed control stats</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Adjust OD margin target</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Next-match rating gap</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.od.weight=1
elo.od.k=0.08
elo.od.home_advantage_points=10
elo.od.initial_score=85
elo.od.regression_to_mean=0.2
elo.od.update_target="quarter"
```

Run: `bun analysis/task40-campaign.ts --ids t40-quarter`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 727 | +11 | -0.005561 | +11 / 533 |
| Early 2016-2019 | 828 | 559 | +5 | -0.005124 | +5 / 410 |
| 2026 R0-13, burned | 114 | 85 | +1 | -0.020824 | +1 / 48 |
| 2026 R14+ | 97 | 68 | 0 | -0.008104 | 0 / 35 |
| Full 2026 | 211 | 153 | +1 | -0.014976 | +1 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-quarter per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="465.02249055508565" x2="465.02249055508565" y1="20" y2="143" class="zero"/><line x1="413.9191595306994" x2="413.9191595306994" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="330.6478716532983" x2="485.65686706286226" y1="38" y2="38" class="interval"/><circle cx="408.1807126012162" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.005561; tips +11</text><text x="5" y="85">Early</text><line x1="318.8205996819164" x2="504.85010537025903" y1="80" y2="80" class="interval"/><circle cx="412.65238595494327" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.005124; tips +5</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="382.19202471255164" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.008104; tips 0</text><text x="160" y="165" class="small">-0.0298</text><text x="610" y="165" text-anchor="end" class="small">+0.0142</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.005370, 95% CI [-0.010882, +0.000546].
With R14+ as a third stratum: -0.005503, CI [-0.011294, +0.000482].
Historical round-block CI [-0.011277, +0.000624].

Correct normal head: historical pooled LL -0.004063,
CI [-0.008686, +0.001049]. Round-block CI [-0.008918, +0.001039].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +4. Consensus-wrong tips
-1 / 342 paired games; primary +1 / 291,
full 2026 -2 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Carlton,
+0.954 points at n=205; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.005447.
Primary excluding draws -0.005676; early -0.004907.

Direct increment over plain OD, primary / early / full 2026:
LL +0.000201 / -0.000114 / -0.000886;
tips -1 / -1 / 0.

Evidence files, with effective config hashes:

- [t40-quarter config](../configs/t40-quarter/config.json), [full result 7059f921](../configs/t40-quarter/results-2026-09-05-7059f921.json).
- [t40-quarter-early config](../configs/t40-quarter-early/config.json), [full result 06a318f5](../configs/t40-quarter-early/results-2026-09-05-06a318f5.json).
- [t40-quarter-2026 config](../configs/t40-quarter-2026/config.json), [full result f135ed0f](../configs/t40-quarter-2026/results-2026-09-05-f135ed0f.json).

### t40-rating-points: KILL

non-improving primary LL, non-improving early LL, pooled tip regression, recent tip regression, R14+ tip regression, consensus-wrong guard.

Mechanism: Past rating-point means → Redistribute roster PAV → Selected lineup shares.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-rating-points mechanism"><title>t40-rating-points mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Past rating-point means</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Redistribute roster PAV</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Selected lineup shares</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
pav.rating_points=true
```

Run: `bun analysis/task40-campaign.ts --ids t40-rating-points`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 714 | -2 | +0.005642 | -2 / 533 |
| Early 2016-2019 | 828 | 550 | -4 | +0.004728 | -4 / 410 |
| 2026 R0-13, burned | 114 | 80 | -4 | +0.007022 | -4 / 48 |
| 2026 R14+ | 97 | 67 | -1 | +0.008435 | -1 / 35 |
| Full 2026 | 211 | 147 | -5 | +0.007672 | -5 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-rating-points per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="295.92076894109414" x2="295.92076894109414" y1="20" y2="143" class="zero"/><line x1="241.39005435705172" x2="241.39005435705172" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="270.68309903004786" x2="449.5415871951352" y1="38" y2="38" class="interval"/><circle cx="357.45503766108095" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">+0.005642; tips -2</text><text x="5" y="85">Early</text><line x1="262.4938561548711" x2="431.3225250071208" y1="80" y2="80" class="interval"/><circle cx="347.48995788259083" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">+0.004728; tips -4</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="387.91321498264034" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">+0.008435; tips -1</text><text x="160" y="165" class="small">-0.0125</text><text x="610" y="165" text-anchor="end" class="small">+0.0288</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL +0.005242, 95% CI [-0.000345, +0.010973].
With R14+ as a third stratum: +0.005398, CI [-0.000628, +0.011078].
Historical round-block CI [-0.000165, +0.010782].

Correct normal head: historical pooled LL +0.005804,
CI [+0.001151, +0.010474]. Round-block CI [+0.001194, +0.010413].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -12. Consensus-wrong tips
-4 / 342 paired games; primary -2 / 291,
full 2026 -2 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Collingwood,
+1.105 points at n=215; allowed maximum +2.
Historical LL draw sensitivity: half-target +0.005112.
Primary excluding draws +0.005360; early +0.004883.

Evidence files, with effective config hashes:

- [t40-rating-points config](../configs/t40-rating-points/config.json), [full result 59a1cfc4](../configs/t40-rating-points/results-2026-09-05-59a1cfc4.json).
- [t40-rating-points-early config](../configs/t40-rating-points-early/config.json), [full result 05820238](../configs/t40-rating-points-early/results-2026-09-05-05820238.json).
- [t40-rating-points-2026 config](../configs/t40-rating-points-2026/config.json), [full result b0a05476](../configs/t40-rating-points-2026/results-2026-09-05-b0a05476.json).

### t40-rich-intercepts: KILL

pooled tip regression.

Mechanism: Completed player stats → Change HPN involvement → Future lineup PAV.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-rich-intercepts mechanism"><title>t40-rich-intercepts mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Completed player stats</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Change HPN involvement</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Future lineup PAV</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
pav.involvement_feature="intercepts"
```

Run: `bun analysis/task40-campaign.ts --ids t40-rich-intercepts`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 716 | 0 | -0.000040 | 0 / 533 |
| Early 2016-2019 | 828 | 553 | -1 | -0.000072 | -1 / 410 |
| 2026 R0-13, burned | 114 | 84 | 0 | -0.000146 | 0 / 48 |
| 2026 R14+ | 97 | 68 | 0 | -0.000846 | 0 / 35 |
| Full 2026 | 211 | 152 | 0 | -0.000468 | 0 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-rich-intercepts per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="497.5" x2="497.5" y1="20" y2="143" class="zero"/><line x1="216.25" x2="216.25" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="482.2700835697096" x2="507.8062667126515" y1="38" y2="38" class="interval"/><circle cx="495.2444920577642" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.000040; tips 0</text><text x="5" y="85">Early</text><line x1="475.80397024291517" x2="510.2706024465283" y1="80" y2="80" class="interval"/><circle cx="493.4776437261541" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.000072; tips -1</text><text x="5" y="127">2026 R14+</text><line x1="407.45251769307697" x2="498.2018911989021" y1="122" y2="122" class="interval"/><circle cx="449.9261663157346" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.000846; tips 0</text><text x="160" y="165" class="small">-0.0060</text><text x="610" y="165" text-anchor="end" class="small">+0.0020</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.000054, 95% CI [-0.000230, +0.000123].
With R14+ as a third stratum: -0.000093, CI [-0.000265, +0.000085].
Historical round-block CI [-0.000239, +0.000131].

Correct normal head: historical pooled LL -0.000045,
CI [-0.000190, +0.000102]. Round-block CI [-0.000194, +0.000106].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips 0. Consensus-wrong tips
0 / 342 paired games; primary 0 / 291,
full 2026 0 / 51, R14+ 0 / 23.

Largest eligible absolute team-bias worsening: GWS Giants,
+0.038 points at n=220; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.000062.
Primary excluding draws -0.000050; early -0.000071.

Evidence files, with effective config hashes:

- [t40-rich-intercepts config](../configs/t40-rich-intercepts/config.json), [full result ee5b242c](../configs/t40-rich-intercepts/results-2026-09-05-ee5b242c.json).
- [t40-rich-intercepts-early config](../configs/t40-rich-intercepts-early/config.json), [full result b0626f6c](../configs/t40-rich-intercepts-early/results-2026-09-05-b0626f6c.json).
- [t40-rich-intercepts-2026 config](../configs/t40-rich-intercepts-2026/config.json), [full result cfd1cc08](../configs/t40-rich-intercepts-2026/results-2026-09-05-cfd1cc08.json).

### t40-rich-involvement: KILL

non-improving primary LL, non-improving early LL, pooled tip regression, recent tip regression.

Mechanism: Completed player stats → Change HPN involvement → Future lineup PAV.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-rich-involvement mechanism"><title>t40-rich-involvement mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Completed player stats</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Change HPN involvement</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Future lineup PAV</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
pav.involvement_feature="involvement"
```

Run: `bun analysis/task40-campaign.ts --ids t40-rich-involvement`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 714 | -2 | +0.000070 | -2 / 533 |
| Early 2016-2019 | 828 | 553 | -1 | +0.000185 | -1 / 410 |
| 2026 R0-13, burned | 114 | 83 | -1 | +0.000841 | -1 / 48 |
| 2026 R14+ | 97 | 68 | 0 | -0.000492 | 0 / 35 |
| Full 2026 | 211 | 151 | -1 | +0.000228 | -1 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-rich-involvement per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="497.5" x2="497.5" y1="20" y2="143" class="zero"/><line x1="216.25" x2="216.25" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="475.24030169903637" x2="528.1143383422518" y1="38" y2="38" class="interval"/><circle cx="501.45320885148914" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">+0.000070; tips -2</text><text x="5" y="85">Early</text><line x1="481.5239946976487" x2="534.6571004440932" y1="80" y2="80" class="interval"/><circle cx="507.9202358601008" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">+0.000185; tips -1</text><text x="5" y="127">2026 R14+</text><line x1="368.6402435980895" x2="570.8811482452503" y1="122" y2="122" class="interval"/><circle cx="469.828870406605" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.000492; tips 0</text><text x="160" y="165" class="small">-0.0060</text><text x="610" y="165" text-anchor="end" class="small">+0.0020</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL +0.000121, 95% CI [-0.000210, +0.000439].
With R14+ as a third stratum: +0.000091, CI [-0.000246, +0.000437].
Historical round-block CI [-0.000181, +0.000435].

Correct normal head: historical pooled LL +0.000086,
CI [-0.000193, +0.000348]. Round-block CI [-0.000165, +0.000345].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -1. Consensus-wrong tips
0 / 342 paired games; primary 0 / 291,
full 2026 0 / 51, R14+ 0 / 23.

Largest eligible absolute team-bias worsening: Hawthorn,
+0.028 points at n=210; allowed maximum +2.
Historical LL draw sensitivity: half-target +0.000153.
Primary excluding draws +0.000092; early +0.000211.

Evidence files, with effective config hashes:

- [t40-rich-involvement config](../configs/t40-rich-involvement/config.json), [full result abc15f51](../configs/t40-rich-involvement/results-2026-09-05-abc15f51.json).
- [t40-rich-involvement-early config](../configs/t40-rich-involvement-early/config.json), [full result be72e09d](../configs/t40-rich-involvement-early/results-2026-09-05-be72e09d.json).
- [t40-rich-involvement-2026 config](../configs/t40-rich-involvement-2026/config.json), [full result 178bf0c9](../configs/t40-rich-involvement-2026/results-2026-09-05-178bf0c9.json).

### t40-rich-pressure: KILL

consensus-wrong guard.

Mechanism: Completed player stats → Change HPN involvement → Future lineup PAV.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-rich-pressure mechanism"><title>t40-rich-pressure mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Completed player stats</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Change HPN involvement</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Future lineup PAV</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
pav.involvement_feature="pressure"
```

Run: `bun analysis/task40-campaign.ts --ids t40-rich-pressure`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 715 | -1 | -0.000089 | -1 / 533 |
| Early 2016-2019 | 828 | 555 | +1 | -0.000106 | +1 / 410 |
| 2026 R0-13, burned | 114 | 84 | 0 | -0.000125 | 0 / 48 |
| 2026 R14+ | 97 | 68 | 0 | -0.000121 | 0 / 35 |
| Full 2026 | 211 | 152 | 0 | -0.000123 | 0 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-rich-pressure per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="497.5" x2="497.5" y1="20" y2="143" class="zero"/><line x1="216.25" x2="216.25" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="475.52000729814193" x2="508.8013443087795" y1="38" y2="38" class="interval"/><circle cx="492.4967326903506" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.000089; tips -1</text><text x="5" y="85">Early</text><line x1="475.7009657197512" x2="507.62578666241683" y1="80" y2="80" class="interval"/><circle cx="491.5566162612336" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.000106; tips +1</text><text x="5" y="127">2026 R14+</text><line x1="444.59978336543116" x2="538.2896124496228" y1="122" y2="122" class="interval"/><circle cx="490.69263805637945" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.000121; tips 0</text><text x="160" y="165" class="small">-0.0060</text><text x="610" y="165" text-anchor="end" class="small">+0.0020</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.000096, 95% CI [-0.000303, +0.000112].
With R14+ as a third stratum: -0.000097, CI [-0.000291, +0.000114].
Historical round-block CI [-0.000299, +0.000102].

Correct normal head: historical pooled LL -0.000083,
CI [-0.000255, +0.000092]. Round-block CI [-0.000251, +0.000086].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips 0. Consensus-wrong tips
-1 / 342 paired games; primary -1 / 291,
full 2026 0 / 51, R14+ 0 / 23.

Largest eligible absolute team-bias worsening: Essendon,
+0.040 points at n=204; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.000103.
Primary excluding draws -0.000108; early -0.000097.

Evidence files, with effective config hashes:

- [t40-rich-pressure config](../configs/t40-rich-pressure/config.json), [full result 476e82fe](../configs/t40-rich-pressure/results-2026-09-05-476e82fe.json).
- [t40-rich-pressure-early config](../configs/t40-rich-pressure-early/config.json), [full result fcdb8dcf](../configs/t40-rich-pressure-early/results-2026-09-05-fcdb8dcf.json).
- [t40-rich-pressure-2026 config](../configs/t40-rich-pressure-2026/config.json), [full result 861d15f2](../configs/t40-rich-pressure-2026/results-2026-09-05-861d15f2.json).

### t40-rich-shots: KILL

non-improving primary LL, non-improving early LL.

Mechanism: Completed player stats → Change HPN involvement → Future lineup PAV.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-rich-shots mechanism"><title>t40-rich-shots mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Completed player stats</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Change HPN involvement</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Future lineup PAV</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
pav.involvement_feature="shots"
```

Run: `bun analysis/task40-campaign.ts --ids t40-rich-shots`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 718 | +2 | +0.000053 | +2 / 533 |
| Early 2016-2019 | 828 | 553 | -1 | +0.000239 | -1 / 410 |
| 2026 R0-13, burned | 114 | 83 | -1 | +0.000085 | -1 / 48 |
| 2026 R14+ | 97 | 68 | 0 | -0.000348 | 0 / 35 |
| Full 2026 | 211 | 151 | -1 | -0.000114 | -1 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-rich-shots per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="497.5" x2="497.5" y1="20" y2="143" class="zero"/><line x1="216.25" x2="216.25" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="486.7831515262313" x2="512.7869925030735" y1="38" y2="38" class="interval"/><circle cx="500.48597232010826" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">+0.000053; tips +2</text><text x="5" y="85">Early</text><line x1="498.120651526492" x2="523.9083694336332" y1="80" y2="80" class="interval"/><circle cx="510.93320715790634" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">+0.000239; tips -1</text><text x="5" y="127">2026 R14+</text><line x1="444.27465811445853" x2="512.632345085658" y1="122" y2="122" class="interval"/><circle cx="477.93736567100507" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.000348; tips 0</text><text x="160" y="165" class="small">-0.0060</text><text x="610" y="165" text-anchor="end" class="small">+0.0020</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL +0.000134, 95% CI [-0.000035, +0.000295].
With R14+ as a third stratum: +0.000111, CI [-0.000048, +0.000271].
Historical round-block CI [-0.000023, +0.000289].

Correct normal head: historical pooled LL +0.000111,
CI [-0.000031, +0.000250]. Round-block CI [-0.000018, +0.000246].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips 0. Consensus-wrong tips
+1 / 342 paired games; primary +1 / 291,
full 2026 0 / 51, R14+ 0 / 23.

Largest eligible absolute team-bias worsening: Brisbane Lions,
+0.029 points at n=242; allowed maximum +2.
Historical LL draw sensitivity: half-target +0.000151.
Primary excluding draws +0.000079; early +0.000246.

Evidence files, with effective config hashes:

- [t40-rich-shots config](../configs/t40-rich-shots/config.json), [full result a119b854](../configs/t40-rich-shots/results-2026-09-05-a119b854.json).
- [t40-rich-shots-early config](../configs/t40-rich-shots-early/config.json), [full result e9669224](../configs/t40-rich-shots-early/results-2026-09-05-e9669224.json).
- [t40-rich-shots-2026 config](../configs/t40-rich-shots-2026/config.json), [full result 990e8bf4](../configs/t40-rich-shots-2026/results-2026-09-05-990e8bf4.json).

### t40-rushed: PARK

Insufficient evidence under I: pooledCI. No corrected prospective validation.

Mechanism: Completed control stats → Adjust OD margin target → Next-match rating gap.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-rushed mechanism"><title>t40-rushed mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Completed control stats</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Adjust OD margin target</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Next-match rating gap</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.od.weight=1
elo.od.k=0.08
elo.od.home_advantage_points=10
elo.od.initial_score=85
elo.od.regression_to_mean=0.2
elo.od.update_target="rushed"
```

Run: `bun analysis/task40-campaign.ts --ids t40-rushed`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 728 | +12 | -0.005611 | +12 / 533 |
| Early 2016-2019 | 828 | 560 | +6 | -0.004839 | +6 / 410 |
| 2026 R0-13, burned | 114 | 85 | +1 | -0.019844 | +1 / 48 |
| 2026 R14+ | 97 | 69 | +1 | -0.007376 | +1 / 35 |
| Full 2026 | 211 | 154 | +2 | -0.014112 | +2 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-rushed per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="466.538930296812" x2="466.538930296812" y1="20" y2="143" class="zero"/><line x1="414.61540888568373" x2="414.61540888568373" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="328.21582839124926" x2="486.29381079719764" y1="38" y2="38" class="interval"/><circle cx="408.27061783244756" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.005611; tips +12</text><text x="5" y="85">Early</text><line x1="321.4605870904701" x2="511.0925150301206" y1="80" y2="80" class="interval"/><circle cx="416.28329154958533" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.004839; tips +6</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="389.9418418210438" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.007376; tips +1</text><text x="160" y="165" class="small">-0.0295</text><text x="610" y="165" text-anchor="end" class="small">+0.0138</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.005273, 95% CI [-0.010836, +0.000927].
With R14+ as a third stratum: -0.005376, CI [-0.011004, +0.000629].
Historical round-block CI [-0.011083, +0.000655].

Correct normal head: historical pooled LL -0.003940,
CI [-0.008455, +0.001332]. Round-block CI [-0.008799, +0.001096].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +5. Consensus-wrong tips
+1 / 342 paired games; primary +3 / 291,
full 2026 -2 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Carlton,
+1.066 points at n=205; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.005419.
Primary excluding draws -0.005847; early -0.004610.

Direct increment over plain OD, primary / early / full 2026:
LL +0.000151 / +0.000171 / -0.000022;
tips 0 / 0 / +1.

Evidence files, with effective config hashes:

- [t40-rushed config](../configs/t40-rushed/config.json), [full result e8776827](../configs/t40-rushed/results-2026-09-05-e8776827.json).
- [t40-rushed-early config](../configs/t40-rushed-early/config.json), [full result e261e976](../configs/t40-rushed-early/results-2026-09-05-e261e976.json).
- [t40-rushed-2026 config](../configs/t40-rushed-2026/config.json), [full result c475402c](../configs/t40-rushed-2026/results-2026-09-05-c475402c.json).

### t40-shot-025: KILL

recent tip regression, R14+ tip regression.

Mechanism: Completed scoring shots → Mix Elo update margin → Next-match rating gap.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-shot-025 mechanism"><title>t40-shot-025 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Completed scoring shots</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Mix Elo update margin</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Next-match rating gap</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.shot_margin_weight=0.25
```

Run: `bun analysis/task40-campaign.ts --ids t40-shot-025`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 722 | +6 | -0.000108 | +6 / 533 |
| Early 2016-2019 | 828 | 553 | -1 | -0.002345 | -1 / 410 |
| 2026 R0-13, burned | 114 | 84 | 0 | +0.003049 | 0 / 48 |
| 2026 R14+ | 97 | 67 | -1 | -0.005000 | -1 / 35 |
| Full 2026 | 211 | 151 | -1 | -0.000651 | -1 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-shot-025 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="521.093443393663" x2="521.093443393663" y1="20" y2="143" class="zero"/><line x1="393.0205733069463" x2="393.0205733069463" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="451.3831604791893" x2="588.6757774596183" y1="38" y2="38" class="interval"/><circle cx="518.3164335563936" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.000108; tips +6</text><text x="5" y="85">Early</text><line x1="394.455682108863" x2="524.6196504430575" y1="80" y2="80" class="interval"/><circle cx="461.0254714926831" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.002345; tips -1</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="393.0308782902422" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.005000; tips -1</text><text x="160" y="165" class="small">-0.0141</text><text x="610" y="165" text-anchor="end" class="small">+0.0035</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.001088, 95% CI [-0.002790, +0.000651].
With R14+ as a third stratum: -0.001279, CI [-0.003106, +0.000544].
Historical round-block CI [-0.002911, +0.000815].

Correct normal head: historical pooled LL -0.001244,
CI [-0.002647, +0.000172]. Round-block CI [-0.002705, +0.000302].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -3. Consensus-wrong tips
+2 / 342 paired games; primary +3 / 291,
full 2026 -1 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: GWS Giants,
+0.590 points at n=220; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.001108.
Primary excluding draws -0.000192; early -0.002363.

Evidence files, with effective config hashes:

- [t40-shot-025 config](../configs/t40-shot-025/config.json), [full result eab82aeb](../configs/t40-shot-025/results-2026-09-05-eab82aeb.json).
- [t40-shot-025-early config](../configs/t40-shot-025-early/config.json), [full result 7e6ffe4a](../configs/t40-shot-025-early/results-2026-09-05-7e6ffe4a.json).
- [t40-shot-025-2026 config](../configs/t40-shot-025-2026/config.json), [full result 759376e0](../configs/t40-shot-025-2026/results-2026-09-05-759376e0.json).

### t40-shot-050: KILL

pooled tip regression, recent tip regression.

Mechanism: Completed scoring shots → Mix Elo update margin → Next-match rating gap.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-shot-050 mechanism"><title>t40-shot-050 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Completed scoring shots</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Mix Elo update margin</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Next-match rating gap</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.shot_margin_weight=0.5
```

Run: `bun analysis/task40-campaign.ts --ids t40-shot-050`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 718 | +2 | -0.000643 | +2 / 533 |
| Early 2016-2019 | 828 | 550 | -4 | -0.005105 | -4 / 410 |
| 2026 R0-13, burned | 114 | 82 | -2 | +0.004566 | -2 / 48 |
| 2026 R14+ | 97 | 69 | +1 | -0.008812 | +1 / 35 |
| Full 2026 | 211 | 151 | -1 | -0.001584 | -1 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-shot-050 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="523.9672754859162" x2="523.9672754859162" y1="20" y2="143" class="zero"/><line x1="446.44853970835214" x2="446.44853970835214" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="442.99653290114185" x2="591.7353998295921" y1="38" y2="38" class="interval"/><circle cx="513.9970646559656" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.000643; tips +2</text><text x="5" y="85">Early</text><line x1="369.004909432466" x2="519.9731490399563" y1="80" y2="80" class="interval"/><circle cx="444.8204996571548" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.005105; tips -4</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="387.3488201971219" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.008812; tips +1</text><text x="160" y="165" class="small">-0.0235</text><text x="610" y="165" text-anchor="end" class="small">+0.0055</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.002598, 95% CI [-0.005806, +0.000718].
With R14+ as a third stratum: -0.002901, CI [-0.006243, +0.000337].
Historical round-block CI [-0.006084, +0.000747].

Correct normal head: historical pooled LL -0.002806,
CI [-0.005374, -0.000061]. Round-block CI [-0.005602, -0.000054].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -7. Consensus-wrong tips
0 / 342 paired games; primary +1 / 291,
full 2026 -1 / 51, R14+ 0 / 23.

Largest eligible absolute team-bias worsening: GWS Giants,
+0.947 points at n=220; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.002562.
Primary excluding draws -0.000637; early -0.005116.

Evidence files, with effective config hashes:

- [t40-shot-050 config](../configs/t40-shot-050/config.json), [full result 853350f5](../configs/t40-shot-050/results-2026-09-05-853350f5.json).
- [t40-shot-050-early config](../configs/t40-shot-050-early/config.json), [full result 51919413](../configs/t40-shot-050-early/results-2026-09-05-51919413.json).
- [t40-shot-050-2026 config](../configs/t40-shot-050-2026/config.json), [full result 9342fad0](../configs/t40-shot-050-2026/results-2026-09-05-9342fad0.json).

### t40-shot-075: KILL

recent tip regression, R14+ tip regression, consensus-wrong guard.

Mechanism: Completed scoring shots → Mix Elo update margin → Next-match rating gap.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-shot-075 mechanism"><title>t40-shot-075 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Completed scoring shots</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Mix Elo update margin</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Next-match rating gap</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.shot_margin_weight=0.75
```

Run: `bun analysis/task40-campaign.ts --ids t40-shot-075`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 717 | +1 | -0.001763 | +1 / 533 |
| Early 2016-2019 | 828 | 554 | 0 | -0.005895 | 0 / 410 |
| 2026 R0-13, burned | 114 | 83 | -1 | +0.005292 | -1 / 48 |
| 2026 R14+ | 97 | 67 | -1 | -0.002187 | -1 / 35 |
| Full 2026 | 211 | 150 | -2 | +0.001854 | -2 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-shot-075 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="409.8819233601784" x2="409.8819233601784" y1="20" y2="143" class="zero"/><line x1="362.98899873965115" x2="362.98899873965115" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="336.69849176785016" x2="453.30604090536195" y1="38" y2="38" class="interval"/><circle cx="393.3455981156777" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.001763; tips +1</text><text x="5" y="85">Early</text><line x1="288.5628964308607" x2="419.4848860763767" y1="80" y2="80" class="interval"/><circle cx="354.5937424506161" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.005895; tips 0</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="389.37026680279087" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.002187; tips -1</text><text x="160" y="165" class="small">-0.0266</text><text x="610" y="165" text-anchor="end" class="small">+0.0213</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.003573, 95% CI [-0.008022, +0.000670].
With R14+ as a third stratum: -0.003506, CI [-0.008307, +0.000855].
Historical round-block CI [-0.008459, +0.000829].

Correct normal head: historical pooled LL -0.003492,
CI [-0.007234, +0.000032]. Round-block CI [-0.007496, +0.000078].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -4. Consensus-wrong tips
-1 / 342 paired games; primary +1 / 291,
full 2026 -2 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Sydney,
+0.939 points at n=216; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.003460.
Primary excluding draws -0.001672; early -0.005868.

Evidence files, with effective config hashes:

- [t40-shot-075 config](../configs/t40-shot-075/config.json), [full result 30f585e8](../configs/t40-shot-075/results-2026-09-05-30f585e8.json).
- [t40-shot-075-early config](../configs/t40-shot-075-early/config.json), [full result 1a7e9e73](../configs/t40-shot-075-early/results-2026-09-05-1a7e9e73.json).
- [t40-shot-075-2026 config](../configs/t40-shot-075-2026/config.json), [full result 2180f51a](../configs/t40-shot-075-2026/results-2026-09-05-2180f51a.json).

### t40-shot-100: KILL

recent tip regression, consensus-wrong guard.

Mechanism: Completed scoring shots → Mix Elo update margin → Next-match rating gap.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-shot-100 mechanism"><title>t40-shot-100 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Completed scoring shots</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Mix Elo update margin</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Next-match rating gap</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.shot_margin_weight=1
```

Run: `bun analysis/task40-campaign.ts --ids t40-shot-100`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 721 | +5 | -0.003401 | +5 / 533 |
| Early 2016-2019 | 828 | 560 | +6 | -0.006388 | +6 / 410 |
| 2026 R0-13, burned | 114 | 81 | -3 | +0.007610 | -3 / 48 |
| 2026 R14+ | 97 | 69 | +1 | -0.000744 | +1 / 35 |
| Full 2026 | 211 | 150 | -2 | +0.003770 | -2 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-shot-100 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="391.67490738225456" x2="391.67490738225456" y1="20" y2="143" class="zero"/><line x1="356.8913407272762" x2="356.8913407272762" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="318.1646553696643" x2="421.317470836848" y1="38" y2="38" class="interval"/><circle cx="368.0128399728991" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.003401; tips +5</text><text x="5" y="85">Early</text><line x1="283.1591208551606" x2="407.6812098344491" y1="80" y2="80" class="interval"/><circle cx="347.23547812357384" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.006388; tips +6</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="386.5006586330247" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.000744; tips +1</text><text x="160" y="165" class="small">-0.0333</text><text x="610" y="165" text-anchor="end" class="small">+0.0314</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.004710, 95% CI [-0.010235, +0.000853].
With R14+ as a third stratum: -0.004516, CI [-0.010614, +0.001113].
Historical round-block CI [-0.010360, +0.000904].

Correct normal head: historical pooled LL -0.004097,
CI [-0.008735, +0.000365]. Round-block CI [-0.008727, +0.000423].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -4. Consensus-wrong tips
-2 / 342 paired games; primary 0 / 291,
full 2026 -2 / 51, R14+ 0 / 23.

Largest eligible absolute team-bias worsening: Sydney,
+1.457 points at n=239; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.004557.
Primary excluding draws -0.003197; early -0.006395.

Evidence files, with effective config hashes:

- [t40-shot-100 config](../configs/t40-shot-100/config.json), [full result 72243a69](../configs/t40-shot-100/results-2026-09-05-72243a69.json).
- [t40-shot-100-early config](../configs/t40-shot-100-early/config.json), [full result 9412695d](../configs/t40-shot-100-early/results-2026-09-05-9412695d.json).
- [t40-shot-100-2026 config](../configs/t40-shot-100-2026/config.json), [full result 34238679](../configs/t40-shot-100-2026/results-2026-09-05-34238679.json).

### t40-sigma-032: PARK

Probability-only change cannot improve the competition's winner picks.

Mechanism: Unchanged margin → Change probability head → Same winner sign.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-sigma-032 mechanism"><title>t40-sigma-032 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Unchanged margin</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Change probability head</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Same winner sign</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
output.sigma=32
```

Run: `bun analysis/task40-campaign.ts --ids t40-sigma-032`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 716 | 0 | -0.000395 | 0 / 533 |
| Early 2016-2019 | 828 | 554 | 0 | -0.001530 | 0 / 410 |
| 2026 R0-13, burned | 114 | 84 | 0 | -0.004388 | 0 / 48 |
| 2026 R14+ | 97 | 68 | 0 | -0.005461 | 0 / 35 |
| Full 2026 | 211 | 152 | 0 | -0.004881 | 0 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-sigma-032 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="498.78656056517036" x2="498.78656056517036" y1="20" y2="143" class="zero"/><line x1="392.3028927447602" x2="392.3028927447602" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="414.7083504167433" x2="583.9508593965219" y1="38" y2="38" class="interval"/><circle cx="490.3773460746458" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.000395; tips 0</text><text x="5" y="85">Early</text><line x1="384.90026487422546" x2="548.8199686061993" y1="80" y2="80" class="interval"/><circle cx="466.2102257765386" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.001530; tips 0</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="382.4918867460295" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.005461; tips 0</text><text x="160" y="165" class="small">-0.0159</text><text x="610" y="165" text-anchor="end" class="small">+0.0052</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.000892, 95% CI [-0.003639, +0.001814].
With R14+ as a third stratum: -0.001115, CI [-0.003730, +0.001737].
Historical round-block CI [-0.003548, +0.002038].

Correct normal head: historical pooled LL 0.000000,
CI [0.000000, 0.000000]. Round-block CI [0.000000, 0.000000].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips 0. Consensus-wrong tips
0 / 342 paired games; primary 0 / 291,
full 2026 0 / 51, R14+ 0 / 23.

Largest eligible absolute team-bias worsening: Adelaide,
0.000 points at n=208; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.000868.
Primary excluding draws -0.000775; early -0.001531.

Evidence files, with effective config hashes:

- [t40-sigma-032 config](../configs/t40-sigma-032/config.json), [full result 0d437370](../configs/t40-sigma-032/results-2026-09-05-0d437370.json).
- [t40-sigma-032-early config](../configs/t40-sigma-032-early/config.json), [full result e9071cae](../configs/t40-sigma-032-early/results-2026-09-05-e9071cae.json).
- [t40-sigma-032-2026 config](../configs/t40-sigma-032-2026/config.json), [full result dd9323bc](../configs/t40-sigma-032-2026/results-2026-09-05-dd9323bc.json).

### t40-sigma-040: PARK

Probability-only change cannot improve the competition's winner picks.

Mechanism: Unchanged margin → Change probability head → Same winner sign.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-sigma-040 mechanism"><title>t40-sigma-040 mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Unchanged margin</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Change probability head</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Same winner sign</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
output.sigma=40
```

Run: `bun analysis/task40-campaign.ts --ids t40-sigma-040`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 716 | 0 | +0.002457 | 0 / 533 |
| Early 2016-2019 | 828 | 554 | 0 | +0.003157 | 0 / 410 |
| 2026 R0-13, burned | 114 | 84 | 0 | +0.005951 | 0 / 48 |
| 2026 R14+ | 97 | 68 | 0 | +0.006926 | 0 / 35 |
| Full 2026 | 211 | 152 | 0 | +0.006399 | 0 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-sigma-040 per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="285.8053287139163" x2="285.8053287139163" y1="20" y2="143" class="zero"/><line x1="180.96755478565274" x2="180.96755478565274" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="265.5522776265095" x2="397.81833128628057" y1="38" y2="38" class="interval"/><circle cx="337.31793735370667" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">+0.002457; tips 0</text><text x="5" y="85">Early</text><line x1="287.4870721018027" x2="416.2337362970072" y1="80" y2="80" class="interval"/><circle cx="352.0044244035197" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">+0.003157; tips 0</text><text x="5" y="127">2026 R14+</text><line x1="250.446897616074" x2="610" y1="122" y2="122" class="interval"/><circle cx="431.0225564541769" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">+0.006926; tips 0</text><text x="160" y="165" class="small">-0.0060</text><text x="610" y="165" text-anchor="end" class="small">+0.0155</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL +0.002764, 95% CI [+0.000602, +0.004972].
With R14+ as a third stratum: +0.002967, CI [+0.000743, +0.005049].
Historical round-block CI [+0.000525, +0.004930].

Correct normal head: historical pooled LL 0.000000,
CI [0.000000, 0.000000]. Round-block CI [0.000000, 0.000000].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips 0. Consensus-wrong tips
0 / 342 paired games; primary 0 / 291,
full 2026 0 / 51, R14+ 0 / 23.

Largest eligible absolute team-bias worsening: Adelaide,
0.000 points at n=208; allowed maximum +2.
Historical LL draw sensitivity: half-target +0.002742.
Primary excluding draws +0.002757; early +0.003161.

Evidence files, with effective config hashes:

- [t40-sigma-040 config](../configs/t40-sigma-040/config.json), [full result 7f4be133](../configs/t40-sigma-040/results-2026-09-05-7f4be133.json).
- [t40-sigma-040-early config](../configs/t40-sigma-040-early/config.json), [full result c18b9ca0](../configs/t40-sigma-040-early/results-2026-09-05-c18b9ca0.json).
- [t40-sigma-040-2026 config](../configs/t40-sigma-040-2026/config.json), [full result d045b5e7](../configs/t40-sigma-040-2026/results-2026-09-05-d045b5e7.json).

### t40-tog: KILL

non-improving early LL, R14+ tip regression.

Mechanism: Previous five TOGs → Expected playing weight → Effective lineup PAV.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-tog mechanism"><title>t40-tog mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Previous five TOGs</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Expected playing weight</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Effective lineup PAV</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
pav.tog_weight=1
```

Run: `bun analysis/task40-campaign.ts --ids t40-tog`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 721 | +5 | -0.000020 | +5 / 533 |
| Early 2016-2019 | 828 | 551 | -3 | +0.000019 | -3 / 410 |
| 2026 R0-13, burned | 114 | 83 | -1 | -0.001375 | -1 / 48 |
| 2026 R14+ | 97 | 66 | -2 | +0.004500 | -2 / 35 |
| Full 2026 | 211 | 149 | -3 | +0.001325 | -3 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-tog per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="316.5344089659267" x2="316.5344089659267" y1="20" y2="143" class="zero"/><line x1="186.08906816098778" x2="186.08906816098778" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="261.3536559541425" x2="362.17054594836463" y1="38" y2="38" class="interval"/><circle cx="316.0051549194563" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.000020; tips +5</text><text x="5" y="85">Early</text><line x1="264.3925356589635" x2="372.168532290597" y1="80" y2="80" class="interval"/><circle cx="317.02388387787215" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">+0.000019; tips -3</text><text x="5" y="127">2026 R14+</text><line x1="268.9436406636837" x2="610" y1="122" y2="122" class="interval"/><circle cx="433.92592323408275" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">+0.004500; tips -2</text><text x="160" y="165" class="small">-0.0060</text><text x="610" y="165" text-anchor="end" class="small">+0.0112</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.000003, 95% CI [-0.001599, +0.001399].
With R14+ as a third stratum: +0.000217, CI [-0.001364, +0.001540].
Historical round-block CI [-0.001366, +0.001321].

Correct normal head: historical pooled LL -0.000421,
CI [-0.001746, +0.000747]. Round-block CI [-0.001601, +0.000695].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +2. Consensus-wrong tips
0 / 342 paired games; primary +1 / 291,
full 2026 -1 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: St Kilda,
+0.215 points at n=225; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.000018.
Primary excluding draws -0.000173; early +0.000101.

Evidence files, with effective config hashes:

- [t40-tog config](../configs/t40-tog/config.json), [full result f003dd9c](../configs/t40-tog/results-2026-09-05-f003dd9c.json).
- [t40-tog-early config](../configs/t40-tog-early/config.json), [full result e5f23e65](../configs/t40-tog-early/results-2026-09-05-e5f23e65.json).
- [t40-tog-2026 config](../configs/t40-tog-2026/config.json), [full result 67488ee2](../configs/t40-tog-2026/results-2026-09-05-67488ee2.json).

### t40-travel-probe: KILL

Both Plan 008 GO interpretations fail the cross-era close-game direction check.

Mechanism: Venue/base coordinates → Slope and close split → Era-replication gate.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-travel-probe mechanism"><title>t40-travel-probe mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Venue/base coordinates</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Slope and close split</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Era-replication gate</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
No prediction change; diagnostic replica.
```

Run: `bun analysis/task40-campaign.ts --ids t40-travel-probe`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 716 | 0 | 0.000000 | 0 / 533 |
| Early 2016-2019 | 828 | 554 | 0 | 0.000000 | 0 / 410 |
| 2026 R0-13, burned | 114 | 84 | 0 | 0.000000 | 0 / 48 |
| 2026 R14+ | 97 | 68 | 0 | 0.000000 | 0 / 35 |
| Full 2026 | 211 | 152 | 0 | 0.000000 | 0 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-travel-probe per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="497.5" x2="497.5" y1="20" y2="143" class="zero"/><line x1="216.25" x2="216.25" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="497.5" x2="497.5" y1="38" y2="38" class="interval"/><circle cx="497.5" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">0.000000; tips 0</text><text x="5" y="85">Early</text><line x1="497.5" x2="497.5" y1="80" y2="80" class="interval"/><circle cx="497.5" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">0.000000; tips 0</text><text x="5" y="127">2026 R14+</text><line x1="497.5" x2="497.5" y1="122" y2="122" class="interval"/><circle cx="497.5" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">0.000000; tips 0</text><text x="160" y="165" class="small">-0.0060</text><text x="610" y="165" text-anchor="end" class="small">+0.0020</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL 0.000000, 95% CI [0.000000, 0.000000].
With R14+ as a third stratum: 0.000000, CI [0.000000, 0.000000].
Historical round-block CI [0.000000, 0.000000].

Correct normal head: historical pooled LL 0.000000,
CI [0.000000, 0.000000]. Round-block CI [0.000000, 0.000000].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips 0. Consensus-wrong tips
0 / 342 paired games; primary 0 / 291,
full 2026 0 / 51, R14+ 0 / 23.

Largest eligible absolute team-bias worsening: Adelaide,
0.000 points at n=208; allowed maximum +2.
Historical LL draw sensitivity: half-target 0.000000.
Primary excluding draws 0.000000; early 0.000000.

Evidence files, with effective config hashes:

- [t40-travel-probe config](../configs/t40-travel-probe/config.json), [full result 2641f46f](../configs/t40-travel-probe/results-2026-09-05-2641f46f.json).
- [t40-travel-probe-early config](../configs/t40-travel-probe-early/config.json), [full result 909461e1](../configs/t40-travel-probe-early/results-2026-09-05-909461e1.json).
- [t40-travel-probe-2026 config](../configs/t40-travel-probe-2026/config.json), [full result e8e0cede](../configs/t40-travel-probe-2026/results-2026-09-05-e8e0cede.json).

### t40-venue-geo: KILL

non-improving primary LL, non-improving early LL, pooled tip regression, recent tip regression, consensus-wrong guard.

Mechanism: Pre-match venue context → Change prediction HA → Margin crosses zero?.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-venue-geo mechanism"><title>t40-venue-geo mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Pre-match venue context</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Change prediction HA</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Margin crosses zero?</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
output.prediction_ha_mode="geographic"
```

Run: `bun analysis/task40-campaign.ts --ids t40-venue-geo`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 712 | -4 | +0.001734 | -4 / 533 |
| Early 2016-2019 | 828 | 556 | +2 | +0.003513 | +2 / 410 |
| 2026 R0-13, burned | 114 | 81 | -3 | +0.009553 | -3 / 48 |
| 2026 R14+ | 97 | 70 | +2 | -0.018668 | +2 / 35 |
| Full 2026 | 211 | 151 | -1 | -0.003421 | -1 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-venue-geo per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="507.0376526618271" x2="507.0376526618271" y1="20" y2="143" class="zero"/><line x1="462.6942418311937" x2="462.6942418311937" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="456.31273056592585" x2="586.3750198544687" y1="38" y2="38" class="interval"/><circle cx="522.4133498114145" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">+0.001734; tips -4</text><text x="5" y="85">Early</text><line x1="470.34742035080495" x2="610" y1="80" y2="80" class="interval"/><circle cx="538.1890209733342" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">+0.003513; tips +2</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="534.1976315891122" y1="122" y2="122" class="interval"/><circle cx="341.47282657147895" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.018668; tips +2</text><text x="160" y="165" class="small">-0.0391</text><text x="610" y="165" text-anchor="end" class="small">+0.0116</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL +0.002513, 95% CI [-0.002802, +0.008251].
With R14+ as a third stratum: +0.001479, CI [-0.003948, +0.006856].
Historical round-block CI [-0.002255, +0.007987].

Correct normal head: historical pooled LL +0.001935,
CI [-0.002554, +0.006661]. Round-block CI [-0.002176, +0.006451].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -12. Consensus-wrong tips
-9 / 342 paired games; primary -9 / 291,
full 2026 0 / 51, R14+ +1 / 23.

Largest eligible absolute team-bias worsening: GWS Giants,
+0.688 points at n=243; allowed maximum +2.
Historical LL draw sensitivity: half-target +0.002874.
Primary excluding draws +0.002339; early +0.003398.

Evidence files, with effective config hashes:

- [t40-venue-geo config](../configs/t40-venue-geo/config.json), [full result a31104ef](../configs/t40-venue-geo/results-2026-09-05-a31104ef.json).
- [t40-venue-geo-early config](../configs/t40-venue-geo-early/config.json), [full result ae947d6d](../configs/t40-venue-geo-early/results-2026-09-05-ae947d6d.json).
- [t40-venue-geo-2026 config](../configs/t40-venue-geo-2026/config.json), [full result e5f7dfb1](../configs/t40-venue-geo-2026/results-2026-09-05-e5f7dfb1.json).

### t40-venue-static: KILL

recent tip regression, consensus-wrong guard.

Mechanism: 2010-2019 fit only → Fixed shrunk venue HA → Prediction intercept.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-venue-static mechanism"><title>t40-venue-static mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">2010-2019 fit only</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Fixed shrunk venue HA</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Prediction intercept</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
output.prediction_ha_table.1=125.2516029376187
output.prediction_ha_table.5=233.5528616731897
output.prediction_ha_table.6=124.72412197818458
output.prediction_ha_table.11=103.01151345334078
output.prediction_ha_table.12=109.44779463579334
output.prediction_ha_table.15=54.154678533865564
output.prediction_ha_table.17=58.27950152949396
output.prediction_ha_table.18=61.795129043064975
output.prediction_ha_table.19=142.97689273903276
output.prediction_ha_table.22=55.78314906465452
output.prediction_ha_table.27=139.99014292747648
output.prediction_ha_table.82=78.19824971312504
```

Run: `bun analysis/task40-campaign.ts --ids t40-venue-static`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 715 | -1 | -0.001175 | -1 / 533 |
| Early 2016-2019 | 828 | 558 | +4 | -0.004583 | +4 / 410 |
| 2026 R0-13, burned | 114 | 80 | -4 | -0.014344 | -4 / 48 |
| 2026 R14+ | 97 | 70 | +2 | -0.000950 | +2 / 35 |
| Full 2026 | 211 | 150 | -2 | -0.008187 | -2 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-venue-static per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="377.6764375852622" x2="377.6764375852622" y1="20" y2="143" class="zero"/><line x1="315.6620142257384" x2="315.6620142257384" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="283.5080264517102" x2="446.63696616441104" y1="38" y2="38" class="interval"/><circle cx="363.10797676334096" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.001175; tips -1</text><text x="5" y="85">Early</text><line x1="237.76162974919032" x2="404.2271212947471" y1="80" y2="80" class="interval"/><circle cx="320.8377412855692" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.004583; tips +4</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="365.8891073710796" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.000950; tips +2</text><text x="160" y="165" class="small">-0.0176</text><text x="610" y="165" text-anchor="end" class="small">+0.0187</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.002668, 95% CI [-0.007078, +0.002081].
With R14+ as a third stratum: -0.002584, CI [-0.007044, +0.002139].
Historical round-block CI [-0.007676, +0.002178].

Correct normal head: historical pooled LL -0.004093,
CI [-0.007865, -0.000104]. Round-block CI [-0.008335, -0.000107].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -4. Consensus-wrong tips
-4 / 342 paired games; primary -4 / 291,
full 2026 0 / 51, R14+ +1 / 23.

Largest eligible absolute team-bias worsening: Port Adelaide,
+1.740 points at n=232; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.002799.
Primary excluding draws -0.001272; early -0.004754.

Evidence files, with effective config hashes:

- [t40-venue-static config](../configs/t40-venue-static/config.json), [full result 9fea05f4](../configs/t40-venue-static/results-2026-09-05-9fea05f4.json).
- [t40-venue-static-early config](../configs/t40-venue-static-early/config.json), [full result 6750e0df](../configs/t40-venue-static-early/results-2026-09-05-6750e0df.json).
- [t40-venue-static-2026 config](../configs/t40-venue-static-2026/config.json), [full result 83cc214c](../configs/t40-venue-static-2026/results-2026-09-05-83cc214c.json).

### t40-venue-team: KILL

recent tip regression, consensus-wrong guard.

Mechanism: Past venue residual → Team x venue shrinkage → Next visit correction.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-venue-team mechanism"><title>t40-venue-team mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Past venue residual</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Team x venue shrinkage</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Next visit correction</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
output.team_venue.k=32
output.team_venue.season_carry=0.5
```

Run: `bun analysis/task40-campaign.ts --ids t40-venue-team`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 715 | -1 | -0.001577 | -1 / 533 |
| Early 2016-2019 | 828 | 555 | +1 | -0.002152 | +1 / 410 |
| 2026 R0-13, burned | 114 | 81 | -3 | -0.005458 | -3 / 48 |
| 2026 R14+ | 97 | 68 | 0 | -0.001560 | 0 / 35 |
| Full 2026 | 211 | 149 | -3 | -0.003666 | -3 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-venue-team per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="417.0184684776579" x2="417.0184684776579" y1="20" y2="143" class="zero"/><line x1="295.1922555260663" x2="295.1922555260663" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="312.2565159004506" x2="446.52287494254665" y1="38" y2="38" class="interval"/><circle cx="378.6042668995526" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.001577; tips -1</text><text x="5" y="85">Early</text><line x1="280.7055663909718" x2="454.2194815723893" y1="80" y2="80" class="interval"/><circle cx="364.5831218442751" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.002152; tips +1</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="379.0122970359097" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.001560; tips 0</text><text x="160" y="165" class="small">-0.0105</text><text x="610" y="165" text-anchor="end" class="small">+0.0079</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.001829, 95% CI [-0.004058, +0.000343].
With R14+ as a third stratum: -0.001816, CI [-0.004018, +0.000377].
Historical round-block CI [-0.003976, +0.000214].

Correct normal head: historical pooled LL -0.003012,
CI [-0.004901, -0.001236]. Round-block CI [-0.004892, -0.001325].
Holm-adjusted round-sign p=0.0570.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips -3. Consensus-wrong tips
-7 / 342 paired games; primary -5 / 291,
full 2026 -2 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Hawthorn,
+0.140 points at n=210; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.001755.
Primary excluding draws -0.001566; early -0.002146.

Evidence files, with effective config hashes:

- [t40-venue-team config](../configs/t40-venue-team/config.json), [full result f848ae3c](../configs/t40-venue-team/results-2026-09-05-f848ae3c.json).
- [t40-venue-team-early config](../configs/t40-venue-team-early/config.json), [full result af2c5389](../configs/t40-venue-team-early/results-2026-09-05-af2c5389.json).
- [t40-venue-team-2026 config](../configs/t40-venue-team-2026/config.json), [full result f37ac64b](../configs/t40-venue-team-2026/results-2026-09-05-f37ac64b.json).

### t40-weather: BLOCKED

Limited run completed; no historical retained forecasts for a promotion-capable test.

Mechanism: Forecast/observed rain → Roof-aware update gain → Next-match rating gap.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-weather mechanism"><title>t40-weather mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Forecast/observed rain</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Roof-aware update gain</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Next-match rating gap</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
elo.od.weight=1
elo.od.k=0.08
elo.od.home_advantage_points=10
elo.od.initial_score=85
elo.od.regression_to_mean=0.2
elo.od.weather_luck_weight=0.25
```

Run: `bun analysis/task40-campaign.ts --ids t40-weather`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 728 | +12 | -0.005762 | +12 / 533 |
| Early 2016-2019 | 828 | 560 | +6 | -0.005010 | +6 / 410 |
| 2026 R0-13, burned | 114 | 84 | 0 | -0.019541 | 0 / 48 |
| 2026 R14+ | 97 | 69 | +1 | -0.007706 | +1 / 35 |
| Full 2026 | 211 | 153 | +1 | -0.014100 | +1 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-weather per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="470.38166011541824" x2="470.38166011541824" y1="20" y2="143" class="zero"/><line x1="418.31151129406754" x2="418.31151129406754" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="329.5904053350563" x2="489.9384360694394" y1="38" y2="38" class="interval"/><circle cx="410.37545170027465" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.005762; tips +12</text><text x="5" y="85">Early</text><line x1="321.8698916612399" x2="513.5990967973466" y1="80" y2="80" class="interval"/><circle cx="418.20669331355447" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">-0.005010; tips +6</text><text x="5" y="127">2026 R14+</text><line x1="160" x2="610" y1="122" y2="122" class="interval"/><circle cx="390.12782473198183" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.007706; tips +1</text><text x="160" y="165" class="small">-0.0298</text><text x="610" y="165" text-anchor="end" class="small">+0.0134</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL -0.005433, 95% CI [-0.011012, +0.000785].
With R14+ as a third stratum: -0.005544, CI [-0.011348, +0.000399].
Historical round-block CI [-0.011210, +0.000518].

Correct normal head: historical pooled LL -0.004143,
CI [-0.008665, +0.001128]. Round-block CI [-0.008923, +0.000912].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips +4. Consensus-wrong tips
0 / 342 paired games; primary +3 / 291,
full 2026 -3 / 51, R14+ -1 / 23.

Largest eligible absolute team-bias worsening: Carlton,
+1.056 points at n=205; allowed maximum +2.
Historical LL draw sensitivity: half-target -0.005554.
Primary excluding draws -0.005965; early -0.004778.

Direct increment over plain OD, primary / early / full 2026:
LL 0.000000 / 0.000000 / -0.000010;
tips 0 / 0 / 0.

Evidence files, with effective config hashes:

- [t40-weather config](../configs/t40-weather/config.json), [full result 1d5a45cb](../configs/t40-weather/results-2026-09-05-1d5a45cb.json).
- [t40-weather-early config](../configs/t40-weather-early/config.json), [full result d3714ebd](../configs/t40-weather-early/results-2026-09-05-d3714ebd.json).
- [t40-weather-2026 config](../configs/t40-weather-2026/config.json), [full result f5505b2c](../configs/t40-weather-2026/results-2026-09-05-f5505b2c.json).

### t40-pav-day-end: KILL

non-improving early LL.

Mechanism: Same-day scores → Queue PAV to next day → Available league totals.

<figure class="mechanism"><svg viewBox="0 0 660 105" role="img" aria-label="t40-pav-day-end mechanism"><title>t40-pav-day-end mechanism</title><rect x="10" y="12" width="198" height="51" rx="6" class="box"/><text x="109" y="42" text-anchor="middle">Same-day scores</text><path d="M211 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="232" y="12" width="198" height="51" rx="6" class="box"/><text x="331" y="42" text-anchor="middle">Queue PAV to next day</text><path d="M433 37h17m-5-5 5 5-5 5" class="arrow"/><rect x="454" y="12" width="198" height="51" rx="6" class="box"/><text x="553" y="42" text-anchor="middle">Available league totals</text><text x="330" y="89" text-anchor="middle" class="small">I: primary LL &lt; -0.005; pooled CI &lt; 0; tip and bias guards. C adds matched-head and prospective checks.</text></svg></figure>

Exact parameter differences from v3:

```text
pav.update_timing="previous_day"
```

Run: `bun analysis/task40-campaign.ts --ids t40-pav-day-end`. Score all with
`bun analysis/task40-score.ts --out analysis/task40-score-replay.json`.
Use a new output path; result writers refuse overwrites. Windows and bars
are I/C above, including primary below -0.005, early within 0.5-1.5 times
its magnitude, negative historical CI and nonnegative required tip guards.

| Window | n | Candidate tips | Tip delta | LL delta | Close tips delta / decisive n |
| --- | ---: | ---: | ---: | ---: | ---: |
| Primary 2021-2025 | 1062 | 716 | 0 | -0.000001 | 0 / 533 |
| Early 2016-2019 | 828 | 554 | 0 | +0.000004 | 0 / 410 |
| 2026 R0-13, burned | 114 | 84 | 0 | -0.000000 | 0 / 48 |
| 2026 R14+ | 97 | 68 | 0 | -0.000001 | 0 / 35 |
| Full 2026 | 211 | 152 | 0 | -0.000000 | 0 / 83 |

<figure><svg viewBox="0 0 660 190" role="img" aria-label="t40-pav-day-end per-window log-loss differences and 95 percent intervals"><title>Candidate minus v3 log loss; negative is better</title><line x1="497.5" x2="497.5" y1="20" y2="143" class="zero"/><line x1="216.25" x2="216.25" y1="20" y2="143" class="gate"/><text x="5" y="43">Primary</text><line x1="497.30622018741803" x2="497.5955849899972" y1="38" y2="38" class="interval"/><circle cx="497.4546615225776" cy="38" r="4" class="point"/><text x="645" y="28" text-anchor="end" class="small">-0.000001; tips 0</text><text x="5" y="85">Early</text><line x1="497.4430807078598" x2="498.0317675807939" y1="80" y2="80" class="interval"/><circle cx="497.71674308391187" cy="80" r="4" class="point"/><text x="645" y="70" text-anchor="end" class="small">+0.000004; tips 0</text><text x="5" y="127">2026 R14+</text><line x1="497.36975289469353" x2="497.5345166028502" y1="122" y2="122" class="interval"/><circle cx="497.4510864252407" cy="122" r="4" class="point"/><text x="645" y="112" text-anchor="end" class="small">-0.000001; tips 0</text><text x="160" y="165" class="small">-0.0060</text><text x="610" y="165" text-anchor="end" class="small">+0.0020</text><text x="330" y="185" text-anchor="middle" class="small">LL bits/match; negative is better. Dashed line: primary -0.005 bar. Solid line: zero.</text></svg><figcaption>Paired match-bootstrap 95% intervals, 1,000 draws, seed 42. Historical pooled and round-block intervals are reported separately.</figcaption></figure>

Historical pooled LL +0.000001, 95% CI [-0.000001, +0.000004].
With R14+ as a third stratum: +0.000001, CI [-0.000001, +0.000004].
Historical round-block CI [-0.000001, +0.000004].

Correct normal head: historical pooled LL +0.000001,
CI [-0.000001, +0.000004]. Round-block CI [-0.000001, +0.000003].
Holm-adjusted round-sign p=1.0000.
Incumbent numerical gates: FAIL. Corrected numerical gates: FAIL. Prospective 2027 evidence: absent.

Recent 2024-2026 tips 0. Consensus-wrong tips
0 / 342 paired games; primary 0 / 291,
full 2026 0 / 51, R14+ 0 / 23.

Largest eligible absolute team-bias worsening: Hawthorn,
+0.000 points at n=210; allowed maximum +2.
Historical LL draw sensitivity: half-target +0.000001.
Primary excluding draws -0.000001; early +0.000004.

Evidence files, with effective config hashes:

- [t40-pav-day-end config](../configs/t40-pav-day-end/config.json), [full result d9d7b93c](../configs/t40-pav-day-end/results-2026-09-05-d9d7b93c.json).
- [t40-pav-day-end-early config](../configs/t40-pav-day-end-early/config.json), [full result 3e37d460](../configs/t40-pav-day-end-early/results-2026-09-05-3e37d460.json).
- [t40-pav-day-end-2026 config](../configs/t40-pav-day-end-2026/config.json), [full result 6c54d47c](../configs/t40-pav-day-end-2026/results-2026-09-05-6c54d47c.json).
<!-- TASK40 GENERATED END -->

## Methodology details

### Power, selection and multiplicity

There is no identifiable numerical estimate of v3's original tuning optimism
from these reused windows. The 2010-2014 period has no lineups, so it would
test a different information set. Calling that an untouched validation of
the full model would be misleading. The correction is a frozen prospective
trial with archived inputs, not subtracting a guessed penalty from 0.8485.

The paired IID normal approximation at two-sided 5% size gives these
80%-power minimum detectable effects on 1,890 historical matches:

| Comparison | LL bits per match | Tip difference |
| --- | ---: | ---: |
| Plain OD versus v3, legacy head | 0.00835 | 30.9 |
| Plain OD versus v3, correct normal head | 0.00700 | 30.9 |
| OD-shot0.75 versus v3, legacy head | 0.00894 | 32.2 |
| Intercept involvement versus v3, legacy head | 0.000262 | 4.85 |

Power depends on paired prediction differences. A universal 0.005 noise
floor is wrong. Small near-identical models have much lower variance than
OD. These calculations are planning approximations, not observed power
claims or guarantees. The scorer also reports round-block confidence
intervals to expose the IID assumption.

A shared-round-sign sensitivity simulation preserves correlation across
all 66 campaign variants. After centring their empirical historical
differences at zero, the median best apparent improvement is 0.00519 bits.
Its central 95% range is 0.00157-0.01163. At least one candidate crosses
0.005 in 53.7% of 1,000 draws, and 2.456 candidates cross on average.
This illustrates selection risk. It does not reconstruct the old searches.

For 156 null candidates with OD's marginal standard error, a Gaussian
illustration expects 7.38 to beat 0.005 on magnitude alone. A valid
one-sided 2.5% significance rule expects 3.9 false passes. Neither count
is the chance of clearing the entire promotion standard. Expected counts
do not require independent candidates, but the common marginal model is
an assumption. All quantities and seeds are saved in
`analysis/task40-statistics-results.json`.

Holm correction covers all 66 variants, including duplicate controls,
using 9,999 shared round-sign randomisations and the plus-one p-value
correction. This requires null symmetry of round differences. No legacy-head
candidate passes Holm at 0.05. Several correct-head offset or high-gain
variants do, but their tip or bias guards fail. None clears C's numerical
gates, even before the prospective requirement.

### Residual structure and competition relevance

| Incumbent cut | Primary | Early | Full 2026 |
| --- | ---: | ---: | ---: |
| Close accuracy, absolute margin below 12 | 56.1% | 56.1% | 62.7% |
| Close matches, including draws | 540 | 411 | 85 |
| Derby mean home-oriented residual | -5.11 | -5.95 | -8.00 |
| True-home mean home-oriented residual | +1.19 | +3.00 | +4.20 |
| Margin 24-48 accuracy | 85.5% | 91.5% | 96.1% |

The derby residual direction replicates. The registered bucket rule still
loses recent and consensus-wrong tips. A residual pattern can be real
without a fixed correction being a useful competition choice.

In R14+, close accuracy is 18/35 decisive games, or 51.4%. There are 36
close fixtures including one draw. The 24 games in the 24-48 band are all
correct. This is why a margin-score gain concentrated in favourites is
not enough. Every candidate reports its fixed-incumbent close cut and
R14+ consensus-wrong cut below.

Team-specific tail bias persists in some clubs. In primary versus full
2026, West Coast's team-oriented tail bias is -15.62 versus -9.18 points,
Richmond's -15.93 versus -16.32, and North Melbourne's -7.74 versus -9.22.
Their 2026 tail samples are 16, 13 and 4 appearances. Other teams change
direction, including the Bulldogs. The small current samples do not justify
learning another tail rule. All teams, venues, seasons, round phases,
margin bands, pick sides and calibration deciles are retained in the JSON
evidence. The appendix tables expose the main cuts rather than selecting
only favourable clubs.

### Wheelo fixed-effects replication

The original parameter-fit code already included team-season effects.
Repeating that control is a replication, not a new deconfounding method.

| Panel, both models on identical rows | n | V3 venue range | Wheelo venue range |
| --- | ---: | ---: | ---: |
| Original 2022-2026 CSV | 971 | 4.64 | 21.86 |
| Fresh September pair | 1066 | 4.95 | 21.08 |

Ranges include venues with at least five matches. Both designs have 105
columns and full rank. The fresh design's condition number is 16.97.
No v3 fixture is unmatched in the fresh join. The 21.9-point claim survives
the requested control, but remains a descriptive conditional coefficient
range. It does not identify Wheelo's causal HA or its updating algorithm.
`analysis/task40_wheelo.py` uses NumPy 2.3.3 in an isolated temporary
environment. Its least-squares check follows the
[NumPy least-squares contract](https://numpy.org/doc/stable/reference/generated/numpy.linalg.lstsq.html).

### Coverage and forecast blocker

Observed weather is present for all 3,472 completed frozen matches. The
first frozen read and a second independent read-only D1 query both find
zero retained forecasts before 2026. There are 60 forecasts in 2026,
58 for completed games and fetched before kickoff. Only three completed,
unroofed games have positive precipitation surprise. The remaining rows
are not three independent historical seasons of evidence.

The weather run completed on all windows with the registered fallback.
Its primary and early predictions equal plain OD, and its tiny 2026
change cannot identify a weather effect. The promotion-capable experiment
is BLOCKED by coverage. The second query read 14,049 rows and wrote zero.
Forecast retention starts on 2026-07-16. Observations backfilled in July
are not historical forecasts and cannot replace them.

Quarter scores, minutes in front and rushed behinds are complete in 2016
and 2020 onward, but absent in 2010-2015 and 2017-2019. That 2016 coverage
was not in the supplied contract summary. The run used the actual frozen
columns and baseline fallback elsewhere. Its early comparison is partial
coverage, not full feature confirmation. Quarter totals agree with final
scores in every covered match. Rich player inputs have broader historical
coverage than the supplied summary: pressure is nearly complete in 2016,
and rating points are present from 2012. The exact per-column denominators
are in `analysis/task40-integrity-results.json`.

### Derived gain and isolated controls

The training-only moment fit gives residual variance R=1751.87 and drift
variance Q=203.99, from 87 team-season cells and 69 adjacent pairs.
Its raw gain 0.28794 exceeds the pre-registered cap, so the tested gain is
0.15, OD k=0.30, with RTM=0.34805. The result is a failed registered
mechanical derivation, not a licence to move the cap after seeing tips.
Opponent schedule and HA can contaminate team-season moments, so this
failure does not establish an optimal memory length.

The points-residual implementation agrees with OD's margins within 1e-10
in every scored window. Its result is an algebraic control, not independent
confirmation. Richer OD targets are compared directly with plain OD in
each result section. Quarter and rushed-behind adjustments add no
historical LL improvement over OD. No feature survives the complete
univariate standard, so the prerequisite for stacking is not met.

### Unresolved questions and the next tests

Freeze a 2027 head-to-head of unchanged v3 and plain OD. Archive each
prediction, named lineup, available statistics and forecast at the actual
competition lock. Keep the definitions of recent seasons, close games,
consensus-wrong games and draws fixed. Score the full season once, with
paired uncertainty and the existing guards. One season may still be
underpowered; do not turn an imprecise result into a promotion.

The Task 23 prior-target path now excludes later first lineups. A meaningful
all-team target still needs deadline-known roster inputs before any further
test. This campaign leaves the feature disabled. TOG context
uses the previous and current season in the selected data, so a player
returning after a longer absence falls back to neutral playing-time weight.
That is a bounded proxy, not complete career-history reconstruction.
Forecast-weather needs several seasons of retained pre-kickoff forecasts.
Neither missing input is solved by another sweep over current results.

### F3 availability audit registration, before results

The UTC reconstruction found 156 same-day pairwise kickoff-order inversions
in 2010-2026. There are 1,702 pairs less than an assumed three-hour match
duration apart, including those inversions. The overlap count is a risk
screen, not evidence of actual final-siren times.

Add `t40-pav-day-end` and its early/2026 variants. Set the optional
`pav.update_timing=previous_day`. Queue PAV updates until the next calendar
date, before a season transition. This removes every same-day completed-game
contribution from PAV's shared league totals, conservatively excluding some
legitimately available earlier games too. Elo teams cannot play twice on
one day, so their own match ordering is unaffected. Use I and C without
changing any threshold. This is an availability sensitivity test, not a
reconstruction of Thursday lineups. Run `bun analysis/task40-campaign.ts
--ids t40-pav-day-end`, then score with the same scorer. Absent remains
bit-identical. No deadline archive means no causal estimate of lineup
availability bias.

### Correctness checkpoint and frozen inputs

This subsection preserves the pre-execution checkpoint. Its future-tense
registrations were completed; final findings and result sections give the
outcomes. No bar was changed after its candidate result.

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

### Training-fit implementation clarification, before C6/E1 results

E1 subtracts the existing OD update HA of 10 points from home margins and
negates that value for away observations. R uses pooled within-team-season
residual sums of squares divided by observations minus team-season cells.
Adjacent-season sampling variance is R/n1+R/n2; the regression has an
intercept. Both members of every fitted pair are within 2010-2014.
C6's 20 pseudo-pairs use each age cell's mean prior zone PAV on both sides,
so the shrinkage has the same units as the pooled numerator and denominator.
Missing next-year player rows count as zero, including exits.

### Rating-points and team-venue clarification, before first results

C7 normalises across the observed team roster, not just today's selected
lineup. Normalising across today's lineup would leave its total unchanged
and could not test the hypothesis. The roster is players seen last season
or earlier this season, assigned to their most recently observed team,
plus today's named players. Each player's non-negative rating-points mean
uses last season and current past appearances, with five pseudo-appearances
at the previous season's league mean. The roster's blended PAV total is
redistributed by these rates. The selected shares become the team PAV
input, divided equally across zones. Missing historical ratings leave
the original PAV input unchanged.

A5 uses canonical venue IDs for sponsor aliases. Each appearance increments
the team-venue count by one, with half the home-oriented pre-correction
residual credited to the home team and its negative to the away team.
The denominator is appearances plus 32. Both sums and counts carry at 0.5
across a season boundary.

- [x] Read the complete supplied campaign instructions.
- [x] Create `research/adversarial-campaign-2026-09` from current HEAD.
- [x] Reproduce the four specified historical baselines.
- [x] Finish the ordered source, ledger, advisor-plan and analysis-script reads.
- [x] Audit leakage, lineups, ordering, priors, PAV units and calibration.
- [x] Quantify power, selection bias, residual cuts and scoring sensitivity.
- [x] Fix outright bugs and record baseline identity or complete re-baselining.
- [x] Audit every Task 15-38c and both rounds of advisor plans.
- [x] Pre-register every required candidate class A-F and its exact variants.
- [x] Run each candidate, its windows and all regression guards.
- [x] Produce team/venue tables and the Wheelo fixed-effects re-fit.
- [x] Check combination eligibility. No corrected survivor and only one I survivor.
- [x] Finalise verdicts, recommendation and unresolved experiments.
- [x] Add a mechanism sketch and result figure for every candidate.
- [x] Append HANDOFF and add only the campaign's CHANGELOG entry.
- [x] Pass typecheck, check and test; preserve protected files.
- [x] Render, inspect and open `docs/task-40-report.html`.
- [x] Commit only campaign-owned files and changes. Do not push.

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

At this earlier checkpoint, remaining execution included lineup signal shape, position/TOG/shrinkage,
age variants, rating points, team-venue interactions, quarter/minutes,
weather/roof, rushed behinds, derived/scalar gains and finals gain. The
power/selection audit, complete result figures, final report and handoff
were also unfinished. The final checkpoint below supersedes this progress note.

### 2026-09-05 final analysis checkpoint

All 66 registered variants and diagnostics completed three windows. There
are 12 PARK, 53 KILL and one BLOCKED promotion-quality weather test whose
limited-data run completed. The sole I survivor is OD-shot0.75. There are
no corrected numerical survivors, so no qualifying multi-survivor
combination or stack exists. Direct OD increments are reported separately.

The Wheelo replication confirms the descriptive venue range. The shared
selection-null simulation and per-candidate power calculations are complete.
The 132 SVGs include one mechanism and one result figure per variant.
The report generator checks those counts and refuses external scripts,
stylesheets or images. JSON evidence remains available for all residual
cuts, not just the displayed summaries.

The generated result JSON and HTML are excluded from source formatting,
as existing backtest JSON already is. Their numerical consistency is
checked by the analysis scripts. A separate strict TypeScript command
checks the campaign scripts, which the repository's src-only tsconfig
does not include. The prose and figure labels received the required
unslop pass. The browser preview connection failed; local Chrome is used
for rendered-page inspection.

Final validation passes 222 tests in 23 files, repository typecheck and
Biome, plus the separate strict analysis-script check. The four historical
replays remain exact after the final regression-centre and future-lineup
repairs. Browser DOM inspection confirms 66 candidate sections, 132 SVGs
and zero external scripts, stylesheets or images. Light, dark and 390px
mobile screenshots were inspected. Chrome's early CLI screenshots were
blank before painting; captures taken after animation frames render correctly.

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

### Replaying campaign evidence

```sh
bun analysis/task40-data.ts
bun analysis/task40-extra-data.ts
bun analysis/task40-field.ts
bun analysis/task40-audit.ts --verify-only
bun analysis/task40-campaign.ts
bun analysis/task40-score.ts --out analysis/task40-score-replay.json
bun analysis/task40-statistics.ts
UV_CACHE_DIR=/tmp/tipper-task40-uv-cache uv run --no-project --with numpy==2.3.3 python analysis/task40_wheelo.py
bun analysis/task40-report.ts
bun run typecheck
bun run check
bun run test --run
open docs/task-40-report.html
```

Snapshot and result writers are create-only. Skip a fetch when its frozen
file already exists. Use a fresh output name for a repeated scorer run.
`task40-statistics.ts` reads the committed 65-row main score file plus
the one-row availability file. It too refuses to overwrite its evidence.
The report renderer reads those frozen results and can be rerun.
The isolated NumPy runner installs no repository dependency.

The extra strict check used for campaign scripts is:

```sh
bunx tsc --ignoreConfig --noEmit --strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes --skipLibCheck --module esnext --moduleResolution bundler --target es2022 --types node,@cloudflare/workers-types analysis/task40-*.ts
```

No promotion command is recommended because no candidate qualifies.
No publish, D1 write, push, PR or advisor-branch merge was performed.

The browser verification command was
`bun analysis/task40-render.ts /tmp/tipper-task40-preview.KFgEym`, after
launching an isolated local Chrome with `--remote-debugging-port=0` and
`--user-data-dir=/tmp/tipper-task40-preview.KFgEym/cdp`. It checks the DOM
counts and captures light, dark and mobile PNGs in that temporary directory.
This fallback uses no personal browser profile. The delivered HTML needs
no preview process and works as a local file.

<!-- TASK40 GENERATED START -->

## Appendix: complete team and venue residual tables

All means are actual minus predicted, oriented toward each team or the home side at each venue.
The n>=50, +2-point worsening guard applies to teams only. Small venue samples remain visible.

<details><summary>t40-age-k30: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.604 | +0.241 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.838 | +0.069 |
| Historical team: Carlton | 205 | -0.825 | -0.435 | -0.389 |
| Historical team: Collingwood | 215 | +1.878 | +1.978 | +0.100 |
| Historical team: Essendon | 204 | -5.111 | -5.078 | -0.033 |
| Historical team: Fremantle | 204 | -3.834 | -3.887 | +0.053 |
| Historical team: Geelong | 221 | +8.678 | +9.399 | +0.721 |
| Historical team: Gold Coast | 203 | -5.939 | -6.219 | +0.280 |
| Historical team: GWS Giants | 220 | +6.445 | +6.685 | +0.240 |
| Historical team: Hawthorn | 210 | +2.662 | +2.654 | -0.008 |
| Historical team: Melbourne | 211 | +0.901 | +0.557 | -0.343 |
| Historical team: North Melbourne | 202 | -6.038 | -5.950 | -0.087 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.013 | -0.319 |
| Historical team: Richmond | 210 | -2.404 | -2.230 | -0.174 |
| Historical team: St Kilda | 202 | -3.956 | -4.265 | +0.309 |
| Historical team: Sydney | 216 | +3.567 | +3.040 | -0.527 |
| Historical team: West Coast | 209 | -7.765 | -7.562 | -0.203 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.784 | -0.317 |
| All-window team: Adelaide | 231 | +6.348 | +6.512 | +0.164 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.358 | +0.147 |
| All-window team: Carlton | 230 | +0.315 | +0.814 | +0.500 |
| All-window team: Collingwood | 239 | +1.113 | +1.279 | +0.166 |
| All-window team: Essendon | 227 | -5.785 | -5.742 | -0.042 |
| All-window team: Fremantle | 228 | -2.838 | -2.943 | +0.105 |
| All-window team: Geelong | 245 | +8.269 | +8.866 | +0.597 |
| All-window team: Gold Coast | 226 | -6.216 | -6.566 | +0.351 |
| All-window team: GWS Giants | 243 | +5.563 | +5.763 | +0.200 |
| All-window team: Hawthorn | 234 | +2.747 | +2.708 | -0.039 |
| All-window team: Melbourne | 235 | +1.498 | +1.287 | -0.211 |
| All-window team: North Melbourne | 225 | -5.962 | -5.879 | -0.082 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.124 | +0.066 |
| All-window team: Richmond | 233 | -3.519 | -3.417 | -0.102 |
| All-window team: St Kilda | 225 | -3.303 | -3.668 | +0.365 |
| All-window team: Sydney | 239 | +4.915 | +4.549 | -0.366 |
| All-window team: West Coast | 232 | -7.358 | -7.089 | -0.269 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.441 | -0.390 |
| All-window venue: Accor Stadium | 2 | -31.221 | -31.246 | +0.024 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.686 | -0.042 |
| All-window venue: Barossa Park | 7 | -2.214 | -1.835 | -0.379 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.696 | +0.309 |
| All-window venue: Carrara | 96 | -1.646 | -1.989 | +0.343 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.048 | -0.695 |
| All-window venue: Domain Stadium | 23 | +3.387 | +2.919 | -0.468 |
| All-window venue: Gabba | 118 | -1.488 | -1.575 | +0.087 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.716 | +0.404 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.467 | 0.000 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.933 | +0.602 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.196 | +0.128 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.041 | -0.361 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -4.039 | +0.089 |
| All-window venue: MCG | 498 | -2.821 | -2.810 | -0.011 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.511 | +0.240 |
| All-window venue: Norwood Oval | 8 | +0.763 | +1.361 | +0.598 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.495 | -0.231 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.101 | -0.712 |
| All-window venue: SCG | 116 | +4.062 | +3.511 | -0.551 |
| All-window venue: Subiaco | 22 | -0.789 | -0.605 | -0.184 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.845 | +0.180 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.256 | -0.030 |
| All-window venue: Traeger Park | 9 | -18.905 | -19.018 | +0.113 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.963 | -0.024 |

</details>

<details><summary>t40-age-r4: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.365 | +0.003 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.781 | +0.012 |
| Historical team: Carlton | 205 | -0.825 | -0.780 | -0.044 |
| Historical team: Collingwood | 215 | +1.878 | +1.925 | +0.047 |
| Historical team: Essendon | 204 | -5.111 | -5.124 | +0.013 |
| Historical team: Fremantle | 204 | -3.834 | -3.873 | +0.039 |
| Historical team: Geelong | 221 | +8.678 | +8.799 | +0.120 |
| Historical team: Gold Coast | 203 | -5.939 | -6.073 | +0.134 |
| Historical team: GWS Giants | 220 | +6.445 | +6.443 | -0.002 |
| Historical team: Hawthorn | 210 | +2.662 | +2.692 | +0.030 |
| Historical team: Melbourne | 211 | +0.901 | +0.837 | -0.063 |
| Historical team: North Melbourne | 202 | -6.038 | -5.992 | -0.045 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.316 | -0.016 |
| Historical team: Richmond | 210 | -2.404 | -2.330 | -0.074 |
| Historical team: St Kilda | 202 | -3.956 | -4.000 | +0.044 |
| Historical team: Sydney | 216 | +3.567 | +3.501 | -0.066 |
| Historical team: West Coast | 209 | -7.765 | -7.636 | -0.129 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.990 | -0.111 |
| All-window team: Adelaide | 231 | +6.348 | +6.350 | +0.002 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.237 | +0.026 |
| All-window team: Carlton | 230 | +0.315 | +0.365 | +0.050 |
| All-window team: Collingwood | 239 | +1.113 | +1.185 | +0.072 |
| All-window team: Essendon | 227 | -5.785 | -5.797 | +0.012 |
| All-window team: Fremantle | 228 | -2.838 | -2.893 | +0.055 |
| All-window team: Geelong | 245 | +8.269 | +8.388 | +0.119 |
| All-window team: Gold Coast | 226 | -6.216 | -6.341 | +0.125 |
| All-window team: GWS Giants | 243 | +5.563 | +5.560 | -0.003 |
| All-window team: Hawthorn | 234 | +2.747 | +2.771 | +0.024 |
| All-window team: Melbourne | 235 | +1.498 | +1.450 | -0.048 |
| All-window team: North Melbourne | 225 | -5.962 | -5.932 | -0.029 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.050 | -0.009 |
| All-window team: Richmond | 233 | -3.519 | -3.454 | -0.065 |
| All-window team: St Kilda | 225 | -3.303 | -3.361 | +0.058 |
| All-window team: Sydney | 239 | +4.915 | +4.860 | -0.055 |
| All-window team: West Coast | 232 | -7.358 | -7.241 | -0.117 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.733 | -0.098 |
| All-window venue: Accor Stadium | 2 | -31.221 | -31.172 | -0.049 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.720 | -0.007 |
| All-window venue: Barossa Park | 7 | -2.214 | -2.149 | -0.065 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.529 | +0.141 |
| All-window venue: Carrara | 96 | -1.646 | -1.757 | +0.111 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.610 | -0.134 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.427 | +0.041 |
| All-window venue: Gabba | 118 | -1.488 | -1.525 | +0.037 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.313 | 0.000 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.467 | 0.000 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.436 | +0.105 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.097 | +0.028 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.393 | -0.009 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.964 | +0.013 |
| All-window venue: MCG | 498 | -2.821 | -2.796 | -0.026 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.211 | -0.059 |
| All-window venue: Norwood Oval | 8 | +0.763 | +1.116 | +0.353 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.722 | -0.004 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.814 | 0.000 |
| All-window venue: SCG | 116 | +4.062 | +4.011 | -0.051 |
| All-window venue: Subiaco | 22 | -0.789 | -0.629 | -0.160 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.707 | +0.041 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.287 | 0.000 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.905 | 0.000 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.950 | -0.037 |

</details>

<details><summary>t40-age-zone: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.300 | -0.063 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.562 | -0.207 |
| Historical team: Carlton | 205 | -0.825 | -0.933 | +0.108 |
| Historical team: Collingwood | 215 | +1.878 | +2.176 | +0.299 |
| Historical team: Essendon | 204 | -5.111 | -5.431 | +0.320 |
| Historical team: Fremantle | 204 | -3.834 | -4.082 | +0.248 |
| Historical team: Geelong | 221 | +8.678 | +9.484 | +0.805 |
| Historical team: Gold Coast | 203 | -5.939 | -6.523 | +0.584 |
| Historical team: GWS Giants | 220 | +6.445 | +6.400 | -0.046 |
| Historical team: Hawthorn | 210 | +2.662 | +2.788 | +0.126 |
| Historical team: Melbourne | 211 | +0.901 | +0.787 | -0.113 |
| Historical team: North Melbourne | 202 | -6.038 | -5.975 | -0.062 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.428 | +0.097 |
| Historical team: Richmond | 210 | -2.404 | -2.120 | -0.284 |
| Historical team: St Kilda | 202 | -3.956 | -4.124 | +0.168 |
| Historical team: Sydney | 216 | +3.567 | +3.319 | -0.248 |
| Historical team: West Coast | 209 | -7.765 | -7.579 | -0.186 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.845 | -0.256 |
| All-window team: Adelaide | 231 | +6.348 | +6.305 | -0.043 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.031 | -0.179 |
| All-window team: Carlton | 230 | +0.315 | +0.202 | -0.113 |
| All-window team: Collingwood | 239 | +1.113 | +1.523 | +0.410 |
| All-window team: Essendon | 227 | -5.785 | -6.132 | +0.347 |
| All-window team: Fremantle | 228 | -2.838 | -3.125 | +0.287 |
| All-window team: Geelong | 245 | +8.269 | +9.080 | +0.811 |
| All-window team: Gold Coast | 226 | -6.216 | -6.742 | +0.526 |
| All-window team: GWS Giants | 243 | +5.563 | +5.515 | -0.048 |
| All-window team: Hawthorn | 234 | +2.747 | +2.845 | +0.098 |
| All-window team: Melbourne | 235 | +1.498 | +1.433 | -0.066 |
| All-window team: North Melbourne | 225 | -5.962 | -5.924 | -0.037 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.100 | +0.041 |
| All-window team: Richmond | 233 | -3.519 | -3.294 | -0.224 |
| All-window team: St Kilda | 225 | -3.303 | -3.462 | +0.158 |
| All-window team: Sydney | 239 | +4.915 | +4.727 | -0.188 |
| All-window team: West Coast | 232 | -7.358 | -7.270 | -0.088 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.632 | -0.199 |
| All-window venue: Accor Stadium | 2 | -31.221 | -31.140 | -0.081 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.784 | +0.056 |
| All-window venue: Barossa Park | 7 | -2.214 | -2.166 | -0.048 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.728 | +0.340 |
| All-window venue: Carrara | 96 | -1.646 | -2.174 | +0.528 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.457 | -0.286 |
| All-window venue: Domain Stadium | 23 | +3.387 | +4.028 | +0.641 |
| All-window venue: Gabba | 118 | -1.488 | -1.345 | -0.143 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.261 | -0.051 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.467 | 0.000 |
| All-window venue: Kardinia Park | 91 | +15.331 | +16.178 | +0.847 |
| All-window venue: Manuka Oval | 30 | +3.068 | +2.985 | -0.083 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.329 | -0.072 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -4.031 | +0.081 |
| All-window venue: MCG | 498 | -2.821 | -2.751 | -0.070 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.390 | +0.119 |
| All-window venue: Norwood Oval | 8 | +0.763 | +1.232 | +0.468 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.902 | +0.177 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.939 | +0.126 |
| All-window venue: SCG | 116 | +4.062 | +3.867 | -0.195 |
| All-window venue: Subiaco | 22 | -0.789 | -0.276 | -0.513 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.738 | +0.072 |
| All-window venue: TIO Stadium | 14 | +22.287 | +21.992 | -0.295 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.901 | -0.003 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +5.126 | +0.138 |

</details>

<details><summary>t40-cdf: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.363 | 0.000 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.769 | 0.000 |
| Historical team: Carlton | 205 | -0.825 | -0.825 | 0.000 |
| Historical team: Collingwood | 215 | +1.878 | +1.878 | 0.000 |
| Historical team: Essendon | 204 | -5.111 | -5.111 | 0.000 |
| Historical team: Fremantle | 204 | -3.834 | -3.834 | 0.000 |
| Historical team: Geelong | 221 | +8.678 | +8.678 | 0.000 |
| Historical team: Gold Coast | 203 | -5.939 | -5.939 | 0.000 |
| Historical team: GWS Giants | 220 | +6.445 | +6.445 | 0.000 |
| Historical team: Hawthorn | 210 | +2.662 | +2.662 | 0.000 |
| Historical team: Melbourne | 211 | +0.901 | +0.901 | 0.000 |
| Historical team: North Melbourne | 202 | -6.038 | -6.038 | 0.000 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.331 | 0.000 |
| Historical team: Richmond | 210 | -2.404 | -2.404 | 0.000 |
| Historical team: St Kilda | 202 | -3.956 | -3.956 | 0.000 |
| Historical team: Sydney | 216 | +3.567 | +3.567 | 0.000 |
| Historical team: West Coast | 209 | -7.765 | -7.765 | 0.000 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.101 | 0.000 |
| All-window team: Adelaide | 231 | +6.348 | +6.348 | 0.000 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.211 | 0.000 |
| All-window team: Carlton | 230 | +0.315 | +0.315 | 0.000 |
| All-window team: Collingwood | 239 | +1.113 | +1.113 | 0.000 |
| All-window team: Essendon | 227 | -5.785 | -5.785 | 0.000 |
| All-window team: Fremantle | 228 | -2.838 | -2.838 | 0.000 |
| All-window team: Geelong | 245 | +8.269 | +8.269 | 0.000 |
| All-window team: Gold Coast | 226 | -6.216 | -6.216 | 0.000 |
| All-window team: GWS Giants | 243 | +5.563 | +5.563 | 0.000 |
| All-window team: Hawthorn | 234 | +2.747 | +2.747 | 0.000 |
| All-window team: Melbourne | 235 | +1.498 | +1.498 | 0.000 |
| All-window team: North Melbourne | 225 | -5.962 | -5.962 | 0.000 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.059 | 0.000 |
| All-window team: Richmond | 233 | -3.519 | -3.519 | 0.000 |
| All-window team: St Kilda | 225 | -3.303 | -3.303 | 0.000 |
| All-window team: Sydney | 239 | +4.915 | +4.915 | 0.000 |
| All-window team: West Coast | 232 | -7.358 | -7.358 | 0.000 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.831 | 0.000 |
| All-window venue: Accor Stadium | 2 | -31.221 | -31.221 | 0.000 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.728 | 0.000 |
| All-window venue: Barossa Park | 7 | -2.214 | -2.214 | 0.000 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.388 | 0.000 |
| All-window venue: Carrara | 96 | -1.646 | -1.646 | 0.000 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.743 | 0.000 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.387 | 0.000 |
| All-window venue: Gabba | 118 | -1.488 | -1.488 | 0.000 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.313 | 0.000 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.467 | 0.000 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.331 | 0.000 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.068 | 0.000 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.402 | 0.000 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.950 | 0.000 |
| All-window venue: MCG | 498 | -2.821 | -2.821 | 0.000 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.270 | 0.000 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.763 | 0.000 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.725 | 0.000 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.814 | 0.000 |
| All-window venue: SCG | 116 | +4.062 | +4.062 | 0.000 |
| All-window venue: Subiaco | 22 | -0.789 | -0.789 | 0.000 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.666 | 0.000 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.287 | 0.000 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.905 | 0.000 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.987 | 0.000 |

</details>

<details><summary>t40-derived: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +2.772 | -3.590 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.088 | -0.681 |
| Historical team: Carlton | 205 | -0.825 | -0.671 | -0.153 |
| Historical team: Collingwood | 215 | +1.878 | +1.743 | -0.135 |
| Historical team: Essendon | 204 | -5.111 | -2.472 | -2.640 |
| Historical team: Fremantle | 204 | -3.834 | -2.616 | -1.218 |
| Historical team: Geelong | 221 | +8.678 | +5.205 | -3.473 |
| Historical team: Gold Coast | 203 | -5.939 | -4.018 | -1.921 |
| Historical team: GWS Giants | 220 | +6.445 | +4.823 | -1.622 |
| Historical team: Hawthorn | 210 | +2.662 | +1.877 | -0.785 |
| Historical team: Melbourne | 211 | +0.901 | +0.195 | -0.705 |
| Historical team: North Melbourne | 202 | -6.038 | -4.673 | -1.365 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.362 | +0.031 |
| Historical team: Richmond | 210 | -2.404 | -0.664 | -1.740 |
| Historical team: St Kilda | 202 | -3.956 | -2.690 | -1.266 |
| Historical team: Sydney | 216 | +3.567 | +2.156 | -1.411 |
| Historical team: West Coast | 209 | -7.765 | -4.532 | -3.233 |
| Historical team: Western Bulldogs | 212 | +5.101 | +3.844 | -1.257 |
| All-window team: Adelaide | 231 | +6.348 | +3.089 | -3.259 |
| All-window team: Brisbane Lions | 242 | -1.211 | -0.575 | -0.635 |
| All-window team: Carlton | 230 | +0.315 | +0.394 | +0.080 |
| All-window team: Collingwood | 239 | +1.113 | +1.215 | +0.103 |
| All-window team: Essendon | 227 | -5.785 | -2.901 | -2.884 |
| All-window team: Fremantle | 228 | -2.838 | -2.026 | -0.811 |
| All-window team: Geelong | 245 | +8.269 | +4.909 | -3.360 |
| All-window team: Gold Coast | 226 | -6.216 | -4.390 | -1.826 |
| All-window team: GWS Giants | 243 | +5.563 | +4.330 | -1.234 |
| All-window team: Hawthorn | 234 | +2.747 | +1.948 | -0.799 |
| All-window team: Melbourne | 235 | +1.498 | +0.478 | -1.020 |
| All-window team: North Melbourne | 225 | -5.962 | -4.727 | -1.235 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.577 | +0.518 |
| All-window team: Richmond | 233 | -3.519 | -1.400 | -2.119 |
| All-window team: St Kilda | 225 | -3.303 | -2.575 | -0.729 |
| All-window team: Sydney | 239 | +4.915 | +3.170 | -1.745 |
| All-window team: West Coast | 232 | -7.358 | -4.285 | -3.073 |
| All-window team: Western Bulldogs | 236 | +3.831 | +2.855 | -0.976 |
| All-window venue: Accor Stadium | 2 | -31.221 | -33.290 | +2.069 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +3.954 | -1.774 |
| All-window venue: Barossa Park | 7 | -2.214 | +1.836 | -0.378 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +18.153 | -1.234 |
| All-window venue: Carrara | 96 | -1.646 | -0.203 | -1.443 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +9.944 | +1.201 |
| All-window venue: Domain Stadium | 23 | +3.387 | +2.266 | -1.121 |
| All-window venue: Gabba | 118 | -1.488 | -0.912 | -0.575 |
| All-window venue: Hands Oval | 2 | -53.313 | -56.384 | +3.071 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -51.971 | -5.496 |
| All-window venue: Kardinia Park | 91 | +15.331 | +11.955 | -3.375 |
| All-window venue: Manuka Oval | 30 | +3.068 | +1.993 | -1.075 |
| All-window venue: Mars Stadium | 15 | +9.402 | +7.613 | -1.788 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.766 | -0.184 |
| All-window venue: MCG | 498 | -2.821 | -2.254 | -0.567 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -0.793 | -3.477 |
| All-window venue: Norwood Oval | 8 | +0.763 | -1.762 | +0.998 |
| All-window venue: Perth Stadium | 188 | -2.725 | -0.726 | -2.000 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -2.308 | +1.494 |
| All-window venue: SCG | 116 | +4.062 | +2.189 | -1.874 |
| All-window venue: Subiaco | 22 | -0.789 | +1.858 | +1.069 |
| All-window venue: Sydney Showground | 81 | +11.666 | +10.297 | -1.368 |
| All-window venue: TIO Stadium | 14 | +22.287 | +21.956 | -0.330 |
| All-window venue: Traeger Park | 9 | -18.905 | -19.211 | +0.306 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +3.985 | -1.002 |

</details>

<details><summary>t40-finals-both: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.531 | +0.168 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.925 | +0.156 |
| Historical team: Carlton | 205 | -0.825 | -0.885 | +0.061 |
| Historical team: Collingwood | 215 | +1.878 | +1.730 | -0.148 |
| Historical team: Essendon | 204 | -5.111 | -5.139 | +0.028 |
| Historical team: Fremantle | 204 | -3.834 | -3.790 | -0.045 |
| Historical team: Geelong | 221 | +8.678 | +8.861 | +0.182 |
| Historical team: Gold Coast | 203 | -5.939 | -5.976 | +0.037 |
| Historical team: GWS Giants | 220 | +6.445 | +6.102 | -0.344 |
| Historical team: Hawthorn | 210 | +2.662 | +2.595 | -0.067 |
| Historical team: Melbourne | 211 | +0.901 | +1.049 | +0.148 |
| Historical team: North Melbourne | 202 | -6.038 | -6.027 | -0.010 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.701 | +0.370 |
| Historical team: Richmond | 210 | -2.404 | -2.516 | +0.112 |
| Historical team: St Kilda | 202 | -3.956 | -3.867 | -0.089 |
| Historical team: Sydney | 216 | +3.567 | +3.889 | +0.322 |
| Historical team: West Coast | 209 | -7.765 | -7.687 | -0.079 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.658 | -0.443 |
| All-window team: Adelaide | 231 | +6.348 | +6.606 | +0.258 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.457 | +0.246 |
| All-window team: Carlton | 230 | +0.315 | +0.210 | -0.104 |
| All-window team: Collingwood | 239 | +1.113 | +0.955 | -0.158 |
| All-window team: Essendon | 227 | -5.785 | -5.803 | +0.018 |
| All-window team: Fremantle | 228 | -2.838 | -2.762 | -0.076 |
| All-window team: Geelong | 245 | +8.269 | +8.443 | +0.174 |
| All-window team: Gold Coast | 226 | -6.216 | -6.252 | +0.037 |
| All-window team: GWS Giants | 243 | +5.563 | +5.289 | -0.274 |
| All-window team: Hawthorn | 234 | +2.747 | +2.617 | -0.130 |
| All-window team: Melbourne | 235 | +1.498 | +1.656 | +0.158 |
| All-window team: North Melbourne | 225 | -5.962 | -5.950 | -0.012 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.397 | +0.338 |
| All-window team: Richmond | 233 | -3.519 | -3.621 | +0.102 |
| All-window team: St Kilda | 225 | -3.303 | -3.227 | -0.077 |
| All-window team: Sydney | 239 | +4.915 | +5.199 | +0.285 |
| All-window team: West Coast | 232 | -7.358 | -7.285 | -0.073 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.468 | -0.363 |
| All-window venue: Accor Stadium | 2 | -31.221 | -28.462 | -2.759 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +6.188 | +0.461 |
| All-window venue: Barossa Park | 7 | -2.214 | -1.771 | -0.443 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.461 | +0.073 |
| All-window venue: Carrara | 96 | -1.646 | -1.647 | +0.001 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.377 | -0.366 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.630 | +0.243 |
| All-window venue: Gabba | 118 | -1.488 | -1.285 | -0.203 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.287 | -0.026 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.521 | +0.054 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.227 | -0.104 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.029 | -0.039 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.243 | -0.159 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.985 | +0.035 |
| All-window venue: MCG | 498 | -2.821 | -2.337 | -0.484 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.257 | -0.013 |
| All-window venue: Norwood Oval | 8 | +0.763 | +1.008 | +0.244 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.444 | -0.281 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.760 | -0.054 |
| All-window venue: SCG | 116 | +4.062 | +4.525 | +0.463 |
| All-window venue: Subiaco | 22 | -0.789 | -0.317 | -0.473 |
| All-window venue: Sydney Showground | 81 | +11.666 | +12.006 | +0.340 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.205 | -0.082 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.889 | -0.016 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +5.225 | +0.237 |

</details>

<details><summary>t40-finals-ha: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.497 | +0.135 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.820 | +0.051 |
| Historical team: Carlton | 205 | -0.825 | -0.879 | +0.055 |
| Historical team: Collingwood | 215 | +1.878 | +1.878 | 0.000 |
| Historical team: Essendon | 204 | -5.111 | -5.194 | +0.082 |
| Historical team: Fremantle | 204 | -3.834 | -3.807 | -0.027 |
| Historical team: Geelong | 221 | +8.678 | +8.881 | +0.203 |
| Historical team: Gold Coast | 203 | -5.939 | -5.994 | +0.055 |
| Historical team: GWS Giants | 220 | +6.445 | +6.216 | -0.229 |
| Historical team: Hawthorn | 210 | +2.662 | +2.529 | -0.133 |
| Historical team: Melbourne | 211 | +0.901 | +1.007 | +0.106 |
| Historical team: North Melbourne | 202 | -6.038 | -6.065 | +0.028 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.439 | +0.107 |
| Historical team: Richmond | 210 | -2.404 | -2.378 | -0.027 |
| Historical team: St Kilda | 202 | -3.956 | -3.928 | -0.028 |
| Historical team: Sydney | 216 | +3.567 | +3.697 | +0.130 |
| Historical team: West Coast | 209 | -7.765 | -7.711 | -0.054 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.916 | -0.185 |
| All-window team: Adelaide | 231 | +6.348 | +6.469 | +0.121 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.257 | +0.046 |
| All-window team: Carlton | 230 | +0.315 | +0.217 | -0.097 |
| All-window team: Collingwood | 239 | +1.113 | +1.089 | -0.023 |
| All-window team: Essendon | 227 | -5.785 | -5.859 | +0.074 |
| All-window team: Fremantle | 228 | -2.838 | -2.789 | -0.049 |
| All-window team: Geelong | 245 | +8.269 | +8.475 | +0.206 |
| All-window team: Gold Coast | 226 | -6.216 | -6.265 | +0.050 |
| All-window team: GWS Giants | 243 | +5.563 | +5.356 | -0.207 |
| All-window team: Hawthorn | 234 | +2.747 | +2.603 | -0.144 |
| All-window team: Melbourne | 235 | +1.498 | +1.617 | +0.119 |
| All-window team: North Melbourne | 225 | -5.962 | -5.987 | +0.025 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.155 | +0.097 |
| All-window team: Richmond | 233 | -3.519 | -3.495 | -0.024 |
| All-window team: St Kilda | 225 | -3.303 | -3.279 | -0.025 |
| All-window team: Sydney | 239 | +4.915 | +5.032 | +0.117 |
| All-window team: West Coast | 232 | -7.358 | -7.310 | -0.048 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.688 | -0.142 |
| All-window venue: Accor Stadium | 2 | -31.221 | -28.421 | -2.800 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.995 | +0.268 |
| All-window venue: Barossa Park | 7 | -2.214 | -2.214 | 0.000 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.388 | 0.000 |
| All-window venue: Carrara | 96 | -1.646 | -1.646 | 0.000 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.743 | 0.000 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.630 | +0.243 |
| All-window venue: Gabba | 118 | -1.488 | -1.108 | -0.380 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.313 | 0.000 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.467 | 0.000 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.331 | 0.000 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.068 | 0.000 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.402 | 0.000 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.950 | 0.000 |
| All-window venue: MCG | 498 | -2.821 | -2.360 | -0.461 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.270 | 0.000 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.763 | 0.000 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.457 | -0.268 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.814 | 0.000 |
| All-window venue: SCG | 116 | +4.062 | +4.352 | +0.290 |
| All-window venue: Subiaco | 22 | -0.789 | -0.789 | 0.000 |
| All-window venue: Sydney Showground | 81 | +11.666 | +12.011 | +0.346 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.287 | 0.000 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.905 | 0.000 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +5.242 | +0.255 |

</details>

<details><summary>t40-finals-k: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.396 | +0.034 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.874 | +0.105 |
| Historical team: Carlton | 205 | -0.825 | -0.831 | +0.006 |
| Historical team: Collingwood | 215 | +1.878 | +1.730 | -0.148 |
| Historical team: Essendon | 204 | -5.111 | -5.057 | -0.055 |
| Historical team: Fremantle | 204 | -3.834 | -3.817 | -0.017 |
| Historical team: Geelong | 221 | +8.678 | +8.658 | -0.021 |
| Historical team: Gold Coast | 203 | -5.939 | -5.921 | -0.018 |
| Historical team: GWS Giants | 220 | +6.445 | +6.331 | -0.114 |
| Historical team: Hawthorn | 210 | +2.662 | +2.728 | +0.066 |
| Historical team: Melbourne | 211 | +0.901 | +0.943 | +0.042 |
| Historical team: North Melbourne | 202 | -6.038 | -6.000 | -0.038 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.594 | +0.262 |
| Historical team: Richmond | 210 | -2.404 | -2.543 | +0.138 |
| Historical team: St Kilda | 202 | -3.956 | -3.895 | -0.061 |
| Historical team: Sydney | 216 | +3.567 | +3.759 | +0.192 |
| Historical team: West Coast | 209 | -7.765 | -7.740 | -0.025 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.843 | -0.258 |
| All-window team: Adelaide | 231 | +6.348 | +6.485 | +0.137 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.411 | +0.200 |
| All-window team: Carlton | 230 | +0.315 | +0.308 | -0.007 |
| All-window team: Collingwood | 239 | +1.113 | +0.978 | -0.135 |
| All-window team: Essendon | 227 | -5.785 | -5.729 | -0.056 |
| All-window team: Fremantle | 228 | -2.838 | -2.811 | -0.027 |
| All-window team: Geelong | 245 | +8.269 | +8.238 | -0.031 |
| All-window team: Gold Coast | 226 | -6.216 | -6.203 | -0.013 |
| All-window team: GWS Giants | 243 | +5.563 | +5.497 | -0.066 |
| All-window team: Hawthorn | 234 | +2.747 | +2.761 | +0.014 |
| All-window team: Melbourne | 235 | +1.498 | +1.537 | +0.039 |
| All-window team: North Melbourne | 225 | -5.962 | -5.925 | -0.036 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.300 | +0.241 |
| All-window team: Richmond | 233 | -3.519 | -3.645 | +0.126 |
| All-window team: St Kilda | 225 | -3.303 | -3.252 | -0.052 |
| All-window team: Sydney | 239 | +4.915 | +5.082 | +0.167 |
| All-window team: West Coast | 232 | -7.358 | -7.333 | -0.025 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.610 | -0.221 |
| All-window venue: Accor Stadium | 2 | -31.221 | -31.262 | +0.041 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.921 | +0.193 |
| All-window venue: Barossa Park | 7 | -2.214 | -1.771 | -0.443 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.461 | +0.073 |
| All-window venue: Carrara | 96 | -1.646 | -1.647 | +0.001 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.377 | -0.366 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.387 | 0.000 |
| All-window venue: Gabba | 118 | -1.488 | -1.665 | +0.177 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.287 | -0.026 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.521 | +0.054 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.227 | -0.104 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.029 | -0.039 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.243 | -0.159 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.985 | +0.035 |
| All-window venue: MCG | 498 | -2.821 | -2.798 | -0.023 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.257 | -0.013 |
| All-window venue: Norwood Oval | 8 | +0.763 | +1.008 | +0.244 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.712 | -0.013 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.760 | -0.054 |
| All-window venue: SCG | 116 | +4.062 | +4.236 | +0.173 |
| All-window venue: Subiaco | 22 | -0.789 | -0.317 | -0.473 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.660 | -0.005 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.205 | -0.082 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.889 | -0.016 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.970 | -0.017 |

</details>

<details><summary>t40-ha-070: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.390 | +0.027 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.772 | +0.003 |
| Historical team: Carlton | 205 | -0.825 | -0.835 | +0.010 |
| Historical team: Collingwood | 215 | +1.878 | +1.888 | +0.010 |
| Historical team: Essendon | 204 | -5.111 | -5.125 | +0.014 |
| Historical team: Fremantle | 204 | -3.834 | -3.827 | -0.007 |
| Historical team: Geelong | 221 | +8.678 | +8.701 | +0.022 |
| Historical team: Gold Coast | 203 | -5.939 | -5.950 | +0.010 |
| Historical team: GWS Giants | 220 | +6.445 | +6.414 | -0.032 |
| Historical team: Hawthorn | 210 | +2.662 | +2.636 | -0.027 |
| Historical team: Melbourne | 211 | +0.901 | +0.911 | +0.010 |
| Historical team: North Melbourne | 202 | -6.038 | -6.045 | +0.007 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.355 | +0.023 |
| Historical team: Richmond | 210 | -2.404 | -2.391 | -0.013 |
| Historical team: St Kilda | 202 | -3.956 | -3.956 | +0.000 |
| Historical team: Sydney | 216 | +3.567 | +3.573 | +0.006 |
| Historical team: West Coast | 209 | -7.765 | -7.762 | -0.003 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.081 | -0.020 |
| All-window team: Adelaide | 231 | +6.348 | +6.375 | +0.027 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.217 | +0.006 |
| All-window team: Carlton | 230 | +0.315 | +0.296 | -0.018 |
| All-window team: Collingwood | 239 | +1.113 | +1.122 | +0.009 |
| All-window team: Essendon | 227 | -5.785 | -5.794 | +0.009 |
| All-window team: Fremantle | 228 | -2.838 | -2.832 | -0.006 |
| All-window team: Geelong | 245 | +8.269 | +8.295 | +0.026 |
| All-window team: Gold Coast | 226 | -6.216 | -6.228 | +0.012 |
| All-window team: GWS Giants | 243 | +5.563 | +5.537 | -0.026 |
| All-window team: Hawthorn | 234 | +2.747 | +2.723 | -0.024 |
| All-window team: Melbourne | 235 | +1.498 | +1.507 | +0.009 |
| All-window team: North Melbourne | 225 | -5.962 | -5.965 | +0.003 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.083 | +0.024 |
| All-window team: Richmond | 233 | -3.519 | -3.510 | -0.009 |
| All-window team: St Kilda | 225 | -3.303 | -3.307 | +0.003 |
| All-window team: Sydney | 239 | +4.915 | +4.923 | +0.009 |
| All-window team: West Coast | 232 | -7.358 | -7.358 | -0.000 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.813 | -0.018 |
| All-window venue: Accor Stadium | 2 | -31.221 | -30.521 | -0.700 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +6.428 | +0.700 |
| All-window venue: Barossa Park | 7 | -2.214 | -1.514 | -0.700 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +20.088 | +0.700 |
| All-window venue: Carrara | 96 | -1.646 | -0.946 | -0.700 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +9.443 | +0.700 |
| All-window venue: Domain Stadium | 23 | +3.387 | +4.087 | +0.700 |
| All-window venue: Gabba | 118 | -1.488 | -0.788 | -0.700 |
| All-window venue: Hands Oval | 2 | -53.313 | -52.613 | -0.700 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -56.767 | -0.700 |
| All-window venue: Kardinia Park | 91 | +15.331 | +16.031 | +0.700 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.768 | +0.700 |
| All-window venue: Mars Stadium | 15 | +9.402 | +10.102 | +0.700 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.250 | -0.700 |
| All-window venue: MCG | 498 | -2.821 | -2.121 | -0.700 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -3.570 | -0.700 |
| All-window venue: Norwood Oval | 8 | +0.763 | +1.463 | +0.700 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.025 | -0.700 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.114 | -0.700 |
| All-window venue: SCG | 116 | +4.062 | +4.762 | +0.700 |
| All-window venue: Subiaco | 22 | -0.789 | -0.089 | -0.700 |
| All-window venue: Sydney Showground | 81 | +11.666 | +12.366 | +0.700 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.987 | +0.700 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.205 | -0.700 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +5.687 | +0.700 |

</details>

<details><summary>t40-ha-090: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.336 | -0.027 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.766 | -0.003 |
| Historical team: Carlton | 205 | -0.825 | -0.814 | -0.010 |
| Historical team: Collingwood | 215 | +1.878 | +1.868 | -0.010 |
| Historical team: Essendon | 204 | -5.111 | -5.098 | -0.014 |
| Historical team: Fremantle | 204 | -3.834 | -3.841 | +0.007 |
| Historical team: Geelong | 221 | +8.678 | +8.656 | -0.022 |
| Historical team: Gold Coast | 203 | -5.939 | -5.929 | -0.010 |
| Historical team: GWS Giants | 220 | +6.445 | +6.477 | +0.032 |
| Historical team: Hawthorn | 210 | +2.662 | +2.689 | +0.027 |
| Historical team: Melbourne | 211 | +0.901 | +0.891 | -0.010 |
| Historical team: North Melbourne | 202 | -6.038 | -6.031 | -0.007 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.308 | -0.023 |
| Historical team: Richmond | 210 | -2.404 | -2.418 | +0.013 |
| Historical team: St Kilda | 202 | -3.956 | -3.956 | +0.000 |
| Historical team: Sydney | 216 | +3.567 | +3.561 | -0.006 |
| Historical team: West Coast | 209 | -7.765 | -7.768 | +0.003 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.121 | +0.020 |
| All-window team: Adelaide | 231 | +6.348 | +6.321 | -0.027 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.205 | -0.006 |
| All-window team: Carlton | 230 | +0.315 | +0.333 | +0.018 |
| All-window team: Collingwood | 239 | +1.113 | +1.104 | -0.009 |
| All-window team: Essendon | 227 | -5.785 | -5.775 | -0.009 |
| All-window team: Fremantle | 228 | -2.838 | -2.844 | +0.006 |
| All-window team: Geelong | 245 | +8.269 | +8.243 | -0.026 |
| All-window team: Gold Coast | 226 | -6.216 | -6.203 | -0.012 |
| All-window team: GWS Giants | 243 | +5.563 | +5.589 | +0.026 |
| All-window team: Hawthorn | 234 | +2.747 | +2.771 | +0.024 |
| All-window team: Melbourne | 235 | +1.498 | +1.489 | -0.009 |
| All-window team: North Melbourne | 225 | -5.962 | -5.959 | -0.003 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.035 | -0.024 |
| All-window team: Richmond | 233 | -3.519 | -3.528 | +0.009 |
| All-window team: St Kilda | 225 | -3.303 | -3.300 | -0.003 |
| All-window team: Sydney | 239 | +4.915 | +4.906 | -0.009 |
| All-window team: West Coast | 232 | -7.358 | -7.358 | -0.000 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.849 | +0.018 |
| All-window venue: Accor Stadium | 2 | -31.221 | -31.921 | +0.700 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.028 | -0.700 |
| All-window venue: Barossa Park | 7 | -2.214 | -2.914 | +0.700 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +18.688 | -0.700 |
| All-window venue: Carrara | 96 | -1.646 | -2.346 | +0.700 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.043 | -0.700 |
| All-window venue: Domain Stadium | 23 | +3.387 | +2.687 | -0.700 |
| All-window venue: Gabba | 118 | -1.488 | -2.188 | +0.700 |
| All-window venue: Hands Oval | 2 | -53.313 | -54.013 | +0.700 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -58.167 | +0.700 |
| All-window venue: Kardinia Park | 91 | +15.331 | +14.631 | -0.700 |
| All-window venue: Manuka Oval | 30 | +3.068 | +2.368 | -0.700 |
| All-window venue: Mars Stadium | 15 | +9.402 | +8.702 | -0.700 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -4.650 | +0.700 |
| All-window venue: MCG | 498 | -2.821 | -3.521 | +0.700 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.970 | +0.700 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.063 | -0.700 |
| All-window venue: Perth Stadium | 188 | -2.725 | -3.425 | +0.700 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -1.514 | +0.700 |
| All-window venue: SCG | 116 | +4.062 | +3.362 | -0.700 |
| All-window venue: Subiaco | 22 | -0.789 | -1.489 | +0.700 |
| All-window venue: Sydney Showground | 81 | +11.666 | +10.966 | -0.700 |
| All-window venue: TIO Stadium | 14 | +22.287 | +21.587 | -0.700 |
| All-window venue: Traeger Park | 9 | -18.905 | -19.605 | +0.700 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.287 | -0.700 |

</details>

<details><summary>t40-ha-100: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.309 | -0.054 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.763 | -0.006 |
| Historical team: Carlton | 205 | -0.825 | -0.804 | -0.020 |
| Historical team: Collingwood | 215 | +1.878 | +1.858 | -0.020 |
| Historical team: Essendon | 204 | -5.111 | -5.084 | -0.027 |
| Historical team: Fremantle | 204 | -3.834 | -3.848 | +0.014 |
| Historical team: Geelong | 221 | +8.678 | +8.634 | -0.044 |
| Historical team: Gold Coast | 203 | -5.939 | -5.918 | -0.021 |
| Historical team: GWS Giants | 220 | +6.445 | +6.509 | +0.064 |
| Historical team: Hawthorn | 210 | +2.662 | +2.716 | +0.053 |
| Historical team: Melbourne | 211 | +0.901 | +0.881 | -0.020 |
| Historical team: North Melbourne | 202 | -6.038 | -6.024 | -0.014 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.285 | -0.047 |
| Historical team: Richmond | 210 | -2.404 | -2.431 | +0.027 |
| Historical team: St Kilda | 202 | -3.956 | -3.956 | +0.000 |
| Historical team: Sydney | 216 | +3.567 | +3.554 | -0.013 |
| Historical team: West Coast | 209 | -7.765 | -7.772 | +0.007 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.141 | +0.040 |
| All-window team: Adelaide | 231 | +6.348 | +6.294 | -0.055 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.199 | -0.012 |
| All-window team: Carlton | 230 | +0.315 | +0.351 | +0.037 |
| All-window team: Collingwood | 239 | +1.113 | +1.095 | -0.018 |
| All-window team: Essendon | 227 | -5.785 | -5.766 | -0.019 |
| All-window team: Fremantle | 228 | -2.838 | -2.850 | +0.012 |
| All-window team: Geelong | 245 | +8.269 | +8.218 | -0.051 |
| All-window team: Gold Coast | 226 | -6.216 | -6.191 | -0.025 |
| All-window team: GWS Giants | 243 | +5.563 | +5.615 | +0.052 |
| All-window team: Hawthorn | 234 | +2.747 | +2.795 | +0.048 |
| All-window team: Melbourne | 235 | +1.498 | +1.480 | -0.018 |
| All-window team: North Melbourne | 225 | -5.962 | -5.955 | -0.006 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.010 | -0.048 |
| All-window team: Richmond | 233 | -3.519 | -3.537 | +0.018 |
| All-window team: St Kilda | 225 | -3.303 | -3.297 | -0.006 |
| All-window team: Sydney | 239 | +4.915 | +4.897 | -0.018 |
| All-window team: West Coast | 232 | -7.358 | -7.358 | -0.000 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.866 | +0.036 |
| All-window venue: Accor Stadium | 2 | -31.221 | -32.621 | +1.400 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +4.328 | -1.400 |
| All-window venue: Barossa Park | 7 | -2.214 | -3.614 | +1.400 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +17.988 | -1.400 |
| All-window venue: Carrara | 96 | -1.646 | -3.046 | +1.400 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +7.343 | -1.400 |
| All-window venue: Domain Stadium | 23 | +3.387 | +1.987 | -1.400 |
| All-window venue: Gabba | 118 | -1.488 | -2.888 | +1.400 |
| All-window venue: Hands Oval | 2 | -53.313 | -54.713 | +1.400 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -58.867 | +1.400 |
| All-window venue: Kardinia Park | 91 | +15.331 | +13.931 | -1.400 |
| All-window venue: Manuka Oval | 30 | +3.068 | +1.668 | -1.400 |
| All-window venue: Mars Stadium | 15 | +9.402 | +8.002 | -1.400 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -5.350 | +1.400 |
| All-window venue: MCG | 498 | -2.821 | -4.221 | +1.400 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -5.670 | +1.400 |
| All-window venue: Norwood Oval | 8 | +0.763 | -0.637 | -0.127 |
| All-window venue: Perth Stadium | 188 | -2.725 | -4.125 | +1.400 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -2.214 | +1.400 |
| All-window venue: SCG | 116 | +4.062 | +2.662 | -1.400 |
| All-window venue: Subiaco | 22 | -0.789 | -2.189 | +1.400 |
| All-window venue: Sydney Showground | 81 | +11.666 | +10.266 | -1.400 |
| All-window venue: TIO Stadium | 14 | +22.287 | +20.887 | -1.400 |
| All-window venue: Traeger Park | 9 | -18.905 | -20.305 | +1.400 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +3.587 | -1.400 |

</details>

<details><summary>t40-ha-bucket: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.117 | -0.246 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.951 | +0.182 |
| Historical team: Carlton | 205 | -0.825 | -0.661 | -0.164 |
| Historical team: Collingwood | 215 | +1.878 | +1.849 | -0.029 |
| Historical team: Essendon | 204 | -5.111 | -4.840 | -0.271 |
| Historical team: Fremantle | 204 | -3.834 | -4.088 | +0.254 |
| Historical team: Geelong | 221 | +8.678 | +8.156 | -0.523 |
| Historical team: Gold Coast | 203 | -5.939 | -5.832 | -0.107 |
| Historical team: GWS Giants | 220 | +6.445 | +6.709 | +0.264 |
| Historical team: Hawthorn | 210 | +2.662 | +2.309 | -0.353 |
| Historical team: Melbourne | 211 | +0.901 | +1.252 | +0.352 |
| Historical team: North Melbourne | 202 | -6.038 | -6.128 | +0.090 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.003 | -0.328 |
| Historical team: Richmond | 210 | -2.404 | -2.048 | -0.357 |
| Historical team: St Kilda | 202 | -3.956 | -3.498 | -0.457 |
| Historical team: Sydney | 216 | +3.567 | +3.629 | +0.062 |
| Historical team: West Coast | 209 | -7.765 | -7.926 | +0.161 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.269 | +0.168 |
| All-window team: Adelaide | 231 | +6.348 | +6.109 | -0.239 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.431 | +0.220 |
| All-window team: Carlton | 230 | +0.315 | +0.461 | +0.146 |
| All-window team: Collingwood | 239 | +1.113 | +1.092 | -0.021 |
| All-window team: Essendon | 227 | -5.785 | -5.526 | -0.259 |
| All-window team: Fremantle | 228 | -2.838 | -3.142 | +0.304 |
| All-window team: Geelong | 245 | +8.269 | +7.778 | -0.491 |
| All-window team: Gold Coast | 226 | -6.216 | -6.145 | -0.071 |
| All-window team: GWS Giants | 243 | +5.563 | +5.843 | +0.279 |
| All-window team: Hawthorn | 234 | +2.747 | +2.445 | -0.302 |
| All-window team: Melbourne | 235 | +1.498 | +1.835 | +0.337 |
| All-window team: North Melbourne | 225 | -5.962 | -5.921 | -0.040 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.255 | +0.196 |
| All-window team: Richmond | 233 | -3.519 | -3.197 | -0.321 |
| All-window team: St Kilda | 225 | -3.303 | -2.902 | -0.401 |
| All-window team: Sydney | 239 | +4.915 | +4.994 | +0.079 |
| All-window team: West Coast | 232 | -7.358 | -7.560 | +0.202 |
| All-window team: Western Bulldogs | 236 | +3.831 | +4.021 | +0.190 |
| All-window venue: Accor Stadium | 2 | -31.221 | -31.221 | 0.000 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +4.225 | -1.503 |
| All-window venue: Barossa Park | 7 | -2.214 | +3.386 | +1.172 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.388 | 0.000 |
| All-window venue: Carrara | 96 | -1.646 | -3.126 | +1.480 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +12.803 | +4.060 |
| All-window venue: Domain Stadium | 23 | +3.387 | +1.469 | -1.917 |
| All-window venue: Gabba | 118 | -1.488 | -3.392 | +1.904 |
| All-window venue: Hands Oval | 2 | -53.313 | -47.713 | -5.600 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -51.867 | -5.600 |
| All-window venue: Kardinia Park | 91 | +15.331 | +14.346 | -0.985 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.068 | 0.000 |
| All-window venue: Mars Stadium | 15 | +9.402 | +7.815 | -1.587 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -2.857 | -1.093 |
| All-window venue: MCG | 498 | -2.821 | -0.768 | -2.054 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -3.804 | -0.467 |
| All-window venue: Norwood Oval | 8 | +0.763 | +6.363 | +5.600 |
| All-window venue: Perth Stadium | 188 | -2.725 | -4.360 | +1.635 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -2.914 | +2.100 |
| All-window venue: SCG | 116 | +4.062 | +2.379 | -1.684 |
| All-window venue: Subiaco | 22 | -0.789 | -2.698 | +1.909 |
| All-window venue: Sydney Showground | 81 | +11.666 | +9.963 | -1.702 |
| All-window venue: TIO Stadium | 14 | +22.287 | +23.887 | +1.600 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.905 | 0.000 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +5.242 | +0.255 |

</details>

<details><summary>t40-ha-neutral: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.309 | -0.054 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.846 | +0.077 |
| Historical team: Carlton | 205 | -0.825 | -0.825 | +0.000 |
| Historical team: Collingwood | 215 | +1.878 | +1.878 | 0.000 |
| Historical team: Essendon | 204 | -5.111 | -5.139 | +0.027 |
| Historical team: Fremantle | 204 | -3.834 | -3.944 | +0.110 |
| Historical team: Geelong | 221 | +8.678 | +8.678 | 0.000 |
| Historical team: Gold Coast | 203 | -5.939 | -5.884 | -0.055 |
| Historical team: GWS Giants | 220 | +6.445 | +6.471 | +0.025 |
| Historical team: Hawthorn | 210 | +2.662 | +2.529 | -0.133 |
| Historical team: Melbourne | 211 | +0.901 | +1.113 | +0.212 |
| Historical team: North Melbourne | 202 | -6.038 | -5.982 | -0.055 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.224 | -0.107 |
| Historical team: Richmond | 210 | -2.404 | -2.378 | -0.027 |
| Historical team: St Kilda | 202 | -3.956 | -3.873 | -0.083 |
| Historical team: Sydney | 216 | +3.567 | +3.619 | +0.052 |
| Historical team: West Coast | 209 | -7.765 | -7.845 | +0.080 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.180 | +0.079 |
| All-window team: Adelaide | 231 | +6.348 | +6.300 | -0.048 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.327 | +0.116 |
| All-window team: Carlton | 230 | +0.315 | +0.315 | -0.000 |
| All-window team: Collingwood | 239 | +1.113 | +1.136 | +0.023 |
| All-window team: Essendon | 227 | -5.785 | -5.785 | -0.000 |
| All-window team: Fremantle | 228 | -2.838 | -2.985 | +0.147 |
| All-window team: Geelong | 245 | +8.269 | +8.292 | +0.023 |
| All-window team: Gold Coast | 226 | -6.216 | -6.191 | -0.025 |
| All-window team: GWS Giants | 243 | +5.563 | +5.609 | +0.046 |
| All-window team: Hawthorn | 234 | +2.747 | +2.651 | -0.096 |
| All-window team: Melbourne | 235 | +1.498 | +1.665 | +0.167 |
| All-window team: North Melbourne | 225 | -5.962 | -5.837 | -0.124 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.038 | -0.021 |
| All-window team: Richmond | 233 | -3.519 | -3.495 | -0.024 |
| All-window team: St Kilda | 225 | -3.303 | -3.229 | -0.075 |
| All-window team: Sydney | 239 | +4.915 | +4.985 | +0.070 |
| All-window team: West Coast | 232 | -7.358 | -7.479 | +0.121 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.878 | +0.047 |
| All-window venue: Accor Stadium | 2 | -31.221 | -31.221 | 0.000 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +6.040 | +0.312 |
| All-window venue: Barossa Park | 7 | -2.214 | +3.386 | +1.172 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.388 | 0.000 |
| All-window venue: Carrara | 96 | -1.646 | -1.354 | -0.292 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +13.223 | +4.480 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.387 | 0.000 |
| All-window venue: Gabba | 118 | -1.488 | -1.488 | 0.000 |
| All-window venue: Hands Oval | 2 | -53.313 | -47.713 | -5.600 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -51.867 | -5.600 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.454 | +0.123 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.068 | 0.000 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.775 | +0.373 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.862 | -0.088 |
| All-window venue: MCG | 498 | -2.821 | -2.754 | -0.067 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -3.804 | -0.467 |
| All-window venue: Norwood Oval | 8 | +0.763 | +6.363 | +5.600 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.517 | -0.209 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.814 | 0.000 |
| All-window venue: SCG | 116 | +4.062 | +4.207 | +0.145 |
| All-window venue: Subiaco | 22 | -0.789 | -0.789 | 0.000 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.804 | +0.138 |
| All-window venue: TIO Stadium | 14 | +22.287 | +23.887 | +1.600 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.905 | 0.000 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +5.242 | +0.255 |

</details>

<details><summary>t40-lineup-delta: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +7.556 | +1.193 |
| Historical team: Brisbane Lions | 219 | -1.769 | +0.665 | -1.104 |
| Historical team: Carlton | 205 | -0.825 | -3.851 | +3.026 |
| Historical team: Collingwood | 215 | +1.878 | +3.501 | +1.623 |
| Historical team: Essendon | 204 | -5.111 | -8.167 | +3.055 |
| Historical team: Fremantle | 204 | -3.834 | -4.892 | +1.058 |
| Historical team: Geelong | 221 | +8.678 | +12.201 | +3.522 |
| Historical team: Gold Coast | 203 | -5.939 | -9.420 | +3.481 |
| Historical team: GWS Giants | 220 | +6.445 | +5.862 | -0.583 |
| Historical team: Hawthorn | 210 | +2.662 | +2.702 | +0.039 |
| Historical team: Melbourne | 211 | +0.901 | +3.263 | +2.362 |
| Historical team: North Melbourne | 202 | -6.038 | -9.991 | +3.954 |
| Historical team: Port Adelaide | 209 | +0.331 | +3.315 | +2.983 |
| Historical team: Richmond | 210 | -2.404 | -2.783 | +0.379 |
| Historical team: St Kilda | 202 | -3.956 | -4.851 | +0.895 |
| Historical team: Sydney | 216 | +3.567 | +6.687 | +3.120 |
| Historical team: West Coast | 209 | -7.765 | -10.310 | +2.545 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.915 | +0.813 |
| All-window team: Adelaide | 231 | +6.348 | +7.499 | +1.150 |
| All-window team: Brisbane Lions | 242 | -1.211 | +1.313 | +0.102 |
| All-window team: Carlton | 230 | +0.315 | -3.134 | +2.820 |
| All-window team: Collingwood | 239 | +1.113 | +3.002 | +1.889 |
| All-window team: Essendon | 227 | -5.785 | -9.667 | +3.883 |
| All-window team: Fremantle | 228 | -2.838 | -3.006 | +0.168 |
| All-window team: Geelong | 245 | +8.269 | +12.124 | +3.855 |
| All-window team: Gold Coast | 226 | -6.216 | -8.973 | +2.757 |
| All-window team: GWS Giants | 243 | +5.563 | +4.947 | -0.616 |
| All-window team: Hawthorn | 234 | +2.747 | +3.289 | +0.542 |
| All-window team: Melbourne | 235 | +1.498 | +3.532 | +2.034 |
| All-window team: North Melbourne | 225 | -5.962 | -9.334 | +3.373 |
| All-window team: Port Adelaide | 232 | +0.059 | +2.428 | +2.370 |
| All-window team: Richmond | 233 | -3.519 | -4.835 | +1.316 |
| All-window team: St Kilda | 225 | -3.303 | -3.621 | +0.318 |
| All-window team: Sydney | 239 | +4.915 | +8.104 | +3.189 |
| All-window team: West Coast | 232 | -7.358 | -10.887 | +3.528 |
| All-window team: Western Bulldogs | 236 | +3.831 | +4.899 | +1.068 |
| All-window venue: Accor Stadium | 2 | -31.221 | -33.126 | +1.904 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +7.506 | +1.778 |
| All-window venue: Barossa Park | 7 | -2.214 | -5.643 | +3.429 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +17.425 | -1.963 |
| All-window venue: Carrara | 96 | -1.646 | -4.702 | +3.056 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +11.517 | +2.774 |
| All-window venue: Domain Stadium | 23 | +3.387 | +8.857 | +5.470 |
| All-window venue: Gabba | 118 | -1.488 | +0.661 | -0.827 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.887 | +0.574 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -68.127 | +10.660 |
| All-window venue: Kardinia Park | 91 | +15.331 | +19.191 | +3.861 |
| All-window venue: Manuka Oval | 30 | +3.068 | +1.598 | -1.470 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.594 | +0.192 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -4.824 | +0.874 |
| All-window venue: MCG | 498 | -2.821 | -3.213 | +0.392 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -10.259 | +5.988 |
| All-window venue: Norwood Oval | 8 | +0.763 | +3.800 | +3.037 |
| All-window venue: Perth Stadium | 188 | -2.725 | -5.401 | +2.675 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -2.939 | +2.125 |
| All-window venue: SCG | 116 | +4.062 | +7.627 | +3.564 |
| All-window venue: Subiaco | 22 | -0.789 | -1.141 | +0.352 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.812 | +0.146 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.584 | +0.298 |
| All-window venue: Traeger Park | 9 | -18.905 | -17.426 | -1.479 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +6.452 | +1.464 |

</details>

<details><summary>t40-minutes: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +4.872 | -1.490 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.668 | -1.101 |
| Historical team: Carlton | 205 | -0.825 | -1.880 | +1.055 |
| Historical team: Collingwood | 215 | +1.878 | +2.876 | +0.998 |
| Historical team: Essendon | 204 | -5.111 | -4.217 | -0.895 |
| Historical team: Fremantle | 204 | -3.834 | -2.915 | -0.919 |
| Historical team: Geelong | 221 | +8.678 | +8.917 | +0.238 |
| Historical team: Gold Coast | 203 | -5.939 | -6.107 | +0.168 |
| Historical team: GWS Giants | 220 | +6.445 | +6.318 | -0.127 |
| Historical team: Hawthorn | 210 | +2.662 | +2.491 | -0.172 |
| Historical team: Melbourne | 211 | +0.901 | +0.894 | -0.007 |
| Historical team: North Melbourne | 202 | -6.038 | -8.631 | +2.594 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.338 | +0.006 |
| Historical team: Richmond | 210 | -2.404 | -2.322 | -0.083 |
| Historical team: St Kilda | 202 | -3.956 | -4.001 | +0.045 |
| Historical team: Sydney | 216 | +3.567 | +4.364 | +0.797 |
| Historical team: West Coast | 209 | -7.765 | -8.123 | +0.358 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.877 | +0.776 |
| All-window team: Adelaide | 231 | +6.348 | +5.161 | -1.187 |
| All-window team: Brisbane Lions | 242 | -1.211 | +0.047 | -1.164 |
| All-window team: Carlton | 230 | +0.315 | -0.832 | +0.518 |
| All-window team: Collingwood | 239 | +1.113 | +2.137 | +1.025 |
| All-window team: Essendon | 227 | -5.785 | -5.370 | -0.415 |
| All-window team: Fremantle | 228 | -2.838 | -1.465 | -1.373 |
| All-window team: Geelong | 245 | +8.269 | +8.466 | +0.197 |
| All-window team: Gold Coast | 226 | -6.216 | -6.545 | +0.329 |
| All-window team: GWS Giants | 243 | +5.563 | +5.700 | +0.136 |
| All-window team: Hawthorn | 234 | +2.747 | +2.782 | +0.035 |
| All-window team: Melbourne | 235 | +1.498 | +1.509 | +0.011 |
| All-window team: North Melbourne | 225 | -5.962 | -8.270 | +2.308 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.150 | +0.091 |
| All-window team: Richmond | 233 | -3.519 | -3.653 | +0.134 |
| All-window team: St Kilda | 225 | -3.303 | -3.531 | +0.228 |
| All-window team: Sydney | 239 | +4.915 | +5.901 | +0.987 |
| All-window team: West Coast | 232 | -7.358 | -7.977 | +0.619 |
| All-window team: Western Bulldogs | 236 | +3.831 | +4.346 | +0.515 |
| All-window venue: Accor Stadium | 2 | -31.221 | -30.121 | -1.100 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.089 | -0.638 |
| All-window venue: Barossa Park | 7 | -2.214 | -3.023 | +0.809 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +20.159 | +0.772 |
| All-window venue: Carrara | 96 | -1.646 | -2.026 | +0.380 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +12.502 | +3.759 |
| All-window venue: Domain Stadium | 23 | +3.387 | +1.892 | -1.495 |
| All-window venue: Gabba | 118 | -1.488 | +0.069 | -1.419 |
| All-window venue: Hands Oval | 2 | -53.313 | -57.259 | +3.946 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -55.081 | -2.386 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.773 | +0.443 |
| All-window venue: Manuka Oval | 30 | +3.068 | +2.419 | -0.649 |
| All-window venue: Mars Stadium | 15 | +9.402 | +10.038 | +0.636 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.933 | -0.018 |
| All-window venue: MCG | 498 | -2.821 | -2.989 | +0.168 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -7.646 | +3.376 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.898 | +0.134 |
| All-window venue: Perth Stadium | 188 | -2.725 | -1.808 | -0.918 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +1.838 | +1.024 |
| All-window venue: SCG | 116 | +4.062 | +5.343 | +1.281 |
| All-window venue: Subiaco | 22 | -0.789 | -1.475 | +0.686 |
| All-window venue: Sydney Showground | 81 | +11.666 | +12.021 | +0.356 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.912 | +0.626 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.638 | -0.266 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.781 | -0.207 |

</details>

<details><summary>t40-od: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +4.442 | -1.921 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.595 | -1.174 |
| Historical team: Carlton | 205 | -0.825 | -1.880 | +1.056 |
| Historical team: Collingwood | 215 | +1.878 | +2.775 | +0.897 |
| Historical team: Essendon | 204 | -5.111 | -3.279 | -1.832 |
| Historical team: Fremantle | 204 | -3.834 | -2.933 | -0.901 |
| Historical team: Geelong | 221 | +8.678 | +7.244 | -1.434 |
| Historical team: Gold Coast | 203 | -5.939 | -5.493 | -0.447 |
| Historical team: GWS Giants | 220 | +6.445 | +5.836 | -0.609 |
| Historical team: Hawthorn | 210 | +2.662 | +2.709 | +0.047 |
| Historical team: Melbourne | 211 | +0.901 | +0.244 | -0.657 |
| Historical team: North Melbourne | 202 | -6.038 | -6.532 | +0.494 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.241 | -0.091 |
| Historical team: Richmond | 210 | -2.404 | -1.637 | -0.767 |
| Historical team: St Kilda | 202 | -3.956 | -4.040 | +0.084 |
| Historical team: Sydney | 216 | +3.567 | +3.154 | -0.413 |
| Historical team: West Coast | 209 | -7.765 | -6.302 | -1.463 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.892 | -0.209 |
| All-window team: Adelaide | 231 | +6.348 | +4.591 | -1.757 |
| All-window team: Brisbane Lions | 242 | -1.211 | +0.012 | -1.199 |
| All-window team: Carlton | 230 | +0.315 | -0.637 | +0.322 |
| All-window team: Collingwood | 239 | +1.113 | +2.001 | +0.889 |
| All-window team: Essendon | 227 | -5.785 | -4.216 | -1.569 |
| All-window team: Fremantle | 228 | -2.838 | -1.706 | -1.132 |
| All-window team: Geelong | 245 | +8.269 | +6.744 | -1.525 |
| All-window team: Gold Coast | 226 | -6.216 | -5.971 | -0.245 |
| All-window team: GWS Giants | 243 | +5.563 | +5.096 | -0.467 |
| All-window team: Hawthorn | 234 | +2.747 | +2.842 | +0.095 |
| All-window team: Melbourne | 235 | +1.498 | +0.811 | -0.687 |
| All-window team: North Melbourne | 225 | -5.962 | -6.208 | +0.246 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.588 | +0.529 |
| All-window team: Richmond | 233 | -3.519 | -2.688 | -0.831 |
| All-window team: St Kilda | 225 | -3.303 | -3.576 | +0.273 |
| All-window team: Sydney | 239 | +4.915 | +4.613 | -0.302 |
| All-window team: West Coast | 232 | -7.358 | -5.873 | -1.485 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.297 | -0.534 |
| All-window venue: Accor Stadium | 2 | -31.221 | -29.183 | -2.038 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +4.635 | -1.092 |
| All-window venue: Barossa Park | 7 | -2.214 | -1.599 | -0.615 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +20.560 | +1.172 |
| All-window venue: Carrara | 96 | -1.646 | -1.413 | -0.233 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +11.473 | +2.730 |
| All-window venue: Domain Stadium | 23 | +3.387 | +2.080 | -1.307 |
| All-window venue: Gabba | 118 | -1.488 | +0.204 | -1.284 |
| All-window venue: Hands Oval | 2 | -53.313 | -56.775 | +3.462 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -54.045 | -3.422 |
| All-window venue: Kardinia Park | 91 | +15.331 | +14.088 | -1.242 |
| All-window venue: Manuka Oval | 30 | +3.068 | +2.074 | -0.994 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.070 | -0.331 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.805 | -0.146 |
| All-window venue: MCG | 498 | -2.821 | -2.787 | -0.034 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.394 | +0.124 |
| All-window venue: Norwood Oval | 8 | +0.763 | -0.917 | +0.153 |
| All-window venue: Perth Stadium | 188 | -2.725 | -0.735 | -1.991 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +1.952 | +1.138 |
| All-window venue: SCG | 116 | +4.062 | +4.121 | +0.059 |
| All-window venue: Subiaco | 22 | -0.789 | -1.119 | +0.330 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.125 | -0.541 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.773 | +0.486 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.945 | +0.040 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.514 | -0.473 |

</details>

<details><summary>t40-od-ha-060: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +4.496 | -1.867 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.601 | -1.168 |
| Historical team: Carlton | 205 | -0.825 | -1.901 | +1.076 |
| Historical team: Collingwood | 215 | +1.878 | +2.795 | +0.917 |
| Historical team: Essendon | 204 | -5.111 | -3.306 | -1.805 |
| Historical team: Fremantle | 204 | -3.834 | -2.919 | -0.915 |
| Historical team: Geelong | 221 | +8.678 | +7.289 | -1.390 |
| Historical team: Gold Coast | 203 | -5.939 | -5.513 | -0.426 |
| Historical team: GWS Giants | 220 | +6.445 | +5.773 | -0.673 |
| Historical team: Hawthorn | 210 | +2.662 | +2.656 | -0.006 |
| Historical team: Melbourne | 211 | +0.901 | +0.264 | -0.637 |
| Historical team: North Melbourne | 202 | -6.038 | -6.546 | +0.508 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.194 | -0.137 |
| Historical team: Richmond | 210 | -2.404 | -1.610 | -0.794 |
| Historical team: St Kilda | 202 | -3.956 | -4.040 | +0.084 |
| Historical team: Sydney | 216 | +3.567 | +3.167 | -0.400 |
| Historical team: West Coast | 209 | -7.765 | -6.295 | -1.470 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.853 | -0.248 |
| All-window team: Adelaide | 231 | +6.348 | +4.645 | -1.703 |
| All-window team: Brisbane Lions | 242 | -1.211 | +0.001 | -1.210 |
| All-window team: Carlton | 230 | +0.315 | -0.673 | +0.359 |
| All-window team: Collingwood | 239 | +1.113 | +2.019 | +0.906 |
| All-window team: Essendon | 227 | -5.785 | -4.235 | -1.550 |
| All-window team: Fremantle | 228 | -2.838 | -1.694 | -1.144 |
| All-window team: Geelong | 245 | +8.269 | +6.796 | -1.474 |
| All-window team: Gold Coast | 226 | -6.216 | -5.996 | -0.220 |
| All-window team: GWS Giants | 243 | +5.563 | +5.044 | -0.519 |
| All-window team: Hawthorn | 234 | +2.747 | +2.795 | +0.048 |
| All-window team: Melbourne | 235 | +1.498 | +0.829 | -0.669 |
| All-window team: North Melbourne | 225 | -5.962 | -6.214 | +0.253 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.539 | +0.481 |
| All-window team: Richmond | 233 | -3.519 | -2.669 | -0.849 |
| All-window team: St Kilda | 225 | -3.303 | -3.583 | +0.279 |
| All-window team: Sydney | 239 | +4.915 | +4.630 | -0.284 |
| All-window team: West Coast | 232 | -7.358 | -5.873 | -1.485 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.261 | -0.570 |
| All-window venue: Accor Stadium | 2 | -31.221 | -27.783 | -3.438 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +6.035 | +0.308 |
| All-window venue: Barossa Park | 7 | -2.214 | -0.199 | -2.015 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +21.960 | +2.572 |
| All-window venue: Carrara | 96 | -1.646 | -0.013 | -1.633 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +12.873 | +4.130 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.480 | +0.093 |
| All-window venue: Gabba | 118 | -1.488 | +1.604 | +0.116 |
| All-window venue: Hands Oval | 2 | -53.313 | -55.375 | +2.062 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -52.645 | -4.822 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.488 | +0.158 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.474 | +0.406 |
| All-window venue: Mars Stadium | 15 | +9.402 | +10.470 | +1.069 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -2.405 | -1.546 |
| All-window venue: MCG | 498 | -2.821 | -1.387 | -1.434 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -2.994 | -1.276 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.483 | -0.280 |
| All-window venue: Perth Stadium | 188 | -2.725 | +0.665 | -2.060 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +3.352 | +2.538 |
| All-window venue: SCG | 116 | +4.062 | +5.521 | +1.459 |
| All-window venue: Subiaco | 22 | -0.789 | +0.281 | -0.508 |
| All-window venue: Sydney Showground | 81 | +11.666 | +12.525 | +0.859 |
| All-window venue: TIO Stadium | 14 | +22.287 | +24.173 | +1.886 |
| All-window venue: Traeger Park | 9 | -18.905 | -17.545 | -1.360 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +5.914 | +0.927 |

</details>

<details><summary>t40-od-ha-100: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +4.388 | -1.975 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.588 | -1.181 |
| Historical team: Carlton | 205 | -0.825 | -1.860 | +1.035 |
| Historical team: Collingwood | 215 | +1.878 | +2.756 | +0.878 |
| Historical team: Essendon | 204 | -5.111 | -3.252 | -1.860 |
| Historical team: Fremantle | 204 | -3.834 | -2.947 | -0.887 |
| Historical team: Geelong | 221 | +8.678 | +7.200 | -1.478 |
| Historical team: Gold Coast | 203 | -5.939 | -5.472 | -0.467 |
| Historical team: GWS Giants | 220 | +6.445 | +5.900 | -0.545 |
| Historical team: Hawthorn | 210 | +2.662 | +2.763 | +0.100 |
| Historical team: Melbourne | 211 | +0.901 | +0.224 | -0.677 |
| Historical team: North Melbourne | 202 | -6.038 | -6.518 | +0.480 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.288 | -0.044 |
| Historical team: Richmond | 210 | -2.404 | -1.663 | -0.741 |
| Historical team: St Kilda | 202 | -3.956 | -4.040 | +0.084 |
| Historical team: Sydney | 216 | +3.567 | +3.141 | -0.426 |
| Historical team: West Coast | 209 | -7.765 | -6.308 | -1.457 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.932 | -0.169 |
| All-window team: Adelaide | 231 | +6.348 | +4.536 | -1.812 |
| All-window team: Brisbane Lions | 242 | -1.211 | +0.024 | -1.187 |
| All-window team: Carlton | 230 | +0.315 | -0.600 | +0.286 |
| All-window team: Collingwood | 239 | +1.113 | +1.984 | +0.871 |
| All-window team: Essendon | 227 | -5.785 | -4.198 | -1.587 |
| All-window team: Fremantle | 228 | -2.838 | -1.718 | -1.119 |
| All-window team: Geelong | 245 | +8.269 | +6.693 | -1.576 |
| All-window team: Gold Coast | 226 | -6.216 | -5.946 | -0.270 |
| All-window team: GWS Giants | 243 | +5.563 | +5.148 | -0.415 |
| All-window team: Hawthorn | 234 | +2.747 | +2.890 | +0.143 |
| All-window team: Melbourne | 235 | +1.498 | +0.793 | -0.705 |
| All-window team: North Melbourne | 225 | -5.962 | -6.202 | +0.240 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.636 | +0.577 |
| All-window team: Richmond | 233 | -3.519 | -2.706 | -0.813 |
| All-window team: St Kilda | 225 | -3.303 | -3.570 | +0.267 |
| All-window team: Sydney | 239 | +4.915 | +4.595 | -0.320 |
| All-window team: West Coast | 232 | -7.358 | -5.873 | -1.485 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.332 | -0.498 |
| All-window venue: Accor Stadium | 2 | -31.221 | -30.583 | -0.638 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +3.235 | -2.492 |
| All-window venue: Barossa Park | 7 | -2.214 | -2.999 | +0.785 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.160 | -0.228 |
| All-window venue: Carrara | 96 | -1.646 | -2.813 | +1.167 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +10.073 | +1.330 |
| All-window venue: Domain Stadium | 23 | +3.387 | +0.680 | -2.707 |
| All-window venue: Gabba | 118 | -1.488 | -1.196 | -0.292 |
| All-window venue: Hands Oval | 2 | -53.313 | -58.175 | +4.862 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -55.445 | -2.022 |
| All-window venue: Kardinia Park | 91 | +15.331 | +12.688 | -2.642 |
| All-window venue: Manuka Oval | 30 | +3.068 | +0.674 | -2.394 |
| All-window venue: Mars Stadium | 15 | +9.402 | +7.670 | -1.731 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -5.205 | +1.254 |
| All-window venue: MCG | 498 | -2.821 | -4.187 | +1.366 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -5.794 | +1.524 |
| All-window venue: Norwood Oval | 8 | +0.763 | -2.317 | +1.553 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.135 | -0.591 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +0.552 | -0.262 |
| All-window venue: SCG | 116 | +4.062 | +2.721 | -1.341 |
| All-window venue: Subiaco | 22 | -0.789 | -2.519 | +1.730 |
| All-window venue: Sydney Showground | 81 | +11.666 | +9.725 | -1.941 |
| All-window venue: TIO Stadium | 14 | +22.287 | +21.373 | -0.914 |
| All-window venue: Traeger Park | 9 | -18.905 | -20.345 | +1.440 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +3.114 | -1.873 |

</details>

<details><summary>t40-od-ha-120: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +4.334 | -2.028 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.582 | -1.187 |
| Historical team: Carlton | 205 | -0.825 | -1.839 | +1.015 |
| Historical team: Collingwood | 215 | +1.878 | +2.736 | +0.858 |
| Historical team: Essendon | 204 | -5.111 | -3.224 | -1.887 |
| Historical team: Fremantle | 204 | -3.834 | -2.961 | -0.874 |
| Historical team: Geelong | 221 | +8.678 | +7.156 | -1.523 |
| Historical team: Gold Coast | 203 | -5.939 | -5.451 | -0.488 |
| Historical team: GWS Giants | 220 | +6.445 | +5.964 | -0.482 |
| Historical team: Hawthorn | 210 | +2.662 | +2.816 | +0.154 |
| Historical team: Melbourne | 211 | +0.901 | +0.204 | -0.697 |
| Historical team: North Melbourne | 202 | -6.038 | -6.504 | +0.466 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.335 | +0.003 |
| Historical team: Richmond | 210 | -2.404 | -1.690 | -0.714 |
| Historical team: St Kilda | 202 | -3.956 | -4.040 | +0.084 |
| Historical team: Sydney | 216 | +3.567 | +3.128 | -0.439 |
| Historical team: West Coast | 209 | -7.765 | -6.315 | -1.450 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.972 | -0.129 |
| All-window team: Adelaide | 231 | +6.348 | +4.482 | -1.866 |
| All-window team: Brisbane Lions | 242 | -1.211 | +0.036 | -1.175 |
| All-window team: Carlton | 230 | +0.315 | -0.564 | +0.249 |
| All-window team: Collingwood | 239 | +1.113 | +1.966 | +0.854 |
| All-window team: Essendon | 227 | -5.785 | -4.179 | -1.606 |
| All-window team: Fremantle | 228 | -2.838 | -1.731 | -1.107 |
| All-window team: Geelong | 245 | +8.269 | +6.641 | -1.628 |
| All-window team: Gold Coast | 226 | -6.216 | -5.921 | -0.294 |
| All-window team: GWS Giants | 243 | +5.563 | +5.200 | -0.363 |
| All-window team: Hawthorn | 234 | +2.747 | +2.938 | +0.191 |
| All-window team: Melbourne | 235 | +1.498 | +0.775 | -0.723 |
| All-window team: North Melbourne | 225 | -5.962 | -6.196 | +0.234 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.684 | +0.626 |
| All-window team: Richmond | 233 | -3.519 | -2.724 | -0.795 |
| All-window team: St Kilda | 225 | -3.303 | -3.564 | +0.261 |
| All-window team: Sydney | 239 | +4.915 | +4.578 | -0.337 |
| All-window team: West Coast | 232 | -7.358 | -5.873 | -1.485 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.368 | -0.463 |
| All-window venue: Accor Stadium | 2 | -31.221 | -31.983 | +0.762 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +1.835 | -3.892 |
| All-window venue: Barossa Park | 7 | -2.214 | -4.399 | +2.185 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +17.760 | -1.628 |
| All-window venue: Carrara | 96 | -1.646 | -4.213 | +2.567 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.673 | -0.070 |
| All-window venue: Domain Stadium | 23 | +3.387 | -0.720 | -2.666 |
| All-window venue: Gabba | 118 | -1.488 | -2.596 | +1.108 |
| All-window venue: Hands Oval | 2 | -53.313 | -59.575 | +6.262 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -56.845 | -0.622 |
| All-window venue: Kardinia Park | 91 | +15.331 | +11.288 | -4.042 |
| All-window venue: Manuka Oval | 30 | +3.068 | -0.726 | -2.342 |
| All-window venue: Mars Stadium | 15 | +9.402 | +6.270 | -3.131 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -6.605 | +2.654 |
| All-window venue: MCG | 498 | -2.821 | -5.587 | +2.766 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -7.194 | +2.924 |
| All-window venue: Norwood Oval | 8 | +0.763 | -3.717 | +2.953 |
| All-window venue: Perth Stadium | 188 | -2.725 | -3.535 | +0.809 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.848 | +0.034 |
| All-window venue: SCG | 116 | +4.062 | +1.321 | -2.741 |
| All-window venue: Subiaco | 22 | -0.789 | -3.919 | +3.130 |
| All-window venue: Sydney Showground | 81 | +11.666 | +8.325 | -3.341 |
| All-window venue: TIO Stadium | 14 | +22.287 | +19.973 | -2.314 |
| All-window venue: Traeger Park | 9 | -18.905 | -21.745 | +2.840 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +1.714 | -3.273 |

</details>

<details><summary>t40-od-ha-bucket: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +4.196 | -2.166 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.777 | -0.992 |
| Historical team: Carlton | 205 | -0.825 | -1.716 | +0.892 |
| Historical team: Collingwood | 215 | +1.878 | +2.746 | +0.868 |
| Historical team: Essendon | 204 | -5.111 | -3.008 | -2.103 |
| Historical team: Fremantle | 204 | -3.834 | -3.187 | -0.647 |
| Historical team: Geelong | 221 | +8.678 | +6.722 | -1.957 |
| Historical team: Gold Coast | 203 | -5.939 | -5.386 | -0.553 |
| Historical team: GWS Giants | 220 | +6.445 | +6.101 | -0.345 |
| Historical team: Hawthorn | 210 | +2.662 | +2.356 | -0.306 |
| Historical team: Melbourne | 211 | +0.901 | +0.595 | -0.305 |
| Historical team: North Melbourne | 202 | -6.038 | -6.622 | +0.584 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.569 | +0.238 |
| Historical team: Richmond | 210 | -2.404 | -1.280 | -1.124 |
| Historical team: St Kilda | 202 | -3.956 | -3.582 | -0.373 |
| Historical team: Sydney | 216 | +3.567 | +3.215 | -0.352 |
| Historical team: West Coast | 209 | -7.765 | -6.462 | -1.303 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.061 | -0.040 |
| All-window team: Adelaide | 231 | +6.348 | +4.351 | -1.997 |
| All-window team: Brisbane Lions | 242 | -1.211 | -0.207 | -1.003 |
| All-window team: Carlton | 230 | +0.315 | -0.491 | +0.176 |
| All-window team: Collingwood | 239 | +1.113 | +1.981 | +0.868 |
| All-window team: Essendon | 227 | -5.785 | -3.957 | -1.828 |
| All-window team: Fremantle | 228 | -2.838 | -2.010 | -0.828 |
| All-window team: Geelong | 245 | +8.269 | +6.253 | -2.016 |
| All-window team: Gold Coast | 226 | -6.216 | -5.900 | -0.316 |
| All-window team: GWS Giants | 243 | +5.563 | +5.376 | -0.187 |
| All-window team: Hawthorn | 234 | +2.747 | +2.540 | -0.207 |
| All-window team: Melbourne | 235 | +1.498 | +1.148 | -0.351 |
| All-window team: North Melbourne | 225 | -5.962 | -6.168 | +0.206 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.902 | +0.843 |
| All-window team: Richmond | 233 | -3.519 | -2.366 | -1.153 |
| All-window team: St Kilda | 225 | -3.303 | -3.175 | -0.128 |
| All-window team: Sydney | 239 | +4.915 | +4.692 | -0.223 |
| All-window team: West Coast | 232 | -7.358 | -6.075 | -1.283 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.487 | -0.344 |
| All-window venue: Accor Stadium | 2 | -31.221 | -29.183 | -2.038 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +3.132 | -2.596 |
| All-window venue: Barossa Park | 7 | -2.214 | +4.001 | +1.787 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +20.560 | +1.172 |
| All-window venue: Carrara | 96 | -1.646 | -2.894 | +1.248 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +15.533 | +6.790 |
| All-window venue: Domain Stadium | 23 | +3.387 | +0.162 | -3.224 |
| All-window venue: Gabba | 118 | -1.488 | -1.700 | +0.213 |
| All-window venue: Hands Oval | 2 | -53.313 | -51.175 | -2.138 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -48.445 | -9.022 |
| All-window venue: Kardinia Park | 91 | +15.331 | +13.104 | -2.227 |
| All-window venue: Manuka Oval | 30 | +3.068 | +2.074 | -0.994 |
| All-window venue: Mars Stadium | 15 | +9.402 | +7.484 | -1.918 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -2.711 | -1.239 |
| All-window venue: MCG | 498 | -2.821 | -0.734 | -2.088 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -3.928 | -0.343 |
| All-window venue: Norwood Oval | 8 | +0.763 | +4.683 | +3.920 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.369 | -0.356 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.148 | -0.666 |
| All-window venue: SCG | 116 | +4.062 | +2.437 | -1.625 |
| All-window venue: Subiaco | 22 | -0.789 | -3.028 | +2.239 |
| All-window venue: Sydney Showground | 81 | +11.666 | +9.422 | -2.243 |
| All-window venue: TIO Stadium | 14 | +22.287 | +24.373 | +2.086 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.945 | +0.040 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.769 | -0.218 |

</details>

<details><summary>t40-od-reverse-k04-r10: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +5.441 | -0.922 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.565 | -1.204 |
| Historical team: Carlton | 205 | -0.825 | -2.614 | +1.789 |
| Historical team: Collingwood | 215 | +1.878 | +3.422 | +1.544 |
| Historical team: Essendon | 204 | -5.111 | -3.815 | -1.296 |
| Historical team: Fremantle | 204 | -3.834 | -3.308 | -0.527 |
| Historical team: Geelong | 221 | +8.678 | +8.654 | -0.025 |
| Historical team: Gold Coast | 203 | -5.939 | -6.522 | +0.583 |
| Historical team: GWS Giants | 220 | +6.445 | +6.589 | +0.144 |
| Historical team: Hawthorn | 210 | +2.662 | +2.982 | +0.319 |
| Historical team: Melbourne | 211 | +0.901 | +0.593 | -0.308 |
| Historical team: North Melbourne | 202 | -6.038 | -7.999 | +1.962 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.048 | -0.284 |
| Historical team: Richmond | 210 | -2.404 | -2.043 | -0.361 |
| Historical team: St Kilda | 202 | -3.956 | -4.647 | +0.691 |
| Historical team: Sydney | 216 | +3.567 | +4.036 | +0.469 |
| Historical team: West Coast | 209 | -7.765 | -7.487 | -0.278 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.293 | +0.192 |
| All-window team: Adelaide | 231 | +6.348 | +5.683 | -0.665 |
| All-window team: Brisbane Lions | 242 | -1.211 | +0.120 | -1.091 |
| All-window team: Carlton | 230 | +0.315 | -1.430 | +1.115 |
| All-window team: Collingwood | 239 | +1.113 | +2.578 | +1.465 |
| All-window team: Essendon | 227 | -5.785 | -5.070 | -0.714 |
| All-window team: Fremantle | 228 | -2.838 | -1.786 | -1.052 |
| All-window team: Geelong | 245 | +8.269 | +8.038 | -0.231 |
| All-window team: Gold Coast | 226 | -6.216 | -6.825 | +0.609 |
| All-window team: GWS Giants | 243 | +5.563 | +5.749 | +0.186 |
| All-window team: Hawthorn | 234 | +2.747 | +3.386 | +0.639 |
| All-window team: Melbourne | 235 | +1.498 | +1.081 | -0.418 |
| All-window team: North Melbourne | 225 | -5.962 | -7.310 | +1.349 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.550 | +0.491 |
| All-window team: Richmond | 233 | -3.519 | -3.436 | -0.083 |
| All-window team: St Kilda | 225 | -3.303 | -4.101 | +0.797 |
| All-window team: Sydney | 239 | +4.915 | +5.523 | +0.609 |
| All-window team: West Coast | 232 | -7.358 | -6.958 | -0.400 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.596 | -0.235 |
| All-window venue: Accor Stadium | 2 | -31.221 | -29.101 | -2.120 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.221 | -0.507 |
| All-window venue: Barossa Park | 7 | -2.214 | -2.669 | +0.455 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +20.332 | +0.944 |
| All-window venue: Carrara | 96 | -1.646 | -2.316 | +0.670 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +12.790 | +4.047 |
| All-window venue: Domain Stadium | 23 | +3.387 | +1.730 | -1.657 |
| All-window venue: Gabba | 118 | -1.488 | +0.339 | -1.149 |
| All-window venue: Hands Oval | 2 | -53.313 | -56.177 | +2.865 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -56.710 | -0.757 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.457 | +0.127 |
| All-window venue: Manuka Oval | 30 | +3.068 | +2.421 | -0.647 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.459 | +0.057 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.962 | +0.011 |
| All-window venue: MCG | 498 | -2.821 | -2.944 | +0.123 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -6.796 | +2.526 |
| All-window venue: Norwood Oval | 8 | +0.763 | -1.345 | +0.582 |
| All-window venue: Perth Stadium | 188 | -2.725 | -1.195 | -1.531 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +1.338 | +0.524 |
| All-window venue: SCG | 116 | +4.062 | +5.190 | +1.128 |
| All-window venue: Subiaco | 22 | -0.789 | -2.040 | +1.250 |
| All-window venue: Sydney Showground | 81 | +11.666 | +12.028 | +0.362 |
| All-window venue: TIO Stadium | 14 | +22.287 | +23.430 | +1.143 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.760 | -0.145 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +5.058 | +0.071 |

</details>

<details><summary>t40-od-reverse-k04-r20: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +5.459 | -0.904 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.566 | -1.203 |
| Historical team: Carlton | 205 | -0.825 | -2.881 | +2.056 |
| Historical team: Collingwood | 215 | +1.878 | +3.472 | +1.594 |
| Historical team: Essendon | 204 | -5.111 | -4.253 | -0.858 |
| Historical team: Fremantle | 204 | -3.834 | -3.654 | -0.180 |
| Historical team: Geelong | 221 | +8.678 | +9.377 | +0.699 |
| Historical team: Gold Coast | 203 | -5.939 | -7.084 | +1.145 |
| Historical team: GWS Giants | 220 | +6.445 | +6.839 | +0.394 |
| Historical team: Hawthorn | 210 | +2.662 | +2.809 | +0.147 |
| Historical team: Melbourne | 211 | +0.901 | +1.036 | +0.135 |
| Historical team: North Melbourne | 202 | -6.038 | -8.844 | +2.806 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.476 | +0.144 |
| Historical team: Richmond | 210 | -2.404 | -1.901 | -0.503 |
| Historical team: St Kilda | 202 | -3.956 | -4.700 | +0.744 |
| Historical team: Sydney | 216 | +3.567 | +4.518 | +0.951 |
| Historical team: West Coast | 209 | -7.765 | -7.863 | +0.098 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.665 | +0.564 |
| All-window team: Adelaide | 231 | +6.348 | +5.715 | -0.633 |
| All-window team: Brisbane Lions | 242 | -1.211 | +0.250 | -0.961 |
| All-window team: Carlton | 230 | +0.315 | -1.663 | +1.348 |
| All-window team: Collingwood | 239 | +1.113 | +2.681 | +1.568 |
| All-window team: Essendon | 227 | -5.785 | -5.573 | -0.212 |
| All-window team: Fremantle | 228 | -2.838 | -2.070 | -0.768 |
| All-window team: Geelong | 245 | +8.269 | +8.835 | +0.566 |
| All-window team: Gold Coast | 226 | -6.216 | -7.346 | +1.130 |
| All-window team: GWS Giants | 243 | +5.563 | +6.027 | +0.464 |
| All-window team: Hawthorn | 234 | +2.747 | +3.268 | +0.521 |
| All-window team: Melbourne | 235 | +1.498 | +1.525 | +0.027 |
| All-window team: North Melbourne | 225 | -5.962 | -8.307 | +2.345 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.129 | +0.070 |
| All-window team: Richmond | 233 | -3.519 | -3.422 | -0.097 |
| All-window team: St Kilda | 225 | -3.303 | -4.163 | +0.860 |
| All-window team: Sydney | 239 | +4.915 | +6.020 | +1.106 |
| All-window team: West Coast | 232 | -7.358 | -7.564 | +0.206 |
| All-window team: Western Bulldogs | 236 | +3.831 | +4.046 | +0.215 |
| All-window venue: Accor Stadium | 2 | -31.221 | -29.171 | -2.050 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.438 | -0.290 |
| All-window venue: Barossa Park | 7 | -2.214 | -3.474 | +1.260 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.856 | +0.469 |
| All-window venue: Carrara | 96 | -1.646 | -2.809 | +1.163 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +12.729 | +3.985 |
| All-window venue: Domain Stadium | 23 | +3.387 | +1.730 | -1.657 |
| All-window venue: Gabba | 118 | -1.488 | +0.324 | -1.164 |
| All-window venue: Hands Oval | 2 | -53.313 | -57.512 | +4.200 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.721 | +0.254 |
| All-window venue: Kardinia Park | 91 | +15.331 | +16.261 | +0.930 |
| All-window venue: Manuka Oval | 30 | +3.068 | +2.739 | -0.330 |
| All-window venue: Mars Stadium | 15 | +9.402 | +10.074 | +0.672 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -4.062 | +0.111 |
| All-window venue: MCG | 498 | -2.821 | -2.949 | +0.128 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -7.896 | +3.626 |
| All-window venue: Norwood Oval | 8 | +0.763 | -0.172 | -0.591 |
| All-window venue: Perth Stadium | 188 | -2.725 | -1.713 | -1.012 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +0.242 | -0.571 |
| All-window venue: SCG | 116 | +4.062 | +5.664 | +1.602 |
| All-window venue: Subiaco | 22 | -0.789 | -2.112 | +1.323 |
| All-window venue: Sydney Showground | 81 | +11.666 | +12.427 | +0.762 |
| All-window venue: TIO Stadium | 14 | +22.287 | +23.198 | +0.911 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.535 | -0.370 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +5.306 | +0.319 |

</details>

<details><summary>t40-od-reverse-k04-r40: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +5.555 | -0.808 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.580 | -1.189 |
| Historical team: Carlton | 205 | -0.825 | -3.343 | +2.519 |
| Historical team: Collingwood | 215 | +1.878 | +3.579 | +1.701 |
| Historical team: Essendon | 204 | -5.111 | -4.984 | -0.127 |
| Historical team: Fremantle | 204 | -3.834 | -4.252 | +0.418 |
| Historical team: Geelong | 221 | +8.678 | +10.599 | +1.920 |
| Historical team: Gold Coast | 203 | -5.939 | -8.041 | +2.102 |
| Historical team: GWS Giants | 220 | +6.445 | +7.279 | +0.833 |
| Historical team: Hawthorn | 210 | +2.662 | +2.545 | -0.118 |
| Historical team: Melbourne | 211 | +0.901 | +1.785 | +0.884 |
| Historical team: North Melbourne | 202 | -6.038 | -10.268 | +4.231 |
| Historical team: Port Adelaide | 209 | +0.331 | +1.187 | +0.856 |
| Historical team: Richmond | 210 | -2.404 | -1.689 | -0.715 |
| Historical team: St Kilda | 202 | -3.956 | -4.807 | +0.851 |
| Historical team: Sydney | 216 | +3.567 | +5.358 | +1.791 |
| Historical team: West Coast | 209 | -7.765 | -8.537 | +0.772 |
| Historical team: Western Bulldogs | 212 | +5.101 | +6.265 | +1.164 |
| All-window team: Adelaide | 231 | +6.348 | +5.863 | -0.485 |
| All-window team: Brisbane Lions | 242 | -1.211 | +0.439 | -0.771 |
| All-window team: Carlton | 230 | +0.315 | -2.069 | +1.754 |
| All-window team: Collingwood | 239 | +1.113 | +2.871 | +1.758 |
| All-window team: Essendon | 227 | -5.785 | -6.414 | +0.629 |
| All-window team: Fremantle | 228 | -2.838 | -2.557 | -0.280 |
| All-window team: Geelong | 245 | +8.269 | +10.159 | +1.890 |
| All-window team: Gold Coast | 226 | -6.216 | -8.205 | +1.989 |
| All-window team: GWS Giants | 243 | +5.563 | +6.516 | +0.953 |
| All-window team: Hawthorn | 234 | +2.747 | +3.122 | +0.375 |
| All-window team: Melbourne | 235 | +1.498 | +2.240 | +0.742 |
| All-window team: North Melbourne | 225 | -5.962 | -9.935 | +3.973 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.534 | +0.475 |
| All-window team: Richmond | 233 | -3.519 | -3.452 | -0.067 |
| All-window team: St Kilda | 225 | -3.303 | -4.292 | +0.989 |
| All-window team: Sydney | 239 | +4.915 | +6.864 | +1.949 |
| All-window team: West Coast | 232 | -7.358 | -8.591 | +1.233 |
| All-window team: Western Bulldogs | 236 | +3.831 | +4.776 | +0.945 |
| All-window venue: Accor Stadium | 2 | -31.221 | -29.337 | -1.885 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.833 | +0.106 |
| All-window venue: Barossa Park | 7 | -2.214 | -4.740 | +2.526 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.042 | -0.345 |
| All-window venue: Carrara | 96 | -1.646 | -3.631 | +1.985 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +12.655 | +3.912 |
| All-window venue: Domain Stadium | 23 | +3.387 | +1.730 | -1.657 |
| All-window venue: Gabba | 118 | -1.488 | +0.268 | -1.220 |
| All-window venue: Hands Oval | 2 | -53.313 | -59.461 | +6.148 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -59.603 | +2.136 |
| All-window venue: Kardinia Park | 91 | +15.331 | +17.602 | +2.272 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.276 | +0.208 |
| All-window venue: Mars Stadium | 15 | +9.402 | +11.099 | +1.697 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -4.230 | +0.279 |
| All-window venue: MCG | 498 | -2.821 | -2.973 | +0.151 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -9.764 | +5.494 |
| All-window venue: Norwood Oval | 8 | +0.763 | +1.608 | +0.845 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.597 | -0.129 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -1.583 | +0.769 |
| All-window venue: SCG | 116 | +4.062 | +6.482 | +2.419 |
| All-window venue: Subiaco | 22 | -0.789 | -2.258 | +1.469 |
| All-window venue: Sydney Showground | 81 | +11.666 | +13.133 | +1.467 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.924 | +0.637 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.207 | -0.698 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +5.753 | +0.765 |

</details>

<details><summary>t40-od-reverse-k08-r10: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +4.357 | -2.005 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.569 | -1.200 |
| Historical team: Carlton | 205 | -0.825 | -1.585 | +0.760 |
| Historical team: Collingwood | 215 | +1.878 | +2.673 | +0.795 |
| Historical team: Essendon | 204 | -5.111 | -2.867 | -2.245 |
| Historical team: Fremantle | 204 | -3.834 | -2.586 | -1.249 |
| Historical team: Geelong | 221 | +8.678 | +6.572 | -2.106 |
| Historical team: Gold Coast | 203 | -5.939 | -4.892 | -1.047 |
| Historical team: GWS Giants | 220 | +6.445 | +5.551 | -0.895 |
| Historical team: Hawthorn | 210 | +2.662 | +2.802 | +0.140 |
| Historical team: Melbourne | 211 | +0.901 | -0.158 | -0.743 |
| Historical team: North Melbourne | 202 | -6.038 | -5.741 | -0.297 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.634 | +0.302 |
| Historical team: Richmond | 210 | -2.404 | -1.756 | -0.648 |
| Historical team: St Kilda | 202 | -3.956 | -3.983 | +0.027 |
| Historical team: Sydney | 216 | +3.567 | +2.671 | -0.896 |
| Historical team: West Coast | 209 | -7.765 | -5.908 | -1.857 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.567 | -0.534 |
| All-window team: Adelaide | 231 | +6.348 | +4.466 | -1.882 |
| All-window team: Brisbane Lions | 242 | -1.211 | -0.075 | -1.136 |
| All-window team: Carlton | 230 | +0.315 | -0.369 | +0.055 |
| All-window team: Collingwood | 239 | +1.113 | +1.858 | +0.745 |
| All-window team: Essendon | 227 | -5.785 | -3.735 | -2.050 |
| All-window team: Fremantle | 228 | -2.838 | -1.422 | -1.415 |
| All-window team: Geelong | 245 | +8.269 | +6.029 | -2.240 |
| All-window team: Gold Coast | 226 | -6.216 | -5.445 | -0.771 |
| All-window team: GWS Giants | 243 | +5.563 | +4.785 | -0.778 |
| All-window team: Hawthorn | 234 | +2.747 | +2.843 | +0.096 |
| All-window team: Melbourne | 235 | +1.498 | +0.449 | -1.049 |
| All-window team: North Melbourne | 225 | -5.962 | -5.340 | -0.622 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.932 | +0.873 |
| All-window team: Richmond | 233 | -3.519 | -2.653 | -0.866 |
| All-window team: St Kilda | 225 | -3.303 | -3.502 | +0.198 |
| All-window team: Sydney | 239 | +4.915 | +4.148 | -0.766 |
| All-window team: West Coast | 232 | -7.358 | -5.310 | -2.048 |
| All-window team: Western Bulldogs | 236 | +3.831 | +2.898 | -0.933 |
| All-window venue: Accor Stadium | 2 | -31.221 | -29.051 | -2.170 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +4.390 | -1.338 |
| All-window venue: Barossa Park | 7 | -2.214 | -0.891 | -1.323 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +21.037 | +1.649 |
| All-window venue: Carrara | 96 | -1.646 | -0.921 | -0.725 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +11.566 | +2.823 |
| All-window venue: Domain Stadium | 23 | +3.387 | +2.080 | -1.307 |
| All-window venue: Gabba | 118 | -1.488 | +0.251 | -1.237 |
| All-window venue: Hands Oval | 2 | -53.313 | -55.882 | +2.569 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -52.852 | -4.615 |
| All-window venue: Kardinia Park | 91 | +15.331 | +13.385 | -1.946 |
| All-window venue: Manuka Oval | 30 | +3.068 | +1.740 | -1.329 |
| All-window venue: Mars Stadium | 15 | +9.402 | +8.465 | -0.937 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.718 | -0.232 |
| All-window venue: MCG | 498 | -2.821 | -2.761 | -0.060 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -3.398 | -0.873 |
| All-window venue: Norwood Oval | 8 | +0.763 | -1.874 | +1.110 |
| All-window venue: Perth Stadium | 188 | -2.725 | -0.250 | -2.476 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +2.986 | +2.173 |
| All-window venue: SCG | 116 | +4.062 | +3.676 | -0.386 |
| All-window venue: Subiaco | 22 | -0.789 | -0.992 | +0.203 |
| All-window venue: Sydney Showground | 81 | +11.666 | +10.676 | -0.990 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.937 | +0.650 |
| All-window venue: Traeger Park | 9 | -18.905 | -19.056 | +0.152 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.201 | -0.786 |

</details>

<details><summary>t40-od-reverse-k08-r20: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +4.442 | -1.921 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.595 | -1.174 |
| Historical team: Carlton | 205 | -0.825 | -1.880 | +1.056 |
| Historical team: Collingwood | 215 | +1.878 | +2.775 | +0.897 |
| Historical team: Essendon | 204 | -5.111 | -3.279 | -1.832 |
| Historical team: Fremantle | 204 | -3.834 | -2.933 | -0.901 |
| Historical team: Geelong | 221 | +8.678 | +7.244 | -1.434 |
| Historical team: Gold Coast | 203 | -5.939 | -5.493 | -0.447 |
| Historical team: GWS Giants | 220 | +6.445 | +5.836 | -0.609 |
| Historical team: Hawthorn | 210 | +2.662 | +2.709 | +0.047 |
| Historical team: Melbourne | 211 | +0.901 | +0.244 | -0.657 |
| Historical team: North Melbourne | 202 | -6.038 | -6.532 | +0.494 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.241 | -0.091 |
| Historical team: Richmond | 210 | -2.404 | -1.637 | -0.767 |
| Historical team: St Kilda | 202 | -3.956 | -4.040 | +0.084 |
| Historical team: Sydney | 216 | +3.567 | +3.154 | -0.413 |
| Historical team: West Coast | 209 | -7.765 | -6.302 | -1.463 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.892 | -0.209 |
| All-window team: Adelaide | 231 | +6.348 | +4.591 | -1.757 |
| All-window team: Brisbane Lions | 242 | -1.211 | +0.012 | -1.199 |
| All-window team: Carlton | 230 | +0.315 | -0.637 | +0.322 |
| All-window team: Collingwood | 239 | +1.113 | +2.001 | +0.889 |
| All-window team: Essendon | 227 | -5.785 | -4.216 | -1.569 |
| All-window team: Fremantle | 228 | -2.838 | -1.706 | -1.132 |
| All-window team: Geelong | 245 | +8.269 | +6.744 | -1.525 |
| All-window team: Gold Coast | 226 | -6.216 | -5.971 | -0.245 |
| All-window team: GWS Giants | 243 | +5.563 | +5.096 | -0.467 |
| All-window team: Hawthorn | 234 | +2.747 | +2.842 | +0.095 |
| All-window team: Melbourne | 235 | +1.498 | +0.811 | -0.687 |
| All-window team: North Melbourne | 225 | -5.962 | -6.208 | +0.246 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.588 | +0.529 |
| All-window team: Richmond | 233 | -3.519 | -2.688 | -0.831 |
| All-window team: St Kilda | 225 | -3.303 | -3.576 | +0.273 |
| All-window team: Sydney | 239 | +4.915 | +4.613 | -0.302 |
| All-window team: West Coast | 232 | -7.358 | -5.873 | -1.485 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.297 | -0.534 |
| All-window venue: Accor Stadium | 2 | -31.221 | -29.183 | -2.038 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +4.635 | -1.092 |
| All-window venue: Barossa Park | 7 | -2.214 | -1.599 | -0.615 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +20.560 | +1.172 |
| All-window venue: Carrara | 96 | -1.646 | -1.413 | -0.233 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +11.473 | +2.730 |
| All-window venue: Domain Stadium | 23 | +3.387 | +2.080 | -1.307 |
| All-window venue: Gabba | 118 | -1.488 | +0.204 | -1.284 |
| All-window venue: Hands Oval | 2 | -53.313 | -56.775 | +3.462 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -54.045 | -3.422 |
| All-window venue: Kardinia Park | 91 | +15.331 | +14.088 | -1.242 |
| All-window venue: Manuka Oval | 30 | +3.068 | +2.074 | -0.994 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.070 | -0.331 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.805 | -0.146 |
| All-window venue: MCG | 498 | -2.821 | -2.787 | -0.034 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.394 | +0.124 |
| All-window venue: Norwood Oval | 8 | +0.763 | -0.917 | +0.153 |
| All-window venue: Perth Stadium | 188 | -2.725 | -0.735 | -1.991 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +1.952 | +1.138 |
| All-window venue: SCG | 116 | +4.062 | +4.121 | +0.059 |
| All-window venue: Subiaco | 22 | -0.789 | -1.119 | +0.330 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.125 | -0.541 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.773 | +0.486 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.945 | +0.040 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.514 | -0.473 |

</details>

<details><summary>t40-od-reverse-k08-r40: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +4.625 | -1.738 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.635 | -1.134 |
| Historical team: Carlton | 205 | -0.825 | -2.423 | +1.599 |
| Historical team: Collingwood | 215 | +1.878 | +2.973 | +1.095 |
| Historical team: Essendon | 204 | -5.111 | -4.014 | -1.097 |
| Historical team: Fremantle | 204 | -3.834 | -3.570 | -0.264 |
| Historical team: Geelong | 221 | +8.678 | +8.461 | -0.217 |
| Historical team: Gold Coast | 203 | -5.939 | -6.583 | +0.644 |
| Historical team: GWS Giants | 220 | +6.445 | +6.359 | -0.086 |
| Historical team: Hawthorn | 210 | +2.662 | +2.563 | -0.100 |
| Historical team: Melbourne | 211 | +0.901 | +0.969 | +0.069 |
| Historical team: North Melbourne | 202 | -6.038 | -7.960 | +1.922 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.463 | +0.131 |
| Historical team: Richmond | 210 | -2.404 | -1.443 | -0.961 |
| Historical team: St Kilda | 202 | -3.956 | -4.157 | +0.201 |
| Historical team: Sydney | 216 | +3.567 | +4.033 | +0.466 |
| Historical team: West Coast | 209 | -7.765 | -7.028 | -0.737 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.462 | +0.361 |
| All-window team: Adelaide | 231 | +6.348 | +4.857 | -1.492 |
| All-window team: Brisbane Lions | 242 | -1.211 | +0.170 | -1.041 |
| All-window team: Carlton | 230 | +0.315 | -1.135 | +0.820 |
| All-window team: Collingwood | 239 | +1.113 | +2.270 | +1.157 |
| All-window team: Essendon | 227 | -5.785 | -5.082 | -0.703 |
| All-window team: Fremantle | 228 | -2.838 | -2.228 | -0.610 |
| All-window team: Geelong | 245 | +8.269 | +8.036 | -0.233 |
| All-window team: Gold Coast | 226 | -6.216 | -6.912 | +0.696 |
| All-window team: GWS Giants | 243 | +5.563 | +5.664 | +0.101 |
| All-window team: Hawthorn | 234 | +2.747 | +2.870 | +0.123 |
| All-window team: Melbourne | 235 | +1.498 | +1.455 | -0.043 |
| All-window team: North Melbourne | 225 | -5.962 | -7.754 | +1.792 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.007 | -0.051 |
| All-window team: Richmond | 233 | -3.519 | -2.774 | -0.745 |
| All-window team: St Kilda | 225 | -3.303 | -3.731 | +0.427 |
| All-window team: Sydney | 239 | +4.915 | +5.447 | +0.533 |
| All-window team: West Coast | 232 | -7.358 | -6.888 | -0.470 |
| All-window team: Western Bulldogs | 236 | +3.831 | +4.005 | +0.174 |
| All-window venue: Accor Stadium | 2 | -31.221 | -29.473 | -1.748 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.089 | -0.639 |
| All-window venue: Barossa Park | 7 | -2.214 | -2.878 | +0.664 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.705 | +0.317 |
| All-window venue: Carrara | 96 | -1.646 | -2.302 | +0.656 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +11.337 | +2.594 |
| All-window venue: Domain Stadium | 23 | +3.387 | +2.080 | -1.307 |
| All-window venue: Gabba | 118 | -1.488 | +0.121 | -1.367 |
| All-window venue: Hands Oval | 2 | -53.313 | -58.310 | +4.998 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -56.326 | -1.141 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.362 | +0.031 |
| All-window venue: Manuka Oval | 30 | +3.068 | +2.681 | -0.387 |
| All-window venue: Mars Stadium | 15 | +9.402 | +10.138 | +0.736 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.962 | +0.012 |
| All-window venue: MCG | 498 | -2.821 | -2.843 | +0.022 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -6.204 | +1.933 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.687 | -0.076 |
| All-window venue: Perth Stadium | 188 | -2.725 | -1.615 | -1.110 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +0.148 | -0.666 |
| All-window venue: SCG | 116 | +4.062 | +4.930 | +0.867 |
| All-window venue: Subiaco | 22 | -0.789 | -1.372 | +0.583 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.945 | +0.280 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.542 | +0.256 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.755 | -0.150 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +5.098 | +0.110 |

</details>

<details><summary>t40-od-reverse-k12-r10: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +3.726 | -2.636 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.682 | -1.087 |
| Historical team: Carlton | 205 | -0.825 | -1.036 | +0.211 |
| Historical team: Collingwood | 215 | +1.878 | +2.213 | +0.335 |
| Historical team: Essendon | 204 | -5.111 | -2.502 | -2.610 |
| Historical team: Fremantle | 204 | -3.834 | -2.339 | -1.495 |
| Historical team: Geelong | 221 | +8.678 | +5.648 | -3.030 |
| Historical team: Gold Coast | 203 | -5.939 | -4.133 | -1.806 |
| Historical team: GWS Giants | 220 | +6.445 | +5.045 | -1.400 |
| Historical team: Hawthorn | 210 | +2.662 | +2.518 | -0.145 |
| Historical team: Melbourne | 211 | +0.901 | -0.309 | -0.592 |
| Historical team: North Melbourne | 202 | -6.038 | -4.822 | -1.216 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.789 | +0.458 |
| Historical team: Richmond | 210 | -2.404 | -1.463 | -0.942 |
| Historical team: St Kilda | 202 | -3.956 | -3.544 | -0.412 |
| Historical team: Sydney | 216 | +3.567 | +2.160 | -1.407 |
| Historical team: West Coast | 209 | -7.765 | -5.187 | -2.578 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.221 | -0.880 |
| All-window team: Adelaide | 231 | +6.348 | +3.835 | -2.513 |
| All-window team: Brisbane Lions | 242 | -1.211 | -0.265 | -0.946 |
| All-window team: Carlton | 230 | +0.315 | +0.192 | -0.122 |
| All-window team: Collingwood | 239 | +1.113 | +1.466 | +0.353 |
| All-window team: Essendon | 227 | -5.785 | -3.143 | -2.642 |
| All-window team: Fremantle | 228 | -2.838 | -1.387 | -1.451 |
| All-window team: Geelong | 245 | +8.269 | +5.159 | -3.110 |
| All-window team: Gold Coast | 226 | -6.216 | -4.754 | -1.462 |
| All-window team: GWS Giants | 243 | +5.563 | +4.372 | -1.191 |
| All-window team: Hawthorn | 234 | +2.747 | +2.447 | -0.300 |
| All-window team: Melbourne | 235 | +1.498 | +0.251 | -1.247 |
| All-window team: North Melbourne | 225 | -5.962 | -4.608 | -1.354 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.956 | +0.897 |
| All-window team: Richmond | 233 | -3.519 | -2.194 | -1.325 |
| All-window team: St Kilda | 225 | -3.303 | -3.139 | -0.165 |
| All-window team: Sydney | 239 | +4.915 | +3.565 | -1.349 |
| All-window team: West Coast | 232 | -7.358 | -4.627 | -2.731 |
| All-window team: Western Bulldogs | 236 | +3.831 | +2.656 | -1.175 |
| All-window venue: Accor Stadium | 2 | -31.221 | -29.415 | -1.806 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +4.036 | -1.692 |
| All-window venue: Barossa Park | 7 | -2.214 | +0.253 | -1.961 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +20.912 | +1.524 |
| All-window venue: Carrara | 96 | -1.646 | -0.290 | -1.356 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +10.867 | +2.124 |
| All-window venue: Domain Stadium | 23 | +3.387 | +2.250 | -1.136 |
| All-window venue: Gabba | 118 | -1.488 | -0.019 | -1.469 |
| All-window venue: Hands Oval | 2 | -53.313 | -55.833 | +2.520 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -51.241 | -6.226 |
| All-window venue: Kardinia Park | 91 | +15.331 | +12.529 | -2.802 |
| All-window venue: Manuka Oval | 30 | +3.068 | +1.486 | -1.582 |
| All-window venue: Mars Stadium | 15 | +9.402 | +8.084 | -1.317 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.649 | -0.302 |
| All-window venue: MCG | 498 | -2.821 | -2.602 | -0.219 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -1.928 | -2.343 |
| All-window venue: Norwood Oval | 8 | +0.763 | -1.870 | +1.106 |
| All-window venue: Perth Stadium | 188 | -2.725 | -0.047 | -2.678 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +2.762 | +1.948 |
| All-window venue: SCG | 116 | +4.062 | +3.000 | -1.063 |
| All-window venue: Subiaco | 22 | -0.789 | -0.117 | -0.672 |
| All-window venue: Sydney Showground | 81 | +11.666 | +10.139 | -1.526 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.724 | +0.437 |
| All-window venue: Traeger Park | 9 | -18.905 | -19.166 | +0.261 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +3.811 | -1.176 |

</details>

<details><summary>t40-od-reverse-k12-r20: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +3.823 | -2.539 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.704 | -1.065 |
| Historical team: Carlton | 205 | -0.825 | -1.317 | +0.493 |
| Historical team: Collingwood | 215 | +1.878 | +2.332 | +0.454 |
| Historical team: Essendon | 204 | -5.111 | -2.847 | -2.264 |
| Historical team: Fremantle | 204 | -3.834 | -2.647 | -1.187 |
| Historical team: Geelong | 221 | +8.678 | +6.211 | -2.467 |
| Historical team: Gold Coast | 203 | -5.939 | -4.687 | -1.252 |
| Historical team: GWS Giants | 220 | +6.445 | +5.312 | -1.133 |
| Historical team: Hawthorn | 210 | +2.662 | +2.488 | -0.175 |
| Historical team: Melbourne | 211 | +0.901 | +0.014 | -0.886 |
| Historical team: North Melbourne | 202 | -6.038 | -5.480 | -0.558 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.468 | +0.137 |
| Historical team: Richmond | 210 | -2.404 | -1.371 | -1.034 |
| Historical team: St Kilda | 202 | -3.956 | -3.596 | -0.360 |
| Historical team: Sydney | 216 | +3.567 | +2.570 | -0.997 |
| Historical team: West Coast | 209 | -7.765 | -5.523 | -2.242 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.487 | -0.615 |
| All-window team: Adelaide | 231 | +6.348 | +3.971 | -2.377 |
| All-window team: Brisbane Lions | 242 | -1.211 | -0.190 | -1.021 |
| All-window team: Carlton | 230 | +0.315 | -0.071 | -0.244 |
| All-window team: Collingwood | 239 | +1.113 | +1.612 | +0.500 |
| All-window team: Essendon | 227 | -5.785 | -3.556 | -2.229 |
| All-window team: Fremantle | 228 | -2.838 | -1.641 | -1.197 |
| All-window team: Geelong | 245 | +8.269 | +5.755 | -2.515 |
| All-window team: Gold Coast | 226 | -6.216 | -5.229 | -0.987 |
| All-window team: GWS Giants | 243 | +5.563 | +4.655 | -0.908 |
| All-window team: Hawthorn | 234 | +2.747 | +2.505 | -0.242 |
| All-window team: Melbourne | 235 | +1.498 | +0.536 | -0.962 |
| All-window team: North Melbourne | 225 | -5.962 | -5.306 | -0.655 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.696 | +0.637 |
| All-window team: Richmond | 233 | -3.519 | -2.235 | -1.284 |
| All-window team: St Kilda | 225 | -3.303 | -3.211 | -0.092 |
| All-window team: Sydney | 239 | +4.915 | +3.945 | -0.969 |
| All-window team: West Coast | 232 | -7.358 | -5.087 | -2.271 |
| All-window team: Western Bulldogs | 236 | +3.831 | +2.988 | -0.843 |
| All-window venue: Accor Stadium | 2 | -31.221 | -29.588 | -1.633 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +4.258 | -1.469 |
| All-window venue: Barossa Park | 7 | -2.214 | -0.378 | -1.836 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +20.512 | +1.124 |
| All-window venue: Carrara | 96 | -1.646 | -0.725 | -0.921 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +10.737 | +1.993 |
| All-window venue: Domain Stadium | 23 | +3.387 | +2.250 | -1.136 |
| All-window venue: Gabba | 118 | -1.488 | -0.050 | -1.437 |
| All-window venue: Hands Oval | 2 | -53.313 | -56.496 | +3.184 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -52.374 | -5.093 |
| All-window venue: Kardinia Park | 91 | +15.331 | +13.092 | -2.239 |
| All-window venue: Manuka Oval | 30 | +3.068 | +1.800 | -1.269 |
| All-window venue: Mars Stadium | 15 | +9.402 | +8.598 | -0.803 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.715 | -0.235 |
| All-window venue: MCG | 498 | -2.821 | -2.638 | -0.183 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -2.722 | -1.548 |
| All-window venue: Norwood Oval | 8 | +0.763 | -1.126 | +0.363 |
| All-window venue: Perth Stadium | 188 | -2.725 | -0.445 | -2.281 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +1.981 | +1.167 |
| All-window venue: SCG | 116 | +4.062 | +3.360 | -0.702 |
| All-window venue: Subiaco | 22 | -0.789 | -0.287 | -0.502 |
| All-window venue: Sydney Showground | 81 | +11.666 | +10.550 | -1.116 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.582 | +0.296 |
| All-window venue: Traeger Park | 9 | -18.905 | -19.116 | +0.212 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.122 | -0.865 |

</details>

<details><summary>t40-od-reverse-k12-r40: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +4.018 | -2.345 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.737 | -1.032 |
| Historical team: Carlton | 205 | -0.825 | -1.854 | +1.029 |
| Historical team: Collingwood | 215 | +1.878 | +2.561 | +0.683 |
| Historical team: Essendon | 204 | -5.111 | -3.492 | -1.619 |
| Historical team: Fremantle | 204 | -3.834 | -3.234 | -0.601 |
| Historical team: Geelong | 221 | +8.678 | +7.275 | -1.403 |
| Historical team: Gold Coast | 203 | -5.939 | -5.732 | -0.208 |
| Historical team: GWS Giants | 220 | +6.445 | +5.816 | -0.629 |
| Historical team: Hawthorn | 210 | +2.662 | +2.444 | -0.218 |
| Historical team: Melbourne | 211 | +0.901 | +0.625 | -0.276 |
| Historical team: North Melbourne | 202 | -6.038 | -6.719 | +0.682 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.134 | -0.197 |
| Historical team: Richmond | 210 | -2.404 | -1.211 | -1.194 |
| Historical team: St Kilda | 202 | -3.956 | -3.702 | -0.254 |
| Historical team: Sydney | 216 | +3.567 | +3.342 | -0.225 |
| Historical team: West Coast | 209 | -7.765 | -6.160 | -1.605 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.977 | -0.124 |
| All-window team: Adelaide | 231 | +6.348 | +4.243 | -2.105 |
| All-window team: Brisbane Lions | 242 | -1.211 | -0.044 | -1.167 |
| All-window team: Carlton | 230 | +0.315 | -0.576 | +0.262 |
| All-window team: Collingwood | 239 | +1.113 | +1.893 | +0.780 |
| All-window team: Essendon | 227 | -5.785 | -4.332 | -1.453 |
| All-window team: Fremantle | 228 | -2.838 | -2.124 | -0.714 |
| All-window team: Geelong | 245 | +8.269 | +6.880 | -1.389 |
| All-window team: Gold Coast | 226 | -6.216 | -6.118 | -0.098 |
| All-window team: GWS Giants | 243 | +5.563 | +5.189 | -0.374 |
| All-window team: Hawthorn | 234 | +2.747 | +2.629 | -0.118 |
| All-window team: Melbourne | 235 | +1.498 | +1.072 | -0.426 |
| All-window team: North Melbourne | 225 | -5.962 | -6.613 | +0.651 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.220 | +0.161 |
| All-window team: Richmond | 233 | -3.519 | -2.323 | -1.196 |
| All-window team: St Kilda | 225 | -3.303 | -3.360 | +0.056 |
| All-window team: Sydney | 239 | +4.915 | +4.656 | -0.259 |
| All-window team: West Coast | 232 | -7.358 | -5.952 | -1.406 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.609 | -0.222 |
| All-window venue: Accor Stadium | 2 | -31.221 | -29.955 | -1.266 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +4.680 | -1.048 |
| All-window venue: Barossa Park | 7 | -2.214 | -1.592 | -0.622 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.766 | +0.378 |
| All-window venue: Carrara | 96 | -1.646 | -1.543 | -0.103 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +10.511 | +1.768 |
| All-window venue: Domain Stadium | 23 | +3.387 | +2.250 | -1.136 |
| All-window venue: Gabba | 118 | -1.488 | -0.102 | -1.385 |
| All-window venue: Hands Oval | 2 | -53.313 | -57.740 | +4.427 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -54.579 | -2.888 |
| All-window venue: Kardinia Park | 91 | +15.331 | +14.157 | -1.174 |
| All-window venue: Manuka Oval | 30 | +3.068 | +2.394 | -0.675 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.546 | +0.144 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.840 | -0.110 |
| All-window venue: MCG | 498 | -2.821 | -2.710 | -0.111 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.223 | -0.047 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.208 | -0.556 |
| All-window venue: Perth Stadium | 188 | -2.725 | -1.196 | -1.530 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +0.566 | -0.248 |
| All-window venue: SCG | 116 | +4.062 | +4.040 | -0.022 |
| All-window venue: Subiaco | 22 | -0.789 | -0.628 | -0.161 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.323 | -0.342 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.348 | +0.061 |
| All-window venue: Traeger Park | 9 | -18.905 | -19.022 | +0.117 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.719 | -0.268 |

</details>

<details><summary>t40-od-shot-025: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +4.513 | -1.850 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.724 | -1.045 |
| Historical team: Carlton | 205 | -0.825 | -2.072 | +1.248 |
| Historical team: Collingwood | 215 | +1.878 | +2.638 | +0.760 |
| Historical team: Essendon | 204 | -5.111 | -3.522 | -1.590 |
| Historical team: Fremantle | 204 | -3.834 | -2.991 | -0.843 |
| Historical team: Geelong | 221 | +8.678 | +7.594 | -1.084 |
| Historical team: Gold Coast | 203 | -5.939 | -5.634 | -0.305 |
| Historical team: GWS Giants | 220 | +6.445 | +6.150 | -0.296 |
| Historical team: Hawthorn | 210 | +2.662 | +2.692 | +0.030 |
| Historical team: Melbourne | 211 | +0.901 | +0.245 | -0.656 |
| Historical team: North Melbourne | 202 | -6.038 | -6.378 | +0.340 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.243 | -0.089 |
| Historical team: Richmond | 210 | -2.404 | -1.762 | -0.642 |
| Historical team: St Kilda | 202 | -3.956 | -4.176 | +0.220 |
| Historical team: Sydney | 216 | +3.567 | +3.620 | +0.053 |
| Historical team: West Coast | 209 | -7.765 | -6.196 | -1.569 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.562 | -0.539 |
| All-window team: Adelaide | 231 | +6.348 | +4.743 | -1.605 |
| All-window team: Brisbane Lions | 242 | -1.211 | -0.111 | -1.100 |
| All-window team: Carlton | 230 | +0.315 | -0.857 | +0.542 |
| All-window team: Collingwood | 239 | +1.113 | +1.872 | +0.760 |
| All-window team: Essendon | 227 | -5.785 | -4.491 | -1.294 |
| All-window team: Fremantle | 228 | -2.838 | -1.733 | -1.105 |
| All-window team: Geelong | 245 | +8.269 | +7.078 | -1.191 |
| All-window team: Gold Coast | 226 | -6.216 | -6.085 | -0.131 |
| All-window team: GWS Giants | 243 | +5.563 | +5.428 | -0.135 |
| All-window team: Hawthorn | 234 | +2.747 | +2.838 | +0.091 |
| All-window team: Melbourne | 235 | +1.498 | +0.795 | -0.703 |
| All-window team: North Melbourne | 225 | -5.962 | -6.058 | +0.096 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.642 | +0.583 |
| All-window team: Richmond | 233 | -3.519 | -2.852 | -0.667 |
| All-window team: St Kilda | 225 | -3.303 | -3.691 | +0.387 |
| All-window team: Sydney | 239 | +4.915 | +5.087 | +0.172 |
| All-window team: West Coast | 232 | -7.358 | -5.869 | -1.489 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.046 | -0.785 |
| All-window venue: Accor Stadium | 2 | -31.221 | -29.101 | -2.121 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +4.705 | -1.023 |
| All-window venue: Barossa Park | 7 | -2.214 | -1.621 | -0.593 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +20.675 | +1.288 |
| All-window venue: Carrara | 96 | -1.646 | -1.502 | -0.144 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +11.338 | +2.595 |
| All-window venue: Domain Stadium | 23 | +3.387 | +2.205 | -1.182 |
| All-window venue: Gabba | 118 | -1.488 | +0.048 | -1.440 |
| All-window venue: Hands Oval | 2 | -53.313 | -56.477 | +3.165 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -54.213 | -3.254 |
| All-window venue: Kardinia Park | 91 | +15.331 | +14.431 | -0.900 |
| All-window venue: Manuka Oval | 30 | +3.068 | +2.423 | -0.645 |
| All-window venue: Mars Stadium | 15 | +9.402 | +8.811 | -0.591 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.933 | -0.018 |
| All-window venue: MCG | 498 | -2.821 | -2.870 | +0.049 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.204 | -0.066 |
| All-window venue: Norwood Oval | 8 | +0.763 | -0.872 | +0.108 |
| All-window venue: Perth Stadium | 188 | -2.725 | -0.793 | -1.932 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +2.878 | +2.064 |
| All-window venue: SCG | 116 | +4.062 | +4.570 | +0.507 |
| All-window venue: Subiaco | 22 | -0.789 | -0.769 | -0.021 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.469 | -0.196 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.625 | +0.338 |
| All-window venue: Traeger Park | 9 | -18.905 | -19.267 | +0.362 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.505 | -0.482 |

</details>

<details><summary>t40-od-shot-050: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +4.584 | -1.779 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.854 | -0.915 |
| Historical team: Carlton | 205 | -0.825 | -2.264 | +1.440 |
| Historical team: Collingwood | 215 | +1.878 | +2.502 | +0.624 |
| Historical team: Essendon | 204 | -5.111 | -3.765 | -1.347 |
| Historical team: Fremantle | 204 | -3.834 | -3.049 | -0.785 |
| Historical team: Geelong | 221 | +8.678 | +7.944 | -0.734 |
| Historical team: Gold Coast | 203 | -5.939 | -5.776 | -0.164 |
| Historical team: GWS Giants | 220 | +6.445 | +6.463 | +0.018 |
| Historical team: Hawthorn | 210 | +2.662 | +2.674 | +0.012 |
| Historical team: Melbourne | 211 | +0.901 | +0.247 | -0.654 |
| Historical team: North Melbourne | 202 | -6.038 | -6.224 | +0.186 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.245 | -0.087 |
| Historical team: Richmond | 210 | -2.404 | -1.888 | -0.517 |
| Historical team: St Kilda | 202 | -3.956 | -4.312 | +0.356 |
| Historical team: Sydney | 216 | +3.567 | +4.085 | +0.518 |
| Historical team: West Coast | 209 | -7.765 | -6.090 | -1.675 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.231 | -0.870 |
| All-window team: Adelaide | 231 | +6.348 | +4.895 | -1.453 |
| All-window team: Brisbane Lions | 242 | -1.211 | -0.235 | -0.976 |
| All-window team: Carlton | 230 | +0.315 | -1.077 | +0.762 |
| All-window team: Collingwood | 239 | +1.113 | +1.743 | +0.631 |
| All-window team: Essendon | 227 | -5.785 | -4.765 | -1.020 |
| All-window team: Fremantle | 228 | -2.838 | -1.759 | -1.078 |
| All-window team: Geelong | 245 | +8.269 | +7.413 | -0.856 |
| All-window team: Gold Coast | 226 | -6.216 | -6.199 | -0.017 |
| All-window team: GWS Giants | 243 | +5.563 | +5.761 | +0.198 |
| All-window team: Hawthorn | 234 | +2.747 | +2.834 | +0.087 |
| All-window team: Melbourne | 235 | +1.498 | +0.780 | -0.718 |
| All-window team: North Melbourne | 225 | -5.962 | -5.907 | -0.055 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.696 | +0.637 |
| All-window team: Richmond | 233 | -3.519 | -3.017 | -0.502 |
| All-window team: St Kilda | 225 | -3.303 | -3.805 | +0.501 |
| All-window team: Sydney | 239 | +4.915 | +5.561 | +0.646 |
| All-window team: West Coast | 232 | -7.358 | -5.865 | -1.493 |
| All-window team: Western Bulldogs | 236 | +3.831 | +2.795 | -1.036 |
| All-window venue: Accor Stadium | 2 | -31.221 | -29.018 | -2.203 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +4.775 | -0.953 |
| All-window venue: Barossa Park | 7 | -2.214 | -1.643 | -0.571 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +20.791 | +1.403 |
| All-window venue: Carrara | 96 | -1.646 | -1.590 | -0.056 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +11.203 | +2.460 |
| All-window venue: Domain Stadium | 23 | +3.387 | +2.330 | -1.057 |
| All-window venue: Gabba | 118 | -1.488 | -0.108 | -1.379 |
| All-window venue: Hands Oval | 2 | -53.313 | -56.180 | +2.867 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -54.381 | -3.086 |
| All-window venue: Kardinia Park | 91 | +15.331 | +14.774 | -0.557 |
| All-window venue: Manuka Oval | 30 | +3.068 | +2.772 | -0.296 |
| All-window venue: Mars Stadium | 15 | +9.402 | +8.551 | -0.851 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -4.060 | +0.110 |
| All-window venue: MCG | 498 | -2.821 | -2.953 | +0.132 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.014 | -0.257 |
| All-window venue: Norwood Oval | 8 | +0.763 | -0.827 | +0.063 |
| All-window venue: Perth Stadium | 188 | -2.725 | -0.852 | -1.874 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +3.803 | +2.990 |
| All-window venue: SCG | 116 | +4.062 | +5.018 | +0.956 |
| All-window venue: Subiaco | 22 | -0.789 | -0.419 | -0.371 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.814 | +0.148 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.477 | +0.190 |
| All-window venue: Traeger Park | 9 | -18.905 | -19.589 | +0.684 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.496 | -0.491 |

</details>

<details><summary>t40-od-shot-075: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +4.655 | -1.708 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.983 | -0.786 |
| Historical team: Carlton | 205 | -0.825 | -2.457 | +1.632 |
| Historical team: Collingwood | 215 | +1.878 | +2.365 | +0.487 |
| Historical team: Essendon | 204 | -5.111 | -4.008 | -1.104 |
| Historical team: Fremantle | 204 | -3.834 | -3.107 | -0.727 |
| Historical team: Geelong | 221 | +8.678 | +8.294 | -0.384 |
| Historical team: Gold Coast | 203 | -5.939 | -5.917 | -0.022 |
| Historical team: GWS Giants | 220 | +6.445 | +6.777 | +0.331 |
| Historical team: Hawthorn | 210 | +2.662 | +2.657 | -0.005 |
| Historical team: Melbourne | 211 | +0.901 | +0.248 | -0.653 |
| Historical team: North Melbourne | 202 | -6.038 | -6.070 | +0.033 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.247 | -0.085 |
| Historical team: Richmond | 210 | -2.404 | -2.013 | -0.391 |
| Historical team: St Kilda | 202 | -3.956 | -4.448 | +0.492 |
| Historical team: Sydney | 216 | +3.567 | +4.551 | +0.984 |
| Historical team: West Coast | 209 | -7.765 | -5.984 | -1.781 |
| Historical team: Western Bulldogs | 212 | +5.101 | +3.901 | -1.200 |
| All-window team: Adelaide | 231 | +6.348 | +5.047 | -1.301 |
| All-window team: Brisbane Lions | 242 | -1.211 | -0.359 | -0.852 |
| All-window team: Carlton | 230 | +0.315 | -1.297 | +0.982 |
| All-window team: Collingwood | 239 | +1.113 | +1.614 | +0.502 |
| All-window team: Essendon | 227 | -5.785 | -5.040 | -0.745 |
| All-window team: Fremantle | 228 | -2.838 | -1.786 | -1.052 |
| All-window team: Geelong | 245 | +8.269 | +7.747 | -0.522 |
| All-window team: Gold Coast | 226 | -6.216 | -6.313 | +0.097 |
| All-window team: GWS Giants | 243 | +5.563 | +6.093 | +0.530 |
| All-window team: Hawthorn | 234 | +2.747 | +2.830 | +0.083 |
| All-window team: Melbourne | 235 | +1.498 | +0.764 | -0.734 |
| All-window team: North Melbourne | 225 | -5.962 | -5.756 | -0.205 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.750 | +0.691 |
| All-window team: Richmond | 233 | -3.519 | -3.182 | -0.337 |
| All-window team: St Kilda | 225 | -3.303 | -3.919 | +0.616 |
| All-window team: Sydney | 239 | +4.915 | +6.035 | +1.120 |
| All-window team: West Coast | 232 | -7.358 | -5.861 | -1.498 |
| All-window team: Western Bulldogs | 236 | +3.831 | +2.544 | -1.287 |
| All-window venue: Accor Stadium | 2 | -31.221 | -28.936 | -2.285 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +4.845 | -0.883 |
| All-window venue: Barossa Park | 7 | -2.214 | -1.665 | -0.549 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +20.906 | +1.519 |
| All-window venue: Carrara | 96 | -1.646 | -1.678 | +0.032 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +11.068 | +2.325 |
| All-window venue: Domain Stadium | 23 | +3.387 | +2.455 | -0.932 |
| All-window venue: Gabba | 118 | -1.488 | -0.264 | -1.223 |
| All-window venue: Hands Oval | 2 | -53.313 | -55.882 | +2.569 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -54.548 | -2.919 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.117 | -0.214 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.121 | +0.053 |
| All-window venue: Mars Stadium | 15 | +9.402 | +8.291 | -1.110 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -4.188 | +0.238 |
| All-window venue: MCG | 498 | -2.821 | -3.036 | +0.215 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -3.824 | -0.447 |
| All-window venue: Norwood Oval | 8 | +0.763 | -0.782 | +0.018 |
| All-window venue: Perth Stadium | 188 | -2.725 | -0.910 | -1.816 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +4.729 | +3.915 |
| All-window venue: SCG | 116 | +4.062 | +5.467 | +1.405 |
| All-window venue: Subiaco | 22 | -0.789 | -0.068 | -0.721 |
| All-window venue: Sydney Showground | 81 | +11.666 | +12.159 | +0.493 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.329 | +0.042 |
| All-window venue: Traeger Park | 9 | -18.905 | -19.911 | +1.006 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.487 | -0.500 |

</details>

<details><summary>t40-od-shot-100: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +4.726 | -1.637 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.113 | -0.656 |
| Historical team: Carlton | 205 | -0.825 | -2.649 | +1.824 |
| Historical team: Collingwood | 215 | +1.878 | +2.228 | +0.350 |
| Historical team: Essendon | 204 | -5.111 | -4.250 | -0.861 |
| Historical team: Fremantle | 204 | -3.834 | -3.165 | -0.669 |
| Historical team: Geelong | 221 | +8.678 | +8.644 | -0.034 |
| Historical team: Gold Coast | 203 | -5.939 | -6.058 | +0.119 |
| Historical team: GWS Giants | 220 | +6.445 | +7.090 | +0.645 |
| Historical team: Hawthorn | 210 | +2.662 | +2.640 | -0.023 |
| Historical team: Melbourne | 211 | +0.901 | +0.250 | -0.651 |
| Historical team: North Melbourne | 202 | -6.038 | -5.916 | -0.121 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.248 | -0.083 |
| Historical team: Richmond | 210 | -2.404 | -2.138 | -0.266 |
| Historical team: St Kilda | 202 | -3.956 | -4.584 | +0.628 |
| Historical team: Sydney | 216 | +3.567 | +5.017 | +1.450 |
| Historical team: West Coast | 209 | -7.765 | -5.878 | -1.887 |
| Historical team: Western Bulldogs | 212 | +5.101 | +3.570 | -1.531 |
| All-window team: Adelaide | 231 | +6.348 | +5.200 | -1.149 |
| All-window team: Brisbane Lions | 242 | -1.211 | -0.483 | -0.728 |
| All-window team: Carlton | 230 | +0.315 | -1.517 | +1.202 |
| All-window team: Collingwood | 239 | +1.113 | +1.485 | +0.373 |
| All-window team: Essendon | 227 | -5.785 | -5.314 | -0.471 |
| All-window team: Fremantle | 228 | -2.838 | -1.813 | -1.025 |
| All-window team: Geelong | 245 | +8.269 | +8.081 | -0.188 |
| All-window team: Gold Coast | 226 | -6.216 | -6.426 | +0.211 |
| All-window team: GWS Giants | 243 | +5.563 | +6.425 | +0.862 |
| All-window team: Hawthorn | 234 | +2.747 | +2.826 | +0.079 |
| All-window team: Melbourne | 235 | +1.498 | +0.748 | -0.750 |
| All-window team: North Melbourne | 225 | -5.962 | -5.606 | -0.356 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.804 | +0.745 |
| All-window team: Richmond | 233 | -3.519 | -3.346 | -0.172 |
| All-window team: St Kilda | 225 | -3.303 | -4.033 | +0.730 |
| All-window team: Sydney | 239 | +4.915 | +6.509 | +1.594 |
| All-window team: West Coast | 232 | -7.358 | -5.856 | -1.502 |
| All-window team: Western Bulldogs | 236 | +3.831 | +2.293 | -1.538 |
| All-window venue: Accor Stadium | 2 | -31.221 | -28.854 | -2.367 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +4.914 | -0.813 |
| All-window venue: Barossa Park | 7 | -2.214 | -1.687 | -0.527 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +21.022 | +1.634 |
| All-window venue: Carrara | 96 | -1.646 | -1.766 | +0.120 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +10.933 | +2.190 |
| All-window venue: Domain Stadium | 23 | +3.387 | +2.580 | -0.807 |
| All-window venue: Gabba | 118 | -1.488 | -0.421 | -1.067 |
| All-window venue: Hands Oval | 2 | -53.313 | -55.584 | +2.272 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -54.716 | -2.751 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.460 | +0.129 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.470 | +0.402 |
| All-window venue: Mars Stadium | 15 | +9.402 | +8.032 | -1.370 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -4.316 | +0.366 |
| All-window venue: MCG | 498 | -2.821 | -3.119 | +0.298 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -3.633 | -0.637 |
| All-window venue: Norwood Oval | 8 | +0.763 | -0.737 | -0.027 |
| All-window venue: Perth Stadium | 188 | -2.725 | -0.968 | -1.757 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +5.655 | +4.841 |
| All-window venue: SCG | 116 | +4.062 | +5.916 | +1.853 |
| All-window venue: Subiaco | 22 | -0.789 | +0.282 | -0.508 |
| All-window venue: Sydney Showground | 81 | +11.666 | +12.503 | +0.838 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.180 | -0.106 |
| All-window venue: Traeger Park | 9 | -18.905 | -20.233 | +1.328 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.478 | -0.509 |

</details>

<details><summary>t40-offset-c0: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +4.676 | -1.686 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.528 | -0.241 |
| Historical team: Carlton | 205 | -0.825 | -0.678 | -0.147 |
| Historical team: Collingwood | 215 | +1.878 | +1.639 | -0.239 |
| Historical team: Essendon | 204 | -5.111 | -4.336 | -0.775 |
| Historical team: Fremantle | 204 | -3.834 | -3.403 | -0.432 |
| Historical team: Geelong | 221 | +8.678 | +7.512 | -1.166 |
| Historical team: Gold Coast | 203 | -5.939 | -5.782 | -0.157 |
| Historical team: GWS Giants | 220 | +6.445 | +6.729 | +0.284 |
| Historical team: Hawthorn | 210 | +2.662 | +2.636 | -0.027 |
| Historical team: Melbourne | 211 | +0.901 | -0.672 | -0.229 |
| Historical team: North Melbourne | 202 | -6.038 | -4.523 | -1.515 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.349 | +0.018 |
| Historical team: Richmond | 210 | -2.404 | -2.015 | -0.389 |
| Historical team: St Kilda | 202 | -3.956 | -3.380 | -0.576 |
| Historical team: Sydney | 216 | +3.567 | +4.360 | +0.793 |
| Historical team: West Coast | 209 | -7.765 | -5.291 | -2.474 |
| Historical team: Western Bulldogs | 212 | +5.101 | +2.856 | -2.245 |
| All-window team: Adelaide | 231 | +6.348 | +4.968 | -1.380 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.092 | -0.119 |
| All-window team: Carlton | 230 | +0.315 | +0.249 | -0.066 |
| All-window team: Collingwood | 239 | +1.113 | +0.805 | -0.308 |
| All-window team: Essendon | 227 | -5.785 | -5.116 | -0.669 |
| All-window team: Fremantle | 228 | -2.838 | -2.212 | -0.625 |
| All-window team: Geelong | 245 | +8.269 | +7.229 | -1.040 |
| All-window team: Gold Coast | 226 | -6.216 | -6.147 | -0.068 |
| All-window team: GWS Giants | 243 | +5.563 | +5.999 | +0.436 |
| All-window team: Hawthorn | 234 | +2.747 | +2.606 | -0.141 |
| All-window team: Melbourne | 235 | +1.498 | -0.394 | -1.104 |
| All-window team: North Melbourne | 225 | -5.962 | -4.351 | -1.611 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.708 | +0.650 |
| All-window team: Richmond | 233 | -3.519 | -3.012 | -0.507 |
| All-window team: St Kilda | 225 | -3.303 | -2.672 | -0.632 |
| All-window team: Sydney | 239 | +4.915 | +5.530 | +0.615 |
| All-window team: West Coast | 232 | -7.358 | -5.311 | -2.048 |
| All-window team: Western Bulldogs | 236 | +3.831 | +2.258 | -1.573 |
| All-window venue: Accor Stadium | 2 | -31.221 | -28.706 | -2.515 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +4.948 | -0.780 |
| All-window venue: Barossa Park | 7 | -2.214 | +0.417 | -1.798 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +18.769 | -0.619 |
| All-window venue: Carrara | 96 | -1.646 | -1.394 | -0.252 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +9.199 | +0.456 |
| All-window venue: Domain Stadium | 23 | +3.387 | +4.296 | +0.909 |
| All-window venue: Gabba | 118 | -1.488 | -1.346 | -0.142 |
| All-window venue: Hands Oval | 2 | -53.313 | -54.277 | +0.964 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -55.738 | -1.729 |
| All-window venue: Kardinia Park | 91 | +15.331 | +14.368 | -0.963 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.708 | +0.640 |
| All-window venue: Mars Stadium | 15 | +9.402 | +7.246 | -2.156 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.861 | -0.089 |
| All-window venue: MCG | 498 | -2.821 | -3.038 | +0.217 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -1.210 | -3.060 |
| All-window venue: Norwood Oval | 8 | +0.763 | -0.221 | -0.542 |
| All-window venue: Perth Stadium | 188 | -2.725 | -1.590 | -1.135 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +2.981 | +2.168 |
| All-window venue: SCG | 116 | +4.062 | +4.483 | +0.421 |
| All-window venue: Subiaco | 22 | -0.789 | +1.683 | +0.894 |
| All-window venue: Sydney Showground | 81 | +11.666 | +12.041 | +0.376 |
| All-window venue: TIO Stadium | 14 | +22.287 | +20.951 | -1.336 |
| All-window venue: Traeger Park | 9 | -18.905 | -21.022 | +2.117 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.685 | -0.302 |

</details>

<details><summary>t40-offset-c1: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +3.875 | -2.488 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.529 | -1.240 |
| Historical team: Carlton | 205 | -0.825 | -0.476 | -0.348 |
| Historical team: Collingwood | 215 | +1.878 | +1.683 | -0.195 |
| Historical team: Essendon | 204 | -5.111 | -3.743 | -1.368 |
| Historical team: Fremantle | 204 | -3.834 | -2.084 | -1.750 |
| Historical team: Geelong | 221 | +8.678 | +6.626 | -2.052 |
| Historical team: Gold Coast | 203 | -5.939 | -4.418 | -1.521 |
| Historical team: GWS Giants | 220 | +6.445 | +5.153 | -1.292 |
| Historical team: Hawthorn | 210 | +2.662 | +2.468 | -0.194 |
| Historical team: Melbourne | 211 | +0.901 | -1.618 | +0.717 |
| Historical team: North Melbourne | 202 | -6.038 | -3.147 | -2.890 |
| Historical team: Port Adelaide | 209 | +0.331 | -1.202 | +0.870 |
| Historical team: Richmond | 210 | -2.404 | -1.491 | -0.913 |
| Historical team: St Kilda | 202 | -3.956 | -2.847 | -1.109 |
| Historical team: Sydney | 216 | +3.567 | +2.205 | -1.362 |
| Historical team: West Coast | 209 | -7.765 | -3.856 | -3.909 |
| Historical team: Western Bulldogs | 212 | +5.101 | +2.176 | -2.925 |
| All-window team: Adelaide | 231 | +6.348 | +4.048 | -2.300 |
| All-window team: Brisbane Lions | 242 | -1.211 | -0.286 | -0.925 |
| All-window team: Carlton | 230 | +0.315 | +0.244 | -0.071 |
| All-window team: Collingwood | 239 | +1.113 | +0.784 | -0.329 |
| All-window team: Essendon | 227 | -5.785 | -4.370 | -1.415 |
| All-window team: Fremantle | 228 | -2.838 | -0.922 | -1.916 |
| All-window team: Geelong | 245 | +8.269 | +6.105 | -2.164 |
| All-window team: Gold Coast | 226 | -6.216 | -5.014 | -1.201 |
| All-window team: GWS Giants | 243 | +5.563 | +4.208 | -1.355 |
| All-window team: Hawthorn | 234 | +2.747 | +2.272 | -0.475 |
| All-window team: Melbourne | 235 | +1.498 | -1.101 | -0.397 |
| All-window team: North Melbourne | 225 | -5.962 | -2.842 | -3.120 |
| All-window team: Port Adelaide | 232 | +0.059 | -1.352 | +1.294 |
| All-window team: Richmond | 233 | -3.519 | -2.360 | -1.159 |
| All-window team: St Kilda | 225 | -3.303 | -2.064 | -1.239 |
| All-window team: Sydney | 239 | +4.915 | +3.763 | -1.152 |
| All-window team: West Coast | 232 | -7.358 | -3.464 | -3.894 |
| All-window team: Western Bulldogs | 236 | +3.831 | +1.298 | -2.533 |
| All-window venue: Accor Stadium | 2 | -31.221 | -27.877 | -3.345 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +4.148 | -1.580 |
| All-window venue: Barossa Park | 7 | -2.214 | +1.747 | -0.467 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +20.785 | +1.398 |
| All-window venue: Carrara | 96 | -1.646 | -0.451 | -1.195 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +9.431 | +0.688 |
| All-window venue: Domain Stadium | 23 | +3.387 | +4.296 | +0.909 |
| All-window venue: Gabba | 118 | -1.488 | -0.168 | -1.319 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.236 | -0.077 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -51.913 | -5.554 |
| All-window venue: Kardinia Park | 91 | +15.331 | +13.247 | -2.084 |
| All-window venue: Manuka Oval | 30 | +3.068 | +1.600 | -1.468 |
| All-window venue: Mars Stadium | 15 | +9.402 | +6.180 | -3.221 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.730 | -0.220 |
| All-window venue: MCG | 498 | -2.821 | -2.900 | +0.079 |
| All-window venue: Ninja Stadium | 24 | -4.270 | +0.233 | -4.037 |
| All-window venue: Norwood Oval | 8 | +0.763 | -1.530 | +0.766 |
| All-window venue: Perth Stadium | 188 | -2.725 | +0.212 | -2.513 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +5.614 | +4.800 |
| All-window venue: SCG | 116 | +4.062 | +2.755 | -1.307 |
| All-window venue: Subiaco | 22 | -0.789 | +2.681 | +1.892 |
| All-window venue: Sydney Showground | 81 | +11.666 | +9.879 | -1.787 |
| All-window venue: TIO Stadium | 14 | +22.287 | +21.055 | -1.232 |
| All-window venue: Traeger Park | 9 | -18.905 | -20.920 | +2.015 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +3.627 | -1.360 |

</details>

<details><summary>t40-offset-k08: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +3.234 | -3.128 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.518 | -1.251 |
| Historical team: Carlton | 205 | -0.825 | -0.521 | -0.304 |
| Historical team: Collingwood | 215 | +1.878 | +1.430 | -0.448 |
| Historical team: Essendon | 204 | -5.111 | -3.553 | -1.558 |
| Historical team: Fremantle | 204 | -3.834 | -2.363 | -1.471 |
| Historical team: Geelong | 221 | +8.678 | +5.719 | -2.960 |
| Historical team: Gold Coast | 203 | -5.939 | -4.502 | -1.437 |
| Historical team: GWS Giants | 220 | +6.445 | +4.781 | -1.665 |
| Historical team: Hawthorn | 210 | +2.662 | +2.511 | -0.152 |
| Historical team: Melbourne | 211 | +0.901 | -1.287 | +0.386 |
| Historical team: North Melbourne | 202 | -6.038 | -2.779 | -3.258 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.861 | +0.530 |
| Historical team: Richmond | 210 | -2.404 | -1.114 | -1.290 |
| Historical team: St Kilda | 202 | -3.956 | -2.423 | -1.533 |
| Historical team: Sydney | 216 | +3.567 | +2.416 | -1.151 |
| Historical team: West Coast | 209 | -7.765 | -3.656 | -4.109 |
| Historical team: Western Bulldogs | 212 | +5.101 | +2.342 | -2.759 |
| All-window team: Adelaide | 231 | +6.348 | +3.358 | -2.990 |
| All-window team: Brisbane Lions | 242 | -1.211 | -0.219 | -0.991 |
| All-window team: Carlton | 230 | +0.315 | +0.321 | +0.006 |
| All-window team: Collingwood | 239 | +1.113 | +0.656 | -0.457 |
| All-window team: Essendon | 227 | -5.785 | -4.019 | -1.766 |
| All-window team: Fremantle | 228 | -2.838 | -1.349 | -1.489 |
| All-window team: Geelong | 245 | +8.269 | +5.337 | -2.932 |
| All-window team: Gold Coast | 226 | -6.216 | -5.015 | -1.200 |
| All-window team: GWS Giants | 243 | +5.563 | +4.018 | -1.545 |
| All-window team: Hawthorn | 234 | +2.747 | +2.306 | -0.441 |
| All-window team: Melbourne | 235 | +1.498 | -0.870 | -0.628 |
| All-window team: North Melbourne | 225 | -5.962 | -2.764 | -3.198 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.964 | +0.906 |
| All-window team: Richmond | 233 | -3.519 | -1.857 | -1.662 |
| All-window team: St Kilda | 225 | -3.303 | -1.789 | -1.514 |
| All-window team: Sydney | 239 | +4.915 | +3.814 | -1.101 |
| All-window team: West Coast | 232 | -7.358 | -3.506 | -3.853 |
| All-window team: Western Bulldogs | 236 | +3.831 | +1.543 | -2.287 |
| All-window venue: Accor Stadium | 2 | -31.221 | -28.478 | -2.743 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +4.051 | -1.677 |
| All-window venue: Barossa Park | 7 | -2.214 | +2.008 | -0.206 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +20.092 | +0.704 |
| All-window venue: Carrara | 96 | -1.646 | -0.315 | -1.331 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +9.031 | +0.288 |
| All-window venue: Domain Stadium | 23 | +3.387 | +4.978 | +1.591 |
| All-window venue: Gabba | 118 | -1.488 | -0.246 | -1.242 |
| All-window venue: Hands Oval | 2 | -53.313 | -54.187 | +0.874 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -52.232 | -5.235 |
| All-window venue: Kardinia Park | 91 | +15.331 | +12.620 | -2.711 |
| All-window venue: Manuka Oval | 30 | +3.068 | +2.020 | -1.048 |
| All-window venue: Mars Stadium | 15 | +9.402 | +6.479 | -2.923 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.632 | -0.318 |
| All-window venue: MCG | 498 | -2.821 | -2.688 | -0.133 |
| All-window venue: Ninja Stadium | 24 | -4.270 | +1.216 | -3.054 |
| All-window venue: Norwood Oval | 8 | +0.763 | -0.806 | +0.043 |
| All-window venue: Perth Stadium | 188 | -2.725 | -0.283 | -2.443 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +4.736 | +3.922 |
| All-window venue: SCG | 116 | +4.062 | +2.807 | -1.256 |
| All-window venue: Subiaco | 22 | -0.789 | +3.276 | +2.487 |
| All-window venue: Sydney Showground | 81 | +11.666 | +9.783 | -1.883 |
| All-window venue: TIO Stadium | 14 | +22.287 | +20.490 | -1.797 |
| All-window venue: Traeger Park | 9 | -18.905 | -20.715 | +1.810 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +3.987 | -1.001 |

</details>

<details><summary>t40-offset-k16: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +3.705 | -2.658 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.822 | -0.947 |
| Historical team: Carlton | 205 | -0.825 | -0.576 | -0.248 |
| Historical team: Collingwood | 215 | +1.878 | +1.495 | -0.383 |
| Historical team: Essendon | 204 | -5.111 | -3.779 | -1.332 |
| Historical team: Fremantle | 204 | -3.834 | -2.601 | -1.233 |
| Historical team: Geelong | 221 | +8.678 | +6.330 | -2.349 |
| Historical team: Gold Coast | 203 | -5.939 | -4.818 | -1.121 |
| Historical team: GWS Giants | 220 | +6.445 | +5.347 | -1.099 |
| Historical team: Hawthorn | 210 | +2.662 | +2.504 | -0.158 |
| Historical team: Melbourne | 211 | +0.901 | -1.158 | +0.257 |
| Historical team: North Melbourne | 202 | -6.038 | -3.305 | -2.732 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.758 | +0.427 |
| Historical team: Richmond | 210 | -2.404 | -1.411 | -0.994 |
| Historical team: St Kilda | 202 | -3.956 | -2.757 | -1.199 |
| Historical team: Sydney | 216 | +3.567 | +2.935 | -0.632 |
| Historical team: West Coast | 209 | -7.765 | -4.100 | -3.665 |
| Historical team: Western Bulldogs | 212 | +5.101 | +2.507 | -2.594 |
| All-window team: Adelaide | 231 | +6.348 | +3.845 | -2.503 |
| All-window team: Brisbane Lions | 242 | -1.211 | -0.488 | -0.723 |
| All-window team: Carlton | 230 | +0.315 | +0.279 | -0.036 |
| All-window team: Collingwood | 239 | +1.113 | +0.685 | -0.427 |
| All-window team: Essendon | 227 | -5.785 | -4.324 | -1.461 |
| All-window team: Fremantle | 228 | -2.838 | -1.507 | -1.331 |
| All-window team: Geelong | 245 | +8.269 | +5.923 | -2.346 |
| All-window team: Gold Coast | 226 | -6.216 | -5.326 | -0.889 |
| All-window team: GWS Giants | 243 | +5.563 | +4.550 | -1.013 |
| All-window team: Hawthorn | 234 | +2.747 | +2.336 | -0.411 |
| All-window team: Melbourne | 235 | +1.498 | -0.742 | -0.756 |
| All-window team: North Melbourne | 225 | -5.962 | -3.225 | -2.736 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.897 | +0.838 |
| All-window team: Richmond | 233 | -3.519 | -2.224 | -1.295 |
| All-window team: St Kilda | 225 | -3.303 | -2.073 | -1.230 |
| All-window team: Sydney | 239 | +4.915 | +4.336 | -0.579 |
| All-window team: West Coast | 232 | -7.358 | -3.958 | -3.400 |
| All-window team: Western Bulldogs | 236 | +3.831 | +1.705 | -2.126 |
| All-window venue: Accor Stadium | 2 | -31.221 | -28.282 | -2.940 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +4.295 | -1.433 |
| All-window venue: Barossa Park | 7 | -2.214 | +1.503 | -0.711 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.846 | +0.458 |
| All-window venue: Carrara | 96 | -1.646 | -0.639 | -1.007 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +9.196 | +0.453 |
| All-window venue: Domain Stadium | 23 | +3.387 | +4.668 | +1.281 |
| All-window venue: Gabba | 118 | -1.488 | -0.545 | -0.942 |
| All-window venue: Hands Oval | 2 | -53.313 | -54.107 | +0.794 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -52.958 | -4.509 |
| All-window venue: Kardinia Park | 91 | +15.331 | +13.109 | -2.222 |
| All-window venue: Manuka Oval | 30 | +3.068 | +2.296 | -0.772 |
| All-window venue: Mars Stadium | 15 | +9.402 | +6.739 | -2.663 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.713 | -0.237 |
| All-window venue: MCG | 498 | -2.821 | -2.824 | +0.003 |
| All-window venue: Ninja Stadium | 24 | -4.270 | +0.369 | -3.902 |
| All-window venue: Norwood Oval | 8 | +0.763 | -0.708 | -0.056 |
| All-window venue: Perth Stadium | 188 | -2.725 | -0.532 | -2.193 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +4.511 | +3.698 |
| All-window venue: SCG | 116 | +4.062 | +3.322 | -0.740 |
| All-window venue: Subiaco | 22 | -0.789 | +2.773 | +1.984 |
| All-window venue: Sydney Showground | 81 | +11.666 | +10.369 | -1.297 |
| All-window venue: TIO Stadium | 14 | +22.287 | +20.652 | -1.635 |
| All-window venue: Traeger Park | 9 | -18.905 | -20.767 | +1.863 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.072 | -0.915 |

</details>

<details><summary>t40-offset-tail: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +4.971 | -1.392 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.744 | -0.025 |
| Historical team: Carlton | 205 | -0.825 | -0.271 | -0.554 |
| Historical team: Collingwood | 215 | +1.878 | +1.485 | -0.393 |
| Historical team: Essendon | 204 | -5.111 | -4.330 | -0.782 |
| Historical team: Fremantle | 204 | -3.834 | -3.278 | -0.557 |
| Historical team: Geelong | 221 | +8.678 | +7.938 | -0.740 |
| Historical team: Gold Coast | 203 | -5.939 | -5.195 | -0.744 |
| Historical team: GWS Giants | 220 | +6.445 | +7.114 | +0.669 |
| Historical team: Hawthorn | 210 | +2.662 | +2.251 | -0.411 |
| Historical team: Melbourne | 211 | +0.901 | -1.148 | +0.247 |
| Historical team: North Melbourne | 202 | -6.038 | -4.432 | -1.606 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.763 | +0.432 |
| Historical team: Richmond | 210 | -2.404 | -2.230 | -0.174 |
| Historical team: St Kilda | 202 | -3.956 | -3.876 | -0.080 |
| Historical team: Sydney | 216 | +3.567 | +4.368 | +0.801 |
| Historical team: West Coast | 209 | -7.765 | -5.044 | -2.721 |
| Historical team: Western Bulldogs | 212 | +5.101 | +2.629 | -2.472 |
| All-window team: Adelaide | 231 | +6.348 | +5.261 | -1.087 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.372 | +0.161 |
| All-window team: Carlton | 230 | +0.315 | +0.655 | +0.340 |
| All-window team: Collingwood | 239 | +1.113 | +0.547 | -0.566 |
| All-window team: Essendon | 227 | -5.785 | -5.045 | -0.739 |
| All-window team: Fremantle | 228 | -2.838 | -1.980 | -0.858 |
| All-window team: Geelong | 245 | +8.269 | +7.515 | -0.754 |
| All-window team: Gold Coast | 226 | -6.216 | -5.790 | -0.425 |
| All-window team: GWS Giants | 243 | +5.563 | +6.255 | +0.692 |
| All-window team: Hawthorn | 234 | +2.747 | +2.181 | -0.566 |
| All-window team: Melbourne | 235 | +1.498 | -0.771 | -0.727 |
| All-window team: North Melbourne | 225 | -5.962 | -4.245 | -1.717 |
| All-window team: Port Adelaide | 232 | +0.059 | -1.011 | +0.953 |
| All-window team: Richmond | 233 | -3.519 | -3.172 | -0.346 |
| All-window team: St Kilda | 225 | -3.303 | -3.062 | -0.241 |
| All-window team: Sydney | 239 | +4.915 | +5.728 | +0.813 |
| All-window team: West Coast | 232 | -7.358 | -4.927 | -2.432 |
| All-window team: Western Bulldogs | 236 | +3.831 | +1.874 | -1.957 |
| All-window venue: Accor Stadium | 2 | -31.221 | -28.397 | -2.825 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +4.631 | -1.096 |
| All-window venue: Barossa Park | 7 | -2.214 | +0.152 | -2.062 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +18.926 | -0.462 |
| All-window venue: Carrara | 96 | -1.646 | -1.577 | -0.069 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.700 | -0.044 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.304 | -0.082 |
| All-window venue: Gabba | 118 | -1.488 | -1.800 | +0.312 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.943 | +0.631 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -56.139 | -1.328 |
| All-window venue: Kardinia Park | 91 | +15.331 | +14.148 | -1.183 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.870 | +0.802 |
| All-window venue: Mars Stadium | 15 | +9.402 | +6.552 | -2.849 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -4.328 | +0.378 |
| All-window venue: MCG | 498 | -2.821 | -3.389 | +0.568 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -1.920 | -2.351 |
| All-window venue: Norwood Oval | 8 | +0.763 | -0.994 | +0.230 |
| All-window venue: Perth Stadium | 188 | -2.725 | -1.481 | -1.245 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +2.874 | +2.061 |
| All-window venue: SCG | 116 | +4.062 | +4.247 | +0.184 |
| All-window venue: Subiaco | 22 | -0.789 | +1.029 | +0.239 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.906 | +0.240 |
| All-window venue: TIO Stadium | 14 | +22.287 | +20.717 | -1.570 |
| All-window venue: Traeger Park | 9 | -18.905 | -21.098 | +2.193 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +3.840 | -1.147 |

</details>

<details><summary>t40-offset-v4: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +4.243 | -2.119 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.160 | -0.609 |
| Historical team: Carlton | 205 | -0.825 | -0.609 | -0.216 |
| Historical team: Collingwood | 215 | +1.878 | +1.574 | -0.304 |
| Historical team: Essendon | 204 | -5.111 | -4.027 | -1.085 |
| Historical team: Fremantle | 204 | -3.834 | -2.862 | -0.973 |
| Historical team: Geelong | 221 | +8.678 | +7.024 | -1.654 |
| Historical team: Gold Coast | 203 | -5.939 | -5.159 | -0.780 |
| Historical team: GWS Giants | 220 | +6.445 | +5.983 | -0.462 |
| Historical team: Hawthorn | 210 | +2.662 | +2.482 | -0.181 |
| Historical team: Melbourne | 211 | +0.901 | -1.024 | +0.123 |
| Historical team: North Melbourne | 202 | -6.038 | -3.917 | -2.120 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.649 | +0.318 |
| Historical team: Richmond | 210 | -2.404 | -1.729 | -0.676 |
| Historical team: St Kilda | 202 | -3.956 | -3.120 | -0.836 |
| Historical team: Sydney | 216 | +3.567 | +3.518 | -0.049 |
| Historical team: West Coast | 209 | -7.765 | -4.637 | -3.128 |
| Historical team: Western Bulldogs | 212 | +5.101 | +2.669 | -2.432 |
| All-window team: Adelaide | 231 | +6.348 | +4.415 | -1.933 |
| All-window team: Brisbane Lions | 242 | -1.211 | -0.789 | -0.422 |
| All-window team: Carlton | 230 | +0.315 | +0.265 | -0.050 |
| All-window team: Collingwood | 239 | +1.113 | +0.727 | -0.386 |
| All-window team: Essendon | 227 | -5.785 | -4.669 | -1.116 |
| All-window team: Fremantle | 228 | -2.838 | -1.677 | -1.160 |
| All-window team: Geelong | 245 | +8.269 | +6.600 | -1.669 |
| All-window team: Gold Coast | 226 | -6.216 | -5.658 | -0.558 |
| All-window team: GWS Giants | 243 | +5.563 | +5.159 | -0.405 |
| All-window team: Hawthorn | 234 | +2.747 | +2.361 | -0.385 |
| All-window team: Melbourne | 235 | +1.498 | -0.614 | -0.884 |
| All-window team: North Melbourne | 225 | -5.962 | -3.770 | -2.192 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.835 | +0.776 |
| All-window team: Richmond | 233 | -3.519 | -2.635 | -0.884 |
| All-window team: St Kilda | 225 | -3.303 | -2.382 | -0.922 |
| All-window team: Sydney | 239 | +4.915 | +4.918 | +0.003 |
| All-window team: West Coast | 232 | -7.358 | -4.515 | -2.844 |
| All-window team: Western Bulldogs | 236 | +3.831 | +1.873 | -1.958 |
| All-window venue: Accor Stadium | 2 | -31.221 | -28.231 | -2.991 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +4.579 | -1.149 |
| All-window venue: Barossa Park | 7 | -2.214 | +0.995 | -1.219 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.533 | +0.146 |
| All-window venue: Carrara | 96 | -1.646 | -0.978 | -0.668 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +9.332 | +0.588 |
| All-window venue: Domain Stadium | 23 | +3.387 | +4.296 | +0.909 |
| All-window venue: Gabba | 118 | -1.488 | -0.883 | -0.604 |
| All-window venue: Hands Oval | 2 | -53.313 | -54.018 | +0.705 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -53.846 | -3.621 |
| All-window venue: Kardinia Park | 91 | +15.331 | +13.706 | -1.625 |
| All-window venue: Manuka Oval | 30 | +3.068 | +2.728 | -0.340 |
| All-window venue: Mars Stadium | 15 | +9.402 | +6.902 | -2.500 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.800 | -0.150 |
| All-window venue: MCG | 498 | -2.821 | -2.951 | +0.130 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -0.583 | -3.688 |
| All-window venue: Norwood Oval | 8 | +0.763 | -0.574 | -0.189 |
| All-window venue: Perth Stadium | 188 | -2.725 | -0.836 | -1.890 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +4.138 | +3.324 |
| All-window venue: SCG | 116 | +4.062 | +3.883 | -0.179 |
| All-window venue: Subiaco | 22 | -0.789 | +2.253 | +1.464 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.032 | -0.634 |
| All-window venue: TIO Stadium | 14 | +22.287 | +20.852 | -1.435 |
| All-window venue: Traeger Park | 9 | -18.905 | -20.847 | +1.943 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.162 | -0.826 |

</details>

<details><summary>t40-pav-corrected: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.373 | +0.011 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.770 | +0.001 |
| Historical team: Carlton | 205 | -0.825 | -0.820 | -0.004 |
| Historical team: Collingwood | 215 | +1.878 | +1.868 | -0.010 |
| Historical team: Essendon | 204 | -5.111 | -5.114 | +0.003 |
| Historical team: Fremantle | 204 | -3.834 | -3.831 | -0.003 |
| Historical team: Geelong | 221 | +8.678 | +8.685 | +0.006 |
| Historical team: Gold Coast | 203 | -5.939 | -5.936 | -0.003 |
| Historical team: GWS Giants | 220 | +6.445 | +6.441 | -0.004 |
| Historical team: Hawthorn | 210 | +2.662 | +2.662 | -0.000 |
| Historical team: Melbourne | 211 | +0.901 | +0.923 | +0.023 |
| Historical team: North Melbourne | 202 | -6.038 | -6.061 | +0.024 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.334 | +0.002 |
| Historical team: Richmond | 210 | -2.404 | -2.413 | +0.008 |
| Historical team: St Kilda | 202 | -3.956 | -3.953 | -0.002 |
| Historical team: Sydney | 216 | +3.567 | +3.563 | -0.004 |
| Historical team: West Coast | 209 | -7.765 | -7.791 | +0.025 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.125 | +0.024 |
| All-window team: Adelaide | 231 | +6.348 | +6.363 | +0.015 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.207 | -0.004 |
| All-window team: Carlton | 230 | +0.315 | +0.320 | +0.005 |
| All-window team: Collingwood | 239 | +1.113 | +1.106 | -0.006 |
| All-window team: Essendon | 227 | -5.785 | -5.795 | +0.010 |
| All-window team: Fremantle | 228 | -2.838 | -2.826 | -0.012 |
| All-window team: Geelong | 245 | +8.269 | +8.273 | +0.004 |
| All-window team: Gold Coast | 226 | -6.216 | -6.216 | +0.000 |
| All-window team: GWS Giants | 243 | +5.563 | +5.555 | -0.008 |
| All-window team: Hawthorn | 234 | +2.747 | +2.748 | +0.001 |
| All-window team: Melbourne | 235 | +1.498 | +1.519 | +0.021 |
| All-window team: North Melbourne | 225 | -5.962 | -5.982 | +0.020 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.063 | +0.004 |
| All-window team: Richmond | 233 | -3.519 | -3.537 | +0.018 |
| All-window team: St Kilda | 225 | -3.303 | -3.300 | -0.004 |
| All-window team: Sydney | 239 | +4.915 | +4.918 | +0.003 |
| All-window team: West Coast | 232 | -7.358 | -7.390 | +0.032 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.851 | +0.021 |
| All-window venue: Accor Stadium | 2 | -31.221 | -31.227 | +0.006 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.733 | +0.006 |
| All-window venue: Barossa Park | 7 | -2.214 | -2.231 | +0.017 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.349 | -0.038 |
| All-window venue: Carrara | 96 | -1.646 | -1.647 | +0.001 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.764 | +0.021 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.383 | -0.004 |
| All-window venue: Gabba | 118 | -1.488 | -1.486 | -0.002 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.332 | +0.019 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.467 | 0.000 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.333 | +0.003 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.052 | -0.017 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.422 | +0.020 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.951 | +0.001 |
| All-window venue: MCG | 498 | -2.821 | -2.822 | +0.001 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.294 | +0.024 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.779 | +0.015 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.734 | +0.008 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.798 | -0.016 |
| All-window venue: SCG | 116 | +4.062 | +4.066 | +0.004 |
| All-window venue: Subiaco | 22 | -0.789 | -0.794 | +0.005 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.672 | +0.006 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.275 | -0.012 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.838 | -0.067 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.986 | -0.002 |

</details>

<details><summary>t40-pav-current: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.374 | +0.012 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.771 | +0.002 |
| Historical team: Carlton | 205 | -0.825 | -0.819 | -0.006 |
| Historical team: Collingwood | 215 | +1.878 | +1.867 | -0.011 |
| Historical team: Essendon | 204 | -5.111 | -5.109 | -0.003 |
| Historical team: Fremantle | 204 | -3.834 | -3.830 | -0.004 |
| Historical team: Geelong | 221 | +8.678 | +8.680 | +0.002 |
| Historical team: Gold Coast | 203 | -5.939 | -5.935 | -0.005 |
| Historical team: GWS Giants | 220 | +6.445 | +6.443 | -0.003 |
| Historical team: Hawthorn | 210 | +2.662 | +2.663 | +0.000 |
| Historical team: Melbourne | 211 | +0.901 | +0.917 | +0.016 |
| Historical team: North Melbourne | 202 | -6.038 | -6.053 | +0.015 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.330 | -0.002 |
| Historical team: Richmond | 210 | -2.404 | -2.411 | +0.007 |
| Historical team: St Kilda | 202 | -3.956 | -3.952 | -0.004 |
| Historical team: Sydney | 216 | +3.567 | +3.559 | -0.008 |
| Historical team: West Coast | 209 | -7.765 | -7.785 | +0.020 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.118 | +0.017 |
| All-window team: Adelaide | 231 | +6.348 | +6.364 | +0.016 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.209 | -0.002 |
| All-window team: Carlton | 230 | +0.315 | +0.321 | +0.007 |
| All-window team: Collingwood | 239 | +1.113 | +1.105 | -0.007 |
| All-window team: Essendon | 227 | -5.785 | -5.789 | +0.004 |
| All-window team: Fremantle | 228 | -2.838 | -2.825 | -0.013 |
| All-window team: Geelong | 245 | +8.269 | +8.269 | -0.000 |
| All-window team: Gold Coast | 226 | -6.216 | -6.215 | -0.001 |
| All-window team: GWS Giants | 243 | +5.563 | +5.557 | -0.006 |
| All-window team: Hawthorn | 234 | +2.747 | +2.748 | +0.001 |
| All-window team: Melbourne | 235 | +1.498 | +1.514 | +0.016 |
| All-window team: North Melbourne | 225 | -5.962 | -5.974 | +0.012 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.059 | +0.000 |
| All-window team: Richmond | 233 | -3.519 | -3.536 | +0.017 |
| All-window team: St Kilda | 225 | -3.303 | -3.298 | -0.005 |
| All-window team: Sydney | 239 | +4.915 | +4.914 | -0.001 |
| All-window team: West Coast | 232 | -7.358 | -7.384 | +0.026 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.845 | +0.014 |
| All-window venue: Accor Stadium | 2 | -31.221 | -31.221 | 0.000 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.734 | +0.006 |
| All-window venue: Barossa Park | 7 | -2.214 | -2.220 | +0.006 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.352 | -0.036 |
| All-window venue: Carrara | 96 | -1.646 | -1.645 | -0.001 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.754 | +0.011 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.387 | 0.000 |
| All-window venue: Gabba | 118 | -1.488 | -1.486 | -0.001 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.334 | +0.021 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.467 | 0.000 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.329 | -0.002 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.056 | -0.012 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.415 | +0.014 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.949 | -0.001 |
| All-window venue: MCG | 498 | -2.821 | -2.822 | +0.001 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.284 | +0.014 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.776 | +0.013 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.731 | +0.005 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.789 | -0.024 |
| All-window venue: SCG | 116 | +4.062 | +4.062 | -0.000 |
| All-window venue: Subiaco | 22 | -0.789 | -0.793 | +0.004 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.671 | +0.006 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.268 | -0.018 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.842 | -0.063 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.985 | -0.003 |

</details>

<details><summary>t40-pav-normalized: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.375 | +0.012 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.777 | +0.008 |
| Historical team: Carlton | 205 | -0.825 | -0.830 | +0.005 |
| Historical team: Collingwood | 215 | +1.878 | +1.868 | -0.010 |
| Historical team: Essendon | 204 | -5.111 | -5.110 | -0.001 |
| Historical team: Fremantle | 204 | -3.834 | -3.826 | -0.008 |
| Historical team: Geelong | 221 | +8.678 | +8.700 | +0.022 |
| Historical team: Gold Coast | 203 | -5.939 | -5.934 | -0.005 |
| Historical team: GWS Giants | 220 | +6.445 | +6.444 | -0.002 |
| Historical team: Hawthorn | 210 | +2.662 | +2.660 | -0.002 |
| Historical team: Melbourne | 211 | +0.901 | +0.900 | -0.001 |
| Historical team: North Melbourne | 202 | -6.038 | -6.050 | +0.013 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.336 | +0.005 |
| Historical team: Richmond | 210 | -2.404 | -2.416 | +0.012 |
| Historical team: St Kilda | 202 | -3.956 | -3.966 | +0.010 |
| Historical team: Sydney | 216 | +3.567 | +3.569 | +0.002 |
| Historical team: West Coast | 209 | -7.765 | -7.772 | +0.007 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.114 | +0.013 |
| All-window team: Adelaide | 231 | +6.348 | +6.358 | +0.010 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.212 | +0.001 |
| All-window team: Carlton | 230 | +0.315 | +0.313 | -0.002 |
| All-window team: Collingwood | 239 | +1.113 | +1.097 | -0.016 |
| All-window team: Essendon | 227 | -5.785 | -5.783 | -0.002 |
| All-window team: Fremantle | 228 | -2.838 | -2.832 | -0.005 |
| All-window team: Geelong | 245 | +8.269 | +8.288 | +0.019 |
| All-window team: Gold Coast | 226 | -6.216 | -6.212 | -0.004 |
| All-window team: GWS Giants | 243 | +5.563 | +5.556 | -0.007 |
| All-window team: Hawthorn | 234 | +2.747 | +2.747 | -0.000 |
| All-window team: Melbourne | 235 | +1.498 | +1.502 | +0.004 |
| All-window team: North Melbourne | 225 | -5.962 | -5.970 | +0.008 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.065 | +0.007 |
| All-window team: Richmond | 233 | -3.519 | -3.535 | +0.016 |
| All-window team: St Kilda | 225 | -3.303 | -3.312 | +0.008 |
| All-window team: Sydney | 239 | +4.915 | +4.914 | -0.001 |
| All-window team: West Coast | 232 | -7.358 | -7.362 | +0.004 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.842 | +0.012 |
| All-window venue: Accor Stadium | 2 | -31.221 | -31.227 | +0.006 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.732 | +0.004 |
| All-window venue: Barossa Park | 7 | -2.214 | -2.220 | +0.006 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.337 | -0.050 |
| All-window venue: Carrara | 96 | -1.646 | -1.640 | -0.006 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.749 | +0.006 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.383 | -0.004 |
| All-window venue: Gabba | 118 | -1.488 | -1.487 | -0.001 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.233 | -0.079 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.467 | 0.000 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.351 | +0.020 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.044 | -0.024 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.410 | +0.008 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.951 | +0.001 |
| All-window venue: MCG | 498 | -2.821 | -2.826 | +0.005 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.278 | +0.007 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.775 | +0.012 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.720 | -0.006 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.712 | -0.102 |
| All-window venue: SCG | 116 | +4.062 | +4.063 | +0.001 |
| All-window venue: Subiaco | 22 | -0.789 | -0.787 | -0.002 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.675 | +0.009 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.277 | -0.010 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.871 | -0.033 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.983 | -0.005 |

</details>

<details><summary>t40-points: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +4.442 | -1.921 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.595 | -1.174 |
| Historical team: Carlton | 205 | -0.825 | -1.880 | +1.056 |
| Historical team: Collingwood | 215 | +1.878 | +2.775 | +0.897 |
| Historical team: Essendon | 204 | -5.111 | -3.279 | -1.832 |
| Historical team: Fremantle | 204 | -3.834 | -2.933 | -0.901 |
| Historical team: Geelong | 221 | +8.678 | +7.244 | -1.434 |
| Historical team: Gold Coast | 203 | -5.939 | -5.493 | -0.447 |
| Historical team: GWS Giants | 220 | +6.445 | +5.836 | -0.609 |
| Historical team: Hawthorn | 210 | +2.662 | +2.709 | +0.047 |
| Historical team: Melbourne | 211 | +0.901 | +0.244 | -0.657 |
| Historical team: North Melbourne | 202 | -6.038 | -6.532 | +0.494 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.241 | -0.091 |
| Historical team: Richmond | 210 | -2.404 | -1.637 | -0.767 |
| Historical team: St Kilda | 202 | -3.956 | -4.040 | +0.084 |
| Historical team: Sydney | 216 | +3.567 | +3.154 | -0.413 |
| Historical team: West Coast | 209 | -7.765 | -6.302 | -1.463 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.892 | -0.209 |
| All-window team: Adelaide | 231 | +6.348 | +4.591 | -1.757 |
| All-window team: Brisbane Lions | 242 | -1.211 | +0.012 | -1.199 |
| All-window team: Carlton | 230 | +0.315 | -0.637 | +0.322 |
| All-window team: Collingwood | 239 | +1.113 | +2.001 | +0.889 |
| All-window team: Essendon | 227 | -5.785 | -4.216 | -1.569 |
| All-window team: Fremantle | 228 | -2.838 | -1.706 | -1.132 |
| All-window team: Geelong | 245 | +8.269 | +6.744 | -1.525 |
| All-window team: Gold Coast | 226 | -6.216 | -5.971 | -0.245 |
| All-window team: GWS Giants | 243 | +5.563 | +5.096 | -0.467 |
| All-window team: Hawthorn | 234 | +2.747 | +2.842 | +0.095 |
| All-window team: Melbourne | 235 | +1.498 | +0.811 | -0.687 |
| All-window team: North Melbourne | 225 | -5.962 | -6.208 | +0.246 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.588 | +0.529 |
| All-window team: Richmond | 233 | -3.519 | -2.688 | -0.831 |
| All-window team: St Kilda | 225 | -3.303 | -3.576 | +0.273 |
| All-window team: Sydney | 239 | +4.915 | +4.613 | -0.302 |
| All-window team: West Coast | 232 | -7.358 | -5.873 | -1.485 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.297 | -0.534 |
| All-window venue: Accor Stadium | 2 | -31.221 | -29.183 | -2.038 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +4.635 | -1.092 |
| All-window venue: Barossa Park | 7 | -2.214 | -1.599 | -0.615 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +20.560 | +1.172 |
| All-window venue: Carrara | 96 | -1.646 | -1.413 | -0.233 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +11.473 | +2.730 |
| All-window venue: Domain Stadium | 23 | +3.387 | +2.080 | -1.307 |
| All-window venue: Gabba | 118 | -1.488 | +0.204 | -1.284 |
| All-window venue: Hands Oval | 2 | -53.313 | -56.775 | +3.462 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -54.045 | -3.422 |
| All-window venue: Kardinia Park | 91 | +15.331 | +14.088 | -1.242 |
| All-window venue: Manuka Oval | 30 | +3.068 | +2.074 | -0.994 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.070 | -0.331 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.805 | -0.146 |
| All-window venue: MCG | 498 | -2.821 | -2.787 | -0.034 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.394 | +0.124 |
| All-window venue: Norwood Oval | 8 | +0.763 | -0.917 | +0.153 |
| All-window venue: Perth Stadium | 188 | -2.725 | -0.735 | -1.991 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +1.952 | +1.138 |
| All-window venue: SCG | 116 | +4.062 | +4.121 | +0.059 |
| All-window venue: Subiaco | 22 | -0.789 | -1.119 | +0.330 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.125 | -0.541 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.773 | +0.486 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.945 | +0.040 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.514 | -0.473 |

</details>

<details><summary>t40-position: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +5.581 | -0.782 |
| Historical team: Brisbane Lions | 219 | -1.769 | -2.251 | +0.482 |
| Historical team: Carlton | 205 | -0.825 | -0.527 | -0.298 |
| Historical team: Collingwood | 215 | +1.878 | +1.889 | +0.011 |
| Historical team: Essendon | 204 | -5.111 | -3.761 | -1.350 |
| Historical team: Fremantle | 204 | -3.834 | -4.139 | +0.305 |
| Historical team: Geelong | 221 | +8.678 | +8.220 | -0.459 |
| Historical team: Gold Coast | 203 | -5.939 | -5.321 | -0.618 |
| Historical team: GWS Giants | 220 | +6.445 | +5.736 | -0.709 |
| Historical team: Hawthorn | 210 | +2.662 | +3.329 | +0.667 |
| Historical team: Melbourne | 211 | +0.901 | +0.265 | -0.636 |
| Historical team: North Melbourne | 202 | -6.038 | -5.009 | -1.029 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.031 | -0.301 |
| Historical team: Richmond | 210 | -2.404 | -2.448 | +0.043 |
| Historical team: St Kilda | 202 | -3.956 | -3.747 | -0.209 |
| Historical team: Sydney | 216 | +3.567 | +2.843 | -0.724 |
| Historical team: West Coast | 209 | -7.765 | -8.245 | +0.480 |
| Historical team: Western Bulldogs | 212 | +5.101 | +6.085 | +0.984 |
| All-window team: Adelaide | 231 | +6.348 | +5.621 | -0.727 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.723 | +0.512 |
| All-window team: Carlton | 230 | +0.315 | +0.714 | +0.400 |
| All-window team: Collingwood | 239 | +1.113 | +1.072 | -0.041 |
| All-window team: Essendon | 227 | -5.785 | -4.256 | -1.529 |
| All-window team: Fremantle | 228 | -2.838 | -3.512 | +0.675 |
| All-window team: Geelong | 245 | +8.269 | +7.783 | -0.486 |
| All-window team: Gold Coast | 226 | -6.216 | -5.833 | -0.383 |
| All-window team: GWS Giants | 243 | +5.563 | +4.744 | -0.819 |
| All-window team: Hawthorn | 234 | +2.747 | +3.167 | +0.420 |
| All-window team: Melbourne | 235 | +1.498 | +1.020 | -0.479 |
| All-window team: North Melbourne | 225 | -5.962 | -5.061 | -0.901 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.212 | +0.153 |
| All-window team: Richmond | 233 | -3.519 | -3.437 | -0.082 |
| All-window team: St Kilda | 225 | -3.303 | -3.037 | -0.267 |
| All-window team: Sydney | 239 | +4.915 | +4.268 | -0.647 |
| All-window team: West Coast | 232 | -7.358 | -7.512 | +0.154 |
| All-window team: Western Bulldogs | 236 | +3.831 | +4.819 | +0.988 |
| All-window venue: Accor Stadium | 2 | -31.221 | -29.923 | -1.298 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.212 | -0.516 |
| All-window venue: Barossa Park | 7 | -2.214 | -1.108 | -1.106 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.744 | +0.357 |
| All-window venue: Carrara | 96 | -1.646 | -1.152 | -0.494 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.414 | -0.329 |
| All-window venue: Domain Stadium | 23 | +3.387 | +1.782 | -1.605 |
| All-window venue: Gabba | 118 | -1.488 | -1.879 | +0.391 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.527 | +0.215 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.467 | 0.000 |
| All-window venue: Kardinia Park | 91 | +15.331 | +14.797 | -0.533 |
| All-window venue: Manuka Oval | 30 | +3.068 | +2.494 | -0.574 |
| All-window venue: Mars Stadium | 15 | +9.402 | +10.705 | +1.304 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.309 | -0.642 |
| All-window venue: MCG | 498 | -2.821 | -2.687 | -0.135 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -2.689 | -1.582 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.890 | +0.127 |
| All-window venue: Perth Stadium | 188 | -2.725 | -3.209 | +0.483 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.454 | -0.360 |
| All-window venue: SCG | 116 | +4.062 | +3.347 | -0.716 |
| All-window venue: Subiaco | 22 | -0.789 | -1.039 | +0.250 |
| All-window venue: Sydney Showground | 81 | +11.666 | +10.524 | -1.141 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.100 | -0.187 |
| All-window venue: Traeger Park | 9 | -18.905 | -17.966 | -0.939 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +5.440 | +0.452 |

</details>

<details><summary>t40-position-prior: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.431 | +0.068 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.793 | +0.024 |
| Historical team: Carlton | 205 | -0.825 | -2.111 | +1.287 |
| Historical team: Collingwood | 215 | +1.878 | +2.055 | +0.177 |
| Historical team: Essendon | 204 | -5.111 | -6.234 | +1.123 |
| Historical team: Fremantle | 204 | -3.834 | -3.926 | +0.091 |
| Historical team: Geelong | 221 | +8.678 | +9.434 | +0.755 |
| Historical team: Gold Coast | 203 | -5.939 | -6.894 | +0.955 |
| Historical team: GWS Giants | 220 | +6.445 | +6.130 | -0.315 |
| Historical team: Hawthorn | 210 | +2.662 | +3.036 | +0.374 |
| Historical team: Melbourne | 211 | +0.901 | +1.013 | +0.112 |
| Historical team: North Melbourne | 202 | -6.038 | -6.201 | +0.163 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.931 | +0.599 |
| Historical team: Richmond | 210 | -2.404 | -2.268 | -0.136 |
| Historical team: St Kilda | 202 | -3.956 | -3.774 | -0.182 |
| Historical team: Sydney | 216 | +3.567 | +4.384 | +0.817 |
| Historical team: West Coast | 209 | -7.765 | -7.001 | -0.764 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.935 | -0.166 |
| All-window team: Adelaide | 231 | +6.348 | +6.412 | +0.064 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.214 | +0.004 |
| All-window team: Carlton | 230 | +0.315 | -0.947 | +0.632 |
| All-window team: Collingwood | 239 | +1.113 | +1.294 | +0.182 |
| All-window team: Essendon | 227 | -5.785 | -6.925 | +1.140 |
| All-window team: Fremantle | 228 | -2.838 | -2.811 | -0.026 |
| All-window team: Geelong | 245 | +8.269 | +9.118 | +0.849 |
| All-window team: Gold Coast | 226 | -6.216 | -7.044 | +0.828 |
| All-window team: GWS Giants | 243 | +5.563 | +5.257 | -0.306 |
| All-window team: Hawthorn | 234 | +2.747 | +3.071 | +0.324 |
| All-window team: Melbourne | 235 | +1.498 | +1.613 | +0.115 |
| All-window team: North Melbourne | 225 | -5.962 | -6.169 | +0.207 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.548 | +0.490 |
| All-window team: Richmond | 233 | -3.519 | -3.480 | -0.038 |
| All-window team: St Kilda | 225 | -3.303 | -3.109 | -0.194 |
| All-window team: Sydney | 239 | +4.915 | +5.769 | +0.855 |
| All-window team: West Coast | 232 | -7.358 | -6.765 | -0.594 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.724 | -0.107 |
| All-window venue: Accor Stadium | 2 | -31.221 | -32.284 | +1.063 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.981 | +0.254 |
| All-window venue: Barossa Park | 7 | -2.214 | -3.369 | +1.155 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.079 | -0.309 |
| All-window venue: Carrara | 96 | -1.646 | -2.356 | +0.710 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +9.520 | +0.777 |
| All-window venue: Domain Stadium | 23 | +3.387 | +8.810 | +5.423 |
| All-window venue: Gabba | 118 | -1.488 | -1.601 | +0.113 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.779 | +0.466 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.467 | 0.000 |
| All-window venue: Kardinia Park | 91 | +15.331 | +16.069 | +0.739 |
| All-window venue: Manuka Oval | 30 | +3.068 | +2.280 | -0.789 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.497 | +0.096 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -4.284 | +0.334 |
| All-window venue: MCG | 498 | -2.821 | -2.922 | +0.101 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.237 | -0.034 |
| All-window venue: Norwood Oval | 8 | +0.763 | +1.440 | +0.677 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.783 | +0.057 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -2.984 | +2.171 |
| All-window venue: SCG | 116 | +4.062 | +4.966 | +0.904 |
| All-window venue: Subiaco | 22 | -0.789 | -1.270 | +0.481 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.512 | -0.154 |
| All-window venue: TIO Stadium | 14 | +22.287 | +21.761 | -0.525 |
| All-window venue: Traeger Park | 9 | -18.905 | -19.220 | +0.315 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +5.551 | +0.564 |

</details>

<details><summary>t40-prior-k30: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.642 | +0.279 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.854 | +0.085 |
| Historical team: Carlton | 205 | -0.825 | -0.616 | -0.209 |
| Historical team: Collingwood | 215 | +1.878 | +1.682 | -0.196 |
| Historical team: Essendon | 204 | -5.111 | -4.956 | -0.155 |
| Historical team: Fremantle | 204 | -3.834 | -3.666 | -0.168 |
| Historical team: Geelong | 221 | +8.678 | +8.717 | +0.038 |
| Historical team: Gold Coast | 203 | -5.939 | -5.662 | -0.277 |
| Historical team: GWS Giants | 220 | +6.445 | +6.736 | +0.291 |
| Historical team: Hawthorn | 210 | +2.662 | +2.543 | -0.120 |
| Historical team: Melbourne | 211 | +0.901 | +0.906 | +0.006 |
| Historical team: North Melbourne | 202 | -6.038 | -6.174 | +0.137 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.108 | -0.224 |
| Historical team: Richmond | 210 | -2.404 | -2.610 | +0.205 |
| Historical team: St Kilda | 202 | -3.956 | -4.081 | +0.125 |
| Historical team: Sydney | 216 | +3.567 | +3.479 | -0.088 |
| Historical team: West Coast | 209 | -7.765 | -7.988 | +0.223 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.089 | -0.012 |
| All-window team: Adelaide | 231 | +6.348 | +6.556 | +0.208 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.312 | +0.101 |
| All-window team: Carlton | 230 | +0.315 | +0.582 | +0.267 |
| All-window team: Collingwood | 239 | +1.113 | +0.887 | -0.226 |
| All-window team: Essendon | 227 | -5.785 | -5.624 | -0.161 |
| All-window team: Fremantle | 228 | -2.838 | -2.636 | -0.201 |
| All-window team: Geelong | 245 | +8.269 | +8.220 | -0.049 |
| All-window team: Gold Coast | 226 | -6.216 | -6.027 | -0.189 |
| All-window team: GWS Giants | 243 | +5.563 | +5.803 | +0.240 |
| All-window team: Hawthorn | 234 | +2.747 | +2.614 | -0.133 |
| All-window team: Melbourne | 235 | +1.498 | +1.582 | +0.084 |
| All-window team: North Melbourne | 225 | -5.962 | -6.029 | +0.068 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.051 | -0.008 |
| All-window team: Richmond | 233 | -3.519 | -3.762 | +0.243 |
| All-window team: St Kilda | 225 | -3.303 | -3.452 | +0.149 |
| All-window team: Sydney | 239 | +4.915 | +4.890 | -0.025 |
| All-window team: West Coast | 232 | -7.358 | -7.465 | +0.107 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.704 | -0.127 |
| All-window venue: Accor Stadium | 2 | -31.221 | -31.744 | +0.523 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.711 | -0.016 |
| All-window venue: Barossa Park | 7 | -2.214 | -2.367 | +0.152 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +18.944 | -0.443 |
| All-window venue: Carrara | 96 | -1.646 | -1.456 | -0.190 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.463 | -0.280 |
| All-window venue: Domain Stadium | 23 | +3.387 | +2.526 | -0.861 |
| All-window venue: Gabba | 118 | -1.488 | -1.491 | +0.003 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.524 | +0.212 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.467 | 0.000 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.223 | -0.108 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.164 | +0.095 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.109 | -0.293 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -4.008 | +0.058 |
| All-window venue: MCG | 498 | -2.821 | -2.912 | +0.091 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.521 | +0.251 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.870 | +0.107 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.469 | -0.257 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.237 | -0.577 |
| All-window venue: SCG | 116 | +4.062 | +3.908 | -0.154 |
| All-window venue: Subiaco | 22 | -0.789 | -1.105 | +0.316 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.799 | +0.134 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.610 | +0.323 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.899 | -0.006 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.774 | -0.214 |

</details>

<details><summary>t40-quarter: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +4.473 | -1.890 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.779 | -0.990 |
| Historical team: Carlton | 205 | -0.825 | -1.779 | +0.954 |
| Historical team: Collingwood | 215 | +1.878 | +2.779 | +0.901 |
| Historical team: Essendon | 204 | -5.111 | -3.147 | -1.965 |
| Historical team: Fremantle | 204 | -3.834 | -3.019 | -0.815 |
| Historical team: Geelong | 221 | +8.678 | +7.424 | -1.255 |
| Historical team: Gold Coast | 203 | -5.939 | -5.526 | -0.414 |
| Historical team: GWS Giants | 220 | +6.445 | +5.822 | -0.624 |
| Historical team: Hawthorn | 210 | +2.662 | +2.803 | +0.140 |
| Historical team: Melbourne | 211 | +0.901 | +0.265 | -0.636 |
| Historical team: North Melbourne | 202 | -6.038 | -6.637 | +0.599 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.244 | -0.087 |
| Historical team: Richmond | 210 | -2.404 | -1.697 | -0.707 |
| Historical team: St Kilda | 202 | -3.956 | -3.917 | -0.039 |
| Historical team: Sydney | 216 | +3.567 | +3.051 | -0.516 |
| Historical team: West Coast | 209 | -7.765 | -6.458 | -1.307 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.958 | -0.143 |
| All-window team: Adelaide | 231 | +6.348 | +4.611 | -1.737 |
| All-window team: Brisbane Lions | 242 | -1.211 | -0.171 | -1.039 |
| All-window team: Carlton | 230 | +0.315 | -0.558 | +0.243 |
| All-window team: Collingwood | 239 | +1.113 | +2.010 | +0.897 |
| All-window team: Essendon | 227 | -5.785 | -4.031 | -1.754 |
| All-window team: Fremantle | 228 | -2.838 | -1.787 | -1.051 |
| All-window team: Geelong | 245 | +8.269 | +6.939 | -1.330 |
| All-window team: Gold Coast | 226 | -6.216 | -6.048 | -0.167 |
| All-window team: GWS Giants | 243 | +5.563 | +5.081 | -0.482 |
| All-window team: Hawthorn | 234 | +2.747 | +2.921 | +0.174 |
| All-window team: Melbourne | 235 | +1.498 | +0.822 | -0.676 |
| All-window team: North Melbourne | 225 | -5.962 | -6.295 | +0.333 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.604 | +0.545 |
| All-window team: Richmond | 233 | -3.519 | -2.718 | -0.801 |
| All-window team: St Kilda | 225 | -3.303 | -3.450 | +0.146 |
| All-window team: Sydney | 239 | +4.915 | +4.513 | -0.402 |
| All-window team: West Coast | 232 | -7.358 | -6.044 | -1.314 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.356 | -0.475 |
| All-window venue: Accor Stadium | 2 | -31.221 | -29.689 | -1.532 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +4.642 | -1.086 |
| All-window venue: Barossa Park | 7 | -2.214 | -1.352 | -0.862 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +20.523 | +1.135 |
| All-window venue: Carrara | 96 | -1.646 | -1.460 | -0.186 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +11.524 | +2.781 |
| All-window venue: Domain Stadium | 23 | +3.387 | +1.956 | -1.431 |
| All-window venue: Gabba | 118 | -1.488 | +0.048 | -1.440 |
| All-window venue: Hands Oval | 2 | -53.313 | -56.538 | +3.226 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -54.150 | -3.317 |
| All-window venue: Kardinia Park | 91 | +15.331 | +14.277 | -1.054 |
| All-window venue: Manuka Oval | 30 | +3.068 | +2.054 | -1.014 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.141 | -0.260 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.740 | -0.210 |
| All-window venue: MCG | 498 | -2.821 | -2.755 | -0.066 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.504 | +0.233 |
| All-window venue: Norwood Oval | 8 | +0.763 | -0.738 | -0.026 |
| All-window venue: Perth Stadium | 188 | -2.725 | -0.840 | -1.885 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +1.944 | +1.131 |
| All-window venue: SCG | 116 | +4.062 | +4.027 | -0.035 |
| All-window venue: Subiaco | 22 | -0.789 | -1.313 | +0.524 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.143 | -0.523 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.770 | +0.484 |
| All-window venue: Traeger Park | 9 | -18.905 | -19.092 | +0.187 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.629 | -0.359 |

</details>

<details><summary>t40-rating-points: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +5.483 | -0.880 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.479 | -1.290 |
| Historical team: Carlton | 205 | -0.825 | -1.715 | +0.890 |
| Historical team: Collingwood | 215 | +1.878 | +2.983 | +1.105 |
| Historical team: Essendon | 204 | -5.111 | -5.464 | +0.353 |
| Historical team: Fremantle | 204 | -3.834 | -4.238 | +0.404 |
| Historical team: Geelong | 221 | +8.678 | +8.864 | +0.186 |
| Historical team: Gold Coast | 203 | -5.939 | -6.697 | +0.758 |
| Historical team: GWS Giants | 220 | +6.445 | +4.862 | -1.584 |
| Historical team: Hawthorn | 210 | +2.662 | +2.781 | +0.118 |
| Historical team: Melbourne | 211 | +0.901 | +1.172 | +0.271 |
| Historical team: North Melbourne | 202 | -6.038 | -5.902 | -0.136 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.604 | +0.272 |
| Historical team: Richmond | 210 | -2.404 | -2.319 | -0.086 |
| Historical team: St Kilda | 202 | -3.956 | -3.595 | -0.361 |
| Historical team: Sydney | 216 | +3.567 | +4.046 | +0.479 |
| Historical team: West Coast | 209 | -7.765 | -7.698 | -0.067 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.508 | +0.407 |
| All-window team: Adelaide | 231 | +6.348 | +5.481 | -0.867 |
| All-window team: Brisbane Lions | 242 | -1.211 | +0.040 | -1.171 |
| All-window team: Carlton | 230 | +0.315 | -0.503 | +0.188 |
| All-window team: Collingwood | 239 | +1.113 | +2.112 | +0.999 |
| All-window team: Essendon | 227 | -5.785 | -6.201 | +0.416 |
| All-window team: Fremantle | 228 | -2.838 | -3.110 | +0.272 |
| All-window team: Geelong | 245 | +8.269 | +8.267 | -0.002 |
| All-window team: Gold Coast | 226 | -6.216 | -6.951 | +0.736 |
| All-window team: GWS Giants | 243 | +5.563 | +3.868 | -1.695 |
| All-window team: Hawthorn | 234 | +2.747 | +2.933 | +0.186 |
| All-window team: Melbourne | 235 | +1.498 | +1.933 | +0.435 |
| All-window team: North Melbourne | 225 | -5.962 | -5.494 | -0.468 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.520 | +0.461 |
| All-window team: Richmond | 233 | -3.519 | -3.683 | +0.165 |
| All-window team: St Kilda | 225 | -3.303 | -2.732 | -0.572 |
| All-window team: Sydney | 239 | +4.915 | +5.261 | +0.347 |
| All-window team: West Coast | 232 | -7.358 | -7.510 | +0.151 |
| All-window team: Western Bulldogs | 236 | +3.831 | +4.195 | +0.364 |
| All-window venue: Accor Stadium | 2 | -31.221 | -30.863 | -0.359 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.784 | +0.056 |
| All-window venue: Barossa Park | 7 | -2.214 | -3.535 | +1.321 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +18.837 | -0.550 |
| All-window venue: Carrara | 96 | -1.646 | -1.904 | +0.258 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +9.427 | +0.684 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.387 | 0.000 |
| All-window venue: Gabba | 118 | -1.488 | +0.245 | -1.242 |
| All-window venue: Hands Oval | 2 | -53.313 | -50.204 | -3.109 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.467 | 0.000 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.613 | +0.282 |
| All-window venue: Manuka Oval | 30 | +3.068 | +0.860 | -2.208 |
| All-window venue: Mars Stadium | 15 | +9.402 | +10.242 | +0.840 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.795 | -0.155 |
| All-window venue: MCG | 498 | -2.821 | -2.843 | +0.021 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -3.264 | -1.006 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.189 | -0.575 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.572 | -0.154 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -1.988 | +1.174 |
| All-window venue: SCG | 116 | +4.062 | +4.142 | +0.080 |
| All-window venue: Subiaco | 22 | -0.789 | -1.158 | +0.369 |
| All-window venue: Sydney Showground | 81 | +11.666 | +9.858 | -1.807 |
| All-window venue: TIO Stadium | 14 | +22.287 | +20.682 | -1.605 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.546 | -0.359 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.825 | -0.163 |

</details>

<details><summary>t40-rich-intercepts: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.336 | -0.026 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.780 | +0.011 |
| Historical team: Carlton | 205 | -0.825 | -0.817 | -0.008 |
| Historical team: Collingwood | 215 | +1.878 | +1.852 | -0.026 |
| Historical team: Essendon | 204 | -5.111 | -5.115 | +0.004 |
| Historical team: Fremantle | 204 | -3.834 | -3.805 | -0.030 |
| Historical team: Geelong | 221 | +8.678 | +8.701 | +0.023 |
| Historical team: Gold Coast | 203 | -5.939 | -5.950 | +0.011 |
| Historical team: GWS Giants | 220 | +6.445 | +6.483 | +0.038 |
| Historical team: Hawthorn | 210 | +2.662 | +2.675 | +0.013 |
| Historical team: Melbourne | 211 | +0.901 | +0.867 | -0.034 |
| Historical team: North Melbourne | 202 | -6.038 | -5.989 | -0.049 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.298 | -0.033 |
| Historical team: Richmond | 210 | -2.404 | -2.404 | -0.000 |
| Historical team: St Kilda | 202 | -3.956 | -3.962 | +0.006 |
| Historical team: Sydney | 216 | +3.567 | +3.567 | -0.000 |
| Historical team: West Coast | 209 | -7.765 | -7.760 | -0.005 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.087 | -0.014 |
| All-window team: Adelaide | 231 | +6.348 | +6.317 | -0.031 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.228 | +0.017 |
| All-window team: Carlton | 230 | +0.315 | +0.317 | +0.002 |
| All-window team: Collingwood | 239 | +1.113 | +1.092 | -0.021 |
| All-window team: Essendon | 227 | -5.785 | -5.781 | -0.004 |
| All-window team: Fremantle | 228 | -2.838 | -2.812 | -0.026 |
| All-window team: Geelong | 245 | +8.269 | +8.290 | +0.021 |
| All-window team: Gold Coast | 226 | -6.216 | -6.211 | -0.004 |
| All-window team: GWS Giants | 243 | +5.563 | +5.601 | +0.037 |
| All-window team: Hawthorn | 234 | +2.747 | +2.762 | +0.015 |
| All-window team: Melbourne | 235 | +1.498 | +1.461 | -0.037 |
| All-window team: North Melbourne | 225 | -5.962 | -5.915 | -0.047 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.026 | -0.033 |
| All-window team: Richmond | 233 | -3.519 | -3.516 | -0.003 |
| All-window team: St Kilda | 225 | -3.303 | -3.316 | +0.013 |
| All-window team: Sydney | 239 | +4.915 | +4.915 | +0.000 |
| All-window team: West Coast | 232 | -7.358 | -7.349 | -0.009 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.815 | -0.016 |
| All-window venue: Accor Stadium | 2 | -31.221 | -31.360 | +0.138 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.698 | -0.030 |
| All-window venue: Barossa Park | 7 | -2.214 | -2.212 | -0.002 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.405 | +0.017 |
| All-window venue: Carrara | 96 | -1.646 | -1.644 | -0.002 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.764 | +0.021 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.410 | +0.023 |
| All-window venue: Gabba | 118 | -1.488 | -1.510 | +0.022 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.385 | +0.072 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.467 | 0.000 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.350 | +0.019 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.107 | +0.039 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.387 | -0.015 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.950 | -0.000 |
| All-window venue: MCG | 498 | -2.821 | -2.826 | +0.004 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.187 | -0.084 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.761 | -0.003 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.708 | -0.017 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.768 | -0.046 |
| All-window venue: SCG | 116 | +4.062 | +4.064 | +0.001 |
| All-window venue: Subiaco | 22 | -0.789 | -0.797 | +0.008 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.704 | +0.038 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.288 | +0.001 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.952 | +0.047 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.992 | +0.005 |

</details>

<details><summary>t40-rich-involvement: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.367 | +0.004 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.759 | -0.010 |
| Historical team: Carlton | 205 | -0.825 | -0.850 | +0.025 |
| Historical team: Collingwood | 215 | +1.878 | +1.820 | -0.057 |
| Historical team: Essendon | 204 | -5.111 | -5.124 | +0.012 |
| Historical team: Fremantle | 204 | -3.834 | -3.840 | +0.006 |
| Historical team: Geelong | 221 | +8.678 | +8.645 | -0.034 |
| Historical team: Gold Coast | 203 | -5.939 | -5.904 | -0.035 |
| Historical team: GWS Giants | 220 | +6.445 | +6.392 | -0.053 |
| Historical team: Hawthorn | 210 | +2.662 | +2.690 | +0.028 |
| Historical team: Melbourne | 211 | +0.901 | +0.885 | -0.016 |
| Historical team: North Melbourne | 202 | -6.038 | -5.955 | -0.082 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.318 | -0.014 |
| Historical team: Richmond | 210 | -2.404 | -2.419 | +0.014 |
| Historical team: St Kilda | 202 | -3.956 | -3.936 | -0.020 |
| Historical team: Sydney | 216 | +3.567 | +3.593 | +0.026 |
| Historical team: West Coast | 209 | -7.765 | -7.756 | -0.009 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.126 | +0.025 |
| All-window team: Adelaide | 231 | +6.348 | +6.353 | +0.005 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.197 | -0.014 |
| All-window team: Carlton | 230 | +0.315 | +0.303 | -0.011 |
| All-window team: Collingwood | 239 | +1.113 | +1.053 | -0.060 |
| All-window team: Essendon | 227 | -5.785 | -5.813 | +0.028 |
| All-window team: Fremantle | 228 | -2.838 | -2.826 | -0.012 |
| All-window team: Geelong | 245 | +8.269 | +8.238 | -0.032 |
| All-window team: Gold Coast | 226 | -6.216 | -6.180 | -0.036 |
| All-window team: GWS Giants | 243 | +5.563 | +5.497 | -0.066 |
| All-window team: Hawthorn | 234 | +2.747 | +2.771 | +0.024 |
| All-window team: Melbourne | 235 | +1.498 | +1.487 | -0.011 |
| All-window team: North Melbourne | 225 | -5.962 | -5.879 | -0.082 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.063 | +0.004 |
| All-window team: Richmond | 233 | -3.519 | -3.545 | +0.026 |
| All-window team: St Kilda | 225 | -3.303 | -3.288 | -0.016 |
| All-window team: Sydney | 239 | +4.915 | +4.939 | +0.024 |
| All-window team: West Coast | 232 | -7.358 | -7.349 | -0.009 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.847 | +0.016 |
| All-window venue: Accor Stadium | 2 | -31.221 | -31.185 | -0.037 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.743 | +0.015 |
| All-window venue: Barossa Park | 7 | -2.214 | -2.258 | +0.044 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.560 | +0.172 |
| All-window venue: Carrara | 96 | -1.646 | -1.586 | -0.059 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.399 | -0.344 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.378 | -0.008 |
| All-window venue: Gabba | 118 | -1.488 | -1.458 | -0.030 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.149 | -0.164 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.467 | 0.000 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.296 | -0.035 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.027 | -0.041 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.480 | +0.078 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.956 | +0.005 |
| All-window venue: MCG | 498 | -2.821 | -2.837 | +0.016 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.215 | -0.056 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.790 | +0.026 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.705 | -0.020 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.758 | -0.056 |
| All-window venue: SCG | 116 | +4.062 | +4.085 | +0.023 |
| All-window venue: Subiaco | 22 | -0.789 | -0.787 | -0.002 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.615 | -0.051 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.353 | +0.066 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.869 | -0.036 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.953 | -0.035 |

</details>

<details><summary>t40-rich-pressure: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.376 | +0.013 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.761 | -0.008 |
| Historical team: Carlton | 205 | -0.825 | -0.830 | +0.006 |
| Historical team: Collingwood | 215 | +1.878 | +1.885 | +0.007 |
| Historical team: Essendon | 204 | -5.111 | -5.151 | +0.040 |
| Historical team: Fremantle | 204 | -3.834 | -3.835 | +0.001 |
| Historical team: Geelong | 221 | +8.678 | +8.620 | -0.059 |
| Historical team: Gold Coast | 203 | -5.939 | -5.939 | -0.000 |
| Historical team: GWS Giants | 220 | +6.445 | +6.443 | -0.003 |
| Historical team: Hawthorn | 210 | +2.662 | +2.655 | -0.007 |
| Historical team: Melbourne | 211 | +0.901 | +0.933 | +0.032 |
| Historical team: North Melbourne | 202 | -6.038 | -6.018 | -0.019 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.331 | -0.001 |
| Historical team: Richmond | 210 | -2.404 | -2.405 | +0.001 |
| Historical team: St Kilda | 202 | -3.956 | -3.942 | -0.014 |
| Historical team: Sydney | 216 | +3.567 | +3.584 | +0.017 |
| Historical team: West Coast | 209 | -7.765 | -7.764 | -0.001 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.108 | +0.007 |
| All-window team: Adelaide | 231 | +6.348 | +6.359 | +0.011 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.199 | -0.012 |
| All-window team: Carlton | 230 | +0.315 | +0.311 | -0.004 |
| All-window team: Collingwood | 239 | +1.113 | +1.124 | +0.011 |
| All-window team: Essendon | 227 | -5.785 | -5.822 | +0.037 |
| All-window team: Fremantle | 228 | -2.838 | -2.846 | +0.009 |
| All-window team: Geelong | 245 | +8.269 | +8.210 | -0.059 |
| All-window team: Gold Coast | 226 | -6.216 | -6.218 | +0.002 |
| All-window team: GWS Giants | 243 | +5.563 | +5.562 | -0.001 |
| All-window team: Hawthorn | 234 | +2.747 | +2.742 | -0.005 |
| All-window team: Melbourne | 235 | +1.498 | +1.535 | +0.037 |
| All-window team: North Melbourne | 225 | -5.962 | -5.945 | -0.016 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.056 | -0.003 |
| All-window team: Richmond | 233 | -3.519 | -3.528 | +0.009 |
| All-window team: St Kilda | 225 | -3.303 | -3.289 | -0.014 |
| All-window team: Sydney | 239 | +4.915 | +4.932 | +0.017 |
| All-window team: West Coast | 232 | -7.358 | -7.351 | -0.007 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.835 | +0.004 |
| All-window venue: Accor Stadium | 2 | -31.221 | -31.218 | -0.003 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.730 | +0.002 |
| All-window venue: Barossa Park | 7 | -2.214 | -2.224 | +0.010 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.407 | +0.020 |
| All-window venue: Carrara | 96 | -1.646 | -1.652 | +0.006 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.714 | -0.029 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.383 | -0.004 |
| All-window venue: Gabba | 118 | -1.488 | -1.473 | -0.015 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.242 | -0.071 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.467 | 0.000 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.278 | -0.053 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.058 | -0.010 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.395 | -0.007 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.952 | +0.002 |
| All-window venue: MCG | 498 | -2.821 | -2.815 | -0.006 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.300 | +0.030 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.787 | +0.024 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.712 | -0.013 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.860 | +0.047 |
| All-window venue: SCG | 116 | +4.062 | +4.076 | +0.013 |
| All-window venue: Subiaco | 22 | -0.789 | -0.803 | +0.014 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.668 | +0.002 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.354 | +0.067 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.880 | -0.025 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.943 | -0.045 |

</details>

<details><summary>t40-rich-shots: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.368 | +0.005 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.794 | +0.025 |
| Historical team: Carlton | 205 | -0.825 | -0.823 | -0.001 |
| Historical team: Collingwood | 215 | +1.878 | +1.887 | +0.009 |
| Historical team: Essendon | 204 | -5.111 | -5.111 | -0.000 |
| Historical team: Fremantle | 204 | -3.834 | -3.858 | +0.024 |
| Historical team: Geelong | 221 | +8.678 | +8.681 | +0.003 |
| Historical team: Gold Coast | 203 | -5.939 | -5.917 | -0.023 |
| Historical team: GWS Giants | 220 | +6.445 | +6.438 | -0.007 |
| Historical team: Hawthorn | 210 | +2.662 | +2.675 | +0.013 |
| Historical team: Melbourne | 211 | +0.901 | +0.889 | -0.012 |
| Historical team: North Melbourne | 202 | -6.038 | -6.024 | -0.014 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.319 | -0.013 |
| Historical team: Richmond | 210 | -2.404 | -2.386 | -0.018 |
| Historical team: St Kilda | 202 | -3.956 | -3.957 | +0.002 |
| Historical team: Sydney | 216 | +3.567 | +3.574 | +0.007 |
| Historical team: West Coast | 209 | -7.765 | -7.776 | +0.011 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.103 | +0.001 |
| All-window team: Adelaide | 231 | +6.348 | +6.354 | +0.006 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.240 | +0.029 |
| All-window team: Carlton | 230 | +0.315 | +0.313 | -0.001 |
| All-window team: Collingwood | 239 | +1.113 | +1.115 | +0.003 |
| All-window team: Essendon | 227 | -5.785 | -5.788 | +0.003 |
| All-window team: Fremantle | 228 | -2.838 | -2.862 | +0.024 |
| All-window team: Geelong | 245 | +8.269 | +8.279 | +0.010 |
| All-window team: Gold Coast | 226 | -6.216 | -6.196 | -0.020 |
| All-window team: GWS Giants | 243 | +5.563 | +5.556 | -0.007 |
| All-window team: Hawthorn | 234 | +2.747 | +2.761 | +0.014 |
| All-window team: Melbourne | 235 | +1.498 | +1.486 | -0.013 |
| All-window team: North Melbourne | 225 | -5.962 | -5.945 | -0.016 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.052 | -0.007 |
| All-window team: Richmond | 233 | -3.519 | -3.508 | -0.011 |
| All-window team: St Kilda | 225 | -3.303 | -3.302 | -0.001 |
| All-window team: Sydney | 239 | +4.915 | +4.921 | +0.006 |
| All-window team: West Coast | 232 | -7.358 | -7.365 | +0.007 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.836 | +0.005 |
| All-window venue: Accor Stadium | 2 | -31.221 | -31.202 | -0.020 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.725 | -0.003 |
| All-window venue: Barossa Park | 7 | -2.214 | -2.197 | -0.017 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.417 | +0.029 |
| All-window venue: Carrara | 96 | -1.646 | -1.620 | -0.026 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.656 | -0.087 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.336 | -0.051 |
| All-window venue: Gabba | 118 | -1.488 | -1.520 | +0.032 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.212 | -0.100 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.467 | 0.000 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.350 | +0.019 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.065 | -0.004 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.411 | +0.009 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.949 | -0.001 |
| All-window venue: MCG | 498 | -2.821 | -2.824 | +0.002 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.249 | -0.022 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.754 | -0.010 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.733 | +0.007 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.805 | -0.009 |
| All-window venue: SCG | 116 | +4.062 | +4.073 | +0.010 |
| All-window venue: Subiaco | 22 | -0.789 | -0.806 | +0.017 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.669 | +0.004 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.310 | +0.023 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.939 | +0.034 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +5.012 | +0.025 |

</details>

<details><summary>t40-rushed: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +4.417 | -1.945 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.549 | -1.220 |
| Historical team: Carlton | 205 | -0.825 | -1.890 | +1.066 |
| Historical team: Collingwood | 215 | +1.878 | +2.859 | +0.981 |
| Historical team: Essendon | 204 | -5.111 | -3.284 | -1.827 |
| Historical team: Fremantle | 204 | -3.834 | -2.940 | -0.895 |
| Historical team: Geelong | 221 | +8.678 | +7.285 | -1.394 |
| Historical team: Gold Coast | 203 | -5.939 | -5.492 | -0.447 |
| Historical team: GWS Giants | 220 | +6.445 | +5.792 | -0.654 |
| Historical team: Hawthorn | 210 | +2.662 | +2.720 | +0.058 |
| Historical team: Melbourne | 211 | +0.901 | +0.283 | -0.617 |
| Historical team: North Melbourne | 202 | -6.038 | -6.633 | +0.596 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.320 | -0.012 |
| Historical team: Richmond | 210 | -2.404 | -1.647 | -0.757 |
| Historical team: St Kilda | 202 | -3.956 | -4.034 | +0.078 |
| Historical team: Sydney | 216 | +3.567 | +3.109 | -0.458 |
| Historical team: West Coast | 209 | -7.765 | -6.342 | -1.423 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.023 | -0.078 |
| All-window team: Adelaide | 231 | +6.348 | +4.559 | -1.789 |
| All-window team: Brisbane Lions | 242 | -1.211 | +0.054 | -1.157 |
| All-window team: Carlton | 230 | +0.315 | -0.637 | +0.322 |
| All-window team: Collingwood | 239 | +1.113 | +2.083 | +0.971 |
| All-window team: Essendon | 227 | -5.785 | -4.218 | -1.567 |
| All-window team: Fremantle | 228 | -2.838 | -1.706 | -1.132 |
| All-window team: Geelong | 245 | +8.269 | +6.791 | -1.478 |
| All-window team: Gold Coast | 226 | -6.216 | -5.967 | -0.249 |
| All-window team: GWS Giants | 243 | +5.563 | +5.050 | -0.513 |
| All-window team: Hawthorn | 234 | +2.747 | +2.859 | +0.112 |
| All-window team: Melbourne | 235 | +1.498 | +0.847 | -0.651 |
| All-window team: North Melbourne | 225 | -5.962 | -6.307 | +0.346 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.660 | +0.602 |
| All-window team: Richmond | 233 | -3.519 | -2.706 | -0.813 |
| All-window team: St Kilda | 225 | -3.303 | -3.575 | +0.272 |
| All-window team: Sydney | 239 | +4.915 | +4.562 | -0.353 |
| All-window team: West Coast | 232 | -7.358 | -5.909 | -1.449 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.416 | -0.415 |
| All-window venue: Accor Stadium | 2 | -31.221 | -29.221 | -2.001 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +4.586 | -1.142 |
| All-window venue: Barossa Park | 7 | -2.214 | -1.607 | -0.607 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +20.504 | +1.117 |
| All-window venue: Carrara | 96 | -1.646 | -1.419 | -0.227 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +11.590 | +2.847 |
| All-window venue: Domain Stadium | 23 | +3.387 | +2.077 | -1.309 |
| All-window venue: Gabba | 118 | -1.488 | +0.239 | -1.249 |
| All-window venue: Hands Oval | 2 | -53.313 | -56.788 | +3.475 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -54.012 | -3.455 |
| All-window venue: Kardinia Park | 91 | +15.331 | +14.135 | -1.196 |
| All-window venue: Manuka Oval | 30 | +3.068 | +2.027 | -1.042 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.208 | -0.194 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.787 | -0.163 |
| All-window venue: MCG | 498 | -2.821 | -2.775 | -0.046 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.496 | +0.226 |
| All-window venue: Norwood Oval | 8 | +0.763 | -0.869 | +0.106 |
| All-window venue: Perth Stadium | 188 | -2.725 | -0.753 | -1.972 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +1.944 | +1.131 |
| All-window venue: SCG | 116 | +4.062 | +4.069 | +0.007 |
| All-window venue: Subiaco | 22 | -0.789 | -1.168 | +0.379 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.081 | -0.584 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.786 | +0.500 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.829 | -0.076 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.569 | -0.418 |

</details>

<details><summary>t40-shot-025: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.347 | -0.015 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.940 | +0.171 |
| Historical team: Carlton | 205 | -0.825 | -0.628 | -0.196 |
| Historical team: Collingwood | 215 | +1.878 | +1.924 | +0.046 |
| Historical team: Essendon | 204 | -5.111 | -5.109 | -0.003 |
| Historical team: Fremantle | 204 | -3.834 | -3.603 | -0.231 |
| Historical team: Geelong | 221 | +8.678 | +8.578 | -0.100 |
| Historical team: Gold Coast | 203 | -5.939 | -5.888 | -0.051 |
| Historical team: GWS Giants | 220 | +6.445 | +7.035 | +0.590 |
| Historical team: Hawthorn | 210 | +2.662 | +2.611 | -0.052 |
| Historical team: Melbourne | 211 | +0.901 | +0.158 | -0.743 |
| Historical team: North Melbourne | 202 | -6.038 | -5.394 | -0.643 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.010 | -0.322 |
| Historical team: Richmond | 210 | -2.404 | -2.728 | +0.323 |
| Historical team: St Kilda | 202 | -3.956 | -4.021 | +0.065 |
| Historical team: Sydney | 216 | +3.567 | +3.646 | +0.079 |
| Historical team: West Coast | 209 | -7.765 | -7.496 | -0.269 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.825 | -0.276 |
| All-window team: Adelaide | 231 | +6.348 | +6.419 | +0.071 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.454 | +0.243 |
| All-window team: Carlton | 230 | +0.315 | +0.436 | +0.121 |
| All-window team: Collingwood | 239 | +1.113 | +1.100 | -0.012 |
| All-window team: Essendon | 227 | -5.785 | -5.746 | -0.038 |
| All-window team: Fremantle | 228 | -2.838 | -2.504 | -0.334 |
| All-window team: Geelong | 245 | +8.269 | +8.147 | -0.122 |
| All-window team: Gold Coast | 226 | -6.216 | -6.224 | +0.009 |
| All-window team: GWS Giants | 243 | +5.563 | +6.138 | +0.575 |
| All-window team: Hawthorn | 234 | +2.747 | +2.580 | -0.167 |
| All-window team: Melbourne | 235 | +1.498 | +0.768 | -0.730 |
| All-window team: North Melbourne | 225 | -5.962 | -5.297 | -0.665 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.232 | +0.173 |
| All-window team: Richmond | 233 | -3.519 | -3.826 | +0.307 |
| All-window team: St Kilda | 225 | -3.303 | -3.310 | +0.007 |
| All-window team: Sydney | 239 | +4.915 | +4.943 | +0.028 |
| All-window team: West Coast | 232 | -7.358 | -7.146 | -0.213 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.704 | -0.127 |
| All-window venue: Accor Stadium | 2 | -31.221 | -30.718 | -0.503 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.654 | -0.073 |
| All-window venue: Barossa Park | 7 | -2.214 | -1.701 | -0.513 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.324 | -0.064 |
| All-window venue: Carrara | 96 | -1.646 | -1.606 | -0.040 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +9.440 | +0.697 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.363 | -0.024 |
| All-window venue: Gabba | 118 | -1.488 | -1.674 | +0.186 |
| All-window venue: Hands Oval | 2 | -53.313 | -52.724 | -0.588 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.502 | +0.034 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.257 | -0.073 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.536 | +0.468 |
| All-window venue: Mars Stadium | 15 | +9.402 | +8.742 | -0.660 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.885 | -0.066 |
| All-window venue: MCG | 498 | -2.821 | -2.955 | +0.133 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -3.233 | -1.038 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.430 | -0.333 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.398 | -0.328 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +0.768 | -0.045 |
| All-window venue: SCG | 116 | +4.062 | +4.027 | -0.035 |
| All-window venue: Subiaco | 22 | -0.789 | -0.312 | -0.477 |
| All-window venue: Sydney Showground | 81 | +11.666 | +12.236 | +0.571 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.106 | -0.181 |
| All-window venue: Traeger Park | 9 | -18.905 | -19.787 | +0.882 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.637 | -0.350 |

</details>

<details><summary>t40-shot-050: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.077 | -0.286 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.994 | +0.225 |
| Historical team: Carlton | 205 | -0.825 | -0.258 | -0.567 |
| Historical team: Collingwood | 215 | +1.878 | +1.943 | +0.065 |
| Historical team: Essendon | 204 | -5.111 | -5.134 | +0.023 |
| Historical team: Fremantle | 204 | -3.834 | -3.489 | -0.345 |
| Historical team: Geelong | 221 | +8.678 | +8.319 | -0.360 |
| Historical team: Gold Coast | 203 | -5.939 | -5.991 | +0.052 |
| Historical team: GWS Giants | 220 | +6.445 | +7.392 | +0.947 |
| Historical team: Hawthorn | 210 | +2.662 | +2.513 | -0.149 |
| Historical team: Melbourne | 211 | +0.901 | -0.359 | -0.541 |
| Historical team: North Melbourne | 202 | -6.038 | -5.017 | -1.020 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.363 | +0.031 |
| Historical team: Richmond | 210 | -2.404 | -2.553 | +0.149 |
| Historical team: St Kilda | 202 | -3.956 | -3.879 | -0.077 |
| Historical team: Sydney | 216 | +3.567 | +4.058 | +0.491 |
| Historical team: West Coast | 209 | -7.765 | -6.964 | -0.801 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.030 | -1.071 |
| All-window team: Adelaide | 231 | +6.348 | +6.209 | -0.139 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.527 | +0.316 |
| All-window team: Carlton | 230 | +0.315 | +0.699 | +0.384 |
| All-window team: Collingwood | 239 | +1.113 | +0.998 | -0.115 |
| All-window team: Essendon | 227 | -5.785 | -5.830 | +0.046 |
| All-window team: Fremantle | 228 | -2.838 | -2.334 | -0.504 |
| All-window team: Geelong | 245 | +8.269 | +7.908 | -0.361 |
| All-window team: Gold Coast | 226 | -6.216 | -6.395 | +0.180 |
| All-window team: GWS Giants | 243 | +5.563 | +6.465 | +0.902 |
| All-window team: Hawthorn | 234 | +2.747 | +2.483 | -0.264 |
| All-window team: Melbourne | 235 | +1.498 | +0.131 | -1.367 |
| All-window team: North Melbourne | 225 | -5.962 | -4.721 | -1.240 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.580 | +0.521 |
| All-window team: Richmond | 233 | -3.519 | -3.607 | +0.088 |
| All-window team: St Kilda | 225 | -3.303 | -3.004 | -0.300 |
| All-window team: Sydney | 239 | +4.915 | +5.319 | +0.404 |
| All-window team: West Coast | 232 | -7.358 | -6.728 | -0.630 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.049 | -0.781 |
| All-window venue: Accor Stadium | 2 | -31.221 | -29.537 | -1.684 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.445 | -0.283 |
| All-window venue: Barossa Park | 7 | -2.214 | -0.714 | -1.500 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.042 | -0.345 |
| All-window venue: Carrara | 96 | -1.646 | -1.720 | +0.074 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +9.883 | +1.140 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.310 | -0.077 |
| All-window venue: Gabba | 118 | -1.488 | -1.718 | +0.230 |
| All-window venue: Hands Oval | 2 | -53.313 | -51.137 | -2.176 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.141 | -0.326 |
| All-window venue: Kardinia Park | 91 | +15.331 | +14.979 | -0.352 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.686 | +0.618 |
| All-window venue: Mars Stadium | 15 | +9.402 | +7.857 | -1.545 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.858 | -0.093 |
| All-window venue: MCG | 498 | -2.821 | -3.022 | +0.200 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -2.522 | -1.748 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.506 | -0.257 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.080 | -0.645 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +2.212 | +1.398 |
| All-window venue: SCG | 116 | +4.062 | +4.384 | +0.321 |
| All-window venue: Subiaco | 22 | -0.789 | +0.220 | -0.569 |
| All-window venue: Sydney Showground | 81 | +11.666 | +12.433 | +0.768 |
| All-window venue: TIO Stadium | 14 | +22.287 | +21.725 | -0.562 |
| All-window venue: Traeger Park | 9 | -18.905 | -20.656 | +1.751 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.351 | -0.636 |

</details>

<details><summary>t40-shot-075: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +5.837 | -0.526 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.904 | +0.135 |
| Historical team: Carlton | 205 | -0.825 | -0.122 | -0.703 |
| Historical team: Collingwood | 215 | +1.878 | +1.744 | -0.134 |
| Historical team: Essendon | 204 | -5.111 | -4.979 | -0.133 |
| Historical team: Fremantle | 204 | -3.834 | -3.482 | -0.353 |
| Historical team: Geelong | 221 | +8.678 | +8.532 | -0.146 |
| Historical team: Gold Coast | 203 | -5.939 | -5.968 | +0.028 |
| Historical team: GWS Giants | 220 | +6.445 | +7.370 | +0.925 |
| Historical team: Hawthorn | 210 | +2.662 | +2.381 | -0.282 |
| Historical team: Melbourne | 211 | +0.901 | -0.645 | -0.256 |
| Historical team: North Melbourne | 202 | -6.038 | -5.093 | -0.945 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.465 | +0.134 |
| Historical team: Richmond | 210 | -2.404 | -2.497 | +0.093 |
| Historical team: St Kilda | 202 | -3.956 | -3.831 | -0.125 |
| Historical team: Sydney | 216 | +3.567 | +4.506 | +0.939 |
| Historical team: West Coast | 209 | -7.765 | -6.474 | -1.291 |
| Historical team: Western Bulldogs | 212 | +5.101 | +3.412 | -1.689 |
| All-window team: Adelaide | 231 | +6.348 | +6.039 | -0.309 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.426 | +0.215 |
| All-window team: Carlton | 230 | +0.315 | +0.856 | +0.542 |
| All-window team: Collingwood | 239 | +1.113 | +0.797 | -0.316 |
| All-window team: Essendon | 227 | -5.785 | -5.754 | -0.030 |
| All-window team: Fremantle | 228 | -2.838 | -2.264 | -0.574 |
| All-window team: Geelong | 245 | +8.269 | +8.081 | -0.188 |
| All-window team: Gold Coast | 226 | -6.216 | -6.429 | +0.214 |
| All-window team: GWS Giants | 243 | +5.563 | +6.462 | +0.899 |
| All-window team: Hawthorn | 234 | +2.747 | +2.370 | -0.377 |
| All-window team: Melbourne | 235 | +1.498 | -0.193 | -1.305 |
| All-window team: North Melbourne | 225 | -5.962 | -4.819 | -1.142 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.723 | +0.665 |
| All-window team: Richmond | 233 | -3.519 | -3.621 | +0.102 |
| All-window team: St Kilda | 225 | -3.303 | -2.921 | -0.382 |
| All-window team: Sydney | 239 | +4.915 | +5.830 | +0.915 |
| All-window team: West Coast | 232 | -7.358 | -6.384 | -0.974 |
| All-window team: Western Bulldogs | 236 | +3.831 | +2.627 | -1.204 |
| All-window venue: Accor Stadium | 2 | -31.221 | -28.766 | -2.455 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.334 | -0.393 |
| All-window venue: Barossa Park | 7 | -2.214 | -0.292 | -1.923 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.106 | -0.282 |
| All-window venue: Carrara | 96 | -1.646 | -1.751 | +0.105 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +9.655 | +0.912 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.335 | -0.052 |
| All-window venue: Gabba | 118 | -1.488 | -1.636 | +0.148 |
| All-window venue: Hands Oval | 2 | -53.313 | -51.802 | -1.510 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -56.982 | -0.485 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.089 | -0.242 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.797 | +0.728 |
| All-window venue: Mars Stadium | 15 | +9.402 | +7.469 | -1.933 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.901 | -0.050 |
| All-window venue: MCG | 498 | -2.821 | -3.135 | +0.314 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -2.418 | -1.853 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.405 | -0.359 |
| All-window venue: Perth Stadium | 188 | -2.725 | -1.964 | -0.761 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +3.108 | +2.295 |
| All-window venue: SCG | 116 | +4.062 | +4.801 | +0.739 |
| All-window venue: Subiaco | 22 | -0.789 | +0.786 | -0.003 |
| All-window venue: Sydney Showground | 81 | +11.666 | +12.438 | +0.773 |
| All-window venue: TIO Stadium | 14 | +22.287 | +21.526 | -0.760 |
| All-window venue: Traeger Park | 9 | -18.905 | -21.203 | +2.298 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.282 | -0.706 |

</details>

<details><summary>t40-shot-100: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +5.602 | -0.761 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.998 | +0.229 |
| Historical team: Carlton | 205 | -0.825 | -0.565 | -0.259 |
| Historical team: Collingwood | 215 | +1.878 | +1.761 | -0.117 |
| Historical team: Essendon | 204 | -5.111 | -4.620 | -0.491 |
| Historical team: Fremantle | 204 | -3.834 | -3.480 | -0.354 |
| Historical team: Geelong | 221 | +8.678 | +8.771 | +0.092 |
| Historical team: Gold Coast | 203 | -5.939 | -5.926 | -0.013 |
| Historical team: GWS Giants | 220 | +6.445 | +7.565 | +1.120 |
| Historical team: Hawthorn | 210 | +2.662 | +2.364 | -0.298 |
| Historical team: Melbourne | 211 | +0.901 | -0.709 | -0.192 |
| Historical team: North Melbourne | 202 | -6.038 | -5.495 | -0.542 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.411 | +0.080 |
| Historical team: Richmond | 210 | -2.404 | -2.486 | +0.081 |
| Historical team: St Kilda | 202 | -3.956 | -3.974 | +0.018 |
| Historical team: Sydney | 216 | +3.567 | +4.982 | +1.415 |
| Historical team: West Coast | 209 | -7.765 | -6.115 | -1.650 |
| Historical team: Western Bulldogs | 212 | +5.101 | +3.011 | -2.091 |
| All-window team: Adelaide | 231 | +6.348 | +5.905 | -0.443 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.547 | +0.336 |
| All-window team: Carlton | 230 | +0.315 | +0.384 | +0.070 |
| All-window team: Collingwood | 239 | +1.113 | +0.831 | -0.282 |
| All-window team: Essendon | 227 | -5.785 | -5.534 | -0.250 |
| All-window team: Fremantle | 228 | -2.838 | -2.075 | -0.763 |
| All-window team: Geelong | 245 | +8.269 | +8.359 | +0.090 |
| All-window team: Gold Coast | 226 | -6.216 | -6.388 | +0.172 |
| All-window team: GWS Giants | 243 | +5.563 | +6.722 | +1.159 |
| All-window team: Hawthorn | 234 | +2.747 | +2.388 | -0.359 |
| All-window team: Melbourne | 235 | +1.498 | -0.349 | -1.150 |
| All-window team: North Melbourne | 225 | -5.962 | -5.224 | -0.738 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.734 | +0.675 |
| All-window team: Richmond | 233 | -3.519 | -3.678 | +0.159 |
| All-window team: St Kilda | 225 | -3.303 | -3.118 | -0.185 |
| All-window team: Sydney | 239 | +4.915 | +6.372 | +1.457 |
| All-window team: West Coast | 232 | -7.358 | -6.106 | -1.252 |
| All-window team: Western Bulldogs | 236 | +3.831 | +2.272 | -1.559 |
| All-window venue: Accor Stadium | 2 | -31.221 | -28.397 | -2.825 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.292 | -0.436 |
| All-window venue: Barossa Park | 7 | -2.214 | -0.118 | -2.096 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +18.671 | -0.717 |
| All-window venue: Carrara | 96 | -1.646 | -1.708 | +0.063 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +9.586 | +0.843 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.485 | +0.098 |
| All-window venue: Gabba | 118 | -1.488 | -1.758 | +0.270 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.943 | +0.631 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -56.139 | -1.328 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.419 | +0.088 |
| All-window venue: Manuka Oval | 30 | +3.068 | +4.042 | +0.973 |
| All-window venue: Mars Stadium | 15 | +9.402 | +7.003 | -2.399 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -4.026 | +0.076 |
| All-window venue: MCG | 498 | -2.821 | -3.217 | +0.396 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -2.891 | -1.380 |
| All-window venue: Norwood Oval | 8 | +0.763 | -0.111 | -0.652 |
| All-window venue: Perth Stadium | 188 | -2.725 | -1.733 | -0.993 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +2.874 | +2.061 |
| All-window venue: SCG | 116 | +4.062 | +5.267 | +1.205 |
| All-window venue: Subiaco | 22 | -0.789 | +1.169 | +0.380 |
| All-window venue: Sydney Showground | 81 | +11.666 | +12.758 | +1.093 |
| All-window venue: TIO Stadium | 14 | +22.287 | +21.368 | -0.919 |
| All-window venue: Traeger Park | 9 | -18.905 | -21.170 | +2.266 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.395 | -0.592 |

</details>

<details><summary>t40-sigma-032: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.363 | 0.000 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.769 | 0.000 |
| Historical team: Carlton | 205 | -0.825 | -0.825 | 0.000 |
| Historical team: Collingwood | 215 | +1.878 | +1.878 | 0.000 |
| Historical team: Essendon | 204 | -5.111 | -5.111 | 0.000 |
| Historical team: Fremantle | 204 | -3.834 | -3.834 | 0.000 |
| Historical team: Geelong | 221 | +8.678 | +8.678 | 0.000 |
| Historical team: Gold Coast | 203 | -5.939 | -5.939 | 0.000 |
| Historical team: GWS Giants | 220 | +6.445 | +6.445 | 0.000 |
| Historical team: Hawthorn | 210 | +2.662 | +2.662 | 0.000 |
| Historical team: Melbourne | 211 | +0.901 | +0.901 | 0.000 |
| Historical team: North Melbourne | 202 | -6.038 | -6.038 | 0.000 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.331 | 0.000 |
| Historical team: Richmond | 210 | -2.404 | -2.404 | 0.000 |
| Historical team: St Kilda | 202 | -3.956 | -3.956 | 0.000 |
| Historical team: Sydney | 216 | +3.567 | +3.567 | 0.000 |
| Historical team: West Coast | 209 | -7.765 | -7.765 | 0.000 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.101 | 0.000 |
| All-window team: Adelaide | 231 | +6.348 | +6.348 | 0.000 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.211 | 0.000 |
| All-window team: Carlton | 230 | +0.315 | +0.315 | 0.000 |
| All-window team: Collingwood | 239 | +1.113 | +1.113 | 0.000 |
| All-window team: Essendon | 227 | -5.785 | -5.785 | 0.000 |
| All-window team: Fremantle | 228 | -2.838 | -2.838 | 0.000 |
| All-window team: Geelong | 245 | +8.269 | +8.269 | 0.000 |
| All-window team: Gold Coast | 226 | -6.216 | -6.216 | 0.000 |
| All-window team: GWS Giants | 243 | +5.563 | +5.563 | 0.000 |
| All-window team: Hawthorn | 234 | +2.747 | +2.747 | 0.000 |
| All-window team: Melbourne | 235 | +1.498 | +1.498 | 0.000 |
| All-window team: North Melbourne | 225 | -5.962 | -5.962 | 0.000 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.059 | 0.000 |
| All-window team: Richmond | 233 | -3.519 | -3.519 | 0.000 |
| All-window team: St Kilda | 225 | -3.303 | -3.303 | 0.000 |
| All-window team: Sydney | 239 | +4.915 | +4.915 | 0.000 |
| All-window team: West Coast | 232 | -7.358 | -7.358 | 0.000 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.831 | 0.000 |
| All-window venue: Accor Stadium | 2 | -31.221 | -31.221 | 0.000 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.728 | 0.000 |
| All-window venue: Barossa Park | 7 | -2.214 | -2.214 | 0.000 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.388 | 0.000 |
| All-window venue: Carrara | 96 | -1.646 | -1.646 | 0.000 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.743 | 0.000 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.387 | 0.000 |
| All-window venue: Gabba | 118 | -1.488 | -1.488 | 0.000 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.313 | 0.000 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.467 | 0.000 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.331 | 0.000 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.068 | 0.000 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.402 | 0.000 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.950 | 0.000 |
| All-window venue: MCG | 498 | -2.821 | -2.821 | 0.000 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.270 | 0.000 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.763 | 0.000 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.725 | 0.000 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.814 | 0.000 |
| All-window venue: SCG | 116 | +4.062 | +4.062 | 0.000 |
| All-window venue: Subiaco | 22 | -0.789 | -0.789 | 0.000 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.666 | 0.000 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.287 | 0.000 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.905 | 0.000 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.987 | 0.000 |

</details>

<details><summary>t40-sigma-040: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.363 | 0.000 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.769 | 0.000 |
| Historical team: Carlton | 205 | -0.825 | -0.825 | 0.000 |
| Historical team: Collingwood | 215 | +1.878 | +1.878 | 0.000 |
| Historical team: Essendon | 204 | -5.111 | -5.111 | 0.000 |
| Historical team: Fremantle | 204 | -3.834 | -3.834 | 0.000 |
| Historical team: Geelong | 221 | +8.678 | +8.678 | 0.000 |
| Historical team: Gold Coast | 203 | -5.939 | -5.939 | 0.000 |
| Historical team: GWS Giants | 220 | +6.445 | +6.445 | 0.000 |
| Historical team: Hawthorn | 210 | +2.662 | +2.662 | 0.000 |
| Historical team: Melbourne | 211 | +0.901 | +0.901 | 0.000 |
| Historical team: North Melbourne | 202 | -6.038 | -6.038 | 0.000 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.331 | 0.000 |
| Historical team: Richmond | 210 | -2.404 | -2.404 | 0.000 |
| Historical team: St Kilda | 202 | -3.956 | -3.956 | 0.000 |
| Historical team: Sydney | 216 | +3.567 | +3.567 | 0.000 |
| Historical team: West Coast | 209 | -7.765 | -7.765 | 0.000 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.101 | 0.000 |
| All-window team: Adelaide | 231 | +6.348 | +6.348 | 0.000 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.211 | 0.000 |
| All-window team: Carlton | 230 | +0.315 | +0.315 | 0.000 |
| All-window team: Collingwood | 239 | +1.113 | +1.113 | 0.000 |
| All-window team: Essendon | 227 | -5.785 | -5.785 | 0.000 |
| All-window team: Fremantle | 228 | -2.838 | -2.838 | 0.000 |
| All-window team: Geelong | 245 | +8.269 | +8.269 | 0.000 |
| All-window team: Gold Coast | 226 | -6.216 | -6.216 | 0.000 |
| All-window team: GWS Giants | 243 | +5.563 | +5.563 | 0.000 |
| All-window team: Hawthorn | 234 | +2.747 | +2.747 | 0.000 |
| All-window team: Melbourne | 235 | +1.498 | +1.498 | 0.000 |
| All-window team: North Melbourne | 225 | -5.962 | -5.962 | 0.000 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.059 | 0.000 |
| All-window team: Richmond | 233 | -3.519 | -3.519 | 0.000 |
| All-window team: St Kilda | 225 | -3.303 | -3.303 | 0.000 |
| All-window team: Sydney | 239 | +4.915 | +4.915 | 0.000 |
| All-window team: West Coast | 232 | -7.358 | -7.358 | 0.000 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.831 | 0.000 |
| All-window venue: Accor Stadium | 2 | -31.221 | -31.221 | 0.000 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.728 | 0.000 |
| All-window venue: Barossa Park | 7 | -2.214 | -2.214 | 0.000 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.388 | 0.000 |
| All-window venue: Carrara | 96 | -1.646 | -1.646 | 0.000 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.743 | 0.000 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.387 | 0.000 |
| All-window venue: Gabba | 118 | -1.488 | -1.488 | 0.000 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.313 | 0.000 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.467 | 0.000 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.331 | 0.000 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.068 | 0.000 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.402 | 0.000 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.950 | 0.000 |
| All-window venue: MCG | 498 | -2.821 | -2.821 | 0.000 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.270 | 0.000 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.763 | 0.000 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.725 | 0.000 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.814 | 0.000 |
| All-window venue: SCG | 116 | +4.062 | +4.062 | 0.000 |
| All-window venue: Subiaco | 22 | -0.789 | -0.789 | 0.000 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.666 | 0.000 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.287 | 0.000 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.905 | 0.000 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.987 | 0.000 |

</details>

<details><summary>t40-tog: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.536 | +0.173 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.858 | +0.089 |
| Historical team: Carlton | 205 | -0.825 | -0.852 | +0.028 |
| Historical team: Collingwood | 215 | +1.878 | +1.768 | -0.110 |
| Historical team: Essendon | 204 | -5.111 | -4.792 | -0.319 |
| Historical team: Fremantle | 204 | -3.834 | -3.466 | -0.368 |
| Historical team: Geelong | 221 | +8.678 | +8.766 | +0.087 |
| Historical team: Gold Coast | 203 | -5.939 | -5.921 | -0.018 |
| Historical team: GWS Giants | 220 | +6.445 | +6.342 | -0.103 |
| Historical team: Hawthorn | 210 | +2.662 | +2.803 | +0.140 |
| Historical team: Melbourne | 211 | +0.901 | +0.508 | -0.393 |
| Historical team: North Melbourne | 202 | -6.038 | -6.156 | +0.118 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.501 | +0.169 |
| Historical team: Richmond | 210 | -2.404 | -2.508 | +0.104 |
| Historical team: St Kilda | 202 | -3.956 | -4.143 | +0.187 |
| Historical team: Sydney | 216 | +3.567 | +3.296 | -0.271 |
| Historical team: West Coast | 209 | -7.765 | -7.748 | -0.017 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.236 | +0.135 |
| All-window team: Adelaide | 231 | +6.348 | +6.548 | +0.200 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.247 | +0.036 |
| All-window team: Carlton | 230 | +0.315 | +0.317 | +0.002 |
| All-window team: Collingwood | 239 | +1.113 | +1.021 | -0.092 |
| All-window team: Essendon | 227 | -5.785 | -5.474 | -0.311 |
| All-window team: Fremantle | 228 | -2.838 | -2.521 | -0.317 |
| All-window team: Geelong | 245 | +8.269 | +8.379 | +0.110 |
| All-window team: Gold Coast | 226 | -6.216 | -6.295 | +0.079 |
| All-window team: GWS Giants | 243 | +5.563 | +5.435 | -0.128 |
| All-window team: Hawthorn | 234 | +2.747 | +2.885 | +0.138 |
| All-window team: Melbourne | 235 | +1.498 | +1.147 | -0.351 |
| All-window team: North Melbourne | 225 | -5.962 | -6.134 | +0.172 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.232 | +0.173 |
| All-window team: Richmond | 233 | -3.519 | -3.607 | +0.088 |
| All-window team: St Kilda | 225 | -3.303 | -3.518 | +0.215 |
| All-window team: Sydney | 239 | +4.915 | +4.684 | -0.231 |
| All-window team: West Coast | 232 | -7.358 | -7.316 | -0.042 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.942 | +0.111 |
| All-window venue: Accor Stadium | 2 | -31.221 | -31.850 | +0.629 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.905 | +0.177 |
| All-window venue: Barossa Park | 7 | -2.214 | -2.324 | +0.110 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.113 | -0.275 |
| All-window venue: Carrara | 96 | -1.646 | -1.827 | +0.181 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.496 | -0.247 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.481 | +0.094 |
| All-window venue: Gabba | 118 | -1.488 | -1.521 | +0.033 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.544 | +0.231 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.467 | 0.000 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.300 | -0.031 |
| All-window venue: Manuka Oval | 30 | +3.068 | +2.811 | -0.257 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.546 | +0.145 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.931 | -0.020 |
| All-window venue: MCG | 498 | -2.821 | -2.915 | +0.093 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.460 | +0.190 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.396 | -0.367 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.525 | -0.201 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.928 | +0.114 |
| All-window venue: SCG | 116 | +4.062 | +3.780 | -0.283 |
| All-window venue: Subiaco | 22 | -0.789 | -0.825 | +0.036 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.526 | -0.139 |
| All-window venue: TIO Stadium | 14 | +22.287 | +21.780 | -0.507 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.805 | -0.100 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +5.154 | +0.167 |

</details>

<details><summary>t40-travel-probe: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.363 | 0.000 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.769 | 0.000 |
| Historical team: Carlton | 205 | -0.825 | -0.825 | 0.000 |
| Historical team: Collingwood | 215 | +1.878 | +1.878 | 0.000 |
| Historical team: Essendon | 204 | -5.111 | -5.111 | 0.000 |
| Historical team: Fremantle | 204 | -3.834 | -3.834 | 0.000 |
| Historical team: Geelong | 221 | +8.678 | +8.678 | 0.000 |
| Historical team: Gold Coast | 203 | -5.939 | -5.939 | 0.000 |
| Historical team: GWS Giants | 220 | +6.445 | +6.445 | 0.000 |
| Historical team: Hawthorn | 210 | +2.662 | +2.662 | 0.000 |
| Historical team: Melbourne | 211 | +0.901 | +0.901 | 0.000 |
| Historical team: North Melbourne | 202 | -6.038 | -6.038 | 0.000 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.331 | 0.000 |
| Historical team: Richmond | 210 | -2.404 | -2.404 | 0.000 |
| Historical team: St Kilda | 202 | -3.956 | -3.956 | 0.000 |
| Historical team: Sydney | 216 | +3.567 | +3.567 | 0.000 |
| Historical team: West Coast | 209 | -7.765 | -7.765 | 0.000 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.101 | 0.000 |
| All-window team: Adelaide | 231 | +6.348 | +6.348 | 0.000 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.211 | 0.000 |
| All-window team: Carlton | 230 | +0.315 | +0.315 | 0.000 |
| All-window team: Collingwood | 239 | +1.113 | +1.113 | 0.000 |
| All-window team: Essendon | 227 | -5.785 | -5.785 | 0.000 |
| All-window team: Fremantle | 228 | -2.838 | -2.838 | 0.000 |
| All-window team: Geelong | 245 | +8.269 | +8.269 | 0.000 |
| All-window team: Gold Coast | 226 | -6.216 | -6.216 | 0.000 |
| All-window team: GWS Giants | 243 | +5.563 | +5.563 | 0.000 |
| All-window team: Hawthorn | 234 | +2.747 | +2.747 | 0.000 |
| All-window team: Melbourne | 235 | +1.498 | +1.498 | 0.000 |
| All-window team: North Melbourne | 225 | -5.962 | -5.962 | 0.000 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.059 | 0.000 |
| All-window team: Richmond | 233 | -3.519 | -3.519 | 0.000 |
| All-window team: St Kilda | 225 | -3.303 | -3.303 | 0.000 |
| All-window team: Sydney | 239 | +4.915 | +4.915 | 0.000 |
| All-window team: West Coast | 232 | -7.358 | -7.358 | 0.000 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.831 | 0.000 |
| All-window venue: Accor Stadium | 2 | -31.221 | -31.221 | 0.000 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.728 | 0.000 |
| All-window venue: Barossa Park | 7 | -2.214 | -2.214 | 0.000 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.388 | 0.000 |
| All-window venue: Carrara | 96 | -1.646 | -1.646 | 0.000 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.743 | 0.000 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.387 | 0.000 |
| All-window venue: Gabba | 118 | -1.488 | -1.488 | 0.000 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.313 | 0.000 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.467 | 0.000 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.331 | 0.000 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.068 | 0.000 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.402 | 0.000 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.950 | 0.000 |
| All-window venue: MCG | 498 | -2.821 | -2.821 | 0.000 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.270 | 0.000 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.763 | 0.000 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.725 | 0.000 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.814 | 0.000 |
| All-window venue: SCG | 116 | +4.062 | +4.062 | 0.000 |
| All-window venue: Subiaco | 22 | -0.789 | -0.789 | 0.000 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.666 | 0.000 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.287 | 0.000 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.905 | 0.000 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.987 | 0.000 |

</details>

<details><summary>t40-venue-geo: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +5.895 | -0.468 |
| Historical team: Brisbane Lions | 219 | -1.769 | -2.197 | +0.428 |
| Historical team: Carlton | 205 | -0.825 | -0.794 | -0.031 |
| Historical team: Collingwood | 215 | +1.878 | +1.829 | -0.049 |
| Historical team: Essendon | 204 | -5.111 | -4.940 | -0.172 |
| Historical team: Fremantle | 204 | -3.834 | -4.318 | +0.484 |
| Historical team: Geelong | 221 | +8.678 | +8.688 | +0.010 |
| Historical team: Gold Coast | 203 | -5.939 | -5.708 | -0.231 |
| Historical team: GWS Giants | 220 | +6.445 | +7.110 | +0.665 |
| Historical team: Hawthorn | 210 | +2.662 | +3.149 | +0.487 |
| Historical team: Melbourne | 211 | +0.901 | +1.130 | +0.229 |
| Historical team: North Melbourne | 202 | -6.038 | -5.615 | -0.423 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.282 | -0.050 |
| Historical team: Richmond | 210 | -2.404 | -2.208 | -0.197 |
| Historical team: St Kilda | 202 | -3.956 | -3.911 | -0.045 |
| Historical team: Sydney | 216 | +3.567 | +3.638 | +0.071 |
| Historical team: West Coast | 209 | -7.765 | -8.023 | +0.258 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.837 | -0.264 |
| All-window team: Adelaide | 231 | +6.348 | +5.884 | -0.464 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.653 | +0.443 |
| All-window team: Carlton | 230 | +0.315 | +0.342 | +0.027 |
| All-window team: Collingwood | 239 | +1.113 | +1.075 | -0.038 |
| All-window team: Essendon | 227 | -5.785 | -5.634 | -0.151 |
| All-window team: Fremantle | 228 | -2.838 | -3.372 | +0.534 |
| All-window team: Geelong | 245 | +8.269 | +8.343 | +0.074 |
| All-window team: Gold Coast | 226 | -6.216 | -6.033 | -0.183 |
| All-window team: GWS Giants | 243 | +5.563 | +6.252 | +0.688 |
| All-window team: Hawthorn | 234 | +2.747 | +3.294 | +0.547 |
| All-window team: Melbourne | 235 | +1.498 | +1.724 | +0.226 |
| All-window team: North Melbourne | 225 | -5.962 | -5.520 | -0.442 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.536 | +0.477 |
| All-window team: Richmond | 233 | -3.519 | -3.360 | -0.159 |
| All-window team: St Kilda | 225 | -3.303 | -3.316 | +0.012 |
| All-window team: Sydney | 239 | +4.915 | +5.003 | +0.088 |
| All-window team: West Coast | 232 | -7.358 | -7.657 | +0.299 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.614 | -0.217 |
| All-window venue: Accor Stadium | 2 | -31.221 | -27.021 | -4.200 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +4.559 | -1.169 |
| All-window venue: Barossa Park | 7 | -2.214 | +3.386 | +1.172 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +24.988 | +5.600 |
| All-window venue: Carrara | 96 | -1.646 | -2.667 | +1.021 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +14.343 | +5.600 |
| All-window venue: Domain Stadium | 23 | +3.387 | +1.834 | -1.552 |
| All-window venue: Gabba | 118 | -1.488 | -3.001 | +1.513 |
| All-window venue: Hands Oval | 2 | -53.313 | -47.713 | -5.600 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -51.867 | -5.600 |
| All-window venue: Kardinia Park | 91 | +15.331 | +16.261 | +0.931 |
| All-window venue: Manuka Oval | 30 | +3.068 | +8.668 | +5.600 |
| All-window venue: Mars Stadium | 15 | +9.402 | +7.815 | -1.587 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -2.833 | -1.117 |
| All-window venue: MCG | 498 | -2.821 | -0.747 | -2.075 |
| All-window venue: Ninja Stadium | 24 | -4.270 | +1.330 | -2.941 |
| All-window venue: Norwood Oval | 8 | +0.763 | +6.363 | +5.600 |
| All-window venue: Perth Stadium | 188 | -2.725 | -3.969 | +1.244 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +4.786 | +3.973 |
| All-window venue: SCG | 116 | +4.062 | +2.813 | -1.249 |
| All-window venue: Subiaco | 22 | -0.789 | -2.316 | +1.527 |
| All-window venue: Sydney Showground | 81 | +11.666 | +10.378 | -1.288 |
| All-window venue: TIO Stadium | 14 | +22.287 | +27.887 | +5.600 |
| All-window venue: Traeger Park | 9 | -18.905 | -13.305 | -5.600 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +10.587 | +5.600 |

</details>

<details><summary>t40-venue-static: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +4.648 | -1.715 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.554 | -1.215 |
| Historical team: Carlton | 205 | -0.825 | +0.055 | -0.769 |
| Historical team: Collingwood | 215 | +1.878 | +2.466 | +0.588 |
| Historical team: Essendon | 204 | -5.111 | -4.030 | -1.081 |
| Historical team: Fremantle | 204 | -3.834 | -4.372 | +0.538 |
| Historical team: Geelong | 221 | +8.678 | +5.149 | -3.529 |
| Historical team: Gold Coast | 203 | -5.939 | -5.021 | -0.918 |
| Historical team: GWS Giants | 220 | +6.445 | +6.595 | +0.150 |
| Historical team: Hawthorn | 210 | +2.662 | +2.348 | -0.314 |
| Historical team: Melbourne | 211 | +0.901 | +1.743 | +0.842 |
| Historical team: North Melbourne | 202 | -6.038 | -5.129 | -0.908 |
| Historical team: Port Adelaide | 209 | +0.331 | -1.481 | +1.150 |
| Historical team: Richmond | 210 | -2.404 | -1.573 | -0.831 |
| Historical team: St Kilda | 202 | -3.956 | -2.587 | -1.369 |
| Historical team: Sydney | 216 | +3.567 | +2.185 | -1.382 |
| Historical team: West Coast | 209 | -7.765 | -8.211 | +0.446 |
| Historical team: Western Bulldogs | 212 | +5.101 | +6.318 | +1.216 |
| All-window team: Adelaide | 231 | +6.348 | +4.668 | -1.680 |
| All-window team: Brisbane Lions | 242 | -1.211 | +0.005 | -1.206 |
| All-window team: Carlton | 230 | +0.315 | +1.179 | +0.864 |
| All-window team: Collingwood | 239 | +1.113 | +1.673 | +0.560 |
| All-window team: Essendon | 227 | -5.785 | -4.723 | -1.062 |
| All-window team: Fremantle | 228 | -2.838 | -3.350 | +0.512 |
| All-window team: Geelong | 245 | +8.269 | +4.665 | -3.604 |
| All-window team: Gold Coast | 226 | -6.216 | -5.278 | -0.938 |
| All-window team: GWS Giants | 243 | +5.563 | +5.662 | +0.099 |
| All-window team: Hawthorn | 234 | +2.747 | +2.396 | -0.351 |
| All-window team: Melbourne | 235 | +1.498 | +2.373 | +0.875 |
| All-window team: North Melbourne | 225 | -5.962 | -4.988 | -0.974 |
| All-window team: Port Adelaide | 232 | +0.059 | -1.799 | +1.740 |
| All-window team: Richmond | 233 | -3.519 | -2.658 | -0.861 |
| All-window team: St Kilda | 225 | -3.303 | -1.912 | -1.392 |
| All-window team: Sydney | 239 | +4.915 | +3.567 | -1.348 |
| All-window team: West Coast | 232 | -7.358 | -7.861 | +0.503 |
| All-window team: Western Bulldogs | 236 | +3.831 | +5.090 | +1.259 |
| All-window venue: Accor Stadium | 2 | -31.221 | -31.221 | 0.000 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +1.528 | -4.199 |
| All-window venue: Barossa Park | 7 | -2.214 | -2.214 | 0.000 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.388 | 0.000 |
| All-window venue: Carrara | 96 | -1.646 | -0.125 | -1.520 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.743 | 0.000 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.387 | 0.000 |
| All-window venue: Gabba | 118 | -1.488 | +0.321 | -1.166 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.313 | 0.000 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.467 | 0.000 |
| All-window venue: Kardinia Park | 91 | +15.331 | +4.582 | -10.749 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.068 | 0.000 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.402 | 0.000 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -2.255 | -1.695 |
| All-window venue: MCG | 498 | -2.821 | -1.547 | -1.274 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.270 | 0.000 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.763 | 0.000 |
| All-window venue: Perth Stadium | 188 | -2.725 | -4.787 | +2.061 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.814 | 0.000 |
| All-window venue: SCG | 116 | +4.062 | +0.895 | -3.168 |
| All-window venue: Subiaco | 22 | -0.789 | -3.920 | +3.131 |
| All-window venue: Sydney Showground | 81 | +11.666 | +10.055 | -1.611 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.287 | 0.000 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.905 | 0.000 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +0.579 | -4.408 |

</details>

<details><summary>t40-venue-team: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +5.503 | -0.860 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.507 | -0.262 |
| Historical team: Carlton | 205 | -0.825 | -0.813 | -0.012 |
| Historical team: Collingwood | 215 | +1.878 | +1.973 | +0.095 |
| Historical team: Essendon | 204 | -5.111 | -4.994 | -0.117 |
| Historical team: Fremantle | 204 | -3.834 | -3.759 | -0.076 |
| Historical team: Geelong | 221 | +8.678 | +8.053 | -0.626 |
| Historical team: Gold Coast | 203 | -5.939 | -5.944 | +0.005 |
| Historical team: GWS Giants | 220 | +6.445 | +6.140 | -0.305 |
| Historical team: Hawthorn | 210 | +2.662 | +2.803 | +0.140 |
| Historical team: Melbourne | 211 | +0.901 | +0.963 | +0.062 |
| Historical team: North Melbourne | 202 | -6.038 | -5.438 | -0.600 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.373 | +0.041 |
| Historical team: Richmond | 210 | -2.404 | -2.344 | -0.060 |
| Historical team: St Kilda | 202 | -3.956 | -3.377 | -0.579 |
| Historical team: Sydney | 216 | +3.567 | +3.226 | -0.341 |
| Historical team: West Coast | 209 | -7.765 | -7.330 | -0.435 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.850 | -0.251 |
| All-window team: Adelaide | 231 | +6.348 | +5.471 | -0.877 |
| All-window team: Brisbane Lions | 242 | -1.211 | -0.970 | -0.241 |
| All-window team: Carlton | 230 | +0.315 | +0.301 | -0.014 |
| All-window team: Collingwood | 239 | +1.113 | +1.249 | +0.136 |
| All-window team: Essendon | 227 | -5.785 | -5.529 | -0.256 |
| All-window team: Fremantle | 228 | -2.838 | -2.775 | -0.063 |
| All-window team: Geelong | 245 | +8.269 | +7.621 | -0.648 |
| All-window team: Gold Coast | 226 | -6.216 | -6.251 | +0.036 |
| All-window team: GWS Giants | 243 | +5.563 | +5.268 | -0.295 |
| All-window team: Hawthorn | 234 | +2.747 | +2.827 | +0.080 |
| All-window team: Melbourne | 235 | +1.498 | +1.491 | -0.007 |
| All-window team: North Melbourne | 225 | -5.962 | -5.409 | -0.553 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.081 | +0.023 |
| All-window team: Richmond | 233 | -3.519 | -3.336 | -0.183 |
| All-window team: St Kilda | 225 | -3.303 | -2.760 | -0.544 |
| All-window team: Sydney | 239 | +4.915 | +4.576 | -0.339 |
| All-window team: West Coast | 232 | -7.358 | -6.825 | -0.534 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.519 | -0.311 |
| All-window venue: Accor Stadium | 2 | -31.221 | -31.221 | 0.000 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +4.810 | -0.918 |
| All-window venue: Barossa Park | 7 | -2.214 | -2.197 | -0.017 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +18.343 | -1.044 |
| All-window venue: Carrara | 96 | -1.646 | -1.968 | +0.322 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.781 | +0.038 |
| All-window venue: Domain Stadium | 23 | +3.387 | +2.733 | -0.654 |
| All-window venue: Gabba | 118 | -1.488 | -1.241 | -0.247 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.304 | -0.008 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -56.920 | -0.547 |
| All-window venue: Kardinia Park | 91 | +15.331 | +13.695 | -1.636 |
| All-window venue: Manuka Oval | 30 | +3.068 | +2.948 | -0.120 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.353 | -0.049 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.900 | -0.051 |
| All-window venue: MCG | 498 | -2.821 | -2.830 | +0.009 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -3.617 | -0.653 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.789 | +0.025 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.416 | -0.310 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.814 | 0.000 |
| All-window venue: SCG | 116 | +4.062 | +3.387 | -0.675 |
| All-window venue: Subiaco | 22 | -0.789 | -1.309 | +0.520 |
| All-window venue: Sydney Showground | 81 | +11.666 | +10.332 | -1.334 |
| All-window venue: TIO Stadium | 14 | +22.287 | +21.619 | -0.668 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.727 | -0.178 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.839 | -0.149 |

</details>

<details><summary>t40-weather: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +4.442 | -1.921 |
| Historical team: Brisbane Lions | 219 | -1.769 | -0.595 | -1.174 |
| Historical team: Carlton | 205 | -0.825 | -1.880 | +1.056 |
| Historical team: Collingwood | 215 | +1.878 | +2.775 | +0.897 |
| Historical team: Essendon | 204 | -5.111 | -3.279 | -1.832 |
| Historical team: Fremantle | 204 | -3.834 | -2.933 | -0.901 |
| Historical team: Geelong | 221 | +8.678 | +7.244 | -1.434 |
| Historical team: Gold Coast | 203 | -5.939 | -5.493 | -0.447 |
| Historical team: GWS Giants | 220 | +6.445 | +5.836 | -0.609 |
| Historical team: Hawthorn | 210 | +2.662 | +2.709 | +0.047 |
| Historical team: Melbourne | 211 | +0.901 | +0.244 | -0.657 |
| Historical team: North Melbourne | 202 | -6.038 | -6.532 | +0.494 |
| Historical team: Port Adelaide | 209 | +0.331 | -0.241 | -0.091 |
| Historical team: Richmond | 210 | -2.404 | -1.637 | -0.767 |
| Historical team: St Kilda | 202 | -3.956 | -4.040 | +0.084 |
| Historical team: Sydney | 216 | +3.567 | +3.154 | -0.413 |
| Historical team: West Coast | 209 | -7.765 | -6.302 | -1.463 |
| Historical team: Western Bulldogs | 212 | +5.101 | +4.892 | -0.209 |
| All-window team: Adelaide | 231 | +6.348 | +4.591 | -1.757 |
| All-window team: Brisbane Lions | 242 | -1.211 | +0.013 | -1.198 |
| All-window team: Carlton | 230 | +0.315 | -0.637 | +0.322 |
| All-window team: Collingwood | 239 | +1.113 | +2.001 | +0.889 |
| All-window team: Essendon | 227 | -5.785 | -4.216 | -1.568 |
| All-window team: Fremantle | 228 | -2.838 | -1.706 | -1.131 |
| All-window team: Geelong | 245 | +8.269 | +6.744 | -1.525 |
| All-window team: Gold Coast | 226 | -6.216 | -5.972 | -0.244 |
| All-window team: GWS Giants | 243 | +5.563 | +5.097 | -0.467 |
| All-window team: Hawthorn | 234 | +2.747 | +2.842 | +0.095 |
| All-window team: Melbourne | 235 | +1.498 | +0.811 | -0.687 |
| All-window team: North Melbourne | 225 | -5.962 | -6.208 | +0.247 |
| All-window team: Port Adelaide | 232 | +0.059 | -0.588 | +0.529 |
| All-window team: Richmond | 233 | -3.519 | -2.688 | -0.831 |
| All-window team: St Kilda | 225 | -3.303 | -3.576 | +0.273 |
| All-window team: Sydney | 239 | +4.915 | +4.613 | -0.302 |
| All-window team: West Coast | 232 | -7.358 | -5.873 | -1.485 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.298 | -0.533 |
| All-window venue: Accor Stadium | 2 | -31.221 | -29.183 | -2.038 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +4.635 | -1.093 |
| All-window venue: Barossa Park | 7 | -2.214 | -1.599 | -0.615 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +20.560 | +1.172 |
| All-window venue: Carrara | 96 | -1.646 | -1.414 | -0.232 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +11.473 | +2.730 |
| All-window venue: Domain Stadium | 23 | +3.387 | +2.080 | -1.307 |
| All-window venue: Gabba | 118 | -1.488 | +0.204 | -1.283 |
| All-window venue: Hands Oval | 2 | -53.313 | -56.775 | +3.462 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -54.045 | -3.422 |
| All-window venue: Kardinia Park | 91 | +15.331 | +14.088 | -1.242 |
| All-window venue: Manuka Oval | 30 | +3.068 | +2.076 | -0.992 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.070 | -0.331 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.804 | -0.146 |
| All-window venue: MCG | 498 | -2.821 | -2.787 | -0.034 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.394 | +0.124 |
| All-window venue: Norwood Oval | 8 | +0.763 | -0.917 | +0.153 |
| All-window venue: Perth Stadium | 188 | -2.725 | -0.735 | -1.990 |
| All-window venue: Riverway Stadium | 1 | -0.814 | +1.952 | +1.138 |
| All-window venue: SCG | 116 | +4.062 | +4.121 | +0.058 |
| All-window venue: Subiaco | 22 | -0.789 | -1.119 | +0.330 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.125 | -0.541 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.773 | +0.486 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.945 | +0.040 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.514 | -0.473 |

</details>

<details><summary>t40-pav-day-end: all team and venue biases</summary>

| Group | n | V3 bias | Candidate bias | Absolute worsening |
| --- | ---: | ---: | ---: | ---: |
| Historical team: Adelaide | 208 | +6.363 | +6.363 | -0.000 |
| Historical team: Brisbane Lions | 219 | -1.769 | -1.769 | +0.000 |
| Historical team: Carlton | 205 | -0.825 | -0.825 | +0.000 |
| Historical team: Collingwood | 215 | +1.878 | +1.878 | +0.000 |
| Historical team: Essendon | 204 | -5.111 | -5.111 | -0.000 |
| Historical team: Fremantle | 204 | -3.834 | -3.834 | -0.000 |
| Historical team: Geelong | 221 | +8.678 | +8.678 | +0.000 |
| Historical team: Gold Coast | 203 | -5.939 | -5.939 | +0.000 |
| Historical team: GWS Giants | 220 | +6.445 | +6.445 | +0.000 |
| Historical team: Hawthorn | 210 | +2.662 | +2.663 | +0.000 |
| Historical team: Melbourne | 211 | +0.901 | +0.901 | +0.000 |
| Historical team: North Melbourne | 202 | -6.038 | -6.038 | +0.000 |
| Historical team: Port Adelaide | 209 | +0.331 | +0.331 | +0.000 |
| Historical team: Richmond | 210 | -2.404 | -2.404 | +0.000 |
| Historical team: St Kilda | 202 | -3.956 | -3.956 | +0.000 |
| Historical team: Sydney | 216 | +3.567 | +3.567 | -0.000 |
| Historical team: West Coast | 209 | -7.765 | -7.765 | -0.000 |
| Historical team: Western Bulldogs | 212 | +5.101 | +5.101 | +0.000 |
| All-window team: Adelaide | 231 | +6.348 | +6.348 | -0.000 |
| All-window team: Brisbane Lions | 242 | -1.211 | -1.211 | +0.000 |
| All-window team: Carlton | 230 | +0.315 | +0.315 | -0.000 |
| All-window team: Collingwood | 239 | +1.113 | +1.113 | +0.000 |
| All-window team: Essendon | 227 | -5.785 | -5.785 | -0.000 |
| All-window team: Fremantle | 228 | -2.838 | -2.838 | -0.000 |
| All-window team: Geelong | 245 | +8.269 | +8.269 | +0.000 |
| All-window team: Gold Coast | 226 | -6.216 | -6.216 | +0.000 |
| All-window team: GWS Giants | 243 | +5.563 | +5.563 | +0.000 |
| All-window team: Hawthorn | 234 | +2.747 | +2.747 | +0.000 |
| All-window team: Melbourne | 235 | +1.498 | +1.498 | +0.000 |
| All-window team: North Melbourne | 225 | -5.962 | -5.962 | +0.000 |
| All-window team: Port Adelaide | 232 | +0.059 | +0.059 | +0.000 |
| All-window team: Richmond | 233 | -3.519 | -3.519 | +0.000 |
| All-window team: St Kilda | 225 | -3.303 | -3.303 | +0.000 |
| All-window team: Sydney | 239 | +4.915 | +4.915 | -0.000 |
| All-window team: West Coast | 232 | -7.358 | -7.358 | -0.000 |
| All-window team: Western Bulldogs | 236 | +3.831 | +3.831 | +0.000 |
| All-window venue: Accor Stadium | 2 | -31.221 | -31.221 | 0.000 |
| All-window venue: Adelaide Oval | 251 | +5.728 | +5.728 | -0.000 |
| All-window venue: Barossa Park | 7 | -2.214 | -2.214 | +0.000 |
| All-window venue: Blundstone Arena | 10 | +19.388 | +19.388 | +0.000 |
| All-window venue: Carrara | 96 | -1.646 | -1.646 | +0.000 |
| All-window venue: Cazalys Stadium | 5 | +8.743 | +8.743 | +0.000 |
| All-window venue: Domain Stadium | 23 | +3.387 | +3.387 | +0.001 |
| All-window venue: Gabba | 118 | -1.488 | -1.488 | +0.000 |
| All-window venue: Hands Oval | 2 | -53.313 | -53.313 | 0.000 |
| All-window venue: Jiangwan Stadium | 3 | -57.467 | -57.467 | 0.000 |
| All-window venue: Kardinia Park | 91 | +15.331 | +15.331 | -0.000 |
| All-window venue: Manuka Oval | 30 | +3.068 | +3.068 | +0.000 |
| All-window venue: Mars Stadium | 15 | +9.402 | +9.402 | -0.000 |
| All-window venue: Marvel Stadium | 443 | -3.950 | -3.950 | +0.000 |
| All-window venue: MCG | 498 | -2.821 | -2.821 | +0.000 |
| All-window venue: Ninja Stadium | 24 | -4.270 | -4.271 | +0.000 |
| All-window venue: Norwood Oval | 8 | +0.763 | +0.763 | -0.000 |
| All-window venue: Perth Stadium | 188 | -2.725 | -2.725 | -0.000 |
| All-window venue: Riverway Stadium | 1 | -0.814 | -0.814 | 0.000 |
| All-window venue: SCG | 116 | +4.062 | +4.062 | -0.000 |
| All-window venue: Subiaco | 22 | -0.789 | -0.789 | +0.000 |
| All-window venue: Sydney Showground | 81 | +11.666 | +11.666 | +0.000 |
| All-window venue: TIO Stadium | 14 | +22.287 | +22.287 | -0.000 |
| All-window venue: Traeger Park | 9 | -18.905 | -18.905 | +0.000 |
| All-window venue: UTAS Stadium | 44 | +4.987 | +4.988 | +0.000 |

</details>
<!-- TASK40 GENERATED END -->
