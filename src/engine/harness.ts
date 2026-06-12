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
import { calibratePav, computeTeamRating, type TeamPavSums } from "./blend.js";
import { applyRegression, type EloHistory, type EloState, getRating, updateElo } from "./elo.js";
import {
  createTeamOffsetState,
  decayTeamOffsets,
  getTeamOffset,
  type TeamOffsetState,
  updateTeamOffsets,
} from "./offset.js";
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
 * Index each team's first match of each season.
 *
 * Matches must already be in chronological order, so the first occurrence
 * of a team within a season is its first fixture.
 */
function indexFirstMatchByTeam(matches: MatchRow[]): Map<number, Map<number, number>> {
  const bySeason = new Map<number, Map<number, number>>();
  for (const match of matches) {
    let teams = bySeason.get(match.season_id);
    if (!teams) {
      teams = new Map();
      bySeason.set(match.season_id, teams);
    }
    if (!teams.has(match.home_team_id)) teams.set(match.home_team_id, match.id);
    if (!teams.has(match.away_team_id)) teams.set(match.away_team_id, match.id);
  }
  return bySeason;
}

/**
 * Build per-team season-boundary regression targets from prior-season PAV.
 *
 * For each team entering the season, sums prior-season PAV over the team's
 * first named lineup (the same list-quality signal the R1 prior blend uses),
 * calibrates it onto the Elo scale, and mean-centres across teams:
 *
 *   target = 1500 + w × (pav_implied − mean(pav_implied))
 *
 * Returns undefined (regress to 1500) when the feature is off or no team has
 * lineup data. Teams without a computable target regress to 1500.
 */
export function buildRegressionTargets(
  seasonId: number,
  firstMatchByTeam: Map<number, Map<number, number>>,
  lineupsByMatch: Map<number, MatchLineupRow[]>,
  priorPavMap: PriorPavMap,
  config: Config,
): Map<number, number> | undefined {
  const weight = config.elo.regression_pav_target_weight;
  if (weight === undefined) return undefined;

  const teamFirstMatch = firstMatchByTeam.get(seasonId);
  if (!teamFirstMatch) return undefined;

  const defaultPav = config.pav.missing_player_default;
  const pavRatings = new Map<number, number>();

  for (const [teamId, matchId] of teamFirstMatch) {
    const lineup = filterLineup(lineupsByMatch.get(matchId) ?? [], teamId, config.pav.include);
    if (lineup.length === 0) continue;

    let off = 0;
    let mid = 0;
    let def = 0;
    for (const player of lineup) {
      const prior = priorPavMap.get(player.player_id);
      if (prior) {
        off += prior.offPav;
        mid += prior.midPav;
        def += prior.defPav;
      } else {
        off += defaultPav / 3;
        mid += defaultPav / 3;
        def += defaultPav / 3;
      }
    }
    pavRatings.set(teamId, calibratePav({ off, mid, def, total: off + mid + def }, config.blend));
  }

  if (pavRatings.size === 0) return undefined;

  let sum = 0;
  for (const rating of pavRatings.values()) sum += rating;
  const mean = sum / pavRatings.size;

  const targets = new Map<number, number>();
  for (const [teamId, rating] of pavRatings) {
    targets.set(teamId, 1500 + weight * (rating - mean));
  }
  return targets;
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
  const firstMatchByTeam = indexFirstMatchByTeam(data.matches);

  let currentSeasonId: number | null = null;
  // Placeholder — replaced at the first season boundary below.
  let pavState: PavSeasonState = createPavSeasonState(0);
  let priorPavMap: PriorPavMap = new Map();
  let priorLeague: LeagueAccumulator | null = null;
  const offsetConfig = config.output.team_offset;
  const offsetState: TeamOffsetState = createTeamOffsetState();

  for (const match of data.matches) {
    // Season boundary detection
    if (match.season_id !== currentSeasonId) {
      const isFirstSeason = currentSeasonId === null;
      if (!isFirstSeason) {
        // Save league averages from completed season for R1 prior
        priorLeague = getLeagueAccumulator(pavState);
        if (offsetConfig) {
          decayTeamOffsets(offsetState, offsetConfig.season_carry);
        }
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

      // Apply Elo regression at season boundary (after the prior PAV map
      // rebuild so PAV-implied targets use the season entering, not the old)
      if (!isFirstSeason) {
        const targets = buildRegressionTargets(
          match.season_id,
          firstMatchByTeam,
          data.lineupsByMatch,
          priorPavMap,
          config,
        );
        applyRegression(eloState, config.elo.regression_to_mean, targets);
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

    // For test seasons, generate predictions before updating state. With
    // team offsets enabled, non-train seasons also generate (unrecorded)
    // predictions so the offset state can learn from their residuals.
    if ((isTest || (offsetConfig && !isTrain)) && isCompleted) {
      const marginAdjust = offsetConfig
        ? getTeamOffset(offsetState, match.home_team_id, offsetConfig.k) -
          getTeamOffset(offsetState, match.away_team_id, offsetConfig.k)
        : 0;
      const prediction = generatePrediction(
        match,
        eloState,
        pavState,
        priorPavMap,
        config,
        data,
        marginAdjust,
      );
      if (isTest) {
        if (prediction) {
          predictions.push(prediction);
        } else {
          skippedMatches.push(match.id);
        }
      }
      if (offsetConfig && prediction && prediction.actualMargin !== undefined) {
        updateTeamOffsets(
          offsetState,
          match.home_team_id,
          match.away_team_id,
          prediction.actualMargin - prediction.predictedMargin,
        );
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
  const firstMatchByTeam = indexFirstMatchByTeam(data.matches);

  let currentSeasonId: number | null = null;
  // Placeholder — replaced at the first season boundary below.
  let pavState: PavSeasonState = createPavSeasonState(0);
  let priorPavMap: PriorPavMap = new Map();
  let priorLeague: LeagueAccumulator | null = null;
  const offsetConfig = config.output.team_offset;
  const offsetState: TeamOffsetState = createTeamOffsetState();

  for (const match of data.matches) {
    // Season boundary detection
    if (match.season_id !== currentSeasonId) {
      const isFirstSeason = currentSeasonId === null;
      if (!isFirstSeason) {
        priorLeague = getLeagueAccumulator(pavState);
        if (offsetConfig) {
          decayTeamOffsets(offsetState, offsetConfig.season_carry);
        }
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

      if (!isFirstSeason) {
        const targets = buildRegressionTargets(
          match.season_id,
          firstMatchByTeam,
          data.lineupsByMatch,
          priorPavMap,
          config,
        );
        applyRegression(eloState, config.elo.regression_to_mean, targets);
      }

      if (priorLeague) {
        pavState = createPavSeasonStateWithPriorLeague(numTeams, priorLeague);
      } else {
        pavState = createPavSeasonState(numTeams);
      }
    }

    const isCompleted = match.home_points !== null && match.away_points !== null;
    const isTargetRound = match.season_id === targetSeasonId && match.round_number === targetRound;

    const marginAdjust = offsetConfig
      ? getTeamOffset(offsetState, match.home_team_id, offsetConfig.k) -
        getTeamOffset(offsetState, match.away_team_id, offsetConfig.k)
      : 0;

    if (isTargetRound && !isCompleted) {
      // This is an unplayed match in the target round — predict it
      const prediction = generatePrediction(
        match,
        eloState,
        pavState,
        priorPavMap,
        config,
        data,
        marginAdjust,
      );
      if (prediction) {
        predictions.push(prediction);
      } else {
        skippedMatches.push(match.id);
      }
    } else if (isCompleted) {
      // Completed match (could be earlier in the target round) — update state.
      // With team offsets enabled, every completed match contributes a
      // (possibly unrecorded) prediction so offset state stays warm — the
      // same rule the backtest harness uses for non-train seasons.
      if (isTargetRound || offsetConfig) {
        const prediction = generatePrediction(
          match,
          eloState,
          pavState,
          priorPavMap,
          config,
          data,
          marginAdjust,
        );
        if (isTargetRound && prediction) {
          predictions.push(prediction);
        }
        if (offsetConfig && prediction && prediction.actualMargin !== undefined) {
          updateTeamOffsets(
            offsetState,
            match.home_team_id,
            match.away_team_id,
            prediction.actualMargin - prediction.predictedMargin,
          );
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
  marginAdjust = 0,
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

  // Home advantage at prediction time, in rating points (0 when unset);
  // marginAdjust carries the team-offset term in margin points.
  const predictionHa = config.output.prediction_home_advantage ?? 0;
  const margin =
    predictMargin(homeTeamRating + predictionHa, awayTeamRating, config.output) + marginAdjust;
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
