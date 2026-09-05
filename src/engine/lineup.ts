/** Prior-only lineup context for the registered PAV signal-shape experiments. */
import type { Config } from "../config/schema.js";
import type { MatchLineupRow, MatchRow } from "../data/types.js";
import type { HarnessData } from "./harness.js";
import type { PlayerPav } from "./pav.js";
import type { PriorPavMap } from "./prior.js";

export function positionRole(
  position: string | null,
): "forward" | "midfielder" | "defender" | "other" {
  if (["FF", "FPL", "FPR", "CHF", "HFFL", "HFFR"].includes(position ?? "")) return "forward";
  if (["FB", "BPL", "BPR", "CHB", "HBFL", "HBFR"].includes(position ?? "")) return "defender";
  if (["C", "WL", "WR", "R", "RR", "RK"].includes(position ?? "")) return "midfielder";
  return "other";
}

export interface LineupContext {
  priorOverrides: PriorPavMap;
  togFactors: Map<number, number>;
  previousLineups: Map<number, MatchLineupRow[][]>;
}

/** Scan past fixtures only. Today's stats never enter a lineup adjustment. */
export function createLineupContext(
  data: HarnessData,
  match: MatchRow,
  priors: PriorPavMap,
  priorK: number | undefined,
): LineupContext {
  const year = data.seasonYearById.get(match.season_id);
  if (year === undefined) throw new Error("Lineup context requires the season year");
  const appearances = new Map<number, number>();
  const positions = new Map<number, Map<string, number>>();
  const togs = new Map<number, number[]>();
  const previousLineups = new Map<number, MatchLineupRow[][]>();
  for (const past of data.matches) {
    if (past.id === match.id) break;
    const pastYear = data.seasonYearById.get(past.season_id) ?? 0;
    if (pastYear < year - 1 || pastYear > year) continue;
    if (past.home_points === null || past.away_points === null) continue;
    const rows = data.statsByMatch.get(past.id) ?? [];
    for (const row of rows) {
      if ((row.time_on_ground_pct ?? 0) <= 0 && (row.disposals ?? 0) <= 0) continue;
      if (row.time_on_ground_pct !== null && row.time_on_ground_pct > 0) {
        const values = togs.get(row.player_id) ?? [];
        values.push(row.time_on_ground_pct);
        if (values.length > 5) values.shift();
        togs.set(row.player_id, values);
      }
      if (pastYear === year - 1) {
        appearances.set(row.player_id, (appearances.get(row.player_id) ?? 0) + 1);
        const roles = positions.get(row.player_id) ?? new Map<string, number>();
        const role = positionRole(row.player_position);
        roles.set(role, (roles.get(role) ?? 0) + 1);
        positions.set(row.player_id, roles);
      }
    }
    if (pastYear === year)
      for (const teamId of [past.home_team_id, past.away_team_id]) {
        if (teamId !== match.home_team_id && teamId !== match.away_team_id) continue;
        const lineups = previousLineups.get(teamId) ?? [];
        const named = (data.lineupsByMatch.get(past.id) ?? []).filter((p) => p.team_id === teamId);
        if (named.length) lineups.push(named);
        previousLineups.set(teamId, lineups);
      }
  }
  const modalRole = (id: number) =>
    [...(positions.get(id) ?? [])].sort(
      ([a, an], [b, bn]) => bn - an || a.localeCompare(b),
    )[0]?.[0] ?? "other";
  const cohort = new Map<string, { n: number; off: number; mid: number; def: number }>();
  for (const [id, prior] of priors)
    for (const role of [modalRole(id), "league"]) {
      const group = cohort.get(role) ?? { n: 0, off: 0, mid: 0, def: 0 };
      group.n++;
      group.off += prior.offPav;
      group.mid += prior.midPav;
      group.def += prior.defPav;
      cohort.set(role, group);
    }
  const priorOverrides: PriorPavMap = new Map();
  if (priorK !== undefined && priorK > 0) {
    const ids = new Set([
      ...priors.keys(),
      ...(data.lineupsByMatch.get(match.id) ?? []).map((p) => p.player_id),
    ]);
    for (const id of ids) {
      const prior = priors.get(id);
      const group = cohort.get(modalRole(id)) ?? cohort.get("league");
      if (!group || group.n === 0) continue;
      const n = prior ? (appearances.get(id) ?? 0) : 0;
      const offPav = (n * (prior?.offPav ?? 0) + (priorK * group.off) / group.n) / (n + priorK);
      const midPav = (n * (prior?.midPav ?? 0) + (priorK * group.mid) / group.n) / (n + priorK);
      const defPav = (n * (prior?.defPav ?? 0) + (priorK * group.def) / group.n) / (n + priorK);
      priorOverrides.set(id, { offPav, midPav, defPav, totalPav: offPav + midPav + defPav });
    }
  }
  return {
    priorOverrides,
    previousLineups,
    togFactors: new Map(
      [...togs].map(([id, values]) => [
        id,
        Math.max(0.5, Math.min(1.25, values.reduce((s, v) => s + v, 0) / values.length / 80)),
      ]),
    ),
  };
}

export function adjustLineupPav(
  pav: PlayerPav,
  player: MatchLineupRow,
  config: Config["pav"],
  context: LineupContext | undefined,
): PlayerPav {
  const weight = config.position_weight ?? 0;
  const zone = {
    forward: [1.5, 1, 0.5],
    defender: [0.5, 1, 1.5],
    midfielder: [0.75, 1.5, 0.75],
    other: [1, 1, 1],
  }[positionRole(player.position)];
  const tog = 1 + (config.tog_weight ?? 0) * ((context?.togFactors.get(player.player_id) ?? 1) - 1);
  const offPav = pav.offPav * (1 + weight * ((zone[0] ?? 1) - 1)) * tog;
  const midPav = pav.midPav * (1 + weight * ((zone[1] ?? 1) - 1)) * tog;
  const defPav = pav.defPav * (1 + weight * ((zone[2] ?? 1) - 1)) * tog;
  return { offPav, midPav, defPav, totalPav: offPav + midPav + defPav };
}
