import { describe, expect, it } from "vitest";
import { reportingWeek, type ScoringMatch, score } from "../src/evidence.js";
import type { FieldTip } from "../src/squiggle.js";

const matches: ScoringMatch[] = Array.from({ length: 4 }, (_, i) => ({
  id: i + 1,
  game_id: i + 1,
  home: "Alpha",
  away: "Beta",
  actual_margin: 10,
  run_id: 1,
  winner: "away",
  issued_margin: -0,
  issued_probability: 0.4999,
  source_revision: "old-revision",
  kickoff_at: "2026-08-20T00:00:00.000Z",
}));
const field: FieldTip[] = matches.map((m) => ({
  gameid: m.id,
  source: "Punters",
  hteam: "Alpha",
  ateam: "Beta",
  tip: "Alpha",
  hmargin: 10,
  hconfidence: 70,
}));
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
    const result = score([...matches, { ...matches[0], id: 5, run_id: null }], field.slice(0, 1));
    expect(result.coverage.missing).toEqual([5]);
    expect(result.comparisons[0]?.matchIds).toEqual([1]);
    expect(result.marketGap).toBe(-1);
    expect(result.alert).toBe(false);
    expect(result.ranking).toHaveLength(1);
  });
  it("rejects ambiguous field observations and does not use sparse margin MAE for ranking", () => {
    const result = score(matches, [...field, field[0]]);
    expect(result.comparisons[0]?.count).toBe(3);
    const sparse = score(
      matches,
      field.map((t, i) => ({ ...t, hmargin: i === 0 ? 10 : null })),
    );
    expect(sparse.ranking.find((r) => r.source === "Punters")?.mae).toBeNull();
  });
  it("scores draws explicitly and calculates proper probabilities", () => {
    const result = score([{ ...matches[0], actual_margin: 0, issued_probability: 0.5 }], []);
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
