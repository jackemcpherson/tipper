/**
 * Walk-forward backtest and prediction harness.
 *
 * Orchestrates the two parallel state machines (Elo, PAV) and the
 * read-only predictor. Processes matches in strict chronological order,
 * predict-then-update per individual match.
 *
 * This module is pure — it takes all data as arguments and never
 * touches the database.
 */

import type { Config } from "../config/schema.js";
import type {
  MatchLineupRow,
  MatchRow,
  PlayerMatchStatsRow,
  PlayerSeasonPavRow,
} from "../data/types.js";
import type { MatchPrediction } from "../types.js";
import { computeTeamRating, type TeamPavSums } from "./blend.js";
import { applyRegression, type EloHistory, type EloState, getRating, updateElo } from "./elo.js";
import {
  computePlayerPav,
  createPavSeasonState,
  createPavSeasonStateWithPriorLeague,
  getLeagueAccumulator,
  type LeagueAccumulator,
  type PavSeasonState,
  updatePavState,
} from "./pav.js";
import { computeWinProbability, predictMargin } from "./predict.js";
import { blendWithPrior, buildPriorPavMap, type PriorPavMap } from "./prior.js";

/** All data needed for a harness run, pre-fetched into memory. */
export interface HarnessData {
  matches: MatchRow[];
  lineupsByMatch: Map<number, MatchLineupRow[]>;
  statsByMatch: Map<number, PlayerMatchStatsRow[]>;
  priorPavBySeason: Map<number, PlayerSeasonPavRow[]>;
  teamNames: Map<number, string>;
  venueNames: Map<number, string>;
  seasonYearById: Map<number, number>;
}

/** Result of a harness run. */
export interface HarnessResult {
  predictions: MatchPrediction[];
  finalEloState: EloState;
  skippedMatches: number[];
}

/**
 * Count the distinct teams appearing in each season's fixture.
 *
 * Feeds PavSeasonState.numTeams from actual data instead of a hardcoded
 * 18 (which is wrong for AFLW and for pre-expansion AFLM seasons).
 */
function countTeamsBySeason(matches: MatchRow[]): Map<number, number> {
  const teamsBySeason = new Map<number, Set<number>>();
  for (const match of matches) {
    let teams = teamsBySeason.get(match.season_id);
    if (!teams) {
      teams = new Set();
      teamsBySeason.set(match.season_id, teams);
    }
    teams.add(match.home_team_id);
    teams.add(match.away_team_id);
  }
  return new Map([...teamsBySeason].map(([seasonId, teams]) => [seasonId, teams.size]));
}

/**
 * Run the walk-forward harness over historical data.
 *
 * @param data - All pre-fetched data.
 * @param config - Model configuration.
 * @param trainSeasonIds - Season IDs used for warming state (no predictions).
 * @param testSeasonIds - Season IDs where predictions are recorded.
 * @returns Predictions and final state.
 */
export function runHarness(
  data: HarnessData,
  config: Config,
  trainSeasonIds: Set<number>,
  testSeasonIds: Set<number>,
): HarnessResult {
  const eloState: EloState = new Map();
  const eloHistory: EloHistory = new Map();
  const predictions: MatchPrediction[] = [];
  const skippedMatches: number[] = [];
  const teamCountBySeason = countTeamsBySeason(data.matches);

  let currentSeasonId: number | null = null;
  // Placeholder — replaced at the first season boundary below.
  let pavState: PavSeasonState = createPavSeasonState(0);
  let priorPavMap: PriorPavMap = new Map();
  let priorLeague: LeagueAccumulator | null = null;

  for (const match of data.matches) {
    // Season boundary detection
    if (match.season_id !== currentSeasonId) {
      if (currentSeasonId !== null) {
        // Save league averages from completed season for R1 prior
        priorLeague = getLeagueAccumulator(pavState);

        // Apply Elo regression at season boundary
        applyRegression(eloState, config.elo.regression_to_mean);
      }

      currentSeasonId = match.season_id;
      const numTeams = teamCountBySeason.get(match.season_id) ?? 0;

      // Build prior PAV map from previous season
      const currentYear = data.seasonYearById.get(match.season_id);
      if (currentYear !== undefined) {
        const priorYear = currentYear - 1;
        // Find prior season's PAV data
        for (const [seasonId, rows] of data.priorPavBySeason) {
          const year = data.seasonYearById.get(seasonId);
          if (year === priorYear) {
            priorPavMap = buildPriorPavMap(rows);
            break;
          }
        }
      }

      // Reset PAV state for new season
      const isTrain = trainSeasonIds.has(match.season_id);
      if (isTrain) {
        // Train seasons: Elo-only, no PAV needed
        pavState = createPavSeasonState(numTeams);
      } else if (priorLeague) {
        pavState = createPavSeasonStateWithPriorLeague(numTeams, priorLeague);
      } else {
        pavState = createPavSeasonState(numTeams);
      }
    }

    const isTrain = trainSeasonIds.has(match.season_id);
    const isTest = testSeasonIds.has(match.season_id);
    const isCompleted = match.home_points !== null && match.away_points !== null;

    // For test seasons, generate predictions before updating state
    if (isTest && isCompleted) {
      const prediction = generatePrediction(match, eloState, pavState, priorPavMap, config, data);
      if (prediction) {
        predictions.push(prediction);
      } else {
        skippedMatches.push(match.id);
      }
    }

    // Update state from completed matches
    if (isCompleted) {
      // Opponent quality uses pre-match ratings — never this match's result
      const homeEloPre = getRating(eloState, match.home_team_id, config.elo.initial_rating);
      const awayEloPre = getRating(eloState, match.away_team_id, config.elo.initial_rating);

      // Elo always updates (train and test), history tracks for contextual K
      updateElo(eloState, match, config.elo, eloHistory);

      // PAV only updates in test seasons (train is Elo-only)
      if (!isTrain) {
        const matchStats = data.statsByMatch.get(match.id) ?? [];
        updatePavState(pavState, match, matchStats, {
          home: (awayEloPre - config.elo.initial_rating) / 400,
          away: (homeEloPre - config.elo.initial_rating) / 400,
        });
      }
    }
  }

  // Assert season_id was non-decreasing (sort invariant)
  assertNonDecreasingSeasonIds(data.matches);

  return { predictions, finalEloState: eloState, skippedMatches };
}

/**
 * Build state up to a point and generate predictions for unplayed matches.
 *
 * Used by `tipper predict` for upcoming rounds. Processes all completed
 * matches to build state, then predicts remaining unplayed matches.
 */
export function runPredict(
  data: HarnessData,
  config: Config,
  targetRound: number,
  targetSeasonId: number,
): HarnessResult {
  const eloState: EloState = new Map();
  const eloHistory: EloHistory = new Map();
  const predictions: MatchPrediction[] = [];
  const skippedMatches: number[] = [];
  const teamCountBySeason = countTeamsBySeason(data.matches);

  let currentSeasonId: number | null = null;
  // Placeholder — replaced at the first season boundary below.
  let pavState: PavSeasonState = createPavSeasonState(0);
  let priorPavMap: PriorPavMap = new Map();
  let priorLeague: LeagueAccumulator | null = null;

  for (const match of data.matches) {
    // Season boundary detection
    if (match.season_id !== currentSeasonId) {
      if (currentSeasonId !== null) {
        priorLeague = getLeagueAccumulator(pavState);
        applyRegression(eloState, config.elo.regression_to_mean);
      }

      currentSeasonId = match.season_id;
      const numTeams = teamCountBySeason.get(match.season_id) ?? 0;

      const currentYear = data.seasonYearById.get(match.season_id);
      if (currentYear !== undefined) {
        const priorYear = currentYear - 1;
        for (const [seasonId, rows] of data.priorPavBySeason) {
          const year = data.seasonYearById.get(seasonId);
          if (year === priorYear) {
            priorPavMap = buildPriorPavMap(rows);
            break;
          }
        }
      }

      if (priorLeague) {
        pavState = createPavSeasonStateWithPriorLeague(numTeams, priorLeague);
      } else {
        pavState = createPavSeasonState(numTeams);
      }
    }

    const isCompleted = match.home_points !== null && match.away_points !== null;
    const isTargetRound = match.season_id === targetSeasonId && match.round_number === targetRound;

    if (isTargetRound && !isCompleted) {
      // This is an unplayed match in the target round — predict it
      const prediction = generatePrediction(match, eloState, pavState, priorPavMap, config, data);
      if (prediction) {
        predictions.push(prediction);
      } else {
        skippedMatches.push(match.id);
      }
    } else if (isCompleted) {
      // Completed match (could be earlier in the target round) — update state
      if (isTargetRound) {
        // Predict first, then update (matches already played in this round)
        const prediction = generatePrediction(match, eloState, pavState, priorPavMap, config, data);
        if (prediction) {
          predictions.push(prediction);
        }
      }

      const homeEloPre = getRating(eloState, match.home_team_id, config.elo.initial_rating);
      const awayEloPre = getRating(eloState, match.away_team_id, config.elo.initial_rating);

      updateElo(eloState, match, config.elo, eloHistory);
      const matchStats = data.statsByMatch.get(match.id) ?? [];
      updatePavState(pavState, match, matchStats, {
        home: (awayEloPre - config.elo.initial_rating) / 400,
        away: (homeEloPre - config.elo.initial_rating) / 400,
      });
    }
  }

  return { predictions, finalEloState: eloState, skippedMatches };
}

function generatePrediction(
  match: MatchRow,
  eloState: EloState,
  pavState: PavSeasonState,
  priorPavMap: PriorPavMap,
  config: Config,
  data: HarnessData,
): MatchPrediction | null {
  const homeElo = getRating(eloState, match.home_team_id, config.elo.initial_rating);
  const awayElo = getRating(eloState, match.away_team_id, config.elo.initial_rating);

  // Compute team PAV sums from lineups
  const lineups = data.lineupsByMatch.get(match.id) ?? [];
  const homeLineup = filterLineup(lineups, match.home_team_id, config.pav.include);
  const awayLineup = filterLineup(lineups, match.away_team_id, config.pav.include);

  const homeTeamStats = pavState.teamStats.get(match.home_team_id);
  const awayTeamStats = pavState.teamStats.get(match.away_team_id);
  const homeGamesPlayed = homeTeamStats?.gamesPlayed ?? 0;
  const awayGamesPlayed = awayTeamStats?.gamesPlayed ?? 0;

  const homePav = sumTeamPav(homeLineup, pavState, priorPavMap, homeGamesPlayed, config);
  const awayPav = sumTeamPav(awayLineup, pavState, priorPavMap, awayGamesPlayed, config);

  const homeTeamRating = computeTeamRating(homeElo, homePav, config.blend);
  const awayTeamRating = computeTeamRating(awayElo, awayPav, config.blend);

  // Home advantage at prediction time, in rating points (0 when unset)
  const predictionHa = config.output.prediction_home_advantage ?? 0;
  const margin = predictMargin(homeTeamRating + predictionHa, awayTeamRating, config.output);
  const winProb = computeWinProbability(margin, config.output.sigma);

  // Predicted winner from full-precision margin, never from rounded display
  const predictedWinner = margin >= 0 ? "home" : "away";

  // Actuals (for backtest)
  let actualMargin: number | undefined;
  let actualWinner: "home" | "away" | "draw" | undefined;
  let correct: boolean | undefined;

  if (match.home_points !== null && match.away_points !== null) {
    actualMargin = match.home_points - match.away_points;
    actualWinner = actualMargin > 0 ? "home" : actualMargin < 0 ? "away" : "draw";
    // Draws excluded from tip accuracy (correct is undefined for draws)
    correct = actualWinner === "draw" ? undefined : predictedWinner === actualWinner;
  }

  return {
    matchId: match.id,
    date: match.date,
    round: match.round,
    roundNumber: match.round_number,
    home: data.teamNames.get(match.home_team_id) ?? `Team ${match.home_team_id}`,
    away: data.teamNames.get(match.away_team_id) ?? `Team ${match.away_team_id}`,
    venue: data.venueNames.get(match.venue_id) ?? `Venue ${match.venue_id}`,
    homeTeamRating,
    awayTeamRating,
    homeElo,
    awayElo,
    homePavTotal: homePav.total,
    awayPavTotal: awayPav.total,
    homePavZones: { off: homePav.off, mid: homePav.mid, def: homePav.def },
    awayPavZones: { off: awayPav.off, mid: awayPav.mid, def: awayPav.def },
    predictedMargin: margin,
    predictedWinner,
    winProbability: winProb,
    actualMargin,
    actualWinner,
    correct,
  };
}

function filterLineup(
  lineups: MatchLineupRow[],
  teamId: number,
  include: Config["pav"]["include"],
): MatchLineupRow[] {
  const teamLineups = lineups.filter((l) => l.team_id === teamId);

  switch (include) {
    case "named_lineup_excl_emerg":
      return teamLineups.filter((l) => l.is_emergency === 0);
    case "named_lineup_incl_emerg":
      return teamLineups;
    case "starting_18_only":
      return teamLineups.filter((l) => l.is_emergency === 0 && l.is_substitute === 0);
    case "actually_played":
      // Kept in the schema so old configs fail loudly instead of silently
      // behaving as named_lineup_excl_emerg (COR-13). Implementing it needs
      // a player_match_stats presence check at prediction time.
      throw new Error(
        'pav.include "actually_played" is not implemented. ' +
          'Use "named_lineup_excl_emerg" (the previous silent fallback) or another include mode.',
      );
  }
}

function sumTeamPav(
  lineup: MatchLineupRow[],
  pavState: PavSeasonState,
  priorPavMap: PriorPavMap,
  teamGamesPlayed: number,
  config: Config,
): TeamPavSums {
  let off = 0;
  let mid = 0;
  let def = 0;
  for (const player of lineup) {
    const currentPav = computePlayerPav(
      pavState,
      player.player_id,
      player.team_id,
      config.pav.opponent_adjustment_alpha ?? 0,
    );
    const blended = blendWithPrior(
      currentPav,
      priorPavMap.get(player.player_id),
      teamGamesPlayed,
      config.pav,
    );
    off += blended.offPav;
    mid += blended.midPav;
    def += blended.defPav;
  }
  return { off, mid, def, total: off + mid + def };
}

function assertNonDecreasingSeasonIds(matches: MatchRow[]): void {
  let prevSeasonId = -1;
  for (const match of matches) {
    if (match.season_id < prevSeasonId) {
      throw new Error(
        `Season ID decreased: ${prevSeasonId} → ${match.season_id} at match ${match.id}. Matches must be sorted by (season_id, date, time, id).`,
      );
    }
    prevSeasonId = match.season_id;
  }
}
