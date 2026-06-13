import { describe, expect, it } from "vitest";
import {
  ageAtDate,
  applyAgeCurve,
  getAgeTransitionRatio,
  type PriorPavMap,
} from "../../src/engine/prior.js";

describe("age curve", () => {
  it("returns the fitted ratio for in-range ages", () => {
    expect(getAgeTransitionRatio(27)).toBeCloseTo(1.018, 5);
    expect(getAgeTransitionRatio(33)).toBeCloseTo(0.91, 5);
  });

  it("uses young/old asymptotes outside the fitted range", () => {
    expect(getAgeTransitionRatio(15)).toBeCloseTo(1.524, 5);
    expect(getAgeTransitionRatio(45)).toBeCloseTo(0.85, 5);
  });

  it("computes integer years from ISO dates without timezone drift", () => {
    expect(ageAtDate("1990-01-01", "2026-01-02")).toBe(36);
    expect(ageAtDate("1990-06-01", "2026-05-31")).toBe(35);
    expect(ageAtDate("2000-12-31", "2026-12-31")).toBe(26);
    // Target ISO with trailing time component should be sliced to the date.
    expect(ageAtDate("1990-01-01", "2026-03-15T19:30:00.000Z")).toBe(36);
  });

  it("is a no-op when weight is 0 (bit-identical to v3)", () => {
    const prior: PriorPavMap = new Map([[1, { offPav: 5, midPav: 6, defPav: 7, totalPav: 18 }]]);
    const dobs = new Map([[1, "1990-01-01"]]);
    const adjusted = applyAgeCurve(prior, dobs, "2026-03-15", 0);
    expect(adjusted).toBe(prior);
  });

  it("passes players with unknown DOB through unchanged", () => {
    const prior: PriorPavMap = new Map([
      [1, { offPav: 5, midPav: 6, defPav: 7, totalPav: 18 }],
      [2, { offPav: 1, midPav: 2, defPav: 3, totalPav: 6 }],
    ]);
    const dobs = new Map<number, string | null>([
      [1, null],
      [2, "1990-01-01"],
    ]);
    const adjusted = applyAgeCurve(prior, dobs, "2026-03-15", 1.0);
    // Player 1 (no DOB) unchanged
    expect(adjusted.get(1)).toEqual(prior.get(1));
    // Player 2 (age 36 → out-of-range, ratio 0.85) scaled
    const got = adjusted.get(2);
    expect(got).not.toBe(prior.get(2));
    expect(got?.offPav).toBeCloseTo(1 * 0.85, 6);
    expect(got?.totalPav).toBeCloseTo(6 * 0.85, 6);
  });

  it("applies (1 − w + w · ratio) at intermediate weights", () => {
    const prior: PriorPavMap = new Map([[1, { offPav: 4, midPav: 4, defPav: 4, totalPav: 12 }]]);
    // Age 22 at R1 → ratio 1.251.
    const dobs = new Map([[1, "2003-04-01"]]);
    const w = 0.5;
    const adjusted = applyAgeCurve(prior, dobs, "2026-03-15", w);
    const expectedMultiplier = 1 - w + w * 1.251;
    expect(adjusted.get(1)?.totalPav).toBeCloseTo(12 * expectedMultiplier, 6);
  });

  it("scales prior PAV by the full ratio at weight = 1", () => {
    const prior: PriorPavMap = new Map([
      // A 27-year-old (peak): ratio 1.018 → expect slight upward adjustment
      [1, { offPav: 3, midPav: 4, defPav: 3, totalPav: 10 }],
      // A 33-year-old: ratio 0.910 → expect downward adjustment
      [2, { offPav: 5, midPav: 5, defPav: 0, totalPav: 10 }],
    ]);
    const dobs = new Map([
      [1, "1998-04-01"], // age at 2026-03-15 R1 = 27
      [2, "1992-04-01"], // age 33
    ]);
    const adjusted = applyAgeCurve(prior, dobs, "2026-03-15", 1.0);
    expect(adjusted.get(1)?.totalPav).toBeCloseTo(10 * 1.018, 6);
    expect(adjusted.get(2)?.totalPav).toBeCloseTo(10 * 0.91, 6);
    // Component-wise too (ensures we don't drop the off/mid/def breakdown)
    expect(adjusted.get(2)?.offPav).toBeCloseTo(5 * 0.91, 6);
    expect(adjusted.get(2)?.midPav).toBeCloseTo(5 * 0.91, 6);
    expect(adjusted.get(2)?.defPav).toBeCloseTo(0, 6);
  });
});
