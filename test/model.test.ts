import { describe, expect, it } from "@effect/vitest";
import { Option, Schema } from "effect";
import { homeProbability, type Prediction, predict } from "../src/model";
import { RoundRequestSchema, SnapshotSchema } from "../src/types";
import incumbent from "./fixtures/incumbent.json";
import normal from "./fixtures/standard-normal.json";

/** The element at `index`, failing the test when it is absent. */
function at<T>(items: ReadonlyArray<T>, index: number): T {
  const item = items[index];

  if (item === undefined) throw new Error(`No element at ${index}`);

  return item;
}

/** A fresh, freely editable copy of the incumbent inputs: four completed matches and one target. */
function inputs() {
  const matches = incumbent.matches.map((match) => ({
    ...match,
    year: match.season_id,
    season_key: String(match.season_id),
    kickoff_at: `${match.date}T09:30:00.000Z`,
    status: match.home_points === null ? "Upcoming" : "Complete",
  }));

  return {
    round: { competition: "AFLM", seasonKey: "2026", round: 2 },
    observedAt: "2026-03-21T00:00:00.000Z",
    matches: matches.slice(0, 4),
    candidates: matches.slice(4),
    stats: incumbent.stats.filter((row) => row.match_id === 4),
    lineups: incumbent.lineups.map((lineup) => ({
      ...lineup,
      observed_at: "2026-03-20T00:00:00.000Z",
    })),
    priors: incumbent.priors.map(({ player_id, team_id, off_pav, mid_pav, def_pav }) => ({
      player_id,
      team_id,
      off_pav,
      mid_pav,
      def_pav,
    })),
    league: {
      points: incumbent.matches
        .slice(1, 3)
        .reduce((sum, match) => sum + (match.home_points ?? 0) + (match.away_points ?? 0), 0),
      inside50: incumbent.stats
        .filter((row) => row.match_id === 2 || row.match_id === 3)
        .reduce((sum, row) => sum + row.inside_fifties, 0),
    },
  };
}

const decode = Schema.decodeUnknownSync(SnapshotSchema);
const first = (raw: ReturnType<typeof inputs>): Prediction => at(predict(decode(raw)), 0);

describe("production prediction", () => {
  it("preserves incumbent Elo, PAV and full precision margins", () => {
    const prediction = first(inputs());
    const expected = at(incumbent.expected, 0);

    expect(prediction.margin).toBeCloseTo(expected.predictedMargin, 10);
    expect(prediction.evidence.homeElo).toBeCloseTo(expected.homeElo, 10);
    expect(prediction.evidence.awayElo).toBeCloseTo(expected.awayElo, 10);
    expect(prediction.evidence.homePav.reduce((a, b) => a + b, 0)).toBeCloseTo(
      expected.homePavTotal,
      10,
    );
    // The incumbent's probability calculation was wrong, so only this value may differ.
    expect(prediction.homeProbability).not.toBeCloseTo(expected.winProbability.home, 4);
  });

  it("matches the standard normal reference grid, midpoint, symmetry and clamps", () => {
    for (const point of normal) {
      const x = at(point, 0);
      const cdf = at(point, 1);

      expect(homeProbability(x * 36)).toBeCloseTo(Math.max(0.01, Math.min(0.99, cdf)), 12);
      expect(homeProbability(x * 36) + homeProbability(-x * 36)).toBeCloseTo(1, 14);
    }

    expect(homeProbability(0)).toBe(0.5);
    expect(homeProbability(1000)).toBe(0.99);
    expect(homeProbability(-1000)).toBe(0.01);
  });

  it("neutralizes both lineups when either side is incomplete, duplicated or misowned", () => {
    const incomplete = inputs();
    const duplicated = inputs();
    const misowned = inputs();

    incomplete.lineups.pop();
    duplicated.lineups.push(at(duplicated.lineups, 0));
    at(misowned.lineups, 0).team_id = 999;

    for (const raw of [incomplete, duplicated, misowned]) {
      const prediction = first(raw);

      expect(prediction.isProvisional).toBe(true);
      expect(prediction.evidence.homePav).toEqual([0, 0, 0]);
      expect(prediction.evidence.awayPav).toEqual([0, 0, 0]);
    }
  });

  it("ignores live, future, and target statistics; earlier completions affect later tips", () => {
    const raw = inputs();
    const baseline = predict(decode(raw));

    raw.stats.push({ ...at(raw.stats, 0), match_id: 5, player_id: 999, goals: 1000 });
    raw.matches.push({ ...at(raw.candidates, 0), home_points: 999, away_points: 0 });
    expect(predict(decode(raw))).toEqual(baseline);

    raw.matches = raw.matches.filter((match) => match.id !== 5);
    at(raw.matches, 3).status = "Live";
    expect(first(raw).margin).not.toEqual(at(baseline, 0).margin);

    at(raw.matches, 3).status = "Complete";
    at(raw.matches, 3).kickoff_at = "2026-03-25T00:00:00.000Z";
    expect(first(raw).margin).not.toEqual(at(baseline, 0).margin);
  });

  it("sorts chronologically and rejects duplicate input", () => {
    const raw = inputs();
    const original = predict(decode(raw));

    raw.matches.reverse();
    expect(predict(decode(raw))).toEqual(original);

    raw.matches.push(at(raw.matches, 0));
    expect(() => predict(decode(raw))).toThrow("Duplicate");
  });

  it("supports missing priors and AFLW 21-player lineups", () => {
    const raw = inputs();

    raw.priors = [];
    raw.round.competition = "AFLW";
    raw.lineups = raw.lineups.filter((lineup) => ![22, 23, 45, 46].includes(lineup.player_id));

    const prediction = first(raw);

    expect(prediction.isProvisional).toBe(false);
    expect(Number.isFinite(prediction.margin)).toBe(true);
  });

  it("uses full precision for winners and selects home at exact zero", () => {
    const raw = inputs();

    raw.matches = [];
    raw.stats = [];
    raw.league = { points: 0, inside50: 0 };
    raw.priors = raw.lineups.map((lineup) => ({
      player_id: lineup.player_id,
      team_id: lineup.team_id,
      off_pav: lineup.player_id === 24 ? 80 / (0.4 * 6.986) : 0,
      mid_pav: 0,
      def_pav: 0,
    }));

    const level = first(raw);

    expect(level.margin).toBe(0);
    expect(level.winner).toBe("home");

    at(raw.priors, 23).off_pav += 0.001;

    const behind = first(raw);

    expect(behind.winner).toBe("away");
    expect(behind.issuedMargin).toBe(-0);
  });
});

describe("round requests", () => {
  const accepts = (competition: string, season: number | string): boolean =>
    Option.isSome(
      Schema.decodeUnknownOption(RoundRequestSchema)({ competition, season, round: 1 }),
    );

  it("requires explicit AFLW 2022 selectors and preserves year bounds for strings", () => {
    for (const season of [2022, "2022", "2020", "2101"])
      expect(accepts("AFLW", season)).toBe(false);

    for (const season of ["2022-S6", "2022-S7", 2026, "2026"])
      expect(accepts("AFLW", season)).toBe(true);

    expect(accepts("AFLM", "2022-S6")).toBe(false);
  });
});
