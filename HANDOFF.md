# Handoff — next research session

**State as of 2026-06-12 (post Tasks 24–31, June re-think executed):** **v4 promoted**
(`v4-shotoff`, release 3.3.0) = scoring-shot Elo updates (`shot_margin_weight: 1.0`)
+ walk-forward team offsets (`team_offset: {k: 32, season_carry: 0.5}`).
Scored baselines: **2021–2025 LogLoss 0.8409** (tips 68.1%, MAE 25.97) and
**2016–2019 confirmatory window 0.8454** (config `predha80-early` family; n=1,890 total).
Read `docs/task-31-team-offsets-v4.md` first, then `docs/task-25-window-expansion.md`
for the evaluation procedure.

## Evaluation procedure (changed this session — Task 25)

1. Primary window 2021–2025: promotion bar Δ > 0.005 unchanged.
2. Early window 2016–2019: mandatory confirmatory run (offline-exact where
   prediction-side; real backtest on the `-early` config variant where update-side).
3. Headline significance: `bootstrapCompareStratified` (metrics.ts) across both windows,
   seed 42 / 1000 iter. Read CI magnitudes, not just the excludesZero flag (it has no
   epsilon — a 1e-15 delta can "exclude zero").
4. **The 2026 gate was burned 2026-06-12** for the v4 decision (came back flat). The OOS
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

1. **Re-run the per-team residual diagnostic on v4 records** (Task 24 method, offline).
   Offsets only partially absorb the cellar-dweller bias (WCE −16.7 → ~−12.9). What
   remains is the top modelling target. Geelong (+8–10 both eras) may be the T22
   true-home-ground structure — disentangle from offsets before A2.
2. **A2 end-of-2026 bundle** (~Sept 2026, offline-exact **against v4 baselines**):
   bucketed prediction HA {derby ≈20, true-home-vs-interstate ≈110, else 80}; flat HA
   re-sweep 70–100; sigma third confirmation (then retire); finals-HA check (−2.71,
   n=45). Re-derive all of these on v4 records first — offsets may have moved them.
3. **D1 learned stacking head** (task list #9, unblocked): regularised logistic over
   {Elo diff, PAV zone diffs, HA bucket, lineup rating_points-rate diff (Task 29 found
   r=0.76 vs PAV per-game — the only place that signal is worth anything)}. Strictly
   walk-forward, severe regularisation. This is the remaining structural bet.
4. **DOB backfill in afl-stats** would unblock age-curve priors (Task 30): coverage is
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

## Mechanics reminders

- Offline-exact evaluation now also covers **team offsets** (they depend only on
  persisted predictions+actuals; the engine replicates the offline numbers exactly).
  Update-side changes still need real backtests + bit-identity verification
  (`predha-080` → 0.8485 / `v4-shotoff` → 0.8409, hash 7af312c5).
- New schema fields `.optional()`, never `.default()`.
- `backtest`/`predict`/`compare` warm up gap seasons implicitly. With team offsets, the
  live `predict` path generates virtual predictions over completed matches to keep
  offset state warm — `backtest -s 2026` and live `predict` agree by construction.
- Wrangler token: if D1 returns 401, run any `wrangler` command to refresh, then retry.
- League points-per-shot constant (3.64) is hard-coded in `elo.ts`
  (`LEAGUE_POINTS_PER_SHOT`); measured stable 3.60–3.67 across 2015–2025.
