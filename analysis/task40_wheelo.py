"""Replicate the June panel and refit both models on the complete paired 2026 data.

Run: UV_CACHE_DIR=/tmp/tipper-task40-uv-cache uv run --no-project
     --with numpy==2.3.3 python analysis/task40_wheelo.py
"""

import csv
import json
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

import numpy as np


@dataclass(frozen=True)
class Row:
    """A matched prediction pair with a common design matrix."""

    season: int
    home: str
    away: str
    venue: str
    v3: float
    wheelo: float


def panel(rows: list[Row]) -> dict[str, object]:
    """Fit team-season differences and venue intercepts for both models."""
    teams = sorted({r.home for r in rows} | {r.away for r in rows})
    teams.remove("Collingwood")
    seasons = sorted({r.season for r in rows})
    venues = sorted({r.venue for r in rows})
    team_columns = {(year, team): i for i, (year, team) in enumerate(
        (year, team) for year in seasons for team in teams
    )}
    venue_columns = {venue: len(team_columns) + i for i, venue in enumerate(venues)}
    design = np.zeros((len(rows), len(team_columns) + len(venues)))
    for i, row in enumerate(rows):
        if row.home != "Collingwood":
            design[i, team_columns[(row.season, row.home)]] = 1
        if row.away != "Collingwood":
            design[i, team_columns[(row.season, row.away)]] = -1
        design[i, venue_columns[row.venue]] = 1
    counts = Counter(row.venue for row in rows)
    fits: dict[str, object] = {}
    for name in ("v3", "wheelo"):
        target = np.array([getattr(row, name) for row in rows])
        coefficients, _, rank, singular_values = np.linalg.lstsq(design, target, rcond=None)
        residual = target - design @ coefficients
        venue_effects = {venue: float(coefficients[col]) for venue, col in venue_columns.items()}
        anchor = venue_effects["MCG"]
        reported = [value for venue, value in venue_effects.items() if counts[venue] >= 5]
        fits[name] = {
            "n": len(rows), "rank": int(rank), "columns": design.shape[1],
            "condition_number": float(singular_values[0] / singular_values[-1]),
            "rmse": float(np.sqrt(np.mean(residual**2))),
            "r_squared": float(1 - np.var(residual) / np.var(target)),
            "venue_range_n_ge_5": max(reported) - min(reported),
            "venue_mcg_relative": {venue: value - anchor for venue, value in venue_effects.items()},
            "counts": dict(counts),
        }
    # Sanity: an exactly linear synthetic target must be reproduced by this design.
    synthetic = design @ np.arange(design.shape[1], dtype=float)
    recovered, _, _, _ = np.linalg.lstsq(design, synthetic, rcond=None)
    assert np.max(np.abs(design @ recovered - synthetic)) < 1e-8
    return fits


def canonical(name: str) -> str:
    """Align the only known team-name mismatch."""
    return "GWS Giants" if name == "Greater Western Sydney" else name


def main() -> None:
    """Write a create-only comparison, retaining the exact historical input CSV."""
    with Path("analysis/wheelo-paired-2022-2026.csv").open() as stream:
        old_rows = [Row(int(r["season"]), r["home"], r["away"], r["venue"],
                        float(r["pred_v3"]), float(r["pred_w"])) for r in csv.DictReader(stream)]
    field = {}
    for year in range(2022, 2027):
        payload = json.loads(Path(f"/tmp/tipper-task40-squiggle-{year}.json").read_text())
        for tip in payload["tips"]:
            if tip["sourceid"] != 26 or tip.get("hmargin") is None:
                continue
            key = (tip["date"][:10], canonical(tip["hteam"]), canonical(tip["ateam"]))
            assert key not in field, f"Duplicate Wheelo prediction: {key}"
            field[key] = float(tip["hmargin"])
    fresh_rows = []
    unmatched = []
    for config_id in ("t40-baseline", "t40-baseline-2026"):
        paths = list(Path(f"configs/{config_id}").glob("results-*.json"))
        assert len(paths) == 1
        predictions = json.loads(paths[0].read_text())["matches"]
        for pred in predictions:
            year = int(pred["date"][:4])
            if year < 2022:
                continue
            key = (pred["date"][:10], pred["home"], pred["away"])
            if key not in field:
                unmatched.append(key)
                continue
            fresh_rows.append(Row(year, pred["home"], pred["away"], pred["venue"],
                                  float(pred["predictedMargin"]), field[key]))
    result = {"historical_csv": panel(old_rows), "fresh_paired": panel(fresh_rows),
              "unmatched_v3": unmatched,
              "interpretation": "Descriptive venue coefficients conditional on team-season effects, not causal HA or an identified update rule."}
    with Path("analysis/task40-wheelo-results.json").open("x") as stream:
        json.dump(result, stream, indent=2)
        stream.write("\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
