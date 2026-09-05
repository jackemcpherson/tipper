import { describe, expect, it } from "vitest";
import type { Config } from "../../src/config/schema.js";
import type { MatchLineupRow, MatchRow } from "../../src/data/types.js";
import {
  buildRegressionTargets,
  type HarnessData,
  runHarness,
  runPredict,
} from "../../src/engine/harness.js";

/**
 * Elo-only config (weight_elo = 1) so the fixture needs no lineups,
 * stats, or prior PAV — the leak-freedom property under test lives in
 * the predict-then-update ordering, not in PAV plumbing.
 */
function eloOnlyConfig(): Config {
  return {
    id: "harness-test",
    schema_version: 1,
    elo: {
      k: 24,
      initial_rating: 1500,
      home_advantage: 35,
      regression_to_mean: 0.25,
      mov_multiplier: "538_log",
      k_context_sensitivity: 0,
      k_context_window: 8,
      home_advantage_source: "static",
    },
    pav: {
      computation: "round_by_round_cumulative",
      prior_weight_k: 8,
      prior_source: "previous_season_final",
      missing_player_default: 0,
      include: "named_lineup_excl_emerg",
    },
    blend: { weight_elo: 1, pav_calibration_slope: 7, where: "team_rating" },
    output: { margin_per_rating_point: 0.75, sigma: 36 },
    backtest: { train_seasons: [2024], test_seasons: [2025], walk_forward: true },
  };
}

function matchRow(overrides: Partial<MatchRow> & Pick<MatchRow, "id">): MatchRow {
  return {
    season_id: 2,
    round: "R1",
    round_number: 1,
    round_type: "Regular",
    date: "2025-03-15",
    local_time: "19:30",
    venue_id: 1,
    home_team_id: 1,
    away_team_id: 2,
    home_goals: 10,
    home_behinds: 10,
    home_points: 70,
    away_goals: 1,
    away_behinds: 4,
    away_points: 10,
    margin: 60,
    attendance: null,
    external_afl_id: null,
    ...overrides,
  };
}

function harnessData(matches: MatchRow[]): HarnessData {
  return {
    matches,
    lineupsByMatch: new Map(),
    statsByMatch: new Map(),
    priorPavBySeason: new Map(),
    teamNames: new Map([
      [1, "Alpha"],
      [2, "Beta"],
    ]),
    venueNames: new Map([[1, "Test Oval"]]),
    dobByPlayerId: new Map(),
    seasonYearById: new Map([
      [1, 2024],
      [2, 2025],
    ]),
  };
}

const TEST_SEASON = new Set([2]);
const TRAIN_SEASON = new Set([1]);

describe("campaign boundary repairs", () => {
  it("defers PAV evidence until the next date in both entry points", () => {
    const cfg = eloOnlyConfig();
    cfg.blend.weight_elo = 0;
    cfg.pav.missing_player_default = 10;
    const data = harnessData([
      matchRow({ id: 1, round_number: 1 }),
      matchRow({ id: 2, round_number: 2 }),
      matchRow({ id: 3, round_number: 3, date: "2025-03-16" }),
    ]);
    for (const m of data.matches)
      data.lineupsByMatch.set(m.id, [
        {
          id: m.id,
          match_id: m.id,
          team_id: 1,
          player_id: 11,
          guernsey_number: 11,
          position: "C",
          is_emergency: 0,
          is_substitute: 0,
        },
      ]);
    const legacy = runHarness(data, cfg, TRAIN_SEASON, TEST_SEASON).predictions;
    cfg.pav.update_timing = "previous_day";
    const delayed = runHarness(data, cfg, TRAIN_SEASON, TEST_SEASON).predictions;
    expect(delayed[0]).toEqual(legacy[0]);
    expect(delayed[1]?.homePavTotal).toBe(10);
    expect(delayed[1]?.homePavTotal).not.toBe(legacy[1]?.homePavTotal);
    expect(delayed[2]).toEqual(legacy[2]);
    expect(runPredict(data, cfg, 2, 2).predictions).toEqual([delayed[1]]);
    expect(runPredict(data, cfg, 3, 2).predictions).toEqual([delayed[2]]);
  });
  it("restores the unadjusted age prior after R4 in both entry points", () => {
    const cfg = eloOnlyConfig();
    cfg.blend.weight_elo = 0;
    cfg.pav.age_curve_weight = 0.5;
    cfg.pav.age_curve_max_round = 4;
    const data = harnessData([
      matchRow({ id: 1, round_number: 4 }),
      matchRow({ id: 2, round_number: 5, date: "2025-03-22" }),
    ]);
    data.dobByPlayerId.set(11, "2005-01-01");
    data.priorPavBySeason.set(1, [
      {
        id: 1,
        season_id: 1,
        player_id: 11,
        team_id: 1,
        off_pav: 10,
        mid_pav: 10,
        def_pav: 10,
        total_pav: 30,
      },
    ]);
    for (const m of data.matches)
      data.lineupsByMatch.set(m.id, [
        {
          match_id: m.id,
          team_id: 1,
          player_id: 11,
          position: "C",
          is_emergency: 0,
          is_substitute: 0,
        },
      ]);
    const adjusted = runHarness(data, cfg, TRAIN_SEASON, TEST_SEASON).predictions;
    const control = structuredClone(cfg);
    delete control.pav.age_curve_weight;
    const unadjusted = runHarness(data, control, TRAIN_SEASON, TEST_SEASON).predictions;
    expect(adjusted[0]?.predictedMargin).not.toBe(unadjusted[0]?.predictedMargin);
    expect(adjusted[1]).toEqual(unadjusted[1]);
    expect(runPredict(data, cfg, 5, 2).predictions).toEqual([unadjusted[1]]);
  });
  it("leaves close margins untouched and caps tail offsets before a sign flip", () => {
    const cfg = eloOnlyConfig();
    cfg.elo.k = 1e-9;
    cfg.output.prediction_home_advantage = 80;
    cfg.output.team_offset = { k: 0.1, season_carry: 1, tail_threshold: 24 };
    const data = harnessData([
      matchRow({ id: 1, home_points: 0, away_points: 200 }),
      matchRow({ id: 2, date: "2025-03-22", round_number: 2 }),
    ]);
    const tail = runHarness(data, cfg, new Set(), TEST_SEASON).predictions;
    expect(tail[1]?.predictedMargin).toBeGreaterThan(0);
    expect(tail[1]?.predictedMargin).toBeLessThan(1e-7);
    cfg.output.prediction_home_advantage = 10;
    const close = runHarness(data, cfg, new Set(), TEST_SEASON).predictions;
    delete cfg.output.team_offset;
    const control = runHarness(data, cfg, new Set(), TEST_SEASON).predictions;
    expect(close).toEqual(control);
  });

  it("applies finals HA only outside regular-season games", () => {
    const cfg = eloOnlyConfig();
    cfg.output.prediction_home_advantage = 80;
    cfg.output.finals_home_advantage = 0;
    const regular = runHarness(harnessData([matchRow({ id: 1 })]), cfg, new Set(), TEST_SEASON);
    const finals = runHarness(
      harnessData([matchRow({ id: 1, round_type: "Final" })]),
      cfg,
      new Set(),
      TEST_SEASON,
    );
    expect(regular.predictions[0]?.predictedMargin).toBe(60);
    expect(finals.predictions[0]?.predictedMargin).toBe(0);
  });

  it("clears a stale prior in both prediction entry points", () => {
    const cfg = eloOnlyConfig();
    cfg.blend.weight_elo = 0;
    const matches = [
      matchRow({ id: 1, season_id: 1, date: "2024-03-15" }),
      matchRow({ id: 2, season_id: 2 }),
    ];
    const data = harnessData(matches);
    data.seasonYearById.set(0, 2023);
    data.priorPavBySeason.set(0, [
      {
        id: 1,
        player_id: 10,
        season_id: 0,
        team_id: 1,
        off_pav: 10,
        mid_pav: 10,
        def_pav: 10,
        total_pav: 30,
      },
    ]);
    for (const match of matches)
      data.lineupsByMatch.set(match.id, [
        {
          id: match.id,
          match_id: match.id,
          player_id: 10,
          team_id: 1,
          guernsey_number: 1,
          position: "C",
          is_emergency: 0,
          is_substitute: 0,
        },
      ]);
    const back = runHarness(data, cfg, new Set(), new Set([1, 2])).predictions;
    expect(back[0]?.homePavTotal).toBe(30);
    expect(back[1]?.homePavTotal).toBe(0);
    expect(runPredict(data, cfg, 1, 2).predictions[0]?.homePavTotal).toBe(0);
  });

  it("does not learn live offsets from Elo-only training matches", () => {
    const cfg = eloOnlyConfig();
    cfg.output.team_offset = { k: 5, season_carry: 1 };
    cfg.output.prediction_home_advantage_per_venue = { alpha: 1, min_n: 0 };
    const data = harnessData([
      matchRow({ id: 1, season_id: 1, date: "2024-03-15" }),
      matchRow({ id: 2, season_id: 2 }),
    ]);
    const back = runHarness(data, cfg, TRAIN_SEASON, TEST_SEASON).predictions;
    expect(runPredict(data, cfg, 1, 2).predictions).toEqual(back);
  });
});

describe("runHarness walk-forward ordering (TST-02)", () => {
  it("predicts each match before ingesting its own result (no leakage)", () => {
    // Three blowout wins for the home side. If the harness leaked —
    // updating Elo before predicting — match 1's prediction would already
    // favour the home team beyond static home advantage.
    const matches = [
      matchRow({ id: 101, round_number: 1, date: "2025-03-15" }),
      matchRow({ id: 102, round_number: 2, date: "2025-03-22" }),
      matchRow({ id: 103, round_number: 3, date: "2025-03-29" }),
    ];

    const result = runHarness(harnessData(matches), eloOnlyConfig(), new Set(), TEST_SEASON);
    expect(result.predictions).toHaveLength(3);

    // Match 1: both teams must still be at the initial rating.
    const first = result.predictions[0];
    expect(first?.homeElo).toBe(1500);
    expect(first?.awayElo).toBe(1500);

    // Later matches see strictly diverging ratings from earlier results
    // only — never their own.
    const second = result.predictions[1];
    const third = result.predictions[2];
    expect(second?.homeElo).toBeGreaterThan(1500);
    expect(second?.awayElo).toBeLessThan(1500);
    expect(third?.homeElo).toBeGreaterThan(second?.homeElo ?? Number.POSITIVE_INFINITY);
  });

  it("produces identical early predictions regardless of later matches (causality)", () => {
    const one = runHarness(
      harnessData([matchRow({ id: 101 })]),
      eloOnlyConfig(),
      new Set(),
      TEST_SEASON,
    );
    const three = runHarness(
      harnessData([
        matchRow({ id: 101 }),
        matchRow({ id: 102, round_number: 2, date: "2025-03-22" }),
        matchRow({ id: 103, round_number: 3, date: "2025-03-29" }),
      ]),
      eloOnlyConfig(),
      new Set(),
      TEST_SEASON,
    );

    expect(three.predictions[0]).toEqual(one.predictions[0]);
  });

  it("warms state on train seasons without emitting predictions", () => {
    const matches = [
      matchRow({ id: 11, season_id: 1, date: "2024-03-16" }),
      matchRow({ id: 12, season_id: 1, round_number: 2, date: "2024-03-23" }),
      matchRow({ id: 101, season_id: 2, date: "2025-03-15" }),
    ];

    const result = runHarness(harnessData(matches), eloOnlyConfig(), TRAIN_SEASON, TEST_SEASON);

    // Only the test-season match predicted; train results warmed Elo, so
    // the home side enters season 2 above the initial rating despite
    // boundary regression.
    expect(result.predictions).toHaveLength(1);
    expect(result.predictions[0]?.matchId).toBe(101);
    expect(result.predictions[0]?.homeElo).toBeGreaterThan(1500);
  });

  it("skips incomplete matches without predicting or updating", () => {
    const matches = [
      matchRow({ id: 101, home_points: null, away_points: null, margin: null }),
      matchRow({ id: 102, round_number: 2, date: "2025-03-22" }),
    ];

    const result = runHarness(harnessData(matches), eloOnlyConfig(), new Set(), TEST_SEASON);
    expect(result.predictions).toHaveLength(1);
    expect(result.predictions[0]?.matchId).toBe(102);
    // The unplayed match contributed nothing to state.
    expect(result.predictions[0]?.homeElo).toBe(1500);
  });

  it('throws loudly for the unimplemented "actually_played" include mode (COR-13)', () => {
    // The mode stays in the schema so old configs still load — but it used
    // to silently behave as named_lineup_excl_emerg. It must now fail fast.
    const base = eloOnlyConfig();
    const config: Config = {
      ...base,
      pav: { ...base.pav, include: "actually_played" },
    };

    expect(() =>
      runHarness(harnessData([matchRow({ id: 101 })]), config, new Set(), TEST_SEASON),
    ).toThrow(/actually_played.*not implemented/);
  });
});

describe("buildRegressionTargets (Task 23)", () => {
  function lineupRow(matchId: number, teamId: number, playerId: number): MatchLineupRow {
    return {
      id: playerId,
      match_id: matchId,
      player_id: playerId,
      team_id: teamId,
      guernsey_number: null,
      position: null,
      is_emergency: 0,
      is_substitute: 0,
    };
  }

  function targetsConfig(weight: number): Config {
    const base = eloOnlyConfig();
    return {
      ...base,
      elo: { ...base.elo, regression_pav_target_weight: weight },
      pav: { ...base.pav, missing_player_default: 6 },
    };
  }

  // Team 1's first 2025 match is 101, team 2's is also 101.
  const firstMatchByTeam = new Map([
    [
      2,
      new Map([
        [1, 101],
        [2, 101],
      ]),
    ],
  ]);

  const lineupsByMatch = new Map([
    [
      101,
      [lineupRow(101, 1, 11), lineupRow(101, 1, 12), lineupRow(101, 2, 21), lineupRow(101, 2, 22)],
    ],
  ]);

  // Player 11 strong prior, others missing (default 6 → 2/zone).
  const priorPavMap = new Map([[11, { offPav: 10, midPav: 10, defPav: 10, totalPav: 30 }]]);

  it("returns undefined when the config field is absent", () => {
    expect(
      buildRegressionTargets(2, firstMatchByTeam, lineupsByMatch, priorPavMap, eloOnlyConfig()),
    ).toBeUndefined();
  });

  it("mean-centres targets at 1500", () => {
    const targets = buildRegressionTargets(
      2,
      firstMatchByTeam,
      lineupsByMatch,
      priorPavMap,
      targetsConfig(1),
    );
    expect(targets).toBeDefined();
    // Team 1 pav = 30 + 6 = 36 → calibrated 252; team 2 pav = 12 → 84. Mean 168.
    expect(targets?.get(1)).toBe(1500 + (252 - 168));
    expect(targets?.get(2)).toBe(1500 + (84 - 168));
  });

  it("scales deviations by the weight", () => {
    const targets = buildRegressionTargets(
      2,
      firstMatchByTeam,
      lineupsByMatch,
      priorPavMap,
      targetsConfig(0.5),
    );
    expect(targets?.get(1)).toBe(1500 + 0.5 * 84);
    expect(targets?.get(2)).toBe(1500 - 0.5 * 84);
  });

  it("with weight 0, all targets are exactly 1500", () => {
    const targets = buildRegressionTargets(
      2,
      firstMatchByTeam,
      lineupsByMatch,
      priorPavMap,
      targetsConfig(0),
    );
    expect(targets?.get(1)).toBe(1500);
    expect(targets?.get(2)).toBe(1500);
  });

  it("skips teams with no lineup data (they regress to 1500 by default)", () => {
    const sparseLineups = new Map([[101, [lineupRow(101, 1, 11)]]]);
    const targets = buildRegressionTargets(
      2,
      firstMatchByTeam,
      sparseLineups,
      priorPavMap,
      targetsConfig(1),
    );
    // Only team 1 has a lineup → its pav is the mean → target 1500.
    expect(targets?.get(1)).toBe(1500);
    expect(targets?.has(2)).toBe(false);
  });

  it("returns undefined when no team has lineup data", () => {
    expect(
      buildRegressionTargets(2, firstMatchByTeam, new Map(), priorPavMap, targetsConfig(1)),
    ).toBeUndefined();
  });
});
