# Handoff — next research session

**State as of 2026-06-12 (post Tasks 24–32, June re-think executed):** **v3 current**
(`predha-080`, release 3.3.1). v4 (`v4-shotoff` = scoring-shot Elo + team offsets) was
promoted and **reverted the same day** (Task 32): it wins LogLoss/MAE but loses tips —
the Squiggle comp metric — in every recent season (2023–26: 0/−4/−1/−4, −9 over 763
games). No live predictions were issued under v4. Its machinery stays in the engine,
bit-inert when unset; tips-first re-evaluation at 2026 season end.
Baselines (v3): primary 2021–2025 LogLoss **0.8485** / tips 68.1%; early window
2016–2019 **0.8555** (`predha80-early`; n=1,890 total). Read
`docs/task-32-squiggle-rerank.md` first, then task-31 (v4), task-25 (procedure).

## Evaluation procedure (changed this session — Tasks 25/32)

1. Primary window 2021–2025: promotion bar Δ > 0.005 unchanged.
2. Early window 2016–2019: mandatory confirmatory run (offline-exact where
   prediction-side; real backtest on the `-early` config variant where update-side).
3. Headline significance: `bootstrapCompareStratified` (metrics.ts) across both windows,
   seed 42 / 1000 iter. Read CI magnitudes, not just the excludesZero flag (it has no
   epsilon — a 1e-15 delta can "exclude zero").
4. **Tips criterion (Task 32, comp-driven):** no tip regression vs the incumbent on the
   pooled scored windows, AND report the last-three-seasons tip delta separately — a
   deficit there is disqualifying for comp-facing promotions (v4's failure mode: tip
   gains in old eras, losses in recent seasons).
5. **The 2026 gate was burned 2026-06-12** for the v4 decision (came back flat). The OOS
   gate for future candidates is 2026 R14 onward (and 2027 once it exists).

## Product goal (stated by Jack 2026-06-12)

**Enter Squiggle's model comp next year (2027). The comp is scored on TIPS** — not bits,
not MAE (a prior session note claiming otherwise was wrong; our T9/T18 "1st of 29"
rankings were by our own computed LogLoss, not the comp's scoring). Implications:
- LogLoss stays the *selection* metric (tip% is too low-powered to select on — T11), but
  report every candidate's pooled tip delta alongside, and treat a tip regression on the
  scored windows as a red flag even when LogLoss improves.
- The comp is decided in close games: track sign-accuracy in the |predicted margin| < 12
  band vs the Squiggle field (add to A3 weekly monitoring).
- Probability-head work (sigma, clamps, calibration) is irrelevant to the comp score —
  deprioritize unless it moves margin sign.

## Open items, in priority order

0. ~~Task 33~~ **Done 2026-06-12** (`docs/task-33-missed-tip-analysis.md`): 79% of v3's
   misses are consensus misses; the tipper-specific remainder (24 games, all |pred|<12)
   yields one mechanism-backed replicating cluster (neutral-venue nominal-home, 6×
   over-represented, 3 seasons) whose fix — prediction HA 0 at neutral venues — is worth
   only +1 tip / −0.0011 LogLoss pooled. **Effective kill: no exploitable model-tweak
   blind spot at the field's information level; gains must come from new information
   (D4) or the A2 bundle.** Neutral≈0 added to the A2 bucketed-HA bundle below. St Kilda
   overrating (6/6 "tipped StK, lost", 3 seasons) noted as diagnostic only.
1. **A3 weekly comp monitoring** (method established in Task 32, `/tmp/sq_rank_multi.py`
   pattern): score v3 — and v4 as a shadow — against the Squiggle field on tips weekly
   for the rest of 2026, plus close-game (|pred margin| < 12) sign accuracy. v3 is
   currently 4th of 29; the field's annual winner rotates (~±10 tips of luck), so track
   trends, not ranks.
2. **Close-game sign accuracy is the new top modelling target.** The comp is decided in
   the |margin| < 2-goal band, where v3 beats v4. Any future candidate should be
   diagnosed on that band specifically before anything else.
3. **A2 end-of-2026 bundle** (~Sept 2026, offline-exact, **v3 baselines**): bucketed
   prediction HA {derby ≈20, true-home-vs-interstate ≈110, **neutral ≈0 (T33)**, else
   80}; flat HA re-sweep
   70–100; sigma third confirmation (then retire); finals-HA check (−2.71, n=45); plus
   **tips-first v4 re-evaluation** (full-2026 realized tips v4 vs v3) under the amended
   bar.
4. **D1 learned stacking head** (task list #9, unblocked): regularised logistic over
   {Elo diff, PAV zone diffs, HA bucket, lineup rating_points-rate diff (r=0.76 vs PAV
   per-game, Task 29)}. Strictly walk-forward, severe regularisation. Note: per the comp
   goal, evaluate its close-game sign accuracy and pooled tips, not just LogLoss.
5. **Per-team residual diagnostic on v4-class records** (Task 24 method) remains
   informative — offsets absorbed only part of the cellar bias (WCE −16.7 → −12.9) —
   but any fix must now also pass the tips criterion (v4 didn't).
6. **DOB backfill in afl-stats** would unblock age-curve priors (Task 30): coverage is
   0–52% in-window; fit on 1998–2014 once backfilled.

## Documented negatives (do not re-propose without new data)

Tasks 16/17/19/21/22/23 as before (contextual K, update-side venue HA, opponent-adjusted
PAV, zone slopes, era/rolling pred-HA, win-prob head variants, PAV-implied regression
targets). This session adds:
- **Convex/nonlinear rating→margin maps** (T24): tail bias is team-specific, not
  gap-specific; pooled effect real but ≤0.002-class. `margin_per_rating_point` is closed
  (ratio-equivalent to sigma; only MAE is new information, and it's sub-noise).
- **Rest-day differentials & binary travel flags** (T26): slope directionally wrong,
  everything sub-noise at n=1890. Resurrection: actual travel-distance/timezone data.
- **Round-phase blend schedules** (T27): per-phase optima incoherent and era-contradictory;
  all ramps ≥ baseline. The "PAV edge early-season" premise is dead within-model.
- **rating_points as PAV replacement/ensemble in the blend** (T29): r 0.90–0.95 with PAV
  at the consumed level. Lives on only as a D1 feature candidate.
- **Age-curve priors** (T30): blocked on DOB coverage, not refuted.
- **Standalone neutral-venue prediction HA** (T33): mechanism real (cluster replicates
  3 seasons, LogLoss improves both old windows) but +1 tip / −0.0011 pooled — sub-bar
  alone. Lives on only inside the A2 bucketed-HA bundle. Miss-pattern mining generally:
  79% of misses are consensus; don't re-mine v3 residuals without new information.

## Mechanics reminders

- Offline-exact evaluation now also covers **team offsets** (they depend only on
  persisted predictions+actuals; the engine replicates the offline numbers exactly).
  Update-side changes still need real backtests + bit-identity verification
  (`predha-080` → 0.8485, hash 2641f46f / `v4-shotoff` → 0.8409, hash 7af312c5).
- Squiggle API (api.squiggle.com.au, `q=tips`/`q=games`): set a User-Agent; comp scoring
  conventions = tips on completed games, draws correct for every source, rank only
  full-coverage sources. Team-name map: GWS Giants → Greater Western Sydney.
- New schema fields `.optional()`, never `.default()`.
- `backtest`/`predict`/`compare` warm up gap seasons implicitly. With team offsets, the
  live `predict` path generates virtual predictions over completed matches to keep
  offset state warm — `backtest -s 2026` and live `predict` agree by construction.
- Wrangler token: if D1 returns 401, run any `wrangler` command to refresh, then retry.
- League points-per-shot constant (3.64) is hard-coded in `elo.ts`
  (`LEAGUE_POINTS_PER_SHOT`); measured stable 3.60–3.67 across 2015–2025.
