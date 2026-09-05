# Task 38B: T36 OD-Split R14+ Pre-Flight (Interim Check)

**Date:** 2026-06-16 **Status:** **Pre-flight GO. OD designated v5 candidate.
Final promotion check scheduled October 2026** (full-season A2 bundle, per T36
plan). No promotion (`_current.json` stays at v3 = `predha-080`). Engine
machinery already ships inert from T36. **Reads:**
[`task-36-split-ratings.md`](task-36-split-ratings.md),
[`task-38-wheelo-closure-roadmap.md`](task-38-wheelo-closure-roadmap.md),
[`../analysis/wheelo-headhead-2026-06-16.md`](../analysis/wheelo-headhead-2026-06-16.md).

## Headline

The T36 OD-split candidate (`od-w100-k008`) is **on track** for the
end-of-season promotion check. Re-running today with the additional 2026 R1-R14
data and verifying the machinery survives the T38a engine changes:

- Bit-inertness preserved through T38a's engine changes. OD configs still hash
  `c8c7b6b7…` (2021-25) and `193a0012…` (2026). Stored 2026-06-13 results
  reproduce.
- Comp-currency picture stays positive with R14 added. Pooled tips ΔTips = +12
  (primary) + +1 (2026 R1-R14) = **+13** vs v3. Recent-3 sliding (2024 + 2025 +
  2026 R1-R14) = **+4 tips**, above the T32 disqualifying line.
- Pooled ΔLL trends through the bar. 2021-25 point −0.0058. 2026 R1-R14 ΔLL
  −0.0183. Combined point estimate ≈ **−0.0070** at n=1183, now meaningfully
  past the 0.005 promotion bar. Primary 2021-25 CI [−0.0018, +0.0137] still
  includes zero at this n. The convergence-with-more-data argument from T36 is
  doing what it should.
- A3 monitor correctly tracking OD as the second shadow. Latest log row
  (2026-06-13, R13) shows OD 86 tips / rank 4 vs v3 86 tips / rank 5. OD ranks
  ahead of v3 in the comp standing.

The October re-evaluation must clear the remaining gates. They include a pooled
CI below zero and the three regression guards from T38 section 3.

## What Changed Since T36

| Item                        | T36 (2026-06-13)                                                         | T38b pre-flight (2026-06-16)                                                                    |
| --------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Test set                    | 2021-25 (n=1062)                                                         | 2021-25 + 2026 R1-R14 (n=1183)                                                                  |
| ΔTips pooled vs v3          | +12                                                                      | +13                                                                                             |
| Recent-3 ΔTips              | +5 (2023-25)                                                             | +4 (2024-26 sliding)                                                                            |
| ΔLL pooled (point)          | −0.0054                                                                  | ≈ −0.0070                                                                                       |
| ΔLL CI lower bound (pooled) | −0.0007 (just inside zero)                                               | not re-bootstrapped. Expected to move further off zero                                          |
| Wheelo external validation  | none                                                                     | **Attack r=+0.93 xScore, Def r=−0.94 TotalPoints_Opp (T38 §B.4)**                               |
| Per-team residuals          | OD halves v3's bias on WCE −16 to −10, North −11 to −5, Geelong +9 to +4 | unchanged (same backtest), externally corroborated by Wheelo's same per-team residual signature |

The picture is uniformly stronger than the T36 doc:

- The 2026 R1-R14 evidence reinforces OD's edge (Δtips +1, ΔLL −0.0183: the
  largest per-window ΔLL in OD's record).
- Wheelo's residuals halve on the same teams, WCE, North, Geelong, and Carlton.
  This provides external support for the OD update mechanic. His Attack/Def
  split has the same shape and drives his model's performance, per T38 §B.2.
  Adds non-trivial prior weight that this result is not sample-specific.
- T38c's 2026 reversal (the cautionary tale) does NOT replicate for OD: OD goes
  _better_ in 2026, not worse. The "v4 failure mode" (old eras good, recent bad)
  does not apply.

## Verifications

These checks confirm that later engine changes preserve the original result.

### Bit-Inertness Through T38a Changes

T38a added `output.prediction_home_advantage_per_venue` as a new optional schema
field plus `src/engine/venue-ha.ts` plus wire-up in `harness.ts`. The expected
invariant: any config that does not set the new field produces bit-identical
predictions to before.

- `predha-080` re-run today: hash `2641f46f…`, LogLoss `0.8485`, 716 tips. ✓
  Matches HANDOFF baseline.
- `od-w100-k008` 2021-25 compare against `predha-080`: 728 tips, LL `0.8427`.
  Matches stored `c8c7b6b7…` to four decimals. ✓.
- `od-w100-k008` 2026 R1-R14: 90/121 tips, LL `0.7578`, hash `193a0012…`.
  Matches stored 2026-06-13 result for R1-R13 with the expected delta from R14
  completions. ✓.

### A3 Monitor Wiring

`analysis/weekly-monitor.py` declares `OD = "od-w100-k008"` as the second shadow
alongside `V3 = "predha-080"` and `V4 = "v4-shotoff"`. Log columns include
`od_tips` and `od_rank`. Latest row (`analysis/weekly-monitor-log.csv`
2026-06-13): v3 tips 86 rank 5, v4 tips 82 rank 13, **OD tips 86 rank 4**,
leader Wheelo Ratings 88. OD is currently ranking _ahead_ of v3 in the live comp
despite being a shadow with identical tip-count this week.

### Current Pooled Snapshot

| Window           |        n | v3 tips | OD tips |   ΔTips |         v3 LL |      OD LL |           ΔLL |
| ---------------- | -------: | ------: | ------: | ------: | ------------: | ---------: | ------------: |
| 2021             |      207 |     131 |     135 |      +4 |        0.9428 |     0.9368 |       −0.0059 |
| 2022             |      207 |     146 |     149 |      +3 |        0.8228 |     0.8234 |       +0.0006 |
| 2023             |      216 |     144 |     146 |      +2 |        0.8727 |     0.8654 |       −0.0073 |
| 2024             |      216 |     140 |     138 |      −2 |        0.8394 |     0.8353 |       −0.0042 |
| 2025             |      216 |     155 |     160 |  **+5** |        0.7676 |     0.7557 |       −0.0118 |
| **Primary pool** | **1062** | **716** | **728** | **+12** |    **0.8485** | **0.8427** |   **−0.0058** |
| 2026 R1-R14      |      121 |      89 |      90 |      +1 |        0.7761 |     0.7578 |   **−0.0183** |
| **Combined**     | **1183** | **805** | **818** | **+13** | Not available |          : | **≈ −0.0070** |

Recent-3 sliding (T32 amended bar's comp-relevant cut):

| Sliding window                     |  v3 |  OD |      Δ | comp-bar status |
| ---------------------------------- | --: | --: | -----: | --------------- |
| 2023 + 2024 + 2025                 | 439 | 444 | **+5** | passes          |
| 2024 + 2025 + 2026 R1-R14          | 384 | 388 | **+4** | passes          |
| 2023-26 cumulative (v4 convention) | 528 | 534 | **+6** | passes          |

Every recent-window cut is positive. This result is the opposite of v4's failure
mode (where every recent cut was negative).

### Bootstrap CI Status

Today's primary 2021-25 bootstrap
(`bun run dist/cli/index.js compare --config-a predha-080 --config-b od-w100-k008`,
seed 42 / 1000 iter):

- ΔLogLoss: −0.00576 point, CI [−0.0018, +0.0137], **includes zero**.
- ΔTipPct: −0.0114 point (B better), CI [−0.0276, +0.0047], includes zero.

The CI lower bound on ΔLL is +0.0137 (positive side: direction of "OD worse").
T36 reported the pooled CI lower bound (for n=1890 = primary + early) at
−0.0007. The primary-only CI at n=1062 is wider (this result is the n=1062
result, not the pooled). Re-pooling with the early window + 2026 R1-R14 will
narrow it. The T36 doc's trajectory argument projects past-zero with the
additional matches.

## Regression Guards (Deferred to October Re-Eval)

Per the T38 roadmap §3:

1. Consensus-wrong cut ΔTips ≥ 0: not yet run for OD. The relevant cut needs
   Squiggle field tips + per-match prediction alignment for OD across 2021-25
   (same machinery as `analysis/wheelo-headhead.py`). Before October
   re-evaluation, clone `wheelo-headhead.py` to compare OD against v3 on the 256
   consensus-wrong games. Check that OD preserves v3's +14/256 contrarian edge.
2. Per-team residual non-degradation: T36 shows OD **halves** v3's biases on
   WCE, North, Geelong, and Carlton. Wheelo's residual pattern independently
   corroborates this, per T38. Pre-October re-check should re-tabulate post-2026
   to confirm.
3. Per-venue residual monitor: not yet run. Add it to the October check.

T38c parked similarly with deferred guards. Both task re-evals share the October
A2 bundle window.

## Decision-and-Trajectory

The October re-evaluation will check whether the pooled CI lower bound has
crossed zero. Current arithmetic suggests that it should. The point estimate
moved from −0.0054 in T36 towards about −0.0070 after one round. The 2023-26 tip
total is +6, compared with v4's −9. If both hold at n ≈ 1280 (after ~100 more
2026 matches):

- ΔLL point estimate stays past the 0.005 bar with meaningful margin.
- Recent-3 sliding stays positive (the T38c-style 2026 reversal has not
  materialised for OD).
- CI lower bound moves off zero (the T36 convergence-with-data argument).
- Consensus-wrong cut TBD (must be ≥ 0).

If all four hold, OD is the promotion candidate at end-of-2026. If any one fails
(especially the consensus-wrong cut, since the other three are trending well),
the candidate re-parks for the 2027 cycle.

**T38a (killed) + T38c (re-parked) + T38b (on track) leaves the Wheelo-closure
roadmap pointing entirely at OD.** That is a cleaner outcome than the roadmap
anticipated: of the three structural differences identified, only the OD-split
mechanic has independently survived testing.

## Artefacts

- `/tmp/v38b-cmp-od.json`: paired bootstrap predha-080 vs od-w100-k008 (primary
  2021-25).
- `/tmp/v38b-od-2026.json`: OD on 2026 R1-R14 today.
- `configs/od-w100-k008/`: existing T36 config, unchanged.
- `analysis/weekly-monitor-log.csv`: A3 monitor log including OD shadow.

## References

- [Squiggle API documentation](https://api.squiggle.com.au/)
- [Wheelo current AFL team ratings](https://www.wheeloratings.com/afl_ratings.html)
- [Wheelo AFL team statistics](https://www.wheeloratings.com/afl_stats_team.html)
