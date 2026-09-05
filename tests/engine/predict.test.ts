import { describe, expect, it } from "vitest";
import { computeWinProbability } from "../../src/engine/predict.js";
import normalGrid from "../fixtures/standard-normal.json";

describe("probability head correctness and historical compatibility", () => {
  it("reproduces legacy values when the optional model is absent", () => {
    expect(computeWinProbability(36, 36).home).toBe(0.8703286406601964);
    expect(computeWinProbability(0, 36).home).toBe(0.5000000005);
    expect(computeWinProbability(36, 36, "legacy")).toEqual(computeWinProbability(36, 36));
  });

  it("matches standard normal reference quantiles", () => {
    for (const [z, expected] of [
      [0, 0.5],
      [0.5, 0.691462461274],
      [1, 0.841344746069],
      [2, 0.977249868052],
      [-1, 0.158655253931],
    ]) {
      expect(computeWinProbability(z, 1, "standard_normal").home).toBeCloseTo(expected, 6);
    }
  });

  it("matches Python math.erf on a dense grid within 1e-9", () => {
    for (const [z, phi] of normalGrid) {
      expect(
        Math.abs(
          computeWinProbability(z, 1, "standard_normal").home - Math.max(0.01, Math.min(0.99, phi)),
        ),
      ).toBeLessThan(1e-9);
    }
  });

  it("has exact midpoint, symmetric tails and unchanged clamps", () => {
    expect(computeWinProbability(0, 36, "standard_normal")).toEqual({ home: 0.5, away: 0.5 });
    const pos = computeWinProbability(18, 36, "standard_normal");
    const neg = computeWinProbability(-18, 36, "standard_normal");
    expect(pos.home).toBeCloseTo(neg.away, 14);
    expect(computeWinProbability(1000, 36, "standard_normal").home).toBe(0.99);
    expect(computeWinProbability(-1000, 36, "standard_normal").home).toBe(0.01);
  });
});
