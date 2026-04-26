import { beforeEach, describe, expect, it } from "vitest";
import type { Config } from "../../src/config/schema.js";
import type { MatchRow } from "../../src/data/types.js";
import {
  type EloState,
  applyRegression,
  computeExpected,
  computeMovMultiplier,
  getRating,
  updateElo,
} from "../../src/engine/elo.js";

const DEFAULT_ELO_CONFIG: Config["elo"] = {
  k: 20,
  initial_rating: 1500,
  home_advantage: 30,
  regression_to_mean: 0.33,
  mov_multiplier: "538_log",
};

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
    home_goals: 10,
    home_behinds: 8,
    home_points: 68,
    away_goals: 8,
    away_behinds: 6,
    away_points: 54,
    margin: 14,
    attendance: null,
    weather_temp_c: null,
    weather_type: null,
    external_afl_id: null,
    ...overrides,
  };
}

describe("computeExpected", () => {
  it("returns 0.5 for equal ratings with no home advantage", () => {
    expect(computeExpected(1500, 1500, 0)).toBeCloseTo(0.5, 5);
  });

  it("returns > 0.5 for equal ratings with home advantage", () => {
    const expected = computeExpected(1500, 1500, 30);
    // expected = 1 / (1 + 10^(-30/400)) ≈ 0.5432
    expect(expected).toBeCloseTo(0.5432, 3);
  });

  it("returns ~0.679 for 100-point Elo advantage + home advantage", () => {
    // home=1550, away=1450, ha=30: effective diff = 130
    // expected = 1 / (1 + 10^(-130/400)) ≈ 0.6788
    const expected = computeExpected(1550, 1450, 30);
    expect(expected).toBeCloseTo(0.6788, 3);
  });

  it("returns ~0.36 for 100-point Elo disadvantage + home advantage", () => {
    // home=1450, away=1550, ha=30: effective diff = -70
    // expected = 1 / (1 + 10^(70/400)) ≈ 0.4003
    const expected = computeExpected(1450, 1550, 30);
    expect(expected).toBeCloseTo(0.4003, 3);
  });
});

describe("computeMovMultiplier", () => {
  it("returns correct value for a 30-point margin with equal teams", () => {
    // log(30+1) * 2.2 / (0 * 0.001 + 2.2)
    // = log(31) * 2.2 / 2.2
    // = log(31) ≈ 3.434
    const mult = computeMovMultiplier(30, 0);
    expect(mult).toBeCloseTo(Math.log(31), 4);
  });

  it("dampens multiplier when favourite wins", () => {
    // margin=30, winner ahead by 100 Elo
    // log(31) * 2.2 / (100 * 0.001 + 2.2)
    // = 3.434 * 2.2 / 2.3 ≈ 3.285
    const mult = computeMovMultiplier(30, 100);
    expect(mult).toBeCloseTo((Math.log(31) * 2.2) / 2.3, 3);
    expect(mult).toBeLessThan(computeMovMultiplier(30, 0));
  });

  it("amplifies multiplier when underdog wins", () => {
    // margin=30, winner behind by 100 Elo (ratingDiff = -100)
    // log(31) * 2.2 / (-100 * 0.001 + 2.2)
    // = 3.434 * 2.2 / 2.1 ≈ 3.597
    const mult = computeMovMultiplier(30, -100);
    expect(mult).toBeCloseTo((Math.log(31) * 2.2) / 2.1, 3);
    expect(mult).toBeGreaterThan(computeMovMultiplier(30, 0));
  });

  it("returns ~0 for a 0-point margin (draw)", () => {
    // log(0+1) * 2.2 / (0 * 0.001 + 2.2) = 0
    expect(computeMovMultiplier(0, 0)).toBeCloseTo(0, 5);
  });

  it("throws for non-finite result", () => {
    // ratingDiff = -2200 → denominator = -2200*0.001 + 2.2 = 0
    expect(() => computeMovMultiplier(30, -2200)).toThrow("non-finite");
  });
});

describe("getRating", () => {
  it("returns stored rating for known team", () => {
    const state: EloState = new Map([[100, 1600]]);
    expect(getRating(state, 100, 1500)).toBe(1600);
  });

  it("returns initial rating for unknown team", () => {
    const state: EloState = new Map();
    expect(getRating(state, 999, 1500)).toBe(1500);
  });
});

describe("updateElo", () => {
  let state: EloState;

  beforeEach(() => {
    state = new Map();
  });

  it("updates ratings for a home win", () => {
    const match = makeMatch({
      home_points: 80,
      away_points: 60,
      margin: 20,
    });

    const result = updateElo(state, match, DEFAULT_ELO_CONFIG);

    // Home started at 1500, won → should go up
    expect(result.homeNewRating).toBeGreaterThan(1500);
    // Away started at 1500, lost → should go down
    expect(result.awayNewRating).toBeLessThan(1500);
    // State is mutated
    expect(state.get(100)).toBe(result.homeNewRating);
    expect(state.get(200)).toBe(result.awayNewRating);
  });

  it("updates ratings for an away win", () => {
    const match = makeMatch({
      home_points: 50,
      away_points: 80,
      margin: -30,
    });

    const result = updateElo(state, match, DEFAULT_ELO_CONFIG);

    // Home lost → should go down
    expect(result.homeNewRating).toBeLessThan(1500);
    // Away won → should go up
    expect(result.awayNewRating).toBeGreaterThan(1500);
  });

  it("handles a draw (MOV multiplier is 0 for 0-margin, so no change)", () => {
    // With 538_log MOV, a 0-margin draw has multiplier = log(0+1) = 0
    // So K × 0 × anything = 0 — ratings don't change.
    // This is correct: the MOV formula treats draws as zero-information events.
    const match = makeMatch({
      home_points: 70,
      away_points: 70,
      margin: 0,
    });

    const result = updateElo(state, match, DEFAULT_ELO_CONFIG);
    expect(result.homeNewRating).toBe(1500);
    expect(result.awayNewRating).toBe(1500);
    expect(result.movMultiplier).toBeCloseTo(0, 10);
  });

  it("handles a draw with mov_multiplier=none (ratings change)", () => {
    // Without MOV, multiplier is 1.0, so draws do change ratings
    const config: Config["elo"] = { ...DEFAULT_ELO_CONFIG, mov_multiplier: "none" };
    const match = makeMatch({
      home_points: 70,
      away_points: 70,
      margin: 0,
    });

    const result = updateElo(state, match, config);

    // Home expected > 0.5 (due to HA) but got 0.5 → drops
    expect(result.homeNewRating).toBeLessThan(1500);
    expect(result.awayNewRating).toBeGreaterThan(1500);
  });

  it("produces larger changes for bigger margins (MOV effect)", () => {
    const smallWin = makeMatch({ home_points: 70, away_points: 65, margin: 5 });
    const bigWin = makeMatch({ home_points: 100, away_points: 50, margin: 50 });

    const state1: EloState = new Map();
    const state2: EloState = new Map();

    const result1 = updateElo(state1, smallWin, DEFAULT_ELO_CONFIG);
    const result2 = updateElo(state2, bigWin, DEFAULT_ELO_CONFIG);

    const smallChange = Math.abs(result1.homeNewRating - 1500);
    const bigChange = Math.abs(result2.homeNewRating - 1500);
    expect(bigChange).toBeGreaterThan(smallChange);
  });

  it("throws for match with missing scores", () => {
    const match = makeMatch({ home_points: null, away_points: null });
    expect(() => updateElo(state, match, DEFAULT_ELO_CONFIG)).toThrow("missing scores");
  });

  it("preserves zero-sum property (ratings change by equal and opposite amounts)", () => {
    const match = makeMatch();
    const result = updateElo(state, match, DEFAULT_ELO_CONFIG);

    const homeChange = result.homeNewRating - result.homeRating;
    const awayChange = result.awayNewRating - result.awayRating;
    expect(homeChange + awayChange).toBeCloseTo(0, 10);
  });

  it("uses no MOV multiplier when configured as none", () => {
    const config: Config["elo"] = { ...DEFAULT_ELO_CONFIG, mov_multiplier: "none" };
    const match = makeMatch({ home_points: 100, away_points: 50, margin: 50 });

    const result = updateElo(state, match, config);
    expect(result.movMultiplier).toBe(1.0);
  });
});

describe("applyRegression", () => {
  it("regresses all teams toward 1500", () => {
    const state: EloState = new Map([
      [1, 1600],
      [2, 1400],
      [3, 1500],
    ]);

    applyRegression(state, 0.33);

    // 1600 + 0.33 * (1500 - 1600) = 1600 - 33 = 1567
    expect(state.get(1)).toBeCloseTo(1567, 0);
    // 1400 + 0.33 * (1500 - 1400) = 1400 + 33 = 1433
    expect(state.get(2)).toBeCloseTo(1433, 0);
    // 1500 + 0.33 * (1500 - 1500) = 1500
    expect(state.get(3)).toBe(1500);
  });

  it("with factor 0, no change", () => {
    const state: EloState = new Map([[1, 1600]]);
    applyRegression(state, 0);
    expect(state.get(1)).toBe(1600);
  });

  it("with factor 1, all ratings become 1500", () => {
    const state: EloState = new Map([
      [1, 1600],
      [2, 1200],
    ]);
    applyRegression(state, 1);
    expect(state.get(1)).toBe(1500);
    expect(state.get(2)).toBe(1500);
  });
});
