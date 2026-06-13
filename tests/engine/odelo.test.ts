import { describe, expect, it } from "vitest";
import type { Config } from "../../src/config/schema.js";
import type { MatchRow } from "../../src/data/types.js";
import {
  applyOdRegression,
  createOdState,
  expectedScores,
  odImpliedRating,
  updateOd,
} from "../../src/engine/odelo.js";

const OD: NonNullable<Config["elo"]["od"]> = {
  weight: 0.5,
  k: 0.08,
  home_advantage_points: 10,
  initial_score: 85,
  regression_to_mean: 0.2,
};

function match(
  overrides: Partial<MatchRow> & Pick<MatchRow, "home_points" | "away_points">,
): MatchRow {
  return {
    id: overrides.id ?? 1,
    season_id: 1,
    date: "2024-01-01",
    local_time: null,
    round: "R1",
    round_number: 1,
    home_team_id: overrides.home_team_id ?? 1,
    away_team_id: overrides.away_team_id ?? 2,
    venue_id: 1,
    home_goals: overrides.home_goals ?? null,
    home_behinds: overrides.home_behinds ?? null,
    away_goals: overrides.away_goals ?? null,
    away_behinds: overrides.away_behinds ?? null,
    home_points: overrides.home_points,
    away_points: overrides.away_points,
  } as MatchRow;
}

describe("OD split ratings", () => {
  it("returns the cold-start expected scores for unknown teams", () => {
    const state = createOdState();
    const { home, away } = expectedScores(state, 1, 2, OD);
    // Both teams default to initial_score; HA splits the half-points each way.
    expect(home).toBeCloseTo(85 + 5, 10);
    expect(away).toBeCloseTo(85 - 5, 10);
  });

  it("attributes the score residual symmetrically to attack and concede", () => {
    const state = createOdState();
    // Home scores 100, expectation 90 → r_home = +10.
    // Away scores 70, expectation 80 → r_away = −10.
    updateOd(state, match({ home_points: 100, away_points: 70 }), OD);
    expect(state.attack.get(1)).toBeCloseTo(85 + 0.08 * 10, 10);
    expect(state.concede.get(2)).toBeCloseTo(85 + 0.08 * 10, 10);
    expect(state.attack.get(2)).toBeCloseTo(85 + 0.08 * -10, 10);
    expect(state.concede.get(1)).toBeCloseTo(85 + 0.08 * -10, 10);
  });

  it("is a no-op when actual scores equal expectation", () => {
    const state = createOdState();
    // With cold start, expectation = 90 home / 80 away (HA = 10).
    updateOd(state, match({ home_points: 90, away_points: 80 }), OD);
    expect(state.attack.get(1)).toBeCloseTo(85, 10);
    expect(state.attack.get(2)).toBeCloseTo(85, 10);
    expect(state.concede.get(1)).toBeCloseTo(85, 10);
    expect(state.concede.get(2)).toBeCloseTo(85, 10);
  });

  it("regresses each component toward the current league mean, not initial_score", () => {
    const state = createOdState();
    // Build two teams' attack at 90 and 100 → mean 95. Regression 0.5
    // pulls each value halfway toward 95, NOT toward 85 (initial_score).
    state.attack.set(1, 90);
    state.attack.set(2, 100);
    state.concede.set(1, 80); // mean of concede = 80 (just one team)
    applyOdRegression(state, 0.5);
    expect(state.attack.get(1)).toBeCloseTo(92.5, 10);
    expect(state.attack.get(2)).toBeCloseTo(97.5, 10);
    expect(state.concede.get(1)).toBeCloseTo(80, 10); // mean == value → unchanged
  });

  it("falls back to actual points when shot_score_weight is set but goals/behinds are null", () => {
    const state = createOdState();
    const odShots: NonNullable<Config["elo"]["od"]> = { ...OD, shot_score_weight: 0.5 };
    // No goals/behinds → must use points, same residual as plain update.
    updateOd(state, match({ home_points: 100, away_points: 70 }), odShots);
    expect(state.attack.get(1)).toBeCloseTo(85 + 0.08 * 10, 10);
  });

  it("blends actual points with shot-implied points under shot_score_weight", () => {
    const state = createOdState();
    const odShots: NonNullable<Config["elo"]["od"]> = { ...OD, shot_score_weight: 1.0 };
    // Pure shot-implied: shots × 3.64.
    updateOd(
      state,
      match({
        home_points: 100,
        away_points: 70,
        home_goals: 10,
        home_behinds: 10,
        away_goals: 5,
        away_behinds: 5,
      }),
      odShots,
    );
    // home implied = 20 × 3.64 = 72.8 (vs actual 100); residual = 72.8 − 90 = −17.2
    expect(state.attack.get(1)).toBeCloseTo(85 + 0.08 * (72.8 - 90), 10);
  });

  it("odImpliedRating round-trip: rating-diff × margin_per_rating_point reproduces the OD margin ex-HA", () => {
    const state = createOdState();
    state.attack.set(1, 90);
    state.concede.set(1, 80); // team 1 net +10
    state.attack.set(2, 80);
    state.concede.set(2, 90); // team 2 net −10
    // Pair-wise OD margin (ex-HA) = ((90-80) - (80-90)) / 2 = 10.
    const r1 = odImpliedRating(state, 1, OD, 0.07, 1500);
    const r2 = odImpliedRating(state, 2, OD, 0.07, 1500);
    expect((r1 - r2) * 0.07).toBeCloseTo(10, 10);
  });
});
