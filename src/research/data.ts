import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { query, type SqlValue } from "./mcp.js";

/**
 * Local season snapshots of the shared database for chronological research.
 * Completed seasons are immutable once cached. The current season refreshes on
 * demand. Every row carries only the columns research needs.
 */
const id = z.number().int().positive();
const count = z.number().nullable();
export const MatchSchema = z.object({
  id,
  season_id: id,
  year: z.number().int(),
  round_number: z.number().int(),
  round_type: z.string().nullable(),
  round: z.string(),
  date: z.string(),
  local_time: z.string().nullable(),
  kickoff_at: z.string().nullable(),
  lineups_observed_at: z.string().nullable(),
  venue_id: id.nullable(),
  external_afl_id: z.string().nullable(),
  home_team_id: id,
  away_team_id: id,
  home_goals: count,
  home_behinds: count,
  home_points: count,
  away_goals: count,
  away_behinds: count,
  away_points: count,
  status: z.string().nullable(),
});
export type Match = z.infer<typeof MatchSchema>;
export const StatSchema = z.object({
  match_id: id,
  player_id: id,
  team_id: id,
  rating_points: z.number().nullable(),
  time_on_ground_pct: z.number().nullable(),
  goals: count,
  behinds: count,
  hitouts: count,
  goal_assists: count,
  inside_fifties: count,
  marks_inside_fifty: count,
  free_kicks_for: count,
  free_kicks_against: count,
  rebounds: count,
  one_percenters: count,
  marks: count,
  clearances: count,
  tackles: count,
});
export type Stat = z.infer<typeof StatSchema>;
export const LineupSchema = z.object({
  match_id: id,
  player_id: id,
  team_id: id,
  is_emergency: z.number().int(),
});
export type Lineup = z.infer<typeof LineupSchema>;
export const PavSchema = z.object({
  player_id: id,
  team_id: id,
  off_pav: z.number().nullable(),
  mid_pav: z.number().nullable(),
  def_pav: z.number().nullable(),
});
export const SeasonSchema = z.object({
  competition: z.literal("AFLM"),
  year: z.number().int(),
  fetchedAt: z.string(),
  matches: z.array(MatchSchema),
  stats: z.array(StatSchema),
  lineups: z.array(LineupSchema),
  pav: z.array(PavSchema),
});
export type Season = z.infer<typeof SeasonSchema>;
export const VenueSchema = z.object({
  id,
  name: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  canonical_venue_id: id.nullable(),
});
export type Venue = z.infer<typeof VenueSchema>;
export const TeamSchema = z.object({ id, name: z.string(), abbreviation: z.string().nullable() });
export type Team = z.infer<typeof TeamSchema>;
export const ReferenceSchema = z.object({
  fetchedAt: z.string(),
  venues: z.array(VenueSchema),
  teams: z.array(TeamSchema),
});
export type Reference = z.infer<typeof ReferenceSchema>;

export const CACHE_DIR = ".cache/research";
const JOINS =
  "FROM matches m JOIN seasons s ON s.id=m.season_id JOIN competitions c ON c.id=s.competition_id";
const SEASON = "c.code='AFLM' AND s.year=?";
const ROUND_CHUNKS: readonly (readonly [number, number])[] = [
  [0, 7],
  [8, 15],
  [16, 23],
  [24, 40],
];

async function chunked(sql: string, year: number): Promise<Record<string, SqlValue>[]> {
  const rows: Record<string, SqlValue>[] = [];
  for (const [from, to] of ROUND_CHUNKS) rows.push(...(await query(sql, [year, from, to])));
  return rows;
}

/** Fetch one AFLM season from the shared database. */
export async function fetchSeason(year: number): Promise<Season> {
  const matches = await query(
    `SELECT m.id,m.season_id,s.year,m.round_number,m.round_type,m.round,m.date,m.local_time,m.kickoff_at,
      m.lineups_observed_at,m.venue_id,m.external_afl_id,m.home_team_id,m.away_team_id,m.home_goals,m.home_behinds,
      m.home_points,m.away_goals,m.away_behinds,m.away_points,m.status ${JOINS}
      WHERE ${SEASON} AND m.round_number IS NOT NULL ORDER BY m.date,m.local_time,m.id`,
    [year],
  );
  const stats = await chunked(
    `SELECT ps.match_id,ps.player_id,ps.team_id,ps.rating_points,ps.time_on_ground_pct,ps.goals,ps.behinds,ps.hitouts,
      ps.goal_assists,ps.inside_fifties,ps.marks_inside_fifty,ps.free_kicks_for,ps.free_kicks_against,ps.rebounds,
      ps.one_percenters,ps.marks,ps.clearances,ps.tackles FROM player_match_stats ps JOIN matches m ON m.id=ps.match_id
      JOIN seasons s ON s.id=m.season_id JOIN competitions c ON c.id=s.competition_id
      WHERE ${SEASON} AND m.round_number BETWEEN ? AND ? ORDER BY ps.match_id,ps.player_id`,
    year,
  );
  const lineups = await chunked(
    `SELECT ml.match_id,ml.player_id,ml.team_id,ml.is_emergency FROM match_lineups ml JOIN matches m ON m.id=ml.match_id
      JOIN seasons s ON s.id=m.season_id JOIN competitions c ON c.id=s.competition_id
      WHERE ${SEASON} AND m.round_number BETWEEN ? AND ? ORDER BY ml.match_id,ml.player_id`,
    year,
  );
  const pav = await query(
    `SELECT p.player_id,p.team_id,p.off_pav,p.mid_pav,p.def_pav FROM player_season_pav p JOIN seasons s ON s.id=p.season_id
      JOIN competitions c ON c.id=s.competition_id WHERE ${SEASON} ORDER BY p.player_id`,
    [year],
  );
  return SeasonSchema.parse({
    competition: "AFLM",
    year,
    fetchedAt: new Date().toISOString(),
    matches,
    stats,
    lineups,
    pav,
  });
}

export async function fetchReference(): Promise<Reference> {
  const venues = await query(
    "SELECT id,name,latitude,longitude,canonical_venue_id FROM venues ORDER BY id",
  );
  const teams = await query(
    `SELECT t.id,t.name,t.abbreviation FROM teams t JOIN competitions c ON c.id=t.competition_id WHERE c.code='AFLM' ORDER BY t.id`,
  );
  return ReferenceSchema.parse({ fetchedAt: new Date().toISOString(), venues, teams });
}

async function readJson(path: string): Promise<unknown | undefined> {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

export interface LoadOptions {
  /** Refetch the season even when a cache file exists. */
  readonly refresh?: boolean;
  /** Seasons at or after this year are refetched unless cached within `maxAgeHours`. */
  readonly currentSeason?: number;
  readonly maxAgeHours?: number;
  readonly cacheDir?: string;
}

/** Load a season through the local cache. */
export async function loadSeason(year: number, options: LoadOptions = {}): Promise<Season> {
  const dir = options.cacheDir ?? CACHE_DIR;
  const path = join(dir, `AFLM-${year}.json`);
  const cached = await readJson(path);
  if (cached && !options.refresh) {
    const season = SeasonSchema.parse(cached);
    const current = options.currentSeason !== undefined && year >= options.currentSeason;
    const ageHours = (Date.now() - Date.parse(season.fetchedAt)) / 3600_000;
    if (!current || ageHours < (options.maxAgeHours ?? 6)) return season;
  }
  const season = await fetchSeason(year);
  await mkdir(dir, { recursive: true });
  await writeFile(path, JSON.stringify(season));
  return season;
}

export async function loadReference(options: LoadOptions = {}): Promise<Reference> {
  const dir = options.cacheDir ?? CACHE_DIR;
  const path = join(dir, "reference.json");
  const cached = await readJson(path);
  if (cached && !options.refresh) return ReferenceSchema.parse(cached);
  const reference = await fetchReference();
  await mkdir(dir, { recursive: true });
  await writeFile(path, JSON.stringify(reference));
  return reference;
}

export const StoredPredictionSchema = z.object({
  match_id: id,
  home_win_prob: z.number(),
  predicted_margin: z.number(),
  model_version: z.string(),
  generated_at: z.string(),
  tipper_run_id: z.number().nullable(),
  /** The latest issued capture's full-precision margin, when a real capture exists. */
  capture_margin: z.number().nullable(),
  capture_provisional: z.number().nullable(),
  capture_published_at: z.string().nullable(),
  capture_kickoff_at: z.string().nullable(),
  capture_observed_at: z.string().nullable(),
});
export type StoredPrediction = z.infer<typeof StoredPredictionSchema>;
export const StoredPredictionsSchema = z.object({
  year: z.number().int(),
  fetchedAt: z.string(),
  predictions: z.array(StoredPredictionSchema),
});
export type StoredPredictions = z.infer<typeof StoredPredictionsSchema>;

/** Production predictions stored in the shared database for one AFLM season. */
export async function fetchProductionPredictions(year: number): Promise<StoredPredictions> {
  const predictions = await query(
    `SELECT mp.match_id,mp.home_win_prob,mp.predicted_margin,mp.model_version,mp.generated_at,mp.tipper_run_id,
      p.margin AS capture_margin,p.provisional AS capture_provisional,p.published_at AS capture_published_at,
      p.kickoff_at AS capture_kickoff_at,p.observed_at AS capture_observed_at
      FROM match_predictions mp JOIN matches m ON m.id=mp.match_id ${JOINS.replace("FROM matches m ", "")}
      LEFT JOIN tipper_predictions p ON p.run_id=mp.tipper_run_id AND p.match_id=mp.match_id
      WHERE ${SEASON} ORDER BY mp.match_id`,
    [year],
  );
  return StoredPredictionsSchema.parse({ year, fetchedAt: new Date().toISOString(), predictions });
}

export async function loadProductionPredictions(
  year: number,
  options: LoadOptions = {},
): Promise<StoredPredictions> {
  const dir = options.cacheDir ?? CACHE_DIR;
  const path = join(dir, `production-${year}.json`);
  const cached = await readJson(path);
  if (cached && !options.refresh) {
    const stored = StoredPredictionsSchema.parse(cached);
    const ageHours = (Date.now() - Date.parse(stored.fetchedAt)) / 3600_000;
    const current = options.currentSeason !== undefined && year >= options.currentSeason;
    if (!current || ageHours < (options.maxAgeHours ?? 6)) return stored;
  }
  const stored = await fetchProductionPredictions(year);
  await mkdir(dir, { recursive: true });
  await writeFile(path, JSON.stringify(stored));
  return stored;
}

/** Load a contiguous range of seasons, oldest first. */
export async function loadSeasons(
  from: number,
  to: number,
  options: LoadOptions = {},
): Promise<Season[]> {
  const seasons: Season[] = [];
  for (let year = from; year <= to; year++) seasons.push(await loadSeason(year, options));
  return seasons;
}
