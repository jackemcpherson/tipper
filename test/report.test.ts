import { describe, expect, it } from "@effect/vitest";
import { reportingWeek, type ScoringMatch, score } from "../src/report";
import type { FieldTip } from "../src/squiggle";

const tipped: ScoringMatch = {
  id: 1,
  game_id: 1,
  home: "Alpha",
  away: "Beta",
  actual_margin: 10,
  fixture_changed: 0,
  schedule_changed: 0,
  run_id: 1,
  winner: "away",
  issued_margin: -0,
  issued_probability: 0.4999,
  source_revision: "old-revision",
  kickoff_at: "2026-08-20T00:00:00.000Z",
};

const matches: ReadonlyArray<ScoringMatch> = [1, 2, 3, 4].map((id) => ({
  ...tipped,
  id,
  game_id: id,
}));

const marketTip: FieldTip = {
  gameid: 1,
  source: "Punters",
  hteam: "Alpha",
  ateam: "Beta",
  tip: "Alpha",
  hmargin: 10,
  hconfidence: 70,
};

const field: ReadonlyArray<FieldTip> = matches.map((match) => ({ ...marketTip, gameid: match.id }));

describe("recorded competition evidence", () => {
  it("uses the recorded winner even when issued margin rounds to zero", () => {
    const result = score(matches, field);

    expect(result.correct).toBe(0);
    expect(result.mae).toBe(10);
    expect(result.marketGap).toBe(-4);
    expect(result.alert).toBe(true);
    expect(result.closeBand.correct).toBe(0);
  });

  it("compares common matches and retains missing tips and sparse field coverage", () => {
    const result = score([...matches, { ...tipped, id: 5, run_id: null }], field.slice(0, 1));

    expect(result.coverage.missing).toEqual([5]);
    expect(result.comparisons[0]?.matchIds).toEqual([1]);
    expect(result.marketGap).toBe(-1);
    expect(result.alert).toBe(false);
    expect(result.ranking).toHaveLength(1);
  });

  it("rejects ambiguous field observations and does not use sparse margin MAE for ranking", () => {
    const ambiguous = score(matches, [...field, marketTip]);

    const sparse = score(
      matches,
      field.map((tip) => ({ ...tip, hmargin: tip.gameid === 1 ? 10 : null })),
    );

    expect(ambiguous.comparisons[0]?.count).toBe(3);
    expect(sparse.ranking.find((entry) => entry.source === "Punters")?.mae).toBeNull();
  });

  it("scores draws explicitly and calculates proper probabilities", () => {
    const result = score([{ ...tipped, actual_margin: 0, issued_probability: 0.5 }], []);

    expect(result.draws).toBe(1);
    expect(result.correct).toBe(1);
    expect(result.brier).toBe(0);
    expect(result.logLoss).toBeCloseTo(Math.log(2));
    expect(result.closeBand.total).toBe(0);
  });

  it("starts the weekly window only at Monday 22:00 UTC", () => {
    expect(reportingWeek(new Date("2026-08-24T21:59:59Z"))).toBe("2026-08-17T22:00:00.000Z");
    expect(reportingWeek(new Date("2026-08-24T22:00:00Z"))).toBe("2026-08-24T22:00:00.000Z");
  });
});
