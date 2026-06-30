import { describe, expect, it } from "vitest";
import type { RankEntry } from "../../src/cli/monitor/score.js";
import {
  closeBandSign,
  compRank,
  compTip,
  marketGap,
  sortRankTable,
} from "../../src/cli/monitor/score.js";

// ---------------------------------------------------------------------------
// compTip: comp convention (draws correct for every source)
// ---------------------------------------------------------------------------

describe("compTip", () => {
  it("counts a draw as correct", () => {
    expect(compTip(10, 0)).toBe(true);
    expect(compTip(-10, 0)).toBe(true);
    expect(compTip(0, 0)).toBe(true);
  });

  it("correct when prediction and actual agree on direction", () => {
    expect(compTip(5, 20)).toBe(true); // both home
    expect(compTip(-5, -15)).toBe(true); // both away
  });

  it("wrong when prediction and actual disagree on direction", () => {
    expect(compTip(5, -20)).toBe(false); // predicted home, away won
    expect(compTip(-5, 15)).toBe(false); // predicted away, home won
  });

  it("predictedMargin = 0 counts as home prediction", () => {
    // predictedMargin >= 0 is the home condition — margin=0 is "home"
    expect(compTip(0, 10)).toBe(true);
    expect(compTip(0, -10)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// closeBandSign: sign accuracy on |predictedMargin| < threshold, draws excluded
// ---------------------------------------------------------------------------

describe("closeBandSign", () => {
  it("counts only close games (|predictedMargin| < 12)", () => {
    const predictions = [
      // Close, home correct
      { predictedMargin: 5, actualMargin: 20, actualWinner: "home" as const },
      // Blowout (≥12) — must be excluded
      { predictedMargin: 15, actualMargin: 30, actualWinner: "home" as const },
      // Close, wrong direction
      { predictedMargin: -8, actualMargin: 12, actualWinner: "home" as const },
    ];
    const result = closeBandSign(predictions);
    // Only the two close games count; 1 correct, 1 wrong → 1/2
    expect(result.correct).toBe(1);
    expect(result.total).toBe(2);
  });

  it("excludes draws from both numerator and denominator", () => {
    const predictions = [
      // Close draw — EXCLUDED
      { predictedMargin: 3, actualMargin: 0, actualWinner: "draw" as const },
      // Close, correct
      { predictedMargin: 5, actualMargin: 12, actualWinner: "home" as const },
    ];
    const result = closeBandSign(predictions);
    expect(result.correct).toBe(1);
    expect(result.total).toBe(1); // draw not counted
  });

  it("skips predictions without actuals", () => {
    const predictions = [
      { predictedMargin: 4, actualMargin: undefined, actualWinner: undefined },
      { predictedMargin: 6, actualMargin: 10, actualWinner: "home" as const },
    ];
    const result = closeBandSign(predictions);
    expect(result.total).toBe(1);
  });

  it("respects a custom threshold", () => {
    const predictions = [
      { predictedMargin: 8, actualMargin: 15, actualWinner: "home" as const }, // < 10 threshold
      { predictedMargin: 11, actualMargin: 20, actualWinner: "home" as const }, // ≥ 10, excluded
    ];
    const result = closeBandSign(predictions, 10);
    expect(result.total).toBe(1);
    expect(result.correct).toBe(1);
  });

  it("returns zero total when no close non-draw games", () => {
    const predictions = [{ predictedMargin: 20, actualMargin: 30, actualWinner: "home" as const }];
    const result = closeBandSign(predictions);
    expect(result.total).toBe(0);
    expect(result.correct).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// marketGap: tip delta and alert threshold
// ---------------------------------------------------------------------------

describe("marketGap", () => {
  it("gap +3 triggers alert", () => {
    const result = marketGap(86, 83);
    expect(result.gap).toBe(3);
    expect(result.alert).toBe(true);
  });

  it("gap +2 does not trigger alert", () => {
    const result = marketGap(85, 83);
    expect(result.gap).toBe(2);
    expect(result.alert).toBe(false);
  });

  it("gap -3 triggers alert (behind the market)", () => {
    const result = marketGap(80, 83);
    expect(result.gap).toBe(-3);
    expect(result.alert).toBe(true);
  });

  it("gap 0 does not trigger alert", () => {
    const result = marketGap(50, 50);
    expect(result.gap).toBe(0);
    expect(result.alert).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// compRank and sortRankTable
// ---------------------------------------------------------------------------

describe("compRank", () => {
  it("ranks the model correctly in a small field", () => {
    const field: RankEntry[] = [
      { name: "Source A", tips: 40, mae: 30 },
      { name: "Source B", tips: 38, mae: 28 },
      { name: "Source C", tips: 35, mae: 25 },
    ];
    const model: RankEntry = { name: "Tipper v3", tips: 39, mae: 29 };
    // Sorted: A(40) > model(39) > B(38) > C(35) → rank 2
    expect(compRank(model, field)).toBe(2);
  });

  it("model at the top ranks 1", () => {
    const field: RankEntry[] = [
      { name: "Source A", tips: 35, mae: 30 },
      { name: "Source B", tips: 33, mae: 28 },
    ];
    const model: RankEntry = { name: "Tipper v3", tips: 40, mae: 25 };
    expect(compRank(model, field)).toBe(1);
  });

  it("tiebreak by MAE ascending when tips are equal", () => {
    // model has same tips as Source A but lower MAE → should rank above A
    const field: RankEntry[] = [
      { name: "Source A", tips: 40, mae: 32 },
      { name: "Source B", tips: 38, mae: 28 },
    ];
    const model: RankEntry = { name: "Tipper v3", tips: 40, mae: 28 };
    // Sorted: model(40, MAE28) = Source A(40, MAE32) — model ranks 1 by MAE
    expect(compRank(model, field)).toBe(1);
  });

  it("includes only full-coverage sources: model ranks among what it is passed", () => {
    // Caller is responsible for filtering to full-coverage sources before passing.
    // With an empty field, model is rank 1 of 1.
    const model: RankEntry = { name: "Tipper v3", tips: 30, mae: 25 };
    expect(compRank(model, [])).toBe(1);
  });
});

describe("sortRankTable", () => {
  it("sorts by tips descending then MAE ascending", () => {
    const entries: RankEntry[] = [
      { name: "C", tips: 35, mae: 25 },
      { name: "A", tips: 40, mae: 30 },
      { name: "B", tips: 40, mae: 28 },
    ];
    const sorted = sortRankTable(entries);
    expect(sorted[0]?.name).toBe("B"); // 40 tips, MAE 28
    expect(sorted[1]?.name).toBe("A"); // 40 tips, MAE 30
    expect(sorted[2]?.name).toBe("C"); // 35 tips
  });

  it("treats null MAE as 99 for tiebreaking", () => {
    const entries: RankEntry[] = [
      { name: "A", tips: 40, mae: null },
      { name: "B", tips: 40, mae: 30 },
    ];
    const sorted = sortRankTable(entries);
    expect(sorted[0]?.name).toBe("B"); // MAE 30 < null(99)
    expect(sorted[1]?.name).toBe("A");
  });

  it("does not mutate the input array", () => {
    const entries: RankEntry[] = [
      { name: "B", tips: 35, mae: 25 },
      { name: "A", tips: 40, mae: 30 },
    ];
    sortRankTable(entries);
    expect(entries[0]?.name).toBe("B"); // original order unchanged
  });
});
