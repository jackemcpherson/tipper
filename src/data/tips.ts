/** Primary-only public feed reads. Archive rows never participate in these queries. */
import { z } from "zod";
import type { CompPrediction } from "../comp.js";

const TipRowSchema = z.object({
  match_id: z.number().int(),
  home: z.string(),
  away: z.string(),
  round_number: z.number().int(),
  home_win_prob: z.number().min(0).max(1),
  predicted_margin: z.number(),
});

export async function fetchDefaultTipsRound(
  db: D1Database,
  modelVersion: string,
  today: string,
): Promise<{ year: number; round: number } | null> {
  const result = await db
    .prepare(`SELECT s.year, m.round_number AS round FROM matches m
    JOIN seasons s ON m.season_id = s.id JOIN competitions c ON s.competition_id = c.id
    JOIN match_predictions p ON p.match_id = m.id AND p.model_version = ?
    WHERE c.code = 'AFLM' AND m.round_number IS NOT NULL
    ORDER BY CASE WHEN m.date >= ? THEN 0 ELSE 1 END,
      CASE WHEN m.date >= ? THEN m.date END ASC, m.date DESC LIMIT 1`)
    .bind(modelVersion, today, today)
    .all();
  const row = result.results[0];
  return row ? z.object({ year: z.number().int(), round: z.number().int() }).parse(row) : null;
}

export async function fetchPrimaryTips(
  db: D1Database,
  year: number,
  round: number,
  modelVersion: string,
): Promise<{ exists: boolean; predictions: CompPrediction[] }> {
  const fixtures = await db
    .prepare(`SELECT m.id FROM matches m
    JOIN seasons s ON m.season_id = s.id JOIN competitions c ON s.competition_id = c.id
    WHERE c.code = 'AFLM' AND s.year = ? AND m.round_number = ? LIMIT 1`)
    .bind(year, round)
    .all();
  if (!fixtures.results.length) return { exists: false, predictions: [] };
  const result = await db
    .prepare(`SELECT m.id AS match_id, h.name AS home, a.name AS away,
    m.round_number, p.home_win_prob, p.predicted_margin
    FROM matches m JOIN seasons s ON m.season_id = s.id
    JOIN competitions c ON s.competition_id = c.id
    JOIN teams h ON h.id = m.home_team_id JOIN teams a ON a.id = m.away_team_id
    JOIN match_predictions p ON p.match_id = m.id
    WHERE c.code = 'AFLM' AND s.year = ? AND m.round_number = ? AND p.model_version = ?
    ORDER BY m.date, m.local_time, m.id`)
    .bind(year, round, modelVersion)
    .all();
  const rows = z.array(TipRowSchema).parse(result.results);
  return {
    exists: true,
    predictions: rows.map((row) => ({
      matchId: row.match_id,
      home: row.home,
      away: row.away,
      roundNumber: row.round_number,
      predictedMargin: row.predicted_margin,
      predictedWinner: row.home_win_prob >= 0.5 ? "home" : "away",
      winProbability: { home: row.home_win_prob, away: 1 - row.home_win_prob },
    })),
  };
}
