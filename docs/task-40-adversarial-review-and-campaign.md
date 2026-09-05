# Task 40: Adversarial review and experiment campaign

This report audits the promoted AFL model and its research ledger for Jack's
2027 Squiggle entry. The competition objective is correct winner picks.
Research is in progress. No promotion recommendation has been validated.

## Executive summary

The four historical reproduction targets pass on the original engine at
`8b7ed5b`. This establishes a starting point, not the validity of the model.
The campaign must finish the correctness audit before comparing candidates.

## Candidate verdict table

Candidate pre-registrations and results will be added after the model and
ledger audit. No new candidate experiment has run. The baseline reproductions
below are the four checks explicitly required before experimentation.

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

Initial evidence, pending the complete task-by-task audit:

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

## Methodology

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
