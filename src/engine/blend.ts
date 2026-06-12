/**
 * Team rating blend: Elo + calibrated PAV.
 *
 * Combines two parallel rating signals into a single team rating
 * used for match prediction. This is the only place where Elo and
 * PAV state meet — and this function is read-only (never writes
 * back to either state machine).
 */

import type { Config } from "../config/schema.js";

/** Per-zone PAV sums for a team's lineup. */
export interface TeamPavSums {
  off: number;
  mid: number;
  def: number;
  total: number;
}

/**
 * Compute the blended team rating.
 *
 * team_rating = weight_elo × elo + (1 - weight_elo) × calibrated_pav
 *
 * calibrated_pav is pav_calibration_slope × total PAV, or — when
 * blend.pav_zone_slopes is set — a per-zone weighted sum
 * (s_off×off + s_mid×mid + s_def×def). Equal per-zone slopes reproduce
 * the global slope exactly.
 *
 * @param elo - Team's current Elo rating.
 * @param pav - Per-zone PAV sums for the team's lineup.
 * @param blendConfig - Blend section of the config.
 * @returns Blended team rating.
 */
export function computeTeamRating(
  elo: number,
  pav: TeamPavSums,
  blendConfig: Config["blend"],
): number {
  return (
    blendConfig.weight_elo * elo + (1 - blendConfig.weight_elo) * calibratePav(pav, blendConfig)
  );
}

/**
 * Map PAV sums onto the Elo rating scale using the configured slope(s).
 */
export function calibratePav(pav: TeamPavSums, blendConfig: Config["blend"]): number {
  const slopes = blendConfig.pav_zone_slopes;
  return slopes
    ? slopes.off * pav.off + slopes.mid * pav.mid + slopes.def * pav.def
    : blendConfig.pav_calibration_slope * pav.total;
}
