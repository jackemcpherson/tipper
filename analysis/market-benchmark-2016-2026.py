"""Task 34 (D4-i): market benchmark — v3 vs the closing betting market, 2016-2026.

Benchmark only (product decision 2026-06-13): tipper stays market-independent; this
measures the distance. No candidate is tested; conventions fixed before running:
  market prob   = vig-removed closing H2H:  pH = (1/h) / (1/h + 1/a)
  market margin = -(home line close)        (negative line = home favoured)
  scoring       = engine metrics.ts conventions (LogLoss bits, clamp 0.01/0.99,
                  draws->away for LL, draws excluded from tip%)
  windows       = early 2016-19 / primary 2021-25 / 2026 R1-13, paired on matched games

Inputs:
  /tmp/afl_odds.json      converted from aussportsbetting.com afl.xlsx (Data sheet;
                          see docs/task-34-market-benchmark.md for regeneration)
  /tmp/sq_tips_punters_{2017,2018,2019,2021,2022}.json  Squiggle q=tips;source=5
  /tmp/sq_tips_{2023..2026}.json                        full tips caches (T32/T33)
  configs/predha-080/results-2026-06-12-{2641f46f,e8e0cede}.json   v3
  configs/predha80-early/results-2026-06-12-909461e1.json          v3 early
  analysis/task33-misses-tagged.csv                     T33 classified misses
"""

import csv
import json
import math
import os
from collections import defaultdict
from datetime import date, timedelta

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ODDS_NAME = {"Brisbane": "Brisbane Lions"}  # aussportsbetting -> ours
SQ_NAME = {"Greater Western Sydney": "GWS Giants"}  # squiggle -> ours
CLOSE = 12.0


def clamp(p):
    return max(0.01, min(0.99, p))


def logloss_bits(prob_home, actual_margin):
    home_won = actual_margin > 0  # draws scored as away wins, per metrics.ts
    return -math.log2(clamp(prob_home if home_won else 1 - prob_home))


# ------------------------------------------------------------------ load v3
v3 = []
for path in (
    f"{REPO}/configs/predha80-early/results-2026-06-12-909461e1.json",
    f"{REPO}/configs/predha-080/results-2026-06-12-2641f46f.json",
    f"{REPO}/configs/predha-080/results-2026-06-12-e8e0cede.json",
):
    v3 += json.load(open(path))["matches"]

# ------------------------------------------------------------------ load odds
odds_idx = {}
for r in json.load(open("/tmp/afl_odds.json")):
    if r["date"] < "2016-01-01":
        continue
    home = ODDS_NAME.get(r["home"], r["home"])
    h = r["hodds_close"] or r["hodds"]
    a = r["aodds_close"] or r["aodds"]
    odds_idx[(r["date"], home)] = {"h": h, "a": a}

# ------------------------------------------------------------------ load punters
punters = {}  # (date10, our home name) -> hconf/100
for y in (2017, 2018, 2019, 2021, 2022):
    tips = json.load(open(f"/tmp/sq_tips_punters_{y}.json"))["tips"]
    for t in tips:
        punters[(t["date"][:10], SQ_NAME.get(t["hteam"], t["hteam"]))] = (
            float(t["hconfidence"]) / 100
        )
for y in (2023, 2024, 2025, 2026):
    for t in json.load(open(f"/tmp/sq_tips_{y}.json"))["tips"]:
        if t["source"] == "Punters" and t.get("hconfidence") is not None:
            punters[(t["date"][:10], SQ_NAME.get(t["hteam"], t["hteam"]))] = (
                float(t["hconfidence"]) / 100
            )


def lookup(idx, d10, home):
    if (d10, home) in idx:
        return idx[(d10, home)]
    d = date.fromisoformat(d10)
    for delta in (-1, 1):
        k = ((d + timedelta(days=delta)).isoformat(), home)
        if k in idx:
            return idx[k]
    return None


# ------------------------------------------------------------------ pair
rows = []
unmatched = []
for m in v3:
    if m.get("actualMargin") is None:
        continue
    d10 = m["date"][:10]
    o = lookup(odds_idx, d10, m["home"])
    if o is None:
        unmatched.append(f"{d10} {m['home']} v {m['away']}")
        continue
    inv_h, inv_a = 1 / o["h"], 1 / o["a"]
    p_mkt = inv_h / (inv_h + inv_a)
    p_pun = lookup({k: {"p": v} for k, v in punters.items()}, d10, m["home"])
    rows.append(
        {
            "season": int(d10[:4]),
            "date": d10,
            "home": m["home"],
            "away": m["away"],
            "p_v3": m["winProbability"]["home"],
            "pred": m["predictedMargin"],
            "p_mkt": p_mkt,
            "p_pun": p_pun["p"] if p_pun else None,
            "actual": m["actualMargin"],
            "matchId": m["matchId"],
        }
    )
print(f"paired {len(rows)} games; unmatched: {unmatched if unmatched else 'none'}")

WINDOWS = (
    ("early 2016-19", lambda y: 2016 <= y <= 2019),
    ("primary 2021-25", lambda y: 2021 <= y <= 2025),
    ("2026 R1-13", lambda y: y == 2026),
)


def tip_ok(prob_home, actual):
    if actual == 0:
        return None  # draw, excluded
    return (prob_home >= 0.5) == (actual > 0)


print("\n=== tips and LogLoss: v3 vs closing market (paired) ===")
print(f"{'window':<18}{'n':>5}  {'v3 tips':>9}{'mkt tips':>9}{'Δ':>5}   {'v3 LL':>7}{'mkt LL':>7}")
for wname, sel in WINDOWS:
    w = [r for r in rows if sel(r["season"])]
    dec = [r for r in w if r["actual"] != 0]
    t3 = sum(1 for r in dec if tip_ok(r["p_v3"], r["actual"]))
    tm = sum(1 for r in dec if tip_ok(r["p_mkt"], r["actual"]))
    ll3 = sum(logloss_bits(r["p_v3"], r["actual"]) for r in w) / len(w)
    llm = sum(logloss_bits(r["p_mkt"], r["actual"]) for r in w) / len(w)
    print(
        f"{wname:<18}{len(w):>5}  {t3:>5} ({t3/len(dec):.1%}){tm:>5} ({tm/len(dec):.1%})"
        f"{tm-t3:>+5}   {ll3:>7.4f}{llm:>7.4f}"
    )

print("\nper-season tips (v3 / market / Δ):")
for y in sorted(set(r["season"] for r in rows)):
    dec = [r for r in rows if r["season"] == y and r["actual"] != 0]
    t3 = sum(1 for r in dec if tip_ok(r["p_v3"], r["actual"]))
    tm = sum(1 for r in dec if tip_ok(r["p_mkt"], r["actual"]))
    print(f"  {y}: {t3} / {tm} / {tm-t3:+d}  (n={len(dec)})")

# ------------------------------------------------------------------ closeness
print("\n=== close-band sign accuracy (|v3 pred margin| < 12) ===")
for wname, sel in WINDOWS:
    dec = [r for r in rows if sel(r["season"]) and r["actual"] != 0 and abs(r["pred"]) < CLOSE]
    t3 = sum(1 for r in dec if tip_ok(r["p_v3"], r["actual"]))
    tm = sum(1 for r in dec if tip_ok(r["p_mkt"], r["actual"]))
    print(f"{wname:<18} n={len(dec):<4} v3 {t3} ({t3/len(dec):.1%})  mkt {tm} ({tm/len(dec):.1%})  Δ {tm-t3:+d}")

# ------------------------------------------------------------------ distance
print("\n=== probability distance ===")
for wname, sel in WINDOWS:
    w = [r for r in rows if sel(r["season"])]
    d = [abs(r["p_v3"] - r["p_mkt"]) for r in w]
    mean_v3 = sum(r["p_v3"] for r in w) / len(w)
    mean_mkt = sum(r["p_mkt"] for r in w) / len(w)
    cov = sum((r["p_v3"] - mean_v3) * (r["p_mkt"] - mean_mkt) for r in w)
    var3 = sum((r["p_v3"] - mean_v3) ** 2 for r in w)
    varm = sum((r["p_mkt"] - mean_mkt) ** 2 for r in w)
    corr = cov / math.sqrt(var3 * varm)
    big = sum(1 for x in d if x > 0.15)
    print(
        f"{wname:<18} mean|Δp| {sum(d)/len(d):.3f}  corr {corr:.3f}  |Δp|>0.15: {big}/{len(w)}"
    )

# disagreement games: opposite signs
print("\n=== sign disagreements (v3 vs market) ===")
print(f"{'window':<18}{'n':>4}  {'v3 right':>9}{'mkt right':>10}{'draw':>6}")
for wname, sel in WINDOWS:
    dis = [
        r
        for r in rows
        if sel(r["season"]) and (r["p_v3"] >= 0.5) != (r["p_mkt"] >= 0.5)
    ]
    v3r = sum(1 for r in dis if r["actual"] != 0 and tip_ok(r["p_v3"], r["actual"]))
    mkr = sum(1 for r in dis if r["actual"] != 0 and tip_ok(r["p_mkt"], r["actual"]))
    dr = sum(1 for r in dis if r["actual"] == 0)
    print(f"{wname:<18}{len(dis):>4}  {v3r:>9}{mkr:>10}{dr:>6}")

# ------------------------------------------------------------------ punters fidelity
ov = [r for r in rows if r["p_pun"] is not None]
d = [abs(r["p_pun"] - r["p_mkt"]) for r in ov]
print(
    f"\nPunters (Squiggle source 5) vs closing odds, overlap n={len(ov)}: "
    f"mean|Δp| {sum(d)/len(d):.3f}, max {max(d):.3f}"
)
pun_tips = sum(1 for r in ov if r["actual"] != 0 and tip_ok(r["p_pun"], r["actual"]))
mkt_tips = sum(1 for r in ov if r["actual"] != 0 and tip_ok(r["p_mkt"], r["actual"]))
print(f"  tips on overlap: Punters {pun_tips}, closing odds {mkt_tips}")

# ------------------------------------------------------------------ T33 triangulation
print("\n=== T33 triangulation: market verdict on the 24 tipper-specific misses ===")
byid = {r["matchId"]: r for r in rows}
ts_right = ts_wrong = 0
with open(f"{REPO}/analysis/task33-misses-tagged.csv") as f:
    for miss in csv.DictReader(f):
        if miss["class"] != "tipper_specific":
            continue
        r = byid.get(int(miss["matchId"]))
        if r is None:
            print(f"  {miss['date']} {miss['home']} v {miss['away']}: NO ODDS MATCH")
            continue
        ok = tip_ok(r["p_mkt"], r["actual"])
        ts_right += ok is True
        ts_wrong += ok is False
        print(
            f"  {r['date']} {r['home']:<17} v {r['away']:<17} mkt p(home) {r['p_mkt']:.2f} "
            f"v3 {r['p_v3']:.2f} act {r['actual']:>4}  market {'RIGHT' if ok else 'wrong'}"
        )
print(f"market on TS misses: {ts_right} right / {ts_wrong} wrong")

print("\n=== T33 mirror: market verdict on games v3 got right vs the field ===")
# mirror = correct non-draw games with field share <= 0.35, recomputed from T33 logic is
# not persisted; approximate via the tagged full-games CSV if present
mirror_path = "/tmp/task33-games-tagged.csv"
if os.path.exists(mirror_path):
    mr = mw = 0
    for g in csv.DictReader(open(mirror_path)):
        if g["miss"] == "False" and g["draw"] == "False" and float(g["fieldShareCorrect"]) <= 0.35:
            r = byid.get(int(g["matchId"]))
            if r is None:
                continue
            ok = tip_ok(r["p_mkt"], r["actual"])
            mr += ok is True
            mw += ok is False
    print(f"market on the {mr+mw} mirror games: {mr} right / {mw} wrong")
else:
    print("  (run missed-tip-analysis-2023-2026.py first for the mirror set)")
