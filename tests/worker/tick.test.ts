import { afterEach, describe, expect, it, vi } from "vitest";
import { shortHash } from "../../src/config/hash.js";
import { formatModelVersion } from "../../src/data/publish.js";
import type { PublishRoundStateRow } from "../../src/data/queries.js";
import type { MatchPrediction } from "../../src/types.js";
import { BAKED_CONFIG, BAKED_CONFIG_HASH, BAKED_CONFIG_ID } from "../../src/worker/baked-config.js";
import { fetchRoundStates, type PredictFn, runPublishTick } from "../../src/worker/tick.js";

// Thursday 2026-07-16 15:00 Melbourne (AEST): outside the announcement
// window, so due-ness is driven by never-published/hourly/daily rules.
const NOW = new Date("2026-07-16T05:00:00Z");

const EXPECTED_MODEL_VERSION = formatModelVersion(BAKED_CONFIG_ID, shortHash(BAKED_CONFIG_HASH));

function makeRow(overrides: Partial<PublishRoundStateRow> = {}): PublishRoundStateRow {
  return {
    competition: "AFLM",
    season: 2026,
    round_number: 19,
    first_kickoff: "2026-07-16T19:30:00",
    has_match_today: 1,
    last_generated_at: null,
    ...overrides,
  };
}

function makePrediction(overrides: Partial<MatchPrediction> = {}): MatchPrediction {
  return {
    matchId: 9001,
    date: "2026-07-16",
    round: "19",
    roundNumber: 19,
    home: "Western Bulldogs",
    away: "Sydney",
    venue: "Marvel",
    homeTeamRating: 1500,
    awayTeamRating: 1550,
    homeElo: 1500,
    awayElo: 1550,
    homePavTotal: 90,
    awayPavTotal: 100,
    homePavZones: { off: 30, mid: 30, def: 30 },
    awayPavZones: { off: 33, mid: 34, def: 33 },
    predictedMargin: -28.3,
    predictedWinner: "away",
    winProbability: { home: 0.31, away: 0.69 },
    ...overrides,
  };
}

interface CapturedCall {
  readonly sql: string;
  readonly params: unknown[];
}

/**
 * Fake D1Database: serves the round-state query with canned rows and
 * captures every prepared statement (including the upsert INSERTs that
 * the real upsertPredictions issues against it).
 */
function makeFakeDb(stateRows: PublishRoundStateRow[]): { db: D1Database; calls: CapturedCall[] } {
  const calls: CapturedCall[] = [];
  const db = {
    prepare(sql: string) {
      return {
        bind(...params: unknown[]) {
          calls.push({ sql, params });
          return {
            async all() {
              const results = sql.includes("GROUP BY") ? stateRows : [];
              return { results, success: true, meta: {} };
            },
          };
        },
      };
    },
  } as unknown as D1Database;
  return { db, calls };
}

function upsertCalls(calls: CapturedCall[]): CapturedCall[] {
  return calls.filter((c) => c.sql.includes("INSERT INTO match_predictions"));
}

function makePredict(impl?: PredictFn): PredictFn {
  return (impl ??
    (async () => ({
      data_through: "2026-07-15",
      predictions: [makePrediction()],
      skipped_matches: 0,
    }))) as PredictFn;
}

afterEach(() => vi.restoreAllMocks());

describe("fetchRoundStates", () => {
  it("binds the Melbourne today date and 7-day window edge, and maps rows", async () => {
    const { db, calls } = makeFakeDb([makeRow()]);

    const states = await fetchRoundStates(db, NOW);

    expect(calls).toHaveLength(1);
    // 05:00Z on 2026-07-16 is 15:00 AEST; +7 days is 2026-07-23T15:00:00.
    expect(calls[0]?.params).toEqual(["2026-07-16", "2026-07-23T15:00:00"]);
    expect(states).toEqual([
      {
        competition: "AFLM",
        season: 2026,
        roundNumber: 19,
        firstKickoff: "2026-07-16T19:30:00",
        hasMatchToday: true,
        lastGeneratedAt: null,
      },
    ]);
  });
});

describe("runPublishTick", () => {
  it("publishes every due round with the baked model version and now as generated_at", async () => {
    const { db, calls } = makeFakeDb([
      makeRow(),
      makeRow({
        competition: "AFLW",
        round_number: 1,
        first_kickoff: "2026-07-18T13:05:00",
        has_match_today: 0,
      }),
    ]);
    const predict = vi.fn(makePredict());

    const result = await runPublishTick(db, NOW, predict as PredictFn);

    expect(result.planned).toBe(2);
    expect(result.failed).toEqual([]);
    expect(result.published).toEqual([
      { competition: "AFLM", season: 2026, roundNumber: 19, rows: 1 },
      { competition: "AFLW", season: 2026, roundNumber: 1, rows: 1 },
    ]);

    expect(predict).toHaveBeenCalledTimes(2);
    const [dbArg, configArg, seasonArg, roundArg, compArg] = predict.mock.calls[0] ?? [];
    expect(dbArg).toBe(db);
    expect(seasonArg).toBe(2026);
    expect(roundArg).toBe(19);
    expect(compArg).toBe("AFLM");
    // Same test_seasons override as the publish CLI.
    expect(configArg).toEqual({
      ...BAKED_CONFIG,
      backtest: { ...BAKED_CONFIG.backtest, test_seasons: [2026] },
    });

    const upserts = upsertCalls(calls);
    expect(upserts).toHaveLength(2);
    expect(upserts[0]?.params).toEqual([
      9001,
      0.31,
      -28.3,
      EXPECTED_MODEL_VERSION,
      NOW.toISOString(),
    ]);
  });

  it("fail-soft: one competition's failure does not block the other", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { db, calls } = makeFakeDb([
      makeRow(),
      makeRow({
        competition: "AFLW",
        round_number: 1,
        first_kickoff: "2026-07-18T13:05:00",
        has_match_today: 0,
      }),
    ]);
    const predict = makePredict((async (_db, _config, _season, _round, competition) => {
      if (competition === "AFLM") throw new Error("engine exploded");
      return { data_through: "2026-07-15", predictions: [makePrediction()], skipped_matches: 0 };
    }) as PredictFn);

    const result = await runPublishTick(db, NOW, predict);

    expect(result.failed).toEqual([{ competition: "AFLM", season: 2026, roundNumber: 19 }]);
    expect(result.published).toEqual([
      { competition: "AFLW", season: 2026, roundNumber: 1, rows: 1 },
    ]);
    expect(upsertCalls(calls)).toHaveLength(1);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("AFLM 2026 R19"),
      expect.any(Error),
    );
  });

  it("performs no engine runs when nothing is due", async () => {
    const { db, calls } = makeFakeDb([
      // Frozen: first match kicked off at 14:00 Melbourne, now is 15:00.
      makeRow({ first_kickoff: "2026-07-16T14:00:00" }),
      // Fresh: published 30 minutes ago against an hourly interval.
      makeRow({
        competition: "AFLW",
        round_number: 1,
        first_kickoff: "2026-07-18T13:05:00",
        last_generated_at: "2026-07-16T04:30:00.000Z",
      }),
    ]);
    const predict = vi.fn(makePredict());

    const result = await runPublishTick(db, NOW, predict as PredictFn);

    expect(result).toEqual({ planned: 0, published: [], failed: [] });
    expect(predict).not.toHaveBeenCalled();
    expect(upsertCalls(calls)).toEqual([]);
  });

  it("counts an empty prediction set as a failure and writes nothing", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { db, calls } = makeFakeDb([makeRow()]);
    const predict = makePredict((async () => ({
      data_through: "2026-07-15",
      predictions: [],
      skipped_matches: 0,
    })) as PredictFn);

    const result = await runPublishTick(db, NOW, predict);

    expect(result.published).toEqual([]);
    expect(result.failed).toEqual([{ competition: "AFLM", season: 2026, roundNumber: 19 }]);
    expect(upsertCalls(calls)).toEqual([]);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("no predictions"));
  });
});
