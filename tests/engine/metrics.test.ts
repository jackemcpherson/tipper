import { describe, expect, it } from "vitest";
import { computeCalibration, computeMetrics } from "../../src/engine/metrics.js";
import type { MatchPrediction } from "../../src/types.js";

function prediction(overrides: Partial<MatchPrediction> = {}): MatchPrediction {
  return {
    matchId: 1,
    date: "2025-03-15",
    round: "R1",
    roundNumber: 1,
    home: "Alpha",
    away: "Beta",
    venue: "Test Oval",
    homeTeamRating: 1535,
    awayTeamRating: 1500,
    homeElo: 1535,
    awayElo: 1500,
    homePavTotal: 0,
    awayPavTotal: 0,
    predictedMargin: 10,
    predictedWinner: "home",
    winProbability: { home: 0.6, away: 0.4 },
    actualMargin: 20,
    actualWinner: "home",
    correct: true,
    ...overrides,
  };
}

describe("computeMetrics", () => {
  it("returns zeroed metrics for an empty set", () => {
    expect(computeMetrics([]).matches).toBe(0);
  });

  it("counts tips over decisive matches only (draws excluded)", () => {
    const predictions = [
      prediction({ matchId: 1, correct: true }),
      prediction({ matchId: 2, correct: false, actualWinner: "away", actualMargin: -5 }),
      prediction({ matchId: 3, actualMargin: 0, actualWinner: "draw", correct: undefined }),
    ];
    const metrics = computeMetrics(predictions);
    expect(metrics.matches).toBe(3);
    expect(metrics.tips).toBe(1);
    expect(metrics.tipPct).toBeCloseTo(0.5); // 1 of 2 decisive
  });

  it("computes MAE and RMSE from margin errors", () => {
    const predictions = [
      prediction({ matchId: 1, predictedMargin: 10, actualMargin: 20 }), // error -10
      prediction({ matchId: 2, predictedMargin: 10, actualMargin: 0 }), // error +10
    ];
    const metrics = computeMetrics(predictions);
    expect(metrics.maeMargin).toBeCloseTo(10);
    expect(metrics.rmseMargin).toBeCloseTo(10);
  });

  it("ignores predictions without actuals", () => {
    const metrics = computeMetrics([
      prediction(),
      prediction({
        matchId: 99,
        actualMargin: undefined,
        actualWinner: undefined,
        correct: undefined,
      }),
    ]);
    expect(metrics.matches).toBe(1);
  });

  it("clamps probabilities before log loss so a certain miss stays finite", () => {
    const metrics = computeMetrics([
      prediction({
        winProbability: { home: 1, away: 0 },
        actualWinner: "away",
        actualMargin: -1,
        correct: false,
      }),
    ]);
    expect(Number.isFinite(metrics.logLossBits)).toBe(true);
  });
});

describe("computeCalibration", () => {
  it("buckets predictions by favourite probability", () => {
    const buckets = computeCalibration([
      prediction({ winProbability: { home: 0.62, away: 0.38 } }),
      prediction({ matchId: 2, winProbability: { home: 0.65, away: 0.35 } }),
    ]);
    const total = buckets.reduce((sum, b) => sum + b.n, 0);
    expect(total).toBe(2);
  });
});
