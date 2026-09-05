import { z } from "zod";
import type { Round } from "./prediction.js";

const UA = "tipper-worker/2.0 (jackemcpherson@gmail.com)";
export const squiggleName = (name: string) =>
  name === "GWS Giants" ? "Greater Western Sydney" : name;
const GameSchema = z.object({
  id: z.number().int().positive(),
  hteam: z.string(),
  ateam: z.string(),
  hteamid: z.number().int().positive(),
  ateamid: z.number().int().positive(),
  year: z.number().int(),
  round: z.number().int(),
});
export const FieldSchema = z.object({
  tips: z
    .array(
      z.object({
        gameid: z.number().int().positive(),
        source: z.string(),
        hteam: z.string(),
        ateam: z.string(),
        tip: z.string(),
        hmargin: z
          .preprocess((value) => (value === "" ? null : value), z.coerce.number().nullable())
          .optional(),
        hconfidence: z.coerce.number().min(0).max(100).nullable().optional(),
      }),
    )
    .max(100000),
});
export type FieldTip = z.infer<typeof FieldSchema>["tips"][number];
/** Read Squiggle with a deadline; errors are retained by the reporting caller. */
export async function squiggleJson(query: string): Promise<unknown> {
  const response = await fetch(`https://api.squiggle.com.au/?${query}`, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Squiggle HTTP ${response.status}`);
  return response.json();
}
/** Resolve ordered fixture identities off the feed request path. Retain known mappings on outages. */
export async function resolveMappings(db: D1Database, round: Round): Promise<void> {
  if (round.competition !== "AFLM") return;
  const { games } = z
    .object({ games: z.array(GameSchema).max(20) })
    .parse(await squiggleJson(`q=games;year=${round.season};round=${round.round}`));
  if (games.some((g) => g.year !== round.season || g.round !== round.round))
    throw new Error("Invalid Squiggle round");
  if (new Set(games.map((g) => g.id)).size !== games.length) {
    await db
      .prepare("DELETE FROM tipper_game_ids WHERE year=? AND round=?")
      .bind(round.season, round.round)
      .run();
    throw new Error("Ambiguous Squiggle mapping");
  }
  const rows = await db
    .prepare(`SELECT m.id,m.home_team_id,m.away_team_id,h.name AS home,a.name AS away
    FROM matches m JOIN seasons s ON s.id=m.season_id JOIN competitions c ON c.id=s.competition_id
    JOIN teams h ON h.id=m.home_team_id JOIN teams a ON a.id=m.away_team_id
    WHERE c.code='AFLM' AND s.year=? AND m.round_number=?`)
    .bind(round.season, round.round)
    .all<{ id: number; home_team_id: number; away_team_id: number; home: string; away: string }>();
  const statements: D1PreparedStatement[] = [];
  for (const m of rows.results) {
    const matches = games.filter(
      (g) => g.hteam === squiggleName(m.home) && g.ateam === squiggleName(m.away),
    );
    if (matches.length > 1) {
      await db.prepare("DELETE FROM tipper_game_ids WHERE match_id=?").bind(m.id).run();
      throw new Error("Ambiguous Squiggle mapping");
    }
    const g = matches[0];
    if (!g) continue;
    statements.push(
      db
        .prepare(`INSERT INTO tipper_game_ids(match_id,game_id,year,round,home_team_id,away_team_id,
      squiggle_home_id,squiggle_away_id,home_name,away_name,observed_at)
      SELECT id,?,?,?,?,?,?,?,?,?,strftime('%Y-%m-%dT%H:%M:%fZ','now') FROM matches
      WHERE id=? AND home_team_id=? AND away_team_id=? AND round_number=?
      AND season_id IN (SELECT s.id FROM seasons s JOIN competitions c ON c.id=s.competition_id WHERE c.code='AFLM' AND s.year=?)
      ON CONFLICT(match_id) DO UPDATE SET game_id=excluded.game_id,year=excluded.year,round=excluded.round,
      home_team_id=excluded.home_team_id,away_team_id=excluded.away_team_id,squiggle_home_id=excluded.squiggle_home_id,
      squiggle_away_id=excluded.squiggle_away_id,home_name=excluded.home_name,away_name=excluded.away_name,observed_at=excluded.observed_at`)
        .bind(
          g.id,
          g.year,
          g.round,
          m.home_team_id,
          m.away_team_id,
          g.hteamid,
          g.ateamid,
          g.hteam,
          g.ateam,
          m.id,
          m.home_team_id,
          m.away_team_id,
          round.round,
          round.season,
        ),
    );
  }
  if (statements.length) await db.batch(statements);
}
