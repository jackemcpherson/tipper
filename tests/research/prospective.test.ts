import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  benchmarkRescues,
  type ComparedGame,
  compareSelections,
  consensusBuckets,
} from "../../src/research/disagreement.js";
import {
  appendCaptures,
  type Capture,
  isNewCapture,
  issuedCapture,
  leadTimeMinutes,
  readCaptures,
} from "../../src/research/prospective.js";

const capture = (overrides: Partial<Capture>): Capture => ({
  matchId: 10,
  season: 2027,
  round: 1,
  homeTeamId: 1,
  awayTeamId: 2,
  kickoffAt: "2027-03-20T08:40:00.000Z",
  model: "wheelo-inspired-v1",
  version: "wheelo-inspired-v1@abc",
  paramsHash: "0123456789ab",
  sourceRevision: "abc",
  generatedAt: "2027-03-18T00:00:00.000Z",
  lineupObservedAt: null,
  lineupState: "provisional",
  winner: "home",
  margin: 12.34,
  issuedMargin: 12.3,
  homeProbability: 0.64,
  inputs: {
    seasonsFetchedAt: "2027-03-18T00:00:00.000Z",
    completedMatches: 0,
    latestCompletedMatchId: null,
    lineupSource: "none",
    frozenAt: "2026-09-12T00:00:00.000Z",
  },
  ...overrides,
});

describe("prospective captures", () => {
  it("appends only and keeps the last capture before kickoff as issued", async () => {
    const dir = await mkdtemp(join(tmpdir(), "tipper-captures-"));
    const path = join(dir, "model.jsonl");
    const provisional = capture({});
    const ready = capture({
      generatedAt: "2027-03-19T00:00:00.000Z",
      lineupState: "lineup-ready",
      lineupObservedAt: "2027-03-18T23:00:00.000Z",
      margin: 15.5,
      issuedMargin: 15.5,
    });
    const late = capture({ generatedAt: "2027-03-20T09:00:00.000Z", margin: -3, issuedMargin: -3 });
    expect(await appendCaptures(path, [provisional])).toBe(1);
    expect(isNewCapture([provisional], capture({}))).toBe(false);
    expect(isNewCapture([provisional], ready)).toBe(true);
    await appendCaptures(path, [ready, late]);
    const stored = await readCaptures(path);
    expect(stored).toHaveLength(3);
    expect(issuedCapture(stored, 10)?.margin).toBe(15.5);
    expect(issuedCapture(stored, 99)).toBeUndefined();
    expect(leadTimeMinutes(ready)).toBe((32 * 60 + 40) * 1);
    const text = await readFile(path, "utf8");
    expect(text.trim().split("\n")).toHaveLength(3);
    expect(await readCaptures(join(dir, "missing.jsonl"))).toEqual([]);
  });
  it("treats new results, moved kickoffs and new versions as new evidence", () => {
    const base = capture({});
    expect(
      isNewCapture([base], capture({ inputs: { ...base.inputs, latestCompletedMatchId: 5 } })),
    ).toBe(true);
    expect(isNewCapture([base], capture({ kickoffAt: "2027-03-21T08:40:00.000Z" }))).toBe(true);
    expect(isNewCapture([base], capture({ version: "wheelo-inspired-v1@def" }))).toBe(true);
    expect(isNewCapture([], base)).toBe(true);
  });
});

describe("disagreement analysis", () => {
  const game = (
    gameId: number,
    actual: number,
    forecasts: Record<string, [number, number]>,
  ): ComparedGame => ({
    gameId,
    label: `Game ${gameId}`,
    round: 1,
    actual,
    forecasts: new Map(
      Object.entries(forecasts).map(([name, [homeProbability, homeMargin]]) => [
        name,
        { homeProbability, homeMargin },
      ]),
    ),
  });
  const games = [
    game(1, 10, { A: [0.6, 5], B: [0.6, 5], W: [0.4, -5] }),
    game(2, -10, { A: [0.6, 5], B: [0.4, -5], W: [0.4, -5] }),
    game(3, 10, { A: [0.4, -5], B: [0.6, 5], W: [0.6, 5] }),
    game(4, 10, { A: [0.4, -5], B: [0.4, -5], W: [0.6, 5] }),
    game(5, 10, { A: [0.4, -5], B: [0.4, -5], W: [0.4, -5] }),
  ];
  it("splits selections between two models and finds benchmark rescues", () => {
    const split = compareSelections(games, "A", "B");
    expect(split.games).toBe(5);
    expect(split.bothRight).toBe(1);
    expect(split.aRightBWrong.map((g) => g.gameId)).toEqual([]);
    expect(split.bRightAWrong.map((g) => g.gameId)).toEqual([2, 3]);
    expect(split.bothWrong.map((g) => g.gameId)).toEqual([4, 5]);
    expect(split.sameSelection).toBe(3);
    expect(split.errorCorrelation).not.toBeNull();
    expect(benchmarkRescues(split, games, "W").map((g) => g.gameId)).toEqual([4]);
  });
  it("classifies selections by field agreement", () => {
    const sources = ["B", "W", "S1", "S2", "S3", "S4", "S5", "S6"];
    const crowded = games.map((g) => ({
      ...g,
      forecasts: new Map([
        ...g.forecasts,
        ...sources.slice(2).map((s) => [s, { homeProbability: 0.6, homeMargin: 5 }] as const),
      ]),
    }));
    const buckets = consensusBuckets(crowded, "A", sources, 0.65, 8);
    expect(buckets.map((b) => b.bucket)).toEqual(["consensus", "split", "contrarian"]);
    expect(buckets.reduce((s, b) => s + b.games, 0)).toBe(5);
    expect(buckets[0]?.games).toBe(2);
    expect(buckets[2]?.games).toBe(3);
  });
});
