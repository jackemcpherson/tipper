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

/** Per-team rolling window of recent rating changes for contextual K. */
export type EloHistory = Map<number, number[]>;

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
 * Compute contextual K-factor for a team.
 *
 * K increases when a team's rating is moving rapidly (active decline or
 * ascent), allowing faster adaptation. Falls back to baseK when history
 * is empty or sensitivity is 0.
 */
export function computeContextualK(
  baseK: number,
  history: EloHistory,
  teamId: number,
  sensitivity: number,
  window: number,
): number {
  if (sensitivity === 0) return baseK;
  const changes = history.get(teamId);
  if (changes === undefined || changes.length === 0) return baseK;
  const recent = changes.slice(-window);
  const velocity = recent.reduce((sum, c) => sum + c, 0) / recent.length;
  return baseK * (1 + sensitivity * Math.abs(velocity));
}

/**
 * Resolve venue-specific home advantage.
 *
 * Returns per-venue HA when configured, falling back to the static value
 * for unknown venues or when using static mode.
 */
export function resolveHomeAdvantage(eloConfig: Config["elo"], venueId: number): number {
  if (eloConfig.home_advantage_source === "per_venue" && eloConfig.venue_ha !== undefined) {
    return eloConfig.venue_ha[venueId.toString()] ?? eloConfig.home_advantage;
  }
  return eloConfig.home_advantage;
}

/**
 * League-average points per scoring shot, AFLM 2015–2025 (range 3.60–3.67
 * across all eleven seasons — stable enough for a constant).
 */
export const LEAGUE_POINTS_PER_SHOT = 3.64;

/**
 * Margin used for the Elo update: actual margin blended with the
 * scoring-shot-implied margin (conversion luck removed) when
 * shot_margin_weight is set. Falls back to the actual margin when shot
 * counts are missing. The blended margin drives result sign and MOV
 * magnitude alike, so a team that out-shoots but loses can gain rating.
 */
export function computeUpdateMargin(match: MatchRow, eloConfig: Config["elo"]): number {
  if (match.home_points === null || match.away_points === null) {
    throw new Error(`Cannot compute update margin for match ${match.id}: missing scores`);
  }
  const actual = match.home_points - match.away_points;
  const w = eloConfig.shot_margin_weight ?? 0;
  if (
    w === 0 ||
    match.home_goals === null ||
    match.home_behinds === null ||
    match.away_goals === null ||
    match.away_behinds === null
  ) {
    return actual;
  }
  const shotDiff = match.home_goals + match.home_behinds - (match.away_goals + match.away_behinds);
  return (1 - w) * actual + w * shotDiff * LEAGUE_POINTS_PER_SHOT;
}

/**
 * Update Elo state after a completed match.
 *
 * Mutates the state map (and optionally history) in place for efficiency
 * during walk-forward.
 *
 * @param state - Current Elo state (mutated).
 * @param match - Completed match with scores.
 * @param eloConfig - Elo section of the config.
 * @param history - Optional rating change history for contextual K (mutated).
 * @returns Update details for diagnostics.
 */
export function updateElo(
  state: EloState,
  match: MatchRow,
  eloConfig: Config["elo"],
  history?: EloHistory,
): EloUpdate {
  if (match.home_points === null || match.away_points === null) {
    throw new Error(`Cannot update Elo for match ${match.id}: missing scores`);
  }

  const homeRating = getRating(state, match.home_team_id, eloConfig.initial_rating);
  const awayRating = getRating(state, match.away_team_id, eloConfig.initial_rating);

  const ha = resolveHomeAdvantage(eloConfig, match.venue_id);
  const homeExpected = computeExpected(homeRating, awayRating, ha);

  const margin = computeUpdateMargin(match, eloConfig);
  const homeActual = margin > 0 ? 1 : margin < 0 ? 0 : 0.5;

  // MOV multiplier uses raw Elo diff: winner minus loser
  const winnerRating = margin >= 0 ? homeRating : awayRating;
  const loserRating = margin >= 0 ? awayRating : homeRating;
  const ratingDiffForMov = winnerRating - loserRating;

  const movMultiplier =
    eloConfig.mov_multiplier === "538_log"
      ? computeMovMultiplier(Math.abs(margin), ratingDiffForMov)
      : computeNoMovMultiplier();

  // Contextual K: per-team K based on recent rating velocity
  let homeK = eloConfig.k;
  let awayK = eloConfig.k;
  if (history !== undefined && eloConfig.k_context_sensitivity > 0) {
    homeK = computeContextualK(
      eloConfig.k,
      history,
      match.home_team_id,
      eloConfig.k_context_sensitivity,
      eloConfig.k_context_window,
    );
    awayK = computeContextualK(
      eloConfig.k,
      history,
      match.away_team_id,
      eloConfig.k_context_sensitivity,
      eloConfig.k_context_window,
    );
  }

  const homeChange = homeK * movMultiplier * (homeActual - homeExpected);
  const awayChange = awayK * movMultiplier * (1 - homeActual - (1 - homeExpected));

  const homeNewRating = homeRating + homeChange;
  const awayNewRating = awayRating + awayChange;

  state.set(match.home_team_id, homeNewRating);
  state.set(match.away_team_id, awayNewRating);

  // Update history with rating changes
  if (history !== undefined) {
    pushHistory(history, match.home_team_id, homeChange, eloConfig.k_context_window);
    pushHistory(history, match.away_team_id, awayChange, eloConfig.k_context_window);
  }

  return {
    homeRating,
    awayRating,
    homeNewRating,
    awayNewRating,
    homeExpected,
    movMultiplier,
  };
}

function pushHistory(history: EloHistory, teamId: number, change: number, window: number): void {
  const existing = history.get(teamId);
  if (existing !== undefined) {
    existing.push(change);
    if (existing.length > window) {
      existing.splice(0, existing.length - window);
    }
  } else {
    history.set(teamId, [change]);
  }
}

/**
 * Apply off-season regression for all teams.
 *
 * Called at season boundaries (when season_id changes). Each team regresses
 * toward its entry in `targets` when provided, otherwise toward 1500.
 *
 * @param state - Current Elo state (mutated).
 * @param regressionFactor - Fraction to regress toward the target.
 * @param targets - Optional per-team regression targets (team_id → rating).
 */
export function applyRegression(
  state: EloState,
  regressionFactor: number,
  targets?: Map<number, number>,
): void {
  const mean = 1500;
  for (const [teamId, rating] of state) {
    const target = targets?.get(teamId) ?? mean;
    state.set(teamId, rating + regressionFactor * (target - rating));
  }
}
