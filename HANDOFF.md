# Handoff — next research session

**State as of 2026-06-13 (post Tasks 24–36, June re-think fully executed):** **v3 current**
(`predha-080`, release 3.3.1). v4 (`v4-shotoff` = scoring-shot Elo + team offsets) was
promoted and **reverted the same day** (Task 32): it wins LogLoss/MAE but loses tips —
the Squiggle comp metric — in every recent season (2023–26: 0/−4/−1/−4, −9 over 763
games). No live predictions were issued under v4. Its machinery stays in the engine,
bit-inert when unset; tips-first re-evaluation at 2026 season end.

**Task 36 result:** OD split ratings (`od-w100-k008`) — last untested structural idea —
is **parked, not promoted**. Comp-currency picture flips v4: pooled close-band sign +18,
recent-3 tips +5 (vs v4 −9), 2026 R1-R14 Δ LogLoss −0.0182 with tied tips. Pooled Δ
LogLoss −0.0054 (above bar) but CI lower bound −0.0007 just inside zero; misses strict
bar by the marginal failure mode, not the v4 failure mode. Engine machinery ships inert;
OD added as second shadow in the A3 monitor alongside v4. Read
`docs/task-36-split-ratings.md`.

**DOB backfill done** — players.date_of_birth coverage 1998–2014 went 0–10% → 99% via
afl-stats `scripts/backfill-dob.mts`.

**Task 37 result (Task 30 tipper-side): killed on T35 fingerprint.** Within-player
1998–2014 age-transition curve applied as a multiplier on the R1 PAV prior; pre-registered
test ran the dose sweep w ∈ {0.25, 0.5, 0.75, 1.0}. **Pooled LogLoss got WORSE** in
both training windows (Δ +0.0016 primary, +0.0015 confirmatory); tips marginally positive
(+3 primary, +8 confirmatory, +2 recent-3). 2026 OOS Δ LL −0.0047 but inside the noise
floor at n=117. Root cause: survivor-bias in the within-player fit + tiny lever arm at
K=15 (R1 prior loses to current PAV by R8). Engine machinery (`prior.ts` age curve,
`pav.age_curve_weight` schema, DOB plumbing through `HarnessData`) ships inert; no
config ships. Read `docs/task-37-age-curve-priors.md`.

**Task 38 result (2026-06-16): Wheelo adversarial review — three candidate tasks queued, all
three worked through.** Head-to-head over 971 paired matches 2022–26 found tipper and Wheelo
**statistically tied on tips** (Δ −2, CI [−0.022, +0.019]); ΔLogLoss −0.014 directional, CI
straddles zero. Decomposition into two opposite-sign cuts that cancel: Wheelo wins T33-style
misses 22/24, v3 wins consensus-wrong games +14/256 (the against-the-field contrarian edge).
Parameter fit identified two load-bearing structural differences: **per-venue HGA (Wheelo
range 21.9 pts vs v3 4.6 pts)** and **stat-driven OD split (Attack r=+0.93 with xScore,
Defence r=−0.94 with TotalPoints_Opposition)**.

**Outcomes (same day, 2026-06-16):**
- **38a per-venue HGA — KILLED** (`docs/task-38a-per-venue-hga.md`). Walk-forward residual
  fit, α∈{1, 0.5} × min_n=5. Primary 2021–25 ΔLL −0.003 sub-bar (CI [−0.007, +0.013] includes
  zero); pooled tip regression −4 on both variants; **direction reversal on early window**
  (ΔLL +0.014 / +0.004 worse) kills it via the confirmatory criterion. Engine machinery ships
  inert (`src/engine/venue-ha.ts`, `output.prediction_home_advantage_per_venue`); bit-inert
  verified (predha-080 still hashes `2641f46f`, LogLoss `0.8485`, 716 tips). The Wheelo 21.9-pt
  per-venue range is most likely team-strength leakage, not pure venue effect.
- **38c T28 standalone shot-margin — RE-PARKED with 2026 warning** (`docs/task-38c-shot-margin-restest.md`).
  Original T28 numbers reproduce bit-identically (primary +5 tips / ΔLL −0.0034 sub-bar; early
  +6 / −0.0064; pooled CI [−0.0102, +0.0009] just barely inside zero). **New 2026 R1–R14 OOS
  evidence reverses direction**: ΔTips −2, ΔLL +0.0069. Sliding recent-3 (2024+25+26) ΔTips
  −4 — the v4 failure mode shape. Verdict deferred to October A2 re-test; if full-2026 also
  reverses, this becomes a kill.
- **38b T36 OD R14+ — PRE-FLIGHT GO, designated v5 candidate** (`docs/task-38b-od-preflight.md`).
  With R14 added: pooled ΔTips +13, recent-3 sliding (2024–26) +4 (passes T32 disqualifying
  line), ΔLL pooled point estimate ≈ −0.0070 (now meaningfully past the 0.005 bar — was
  −0.0054 at T36). 2026 R1–R14 ΔLL −0.0183 specifically (largest per-window LL gain in OD's
  record). Machinery bit-inert through T38a changes; A3 monitor correctly tracking OD as
  second shadow (rank 4 at R13 vs v3 rank 5). `_current.json` stays at v3 = `predha-080`
  pending October re-eval (pooled CI lower bound crosses zero + consensus-wrong regression
  guard TBD).

**Net Wheelo-closure picture:** of the two identified structural gaps, per-venue HGA is dead
(38a) and OD-split is alive (38b). The Wheelo head-to-head gap most likely lives entirely in
the OD update mechanic, not in HGA structure. Read
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
   blind spot at the field's information level.** Neutral≈0 added to the A2 bucketed-HA
   bundle below. St Kilda overrating (6/6 "tipped StK, lost", 3 seasons) noted as
   diagnostic only. T34 then quantified the information ceiling: even the closing
   market adds ~1–2 tips/season — 2027 comp strategy is v3-class skill + variance, with
   D1 (stack) and A2 (bundle) the remaining live modelling bets.
1. **A3 weekly comp monitoring SHIPPED** — `analysis/weekly-monitor.py`. Refreshes v3
   + v4-shadow backtests, scores against the Squiggle field on tips, close-band
   (|v3 pred margin| < 12) sign accuracy, and a market column (Punters source 5,
   T34 ≈ closing odds). Alerts at ±3 tips season-to-date drift (exit code 2). Log:
   `analysis/weekly-monitor-log.csv`, one row per run date (idempotent same-day). First
   run 2026-06-13 R14: v3 86/116 (rank 4/30, leader Wheelo 88), v4-shadow 82 (rank 12),
   market gap +3 (alert fired — v3 currently ahead of the closing market). Add OD
   (`od-w100-k008`) as a second shadow row once T36 machinery ships.
2. **Close-game sign accuracy is the new top modelling target.** The comp is decided in
   the |margin| < 2-goal band, where v3 beats v4. Any future candidate should be
   diagnosed on that band specifically before anything else.
3. **A2 end-of-2026 bundle** (~Sept 2026, offline-exact, **v3 baselines**): bucketed
   prediction HA {derby ≈20, true-home-vs-interstate ≈110, **neutral ≈0 (T33)**, else
   80}; flat HA re-sweep
   70–100; sigma third confirmation (then retire); finals-HA check (−2.71, n=45); plus
   **tips-first v4 re-evaluation** (full-2026 realized tips v4 vs v3) under the amended
   bar.
3b. ~~D4 market-aware mode~~ **Closed 2026-06-13** (`docs/task-34-market-benchmark.md`;
   product decision: benchmark only, tipper stays market-independent). Closing market
   vs v3: +10 tips on 2016–19 but +2 on 2021–25, +0 on 2026, and v3 *beat the market by
   6 in 2024*; market LogLoss edge (−0.015/−0.035) is calibration the comp doesn't
   score. Market right on 17/24 T33 tipper-specific misses but wrong on 17/23 mirror
   games — v3's against-the-field edge is also against-the-market and would be diluted
   by any ensemble. The closing market would have won none of the last four comps.
4. ~~D1 learned stacking head~~ **Killed 2026-06-13** (`docs/task-35-stacking-head.md`):
   three walk-forward variants (ridge margin, logistic sign, residual-shrinkage toward
   v3) all significantly worse than v3 on pooled LogLoss (+0.010 to +0.015, CIs exclude
   zero) AND tips (−14 to −32). Harness validated (lite replica recovers v3 at corr
   0.99+). The features beyond Elo/PAV carry no incremental signal (T22/T26/T27/T33);
   a stack is a combiner, not a source. Resurrection: a new feature that first survives
   a univariate pre-registered test.
5. **Per-team residual diagnostic on v4-class records** (Task 24 method) remains
   informative — offsets absorbed only part of the cellar bias (WCE −16.7 → −12.9) —
   but any fix must now also pass the tips criterion (v4 didn't).
6. ~~DOB backfill in afl-stats~~ **Done 2026-06-13** (AFL-MCP `scripts/backfill-dob.mts`):
   coverage 1998–2014 0–10% → 99–100%. Source: AFL Tables all-time team lists via fitzroy
   (with direct-fetch override for Brisbane Lions where fitzroy's slug map is wrong).

7. ~~Age-curve PAV priors (T37 / T30 tipper-side)~~ **Killed 2026-06-13** on the T35
   fingerprint: pooled LL +0.0015–0.0016 in both training windows, tip gain sub-noise.
   Lever arm too short at K=15 + within-player fit suffers survivor bias. Engine
   machinery ships inert. Resurrection: selection-corrected curve OR per-zone curve OR
   R1-R4-only application (none queued — see task-37 doc).

8. **T38b OD shadow + R14+ accumulation (PRE-FLIGHT GO 2026-06-16; v5 candidate)**.
   `docs/task-38b-od-preflight.md`. Pre-flight check with R14 added: pooled ΔTips +13
   (was +12 at T36), recent-3 sliding (2024–26) +4 (passes T32 disqualifying line), ΔLL
   pooled point ≈ −0.0070 (now past 0.005 bar, was −0.0054 at T36). 2026 R1–R14 ΔLL
   −0.0183 specifically (largest per-window LL gain in OD's record). Machinery bit-inert
   through T38a engine changes; A3 monitor correctly tracking OD as second shadow (rank
   4 at R13 vs v3 rank 5). **Wheelo review (T38) externally validates the OD shape**:
   Wheelo's Attack r=+0.93 with xScore, per-team residuals halve v3's on the same teams.
   October re-eval (A2 bundle) checks: pooled CI lower bound crosses zero + consensus-wrong
   regression guard (TBD — write OD-vs-v3 clone of `analysis/wheelo-headhead.py` before
   October). If all four gates pass, OD is the 2026-end promotion candidate.

9. ~~T38a per-venue HGA~~ **Killed 2026-06-16** (`docs/task-38a-per-venue-hga.md`):
   walk-forward residual fit fails on three counts — pooled tip regression (−4 both α
   variants), ΔLL CI includes zero on primary, **direction reversal on early window**
   (ΔLL +0.014 / +0.004 worse). Engine machinery ships inert
   (`src/engine/venue-ha.ts`, `output.prediction_home_advantage_per_venue`). Resurrection
   conditions: team-venue interaction term (not venue-only intercept) to remove
   team-strength leakage; OR fold into A2 bucketed-HA bundle (the T33 neutral piece
   already lives there, the bucketing is sample-efficient).

10. ~~T38c T28 standalone shot-margin re-test~~ **Re-parked 2026-06-16 with 2026 warning**
    (`docs/task-38c-shot-margin-restest.md`). Pre-2026: clean (+5/+6 tips both windows,
    pooled ΔLL −0.0047 just inside zero on CI). New 2026 R1–R14: ΔTips −2, ΔLL +0.0069
    — direction reversal. Sliding recent-3 (2024–26) −4 tips. Decision deferred to A2
    full-2026 re-test in October; if 2026 stays reversed, kill instead of re-park.

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
- **Learned stacking head over existing features** (T35): all variants significantly
  negative on both metrics; walk-forward estimation variance with no incremental signal
  to buy. Do not relitigate without a feature that survives a univariate test first.
- **Age-curve PAV priors as a global multiplier** (T37, the first feature run under the
  T35 pre-registration rule): pooled LL worsens both training windows; lever arm
  too short at K=15. Resurrection conditions are non-trivial structural changes
  (selection-corrected curve, per-zone curve, R1-R4-only dose) — see task-37 doc.
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
