"""Gate 4 harness: OD-split consensus-wrong regression guard (Task 38b pre-flight).

Compares OD-split config (od-w100-k008) vs v3 incumbent (predha-080) on the
field-consensus buckets from the Squiggle field. The critical metric is ΔTips
on the consensus_wrong bucket — games where the Squiggle field consensus got it
wrong. v3 has a +14/256 contrarian edge (2022-25 primary) that OD must not erode.

Gate 4 pass criteria (pre-registered):
  - ΔTips (OD − v3) on consensus_wrong bucket is >= 0 (point estimate), AND
  - Bucket n >= 30 (otherwise INCONCLUSIVE — too few contrarian games to judge).
  - A negative point estimate is FAIL regardless of CI width. Deliberately strict
    because the contrarian edge is load-bearing for the Squiggle comp (tips-scored).

Exit codes:
  0 — PASS or INCONCLUSIVE (OD does not regress v3's contrarian edge)
  1 — Script error (missing files, fetch failure, matchId pairing mismatch)
  2 — FAIL (negative ΔTips point estimate on consensus_wrong bucket)

Usage:
  python3 analysis/od-consensus-gate.py
"""

import glob
import json
import math
import os
import random
import re
import sys
import urllib.request
from collections import defaultdict

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQ_NAME = {"Greater Western Sydney": "GWS Giants"}
UA = "tipper-od-gate/1.0 (jackemcpherson@gmail.com)"
SQ_CACHE_DIR = "/tmp/sq"
YEARS = list(range(2021, 2027))  # 2021-2026 inclusive

# ------------------------------------------------------------------ scoring helpers
# Copied verbatim from analysis/wheelo-headhead.py lines 33-43.
# Convention: draws counted as away wins for LL; draws excluded from tip%.

def clamp(p):
    return max(0.01, min(0.99, p))


def logloss_bits(prob_home, actual_margin):
    home_won = actual_margin > 0  # draws scored as away wins, per metrics.ts
    return -math.log2(clamp(prob_home if home_won else 1 - prob_home))


def tip_ok(prob_home, actual):
    if actual == 0:
        return None  # draw, excluded from tip%
    return (prob_home >= 0.5) == (actual > 0)


# ------------------------------------------------------------------ load predictions

def load_predictions(config_id):
    """Load all graded predictions from a config, deduplicating by matchId.

    Groups results files by their config-hash suffix, takes the newest dated
    file per hash (so re-runs don't double-count), then concatenates. Returns
    (matches_list, used_file_paths).
    """
    config_dir = os.path.join(REPO, "configs", config_id)
    files = glob.glob(os.path.join(config_dir, "results-*.json"))
    if not files:
        print(f"ERROR: no results files found under {config_dir}", file=sys.stderr)
        sys.exit(1)

    # Group by hash suffix; for each hash keep the newest date
    by_hash: dict[str, tuple[str, str]] = {}  # hash -> (date, path)
    for f in files:
        m = re.search(r"results-(\d{4}-\d{2}-\d{2})-([0-9a-f]+)\.json$", f)
        if not m:
            continue
        date_str, hash_ = m.group(1), m.group(2)
        if hash_ not in by_hash or date_str > by_hash[hash_][0]:
            by_hash[hash_] = (date_str, f)

    used_paths = sorted(p for _, p in by_hash.values())
    all_matches: dict[int, dict] = {}
    for path in used_paths:
        data = json.load(open(path))
        for match in data["matches"]:
            if match.get("actualMargin") is not None:
                all_matches[match["matchId"]] = match

    return list(all_matches.values()), used_paths


# ------------------------------------------------------------------ Squiggle fetch

def fetch_squiggle_field(years):
    """Fetch full-field Squiggle tips for given years, caching to /tmp/sq/.

    Returns field[(date10, home)] -> list of {source, correct}.
    """
    os.makedirs(SQ_CACHE_DIR, exist_ok=True)
    field: dict[tuple[str, str], list[dict]] = defaultdict(list)
    scored_years = []

    for y in years:
        cache_path = os.path.join(SQ_CACHE_DIR, f"sq_tips_{y}.json")
        if os.path.exists(cache_path) and os.path.getsize(cache_path) > 100:
            data = json.load(open(cache_path))
        else:
            url = f"https://api.squiggle.com.au/?q=tips;year={y}"
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            try:
                with urllib.request.urlopen(req, timeout=60) as resp:
                    raw = resp.read()
                data = json.loads(raw)
                with open(cache_path, "wb") as fh:
                    fh.write(raw)
            except Exception as e:
                print(f"ERROR: Squiggle fetch failed for {y}: {e}", file=sys.stderr)
                sys.exit(1)

        tips = data.get("tips", [])
        if not tips:
            print(f"  WARNING: no tips for year {y} (future season?), skipping")
            continue

        scored_years.append(y)
        for t in tips:
            if t.get("hconfidence") is None:
                continue
            home = SQ_NAME.get(t["hteam"], t["hteam"])
            field[(t["date"][:10], home)].append(
                {
                    "source": t["source"],
                    "correct": t.get("correct"),
                }
            )

    return dict(field), scored_years


# ------------------------------------------------------------------ consensus helpers
# Copied from wheelo-headhead.py lines 277-301.

def compute_field_share(field):
    """field[(date10, home)] -> list; returns field_share[(date10, home)] -> float."""
    fs = {}
    for key, tips in field.items():
        n_with = len(tips)
        if n_with < 8:
            continue
        fs[key] = sum(1 for t in tips if t["correct"] == 1) / n_with
    return fs


def consensus_bucket(s):
    if s >= 0.65:
        return "consensus_right"
    if s <= 0.35:
        return "consensus_wrong"
    return "split"


# ------------------------------------------------------------------ bootstrap CI
# Adapted from wheelo-headhead.py line 170 bootstrap_ci.
# Here 'b' = OD, 'a' = v3 (delta = OD − v3).

def bootstrap_ci_tips(rows_subset, n_iters=1000, seed=42):
    """Era-stratified bootstrap on ΔTips (OD − v3) for a row subset."""
    rng = random.Random(seed)
    by_season: dict[int, list] = defaultdict(list)
    for r in rows_subset:
        if r["actual"] != 0:
            by_season[r["season"]].append(r)

    base_n = sum(len(v) for v in by_season.values())
    if base_n == 0:
        return float("nan"), float("nan"), float("nan")

    deltas = []
    for _ in range(n_iters):
        ta = tb = 0
        for items in by_season.values():
            sample = [items[rng.randrange(len(items))] for _ in range(len(items))]
            ta += sum(1 for r in sample if tip_ok(r["p_v3"], r["actual"]))
            tb += sum(1 for r in sample if tip_ok(r["p_od"], r["actual"]))
        deltas.append((tb - ta) / base_n)
    deltas.sort()
    lo = deltas[int(0.025 * n_iters)]
    hi = deltas[int(0.975 * n_iters)]

    # Point estimate on original data
    dec = [r for r in rows_subset if r["actual"] != 0]
    ta_p = sum(1 for r in dec if tip_ok(r["p_v3"], r["actual"]))
    tb_p = sum(1 for r in dec if tip_ok(r["p_od"], r["actual"]))
    point = (tb_p - ta_p) / base_n if base_n > 0 else float("nan")

    return point, lo, hi


# ------------------------------------------------------------------ sanity cross-check

def sanity_check_v3(v3_matches, used_paths):
    """Verify computed v3 tips and LL match the results-file overall block."""
    errors = []

    # For each used file, check our computation against that file's overall
    for path in used_paths:
        data = json.load(open(path))
        file_matches = [m for m in data["matches"] if m.get("actualMargin") is not None]
        if not file_matches:
            continue
        overall = data.get("overall")
        if not overall:
            continue

        dec = [m for m in file_matches if m["actualMargin"] != 0]
        computed_tips = sum(1 for m in dec if tip_ok(m["winProbability"]["home"], m["actualMargin"]))
        computed_ll = sum(logloss_bits(m["winProbability"]["home"], m["actualMargin"]) for m in file_matches) / len(file_matches)

        expected_tips = overall.get("tips")
        expected_ll = overall.get("log_loss_bits")

        fname = os.path.basename(path)
        if expected_tips is not None and abs(computed_tips - expected_tips) > 1:
            errors.append(f"  {fname}: tips mismatch — computed {computed_tips}, file says {expected_tips}")
        if expected_ll is not None and abs(computed_ll - expected_ll) > 0.001:
            errors.append(f"  {fname}: LL mismatch — computed {computed_ll:.6f}, file says {expected_ll:.6f}")

    if errors:
        print("STOP: v3 sanity cross-check FAILED:", file=sys.stderr)
        for e in errors:
            print(e, file=sys.stderr)
        sys.exit(1)

    print("Sanity cross-check: v3 tips and LL match results files. OK")


# ========================================================================== MAIN

print("=== OD-split consensus-wrong gate (Gate 4) ===\n")

# Step 1: load predictions
v3_matches, v3_paths = load_predictions("predha-080")
od_matches, od_paths = load_predictions("od-w100-k008")

print(f"v3  files used: {[os.path.basename(p) for p in v3_paths]}")
print(f"OD  files used: {[os.path.basename(p) for p in od_paths]}")
print(f"v3  loaded: {len(v3_matches)} graded matches")
print(f"OD  loaded: {len(od_matches)} graded matches\n")

# Step 2: pair by matchId (coverage assertion — must be equal)
v3_by_id = {m["matchId"]: m for m in v3_matches}
od_by_id = {m["matchId"]: m for m in od_matches}

v3_ids = set(v3_by_id)
od_ids = set(od_by_id)
unmatched_v3 = v3_ids - od_ids
unmatched_od = od_ids - v3_ids

if unmatched_v3 or unmatched_od:
    print(f"STOP: matchId pairing mismatch — {len(unmatched_v3)} in v3 only, {len(unmatched_od)} in OD only", file=sys.stderr)
    sys.exit(1)

paired_ids = v3_ids & od_ids
rows = []
for mid in sorted(paired_ids):
    v = v3_by_id[mid]
    o = od_by_id[mid]
    rows.append(
        {
            "matchId": mid,
            "season": int(v["date"][:4]),
            "date": v["date"][:10],
            "home": v["home"],
            "away": v["away"],
            "p_v3": v["winProbability"]["home"],
            "p_od": o["winProbability"]["home"],
            "pred_v3": v["predictedMargin"],
            "pred_od": o["predictedMargin"],
            "actual": v["actualMargin"],
        }
    )

print(f"Paired: {len(rows)} games across {sorted(set(r['season'] for r in rows))} seasons\n")

# Step 3: sanity cross-check v3 against its own results file
sanity_check_v3(v3_matches, v3_paths)

# Print v3 pooled stats for cross-check visibility
dec_all = [r for r in rows if r["actual"] != 0]
v3_tips_pooled = sum(1 for r in dec_all if tip_ok(r["p_v3"], r["actual"]))
v3_ll_pooled = sum(logloss_bits(r["p_v3"], r["actual"]) for r in rows) / len(rows)
od_tips_pooled = sum(1 for r in dec_all if tip_ok(r["p_od"], r["actual"]))
od_ll_pooled = sum(logloss_bits(r["p_od"], r["actual"]) for r in rows) / len(rows)
print(f"\nPooled (all paired): v3 tips={v3_tips_pooled}/{len(dec_all)}, LL={v3_ll_pooled:.4f}")
print(f"Pooled (all paired): OD tips={od_tips_pooled}/{len(dec_all)}, LL={od_ll_pooled:.4f}")

# Step 4: fetch Squiggle field tips
print(f"\nFetching Squiggle field tips for {YEARS}...")
field_raw, scored_years = fetch_squiggle_field(YEARS)
print(f"Field tips loaded for: {scored_years}")

if not all(y in scored_years for y in range(2021, 2026)):
    missing = [y for y in range(2021, 2026) if y not in scored_years]
    print(f"ERROR: Missing primary window years {missing}", file=sys.stderr)
    sys.exit(1)

# Step 5: compute field_share and consensus buckets
field_share = compute_field_share(field_raw)

# Step 6: bucket table
WINDOWS = (
    ("primary 2021-25", lambda y: 2021 <= y <= 2025),
    ("2026 OOS", lambda y: y == 2026),
    ("pooled 2021-26", lambda y: 2021 <= y <= 2026),
)

print("\n=== Consensus-bucket breakdown ===")
print(
    f"{'window':<18}{'bucket':<18}{'n':>5}  "
    f"{'v3 tips':>10}{'OD tips':>10}{'ΔTips':>7}   "
    f"{'v3 LL':>7}{'OD LL':>7}{'ΔLL':>8}"
)

# Collect pooled consensus_wrong rows for bootstrap
cw_rows_pooled = []

for wname, sel in WINDOWS:
    by_bucket: dict[str, list] = defaultdict(list)
    for r in rows:
        if not sel(r["season"]) or r["actual"] == 0:
            continue
        fs = field_share.get((r["date"], r["home"]))
        if fs is None:
            continue
        by_bucket[consensus_bucket(fs)].append(r)

    for b in ("consensus_right", "split", "consensus_wrong"):
        items = by_bucket.get(b, [])
        if not items:
            print(f"{wname:<18}{b:<18}{'—':>5}")
            continue
        t_v3 = sum(1 for r in items if tip_ok(r["p_v3"], r["actual"]))
        t_od = sum(1 for r in items if tip_ok(r["p_od"], r["actual"]))
        delta_tips = t_od - t_v3
        ll_v3 = sum(logloss_bits(r["p_v3"], r["actual"]) for r in items) / len(items)
        ll_od = sum(logloss_bits(r["p_od"], r["actual"]) for r in items) / len(items)
        delta_ll = ll_od - ll_v3

        print(
            f"{wname:<18}{b:<18}{len(items):>5}  "
            f"{t_v3:>5} ({t_v3/len(items):.1%}){t_od:>5} ({t_od/len(items):.1%}){delta_tips:>+7}   "
            f"{ll_v3:>7.4f}{ll_od:>7.4f}{delta_ll:>+8.4f}"
        )

        if wname == "pooled 2021-26" and b == "consensus_wrong":
            cw_rows_pooled = items
            cw_delta_tips = delta_tips
            cw_n = len(items)

# Step 7: bootstrap CI on consensus_wrong pooled ΔTips
print("\n=== Consensus-wrong bootstrap CI (pooled 2021-26, 1000 iters, seed=42) ===")
if cw_rows_pooled:
    ci_point, ci_lo, ci_hi = bootstrap_ci_tips(cw_rows_pooled)
    print(f"consensus_wrong ΔTips (OD−v3): point={ci_point:+.4f}  95% CI [{ci_lo:+.4f}, {ci_hi:+.4f}]")
    print(f"  (raw counts: n={cw_n}, delta={cw_delta_tips:+d} tips)")
else:
    print("  No consensus_wrong games in pooled window — INCONCLUSIVE")
    cw_n = 0
    cw_delta_tips = 0

# Step 8: gate 4 verdict
print()
if cw_n < 30:
    verdict = "INCONCLUSIVE"
    print(f"GATE 4 (consensus-wrong ΔTips): n={cw_n} < 30 → {verdict}")
    sys.exit(0)
elif cw_delta_tips >= 0:
    verdict = "PASS"
    print(f"GATE 4 (consensus-wrong ΔTips): {cw_delta_tips:+d} → {verdict}")
    sys.exit(0)
else:
    verdict = "FAIL"
    print(f"GATE 4 (consensus-wrong ΔTips): {cw_delta_tips:+d} → {verdict}")
    sys.exit(2)
