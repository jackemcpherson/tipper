import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import { z } from "zod";
import type { Match, Team } from "./data.js";

/**
 * Stored Squiggle forecasts and results. Each season snapshot is source data
 * for the fixed benchmark. Re-fetching a season replaces the snapshot and
 * records the new observation time in the manifest.
 */
const numeric = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? null : Number(value)),
  z.number().nullable(),
);
export const FieldTipSchema = z.object({
  gameid: z.number().int().positive(),
  year: z.number().int(),
  round: z.number().int(),
  source: z.string(),
  sourceid: z.number().int(),
  hteam: z.string(),
  ateam: z.string(),
  tip: z.string(),
  hconfidence: numeric,
  hmargin: numeric,
  correct: numeric,
  bits: numeric,
  err: numeric,
  updated: z.string().nullable().optional(),
});
export type FieldTip = z.infer<typeof FieldTipSchema>;
export const FieldGameSchema = z.object({
  id: z.number().int().positive(),
  year: z.number().int(),
  round: z.number().int(),
  hteam: z.string().nullable(),
  ateam: z.string().nullable(),
  hscore: z.number().nullable(),
  ascore: z.number().nullable(),
  complete: z.number(),
  date: z.string(),
  venue: z.string().nullable(),
  is_final: z.number().optional(),
});
export type FieldGame = z.infer<typeof FieldGameSchema>;
export const FieldSeasonSchema = z.object({
  year: z.number().int(),
  fetchedAt: z.string(),
  games: z.array(FieldGameSchema),
  tips: z.array(FieldTipSchema),
});
export type FieldSeason = z.infer<typeof FieldSeasonSchema>;

export const FIELD_DIR = "benchmark/squiggle";
const UA = "tipper-research/1.0 (jackemcpherson@gmail.com)";

/** Squiggle and the shared database spell one club differently. */
export const squiggleName = (name: string) =>
  name === "GWS Giants" ? "Greater Western Sydney" : name;

export async function fetchField(year: number, fetchImpl: typeof fetch = fetch) {
  const read = async (query: string) => {
    const response = await fetchImpl(`https://api.squiggle.com.au/?${query}`, {
      headers: { "user-agent": UA },
      signal: AbortSignal.timeout(90_000),
    });
    if (!response.ok) throw new Error(`Squiggle HTTP ${response.status}`);
    return response.json();
  };
  const games = z.object({ games: z.array(z.unknown()) }).parse(await read(`q=games;year=${year}`));
  const tips = z.object({ tips: z.array(z.unknown()) }).parse(await read(`q=tips;year=${year}`));
  return FieldSeasonSchema.parse({
    year,
    fetchedAt: new Date().toISOString(),
    games: games.games,
    tips: tips.tips,
  });
}

export async function storeField(season: FieldSeason, dir = FIELD_DIR): Promise<string> {
  await mkdir(dir, { recursive: true });
  const path = join(dir, `${season.year}.json.gz`);
  await writeFile(path, gzipSync(JSON.stringify(season)));
  return path;
}

export async function loadField(year: number, dir = FIELD_DIR): Promise<FieldSeason> {
  const raw = await readFile(join(dir, `${year}.json.gz`));
  return FieldSeasonSchema.parse(JSON.parse(gunzipSync(raw).toString("utf8")));
}

/**
 * Map database matches to Squiggle games by season, round and team names.
 * Unmatched or ambiguous matches are left out and reported by the caller.
 */
export function mapGames(
  matches: readonly Match[],
  teams: readonly Team[],
  games: readonly FieldGame[],
): Map<number, number> {
  const names = new Map(teams.map((t) => [t.id, squiggleName(t.name)]));
  const index = new Map<string, FieldGame[]>();
  for (const g of games) {
    if (g.hteam === null || g.ateam === null) continue;
    const key = `${g.year}:${g.round}:${g.hteam}:${g.ateam}`;
    index.set(key, [...(index.get(key) ?? []), g]);
  }
  const mapping = new Map<number, number>();
  for (const m of matches) {
    const key = `${m.year}:${m.round_number}:${names.get(m.home_team_id)}:${names.get(m.away_team_id)}`;
    const found = index.get(key);
    if (found?.length === 1 && found[0]) mapping.set(m.id, found[0].id);
  }
  return mapping;
}
