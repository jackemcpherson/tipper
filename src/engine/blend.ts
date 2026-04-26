/**
 * Team rating blend: Elo + calibrated PAV.
 *
 * Combines two parallel rating signals into a single team rating
 * used for match prediction. This is the only place where Elo and
 * PAV state meet — and this function is read-only (never writes
 * back to either state machine).
 */

import type { Config } from "../config/schema.js";

/**
 * Compute the blended team rating.
 *
 * team_rating = weight_elo × elo + (1 - weight_elo) × (pav_calibration_slope × summed_pav)
 *
 * @param elo - Team's current Elo rating.
 * @param summedPav - Sum of total PAV for all players in the team's lineup.
 * @param blendConfig - Blend section of the config.
 * @returns Blended team rating.
 */
export function computeTeamRating(
  elo: number,
  summedPav: number,
  blendConfig: Config["blend"],
): number {
  const pavCalibrated = blendConfig.pav_calibration_slope * summedPav;
  return blendConfig.weight_elo * elo + (1 - blendConfig.weight_elo) * pavCalibrated;
}
