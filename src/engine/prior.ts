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
