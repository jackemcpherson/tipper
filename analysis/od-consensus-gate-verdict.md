# OD-split October promotion gate — current verdict

**Date:** 2026-06-30
**Script:** `analysis/od-consensus-gate.py`

## Results files used

| Config | File | Seasons |
|--------|------|---------|
| v3 (predha-080) | `configs/predha-080/results-2026-06-30-2641f46f.json` | 2021–2025 (1062 matches) |
| v3 (predha-080) | `configs/predha-080/results-2026-06-30-e8e0cede.json` | 2026 (135 matches) |
| OD (od-w100-k008) | `configs/od-w100-k008/results-2026-06-30-c8c7b6b7.json` | 2021–2025 (1062 matches) |
| OD (od-w100-k008) | `configs/od-w100-k008/results-2026-06-30-193a0012.json` | 2026 (135 matches) |

Paired total: 1197 graded matches across 2021–2026. Coverage: zero unmatched matchIds.

## Gate 4 — consensus-wrong bucket table

Field consensus computed from Squiggle full field (2021–2026), n_with ≥ 8 sources required. Buckets: consensus_right (field share ≥ 0.65), split (0.35–0.65), consensus_wrong (share ≤ 0.35).

| Window | Bucket | n | v3 tips | OD tips | ΔTips | v3 LL | OD LL | ΔLL |
|--------|--------|---|---------|---------|-------|-------|-------|-----|
| primary 2021-25 | consensus_right | 689 | 654 (94.9%) | 655 (95.1%) | +1 | 0.5391 | 0.5447 | +0.0056 |
| primary 2021-25 | split | 72 | 28 (38.9%) | 36 (50.0%) | +8 | 1.0681 | 1.0316 | −0.0365 |
| primary 2021-25 | consensus_wrong | 291 | 34 (11.7%) | 37 (12.7%) | +3 | 1.5154 | 1.4895 | −0.0259 |
| 2026 OOS | consensus_right | 88 | 87 (98.9%) | 87 (98.9%) | +0 | 0.4565 | 0.4690 | +0.0125 |
| 2026 OOS | split | 14 | 9 (64.3%) | 12 (85.7%) | +3 | 0.9413 | 0.8900 | −0.0513 |
| 2026 OOS | consensus_wrong | 32 | 4 (12.5%) | 2 (6.2%) | −2 | 1.5715 | 1.4895 | −0.0820 |
| pooled 2021-26 | consensus_right | 777 | 741 (95.4%) | 742 (95.5%) | +1 | 0.5297 | 0.5361 | +0.0064 |
| pooled 2021-26 | split | 86 | 37 (43.0%) | 48 (55.8%) | +11 | 1.0475 | 1.0085 | −0.0389 |
| pooled 2021-26 | consensus_wrong | 323 | 38 (11.8%) | 39 (12.1%) | +1 | 1.5210 | 1.4895 | −0.0315 |

Bootstrap CI on pooled consensus_wrong ΔTips (OD − v3): point = +0.0031, 95% CI [−0.0279, +0.0402].

**Gate 4 verdict: PASS** (ΔTips = +1, n = 323 ≥ 30 threshold).

## Gates 1 and 3 from `compare` (2021–2025 window, 1062 matches)

```
Metric  | A (v3)  | B (OD)  | Delta   | 95% CI                 | Sig?
--------|---------|---------|---------|------------------------|-----
Tip%    | 68.1%   | 69.2%   | −1.1%   | [−2.8%, +0.5%]         | no
LogLoss | 0.8485  | 0.8427  | +0.0058 | [−0.0018, +0.0137]     | no
Brier   | 0.2020  | 0.2004  | +0.0016 | [−0.0007, +0.0040]     | no
```

Delta = A − B. Positive LogLoss delta means OD is better.

- **Gate 1** (ΔLL point estimate ≥ 0.005): 0.0058 ≥ 0.005 → **PASS** (marginally)
- **Gate 3** (bootstrap CI lower bound excludes zero): CI lower = −0.0018 < 0 → **NOT YET CLEARED** (zero inside CI)

## Per-season tips for gate 2 (recent-3 ΔTips)

| Season | v3 | OD | ΔTips |
|--------|----|----|-------|
| 2021 | 131/207 (64.2%) | 135/207 (66.2%) | +4 |
| 2022 | 146/207 (70.9%) | 149/207 (72.3%) | +3 |
| 2023 | 144/216 (67.3%) | 146/216 (68.2%) | +2 |
| 2024 | 140/216 (65.7%) | 138/216 (64.8%) | **−2** |
| 2025 | 155/216 (72.1%) | 160/216 (74.4%) | +5 |
| 2026 | 100/135 (74.6%) | 101/135 (75.4%) | +1 |

Recent-3 sum (2024–2026): −2 + 5 + 1 = +4. Net positive, but 2024 is individually negative.

## Interpretation

OD currently clears gate 4. The pooled consensus-wrong ΔTips is +1 across 323 games, meaning OD does not erode v3's contrarian edge — it marginally improves it. The LL delta on the consensus-wrong bucket is also encouraging (−0.032 bits per game, OD better), suggesting OD holds more probability mass on the right outcome in contrarian games even when it tips wrong.

Two things to watch heading into October. First, the 2026 OOS consensus-wrong bucket shows −2 over 32 games, reversing the 2021–25 trend. This is a small noisy sample (round 1–17 of 2026), but if OD continues to underperform v3 on contrarian games in 2026, the pooled result will erode as the season completes. Second, gate 3 remains open: the LogLoss CI straddles zero, meaning the aggregate improvement is not yet statistically confirmed. More 2026 rounds will tighten the CI in either direction.

The October review should re-run this script with the completed 2026 season and recheck all four gates. If the 2026 consensus-wrong flip (−2) is a fluke, gate 4 will widen. If it persists, it becomes the blocking concern.
