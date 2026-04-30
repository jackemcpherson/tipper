import { describe, expect, it } from "vitest";
import { bootstrapCompare } from "../../src/engine/metrics.js";
import type { MatchPrediction } from "../../src/types.js";

function makePrediction(
  matchId: number,
  predictedMargin: number,
  actualMargin: number,
): MatchPrediction {
  const homeWins = predictedMargin >= 0;
  const actualHomeWins = actualMargin > 0;
  const predictedWinner = homeWins ? "home" : "away";
  const actualWinner = actualMargin > 0 ? "home" : actualMargin < 0 ? "away" : "draw";
  const correct = actualWinner === "draw" ? undefined : predictedWinner === actualWinner;

  // Simple win probability from margin (not realistic but sufficient for tests)
  const homeProb = Math.max(0.01, Math.min(0.99, 0.5 + predictedMargin / 100));

  return {
    matchId,
    date: "2024-01-01",
    round: "R1",
    roundNumber: 1,
    home: "Home",
    away: "Away",
    venue: "Ground",
    homeTeamRating: 1500 + predictedMargin,
    awayTeamRating: 1500,
    homeElo: 1500 + predictedMargin,
    awayElo: 1500,
    homePavTotal: 0,
    awayPavTotal: 0,
    predictedMargin,
    predictedWinner,
    winProbability: { home: homeProb, away: 1 - homeProb },
    actualMargin,
    actualWinner,
    correct,
  };
}

describe("bootstrapCompare", () => {
  it("produces CI including zero for identical predictions", () => {
    const preds = Array.from({ length: 100 }, (_, i) =>
      makePrediction(i, 10, i % 2 === 0 ? 15 : -5),
    );

    const result = bootstrapCompare(preds, preds, 500, 42);

    expect(result.deltas.logLossBits.point).toBe(0);
    expect(result.deltas.logLossBits.ci95[0]).toBeLessThanOrEqual(0);
    expect(result.deltas.logLossBits.ci95[1]).toBeGreaterThanOrEqual(0);
    expect(result.deltas.logLossBits.excludesZero).toBe(false);

    expect(result.deltas.brier.point).toBe(0);
    expect(result.deltas.brier.excludesZero).toBe(false);

    expect(result.deltas.tipPct.point).toBe(0);
    expect(result.deltas.tipPct.excludesZero).toBe(false);
  });

  it("produces CI excluding zero for clearly different predictions", () => {
    // Config A: always predicts 20-point home win (accurate)
    // Config B: always predicts 20-point away win (wrong)
    const predsA = Array.from({ length: 100 }, (_, i) => makePrediction(i, 20, 15));
    const predsB = Array.from({ length: 100 }, (_, i) => makePrediction(i, -20, 15));

    const result = bootstrapCompare(predsA, predsB, 500, 42);

    // A should have much better LogLoss (lower), so delta < 0
    expect(result.deltas.logLossBits.point).toBeLessThan(0);
    expect(result.deltas.logLossBits.excludesZero).toBe(true);
    // A should have better tip% (higher), so delta > 0
    expect(result.deltas.tipPct.point).toBeGreaterThan(0);
    expect(result.deltas.tipPct.excludesZero).toBe(true);
  });

  it("is deterministic with the same seed", () => {
    const predsA = Array.from({ length: 50 }, (_, i) =>
      makePrediction(i, 10 + (i % 5), i % 3 === 0 ? -5 : 12),
    );
    const predsB = Array.from({ length: 50 }, (_, i) =>
      makePrediction(i, 8 + (i % 3), i % 3 === 0 ? -5 : 12),
    );

    const r1 = bootstrapCompare(predsA, predsB, 200, 99);
    const r2 = bootstrapCompare(predsA, predsB, 200, 99);

    expect(r1.deltas.logLossBits.ci95).toEqual(r2.deltas.logLossBits.ci95);
    expect(r1.deltas.brier.ci95).toEqual(r2.deltas.brier.ci95);
    expect(r1.deltas.tipPct.ci95).toEqual(r2.deltas.tipPct.ci95);
  });

  it("produces different results with different seeds", () => {
    const predsA = Array.from({ length: 50 }, (_, i) =>
      makePrediction(i, 10 + (i % 5), i % 3 === 0 ? -5 : 12),
    );
    const predsB = Array.from({ length: 50 }, (_, i) =>
      makePrediction(i, 8 + (i % 3), i % 3 === 0 ? -5 : 12),
    );

    const r1 = bootstrapCompare(predsA, predsB, 200, 42);
    const r2 = bootstrapCompare(predsA, predsB, 200, 123);

    // CIs should differ (at least slightly) with different seeds
    const ci1 = r1.deltas.logLossBits.ci95;
    const ci2 = r2.deltas.logLossBits.ci95;
    expect(ci1[0] !== ci2[0] || ci1[1] !== ci2[1]).toBe(true);
  });

  it("throws when prediction arrays have different match counts", () => {
    const predsA = [makePrediction(1, 10, 5), makePrediction(2, 10, 5)];
    const predsB = [makePrediction(1, 10, 5)];

    expect(() => bootstrapCompare(predsA, predsB)).toThrow("different match counts");
  });

  it("throws when prediction arrays have mismatched matchIds", () => {
    const predsA = [makePrediction(1, 10, 5), makePrediction(2, 10, 5)];
    const predsB = [makePrediction(1, 10, 5), makePrediction(3, 10, 5)];

    expect(() => bootstrapCompare(predsA, predsB)).toThrow("present in A but not in B");
  });

  it("reports correct point estimates alongside CIs", () => {
    const predsA = Array.from({ length: 50 }, (_, i) =>
      makePrediction(i, 15, i % 2 === 0 ? 20 : -10),
    );
    const predsB = Array.from({ length: 50 }, (_, i) =>
      makePrediction(i, 5, i % 2 === 0 ? 20 : -10),
    );

    const result = bootstrapCompare(predsA, predsB, 100, 42);

    // Point estimates should be actual metric differences (not bootstrap means)
    expect(result.configA.matches).toBe(50);
    expect(result.configB.matches).toBe(50);
    expect(result.deltas.logLossBits.point).toBeCloseTo(
      result.configA.logLossBits - result.configB.logLossBits,
      10,
    );
  });
});
