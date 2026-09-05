/** Read-only supplementary inputs. Never replace frozen input files. */
import { existsSync, writeFileSync } from "node:fs";
import { getDatabase } from "../src/cli/db.js";

const path = process.env.TASK40_EXTRA ?? "/tmp/tipper-task40-extra.json";
if (existsSync(path)) throw new Error(`Refusing to overwrite ${path}`);
const db = getDatabase();
const joins = `JOIN matches m ON p.match_id = m.id
  JOIN seasons s ON m.season_id = s.id
  JOIN competitions c ON s.competition_id = c.id`;
const queries = {
  venues: "SELECT * FROM venues ORDER BY id",
  matches: `SELECT m.*, s.year FROM matches m
    JOIN seasons s ON m.season_id = s.id JOIN competitions c ON s.competition_id = c.id
    WHERE c.code = 'AFLM' AND s.year BETWEEN 2010 AND 2026
    ORDER BY m.season_id, m.date, m.local_time, m.id`,
  weather: `SELECT p.*, s.year FROM match_weather p ${joins}
    WHERE c.code = 'AFLM' AND s.year BETWEEN 2010 AND 2026 ORDER BY p.match_id, p.kind`,
};
const output: Record<string, unknown> = { capturedAt: new Date().toISOString() };
for (const [key, sql] of Object.entries(queries)) {
  const response = await db.prepare(sql).all();
  output[key] = response.results;
  console.log(`${key}: ${response.results.length}`);
}
const stats = [];
for (let year = 2010; year <= 2026; year++) {
  const response = await db
    .prepare(`SELECT p.match_id, p.player_id, p.team_id,
    p.shots_at_goal, p.score_involvements, p.intercepts, p.pressure_acts, p.rating_points,
    p.time_on_ground_pct, p.player_position, s.year FROM player_match_stats p ${joins}
    WHERE c.code = 'AFLM' AND s.year = ? ORDER BY p.match_id, p.player_id`)
    .bind(year)
    .all();
  stats.push(...response.results);
  console.log(`stats ${year}: ${response.results.length}`);
}
output.stats = stats;
writeFileSync(path, JSON.stringify(output), { flag: "wx" });
console.log(`Saved ${path}`);
