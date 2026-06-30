"""
Pre-registered univariate weather spike — Plan 002b.

==========================================================================
PRE-REGISTERED BAR (frozen before any result was computed — 2026-06-30)
==========================================================================
Buckets (defined from Step-1 coverage run, before scoring):
  wet   = weather_type in {RAIN, THUNDERSTORMS}
  dry   = weather_type in {MOSTLY_SUNNY, SUNNY, CLEAR_NIGHT}
  other = {OVERCAST, WINDY} — excluded from wet/dry comparisons
  extreme_temp = weather_temp_c in top-5% or bottom-5% of the
                 season year's distribution (secondary cut, analysis only)

Primary window: 2021–2025 (predha-080 results, 1062 matches).
Confirmatory window: 2016–2019 (predha80-early results, 828 matches).

GO criteria (BOTH conditions must hold — criterion plus replication):
  (a) v3 mean residual (actualMargin − predictedMargin) differs between
      wet and dry buckets by a margin whose 95% bootstrap CI excludes
      zero on the primary window, AND the direction (sign of wet−dry)
      replicates on the early window; OR
  (b) v3 close-band (|predictedMargin| < 12) tip accuracy differs
      between wet and dry buckets by ≥ 3 percentage points with
      bucket n ≥ 50 each on the primary window, AND direction
      replicates on the early window.

NO-GO: neither (a) nor (b) holds.
INCONCLUSIVE: criterion (a) or (b) triggered but direction does not
  replicate (early window has <20 wet or <20 dry close-band matches —
  insufficient for replication).

A within-noise result is NO-GO, not "promising".
Sanity cross-check: computed v3 overall tip% and logLoss per window
  must match results-file overall block to within ±0.0002 logloss,
  ±1 tip. Mismatch => STOP.

Reference: docs/task-37-age-curve-priors.md, docs/task-38a-per-venue-hga.md
==========================================================================

Inputs:
  configs/predha-080/results-2026-06-16-2641f46f.json   primary 2021-25
  configs/predha80-early/results-2026-06-16-909461e1.json early 2016-19
  /tmp/weather-rows-2016-2025.json   cached from weather-coverage-probe.ts

Run: python3 analysis/weather-univariate.py
"""

import json
import math
import os
import random
from collections import defaultdict

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLOSE = 12.0

# ── Scoring helpers (metrics.ts conventions) ─────────────────────────────


def clamp(p: float) -> float:
    return max(0.01, min(0.99, p))


def logloss_bits(prob_home: float, actual_margin: float) -> float:
    home_won = actual_margin > 0  # draws -> away wins, per metrics.ts
    return -math.log2(clamp(prob_home if home_won else 1 - prob_home))


def tip_ok(prob_home: float, actual: float):
    if actual == 0:
        return None  # draw, excluded from tip%
    return (prob_home >= 0.5) == (actual > 0)


# ── Bucket assignment ─────────────────────────────────────────────────────

WET_TYPES = {"RAIN", "THUNDERSTORMS"}
DRY_TYPES = {"MOSTLY_SUNNY", "SUNNY", "CLEAR_NIGHT"}
OTHER_TYPES = {"OVERCAST", "WINDY"}


def weather_bucket(wtype: str | None) -> str:
    if wtype in WET_TYPES:
        return "wet"
    if wtype in DRY_TYPES:
        return "dry"
    if wtype in OTHER_TYPES:
        return "other"
    return "unknown"


# ── Load weather rows ─────────────────────────────────────────────────────

weather_cache_path = "/tmp/weather-rows-2016-2025.json"
raw_weather = json.load(open(weather_cache_path))
# id -> {year, weather_type, weather_temp_c}
weather_by_id: dict[int, dict] = {r["id"]: r for r in raw_weather}

print(f"Loaded {len(weather_by_id)} weather rows from cache")

# ── Extreme-temp thresholds (per-year top/bottom 5%) ─────────────────────
by_year_temps: dict[int, list[float]] = defaultdict(list)
for r in raw_weather:
    if r["weather_temp_c"] is not None:
        by_year_temps[r["year"]].append(r["weather_temp_c"])

extreme_thresholds: dict[int, tuple[float, float]] = {}
for yr, temps in by_year_temps.items():
    temps.sort()
    n = len(temps)
    lo_idx = max(0, int(n * 0.05) - 1)
    hi_idx = min(n - 1, int(n * 0.95))
    extreme_thresholds[yr] = (temps[lo_idx], temps[hi_idx])

# ── Load v3 predictions ───────────────────────────────────────────────────

primary_path = f"{REPO}/configs/predha-080/results-2026-06-16-2641f46f.json"
early_path = f"{REPO}/configs/predha80-early/results-2026-06-16-909461e1.json"

primary_raw = json.load(open(primary_path))
early_raw = json.load(open(early_path))

OFFICIAL = {
    "primary": {
        "tips": primary_raw["overall"]["tips"],
        "matches": primary_raw["overall"]["matches"],
        "logloss": primary_raw["overall"]["log_loss_bits"],
    },
    "early": {
        "tips": early_raw["overall"]["tips"],
        "matches": early_raw["overall"]["matches"],
        "logloss": early_raw["overall"]["log_loss_bits"],
    },
}


# ── Enrich predictions with weather ──────────────────────────────────────


def enrich(matches: list[dict], label: str) -> list[dict]:
    enriched = []
    no_weather = 0
    for m in matches:
        if m.get("actualMargin") is None:
            continue  # unplayed
        mid = m["matchId"]
        w = weather_by_id.get(mid)
        if w is None:
            no_weather += 1
            continue
        yr = int(m["date"][:4])
        bucket = weather_bucket(w["weather_type"])
        lo_thr, hi_thr = extreme_thresholds.get(yr, (None, None))
        tc = w["weather_temp_c"]
        extreme = (
            (tc is not None and lo_thr is not None and (tc <= lo_thr or tc >= hi_thr))
            if lo_thr is not None
            else False
        )
        enriched.append(
            {
                **m,
                "year": yr,
                "weather_type": w["weather_type"],
                "weather_temp_c": tc,
                "bucket": bucket,
                "extreme_temp": extreme,
            }
        )
    if no_weather:
        print(f"  [{label}] {no_weather} matches with no weather row (not in cache)")
    return enriched


primary = enrich(primary_raw["matches"], "primary")
early = enrich(early_raw["matches"], "early")

print(f"Primary enriched: {len(primary)} matches")
print(f"Early enriched:   {len(early)} matches")

# ── Sanity cross-check ────────────────────────────────────────────────────

print("\n=== Sanity cross-check (must match results-file overall) ===")
STOP = False
for label, matches, official_key in [
    ("primary 2021-25", primary, "primary"),
    ("early 2016-19", early, "early"),
]:
    off = OFFICIAL[official_key]
    dec = [m for m in matches if m.get("actualMargin") is not None and m["actualMargin"] != 0]
    tips = sum(1 for m in dec if tip_ok(m["winProbability"]["home"], m["actualMargin"]) is True)
    ll = sum(logloss_bits(m["winProbability"]["home"], m["actualMargin"]) for m in matches)
    ll_mean = ll / len(matches)
    tip_ok_flag = abs(tips - off["tips"]) <= 1
    ll_ok_flag = abs(ll_mean - off["logloss"]) <= 0.0002
    status = "OK" if (tip_ok_flag and ll_ok_flag) else "MISMATCH"
    print(
        f"  {label}: tips {tips} (official {off['tips']}) "
        f"logloss {ll_mean:.4f} (official {off['logloss']:.4f})  [{status}]"
    )
    if status == "MISMATCH":
        print(f"  STOP: sanity cross-check failed for {label}")
        STOP = True

if STOP:
    raise SystemExit(1)
print("  Sanity check PASSED.")

# ── Residual bootstrap CI (wet − dry mean residual) ───────────────────────


def residuals(matches: list[dict]) -> list[dict]:
    return [
        {**m, "residual": m["actualMargin"] - m["predictedMargin"]}
        for m in matches
        if m.get("actualMargin") is not None
    ]


def bootstrap_residual_ci(
    matches: list[dict], bucket_a: str, bucket_b: str, n_iters: int = 2000, seed: int = 42
) -> dict:
    """Bootstrap CI on mean residual difference (bucket_a − bucket_b).
    Era-stratified: resample within year strata.
    Returns point estimate and 95% CI.
    """
    rng = random.Random(seed)
    a = [m for m in matches if m["bucket"] == bucket_a]
    b = [m for m in matches if m["bucket"] == bucket_b]
    point = (sum(m["residual"] for m in a) / len(a)) - (
        sum(m["residual"] for m in b) / len(b)
    )

    # Stratify both sets by year
    by_year_a: dict[int, list[dict]] = defaultdict(list)
    by_year_b: dict[int, list[dict]] = defaultdict(list)
    for m in a:
        by_year_a[m["year"]].append(m)
    for m in b:
        by_year_b[m["year"]].append(m)

    deltas = []
    for _ in range(n_iters):
        sum_a = cnt_a = 0.0
        sum_b = cnt_b = 0.0
        for yr_items in by_year_a.values():
            sample = [yr_items[rng.randrange(len(yr_items))] for _ in range(len(yr_items))]
            sum_a += sum(m["residual"] for m in sample)
            cnt_a += len(sample)
        for yr_items in by_year_b.values():
            sample = [yr_items[rng.randrange(len(yr_items))] for _ in range(len(yr_items))]
            sum_b += sum(m["residual"] for m in sample)
            cnt_b += len(sample)
        deltas.append(sum_a / cnt_a - sum_b / cnt_b)
    deltas.sort()
    lo = deltas[int(0.025 * n_iters)]
    hi = deltas[int(0.975 * n_iters)]
    excludes_zero = lo > 0 or hi < 0
    return {"point": point, "ci_lo": lo, "ci_hi": hi, "excludes_zero": excludes_zero}


# ── Per-bucket metrics ────────────────────────────────────────────────────


def bucket_metrics(matches: list[dict], label: str) -> dict[str, dict]:
    res = residuals(matches)
    out: dict[str, dict] = {}
    for b in ("wet", "dry", "other", "unknown"):
        ms = [m for m in res if m["bucket"] == b]
        if not ms:
            continue
        dec = [m for m in ms if m["actualMargin"] != 0]
        tips = sum(1 for m in dec if tip_ok(m["winProbability"]["home"], m["actualMargin"]) is True)
        close = [m for m in ms if abs(m["predictedMargin"]) < CLOSE]
        close_dec = [m for m in close if m["actualMargin"] != 0]
        close_tips = sum(
            1 for m in close_dec if tip_ok(m["winProbability"]["home"], m["actualMargin"]) is True
        )
        mean_resid = sum(m["residual"] for m in ms) / len(ms)
        out[b] = {
            "n": len(ms),
            "n_dec": len(dec),
            "tips": tips,
            "tip_pct": tips / len(dec) if dec else float("nan"),
            "mean_resid": mean_resid,
            "close_n": len(close_dec),
            "close_tips": close_tips,
            "close_tip_pct": close_tips / len(close_dec) if close_dec else float("nan"),
        }
    return out


def print_bucket_table(bm: dict[str, dict], window: str) -> None:
    print(f"\n  {window}")
    print(
        f"  {'bucket':<10}{'n':>6}{'n_dec':>7}{'tips':>7}{'tip%':>8}"
        f"{'resid':>8}{'cl_n':>7}{'cl_tip%':>9}"
    )
    for b in ("wet", "dry", "other", "unknown"):
        r = bm.get(b)
        if r is None:
            continue
        print(
            f"  {b:<10}{r['n']:>6}{r['n_dec']:>7}{r['tips']:>7}{r['tip_pct']:>7.1%}"
            f"{r['mean_resid']:>+8.2f}{r['close_n']:>7}{r['close_tip_pct']:>8.1%}"
        )


# ── Main analysis ─────────────────────────────────────────────────────────

print("\n=== Per-bucket metrics ===")
primary_bm = bucket_metrics(primary, "primary")
early_bm = bucket_metrics(early, "early")
print_bucket_table(primary_bm, "primary 2021-25")
print_bucket_table(early_bm, "early 2016-19")

# ── Bootstrap CI on wet−dry residual difference ───────────────────────────

print("\n=== Bootstrap CI: wet − dry mean residual (2000 iters, seed=42) ===")
primary_ci = bootstrap_residual_ci(residuals(primary), "wet", "dry")
early_ci = bootstrap_residual_ci(residuals(early), "wet", "dry")

print(
    f"  primary 2021-25:  Δresid {primary_ci['point']:+.2f}  "
    f"CI95 [{primary_ci['ci_lo']:+.2f}, {primary_ci['ci_hi']:+.2f}]  "
    f"excludes_zero={primary_ci['excludes_zero']}"
)
print(
    f"  early 2016-19:    Δresid {early_ci['point']:+.2f}  "
    f"CI95 [{early_ci['ci_lo']:+.2f}, {early_ci['ci_hi']:+.2f}]  "
    f"excludes_zero={early_ci['excludes_zero']}"
)

# ── Extreme-temp secondary cut ────────────────────────────────────────────

print("\n=== Secondary cut: extreme_temp (top/bottom 5% by year) ===")
for label, matches in [("primary 2021-25", primary), ("early 2016-19", early)]:
    ext = [m for m in residuals(matches) if m.get("extreme_temp")]
    norm = [m for m in residuals(matches) if not m.get("extreme_temp")]
    ext_dec = [m for m in ext if m["actualMargin"] != 0]
    norm_dec = [m for m in norm if m["actualMargin"] != 0]
    ext_tips = sum(
        1 for m in ext_dec if tip_ok(m["winProbability"]["home"], m["actualMargin"]) is True
    )
    norm_tips = sum(
        1 for m in norm_dec if tip_ok(m["winProbability"]["home"], m["actualMargin"]) is True
    )
    ext_resid = sum(m["residual"] for m in ext) / len(ext) if ext else float("nan")
    norm_resid = sum(m["residual"] for m in norm) / len(norm) if norm else float("nan")
    print(
        f"  {label}: extreme n={len(ext)} tip%={ext_tips/len(ext_dec):.1%} "
        f"resid={ext_resid:+.2f}  |  normal n={len(norm)} "
        f"tip%={norm_tips/len(norm_dec):.1%} resid={norm_resid:+.2f}"
    )

# ── Verdict evaluation ────────────────────────────────────────────────────

print("\n=== Pre-registered bar evaluation ===")

# Criterion (a): residual CI excludes zero AND replicates direction
crit_a_primary = primary_ci["excludes_zero"]
crit_a_direction_match = (primary_ci["point"] >= 0) == (early_ci["point"] >= 0)
crit_a = crit_a_primary and crit_a_direction_match

# Criterion (b): close-band tip% differs by ≥ 3pp with n ≥ 50 each, replicates
p_wet = primary_bm.get("wet", {})
p_dry = primary_bm.get("dry", {})
crit_b_diff = abs(p_wet.get("close_tip_pct", 0) - p_dry.get("close_tip_pct", 0))
crit_b_n_ok = p_wet.get("close_n", 0) >= 50 and p_dry.get("close_n", 0) >= 50
crit_b_primary = crit_b_diff >= 0.03 and crit_b_n_ok

e_wet = early_bm.get("wet", {})
e_dry = early_bm.get("dry", {})
# Direction: same sign (wet better/worse than dry) in both windows
p_wet_better = p_wet.get("close_tip_pct", 0) > p_dry.get("close_tip_pct", 0)
e_wet_better = e_wet.get("close_tip_pct", 0) > e_dry.get("close_tip_pct", 0)
crit_b_replicates = p_wet_better == e_wet_better
# Replication guard: need ≥ 20 each in early window
early_n_sufficient = e_wet.get("close_n", 0) >= 20 and e_dry.get("close_n", 0) >= 20

crit_b = crit_b_primary and crit_b_replicates and early_n_sufficient

print(f"  Criterion (a) — residual CI excludes zero (primary): {crit_a_primary}")
print(
    f"    primary Δresid wet-dry = {primary_ci['point']:+.2f}  "
    f"CI [{primary_ci['ci_lo']:+.2f}, {primary_ci['ci_hi']:+.2f}]"
)
print(f"    early   Δresid wet-dry = {early_ci['point']:+.2f}  direction match = {crit_a_direction_match}")
print(f"    Criterion (a) GO = {crit_a}")

print(f"\n  Criterion (b) — close-band tip% diff ≥ 3pp with n ≥ 50 each (primary):")
print(
    f"    wet close n={p_wet.get('close_n',0)} tip%={p_wet.get('close_tip_pct',float('nan')):.1%}  "
    f"dry close n={p_dry.get('close_n',0)} tip%={p_dry.get('close_tip_pct',float('nan')):.1%}"
)
print(f"    |diff| = {crit_b_diff:.1%}  n_ok={crit_b_n_ok}  primary criterion = {crit_b_primary}")
print(
    f"    early wet close n={e_wet.get('close_n',0)} tip%={e_wet.get('close_tip_pct',float('nan')):.1%}  "
    f"dry n={e_dry.get('close_n',0)} tip%={e_dry.get('close_tip_pct',float('nan')):.1%}"
)
print(
    f"    early n_sufficient={early_n_sufficient}  direction_replicates={crit_b_replicates}"
)
print(f"    Criterion (b) GO = {crit_b}")

# Final verdict
if crit_a or crit_b:
    verdict = "GO"
elif crit_b_primary and not early_n_sufficient:
    verdict = "INCONCLUSIVE"
else:
    verdict = "NO-GO"

print(f"\nWEATHER SPIKE VERDICT: {verdict}")
if verdict == "GO":
    if crit_a:
        print(
            f"  Signal: wet games shift v3 mean residual by {primary_ci['point']:+.2f} pts "
            f"(CI excludes zero). Suggests systematic prediction bias under wet conditions. "
            f"Follow-up: engine plan to add weather-conditional bias correction."
        )
    if crit_b:
        print(
            f"  Signal: wet/dry close-band tip% differs by {crit_b_diff:.1%}. "
            f"Suggests weather affects margin-sign calls in the comp-relevant band."
        )
elif verdict == "INCONCLUSIVE":
    print("  Early window has insufficient close-band sample for replication check.")
else:
    print(
        f"  Effect sizes: primary Δresid={primary_ci['point']:+.2f} pts "
        f"(CI [{primary_ci['ci_lo']:+.2f},{primary_ci['ci_hi']:+.2f}], includes zero); "
        f"close-band diff={crit_b_diff:.1%} "
        f"({'< 3pp threshold' if crit_b_diff < 0.03 else 'met threshold but n<50 or no replicate'})."
    )
    print("  Weather joins the documented-negatives list.")
