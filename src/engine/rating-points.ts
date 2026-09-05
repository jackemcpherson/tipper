/** Previous-season and past-current-season player rating shares, never today's stats. */
import type { MatchLineupRow, MatchRow } from "../data/types.js";
import type { HarnessData } from "./harness.js";

export function ratingPointsLineupTotal(
  data: HarnessData,
  match: MatchRow,
  teamId: number,
  lineup: MatchLineupRow[],
  rosterPav: (players: number[]) => number,
): number | undefined {
  const year = data.seasonYearById.get(match.season_id);
  if (year === undefined) throw new Error("Rating points require season year");
  const ratings = new Map<number, { sum: number; n: number }>();
  const teams = new Map<number, number>();
  let priorSum = 0;
  let priorN = 0;
  for (const past of data.matches) {
    if (past.id === match.id) break;
    const y = data.seasonYearById.get(past.season_id) ?? 0;
    if (y < year - 1 || y > year || past.home_points === null || past.away_points === null)
      continue;
    for (const row of data.statsByMatch.get(past.id) ?? []) {
      if ((row.time_on_ground_pct ?? 0) <= 0 && (row.disposals ?? 0) <= 0) continue;
      teams.set(row.player_id, row.team_id);
      if (row.rating_points === null || row.rating_points === undefined) continue;
      if (!Number.isFinite(row.rating_points)) throw new Error("Non-finite player rating points");
      const value = Math.max(0, row.rating_points);
      const acc = ratings.get(row.player_id) ?? { sum: 0, n: 0 };
      acc.sum += value;
      acc.n++;
      ratings.set(row.player_id, acc);
      if (y === year - 1) {
        priorSum += value;
        priorN++;
      }
    }
  }
  if (!priorN || priorSum <= 0 || !lineup.length) return undefined;
  for (const player of data.lineupsByMatch.get(match.id) ?? []) {
    if (!player.is_emergency) teams.set(player.player_id, player.team_id);
  }
  const roster = [...teams].filter(([, team]) => team === teamId).map(([id]) => id);
  const leagueMean = priorSum / priorN;
  const rate = (id: number) => {
    const row = ratings.get(id);
    return ((row?.sum ?? 0) + 5 * leagueMean) / ((row?.n ?? 0) + 5);
  };
  const denominator = roster.reduce((sum, id) => sum + rate(id), 0);
  if (denominator <= 0) return undefined;
  return (rosterPav(roster) * lineup.reduce((sum, p) => sum + rate(p.player_id), 0)) / denominator;
}
