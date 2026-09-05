import { describe, expect, it } from "vitest";
import { formatTipsForComp, toCompTip, toSquiggleName } from "../../src/cli/format/comp.js";
import type { MatchPrediction } from "../../src/types.js";

function makePrediction(overrides: Partial<MatchPrediction> = {}): MatchPrediction {
  return {
    matchId: 1,
    date: "2026-08-01",
    round: "R15",
    roundNumber: 15,
    home: "Geelong",
    away: "Hawthorn",
    venue: "MCG",
    homeTeamRating: 1550,
    awayTeamRating: 1450,
    homeElo: 1550,
    awayElo: 1450,
    homePavTotal: 80,
    awayPavTotal: 60,
    homePavZones: { off: 30, mid: 25, def: 25 },
    awayPavZones: { off: 20, mid: 20, def: 20 },
    predictedMargin: 12.6,
    predictedWinner: "home",
    winProbability: { home: 0.734, away: 0.266 },
    ...overrides,
  };
}

describe("toSquiggleName", () => {
  it("maps GWS Giants to Greater Western Sydney", () => {
    expect(toSquiggleName("GWS Giants")).toBe("Greater Western Sydney");
  });

  it("returns other names unchanged", () => {
    expect(toSquiggleName("Geelong")).toBe("Geelong");
    expect(toSquiggleName("Brisbane Lions")).toBe("Brisbane Lions");
    expect(toSquiggleName("Western Bulldogs")).toBe("Western Bulldogs");
  });
});

describe("toCompTip — home tip", () => {
  it("sets tip to home team name", () => {
    const result = toCompTip(makePrediction(), 2026);
    expect(result.tip).toBe("Geelong");
    expect(result.hteam).toBe("Geelong");
    expect(result.ateam).toBe("Hawthorn");
  });

  it("rounds margin up to nearest integer", () => {
    const result = toCompTip(makePrediction({ predictedMargin: 12.6 }), 2026);
    expect(result.margin).toBe(13);
    expect(result.hmargin).toBe(13);
  });

  it("margin is always non-negative", () => {
    const result = toCompTip(makePrediction({ predictedMargin: 12.6 }), 2026);
    expect(result.margin).toBeGreaterThanOrEqual(0);
  });

  it("confidence equals hconfidence when home team is tipped", () => {
    const result = toCompTip(
      makePrediction({ winProbability: { home: 0.734, away: 0.266 } }),
      2026,
    );
    expect(result.confidence).toBe(result.hconfidence);
    expect(result.confidence).toBe(73);
    expect(result.hconfidence).toBe(73);
  });

  it("sets year and round", () => {
    const result = toCompTip(makePrediction(), 2026);
    expect(result.year).toBe(2026);
    expect(result.round).toBe(15);
  });
});

describe("toCompTip — away tip", () => {
  it("sets tip to away team name", () => {
    const result = toCompTip(
      makePrediction({
        predictedMargin: -8.3,
        predictedWinner: "away",
        winProbability: { home: 0.32, away: 0.68 },
      }),
      2026,
    );
    expect(result.tip).toBe("Hawthorn");
    expect(result.hteam).toBe("Geelong");
    expect(result.ateam).toBe("Hawthorn");
  });

  it("margin is absolute value (positive) when away wins", () => {
    const result = toCompTip(
      makePrediction({
        predictedMargin: -8.3,
        predictedWinner: "away",
        winProbability: { home: 0.32, away: 0.68 },
      }),
      2026,
    );
    expect(result.margin).toBe(8);
    expect(result.hmargin).toBe(-8);
  });

  it("confidence is away win probability, hconfidence is home win probability", () => {
    const result = toCompTip(
      makePrediction({
        predictedMargin: -8.3,
        predictedWinner: "away",
        winProbability: { home: 0.32, away: 0.68 },
      }),
      2026,
    );
    expect(result.confidence).toBe(68);
    expect(result.hconfidence).toBe(32);
  });
});

describe("toCompTip — GWS name mapping", () => {
  it("maps GWS Giants to Greater Western Sydney for home team", () => {
    const result = toCompTip(makePrediction({ home: "GWS Giants", predictedWinner: "home" }), 2026);
    expect(result.hteam).toBe("Greater Western Sydney");
    expect(result.tip).toBe("Greater Western Sydney");
    expect(result.ateam).toBe("Hawthorn");
  });

  it("maps GWS Giants to Greater Western Sydney for away team when tipped", () => {
    const result = toCompTip(
      makePrediction({
        away: "GWS Giants",
        predictedMargin: -5,
        predictedWinner: "away",
        winProbability: { home: 0.4, away: 0.6 },
      }),
      2026,
    );
    expect(result.ateam).toBe("Greater Western Sydney");
    expect(result.tip).toBe("Greater Western Sydney");
  });
});

describe("formatTipsForComp", () => {
  it("wraps tips in a tips array", () => {
    const predictions = [makePrediction()];
    const output = JSON.parse(formatTipsForComp(predictions, 2026)) as { tips: unknown[] };
    expect(output.tips).toHaveLength(1);
  });

  it("every game appears exactly once", () => {
    const predictions = [
      makePrediction({ matchId: 1 }),
      makePrediction({ matchId: 2, home: "Carlton", away: "Essendon" }),
    ];
    const output = JSON.parse(formatTipsForComp(predictions, 2026)) as {
      tips: Array<{ hteam: string }>;
    };
    expect(output.tips).toHaveLength(2);
    const teams = output.tips.map((t) => t.hteam);
    expect(teams).toContain("Geelong");
    expect(teams).toContain("Carlton");
  });

  it("produces valid JSON", () => {
    const predictions = [makePrediction()];
    const output = formatTipsForComp(predictions, 2026);
    expect(() => JSON.parse(output)).not.toThrow();
  });
});
