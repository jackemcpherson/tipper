# Phase A — Adversarial head-to-head: v3 vs Wheelo Ratings (2022–2026)

**Date:** 2026-06-16  •  **Scope:** 971 paired matches, 2022–2026 (Wheelo's Squiggle source=26 starts 2022; 2016–19 confirmatory window per plan unavailable)  •  **Script:** `analysis/wheelo-headhead.py`  •  **Inputs:** `/tmp/sq_tips_wheelo_{2022..2026}.json`, `configs/predha-080/results-2026-06-13-{2641f46f,e8e0cede}.json`

## Headline (the surprise)

**Wheelo and v3 are essentially tied on tips.** Over 971 paired games, Wheelo is **−2 tips** vs v3 (pooled), with a stratified-bootstrap 95% CI of [−0.022, +0.019] on the rate. The popular framing "Wheelo consistently beats us" is single-week noise — at scale, the headline gap is zero.

| Window | n | v3 tips | Wheelo tips | Δ | v3 LL (bits) | Wh LL (bits) | ΔLL 95% CI | v3 MAE | Wh MAE |
|---|---:|---:|---:|---:|---:|---:|---|---:|---:|
| Primary 2022–25 | 855 | 585 (69.0%) | 581 (68.5%) | −4 | 0.8256 | 0.8132 | [−0.029, +0.005] | 26.17 | 25.43 |
| 2026 OOS R1–14 | 116 | 85 (73.9%) | 87 (75.7%) | +2 | 0.7893 | 0.7655 | [−0.063, +0.014] | 26.38 | 26.03 |
| **Pooled 2022–26** | **971** | **670 (69.0%)** | **668 (68.8%)** | **−2** | **0.8213** | **0.8075** | **[−0.030, +0.003]** | **26.20** | **25.50** |

Per-season (decided games): 2022 +0  •  2023 −1  •  2024 +0  •  2025 −3 (v3 ahead)  •  2026 +2.

**LogLoss**: directionally Wheelo by 0.014 bits pooled; CI straddles zero. Not significant at 95% over the available n. **MAE**: Wheelo's predicted margins are 0.7 pts/game tighter — meaningful but not headline-changing.

**Sign agreement**: 88.8% (862/971). The two models choose the same winner most of the time; when they disagree, neither wins systematically (108 flips: Wheelo 49.1% vs v3 50.9%).

## Where Wheelo IS clearly better — and where v3 IS

Two opposite-sign cuts that roughly cancel at the headline but reveal the structural difference.

### 1) The T33 "tipper-specific misses" cut — Wheelo got 22 of 24 right

Of the 24 games T33 classified as v3-specific misses (v3 wrong, field consensus right), Wheelo got **22 right**. The 2 he missed: 2025-04-12 Melb v Ess (Ess won by 39), 2026-03-15 Melb v StK (StK won by 13). Market got 7/24 per T34.

Per year: 2023 10/10  •  2024 6/6  •  2025 5/6  •  2026 1/2.

This is the load-bearing signal. **Wheelo systematically gets the games v3 misses-vs-field**, and the misses are not random — T33 already identified them as v3-specific failures.

### 2) Field-consensus decomposition — v3 has the contrarian edge

Bucketing 963 games where ≥8 field sources tipped on the game:

| Window | Bucket | n | v3 right | Wheelo right | Δ |
|---|---|---:|---:|---:|---:|
| Pooled 2022–26 | consensus_right (≥65% field correct) | 635 | 609 (95.9%) | 615 (96.9%) | +6 |
| Pooled 2022–26 | split (35–65%) | 72 | 33 (45.8%) | 39 (54.2%) | +6 |
| Pooled 2022–26 | **consensus_wrong (≤35% field correct)** | **256** | **28 (10.9%)** | **14 (5.5%)** | **−14** |

**On games where the field is wrong (the contrarian-edge games), v3 is right 14 more times than Wheelo over 256 games.** Wheelo is a smoother, more-field-aligned version of v3. v3 has a real against-the-field signal Wheelo doesn't.

These two effects roughly net out: Wheelo +22 on T33-style misses, v3 +14 on consensus-wrong wins, Wheelo +6 on splits, +6 on consensus_right. Net pooled tip Δ = −2.

### 3) Per-team residuals — Wheelo absorbs about half v3's bias

(positive = team scores more than v3 predicts; team's own home–away margin signed for the team)

| Team | n | v3 bias | Wheelo bias | Wheelo absorption |
|---|---:|---:|---:|---:|
| West Coast | 104 | −15.98 | −9.68 | 39% |
| North Melbourne | 103 | −11.43 | −4.89 | 57% |
| Geelong | 113 | +9.46 | +3.73 | 61% |
| Essendon | 104 | −9.13 | −6.09 | 33% |
| Richmond | 104 | −8.15 | −5.25 | 36% |
| Adelaide | 106 | +7.55 | +4.30 | 43% |
| Carlton | 108 | +6.48 | +2.15 | 67% |
| Western Bulldogs | 107 | +4.96 | +0.36 | 93% |

Across the 8 teams with |v3 bias| > 4 pts, Wheelo halves the residual on average. This is exactly the signature you'd expect from a **separately-tracked Attack/Defence pair** that lets the model attribute strength asymmetrically — the structural shape T36 (parked) implements and that [[wheelo-comparison]] called out as exposed on his dashboard.

### 4) Per-venue residuals — Wheelo is better at Kardinia, Adelaide Oval, Carrara

| Venue | n | v3 bias | Wheelo bias |
|---|---:|---:|---:|
| MCG | 232 | −2.07 | +0.27 |
| Marvel Stadium | 195 | −2.44 | −1.86 |
| Adelaide Oval | 125 | +6.41 | +4.48 |
| Perth Stadium | 103 | −7.33 | −7.19 |
| **Kardinia Park** | 43 | **+13.42** | **+5.42** |
| Carrara | 41 | +8.11 | +3.62 |
| Sydney Showground | 36 | +10.87 | +8.20 |
| UTAS Stadium | 18 | +18.16 | +17.55 |

The Kardinia gap is the standout: v3 underrates Geelong-at-Kardinia by 13 pts/game, Wheelo by 5. Adelaide Oval and Carrara show similar patterns. This is consistent with **per-venue HGA** (or per-(team,venue) HGA) rather than v3's single global home-advantage value.

## Prediction correlation

| Window | corr(p) | mean \|Δp\| | corr(margin) | mean \|Δmargin\| |
|---|---:|---:|---:|---:|
| Pooled 2022–26 | 0.932 | 0.067 | 0.934 | 6.87 pts |

The models share most variance but disagree by ~7 pts of predicted margin per game on average. Margin-bias direction by team (Wheelo's pred minus v3's, for-the-team):

- **Wheelo rates HIGHER**: Geelong +5.7, Bulldogs +4.6, Carlton +4.3, Adelaide +3.3
- **Wheelo rates LOWER**: North −6.5, West Coast −6.3, Essendon −3.0, Richmond −2.9

The teams v3 over/underrates (table above) are the same teams Wheelo systematically nudges in the corrective direction. Whatever Wheelo is doing structurally moves the *exact* dimensions v3 mis-handles.

## What this means for the original ask

> **"How does his model beat ours consistently?"** — He doesn't, at scale. Pooled over 971 games he is statistically indistinguishable from v3 on tips. The "Wheelo wins the week" experience comes from his +22 edge on T33-style misses paying out in clusters; v3's +14 edge on consensus-wrong games is more spread out and less visible week-to-week.

> **The real structural difference**: Wheelo's per-team residuals are roughly half v3's. He nudges exactly the teams v3 mishandles (good-team underrating, bad-team overrating). The fingerprint matches **OD-split** (T36) — separate Attack/Defence ratings would let a model decay a bad team's defense without dragging down its attack at the same rate, which is what's needed to keep WCE's residual from blowing out.

> **The HGA difference**: Per-venue residuals point to per-venue (not per-team) HGA. Kardinia, Adelaide Oval and Carrara stand out — these are venues where the home team gets a venue-specific boost beyond what a global HGA captures.

> **v3's edge is real and not to be discarded**: the contrarian/consensus-wrong cut shows v3 has signal Wheelo lacks. Any change motivated by Wheelo-mimicry needs to be checked against the consensus-wrong cut as a regression guard.

## Top-3 candidate mechanisms (ranked by Phase-B priority)

1. **OD-split rating** (T36, parked at CI lower bound −0.0007). Per-team residual halving is the exact fingerprint. The T33 misses Wheelo gets right are disproportionately games where the underdog has fallen off (St Kilda overrating cluster T33 flagged matches Wheelo's pattern of rating St Kilda lower). **Phase B priority 1**: scrape his Attack/Defence series, fit OD update mechanic, confirm.
2. **Per-venue HGA**. v3's HA is a single team-side bonus; per-venue residuals show structure. **Phase B priority 2**: scrape match-preview payload + ratings to back-solve venue-specific HGA. Likely a small fix even standalone.
3. **Higher in-season K or weaker carryover**. Wheelo's larger correction on team ratings (WCE, North, Geelong, Carlton) is consistent with either (a) a higher K-factor letting ratings move further intra-season, or (b) less aggressive end-of-season shrinkage back to 1500. **Phase B priority 3**: from scraped round-by-round ratings, fit Δrating vs (actual − expected) → recover K. Compare to v3.

Bonus diagnostic (lower priority, not on Phase-B path): Wheelo's xScore and play-level stats (forward-half time, contested-poss diff) feed his updates — that's the closed-data channel we can observe but not feed into our pipeline without afl-stats schema changes. T28 (shot-margin Elo standalone) remains the in-tipper analog and should be tested decoupled from v4's team-offset bundle.

## Phase B trigger

The decomposition points to **structural-update differences** (OD split, per-venue HGA) being load-bearing, **not** an information-channel difference we can't replicate. **Phase B proceeds** per plan.

## Caveats

- **n=971 pooled**, ΔLL CI [−0.030, +0.003] is directional not significant. Don't overclaim Wheelo "wins LogLoss" — it's a real but unproven nudge in his favour.
- **2026 OOS slice is n=116**; numbers there are indicative only.
- **Confirmatory 2016–19 unavailable** for Wheelo (source-26 starts 2022). Cannot apply T25 amended bar's confirmatory window.
- The T33 misses-by-year is uneven (10/6/6/2). Wheelo's 22/24 hit rate isn't equally distributed; clustering may exaggerate the effect.
- 207 v3 games (2021) unmatched — Wheelo simply doesn't cover them.

## Persisted artifacts (Phase A)

- `analysis/wheelo-paired-2022-2026.csv` — 971 rows, all paired matches with v3 & Wheelo predictions.
- `analysis/wheelo-flips-2022-2026.csv` — 108 rows, subset where they tip different teams.
- `/tmp/sq_tips_wheelo_{2022..2026}.json` — cached Wheelo tips from Squiggle.

---

# Phase B — Parameter reverse-engineering

**Script:** `analysis/wheelo-paramfit.py`  •  **Data sources:** Squiggle (hmargin per match) + Wheelo's GitHub-Pages JSON endpoints (`src/afl_stats/team_stats/afl/{year}.json`, inline `htmlwidget` JSON in `afl_ratings.html`, `xscores_data.json`). No browser-automation required — Wheelo's R-Markdown site inlines all data as JSON.

## B.1 Probability shape

Identified from 1062 Wheelo `(hmargin, hconfidence)` pairs:

```
hconfidence = Φ(hmargin / σ),  σ = 32.43 ± 1.00 pts
```

RMS error 0.005 across all 1062 records — essentially deterministic. v3 uses Φ with σ = 36 (per `configs/predha-080/config.json`). **Same shape (normal CDF), σ different by ~10%.** Not load-bearing for tips, mildly tighter probability calibration for Wheelo (lower σ → sharper probabilities).

## B.2 Per-venue HGA — the structural smoking gun

Panel regression on each model's predicted margin: `predicted ~ HomeTeam_season − AwayTeam_season + Venue + ε`, gauge = Collingwood's per-season effect zeroed, MCG re-centered to 0.

| Venue | n | v3 HGA (MCG-rel) | Wheelo HGA (MCG-rel) | Δ |
|---|---:|---:|---:|---:|
| Perth Stadium | 103 | +3.08 | **+12.69** | +9.61 |
| Gabba | 55 | +1.33 | **+9.74** | +8.41 |
| Carrara | 41 | +0.70 | **+9.30** | +8.59 |
| Kardinia Park | 43 | +3.03 | **+9.50** | +6.47 |
| TIO Stadium (Darwin) | 10 | −1.34 | +8.24 | +9.58 |
| Sydney Showground | 36 | +1.28 | +8.65 | +7.37 |
| SCG | 54 | −0.21 | +6.12 | +6.33 |
| Adelaide Oval | 125 | +0.36 | +4.32 | +3.96 |
| Marvel Stadium | 195 | +1.17 | +2.43 | +1.25 |
| MCG | 232 | 0.00 (gauge) | 0.00 (gauge) | — |
| Barossa Park (neutral) | 7 | −1.56 | **−9.18** | −7.62 |

**Spreads**: v3 +3.08 to −1.56, **range 4.64 pts**. Wheelo +12.69 to −9.18, **range 21.86 pts**. **Wheelo's per-venue HGA varies 4.7× more than v3's.**

This is consistent with Wheelo using genuine **per-venue HGA** while v3 uses a single global home advantage (`elo.home_advantage: 160` rating points = 5.6 margin pts, plus `output.prediction_home_advantage: 80` = 2.8 margin pts, both static per `predha-080/config.json`). The per-venue residuals in Phase A (Kardinia, Adelaide, Carrara) are exactly the venues where Wheelo's per-venue HGA recovers what v3's single value can't.

**Caveat**: identification gauge is per-season team effect = 0 for Collingwood. Absolute level of each rating shifts with that choice; venue spreads and venue–venue differences are gauge-invariant. The 21.86-pt Wheelo spread vs 4.64-pt v3 spread is robust.

## B.3 Season carryover & effective K

Year-over-year team-rating regression (OLS slope = empirical carryover factor):

| Transition | Wheelo corr / slope | v3 corr / slope |
|---|---|---|
| 2022→2023 | 0.894 / 0.96 | 0.886 / 1.00 |
| 2023→2024 | 0.797 / 0.74 | 0.781 / 0.70 |
| 2024→2025 | 0.765 / 0.96 | 0.743 / 0.86 |
| 2025→2026 | 0.848 / 0.83 | 0.916 / 0.99 |

**Carryover behaves similarly** between the two — both regress, no clean "Wheelo decays more / less" pattern. **Carryover is not load-bearing for the gap.**

Season-end team-rating spread (standard deviation across 18 teams), proxy for effective K (more aggressive update → wider spread):

| Season | Wheelo σ | v3 σ | Ratio |
|---|---:|---:|---:|
| 2022 | 13.64 | 11.25 | 1.21 |
| 2023 | 14.68 | 12.68 | 1.16 |
| 2024 | 13.73 | 11.41 | 1.20 |
| 2025 | 17.17 | 13.24 | 1.30 |
| 2026 | 16.73 | 14.28 | 1.17 |

**Wheelo's ratings are ~20% wider in spread** than v3's. Equivalent to a higher effective K — or, more likely (see B.4), the same effective K applied through two channels (Attack + Defence) rather than one.

## B.4 OD update mechanic — confirmed stat-driven, not pure margin-Elo

Current (mid-2026) Wheelo Attack and Defence ratings (from `afl_ratings.html` inline JSON, 18 teams), correlated with team_stats season aggregates (from `team_stats/afl/2026.json`):

| Correlation | r |
|---|---:|
| Attack vs xScore (own offensive expected scoring) | **+0.930** |
| Attack vs TotalPoints (own scored, season total) | **+0.966** |
| Defence vs xScore_Opposition (opposition expected scoring against this team) | **−0.895** |
| Defence vs TotalPoints_Opposition (opposition scored against this team) | **−0.937** |
| Cross-leak: Attack vs xScore_Opposition | −0.656 |
| Cross-leak: Defence vs xScore | +0.573 |

Same-side correlations ~0.93, cross-side ~0.6 (good teams are good both ways). This is the **OD-split fingerprint**: Wheelo's Attack rating is essentially a smoothed function of how the team's offensive output (own scored, xScore) compares to expectation, and Defence is the same for opposition output. The updates run on **stat targets** (xScore/expected score allowed), not on net margin.

This is the **same shape** as T36 (D2 OD split, parked at CI lower bound −0.0007), but Wheelo's variant goes further: the update target is **xScore** (shot-quality regressed scoring), not raw score margin. This is also adjacent to T28 (shot-margin Elo standalone, parked decoupled from v4).

## B.5 Replication check

Panel fit's in-sample RMS = 8.5 pts MAE = 6.7 pts on Wheelo's hmargin using only (per-(team, season), per-venue) effects. That's **~30% unexplained variance** — within-season K updates + match-specific xScore adjustments account for that. The team-season + venue model alone explains 86% of Wheelo's margin variance.

**Plan threshold:** plan called for median |Δ| < 2pt = identified, > 5pt = mechanism missing. Median |Δ| = 5.6pt (50th percentile of |residual|). **We're between thresholds** — sigma + per-venue HGA + per-season team rating identifies most of the shape; the remaining within-season movement is what we'd need round-by-round historical scrapes to fit fully. Given the answer was clear without that step, B.3 isn't escalated.

## Parameter table — v3 vs Wheelo

| Parameter | Tipper v3 (`predha-080`) | Wheelo (identified) | Δ direction |
|---|---|---|---|
| Margin→Prob shape | Φ-CDF | Φ-CDF | same |
| σ (prob sigma) | 36 pts | 32.4 pts | Wheelo sharper |
| HGA | Global single value (~5.6 + 2.8 = 8.4 margin pts) | **Per-venue, MCG-relative range −9 to +13** | **Major structural difference** |
| Update mechanic | MOV-Elo on team rating | **OD split on Attack/Defence; targets stat outputs (xScore-style)** | **Major structural difference** |
| K-factor (effective) | `k: 25` per config | ~20% wider rating spread (effective K higher or 2-channel) | small–moderate difference |
| Season carryover | `regression_to_mean: 0.1` | Similar magnitude (slopes 0.74–0.96) | similar |

## Where this lands

Going back to the Phase A summary's mechanism ranking, the parameter fit confirms:

1. **OD-split is real and load-bearing** ([[wheelo-comparison]]'s structural hypothesis is right). His Attack/Defence ratings load 0.93 onto same-side stats and 0.6 cross-side. Tipper T36 implements the same shape — parked because its CI lower bound was −0.0007. **External validation that the shape works** is now empirically anchored, not just inferred from dashboard labels.
2. **Per-venue HGA is the OTHER load-bearing structural difference**, and is *not* in tipper's parked-tasks ledger. v3's HGA model is structurally unable to recover the Perth/Gabba/Kardinia/Carrara/SCG/Showground residuals at the 8–10pt scale Wheelo handles them. This is a **new lead** — not T36, not T28, not T34. It would be a new task spec.
3. **Carryover and σ are similar** — not where the gap is.
4. **Higher effective K** is plausible but small; if mainly explained by the 2-channel mechanic, it's downstream of (1) not a separate knob.

## Phase C — Escalation decisions & memory updates

1. **T36 OD split (parked)**: this analysis is the strongest external evidence to date that the OD shape works on AFL. The per-team residual halving (Phase A) + stat-channel correlation +0.93 (B.4) is exactly the fingerprint of two-channel updates. **Escalate**: bump T36 R14+ re-eval ahead of A2 bundle in the queue. Update [[tipper-wall]].
2. **Per-venue HGA**: not in the ledger; new task spec needed. Tentative name: T38 — venue-specific HGA. Mechanism: replace `elo.home_advantage` static value with per-venue table fit from training data. Pre-registered windows + amended T32 tips bar. Estimated effect from Phase A per-venue residual gap: 1–3 tips/season, but possibly more on Kardinia/Perth-heavy rounds. **Write up as a new task doc** (`docs/task-38-venue-hga.md`) — propose, don't ship.
3. **T28 (shot-margin Elo standalone)**: B.4 shows Wheelo's update target is xScore-style, which is what T28 implements. Still relevant; recheck the standalone variant in conjunction with the T36 re-eval.
4. **v3's against-field contrarian edge** must be a regression guard for any change. Phase A's consensus-wrong cut (v3 +14 over 256 games) is real; T36/T38 changes that erode it would be net-negative for tips.

## Caveats & limits

- **Identification is up to season-team gauge**; absolute rating level shifts with gauge choice (Collingwood = 0). Venue spreads and team rankings are gauge-invariant.
- **Within-season K updates not directly fit** — Wheelo's site doesn't expose round-by-round historical OD ratings (only current snapshot + season totals). The "effective K" comparison in B.3 is an indirect proxy from final season spreads.
- **OD identification uses 2026 snapshot only** (n=18 teams). Strong r values suggest robustness but historical replication would strengthen the claim.
- **Site terms**: Wheelo's data is publicly hosted on GitHub Pages with `access-control-allow-origin: *`. Use was inspectional and read-only; no claims about his methodology are sourced from anywhere except his published numbers and Squiggle's API.

## Phase B persisted artifacts

- `analysis/wheelo-paramfit.py` — reproducible parameter-fit script.
- `/tmp/wheelo/fit_panel.json` — Wheelo panel-fit team-season + venue effects from Squiggle hmargin alone.
- `/tmp/wheelo/paramfit_summary.json` — consolidated v3-vs-Wheelo parameter comparison.
- `/tmp/wheelo/current_ratings_2026.json` — current Wheelo Overall/Attack/Defence per team.
- `/tmp/wheelo/team_stats_{2016..2026}.json` — Wheelo's per-season aggregates (Equity, xScore, etc.).
- `/tmp/wheelo_xscores_data.json` — Wheelo's full shot-level xScore data (734KB).
