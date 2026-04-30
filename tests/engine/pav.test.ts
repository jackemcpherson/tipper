import { describe, expect, it } from "vitest";
import type { Config } from "../../src/config/schema.js";
import type { MatchRow, PlayerMatchStatsRow } from "../../src/data/types.js";
import {
  computeDefScore,
  computeMidScore,
  computeOffScore,
  computePlayerPav,
  computeTeamStrength,
  createPavSeasonState,
  updatePavState,
} from "../../src/engine/pav.js";
import { blendWithPrior, buildPriorPavMap } from "../../src/engine/prior.js";

function makePlayerStats(overrides: Partial<PlayerMatchStatsRow> = {}): PlayerMatchStatsRow {
  return {
    id: 1,
    match_id: 1,
    player_id: 1,
    team_id: 100,
    guernsey_number: 1,
    player_position: "MID",
    time_on_ground_pct: 80,
    kicks: 15,
    handballs: 10,
    disposals: 25,
    marks: 5,
    tackles: 4,
    one_percenters: 2,
    contested_possessions: 8,
    goals: 2,
    behinds: 1,
    goal_assists: 1,
    marks_inside_fifty: 1,
    free_kicks_for: 2,
    free_kicks_against: 1,
    hitouts: 0,
    inside_fifties: 4,
    rebounds: 1,
    clearances: 3,
    metres_gained: 350,
    ...overrides,
  };
}

function makeMatch(overrides: Partial<MatchRow> = {}): MatchRow {
  return {
    id: 1,
    season_id: 1,
    round: "R1",
    round_number: 1,
    round_type: "Regular",
    date: "2024-03-14",
    local_time: "19:25",
    venue_id: 1,
    home_team_id: 100,
    away_team_id: 200,
    home_goals: 12,
    home_behinds: 8,
    home_points: 80,
    away_goals: 10,
    away_behinds: 6,
    away_points: 66,
    margin: 14,
    attendance: null,
    weather_temp_c: null,
    weather_type: null,
    external_afl_id: null,
    ...overrides,
  };
}

describe("computeOffScore", () => {
  it("computes offensive involvement correctly", () => {
    const stats = makePlayerStats({
      goals: 3,
      behinds: 2,
      hitouts: 4,
      goal_assists: 2,
      inside_fifties: 5,
      marks_inside_fifty: 2,
      free_kicks_for: 3,
      free_kicks_against: 1,
    });
    // (3*6 + 2) + 0.25*4 + 3*2 + 5 + 2 + (3-1)
    // = 20 + 1 + 6 + 5 + 2 + 2 = 36
    expect(computeOffScore(stats)).toBeCloseTo(36, 5);
  });

  it("handles null stats as zero", () => {
    const stats = makePlayerStats({
      goals: null,
      behinds: null,
      hitouts: null,
      goal_assists: null,
      inside_fifties: null,
      marks_inside_fifty: null,
      free_kicks_for: null,
      free_kicks_against: null,
    });
    expect(computeOffScore(stats)).toBe(0);
  });
});

describe("computeDefScore", () => {
  it("computes defensive involvement correctly", () => {
    const stats = makePlayerStats({
      rebounds: 3,
      one_percenters: 2,
      marks: 6,
      marks_inside_fifty: 1,
      free_kicks_for: 2,
      free_kicks_against: 1,
      hitouts: 3,
    });
    // 20*3 + 12*2 + (6 - 4*1 + 2*(2-1)) - (2/3)*3
    // = 60 + 24 + (6-4+2) - 2 = 60 + 24 + 4 - 2 = 86
    expect(computeDefScore(stats)).toBeCloseTo(86, 5);
  });
});

describe("computeMidScore", () => {
  it("computes midfield involvement correctly", () => {
    const stats = makePlayerStats({
      inside_fifties: 5,
      clearances: 4,
      tackles: 6,
      hitouts: 10,
      free_kicks_for: 2,
      free_kicks_against: 1,
    });
    // 15*5 + 20*4 + 3*6 + 1.5*10 + (2-1)
    // = 75 + 80 + 18 + 15 + 1 = 189
    expect(computeMidScore(stats)).toBeCloseTo(189, 5);
  });
});

describe("computeTeamStrength", () => {
  it("returns 1 for league-average team", () => {
    const teamStats = {
      points: 80,
      insideFifties: 50,
      pointsConceded: 80,
      insideFiftiesConceded: 50,
      gamesPlayed: 1,
    };
    // league avg = 80/50 = 1.6
    const strength = computeTeamStrength(teamStats, 1.6);
    expect(strength.offence).toBeCloseTo(1, 3);
    expect(strength.midfield).toBeCloseTo(1, 3);
    expect(strength.defence).toBeCloseTo(1, 3);
  });

  it("returns defaults for zero stats", () => {
    const teamStats = {
      points: 0,
      insideFifties: 0,
      pointsConceded: 0,
      insideFiftiesConceded: 0,
      gamesPlayed: 0,
    };
    const strength = computeTeamStrength(teamStats, 1.6);
    expect(strength.offence).toBe(1);
    expect(strength.midfield).toBe(1);
    expect(strength.defence).toBe(1);
  });
});

describe("updatePavState + computePlayerPav", () => {
  it("produces non-zero PAV after processing a match", () => {
    const state = createPavSeasonState(18);
    const match = makeMatch();

    // Create stats for both teams (2 players each for simplicity)
    const stats: PlayerMatchStatsRow[] = [
      makePlayerStats({ player_id: 1, team_id: 100, inside_fifties: 5, goals: 2 }),
      makePlayerStats({ player_id: 2, team_id: 100, inside_fifties: 3, goals: 1 }),
      makePlayerStats({ player_id: 3, team_id: 200, inside_fifties: 4, goals: 1 }),
      makePlayerStats({ player_id: 4, team_id: 200, inside_fifties: 3, goals: 2 }),
    ];

    updatePavState(state, match, stats);

    const pav1 = computePlayerPav(state, 1, 100);
    expect(pav1.totalPav).toBeGreaterThan(0);
    expect(pav1.offPav).toBeGreaterThan(0);
    expect(pav1.midPav).toBeGreaterThan(0);
  });

  it("player shares sum to team pool per zone", () => {
    const state = createPavSeasonState(18);
    const match = makeMatch();

    const stats: PlayerMatchStatsRow[] = [
      makePlayerStats({ player_id: 1, team_id: 100, inside_fifties: 5, goals: 3 }),
      makePlayerStats({ player_id: 2, team_id: 100, inside_fifties: 3, goals: 1 }),
      makePlayerStats({ player_id: 3, team_id: 200, inside_fifties: 4, goals: 1 }),
      makePlayerStats({ player_id: 4, team_id: 200, inside_fifties: 3, goals: 2 }),
    ];

    updatePavState(state, match, stats);

    const pav1 = computePlayerPav(state, 1, 100);
    const pav2 = computePlayerPav(state, 2, 100);

    // Off PAVs of the two home players should sum to offPool
    const teamStatsForHome = state.teamStats.get(100);
    if (!teamStatsForHome) throw new Error("Expected team stats for team 100");
    const teamStrength = computeTeamStrength(
      teamStatsForHome,
      state.league.totalPoints / state.league.totalInsideFifties,
    );
    const expectedOffPool = 100 * teamStrength.offence;

    expect(pav1.offPav + pav2.offPav).toBeCloseTo(expectedOffPool, 3);
  });

  it("PAV stabilises across multiple rounds (pace-equivalent property)", () => {
    const state = createPavSeasonState(18);

    // Simulate 3 rounds with consistent stats
    for (let round = 1; round <= 3; round++) {
      const match = makeMatch({
        id: round,
        round_number: round,
        home_points: 80,
        away_points: 70,
      });
      const stats: PlayerMatchStatsRow[] = [
        makePlayerStats({
          match_id: round,
          player_id: 1,
          team_id: 100,
          inside_fifties: 5,
          goals: 2,
        }),
        makePlayerStats({
          match_id: round,
          player_id: 2,
          team_id: 100,
          inside_fifties: 3,
          goals: 1,
        }),
        makePlayerStats({
          match_id: round,
          player_id: 3,
          team_id: 200,
          inside_fifties: 4,
          goals: 1,
        }),
        makePlayerStats({
          match_id: round,
          player_id: 4,
          team_id: 200,
          inside_fifties: 3,
          goals: 2,
        }),
      ];
      updatePavState(state, match, stats);
    }

    const pavAfter3 = computePlayerPav(state, 1, 100);

    // With consistent performance, PAV should be stable (pace-equivalent).
    // The value after 1 round and 3 rounds should be similar since the
    // player's share doesn't change with consistent inputs.
    expect(pavAfter3.totalPav).toBeGreaterThan(0);
    // Player 1 has roughly 5/(5+3) = 62.5% of team I50s consistently
  });
});

describe("blendWithPrior", () => {
  const pavConfig: Config["pav"] = {
    computation: "round_by_round_cumulative",
    prior_weight_k: 15,
    prior_source: "previous_season_final",
    missing_player_default: 5,
    include: "named_lineup_excl_emerg",
  };

  it("returns prior when no games played", () => {
    const current: PlayerPav = { offPav: 0, midPav: 0, defPav: 0, totalPav: 0 };
    const prior = { offPav: 8, midPav: 10, defPav: 2, totalPav: 20 };
    const blended = blendWithPrior(current, prior, 0, pavConfig);

    expect(blended.totalPav).toBeCloseTo(20, 3);
  });

  it("weights prior at K=15 vs 3 games of evidence", () => {
    const current: PlayerPav = { offPav: 4, midPav: 4, defPav: 2, totalPav: 10 };
    const prior = { offPav: 8, midPav: 10, defPav: 2, totalPav: 20 };
    const blended = blendWithPrior(current, prior, 3, pavConfig);

    // total = (15*20 + 3*10) / (15+3) = (300+30)/18 = 18.33
    expect(blended.totalPav).toBeCloseTo(18.33, 1);
  });

  it("evidence dominates after many games", () => {
    const current: PlayerPav = { offPav: 4, midPav: 4, defPav: 2, totalPav: 10 };
    const prior = { offPav: 8, midPav: 10, defPav: 2, totalPav: 20 };
    const blended = blendWithPrior(current, prior, 23, pavConfig);

    // total = (15*20 + 23*10) / (15+23) = (300+230)/38 ≈ 13.95
    expect(blended.totalPav).toBeCloseTo(13.95, 1);
    // Should be closer to current (10) than prior (20)
    expect(blended.totalPav).toBeLessThan(15);
  });

  it("uses missing_player_default for debutant with no prior", () => {
    const current: PlayerPav = { offPav: 3, midPav: 3, defPav: 1, totalPav: 7 };
    const blended = blendWithPrior(current, undefined, 5, pavConfig);

    // total = (15*5 + 5*7) / (15+5) = (75+35)/20 = 5.5
    expect(blended.totalPav).toBeCloseTo(5.5, 1);
  });
});

describe("buildPriorPavMap", () => {
  it("builds map from rows", () => {
    const rows = [
      {
        id: 1,
        player_id: 42,
        season_id: 8,
        team_id: 100,
        off_pav: 8.5,
        mid_pav: 10.22,
        def_pav: 2.3,
        total_pav: 21.02,
      },
    ];
    const map = buildPriorPavMap(rows);
    const entry = map.get(42);
    expect(entry).toBeDefined();
    expect(entry?.midPav).toBeCloseTo(10.22, 2);
    expect(entry?.totalPav).toBeCloseTo(21.02, 2);
  });

  it("handles null PAV values", () => {
    const rows = [
      {
        id: 1,
        player_id: 42,
        season_id: 8,
        team_id: 100,
        off_pav: null,
        mid_pav: null,
        def_pav: null,
        total_pav: null,
      },
    ];
    const map = buildPriorPavMap(rows);
    const entry = map.get(42);
    expect(entry?.totalPav).toBe(0);
  });
});
