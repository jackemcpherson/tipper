"""A3 weekly comp monitoring: v3 + v4-shadow vs the Squiggle field, 2026.

Productionizes the T32 rerank + T34 market-benchmark conventions into a repeatable
weekly run (HANDOFF.md item 1). Sections:
  1. comp rank table   — full-coverage Squiggle sources, comp scoring (tips on
                         completed games, draws correct for every source)
  2. close band        — |v3 predicted margin| < 12: sign accuracy for v3, v4-shadow,
                         Punters, and the field mean (draws excluded)
  3. market column     — Punters (source 5 ≈ closing odds, T34): season-to-date
                         v3 − Punters tips on the paired set; ALERT at |gap| >= 3

Refresh: shells out to `bun run dist/cli/index.js backtest -c <id> -s 2026` for
predha-080 and v4-shotoff (cold -s 2026 is valid post-T19; T31 verified cold==warm;
--season runs are never promotion-valid, which is fine — this is monitoring).
Use --no-refresh to score the newest existing 2026-scope results files.

Log: one row per run date appended to analysis/weekly-monitor-log.csv (same-day
re-runs replace the row). Exit codes: 0 ok, 1 error, 2 market-drift alert.
"""

import argparse
import csv
import glob
import json
import os
import subprocess
import sys
import urllib.request
from collections import defaultdict
from datetime import date

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V3 = "predha-080"
V4 = "v4-shotoff"
OD = "od-w100-k008"  # T36 second shadow (parked candidate)
YEAR = 2026
CLOSE = 12.0
ALERT_TIPS = 3
OURS_TO_SQ = {"GWS Giants": "Greater Western Sydney"}  # ours -> squiggle
UA = "tipper-weekly-monitor/1.0 (jackemcpherson@gmail.com)"
LOG_PATH = os.path.join(REPO, "analysis", "weekly-monitor-log.csv")
LOG_COLUMNS = [
    "run_date", "games_complete", "v3_tips", "v3_rank", "field_n",
    "leader", "leader_tips", "v4_tips", "v4_rank", "od_tips", "od_rank",
    "punters_tips", "market_gap", "close_n", "close_v3", "close_v4",
    "close_od", "close_punters", "close_field_pct", "alert",
]


def refresh_results():
    for config_id in (V3, V4, OD):
        print(f"refreshing {config_id} (backtest -s {YEAR}) ...", flush=True)
        r = subprocess.run(
            ["bun", "run", "dist/cli/index.js", "backtest", "-c", config_id, "-s", str(YEAR)],
            cwd=REPO,
            capture_output=True,
            text=True,
        )
        if r.returncode != 0:
            sys.stderr.write(r.stdout + r.stderr)
            sys.stderr.write(
                f"\nbacktest failed for {config_id} — if 401, re-auth wrangler and retry\n"
            )
            sys.exit(1)


def load_latest_results(config_id):
    """Newest results file scoped to exactly [YEAR]. Returns (path, parsed)."""
    candidates = []
    for path in glob.glob(os.path.join(REPO, "configs", config_id, "results-*.json")):
        data = json.load(open(path))
        if data["scope"]["seasons"] == [YEAR]:
            candidates.append((data["ran_at"], path, data))
    if not candidates:
        sys.stderr.write(f"no {YEAR}-scope results for {config_id}; run without --no-refresh\n")
        sys.exit(1)
    candidates.sort()
    return candidates[-1][1], candidates[-1][2]


def prune_old_results(config_id, keep_path, keep_data):
    """Remove older YEAR-scope files with the same effective-config hash."""
    for path in glob.glob(os.path.join(REPO, "configs", config_id, "results-*.json")):
        if path == keep_path:
            continue
        data = json.load(open(path))
        if (
            data["scope"]["seasons"] == [YEAR]
            and data["config_hash"] == keep_data["config_hash"]
            and data["ran_at"] < keep_data["ran_at"]
        ):
            os.remove(path)


def fetch_squiggle(q):
    url = f"https://api.squiggle.com.au/?q={q};year={YEAR}"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.load(resp)


def comp_tip(pred_margin, actual):
    """Comp convention: draws correct for every source."""
    return actual == 0 or (pred_margin >= 0) == (actual > 0)


def sign_tip(prob_or_margin_is_home, actual):
    """Engine convention: draws excluded (returns None)."""
    if actual == 0:
        return None
    return prob_or_margin_is_home == (actual > 0)


def score_ours(matches, gkey, label):
    """Pair our predictions with completed squiggle games.

    Every prediction we made must match a squiggle game (else the name map is
    broken); the reverse can lag when squiggle has games newer than the results
    snapshot — the caller scores on the intersection and warns.
    """
    paired = {}
    unmatched = []
    for m in matches:
        g = gkey.get((m["date"][:10], OURS_TO_SQ.get(m["home"], m["home"])))
        if g is not None:
            paired[g["id"]] = m
        elif m.get("actualMargin") is not None:
            unmatched.append(f"{m['date'][:10]} {m['home']} v {m['away']}")
    assert not unmatched, (label, "predictions unmatched in squiggle field", unmatched)
    return paired


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--no-refresh", action="store_true", help="use newest existing results")
    ap.add_argument("--quiet", action="store_true", help="log row + alert only")
    args = ap.parse_args()

    if not args.no_refresh:
        refresh_results()

    v3_path, v3_data = load_latest_results(V3)
    v4_path, v4_data = load_latest_results(V4)
    od_path, od_data = load_latest_results(OD)
    if not args.no_refresh:
        prune_old_results(V3, v3_path, v3_data)
        prune_old_results(V4, v4_path, v4_data)
        prune_old_results(OD, od_path, od_data)

    games = fetch_squiggle("games;complete=100")["games"]
    tips = fetch_squiggle("tips")["tips"]
    gm = {g["id"]: g for g in games}
    gkey = {(g["date"][:10], g["hteam"]): g for g in games}

    v3_by_gid = score_ours(v3_data["matches"], gkey, "v3")
    v4_by_gid = score_ours(v4_data["matches"], gkey, "v4")
    od_by_gid = score_ours(od_data["matches"], gkey, "od")
    covered = set(v3_by_gid) & set(v4_by_gid) & set(od_by_gid)
    if len(covered) < len(games):
        print(
            f"WARNING: results lag the field by {len(games) - len(covered)} completed game(s) "
            f"— scoring the paired {len(covered)}; run without --no-refresh for full coverage"
        )
        gm = {gid: g for gid, g in gm.items() if gid in covered}
        games = list(gm.values())

    # ---------------------------------------------------------------- field tips
    src = defaultdict(lambda: {"n": 0, "tips": 0, "mae": 0.0, "mn": 0})
    tips_by_gid = defaultdict(list)  # gameid -> [correct, ...] across sources
    punters_by_gid = {}
    for t in tips:
        if t["gameid"] not in gm:
            continue
        s = src[t["source"]]
        s["n"] += 1
        s["tips"] += t["correct"] or 0
        if t.get("err") is not None:
            s["mae"] += abs(float(t["err"]))
            s["mn"] += 1
        tips_by_gid[t["gameid"]].append(t["correct"] or 0)
        if t["source"] == "Punters":
            punters_by_gid[t["gameid"]] = t

    # ---------------------------------------------------------------- rank table
    rows = [
        (name, s["tips"], s["mae"] / s["mn"] if s["mn"] else None)
        for name, s in src.items()
        if s["n"] == len(games)
    ]
    field_n = len(rows)

    def ours_row(label, by_gid):
        tps = sum(
            comp_tip(by_gid[gid]["predictedMargin"], g["hscore"] - g["ascore"])
            for gid, g in gm.items()
        )
        mae = sum(
            abs(by_gid[gid]["predictedMargin"] - (g["hscore"] - g["ascore"]))
            for gid, g in gm.items()
        ) / len(games)
        return (label, tps, mae)

    rows.append(ours_row("Tipper v3", v3_by_gid))
    rows.append(ours_row("v4-shadow", v4_by_gid))
    rows.append(ours_row("OD-shadow", od_by_gid))
    rows.sort(key=lambda r: (-r[1], r[2] if r[2] is not None else 99))
    rank = {name: i for i, (name, _, _) in enumerate(rows, 1)}
    v3_tips = next(r[1] for r in rows if r[0] == "Tipper v3")
    v4_tips = next(r[1] for r in rows if r[0] == "v4-shadow")
    od_tips = next(r[1] for r in rows if r[0] == "OD-shadow")
    leader, leader_tips, _ = rows[0]

    if not args.quiet:
        print(f"\n=== {YEAR} comp standing ({len(games)} completed games, "
              f"{field_n} full-coverage sources + tipper) — scored on TIPS ===")
        ours = ("Tipper v3", "v4-shadow", "OD-shadow")
        for i, (name, tp, mae) in enumerate(rows, 1):
            if i <= 5 or name in ours or i == len(rows):
                pad = ">>" if name in ours else "  "
                mae_s = f"  MAE {mae:.2f}" if mae is not None else ""
                print(f"{pad}{i:>3}  {name:<24} {tp:>4} {100 * tp / len(games):>5.1f}%{mae_s}")

    # ---------------------------------------------------------------- close band
    close_gids = [
        gid for gid in gm
        if abs(v3_by_gid[gid]["predictedMargin"]) < CLOSE and gm[gid]["hscore"] != gm[gid]["ascore"]
    ]
    close_n = len(close_gids)

    def band_count(pred_home_fn):
        n = ok = 0
        for gid in close_gids:
            actual = gm[gid]["hscore"] - gm[gid]["ascore"]
            pred_home = pred_home_fn(gid)
            if pred_home is None:
                continue
            r = sign_tip(pred_home, actual)
            n += 1
            ok += r
        return ok, n

    close_v3, _ = band_count(lambda gid: v3_by_gid[gid]["predictedMargin"] >= 0)
    close_v4, _ = band_count(lambda gid: v4_by_gid[gid]["predictedMargin"] >= 0)
    close_od, _ = band_count(lambda gid: od_by_gid[gid]["predictedMargin"] >= 0)
    close_pun, close_pun_n = band_count(
        lambda gid: (
            float(punters_by_gid[gid]["hconfidence"]) >= 50
            if gid in punters_by_gid and punters_by_gid[gid].get("hconfidence") is not None
            else None
        )
    )
    close_field = [
        sum(tips_by_gid[gid]) / len(tips_by_gid[gid]) for gid in close_gids if tips_by_gid[gid]
    ]
    close_field_pct = sum(close_field) / len(close_field) if close_field else 0.0

    if not args.quiet:
        print(f"\n=== close band: |v3 pred margin| < {CLOSE:.0f}, non-draw (n={close_n}) ===")
        print(f"  v3       {close_v3}/{close_n} ({close_v3 / close_n:.1%})" if close_n else "  (none)")
        if close_n:
            print(f"  v4       {close_v4}/{close_n} ({close_v4 / close_n:.1%})")
            print(f"  OD       {close_od}/{close_n} ({close_od / close_n:.1%})")
            print(f"  Punters  {close_pun}/{close_pun_n} ({close_pun / close_pun_n:.1%})"
                  if close_pun_n else "  Punters  (no coverage)")
            print(f"  field    {close_field_pct:.1%} (mean correct across sources)")

    # ---------------------------------------------------------------- market gap
    paired_gids = [gid for gid in gm if gid in punters_by_gid]
    pun_tips = sum(
        comp_tip(
            1 if float(punters_by_gid[gid].get("hconfidence") or 50) >= 50 else -1,
            gm[gid]["hscore"] - gm[gid]["ascore"],
        )
        for gid in paired_gids
    )
    v3_tips_paired = sum(
        comp_tip(v3_by_gid[gid]["predictedMargin"], gm[gid]["hscore"] - gm[gid]["ascore"])
        for gid in paired_gids
    )
    market_gap = v3_tips_paired - pun_tips
    alert = abs(market_gap) >= ALERT_TIPS

    if not args.quiet:
        print(f"\n=== market column: v3 vs Punters (source 5 ≈ closing odds, T34) ===")
        print(f"  paired games {len(paired_gids)}  v3 {v3_tips_paired}  Punters {pun_tips}  "
              f"gap {market_gap:+d} (alert at ±{ALERT_TIPS})")

    # ---------------------------------------------------------------- log row
    row = {
        "run_date": date.today().isoformat(),
        "games_complete": len(games),
        "v3_tips": v3_tips,
        "v3_rank": rank["Tipper v3"],
        "field_n": field_n,
        "leader": leader,
        "leader_tips": leader_tips,
        "v4_tips": v4_tips,
        "v4_rank": rank["v4-shadow"],
        "od_tips": od_tips,
        "od_rank": rank["OD-shadow"],
        "punters_tips": pun_tips,
        "market_gap": market_gap,
        "close_n": close_n,
        "close_v3": close_v3,
        "close_v4": close_v4,
        "close_od": close_od,
        "close_punters": close_pun,
        "close_field_pct": round(close_field_pct, 4),
        "alert": int(alert),
    }
    existing = []
    if os.path.exists(LOG_PATH):
        existing = [r for r in csv.DictReader(open(LOG_PATH)) if r["run_date"] != row["run_date"]]
    with open(LOG_PATH, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=LOG_COLUMNS)
        w.writeheader()
        for r in existing:
            w.writerow(r)
        w.writerow(row)
    print(f"\nlogged: {LOG_PATH} ({row['run_date']}: v3 rank {row['v3_rank']}/{field_n + 2}, "
          f"{v3_tips}/{len(games)} tips, market gap {market_gap:+d})")

    if alert:
        direction = "ahead of" if market_gap > 0 else "behind"
        print(f"\n*** ALERT: v3 is {abs(market_gap)} tips {direction} the market season-to-date "
              f"(threshold ±{ALERT_TIPS}) — investigate per HANDOFF A3 ***")
        sys.exit(2)


if __name__ == "__main__":
    main()
