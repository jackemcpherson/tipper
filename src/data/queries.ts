/**
 * All SQL queries for the tipper engine.
 *
 * Single source of truth for database reads. Every query has a named
 * export. The engine never constructs SQL outside this module.
 *
 * All functions take a D1Database and return typed row arrays.
 * These are the "effectful shell" — called by the CLI layer before
 * handing pure data to the engine.
 */

import type {
  MatchLineupRow,
  MatchRow,
  PlayerMatchStatsRow,
  PlayerRow,
  PlayerSeasonPavRow,
  SeasonRow,
  TeamRow,
  VenueRow,
} from "./types.js";

/**
 * Fetch season rows for the given years.
 *
 * Used to map year → season_id for query scoping.
 */
export async function fetchSeasons(db: D1Database, years: number[]): Promise<SeasonRow[]> {
  const placeholders = years.map(() => "?").join(", ");
  const stmt = db.prepare(
    `SELECT id, competition_id, year FROM seasons WHERE year IN (${placeholders})`,
  );
  const result = await stmt.bind(...years).all<SeasonRow>();
  return result.results;
}

/** Fetch all teams. */
export async function fetchTeams(db: D1Database): Promise<TeamRow[]> {
  const result = await db
    .prepare("SELECT id, name, abbreviation, competition_id FROM teams")
    .all<TeamRow>();
  return result.results;
}

/** Fetch all venues. */
export async function fetchVenues(db: D1Database): Promise<VenueRow[]> {
  const result = await db.prepare("SELECT id, name FROM venues").all<VenueRow>();
  return result.results;
}

/**
 * Fetch all matches for the given season IDs, ordered for walk-forward.
 *
 * Sort key: (season_id, date, local_time, id) for stable chronological
 * ordering. local_time may be NULL for 2026 data (fryzigg-source only),
 * in which case ordering within a date falls back to match id — roughly
 * chronological by AFL fixture release but not guaranteed.
 */
export async function fetchMatchesForSeasons(
  db: D1Database,
  seasonIds: number[],
): Promise<MatchRow[]> {
  const placeholders = seasonIds.map(() => "?").join(", ");
  const sql = `
    SELECT
      id, season_id, round, round_number, round_type,
      date, local_time, venue_id,
      home_team_id, away_team_id,
      home_goals, home_behinds, home_points,
      away_goals, away_behinds, away_points,
      margin, attendance, weather_temp_c, weather_type,
      external_afl_id
    FROM matches
    WHERE season_id IN (${placeholders})
    ORDER BY season_id, date, local_time, id
  `;
  const result = await db
    .prepare(sql)
    .bind(...seasonIds)
    .all<MatchRow>();
  return result.results;
}

/**
 * Fetch all lineups for the given match IDs.
 *
 * Returns all lineup entries — filtering by is_emergency is done by
 * the engine based on the config's pav.include setting.
 */
export async function fetchLineupsForMatches(
  db: D1Database,
  matchIds: number[],
): Promise<MatchLineupRow[]> {
  if (matchIds.length === 0) return [];

  // D1 has a bind limit of ~100; batch into chunks of 80
  const results: MatchLineupRow[] = [];
  for (let i = 0; i < matchIds.length; i += 80) {
    const chunk = matchIds.slice(i, i + 80);
    const placeholders = chunk.map(() => "?").join(", ");
    const sql = `
      SELECT id, match_id, player_id, team_id, guernsey_number,
             position, is_emergency, is_substitute
      FROM match_lineups
      WHERE match_id IN (${placeholders})
    `;
    const result = await db
      .prepare(sql)
      .bind(...chunk)
      .all<MatchLineupRow>();
    results.push(...result.results);
  }
  return results;
}

/**
 * Fetch all player match stats for the given match IDs.
 *
 * Returns the columns needed for PAV computation: scoring, contested
 * ball, clearances, marks, hitouts, inside 50s, rebounds, one percenters,
 * free kicks, goal assists, and tackles.
 */
export async function fetchPlayerStatsForMatches(
  db: D1Database,
  matchIds: number[],
): Promise<PlayerMatchStatsRow[]> {
  if (matchIds.length === 0) return [];

  const results: PlayerMatchStatsRow[] = [];
  for (let i = 0; i < matchIds.length; i += 80) {
    const chunk = matchIds.slice(i, i + 80);
    const placeholders = chunk.map(() => "?").join(", ");
    const sql = `
      SELECT id, match_id, player_id, team_id,
             guernsey_number, player_position, time_on_ground_pct,
             kicks, handballs, disposals, marks, tackles,
             one_percenters, contested_possessions,
             goals, behinds, goal_assists,
             marks_inside_fifty, free_kicks_for, free_kicks_against,
             hitouts, inside_fifties, rebounds, clearances,
             metres_gained
      FROM player_match_stats
      WHERE match_id IN (${placeholders})
    `;
    const result = await db
      .prepare(sql)
      .bind(...chunk)
      .all<PlayerMatchStatsRow>();
    results.push(...result.results);
  }
  return results;
}

/**
 * Fetch player season PAV for a given season year.
 *
 * Used as Bayesian prior for the following season's PAV computation.
 * Joins through seasons table to filter by year.
 */
export async function fetchPriorSeasonPav(
  db: D1Database,
  seasonYear: number,
): Promise<PlayerSeasonPavRow[]> {
  const sql = `
    SELECT psp.id, psp.player_id, psp.season_id, psp.team_id,
           psp.off_pav, psp.mid_pav, psp.def_pav, psp.total_pav
    FROM player_season_pav psp
    JOIN seasons s ON psp.season_id = s.id
    WHERE s.year = ?
  `;
  const result = await db.prepare(sql).bind(seasonYear).all<PlayerSeasonPavRow>();
  return result.results;
}

/** Fetch player names for display. */
export async function fetchPlayers(db: D1Database, playerIds: number[]): Promise<PlayerRow[]> {
  if (playerIds.length === 0) return [];

  const results: PlayerRow[] = [];
  for (let i = 0; i < playerIds.length; i += 80) {
    const chunk = playerIds.slice(i, i + 80);
    const placeholders = chunk.map(() => "?").join(", ");
    const sql = `SELECT id, first_name, surname FROM players WHERE id IN (${placeholders})`;
    const result = await db
      .prepare(sql)
      .bind(...chunk)
      .all<PlayerRow>();
    results.push(...result.results);
  }
  return results;
}

/**
 * Fetch the latest match date in the database.
 *
 * Used for the "data_through" field in backtest results.
 */
export async function fetchLatestMatchDate(db: D1Database): Promise<string | null> {
  const result = await db
    .prepare("SELECT MAX(date) as max_date FROM matches WHERE home_points IS NOT NULL")
    .first<{ max_date: string | null }>();
  return result?.max_date ?? null;
}
