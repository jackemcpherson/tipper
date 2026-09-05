import { describe, expect, it } from "vitest";
import configJson from "../../configs/predha-080/config.json";
import { ConfigSchema } from "../../src/config/schema.js";
import type { MatchLineupRow, MatchRow, PlayerMatchStatsRow } from "../../src/data/types.js";
import type { HarnessData } from "../../src/engine/harness.js";
import { adjustLineupPav, createLineupContext, positionRole } from "../../src/engine/lineup.js";

function match(id: number, year: number): MatchRow {
  return {
    id,
    season_id: year,
    round: "R1",
    round_number: 1,
    round_type: "Regular",
    date: `${year}-03-15`,
    local_time: "19:30",
    venue_id: 1,
    home_team_id: 1,
    away_team_id: 2,
    home_points: 70,
    away_points: 50,
    home_goals: 10,
    home_behinds: 10,
    away_goals: 7,
    away_behinds: 8,
    margin: 20,
    attendance: null,
    external_afl_id: null,
  };
}
function stats(matchId: number, player: number, tog: number): PlayerMatchStatsRow {
  return {
    id: player,
    match_id: matchId,
    player_id: player,
    team_id: 1,
    guernsey_number: player,
    player_position: "FF",
    time_on_ground_pct: tog,
    kicks: 10,
    handballs: 0,
    disposals: 10,
    marks: 0,
    tackles: 0,
    one_percenters: 0,
    contested_possessions: 0,
    goals: 1,
    behinds: 0,
    goal_assists: 0,
    marks_inside_fifty: 0,
    free_kicks_for: 0,
    free_kicks_against: 0,
    hitouts: 0,
    inside_fifties: 0,
    rebounds: 0,
    clearances: 0,
    metres_gained: null,
  };
}
const player: MatchLineupRow = {
  id: 1,
  match_id: 3,
  team_id: 1,
  player_id: 1,
  guernsey_number: 1,
  position: "FF",
  is_emergency: 0,
  is_substitute: 0,
};

describe("prior-only lineup experiments", () => {
  it("maps named positions and leaves bench/unknown roles neutral", () => {
    expect(positionRole("FF")).toBe("forward");
    expect(positionRole("HBFL")).toBe("defender");
    expect(positionRole("RK")).toBe("midfielder");
    expect(positionRole("INT")).toBe("other");
    expect(positionRole(null)).toBe("other");
  });
  it("uses past appearances and previous-season cohorts, never today's or future stats", () => {
    const target = match(3, 2025);
    const data: HarnessData = {
      matches: [match(1, 2024), match(2, 2025), target, match(4, 2025)],
      lineupsByMatch: new Map([
        [2, [player]],
        [3, [player]],
      ]),
      statsByMatch: new Map([
        [1, [stats(1, 1, 40), stats(1, 2, 80)]],
        [2, [stats(2, 1, 80)]],
        [3, [stats(3, 1, 100)]],
        [4, [stats(4, 1, 100)]],
      ]),
      priorPavBySeason: new Map(),
      teamNames: new Map(),
      venueNames: new Map(),
      dobByPlayerId: new Map(),
      seasonYearById: new Map([
        [2024, 2024],
        [2025, 2025],
      ]),
    };
    const priors = new Map([
      [1, { offPav: 10, midPav: 0, defPav: 0, totalPav: 10 }],
      [2, { offPav: 30, midPav: 0, defPav: 0, totalPav: 30 }],
    ]);
    const context = createLineupContext(data, target, priors, 5);
    expect(context.togFactors.get(1)).toBe(0.75);
    expect(context.priorOverrides.get(1)?.offPav).toBeCloseTo(110 / 6, 12);
    expect(context.previousLineups.get(1)).toEqual([[player]]);
    data.statsByMatch.set(3, [stats(3, 1, 1)]);
    expect(createLineupContext(data, target, priors, 5)).toEqual(context);
  });
  it("interpolates zone weights and prior TOG without changing absent options", () => {
    const pav = { offPav: 10, midPav: 10, defPav: 10, totalPav: 30 };
    const cfg = ConfigSchema.parse(configJson).pav;
    expect(adjustLineupPav(pav, player, cfg, undefined)).toEqual(pav);
    expect(adjustLineupPav(pav, player, { ...cfg, position_weight: 1 }, undefined)).toEqual({
      offPav: 15,
      midPav: 10,
      defPav: 5,
      totalPav: 30,
    });
    expect(
      adjustLineupPav(
        pav,
        player,
        { ...cfg, tog_weight: 1 },
        { togFactors: new Map([[1, 0.5]]), priorOverrides: new Map(), previousLineups: new Map() },
      ).totalPav,
    ).toBe(15);
  });
});
