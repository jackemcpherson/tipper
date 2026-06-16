"""Adversarial review: v3 vs Wheelo Ratings (Squiggle source=26), 2022-2026.

Phase A of the plan in ~/.claude/plans/we-re-going-to-run-spicy-ladybug.md.

Inputs:
  /tmp/sq_tips_wheelo_{2022..2026}.json   Squiggle q=tips;source=26;year=Y
  /tmp/sq_tips_{2022..2026}.json          full field tips (T33/T34 caches + 2022 fresh)
  /tmp/sq_games_{2022..2026}.json         completed games
  configs/predha-080/results-2026-06-13-2641f46f.json  v3 2021-25
  configs/predha-080/results-2026-06-13-e8e0cede.json  v3 2026
  analysis/task33-misses-tagged.csv                    T33 classified misses

Notes:
- Wheelo's Squiggle source starts 2022 (probed 2014-2021 = empty). The plan's
  2016-19 confirmatory window is unavailable; we use 2022-25 primary + 2026 OOS.
- LL uses metrics.ts conventions: clamp(0.01, 0.99), draws->away for LL,
  draws excluded from tip%.
- Wheelo's own `bits` field is reported as a sanity cross-check.
"""

import csv
import json
import math
import os
import random
from collections import defaultdict

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQ_NAME = {"Greater Western Sydney": "GWS Giants"}
CLOSE = 12.0


def clamp(p):
    return max(0.01, min(0.99, p))


def logloss_bits(prob_home, actual_margin):
    home_won = actual_margin > 0  # draws scored as away wins, per metrics.ts
    return -math.log2(clamp(prob_home if home_won else 1 - prob_home))


def tip_ok(prob_home, actual):
    if actual == 0:
        return None  # draw, excluded from tip%
    return (prob_home >= 0.5) == (actual > 0)


# ------------------------------------------------------------------ load v3
v3 = []
for path in (
    f"{REPO}/configs/predha-080/results-2026-06-13-2641f46f.json",
    f"{REPO}/configs/predha-080/results-2026-06-13-e8e0cede.json",
):
    v3 += json.load(open(path))["matches"]

# ------------------------------------------------------------------ load Wheelo
wheelo = {}  # (date10, our home name) -> {p, pred, bits, err}
for y in (2022, 2023, 2024, 2025, 2026):
    for t in json.load(open(f"/tmp/sq_tips_wheelo_{y}.json"))["tips"]:
        if t.get("hconfidence") is None or t.get("hmargin") is None:
            continue
        home = SQ_NAME.get(t["hteam"], t["hteam"])
        wheelo[(t["date"][:10], home)] = {
            "p": float(t["hconfidence"]) / 100,
            "pred": float(t["hmargin"]),
            "bits": float(t["bits"]) if t.get("bits") not in (None, "") else None,
            "correct": t.get("correct"),  # None for ungraded
            "venue": t.get("venue"),
        }

# ------------------------------------------------------------------ load field tips
# field[(date10, home)] -> list of {source, p, pred (None if no hmargin)}
field = defaultdict(list)
for y in (2022, 2023, 2024, 2025, 2026):
    for t in json.load(open(f"/tmp/sq_tips_{y}.json"))["tips"]:
        if t.get("hconfidence") is None:
            continue
        home = SQ_NAME.get(t["hteam"], t["hteam"])
        field[(t["date"][:10], home)].append(
            {
                "source": t["source"],
                "p": float(t["hconfidence"]) / 100,
                "correct": t.get("correct"),
            }
        )

# ------------------------------------------------------------------ pair
rows = []
unmatched = []
for m in v3:
    if m.get("actualMargin") is None:
        continue
    d10 = m["date"][:10]
    home = m["home"]
    w = wheelo.get((d10, home))
    if w is None:
        unmatched.append(f"{d10} {home} v {m['away']}")
        continue
    rows.append(
        {
            "season": int(d10[:4]),
            "date": d10,
            "home": home,
            "away": m["away"],
            "venue": m["venue"],
            "p_v3": m["winProbability"]["home"],
            "pred_v3": m["predictedMargin"],
            "p_w": w["p"],
            "pred_w": w["pred"],
            "wheelo_bits_reported": w["bits"],
            "actual": m["actualMargin"],
            "matchId": m["matchId"],
        }
    )

print(f"paired {len(rows)} games; v3 unmatched (no Wheelo tip): {len(unmatched)}")
if unmatched and len(unmatched) < 10:
    for u in unmatched:
        print(f"  {u}")

WINDOWS = (
    ("primary 2022-25", lambda y: 2022 <= y <= 2025),
    ("2026 OOS", lambda y: y == 2026),
    ("pooled 2022-26", lambda y: 2022 <= y <= 2026),
)

# ------------------------------------------------------------------ pooled metrics
print("\n=== A.2  pooled metrics: v3 vs Wheelo (paired) ===")
print(
    f"{'window':<18}{'n':>5}  "
    f"{'v3 tips':>11}{'wh tips':>11}{'Δ':>5}   "
    f"{'v3 LL':>7}{'wh LL':>7}{'wh bits self':>14}   "
    f"{'v3 MAE':>8}{'wh MAE':>8}"
)
for wname, sel in WINDOWS:
    w = [r for r in rows if sel(r["season"])]
    dec = [r for r in w if r["actual"] != 0]
    t3 = sum(1 for r in dec if tip_ok(r["p_v3"], r["actual"]))
    tw = sum(1 for r in dec if tip_ok(r["p_w"], r["actual"]))
    ll3 = sum(logloss_bits(r["p_v3"], r["actual"]) for r in w) / len(w)
    llw = sum(logloss_bits(r["p_w"], r["actual"]) for r in w) / len(w)
    # Wheelo's self-reported bits convention check (positive when correct)
    wh_self = sum(r["wheelo_bits_reported"] for r in w if r["wheelo_bits_reported"] is not None)
    nb = sum(1 for r in w if r["wheelo_bits_reported"] is not None)
    wh_self_mean = (wh_self / nb) if nb else float("nan")
    mae3 = sum(abs(r["pred_v3"] - r["actual"]) for r in w) / len(w)
    maew = sum(abs(r["pred_w"] - r["actual"]) for r in w) / len(w)
    print(
        f"{wname:<18}{len(w):>5}  "
        f"{t3:>5} ({t3/len(dec):.1%}){tw:>5} ({tw/len(dec):.1%}){tw-t3:>+5}   "
        f"{ll3:>7.4f}{llw:>7.4f}{wh_self_mean:>14.4f}   "
        f"{mae3:>8.2f}{maew:>8.2f}"
    )

print("\nper-season tips (v3 / wheelo / Δ):")
for y in sorted(set(r["season"] for r in rows)):
    dec = [r for r in rows if r["season"] == y and r["actual"] != 0]
    t3 = sum(1 for r in dec if tip_ok(r["p_v3"], r["actual"]))
    tw = sum(1 for r in dec if tip_ok(r["p_w"], r["actual"]))
    print(f"  {y}: {t3} / {tw} / {tw-t3:+d}  (n={len(dec)})")

# ------------------------------------------------------------------ sign agreement
print("\n=== A.2  sign agreement (do they tip the same team?) ===")
for wname, sel in WINDOWS:
    w = [r for r in rows if sel(r["season"])]
    agree = sum(1 for r in w if (r["p_v3"] >= 0.5) == (r["p_w"] >= 0.5))
    print(f"{wname:<18} agree {agree}/{len(w)} = {agree/len(w):.1%}")

# ------------------------------------------------------------------ stratified bootstrap CI on tip%
def bootstrap_ci(rows_subset, n_iters=1000, seed=42):
    """Era-stratified pooled bootstrap on tip-% delta (wheelo - v3).

    Mirrors metrics.ts bootstrapCompareStratified intent: resample within season
    strata, keeping the matched pairing intact per draw.
    """
    rng = random.Random(seed)
    by_season = defaultdict(list)
    for r in rows_subset:
        if r["actual"] != 0:
            by_season[r["season"]].append(r)
    deltas = []
    base_n = sum(len(v) for v in by_season.values())
    for _ in range(n_iters):
        t3 = tw = 0
        for season, items in by_season.items():
            sample = [items[rng.randrange(len(items))] for _ in range(len(items))]
            t3 += sum(1 for r in sample if tip_ok(r["p_v3"], r["actual"]))
            tw += sum(1 for r in sample if tip_ok(r["p_w"], r["actual"]))
        deltas.append((tw - t3) / base_n)
    deltas.sort()
    lo, hi = deltas[int(0.025 * n_iters)], deltas[int(0.975 * n_iters)]
    point = (
        sum(1 for r in rows_subset if r["actual"] != 0 and tip_ok(r["p_w"], r["actual"]))
        - sum(1 for r in rows_subset if r["actual"] != 0 and tip_ok(r["p_v3"], r["actual"]))
    ) / base_n
    return point, lo, hi


def bootstrap_ll_ci(rows_subset, n_iters=1000, seed=42):
    rng = random.Random(seed)
    by_season = defaultdict(list)
    for r in rows_subset:
        by_season[r["season"]].append(r)
    deltas = []
    for _ in range(n_iters):
        ll3 = llw = n_total = 0.0
        for season, items in by_season.items():
            sample = [items[rng.randrange(len(items))] for _ in range(len(items))]
            ll3 += sum(logloss_bits(r["p_v3"], r["actual"]) for r in sample)
            llw += sum(logloss_bits(r["p_w"], r["actual"]) for r in sample)
            n_total += len(sample)
        deltas.append((llw - ll3) / n_total)
    deltas.sort()
    lo, hi = deltas[int(0.025 * n_iters)], deltas[int(0.975 * n_iters)]
    ll3 = sum(logloss_bits(r["p_v3"], r["actual"]) for r in rows_subset) / len(rows_subset)
    llw = sum(logloss_bits(r["p_w"], r["actual"]) for r in rows_subset) / len(rows_subset)
    return (llw - ll3), lo, hi


print("\n=== A.2  stratified bootstrap CI (1000 iters, seed=42) ===")
print(f"{'window':<18}{'Δtip%':>10}{'95% CI':>22}    {'ΔLL':>10}{'95% CI':>22}")
for wname, sel in WINDOWS:
    w = [r for r in rows if sel(r["season"])]
    p, lo, hi = bootstrap_ci(w)
    llp, lllo, llhi = bootstrap_ll_ci(w)
    print(
        f"{wname:<18}{p:>+10.4f}  [{lo:>+7.4f},{hi:>+7.4f}]    "
        f"{llp:>+10.4f}  [{lllo:>+7.4f},{llhi:>+7.4f}]"
    )

# ------------------------------------------------------------------ A.3 close-band cut
print("\n=== A.3  close-band sign accuracy (|v3 pred margin| < 12, the comp-relevant cut) ===")
for wname, sel in WINDOWS:
    dec = [r for r in rows if sel(r["season"]) and r["actual"] != 0 and abs(r["pred_v3"]) < CLOSE]
    t3 = sum(1 for r in dec if tip_ok(r["p_v3"], r["actual"]))
    tw = sum(1 for r in dec if tip_ok(r["p_w"], r["actual"]))
    print(
        f"{wname:<18} n={len(dec):<4} v3 {t3} ({t3/len(dec):.1%})  "
        f"wheelo {tw} ({tw/len(dec):.1%})  Δ {tw-t3:+d}"
    )

# ------------------------------------------------------------------ A.3 Wheelo-flips-v3
print("\n=== A.3  Wheelo-flips-v3: subset where the two tip different teams ===")
flips = [r for r in rows if (r["p_v3"] >= 0.5) != (r["p_w"] >= 0.5) and r["actual"] != 0]
print(f"flip set total n={len(flips)}")
w_right = sum(1 for r in flips if tip_ok(r["p_w"], r["actual"]))
v_right = sum(1 for r in flips if tip_ok(r["p_v3"], r["actual"]))
print(f"  Wheelo right: {w_right} ({w_right/len(flips):.1%})   v3 right: {v_right} ({v_right/len(flips):.1%})   diff {w_right-v_right:+d}")

# Per-season flip outcomes
for y in sorted(set(r["season"] for r in flips)):
    f = [r for r in flips if r["season"] == y]
    wr = sum(1 for r in f if tip_ok(r["p_w"], r["actual"]))
    print(f"  {y}: flips={len(f)}, wheelo right {wr} ({wr/len(f):.1%}), v3 right {len(f)-wr}")

# Per-venue on flips
print("\n  flip set by venue (top venues):")
venue_flips = defaultdict(list)
for r in flips:
    venue_flips[r["venue"]].append(r)
top_venues = sorted(venue_flips.items(), key=lambda kv: -len(kv[1]))[:10]
for v, items in top_venues:
    wr = sum(1 for r in items if tip_ok(r["p_w"], r["actual"]))
    print(f"    {v:<22} n={len(items):<3} wheelo {wr}/{len(items)} ({wr/len(items):.1%})")

# Per-team-pair on flips: which teams does Wheelo back that v3 dismisses?
print("\n  flip set: who Wheelo backs that v3 doesn't (top teams):")
wheelo_picks = defaultdict(lambda: [0, 0])  # team -> [picked, right]
for r in flips:
    pick = r["home"] if r["p_w"] >= 0.5 else r["away"]
    wheelo_picks[pick][0] += 1
    if tip_ok(r["p_w"], r["actual"]):
        wheelo_picks[pick][1] += 1
for team, (picked, right) in sorted(wheelo_picks.items(), key=lambda kv: -kv[1][0])[:12]:
    print(f"    {team:<20} picked {picked:<3} right {right} ({right/picked:.1%})")

# ------------------------------------------------------------------ A.3 field-consensus cut
# A Wheelo "edge" = he was right on a game where the field consensus was wrong.
print("\n=== A.3  field-consensus filter: Wheelo right vs field-consensus ===")
field_share = {}
for (d10, home), tips in field.items():
    n_with = len(tips)
    if n_with < 8:  # not enough sources to call consensus
        continue
    field_share[(d10, home)] = sum(1 for t in tips if t["correct"] == 1) / n_with

# Buckets: consensus right (>=0.65), split (0.35-0.65), consensus wrong (<=0.35)
def consensus(s):
    return "consensus_right" if s >= 0.65 else ("consensus_wrong" if s <= 0.35 else "split")

print(f"{'window':<18}{'bucket':<18}{'n':>5}  v3 right  wh right   Δ")
for wname, sel in WINDOWS:
    by_bucket = defaultdict(list)
    for r in rows:
        if not sel(r["season"]) or r["actual"] == 0:
            continue
        s = field_share.get((r["date"], r["home"]))
        if s is None:
            continue
        by_bucket[consensus(s)].append(r)
    for b in ("consensus_right", "split", "consensus_wrong"):
        items = by_bucket.get(b, [])
        if not items:
            continue
        t3 = sum(1 for r in items if tip_ok(r["p_v3"], r["actual"]))
        tw = sum(1 for r in items if tip_ok(r["p_w"], r["actual"]))
        print(f"{wname:<18}{b:<18}{len(items):>5}  {t3:>8} ({t3/len(items):.1%}) {tw:>8} ({tw/len(items):.1%})  {tw-t3:+d}")

# ------------------------------------------------------------------ A.3 T33 24 tipper-specific misses
print("\n=== A.3  T33 tipper-specific misses: Wheelo verdict ===")
byid = {r["matchId"]: r for r in rows}
ts_right = ts_wrong = 0
ts_no_match = 0
with open(f"{REPO}/analysis/task33-misses-tagged.csv") as f:
    for miss in csv.DictReader(f):
        if miss["class"] != "tipper_specific":
            continue
        r = byid.get(int(miss["matchId"]))
        if r is None:
            ts_no_match += 1
            continue
        ok = tip_ok(r["p_w"], r["actual"])
        ts_right += ok is True
        ts_wrong += ok is False
        sign = "RIGHT" if ok else "wrong"
        print(
            f"  {r['date']} {r['home']:<17} v {r['away']:<17} "
            f"v3 p {r['p_v3']:.2f}  wheelo p {r['p_w']:.2f} pred {r['pred_w']:>6.1f}  "
            f"act {r['actual']:>4}  wheelo {sign}"
        )
print(f"\nWheelo on T33 TS misses: {ts_right} right / {ts_wrong} wrong / {ts_no_match} not in 2022-26 pairing")
print(
    "  (v3 by definition got these wrong; market got 7/24 right per T34; "
    "this number tells us whether Wheelo has the signal we don't)"
)

# ------------------------------------------------------------------ A.3 per-venue residuals
print("\n=== A.3  per-venue residual bias (margin vs predicted, by venue) ===")
print(f"{'venue':<22}{'n':>4}{'v3 bias':>10}{'wh bias':>10}{'v3 |err|':>10}{'wh |err|':>10}")
venue_groups = defaultdict(list)
for r in rows:
    venue_groups[r["venue"]].append(r)
for v, items in sorted(venue_groups.items(), key=lambda kv: -len(kv[1])):
    if len(items) < 15:
        continue
    bias3 = sum(r["actual"] - r["pred_v3"] for r in items) / len(items)
    biasw = sum(r["actual"] - r["pred_w"] for r in items) / len(items)
    err3 = sum(abs(r["actual"] - r["pred_v3"]) for r in items) / len(items)
    errw = sum(abs(r["actual"] - r["pred_w"]) for r in items) / len(items)
    print(f"{v:<22}{len(items):>4}{bias3:>+10.2f}{biasw:>+10.2f}{err3:>10.2f}{errw:>10.2f}")

# ------------------------------------------------------------------ A.3 per-team residuals
print("\n=== A.3  per-team residual bias (team net = actual home margin signed for team) ===")
print(f"{'team':<22}{'n':>4}{'v3 bias':>10}{'wh bias':>10}")
team_groups = defaultdict(list)
for r in rows:
    team_groups[r["home"]].append(("home", r))
    team_groups[r["away"]].append(("away", r))
for team, entries in sorted(team_groups.items()):
    if len(entries) < 30:
        continue
    bias3 = (
        sum(
            (r["actual"] - r["pred_v3"]) if side == "home" else -(r["actual"] - r["pred_v3"])
            for side, r in entries
        )
        / len(entries)
    )
    biasw = (
        sum(
            (r["actual"] - r["pred_w"]) if side == "home" else -(r["actual"] - r["pred_w"])
            for side, r in entries
        )
        / len(entries)
    )
    print(f"{team:<22}{len(entries):>4}{bias3:>+10.2f}{biasw:>+10.2f}")

# ------------------------------------------------------------------ A.3 pred distance / corr
print("\n=== A.3  prediction agreement (margin & prob correlation) ===")
for wname, sel in WINDOWS:
    w = [r for r in rows if sel(r["season"])]
    n = len(w)
    mean_v3p, mean_wp = sum(r["p_v3"] for r in w) / n, sum(r["p_w"] for r in w) / n
    mean_v3m, mean_wm = sum(r["pred_v3"] for r in w) / n, sum(r["pred_w"] for r in w) / n
    cov_p = sum((r["p_v3"] - mean_v3p) * (r["p_w"] - mean_wp) for r in w)
    var3p = sum((r["p_v3"] - mean_v3p) ** 2 for r in w)
    varwp = sum((r["p_w"] - mean_wp) ** 2 for r in w)
    corr_p = cov_p / math.sqrt(var3p * varwp)
    cov_m = sum((r["pred_v3"] - mean_v3m) * (r["pred_w"] - mean_wm) for r in w)
    var3m = sum((r["pred_v3"] - mean_v3m) ** 2 for r in w)
    varwm = sum((r["pred_w"] - mean_wm) ** 2 for r in w)
    corr_m = cov_m / math.sqrt(var3m * varwm)
    mean_abs_p = sum(abs(r["p_v3"] - r["p_w"]) for r in w) / n
    mean_abs_m = sum(abs(r["pred_v3"] - r["pred_w"]) for r in w) / n
    print(
        f"{wname:<18} corr(p) {corr_p:.3f}  mean|Δp| {mean_abs_p:.3f}  "
        f"corr(margin) {corr_m:.3f}  mean|Δmargin| {mean_abs_m:.2f}"
    )

# ------------------------------------------------------------------ persist flip set for B
out = f"{REPO}/analysis/wheelo-flips-2022-2026.csv"
with open(out, "w") as f:
    w = csv.writer(f)
    w.writerow(
        ["matchId", "season", "date", "home", "away", "venue",
         "p_v3", "pred_v3", "p_w", "pred_w", "actual", "wheelo_right"]
    )
    for r in flips:
        w.writerow(
            [r["matchId"], r["season"], r["date"], r["home"], r["away"], r["venue"],
             f"{r['p_v3']:.4f}", f"{r['pred_v3']:.2f}",
             f"{r['p_w']:.4f}", f"{r['pred_w']:.2f}",
             r["actual"], tip_ok(r["p_w"], r["actual"])]
        )
print(f"\npersisted flip set: {out} (n={len(flips)})")

# persist full paired set for Phase B
out2 = f"{REPO}/analysis/wheelo-paired-2022-2026.csv"
with open(out2, "w") as f:
    w = csv.writer(f)
    w.writerow(
        ["matchId", "season", "date", "home", "away", "venue",
         "p_v3", "pred_v3", "p_w", "pred_w", "actual"]
    )
    for r in rows:
        w.writerow(
            [r["matchId"], r["season"], r["date"], r["home"], r["away"], r["venue"],
             f"{r['p_v3']:.4f}", f"{r['pred_v3']:.2f}",
             f"{r['p_w']:.4f}", f"{r['pred_w']:.2f}",
             r["actual"]]
        )
print(f"persisted full paired set: {out2} (n={len(rows)})")
