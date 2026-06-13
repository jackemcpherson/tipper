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
  CompetitionCode,
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
 * Run a chunked IN-clause query in parallel.
 *
 * D1 has a bind limit of ~100, so large IN clauses are batched in chunks
 * of 80. The chunks are independent (no ordering requirement on the
 * combined result), so they're fetched concurrently.
 */
async function fetchChunked<T>(
  ids: number[],
  fetchChunk: (chunk: number[]) => Promise<T[]>,
): Promise<T[]> {
  const chunks: number[][] = [];
  for (let i = 0; i < ids.length; i += 80) {
    chunks.push(ids.slice(i, i + 80));
  }
  const results = await Promise.all(chunks.map(fetchChunk));
  return results.flat();
}

/**
 * Fetch season rows for the given years, scoped to a single competition.
 *
 * The afl-stats DB is multi-competition (AFLM/AFLW/VFL/VFLW); the same year
 * exists as a season row in every competition. Without the competition filter,
 * downstream match/team queries silently mix data across leagues.
 */
export async function fetchSeasons(
  db: D1Database,
  years: number[],
  competition: CompetitionCode,
): Promise<SeasonRow[]> {
  const placeholders = years.map(() => "?").join(", ");
  const stmt = db.prepare(
    `SELECT s.id, s.competition_id, s.year
     FROM seasons s
     JOIN competitions c ON s.competition_id = c.id
     WHERE c.code = ? AND s.year IN (${placeholders})`,
  );
  const result = await stmt.bind(competition, ...years).all<SeasonRow>();
  return result.results;
}

/** Fetch all teams in a competition. Same-name teams (e.g. Carlton) exist in multiple comps with distinct IDs. */
export async function fetchTeams(db: D1Database, competition: CompetitionCode): Promise<TeamRow[]> {
  const result = await db
    .prepare(
      `SELECT t.id, t.name, t.abbreviation, t.competition_id
       FROM teams t
       JOIN competitions c ON t.competition_id = c.id
       WHERE c.code = ?`,
    )
    .bind(competition)
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
  return fetchChunked(matchIds, async (chunk) => {
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
    return result.results;
  });
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
  return fetchChunked(matchIds, async (chunk) => {
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
    return result.results;
  });
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
  competition: CompetitionCode,
): Promise<PlayerSeasonPavRow[]> {
  const sql = `
    SELECT psp.id, psp.player_id, psp.season_id, psp.team_id,
           psp.off_pav, psp.mid_pav, psp.def_pav, psp.total_pav
    FROM player_season_pav psp
    JOIN seasons s ON psp.season_id = s.id
    JOIN competitions c ON s.competition_id = c.id
    WHERE c.code = ? AND s.year = ?
  `;
  const result = await db.prepare(sql).bind(competition, seasonYear).all<PlayerSeasonPavRow>();
  return result.results;
}

/** Fetch player names for display. */
export async function fetchPlayers(db: D1Database, playerIds: number[]): Promise<PlayerRow[]> {
  return fetchChunked(playerIds, async (chunk) => {
    const placeholders = chunk.map(() => "?").join(", ");
    const sql = `SELECT id, first_name, surname FROM players WHERE id IN (${placeholders})`;
    const result = await db
      .prepare(sql)
      .bind(...chunk)
      .all<PlayerRow>();
    return result.results;
  });
}

/** Fetch player DOBs for the age-curve adjustment (Task 37). Map keyed by player_id. */
export async function fetchPlayerDobs(
  db: D1Database,
  playerIds: number[],
): Promise<Map<number, string | null>> {
  const map = new Map<number, string | null>();
  if (playerIds.length === 0) return map;
  await fetchChunked(playerIds, async (chunk) => {
    const placeholders = chunk.map(() => "?").join(", ");
    const sql = `SELECT id, date_of_birth FROM players WHERE id IN (${placeholders})`;
    const result = await db
      .prepare(sql)
      .bind(...chunk)
      .all<{ id: number; date_of_birth: string | null }>();
    for (const row of result.results) {
      map.set(row.id, row.date_of_birth);
    }
    return result.results;
  });
  return map;
}

/**
 * Fetch the latest match date for a competition.
 *
 * Used for the "data_through" field in backtest results.
 */
export async function fetchLatestMatchDate(
  db: D1Database,
  competition: CompetitionCode,
): Promise<string | null> {
  const result = await db
    .prepare(
      `SELECT MAX(m.date) as max_date
       FROM matches m
       JOIN seasons s ON m.season_id = s.id
       JOIN competitions c ON s.competition_id = c.id
       WHERE c.code = ? AND m.home_points IS NOT NULL`,
    )
    .bind(competition)
    .first<{ max_date: string | null }>();
  return result?.max_date ?? null;
}
