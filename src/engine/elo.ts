/**
 * MOV-Elo rating system.
 *
 * Pure functions: (state, match, config) → new state.
 * Uses raw Elo difference for MOV multiplier — PAV never enters.
 * See plan Q26 for the unit-consistency reasoning.
 */

import type { Config } from "../config/schema.js";
import type { MatchRow } from "../data/types.js";

/** Elo state: team_id → rating. */
export type EloState = Map<number, number>;

interface EloUpdate {
  homeRating: number;
  awayRating: number;
  homeNewRating: number;
  awayNewRating: number;
  homeExpected: number;
  movMultiplier: number;
}

/**
 * Get a team's current rating, defaulting to initial_rating for unknown teams.
 */
export function getRating(state: EloState, teamId: number, initialRating: number): number {
  return state.get(teamId) ?? initialRating;
}

/**
 * Compute expected score for home team.
 *
 * @param homeRating - Home team's current Elo.
 * @param awayRating - Away team's current Elo.
 * @param homeAdvantage - Elo points of home advantage.
 * @returns Expected score ∈ (0, 1).
 */
export function computeExpected(
  homeRating: number,
  awayRating: number,
  homeAdvantage: number,
): number {
  return 1 / (1 + 10 ** ((awayRating - homeRating - homeAdvantage) / 400));
}

/**
 * Compute the 538-style MOV multiplier.
 *
 * Dampens the Elo update for blowouts by strong favourites to prevent
 * autocorrelation in rating changes.
 *
 * @param margin - Absolute margin of victory (positive).
 * @param ratingDiff - Winner's rating minus loser's rating.
 * @returns Multiplier ≥ 0.
 * @throws If the result is non-finite (guards against degenerate inputs).
 */
export function computeMovMultiplier(margin: number, ratingDiff: number): number {
  const multiplier = (Math.log(Math.abs(margin) + 1) * 2.2) / (ratingDiff * 0.001 + 2.2);

  if (!Number.isFinite(multiplier)) {
    throw new Error(
      `MOV multiplier produced non-finite value. margin=${margin}, ratingDiff=${ratingDiff}`,
    );
  }

  return multiplier;
}

/**
 * Compute the "none" MOV multiplier (always 1.0).
 */
export function computeNoMovMultiplier(): number {
  return 1.0;
}

/**
 * Update Elo state after a completed match.
 *
 * Mutates the state map in place for efficiency during walk-forward.
 *
 * @param state - Current Elo state (mutated).
 * @param match - Completed match with scores.
 * @param eloConfig - Elo section of the config.
 * @returns Update details for diagnostics.
 */
export function updateElo(state: EloState, match: MatchRow, eloConfig: Config["elo"]): EloUpdate {
  if (match.home_points === null || match.away_points === null) {
    throw new Error(`Cannot update Elo for match ${match.id}: missing scores`);
  }

  const homeRating = getRating(state, match.home_team_id, eloConfig.initial_rating);
  const awayRating = getRating(state, match.away_team_id, eloConfig.initial_rating);

  const homeExpected = computeExpected(homeRating, awayRating, eloConfig.home_advantage);

  const margin = match.home_points - match.away_points;
  const homeActual = margin > 0 ? 1 : margin < 0 ? 0 : 0.5;

  // MOV multiplier uses raw Elo diff: winner minus loser
  const winnerRating = margin >= 0 ? homeRating : awayRating;
  const loserRating = margin >= 0 ? awayRating : homeRating;
  const ratingDiffForMov = winnerRating - loserRating;

  const movMultiplier =
    eloConfig.mov_multiplier === "538_log"
      ? computeMovMultiplier(Math.abs(margin), ratingDiffForMov)
      : computeNoMovMultiplier();

  const homeNewRating = homeRating + eloConfig.k * movMultiplier * (homeActual - homeExpected);
  const awayNewRating =
    awayRating + eloConfig.k * movMultiplier * (1 - homeActual - (1 - homeExpected));

  state.set(match.home_team_id, homeNewRating);
  state.set(match.away_team_id, awayNewRating);

  return {
    homeRating,
    awayRating,
    homeNewRating,
    awayNewRating,
    homeExpected,
    movMultiplier,
  };
}

/**
 * Apply off-season regression to mean for all teams.
 *
 * Called at season boundaries (when season_id changes).
 *
 * @param state - Current Elo state (mutated).
 * @param regressionFactor - Fraction to regress toward 1500.
 */
export function applyRegression(state: EloState, regressionFactor: number): void {
  const mean = 1500;
  for (const [teamId, rating] of state) {
    state.set(teamId, rating + regressionFactor * (mean - rating));
  }
}
