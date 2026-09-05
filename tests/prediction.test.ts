import { describe, expect, it } from "vitest";
import { homeProbability, predict, SnapshotSchema } from "../src/prediction.js";
import incumbent from "./fixtures/incumbent.json";
import normal from "./fixtures/standard-normal.json";

function fixtureSnapshot() {
  const matches = incumbent.matches.map((m) => ({
    ...m,
    year: m.season_id,
    kickoff_at: `${m.date}T09:30:00.000Z`,
    status: m.home_points === null ? "Upcoming" : "Complete",
  }));
  return SnapshotSchema.parse({
    round: { competition: "AFLM", season: 2026, round: 2 },
    observedAt: "2026-03-21T00:00:00.000Z",
    matches: matches.slice(0, 4),
    candidates: matches.slice(4),
    stats: incumbent.stats.filter((s) => s.match_id === 4),
    lineups: incumbent.lineups.map((l) => ({ ...l, observed_at: "2026-03-20T00:00:00.000Z" })),
    priors: incumbent.priors,
    league: {
      points: incumbent.matches
        .slice(1, 3)
        .reduce((sum, m) => sum + (m.home_points ?? 0) + (m.away_points ?? 0), 0),
      inside50: incumbent.stats
        .filter((s) => s.match_id === 2 || s.match_id === 3)
        .reduce((sum, s) => sum + s.inside_fifties, 0),
    },
  });
}
describe("production prediction", () => {
  it("preserves incumbent Elo, PAV and full precision margins", () => {
    const [p] = predict(fixtureSnapshot());
    const expected = incumbent.expected[0];
    expect(p?.margin).toBeCloseTo(expected?.predictedMargin ?? 0, 10);
    expect(p?.evidence.homeElo).toBeCloseTo(expected?.homeElo ?? 0, 10);
    expect(p?.evidence.awayElo).toBeCloseTo(expected?.awayElo ?? 0, 10);
    expect(p?.evidence.homePav.reduce((a, b) => a + b, 0)).toBeCloseTo(
      expected?.homePavTotal ?? 0,
      10,
    );
    expect(p?.homeProbability).not.toBeCloseTo(expected?.winProbability.home ?? 0, 4);
  });
  it("matches the standard normal reference grid, midpoint, symmetry and clamps", () => {
    for (const [x, cdf] of normal) {
      expect(homeProbability((x ?? 0) * 36)).toBeCloseTo(
        Math.max(0.01, Math.min(0.99, cdf ?? 0)),
        12,
      );
      expect(homeProbability((x ?? 0) * 36) + homeProbability(-(x ?? 0) * 36)).toBeCloseTo(1, 14);
    }
    expect(homeProbability(0)).toBe(0.5);
    expect(homeProbability(1000)).toBe(0.99);
    expect(homeProbability(-1000)).toBe(0.01);
  });
  it("neutralizes both lineups when either side is incomplete, duplicated or misowned", () => {
    for (const mode of ["missing", "duplicate", "ownership"]) {
      const s = fixtureSnapshot();
      if (mode === "missing") s.lineups.pop();
      if (mode === "duplicate") s.lineups.push(s.lineups[0]);
      if (mode === "ownership") s.lineups[0].team_id = 999;
      const [p] = predict(s);
      expect(p?.provisional).toBe(true);
      expect(p?.evidence.homePav).toEqual([0, 0, 0]);
      expect(p?.evidence.awayPav).toEqual([0, 0, 0]);
    }
  });
  it("ignores live, future, and target statistics; earlier completions affect later tips", () => {
    const s = fixtureSnapshot(),
      baseline = predict(s);
    s.stats.push({ ...s.stats[0], match_id: 5, player_id: 999, goals: 1000 });
    s.matches.push({ ...s.candidates[0], home_points: 999, away_points: 0 });
    expect(predict(s)).toEqual(baseline);
    s.matches = s.matches.filter((m) => m.id !== 5);
    s.matches[3].status = "Live";
    expect(predict(s)[0]?.margin).not.toEqual(baseline[0]?.margin);
    s.matches[3].status = "Complete";
    s.matches[3].kickoff_at = "2026-03-25T00:00:00.000Z";
    expect(predict(s)[0]?.margin).not.toEqual(baseline[0]?.margin);
  });
  it("sorts chronologically and rejects duplicate input", () => {
    const s = fixtureSnapshot();
    const original = predict(s);
    s.matches.reverse();
    expect(predict(s)).toEqual(original);
    s.matches.push(s.matches[0]);
    expect(() => predict(s)).toThrow("Duplicate");
  });
  it("supports missing priors and AFLW 21-player lineups", () => {
    const s = fixtureSnapshot();
    s.priors = [];
    s.round.competition = "AFLW";
    s.lineups = s.lineups.filter((l) => ![22, 23, 45, 46].includes(l.player_id));
    const p = predict(s)[0];
    expect(p?.provisional).toBe(false);
    expect(Number.isFinite(p?.margin)).toBe(true);
  });
});

it("uses full precision for winners and selects home at exact zero", () => {
  const s = fixtureSnapshot();
  s.matches = [];
  s.stats = [];
  s.league = { points: 0, inside50: 0 };
  s.priors = s.lineups.map((l) => ({
    player_id: l.player_id,
    team_id: l.team_id,
    off_pav: l.player_id === 24 ? 80 / (0.4 * 6.986) : 0,
    mid_pav: 0,
    def_pav: 0,
  }));
  const zero = predict(s)[0];
  expect(zero?.margin).toBe(0);
  expect(zero?.winner).toBe("home");
  s.priors[23].off_pav += 0.001;
  const negative = predict(s)[0];
  expect(negative?.winner).toBe("away");
  expect(negative?.issuedMargin).toBe(-0);
});
