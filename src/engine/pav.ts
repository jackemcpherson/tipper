/**
 * Round-by-round PAV (Player Approximate Value) computation.
 *
 * Implements the HPN formula applied cumulatively each round.
 * Pure functions operating on in-memory data — no DB dependency.
 *
 * Architecture: the PAV computer is a parallel state machine that
 * sees only box-score stats. It knows nothing about Elo, predictions,
 * or match results beyond the box-score primitives.
 */

import type { MatchRow, PlayerMatchStatsRow } from "../data/types.js";

/**
 * Number of PAV points in each zone's pool per team for a full season.
 * Fixed at 100 per team per zone — not scaled by games played.
 * This ensures current PAV is in season-end-equivalent units,
 * required for Bayesian prior compatibility.
 */
const PAV_POOL_PER_TEAM_PER_ZONE = 100;

/** Per-team cumulative stats for team-strength computation. */
export interface TeamSeasonAccumulator {
  points: number;
  insideFifties: number;
  pointsConceded: number;
  insideFiftiesConceded: number;
  gamesPlayed: number;
  /**
   * Sum of per-match opponent quality deltas (caller-defined units, e.g.
   * (opp_elo − initial) / 400 from the harness). Drives the schedule-strength
   * adjustment in computePlayerPav. Stays 0 when no quality is supplied.
   */
  oppQualitySum: number;
}

/** Per-match opponent quality deltas for the two sides, supplied by the caller. */
export interface OpponentQuality {
  home: number;
  away: number;
}

/** League-wide cumulative averages. */
export interface LeagueAccumulator {
  totalPoints: number;
  totalInsideFifties: number;
  matchesProcessed: number;
}

/** Per-player cumulative involvement scores within a season. */
export interface PlayerInvolvementAccumulator {
  offScore: number;
  midScore: number;
  defScore: number;
}

/** Per-team cumulative involvement totals (sum across all players). */
export interface TeamInvolvementAccumulator {
  offTotal: number;
  midTotal: number;
  defTotal: number;
}

/** Full PAV state for a season. */
export interface PavSeasonState {
  teamStats: Map<number, TeamSeasonAccumulator>;
  teamInvolvement: Map<number, TeamInvolvementAccumulator>;
  playerInvolvement: Map<number, PlayerInvolvementAccumulator>;
  league: LeagueAccumulator;
  numTeams: number;
}

/** Computed PAV values for a player. */
export interface PlayerPav {
  offPav: number;
  midPav: number;
  defPav: number;
  totalPav: number;
}

/** Team strength values in the three zones. */
export interface TeamStrength {
  offence: number;
  midfield: number;
  defence: number;
}

/** Create a fresh PAV season state. */
export function createPavSeasonState(numTeams: number): PavSeasonState {
  return {
    teamStats: new Map(),
    teamInvolvement: new Map(),
    playerInvolvement: new Map(),
    league: { totalPoints: 0, totalInsideFifties: 0, matchesProcessed: 0 },
    numTeams,
  };
}

/**
 * Create PAV season state initialised with prior-season league averages.
 *
 * Used for R1 of each season to avoid divide-by-zero in team strength.
 * From R2 onward, current-season cumulative averages take over.
 */
export function createPavSeasonStateWithPriorLeague(
  numTeams: number,
  priorLeague: LeagueAccumulator,
): PavSeasonState {
  return {
    teamStats: new Map(),
    teamInvolvement: new Map(),
    playerInvolvement: new Map(),
    league: { ...priorLeague },
    numTeams,
  };
}

function getOrCreateTeamStats(state: PavSeasonState, teamId: number): TeamSeasonAccumulator {
  let stats = state.teamStats.get(teamId);
  if (!stats) {
    stats = {
      points: 0,
      insideFifties: 0,
      pointsConceded: 0,
      insideFiftiesConceded: 0,
      gamesPlayed: 0,
      oppQualitySum: 0,
    };
    state.teamStats.set(teamId, stats);
  }
  return stats;
}

function getOrCreateTeamInvolvement(
  state: PavSeasonState,
  teamId: number,
): TeamInvolvementAccumulator {
  let inv = state.teamInvolvement.get(teamId);
  if (!inv) {
    inv = { offTotal: 0, midTotal: 0, defTotal: 0 };
    state.teamInvolvement.set(teamId, inv);
  }
  return inv;
}

function getOrCreatePlayerInvolvement(
  state: PavSeasonState,
  playerId: number,
): PlayerInvolvementAccumulator {
  let inv = state.playerInvolvement.get(playerId);
  if (!inv) {
    inv = { offScore: 0, midScore: 0, defScore: 0 };
    state.playerInvolvement.set(playerId, inv);
  }
  return inv;
}

/** Null-safe number helper: treat NULL columns as 0 for involvement scores. */
function n(val: number | null): number {
  return val ?? 0;
}

/**
 * Compute offensive involvement score for a player's match stats.
 *
 * Formula from HPN:
 * off = (goals×6 + behinds) + 0.25×hitouts + 3×goal_assists
 *     + inside_fifties + marks_inside_fifty + (fk_for - fk_against)
 */
export function computeOffScore(stats: PlayerMatchStatsRow): number {
  return (
    n(stats.goals) * 6 +
    n(stats.behinds) +
    0.25 * n(stats.hitouts) +
    3 * n(stats.goal_assists) +
    n(stats.inside_fifties) +
    n(stats.marks_inside_fifty) +
    (n(stats.free_kicks_for) - n(stats.free_kicks_against))
  );
}

/**
 * Compute defensive involvement score for a player's match stats.
 *
 * Formula from HPN:
 * def = 20×rebounds + 12×one_percenters
 *     + (marks - 4×marks_inside_fifty + 2×(fk_for - fk_against))
 *     - (2/3)×hitouts
 */
export function computeDefScore(stats: PlayerMatchStatsRow): number {
  return (
    20 * n(stats.rebounds) +
    12 * n(stats.one_percenters) +
    (n(stats.marks) -
      4 * n(stats.marks_inside_fifty) +
      2 * (n(stats.free_kicks_for) - n(stats.free_kicks_against))) -
    (2 / 3) * n(stats.hitouts)
  );
}

/**
 * Compute midfield involvement score for a player's match stats.
 *
 * Formula from HPN:
 * mid = 15×inside_fifties + 20×clearances + 3×tackles
 *     + 1.5×hitouts + (fk_for - fk_against)
 */
export function computeMidScore(stats: PlayerMatchStatsRow): number {
  return (
    15 * n(stats.inside_fifties) +
    20 * n(stats.clearances) +
    3 * n(stats.tackles) +
    1.5 * n(stats.hitouts) +
    (n(stats.free_kicks_for) - n(stats.free_kicks_against))
  );
}

/**
 * Compute team strength values from cumulative stats and league averages.
 *
 * @param teamStats - Team's cumulative season stats.
 * @param opponentStats - Opponent's cumulative season stats (for midfield).
 * @param leagueAvgPointsPerI50 - League average points per inside 50.
 * @returns Team strength in each zone.
 */
export function computeTeamStrength(
  teamStats: TeamSeasonAccumulator,
  leagueAvgPointsPerI50: number,
): TeamStrength {
  if (leagueAvgPointsPerI50 === 0 || teamStats.insideFifties === 0) {
    return { offence: 1, midfield: 1, defence: 1 };
  }

  // Offence: (team_points / team_i50) / league_avg_points_per_i50
  const offence = teamStats.points / teamStats.insideFifties / leagueAvgPointsPerI50;

  // Midfield: team_i50 / opponent_i50 (using conceded as opponent's i50 into us)
  const midfield =
    teamStats.insideFiftiesConceded > 0
      ? teamStats.insideFifties / teamStats.insideFiftiesConceded
      : 1;

  // Defence: DN = (points_conceded / i50_conceded) / league_avg
  // defence = ((2*DN - DN²) / (2*DN)) * 2  =  2 - DN
  // For league-average team (dn=1): defence = 1 (same scale as offence/midfield)
  const pointsConcededPerI50 =
    teamStats.insideFiftiesConceded > 0
      ? teamStats.pointsConceded / teamStats.insideFiftiesConceded
      : leagueAvgPointsPerI50;
  const dn = pointsConcededPerI50 / leagueAvgPointsPerI50;

  let defence: number;
  if (dn === 0) {
    defence = 2; // Perfect defence
  } else {
    defence = ((2 * dn - dn * dn) / (2 * dn)) * 2;
  }

  return { offence, midfield, defence };
}

/**
 * Update PAV state after a completed match.
 *
 * Mutates the state in place. Updates:
 * 1. Team cumulative stats (points, i50s, conceded)
 * 2. League averages
 * 3. Player involvement scores (cumulative)
 * 4. Team involvement totals (cumulative)
 *
 * @param state - PAV season state (mutated).
 * @param match - Completed match with scores.
 * @param matchStats - All player stats for this match.
 * @param oppQuality - Optional opponent quality deltas (pre-match, per side).
 */
export function updatePavState(
  state: PavSeasonState,
  match: MatchRow,
  matchStats: PlayerMatchStatsRow[],
  oppQuality?: OpponentQuality,
): void {
  if (match.home_points === null || match.away_points === null) return;

  const homeStats = getOrCreateTeamStats(state, match.home_team_id);
  const awayStats = getOrCreateTeamStats(state, match.away_team_id);

  homeStats.oppQualitySum += oppQuality?.home ?? 0;
  awayStats.oppQualitySum += oppQuality?.away ?? 0;

  // Compute team-level inside 50s from player stats
  const homeI50 = matchStats
    .filter((s) => s.team_id === match.home_team_id)
    .reduce((sum, s) => sum + n(s.inside_fifties), 0);
  const awayI50 = matchStats
    .filter((s) => s.team_id === match.away_team_id)
    .reduce((sum, s) => sum + n(s.inside_fifties), 0);

  // Update team cumulative stats
  homeStats.points += match.home_points;
  homeStats.insideFifties += homeI50;
  homeStats.pointsConceded += match.away_points;
  homeStats.insideFiftiesConceded += awayI50;
  homeStats.gamesPlayed += 1;

  awayStats.points += match.away_points;
  awayStats.insideFifties += awayI50;
  awayStats.pointsConceded += match.home_points;
  awayStats.insideFiftiesConceded += homeI50;
  awayStats.gamesPlayed += 1;

  // Update league averages
  state.league.totalPoints += match.home_points + match.away_points;
  state.league.totalInsideFifties += homeI50 + awayI50;
  state.league.matchesProcessed += 1;

  // Update player and team involvement scores
  for (const playerStats of matchStats) {
    const playerInv = getOrCreatePlayerInvolvement(state, playerStats.player_id);
    const teamInv = getOrCreateTeamInvolvement(state, playerStats.team_id);

    const off = computeOffScore(playerStats);
    const mid = computeMidScore(playerStats);
    const def = computeDefScore(playerStats);

    playerInv.offScore += off;
    playerInv.midScore += mid;
    playerInv.defScore += def;

    teamInv.offTotal += off;
    teamInv.midTotal += mid;
    teamInv.defTotal += def;
  }
}

/**
 * Compute current PAV for a player given the season state.
 *
 * PAV = (player_share_of_team_score) × (team_pool_per_zone)
 *
 * Pool per zone = PAV_POOL_PER_TEAM_PER_ZONE × team_strength_in_zone
 * Player share = player_cumulative_score / team_cumulative_score
 *
 * With the fixed pool, this gives a pace-equivalent season-end PAV.
 *
 * The optional opponent adjustment scales the team's pools by
 * `1 + alpha × avg(opponent quality delta)` — production against a
 * strong schedule earns a larger pool, against a weak schedule a smaller
 * one. Applied at the pool level because the per-zone strength measures
 * are ratios, where a uniform per-match stat scaling would cancel out.
 */
export function computePlayerPav(
  state: PavSeasonState,
  playerId: number,
  teamId: number,
  oppAdjustmentAlpha = 0,
): PlayerPav {
  const playerInv = state.playerInvolvement.get(playerId);
  const teamInv = state.teamInvolvement.get(teamId);
  const teamStats = state.teamStats.get(teamId);

  if (!playerInv || !teamInv || !teamStats) {
    return { offPav: 0, midPav: 0, defPav: 0, totalPav: 0 };
  }

  const leagueAvgPointsPerI50 =
    state.league.totalInsideFifties > 0
      ? state.league.totalPoints / state.league.totalInsideFifties
      : 1;

  const strength = computeTeamStrength(teamStats, leagueAvgPointsPerI50);

  // Team pool in each zone = base_pool × team_strength × num_teams (proportional share)
  // Actually: total league pool = PAV_POOL_PER_TEAM_PER_ZONE × numTeams
  // Each team's share is proportional to their strength
  // For simplicity and HPN alignment: team_pool = PAV_POOL_PER_TEAM_PER_ZONE × strength
  // Clamped at 0 so an extreme alpha against a weak schedule can shrink the
  // pool to nothing but never turn it negative.
  const scheduleAdj =
    oppAdjustmentAlpha !== 0 && teamStats.gamesPlayed > 0
      ? Math.max(0, 1 + oppAdjustmentAlpha * (teamStats.oppQualitySum / teamStats.gamesPlayed))
      : 1;

  const offPool = PAV_POOL_PER_TEAM_PER_ZONE * strength.offence * scheduleAdj;
  const midPool = PAV_POOL_PER_TEAM_PER_ZONE * strength.midfield * scheduleAdj;
  const defPool = PAV_POOL_PER_TEAM_PER_ZONE * strength.defence * scheduleAdj;

  // Player's share of team total
  const offShare = teamInv.offTotal > 0 ? playerInv.offScore / teamInv.offTotal : 0;
  const midShare = teamInv.midTotal > 0 ? playerInv.midScore / teamInv.midTotal : 0;
  const defShare = teamInv.defTotal > 0 ? playerInv.defScore / teamInv.defTotal : 0;

  const offPav = offShare * offPool;
  const midPav = midShare * midPool;
  const defPav = defShare * defPool;

  return {
    offPav,
    midPav,
    defPav,
    totalPav: offPav + midPav + defPav,
  };
}

/**
 * Compute the league average at the end of a season.
 *
 * Used as the prior league average for R1 of the following season.
 */
export function getLeagueAccumulator(state: PavSeasonState): LeagueAccumulator {
  return { ...state.league };
}
