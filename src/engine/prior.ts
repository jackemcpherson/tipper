/**
 * Bayesian prior blending for PAV cold-start.
 *
 * Blends prior-season final PAV with current-season cumulative PAV.
 * Both values must be in the same units (season-end equivalent PAV)
 * for the weighted average to be meaningful — the fixed PAV pool
 * in pav.ts ensures this.
 */

import type { Config } from "../config/schema.js";
import type { PlayerSeasonPavRow } from "../data/types.js";
import type { PlayerPav } from "./pav.js";

/** Prior PAV lookup: player_id → prior season PAV values. */
export type PriorPavMap = Map<
  number,
  { offPav: number; midPav: number; defPav: number; totalPav: number }
>;

/**
 * Within-player PAV transition ratios fitted on AFLM 1998-2014 (DOB-coverage-complete,
 * no test-window leakage). Indexed by player's age at R1 of the SEASON being predicted;
 * value is the expected ratio of next-season PAV to current-season PAV for a player
 * who was that age at last year's R1. Cross-sectional age curves are confounded by
 * survivor bias at the tails (only Hall-of-Famers play at 35+) — this within-player
 * ratio controls for it. Fit query: see analysis/age-curve-fit-1998-2014.sql.
 * Both seasons in the pair required `total_pav > 3` (≥ ~half a season of play) to
 * filter out players who barely played either side of the transition.
 */
const AGE_TRANSITION_RATIO: ReadonlyMap<number, number> = new Map([
  // n=17–582 per cell — high-power range
  [18, 1.524],
  [19, 1.524],
  [20, 1.394],
  [21, 1.336],
  [22, 1.251],
  [23, 1.146],
  [24, 1.091],
  [25, 1.094],
  [26, 1.034],
  [27, 1.018],
  // n=309–369 — high-power crossover
  [28, 0.994],
  [29, 0.984],
  [30, 0.956],
  [31, 0.951],
  // n=20–161 — declining power, smoothed
  [32, 0.92],
  [33, 0.91],
  // 34+ falls back to RATIO_VERY_OLD; the raw data (n ≤ 8) is too noisy to trust
  // (34→35 was 0.821, 35→36 was 0.901, 36→37 was 0.904 — straddling each other,
  // typical small-sample bounce) so we extrapolate the trend instead.
]);

const RATIO_VERY_YOUNG = 1.524;
const RATIO_VERY_OLD = 0.85;

/**
 * Expected PAV(this season) / PAV(last season) for a player whose age at R1 of THIS
 * season is `currentAge`. Returns 1 for unknown ages outside the fitted range.
 */
export function getAgeTransitionRatio(currentAge: number): number {
  const ratio = AGE_TRANSITION_RATIO.get(currentAge);
  if (ratio !== undefined) return ratio;
  return currentAge < 18 ? RATIO_VERY_YOUNG : RATIO_VERY_OLD;
}

/**
 * Compute integer age in completed years at a target date, given an ISO YYYY-MM-DD DOB.
 *
 * Uses calendar arithmetic (year diff with month/day correction) instead of
 * milliseconds ÷ 365.25 — the latter under-counts whole-year intervals across leap
 * years (e.g. 2000-12-31 → 2026-12-31 is 26 calendar years but only 25.998 × 365.25
 * days, so floor() returns 25). Both inputs are YYYY-MM-DD strings; slice() handles
 * a trailing timestamp suffix on the target.
 */
export function ageAtDate(dobIso: string, targetIso: string): number {
  const [dy, dm, dd] = dobIso.slice(0, 10).split("-").map(Number);
  const [ty, tm, td] = targetIso.slice(0, 10).split("-").map(Number);
  if (
    dy === undefined ||
    dm === undefined ||
    dd === undefined ||
    ty === undefined ||
    tm === undefined ||
    td === undefined
  ) {
    throw new Error(`Invalid ISO date: dob=${dobIso} target=${targetIso}`);
  }
  let age = ty - dy;
  if (tm < dm || (tm === dm && td < dd)) age -= 1;
  return age;
}

/**
 * Apply the age-curve adjustment to a prior PAV map (Task 37).
 *
 * Each player's prior-season PAV is multiplied by `(1 − w + w × ratio(age))`, where
 * `age` is the player's age at R1 of the SEASON being predicted and `ratio` is the
 * within-player AFLM 1998-2014 transition factor. Players with unknown DOB pass
 * through unchanged. Returns a new map (input is not mutated).
 *
 * `weight = 0` is a no-op (bit-identical to the un-adjusted prior). `weight = 1`
 * applies the full empirical curve.
 */
export function applyAgeCurve(
  priorMap: PriorPavMap,
  dobByPlayer: Map<number, string | null>,
  currentR1DateIso: string,
  weight: number,
): PriorPavMap {
  if (weight === 0) return priorMap;
  const adjusted: PriorPavMap = new Map();
  for (const [playerId, pav] of priorMap) {
    const dob = dobByPlayer.get(playerId);
    if (!dob) {
      adjusted.set(playerId, pav);
      continue;
    }
    const age = ageAtDate(dob, currentR1DateIso);
    const ratio = getAgeTransitionRatio(age);
    const multiplier = 1 - weight + weight * ratio;
    adjusted.set(playerId, {
      offPav: pav.offPav * multiplier,
      midPav: pav.midPav * multiplier,
      defPav: pav.defPav * multiplier,
      totalPav: pav.totalPav * multiplier,
    });
  }
  return adjusted;
}

/**
 * Build a prior PAV map from player_season_pav rows.
 */
export function buildPriorPavMap(rows: PlayerSeasonPavRow[]): PriorPavMap {
  const map: PriorPavMap = new Map();
  for (const row of rows) {
    map.set(row.player_id, {
      offPav: row.off_pav ?? 0,
      midPav: row.mid_pav ?? 0,
      defPav: row.def_pav ?? 0,
      totalPav: row.total_pav ?? 0,
    });
  }
  return map;
}

/**
 * Apply Bayesian prior blending to a player's current PAV.
 *
 * Formula:
 *   weighted = (K × prior + games × current) / (K + games)
 *
 * Where:
 * - K is pav.prior_weight_k (games-of-evidence equivalence for the prior)
 * - games is the number of games the team has played this season
 * - prior is the player's season-end PAV from the previous season
 * - current is the player's cumulative PAV in the current season
 *   (already in season-end equivalent units due to fixed pool)
 *
 * @param currentPav - Player's current season PAV (from computePlayerPav).
 * @param priorPav - Player's prior season PAV (from player_season_pav table).
 * @param gamesPlayed - Number of games the player's team has played this season.
 * @param pavConfig - PAV section of the config.
 * @returns Blended PAV values.
 */
export function blendWithPrior(
  currentPav: PlayerPav,
  priorPav: { offPav: number; midPav: number; defPav: number; totalPav: number } | undefined,
  gamesPlayed: number,
  pavConfig: Config["pav"],
): PlayerPav {
  const k = pavConfig.prior_weight_k;
  const defaultPav = pavConfig.missing_player_default;

  const prior = priorPav ?? {
    offPav: defaultPav / 3,
    midPav: defaultPav / 3,
    defPav: defaultPav / 3,
    totalPav: defaultPav,
  };

  const denominator = k + gamesPlayed;
  if (denominator === 0) {
    return { ...prior };
  }

  const offPav = (k * prior.offPav + gamesPlayed * currentPav.offPav) / denominator;
  const midPav = (k * prior.midPav + gamesPlayed * currentPav.midPav) / denominator;
  const defPav = (k * prior.defPav + gamesPlayed * currentPav.defPav) / denominator;

  return {
    offPav,
    midPav,
    defPav,
    totalPav: offPav + midPav + defPav,
  };
}
