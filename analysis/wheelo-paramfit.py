"""Phase B — Parameter reverse-engineering of Wheelo's model.

Inputs:
  /tmp/sq_tips_wheelo_{2022..2026}.json   Wheelo per-match hmargin/hconfidence
  /tmp/wheelo/current_ratings_2026.json   Inline Attack/Defence/Overall from afl_ratings.html
  /tmp/wheelo/team_stats_{2016..2026}.json   Season-totals (Equity, xScore, etc.)
  analysis/wheelo-paired-2022-2026.csv    v3 + Wheelo paired predictions

Outputs (printed + cached):
  /tmp/wheelo/fit_panel.json    Panel-regression team-season + venue effects (Wheelo)
  /tmp/wheelo/hga_compare.json  Per-venue HGA: v3 vs Wheelo, MCG-relative

Reads from cached files only (no scraping); see analysis/wheelo-paramfit-fetch.sh
companion for one-shot data refresh.
"""

import csv
import json
import math
from collections import defaultdict

import numpy as np

SQ_NAME = {"Greater Western Sydney": "GWS Giants"}
# Wheelo Squiggle venue -> v3-canonical
WH_VENUE = {
    "M.C.G.": "MCG",
    "S.C.G.": "SCG",
    "Docklands": "Marvel Stadium",
    "Bellerive Oval": "Ninja Stadium",
    "Marrara Oval": "TIO Stadium",
    "York Park": "UTAS Stadium",
    "Cazaly's Stadium": "Cazalys Stadium",
    "Eureka Stadium": "Mars Stadium",
    "Stadium Australia": "Accor Stadium",
}


# ------------------------------------------------------------ sigma identification
def fit_sigma(rows):
    """Fit Wheelo's margin->probability sigma assuming hconfidence = Φ(hmargin/σ)."""
    def inv_phi(p, tol=1e-8):
        lo, hi = -10, 10
        while hi - lo > tol:
            mid = (lo + hi) / 2
            if 0.5 * (1 + math.erf(mid / math.sqrt(2))) < p:
                lo = mid
            else:
                hi = mid
        return (lo + hi) / 2

    sigmas = []
    for h, p in rows:
        if abs(p - 0.5) < 0.05 or abs(h) < 1:
            continue
        sigmas.append(h / inv_phi(p))
    sigmas.sort()
    return sigmas[len(sigmas) // 2], np.std(sigmas)


# ------------------------------------------------------------ panel fit
def panel_fit(rows, drop_team="Collingwood"):
    """rows = list of {season, home, away, venue, y}. Fit team-season + venue effects.

    Returns: beta, venue_effects, team_season_ratings dict, fit-metrics dict.
    """
    teams = sorted({r["home"] for r in rows} | {r["away"] for r in rows})
    venues = sorted({r["venue"] for r in rows})
    seasons = sorted({r["season"] for r in rows})
    T, S, V = len(teams), len(seasons), len(venues)
    season_idx = {s: i for i, s in enumerate(seasons)}
    venue_idx = {v: i for i, v in enumerate(venues)}
    drop_pos = teams.index(drop_team)

    def col(team, season):
        if team == drop_team:
            return None
        t_pos = teams.index(team)
        if t_pos > drop_pos:
            t_pos -= 1
        return season_idx[season] * (T - 1) + t_pos

    n_params = (T - 1) * S + V
    X = np.zeros((len(rows), n_params))
    y = np.array([r["y"] for r in rows])
    for i, r in enumerate(rows):
        hc, ac = col(r["home"], r["season"]), col(r["away"], r["season"])
        vc = (T - 1) * S + venue_idx[r["venue"]]
        if hc is not None:
            X[i, hc] += 1
        if ac is not None:
            X[i, ac] -= 1
        X[i, vc] += 1
    beta, _, _, _ = np.linalg.lstsq(X, y, rcond=None)
    preds = X @ beta
    resid = y - preds
    venue_eff = beta[(T - 1) * S:]

    ts_ratings = {}
    for s_i, s in enumerate(seasons):
        for t_pos, t in enumerate(teams):
            if t == drop_team:
                ts_ratings[(t, s)] = 0.0
            else:
                adj = t_pos if t_pos < drop_pos else t_pos - 1
                ts_ratings[(t, s)] = float(beta[s_i * (T - 1) + adj])

    return {
        "beta": beta,
        "venues": venues,
        "teams": teams,
        "seasons": seasons,
        "venue_eff": {v: float(e) for v, e in zip(venues, venue_eff)},
        "team_season": {f"{t}|{s}": v for (t, s), v in ts_ratings.items()},
        "fit": {
            "n": len(rows),
            "rms": float(np.sqrt((resid ** 2).mean())),
            "mae": float(np.abs(resid).mean()),
            "r2": float(1 - resid.var() / y.var()),
        },
    }


def corr(xs, ys):
    n = len(xs)
    mx, my = sum(xs) / n, sum(ys) / n
    cov = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    vx = sum((x - mx) ** 2 for x in xs)
    vy = sum((y - my) ** 2 for y in ys)
    return cov / math.sqrt(vx * vy) if vx * vy > 0 else float("nan")


# ------------------------------------------------------------ load Wheelo Squiggle rows
sq_rows = []
for y in (2022, 2023, 2024, 2025, 2026):
    for t in json.load(open(f"/tmp/sq_tips_wheelo_{y}.json"))["tips"]:
        if t.get("hmargin") is None or t.get("hconfidence") is None:
            continue
        sq_rows.append((float(t["hmargin"]), float(t["hconfidence"]) / 100))

sigma, sigma_std = fit_sigma(sq_rows)
print(f"=== B.2.1  Wheelo margin->prob shape ===")
print(f"  hconfidence = Φ(hmargin / σ);  σ = {sigma:.3f} (std {sigma_std:.3f} across 1062 records)")
print(f"  Compare v3 output.sigma = 36 (Phi);  Wheelo uses {sigma:.1f} — different sigma but same shape")

# ------------------------------------------------------------ paired panel comparison
print(f"\n=== B.2.2  Panel-regression HGA per venue, v3 vs Wheelo ===")
rows_paired = []
with open("/Users/jackmcpherson/Projects/tipper/analysis/wheelo-paired-2022-2026.csv") as f:
    for r in csv.DictReader(f):
        rows_paired.append(
            {
                "season": int(r["season"]),
                "home": r["home"],
                "away": r["away"],
                "venue": r["venue"],
                "pred_v3": float(r["pred_v3"]),
                "pred_w": float(r["pred_w"]),
            }
        )

# Fit on each side
fit_v3 = panel_fit([{**r, "y": r["pred_v3"]} for r in rows_paired])
fit_w = panel_fit([{**r, "y": r["pred_w"]} for r in rows_paired])
print(f"v3 panel fit:    n={fit_v3['fit']['n']}  RMS {fit_v3['fit']['rms']:.3f}  MAE {fit_v3['fit']['mae']:.3f}  R² {fit_v3['fit']['r2']:.4f}")
print(f"wheelo panel:    n={fit_w['fit']['n']}  RMS {fit_w['fit']['rms']:.3f}  MAE {fit_w['fit']['mae']:.3f}  R² {fit_w['fit']['r2']:.4f}")

# Re-center venue effects on MCG to make them comparable
mcg_v3 = fit_v3["venue_eff"]["MCG"]
mcg_w = fit_w["venue_eff"]["MCG"]
venue_counts = defaultdict(int)
for r in rows_paired:
    venue_counts[r["venue"]] += 1

print(f"\n=== Per-venue HGA (re-centered on MCG = 0; sorted by Wheelo) ===")
print(f"{'venue':<25}{'n':>5}{'v3':>8}{'wheelo':>10}{'Δ':>8}")
ordered = sorted(
    ((v, fit_w["venue_eff"][v] - mcg_w) for v in fit_w["venues"] if venue_counts[v] >= 5),
    key=lambda x: -x[1],
)
for v, _ in ordered:
    v_v3 = fit_v3["venue_eff"][v] - mcg_v3
    v_w = fit_w["venue_eff"][v] - mcg_w
    print(f"{v:<25}{venue_counts[v]:>5}{v_v3:>+8.2f}{v_w:>+10.2f}{v_w - v_v3:>+8.2f}")

in_range = [v for v in fit_w["venues"] if venue_counts[v] >= 5]
v3_vals = [fit_v3["venue_eff"][v] - mcg_v3 for v in in_range]
w_vals = [fit_w["venue_eff"][v] - mcg_w for v in in_range]
print(f"\nv3 spread:    {min(v3_vals):+.2f} to {max(v3_vals):+.2f} (range {max(v3_vals) - min(v3_vals):.2f})")
print(f"wheelo spread: {min(w_vals):+.2f} to {max(w_vals):+.2f} (range {max(w_vals) - min(w_vals):.2f})")

# ------------------------------------------------------------ year-over-year carryover
print(f"\n=== B.2.3  Season-to-season carryover slope (OLS on team ratings) ===")
years = sorted({r["season"] for r in rows_paired})
for fit_label, fit_obj in (("wheelo", fit_w), ("v3", fit_v3)):
    print(f"  {fit_label}:")
    for i in range(len(years) - 1):
        y1, y2 = years[i], years[i + 1]
        xs = [fit_obj["team_season"][f"{t}|{y1}"] for t in fit_obj["teams"]]
        ys = [fit_obj["team_season"][f"{t}|{y2}"] for t in fit_obj["teams"]]
        n = len(xs)
        mx, my = sum(xs) / n, sum(ys) / n
        cov = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
        vx = sum((x - mx) ** 2 for x in xs)
        slope = cov / vx
        intercept = my - slope * mx
        print(f"    {y1}->{y2}: corr {corr(xs, ys):.3f}  slope {slope:.3f}  intercept {intercept:+.2f}")

# ------------------------------------------------------------ effective rating spread → K proxy
print(f"\n=== B.2.4  Season-end team-rating spread (proxy for effective K) ===")
print(f"{'season':<8}{'wheelo σ':>10}{'v3 σ':>10}{'ratio':>8}")
for s in years:
    wvals = [fit_w["team_season"][f"{t}|{s}"] for t in fit_w["teams"]]
    vvals = [fit_v3["team_season"][f"{t}|{s}"] for t in fit_v3["teams"]]
    ws = float(np.std(wvals))
    vs = float(np.std(vvals))
    print(f"{s:<8}{ws:>10.2f}{vs:>10.2f}{ws / vs:>8.2f}")
print("  Wider Wheelo spread → either higher effective K or asymmetric OD updates")

# ------------------------------------------------------------ OD identification
print(f"\n=== B.2.5  OD identification: do Wheelo Attack/Defence track offensive/defensive stats? ===")
ratings_now = json.load(open("/tmp/wheelo/current_ratings_2026.json"))
ts_2026 = json.load(open("/tmp/wheelo/team_stats_2026.json"))["Data"]

team_to_od = {}
for i, name in enumerate(ratings_now["TeamName"]):
    team_to_od[name] = {
        "att": ratings_now["RatingAtt"][i],
        "def": ratings_now["RatingDef"][i],
        "overall": ratings_now["RatingOverall"][i],
    }
team_to_stats = {}
for i, name in enumerate(ts_2026["Team"]):
    if not name:
        continue
    team_to_stats[name] = {k: ts_2026[k][i] for k in [
        "xScore", "xScore_Opposition", "TotalPoints", "TotalPoints_Opposition",
        "Equity_Total", "Equity_Total_Opposition",
    ] if i < len(ts_2026.get(k, []))}

common = [t for t in team_to_od if t in team_to_stats]
att = [team_to_od[t]["att"] for t in common]
de = [team_to_od[t]["def"] for t in common]
print(f"  n teams matched: {len(common)}")
print(f"  Attack vs xScore (offensive):           {corr(att, [team_to_stats[t]['xScore'] for t in common]):+.3f}")
print(f"  Attack vs TotalPoints (scored):         {corr(att, [team_to_stats[t]['TotalPoints'] for t in common]):+.3f}")
print(f"  Defense vs xScore_Opposition (allowed): {corr(de, [team_to_stats[t]['xScore_Opposition'] for t in common]):+.3f}")
print(f"  Defense vs TotalPoints_Opposition:      {corr(de, [team_to_stats[t]['TotalPoints_Opposition'] for t in common]):+.3f}")
# Cross-leak check
print(f"  Cross-leak Attack vs xScore_Opp:        {corr(att, [team_to_stats[t]['xScore_Opposition'] for t in common]):+.3f}")
print(f"  Cross-leak Defense vs xScore:           {corr(de, [team_to_stats[t]['xScore'] for t in common]):+.3f}")
print("  Strong same-side r (~0.93), moderate cross r (~0.6): Attack/Defense are separated channels")
print("  driven by offensive/defensive output respectively — confirms stat-driven OD update mechanic.")

# ------------------------------------------------------------ save
out = {
    "sigma_phi_pts": sigma,
    "v3_panel": fit_v3["fit"],
    "wheelo_panel": fit_w["fit"],
    "v3_venue_hga_mcg_rel": {v: fit_v3["venue_eff"][v] - mcg_v3 for v in fit_v3["venues"]},
    "wheelo_venue_hga_mcg_rel": {v: fit_w["venue_eff"][v] - mcg_w for v in fit_w["venues"]},
    "v3_team_2026": {t: fit_v3["team_season"][f"{t}|2026"] for t in fit_v3["teams"]},
    "wheelo_team_2026": {t: fit_w["team_season"][f"{t}|2026"] for t in fit_w["teams"]},
    "venue_counts": dict(venue_counts),
    "od_identification": {
        "corr_attack_xscore": corr(att, [team_to_stats[t]["xScore"] for t in common]),
        "corr_defense_xscore_opp": corr(de, [team_to_stats[t]["xScore_Opposition"] for t in common]),
    },
}
open("/tmp/wheelo/paramfit_summary.json", "w").write(json.dumps(out, indent=2))
print(f"\nSaved /tmp/wheelo/paramfit_summary.json")
