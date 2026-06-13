"""Task 35 (D1): walk-forward learned stacking head over engine features.

Pre-registered design (before any fitting):
  M1 (primary)   ridge regression on margin over {elo_diff, pav zone diffs, venue
                 bucket dummies, rest_diff, round-phase dummies}; prob = CDF(m/36)
  M2 (secondary) L2 logistic on home-win over the same features
  stack-lite     ridge over v3's own two features {elo_diff, pav_total_diff} —
                 sanity check that the harness can recover the incumbent
  M3 (post-hoc steelman, added after M1/M2 failed) ridge on v3 RESIDUALS with all
                 coefficients penalised — shrinkage toward the incumbent, so
                 lambda -> inf recovers v3 exactly; grid extended to 3000
  Protocol: per-round expanding refit within each era pool (2016-19 | 2021-26),
  min 200 training matches (v3 fallback before that), lambda from {3,10,30,100,300}
  by forward-chained 80/20 validation INSIDE the training set, continuous features
  z-scored on train stats, intercept unpenalised, dummies penalised (heavy lambda
  recovers flat HA + linear blend = v3's structure).

Run: uv run --with numpy python3 analysis/stacking-head-walkforward.py
Outputs /tmp/task35-stack-preds.json for the engine-exact evaluator
(analysis/task35-stack-eval.ts).
"""

import json
import os
from collections import defaultdict
from datetime import date

import numpy as np

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIN_TRAIN = 200
LAMBDAS = (3.0, 10.0, 30.0, 100.0, 300.0)

VENUE_STATE = {
    "MCG": "VIC", "Marvel Stadium": "VIC", "Kardinia Park": "VIC", "Mars Stadium": "VIC",
    "Adelaide Oval": "SA", "Norwood Oval": "SA", "Barossa Park": "SA",
    "Perth Stadium": "WA", "Hands Oval": "WA", "Domain Stadium": "WA", "Subiaco": "WA",
    "Gabba": "QLD", "Carrara": "QLD", "Cazalys Stadium": "QLD", "Riverway Stadium": "QLD",
    "SCG": "NSW", "Sydney Showground": "NSW", "Accor Stadium": "NSW",
    "UTAS Stadium": "TAS", "Ninja Stadium": "TAS", "Blundstone Arena": "TAS",
    "Manuka Oval": "ACT", "TIO Stadium": "NT", "Traeger Park": "NT",
    "Jiangwan Stadium": "CHN",
}
TEAM_STATE = {
    "Carlton": "VIC", "Collingwood": "VIC", "Essendon": "VIC", "Geelong": "VIC",
    "Hawthorn": "VIC", "Melbourne": "VIC", "North Melbourne": "VIC", "Richmond": "VIC",
    "St Kilda": "VIC", "Western Bulldogs": "VIC",
    "Adelaide": "SA", "Port Adelaide": "SA", "West Coast": "WA", "Fremantle": "WA",
    "Brisbane Lions": "QLD", "Gold Coast": "QLD", "Sydney": "NSW", "GWS Giants": "NSW",
}
HOME_GROUNDS = {
    "Geelong": {"Kardinia Park"},
    "Adelaide": {"Adelaide Oval"}, "Port Adelaide": {"Adelaide Oval"},
    "West Coast": {"Perth Stadium", "Domain Stadium", "Subiaco"},
    "Fremantle": {"Perth Stadium", "Hands Oval", "Domain Stadium", "Subiaco"},
    "Brisbane Lions": {"Gabba"},
    "Gold Coast": {"Carrara", "TIO Stadium", "Cazalys Stadium"},
    "Sydney": {"SCG"}, "GWS Giants": {"Sydney Showground", "Manuka Oval"},
    "Hawthorn": {"UTAS Stadium"}, "North Melbourne": {"Ninja Stadium", "Blundstone Arena"},
    "Melbourne": {"Traeger Park"}, "Western Bulldogs": {"Mars Stadium"},
}
BUCKETS = ("true_home_interstate", "shared_derby", "true_home_same_state",
           "shared_interstate", "neutral")  # first = base (most common)


def venue_bucket(home, away, venue):
    same = TEAM_STATE[home] == TEAM_STATE[away]
    if venue in HOME_GROUNDS.get(home, set()):
        return "true_home_same_state" if same else "true_home_interstate"
    if VENUE_STATE[venue] == TEAM_STATE[home]:
        return "shared_derby" if same else "shared_interstate"
    return "neutral"


def phase_of(round_label, round_number):
    if not round_label.startswith("Round") and round_label != "Opening Round":
        return "finals"
    if round_number <= 8:
        return "early"
    if round_number <= 16:
        return "mid"
    return "late"


def normal_cdf(x):  # Abramowitz-Stegun, mirrors predict.ts
    a1, a2, a3, a4, a5, p = 0.254829592, -0.284496736, 1.421413741, -1.453152027, 1.061405429, 0.3275911
    sign = np.where(x < 0, -1.0, 1.0)
    ax = np.abs(x)
    t = 1.0 / (1.0 + p * ax)
    y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * np.exp(-ax * ax / 2)
    return 0.5 * (1.0 + sign * y)


def load(path):
    return json.load(open(f"{REPO}/configs/{path}"))["matches"]


pools = {
    "early": load("predha80-early/results-2026-06-12-909461e1.json"),
    "recent": load("predha-080/results-2026-06-12-2641f46f.json")
    + load("predha-080/results-2026-06-12-e8e0cede.json"),
}

CONT = ["elo_diff", "pav_off_diff", "pav_mid_diff", "pav_def_diff", "rest_diff"]
DUMMY = [f"b_{b}" for b in BUCKETS[1:]] + ["ph_mid", "ph_late", "ph_finals"]
FEATS = CONT + DUMMY


def featurize(pool):
    last_played = {}
    rows = []
    for m in sorted(pool, key=lambda m: (m["date"], m["matchId"])):
        d = date.fromisoformat(m["date"][:10])
        season = d.year
        rest = {}
        for side in ("home", "away"):
            t = m[side]
            prev = last_played.get(t)
            rest[side] = (d - prev).days if prev and prev.year == season else 0
            last_played[t] = d
        rd = rest["home"] - rest["away"] if rest["home"] and rest["away"] else 0
        b = venue_bucket(m["home"], m["away"], m["venue"])
        ph = phase_of(m["round"], m["roundNumber"])
        f = {
            "elo_diff": m["homeElo"] - m["awayElo"],
            "pav_off_diff": m["homePavZones"]["off"] - m["awayPavZones"]["off"],
            "pav_mid_diff": m["homePavZones"]["mid"] - m["awayPavZones"]["mid"],
            "pav_def_diff": m["homePavZones"]["def"] - m["awayPavZones"]["def"],
            "rest_diff": float(np.clip(rd, -10, 10)),
        }
        for bb in BUCKETS[1:]:
            f[f"b_{bb}"] = 1.0 if b == bb else 0.0
        for pp in ("mid", "late", "finals"):
            f[f"ph_{pp}"] = 1.0 if ph == pp else 0.0
        rows.append(
            {
                "matchId": m["matchId"],
                "date": m["date"][:10],
                "season": season,
                "roundKey": (season, m["round"]),
                "x": np.array([f[k] for k in FEATS]),
                "y_margin": float(m["actualMargin"]),
                "y_win": 1.0 if m["actualMargin"] > 0 else 0.0,
                "v3_margin": m["predictedMargin"],
            }
        )
    return rows


def design(X, mu, sd):
    Xs = X.copy()
    ncont = len(CONT)
    Xs[:, :ncont] = (X[:, :ncont] - mu) / sd
    return np.hstack([np.ones((len(X), 1)), Xs])  # col 0 = unpenalised intercept


def ridge_fit(X, y, lam):
    d = X.shape[1]
    P = np.eye(d) * lam
    P[0, 0] = 0.0
    return np.linalg.solve(X.T @ X + P, X.T @ y)


def logistic_fit(X, y, lam, iters=30):
    d = X.shape[1]
    P = np.eye(d) * lam
    P[0, 0] = 0.0
    beta = np.zeros(d)
    for _ in range(iters):
        z = X @ beta
        p = 1 / (1 + np.exp(-np.clip(z, -30, 30)))
        W = p * (1 - p) + 1e-9
        g = X.T @ (y - p) - P @ beta
        H = (X.T * W) @ X + P
        step = np.linalg.solve(H, g)
        beta += step
        if np.max(np.abs(step)) < 1e-8:
            break
    return beta


def ridge_fit_all_pen(X, y, lam):  # intercept penalised too (M3 shrink-to-incumbent)
    return np.linalg.solve(X.T @ X + np.eye(X.shape[1]) * lam, X.T @ y)


M3_LAMBDAS = LAMBDAS + (1000.0, 3000.0)


def pick_lambda(X, y, fit, score, grid=LAMBDAS):
    cut = int(len(X) * 0.8)
    best, best_s = grid[0], np.inf
    for lam in grid:
        beta = fit(X[:cut], y[:cut], lam)
        s = score(X[cut:] @ beta, y[cut:])
        if s < best_s:
            best, best_s = lam, s
    return best


def mse(pred, y):
    return float(np.mean((pred - y) ** 2))


def nll(z, y):
    p = np.clip(1 / (1 + np.exp(-np.clip(z, -30, 30))), 1e-9, 1 - 1e-9)
    return float(-np.mean(y * np.log(p) + (1 - y) * np.log(1 - p)))


def run_pool(rows, feats_idx=None, label="stack"):
    """Walk-forward per round. Returns matchId -> dict of model outputs."""
    out = {}
    X_all = np.stack([r["x"] for r in rows])
    if feats_idx is not None:
        X_all = X_all[:, feats_idx]
    ncont = len(CONT) if feats_idx is None else sum(1 for i in feats_idx if i < len(CONT))
    ym = np.array([r["y_margin"] for r in rows])
    yw = np.array([r["y_win"] for r in rows])
    rounds = defaultdict(list)
    for i, r in enumerate(rows):
        rounds[r["roundKey"]].append(i)
    lam_hist = []
    for rk in sorted(rounds, key=lambda k: min(rounds[k])):
        idx = rounds[rk]
        tr = list(range(min(idx)))
        if len(tr) < MIN_TRAIN:
            for i in idx:
                out[rows[i]["matchId"]] = None  # v3 fallback
            continue
        Xtr_raw = X_all[tr]
        mu = Xtr_raw[:, :ncont].mean(axis=0)
        sd = Xtr_raw[:, :ncont].std(axis=0) + 1e-9

        def dz(Xraw):
            Xs = Xraw.copy()
            Xs[:, :ncont] = (Xraw[:, :ncont] - mu) / sd
            return np.hstack([np.ones((len(Xs), 1)), Xs])

        Xtr = dz(Xtr_raw)
        Xte = dz(X_all[idx])
        lam_m = pick_lambda(Xtr, ym[tr], ridge_fit, mse)
        beta_m = ridge_fit(Xtr, ym[tr], lam_m)
        lam_w = pick_lambda(Xtr, yw[tr], logistic_fit, nll)
        beta_w = logistic_fit(Xtr, yw[tr], lam_w)
        resid = ym - np.array([r["v3_margin"] for r in rows])
        lam_r = pick_lambda(Xtr, resid[tr], ridge_fit_all_pen, mse, grid=M3_LAMBDAS)
        beta_r = ridge_fit_all_pen(Xtr, resid[tr], lam_r)
        lam_hist.append((lam_m, lam_w, lam_r))
        m1 = Xte @ beta_m
        m2 = 1 / (1 + np.exp(-np.clip(Xte @ beta_w, -30, 30)))
        m3 = np.array([rows[i]["v3_margin"] for i in idx]) + Xte @ beta_r
        for j, i in enumerate(idx):
            out[rows[i]["matchId"]] = {
                "m1_margin": float(m1[j]),
                "m2_prob": float(m2[j]),
                "m3_margin": float(m3[j]),
            }
    lams = np.array(lam_hist)
    if len(lams):
        print(
            f"  [{label}] refits {len(lams)}, fallback {sum(1 for v in out.values() if v is None)} "
            f"matches; median lambda ridge {np.median(lams[:,0]):.0f} logit {np.median(lams[:,1]):.0f} "
            f"resid {np.median(lams[:,2]):.0f}"
        )
    return out


export = {}
for pool_name, recs in pools.items():
    rows = featurize(recs)
    print(f"pool {pool_name}: {len(rows)} matches, {len(FEATS)} features")
    preds = run_pool(rows, label="full")
    # stack-lite sanity: elo_diff + pav TOTAL diff only
    lite_rows = []
    for r in rows:
        lr = dict(r)
        lr["x"] = np.array([r["x"][0], r["x"][1] + r["x"][2] + r["x"][3]])
        lite_rows.append(lr)
    global CONT_SAVE
    # lite uses 2 continuous features, no dummies
    CONT_lite = 2
    X_all = np.stack([r["x"] for r in lite_rows])
    # quick inline lite run (same protocol, margins only)
    ym = np.array([r["y_margin"] for r in lite_rows])
    rounds = defaultdict(list)
    for i, r in enumerate(lite_rows):
        rounds[r["roundKey"]].append(i)
    lite = {}
    for rk in sorted(rounds, key=lambda k: min(rounds[k])):
        idx = rounds[rk]
        tr = list(range(min(idx)))
        if len(tr) < MIN_TRAIN:
            for i in idx:
                lite[lite_rows[i]["matchId"]] = None
            continue
        mu = X_all[tr].mean(axis=0)
        sd = X_all[tr].std(axis=0) + 1e-9
        Xtr = np.hstack([np.ones((len(tr), 1)), (X_all[tr] - mu) / sd])
        Xte = np.hstack([np.ones((len(idx), 1)), (X_all[idx] - mu) / sd])
        beta = ridge_fit(Xtr, ym[tr], 3.0)
        for j, i in enumerate(idx):
            lite[lite_rows[i]["matchId"]] = float((Xte @ beta)[j])
    # sanity: corr of lite margins vs v3 margins on fitted matches
    fit_ids = [r["matchId"] for r in rows if lite[r["matchId"]] is not None]
    lv = np.array([lite[i] for i in fit_ids])
    vv = np.array([r["v3_margin"] for r in rows if r["matchId"] in set(fit_ids)])
    print(f"  [lite sanity] n={len(fit_ids)} corr(lite, v3 margin)={np.corrcoef(lv, vv)[0,1]:.3f} "
          f"mean|diff|={np.mean(np.abs(lv-vv)):.2f} pts")
    for r in rows:
        p = preds[r["matchId"]]
        export[r["matchId"]] = {
            "pool": pool_name,
            "season": r["season"],
            "m1_margin": p["m1_margin"] if p else None,
            "m2_prob": p["m2_prob"] if p else None,
            "m3_margin": p["m3_margin"] if p else None,
        }

json.dump(export, open("/tmp/task35-stack-preds.json", "w"))
print(f"\nexported {len(export)} predictions -> /tmp/task35-stack-preds.json")
