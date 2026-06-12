"""Task 33: missed-tip pattern analysis with field triangulation (v3, 2023-2026).

Phase 1  tag every scored game (miss + correct control) with candidate features
Phase 2  classify each v3 miss by field agreement (consensus / grey / tipper-specific)
Phase 3  cross-tab tipper-specific misses vs control, conditional on closeness
Outputs  /tmp/task33-games-tagged.csv (all games) + printed triangulation tables

Inputs (cached; fetched with Squiggle etiquette User-Agent if missing):
  /tmp/sq_tips_{year}.json    Squiggle q=tips per year
  /tmp/sq_games_{year}.json   Squiggle q=games;complete=100 per year
  /tmp/weather-2023-2026.json D1 matches dump (weather only populated 2010-25)
  configs/predha-080/results-2026-06-12-{2641f46f,e8e0cede}.json  v3 records
"""

import csv
import json
import os
import urllib.request
from collections import Counter, defaultdict
from datetime import date

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
YEARS = (2023, 2024, 2025, 2026)
NAME = {"GWS Giants": "Greater Western Sydney"}  # ours -> Squiggle
UA = "tipper research (jackemcpherson@gmail.com)"

VENUE_STATE = {
    "MCG": "VIC", "Marvel Stadium": "VIC", "Kardinia Park": "VIC", "Mars Stadium": "VIC",
    "Adelaide Oval": "SA", "Norwood Oval": "SA", "Barossa Park": "SA",
    "Perth Stadium": "WA", "Hands Oval": "WA",
    "Gabba": "QLD", "Carrara": "QLD",
    "SCG": "NSW", "Sydney Showground": "NSW",
    "UTAS Stadium": "TAS", "Ninja Stadium": "TAS",
    "Manuka Oval": "ACT", "TIO Stadium": "NT", "Traeger Park": "NT",
}
TEAM_STATE = {
    "Carlton": "VIC", "Collingwood": "VIC", "Essendon": "VIC", "Geelong": "VIC",
    "Hawthorn": "VIC", "Melbourne": "VIC", "North Melbourne": "VIC", "Richmond": "VIC",
    "St Kilda": "VIC", "Western Bulldogs": "VIC",
    "Adelaide": "SA", "Port Adelaide": "SA",
    "West Coast": "WA", "Fremantle": "WA",
    "Brisbane Lions": "QLD", "Gold Coast": "QLD",
    "Sydney": "NSW", "GWS Giants": "NSW",
}
# True home grounds incl. secondary (T22 conventions); MCG/Marvel are shared.
HOME_GROUNDS = {
    "Geelong": {"Kardinia Park"},
    "Adelaide": {"Adelaide Oval"}, "Port Adelaide": {"Adelaide Oval"},
    "West Coast": {"Perth Stadium"}, "Fremantle": {"Perth Stadium", "Hands Oval"},
    "Brisbane Lions": {"Gabba"}, "Gold Coast": {"Carrara", "TIO Stadium"},
    "Sydney": {"SCG"}, "GWS Giants": {"Sydney Showground", "Manuka Oval"},
    "Hawthorn": {"UTAS Stadium"}, "North Melbourne": {"Ninja Stadium"},
    "Melbourne": {"Traeger Park"}, "Western Bulldogs": {"Mars Stadium"},
}
WET = {"RAIN", "THUNDERSTORMS"}

CONSENSUS_MAX = 0.35   # field share correct at or below -> consensus miss
TIPPER_SPECIFIC_MIN = 0.65  # field share correct at or above -> tipper-specific miss
CLOSE = 12.0           # |pred margin| band where comp placings are decided (T32)


def fetch(url: str, path: str):
    if os.path.exists(path):
        return json.load(open(path))
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    data = json.load(urllib.request.urlopen(req))
    json.dump(data, open(path, "w"))
    return data


def venue_bucket(home: str, away: str, venue: str) -> str:
    same_state = TEAM_STATE[home] == TEAM_STATE[away]
    if venue in HOME_GROUNDS.get(home, set()):
        return "true_home_same_state" if same_state else "true_home_interstate"
    if VENUE_STATE[venue] == TEAM_STATE[home]:
        return "shared_derby" if same_state else "shared_interstate"
    return "neutral"


def close_band(abs_pred: float) -> str:
    if abs_pred < 6:
        return "<6"
    if abs_pred < 12:
        return "6-12"
    if abs_pred < 24:
        return "12-24"
    return "24+"


def phase_of(round_label: str, round_number: int) -> str:
    if not round_label.startswith("Round") and round_label != "Opening Round":
        return "finals"
    if round_number <= 8:
        return "early"
    if round_number <= 16:
        return "mid"
    return "late"


# ---------------------------------------------------------------- load inputs
v3 = [
    m
    for m in json.load(open(f"{REPO}/configs/predha-080/results-2026-06-12-2641f46f.json"))["matches"]
    if m["date"][:4] >= "2023"
] + json.load(open(f"{REPO}/configs/predha-080/results-2026-06-12-e8e0cede.json"))["matches"]

weather = {r["id"]: r for r in json.load(open("/tmp/weather-2023-2026.json"))}

games_by_year, tips_by_year = {}, {}
for y in YEARS:
    games_by_year[y] = fetch(
        f"https://api.squiggle.com.au/?q=games;year={y};complete=100;format=json",
        f"/tmp/sq_games_{y}.json",
    )["games"]
    tips_by_year[y] = fetch(
        f"https://api.squiggle.com.au/?q=tips;year={y};format=json", f"/tmp/sq_tips_{y}.json"
    )["tips"]

# ------------------------------------------------- per-team schedule -> rest
rest = {}  # (year, squiggle_team, date10) -> days since previous game (None = first game)
for y in YEARS:
    sched = defaultdict(list)
    for g in games_by_year[y]:
        for t in (g["hteam"], g["ateam"]):
            sched[t].append(g["date"][:10])
    for t, dates in sched.items():
        dates.sort()
        prev = None
        for d10 in dates:
            cur = date.fromisoformat(d10)
            rest[(y, t, d10)] = (cur - prev).days if prev else None
            prev = cur

# ------------------------------------------ field tips per game (full-coverage sources)
field = {}  # gameid -> list of (source, correct, hconf)
full_sources_by_year = {}
for y in YEARS:
    n_games = len(games_by_year[y])
    game_ids = {g["id"] for g in games_by_year[y]}
    per_src = defaultdict(list)
    for t in tips_by_year[y]:
        if t["gameid"] in game_ids:
            per_src[t["source"]].append(t)
    full = {s for s, ts in per_src.items() if len(ts) == n_games}
    full_sources_by_year[y] = full
    for s in full:
        for t in per_src[s]:
            field.setdefault(t["gameid"], []).append(
                (s, t["correct"] or 0, float(t["hconfidence"]))
            )

# ---------------------------------------------------------------- Phase 1 tag
gkey = {
    (g["date"][:10], g["hteam"]): g for y in YEARS for g in games_by_year[y]
}

rows = []
for m in v3:
    y = int(m["date"][:4])
    h_sq = NAME.get(m["home"], m["home"])
    a_sq = NAME.get(m["away"], m["away"])
    g = gkey[(m["date"][:10], h_sq)]
    tipset = field[g["id"]]
    actual = g["hscore"] - g["ascore"]
    draw = actual == 0
    home_won = actual > 0
    abs_pred = abs(m["predictedMargin"])
    field_share = sum(c for _, c, _ in tipset) / len(tipset)
    field_home_share = sum(1 for _, _, hc in tipset if hc > 50) / len(tipset)
    field_prob_winner = (
        None
        if draw
        else sum((hc / 100 if home_won else 1 - hc / 100) for _, _, hc in tipset) / len(tipset)
    )
    our_prob_winner = None if draw else m["winProbability"]["home" if home_won else "away"]
    miss = m.get("correct") is False
    if miss:
        cls = (
            "consensus"
            if field_share <= CONSENSUS_MAX
            else "tipper_specific"
            if field_share >= TIPPER_SPECIFIC_MIN
            else "grey"
        )
    else:
        cls = ""
    rh = rest[(y, h_sq, m["date"][:10])]
    ra = rest[(y, a_sq, m["date"][:10])]
    w = weather.get(m["matchId"], {})
    rows.append(
        {
            "matchId": m["matchId"],
            "season": y,
            "date": m["date"][:10],
            "round": m["round"],
            "phase": phase_of(m["round"], m["roundNumber"]),
            "home": m["home"],
            "away": m["away"],
            "venue": m["venue"],
            "vbucket": venue_bucket(m["home"], m["away"], m["venue"]),
            "predMargin": round(m["predictedMargin"], 2),
            "absPred": round(abs_pred, 2),
            "closeBand": close_band(abs_pred),
            "weTipped": m["predictedWinner"],
            "actualMargin": actual,
            "absActual": abs(actual),
            "draw": draw,
            "miss": miss,
            "class": cls,
            "fieldN": len(tipset),
            "fieldShareCorrect": round(field_share, 3),
            "fieldHomeShare": round(field_home_share, 3),
            "fieldFav": "home" if field_home_share >= 0.5 else "away",
            "weAgainstField": m["predictedWinner"] != ("home" if field_home_share >= 0.5 else "away"),
            "ourProbWinner": round(our_prob_winner, 3) if our_prob_winner is not None else "",
            "fieldProbWinner": round(field_prob_winner, 3) if field_prob_winner is not None else "",
            "restHome": rh if rh is not None else "",
            "restAway": ra if ra is not None else "",
            "restDiff": (rh - ra) if rh is not None and ra is not None else "",
            "postByeHome": rh is not None and rh >= 12,
            "postByeAway": ra is not None and ra >= 12,
            "weather": w.get("weather_type") or "",
            "wet": (w.get("weather_type") in WET) if w.get("weather_type") else "",
            "gameid": g["id"],
        }
    )

out_csv = "/tmp/task33-games-tagged.csv"
with open(out_csv, "w", newline="") as f:
    wcsv = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
    wcsv.writeheader()
    wcsv.writerows(rows)
miss_csv = f"{REPO}/analysis/task33-misses-tagged.csv"
with open(miss_csv, "w", newline="") as f:
    wcsv = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
    wcsv.writeheader()
    wcsv.writerows([r for r in rows if r["miss"]])
print(f"tagged {len(rows)} games -> {out_csv}; misses -> {miss_csv}")

# ------------------------------------------------------------- Phase 2 tables
misses = [r for r in rows if r["miss"]]
print(f"\n=== Phase 2: field triangulation of {len(misses)} v3 misses ===")
print(f"{'season':<8}{'misses':<8}{'consensus':<11}{'grey':<7}{'tipper-spec':<12}field sources")
for y in YEARS:
    ms = [r for r in misses if r["season"] == y]
    c = Counter(r["class"] for r in ms)
    print(
        f"{y:<8}{len(ms):<8}{c['consensus']:<11}{c['grey']:<7}{c['tipper_specific']:<12}"
        f"{len(full_sources_by_year[y])}"
    )
c = Counter(r["class"] for r in misses)
n = len(misses)
print(
    f"{'all':<8}{n:<8}{c['consensus']} ({c['consensus']/n:.0%})  {c['grey']} ({c['grey']/n:.0%})  "
    f"{c['tipper_specific']} ({c['tipper_specific']/n:.0%})"
)

ts = [r for r in misses if r["class"] == "tipper_specific"]
print(f"\n--- tipper-specific misses (n={len(ts)}): how wrong were we? ---")
for label, sel in (("all TS misses", ts), ("consensus misses", [r for r in misses if r["class"] == "consensus"])):
    if not sel:
        continue
    op = [1 - r["ourProbWinner"] for r in sel if r["ourProbWinner"] != ""]  # our prob on OUR tip
    fp = [r["fieldProbWinner"] for r in sel if r["fieldProbWinner"] != ""]
    ap = [r["absPred"] for r in sel]
    aa = [r["absActual"] for r in sel]
    print(
        f"{label:<22} our prob on tip {sum(op)/len(op):.3f}  field prob on winner {sum(fp)/len(fp):.3f}  "
        f"|pred| {sum(ap)/len(ap):5.1f}  |actual| {sum(aa)/len(aa):5.1f}"
    )
conf_wrong = sum(1 for r in ts if r["ourProbWinner"] != "" and r["ourProbWinner"] < 0.4)
print(f"TS misses where our prob on the true winner < 0.40 (confidently wrong): {conf_wrong}/{len(ts)}")

# which sources are repeatedly right on our TS misses?
src_right = Counter()
src_n = Counter()
for r in ts:
    for s, correct, _ in field[r["gameid"]]:
        src_n[s] += 1
        src_right[s] += correct
print(f"\n--- sources most often right on our {len(ts)} tipper-specific misses (min 60% of TS games) ---")
ranked = sorted(
    ((s, src_right[s], src_n[s]) for s in src_n if src_n[s] >= 0.6 * len(ts)),
    key=lambda x: -x[1] / x[2],
)
for s, r_, n_ in ranked[:12]:
    print(f"  {s:<28} {r_:>3}/{n_:<3} {r_/n_:.0%}")

mirror = [r for r in rows if not r["miss"] and not r["draw"] and r["fieldShareCorrect"] <= CONSENSUS_MAX]
print(f"\n--- mirror: games v3 got RIGHT that >=65% of the field missed: n={len(mirror)} ---")
for r in sorted(mirror, key=lambda r: r["fieldShareCorrect"]):
    print(
        f"  {r['date']} {r['home']} v {r['away']:<22} pred {r['predMargin']:>6} act {r['actualMargin']:>4} "
        f"field {r['fieldShareCorrect']:.0%} [{r['vbucket']}, {r['phase']}]"
    )

# ------------------------------------------------------------- Phase 3 tables
print("\n=== Phase 3: TS-miss over-representation vs control, conditional on closeness ===")
print(f"(control = all non-draw games in the same closeness band; TS rate baseline per band)")

bands = ("<6", "6-12", "12-24", "24+")
nondraw = [r for r in rows if not r["draw"]]
for band in bands:
    in_band = [r for r in nondraw if r["closeBand"] == band]
    ts_b = [r for r in in_band if r["class"] == "tipper_specific"]
    print(
        f"\nband |pred|={band:<6} games {len(in_band):<5} misses {sum(1 for r in in_band if r['miss']):<4} "
        f"TS {len(ts_b):<4} base TS rate {len(ts_b)/len(in_band):.1%}"
    )


def crosstab(feature, fn, min_n=4):
    """Per feature value: TS-miss rate vs band-matched expectation, with season replication."""
    print(f"\n--- {feature} (close games |pred|<12 only) ---")
    close_games = [r for r in nondraw if r["absPred"] < CLOSE]
    base = sum(1 for r in close_games if r["class"] == "tipper_specific") / len(close_games)
    by_val = defaultdict(list)
    for r in close_games:
        for v in fn(r):
            by_val[v].append(r)
    print(f"{'value':<26}{'n':>5}{'TS':>4}{'rate':>7}{'ratio':>7}  seasons(TS)")
    out = []
    for v, sel in by_val.items():
        ts_sel = [r for r in sel if r["class"] == "tipper_specific"]
        if len(ts_sel) < min_n and len(sel) < 30:
            continue
        seasons = sorted(set(r["season"] for r in ts_sel))
        rate = len(ts_sel) / len(sel)
        out.append((v, len(sel), len(ts_sel), rate, rate / base if base else 0, seasons))
    for v, n_, t_, rate, ratio, seasons in sorted(out, key=lambda x: -x[4]):
        print(f"{str(v):<26}{n_:>5}{t_:>4}{rate:>7.1%}{ratio:>7.2f}  {seasons}")
    print(f"{'(base, all close games)':<26}{len(close_games):>5}{sum(1 for r in close_games if r['class']=='tipper_specific'):>4}{base:>7.1%}")


crosstab("venue bucket", lambda r: [r["vbucket"]])
crosstab("round phase", lambda r: [r["phase"]])
crosstab("we vs field favourite", lambda r: [f"weAgainstField={r['weAgainstField']}"])
crosstab("upset side (our tip)", lambda r: [f"tipped_{r['weTipped']}"])
crosstab(
    "post-bye", lambda r: [f"postByeHome={r['postByeHome']}", f"postByeAway={r['postByeAway']}"]
)
crosstab(
    "rest diff",
    lambda r: [
        "restDiff<=-2" if r["restDiff"] != "" and r["restDiff"] <= -2
        else "restDiff>=2" if r["restDiff"] != "" and r["restDiff"] >= 2
        else "restDiff~0"
    ]
    if r["restDiff"] != ""
    else [],
)
crosstab("weather (2023-25 only)", lambda r: [f"wet={r['wet']}"] if r["wet"] != "" else [])
crosstab("team in game (either side)", lambda r: [r["home"], r["away"]], min_n=5)
crosstab("home team", lambda r: [f"home:{r['home']}"], min_n=5)
crosstab("away team", lambda r: [f"away:{r['away']}"], min_n=5)
