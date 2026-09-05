/** Read archived inputs and independently joined match outcomes. Never writes. */
import { type TrialArchive, TrialArchiveSchema } from "../trial/score.js";

export async function fetchTrialArchive(db: D1Database, season: number): Promise<TrialArchive> {
  // Page captures to keep REST response sizes bounded as the archive grows.
  const rows: unknown[] = [];
  let after = 0;
  while (true) {
    const page = await db
      .prepare(`SELECT rowid AS archive_rowid, * FROM prediction_archive
      WHERE competition = 'AFLM' AND season_year = ? AND rowid > ?
      ORDER BY rowid LIMIT 250`)
      .bind(season, after)
      .all<{ archive_rowid: number }>();
    rows.push(...page.results);
    const last = page.results.at(-1);
    if (!last || page.results.length < 250) break;
    after = last.archive_rowid;
  }
  const results = await db
    .prepare(`SELECT m.id AS match_id,
    CASE WHEN m.home_points IS NOT NULL AND m.away_points IS NOT NULL
      THEN m.home_points - m.away_points ELSE NULL END AS actual_margin, m.round_type
    FROM matches m JOIN seasons s ON m.season_id = s.id
    JOIN competitions c ON s.competition_id = c.id
    WHERE c.code = 'AFLM' AND s.year = ? ORDER BY m.id`)
    .bind(season)
    .all();
  return TrialArchiveSchema.parse({ provenance: "prospective", rows, results: results.results });
}
