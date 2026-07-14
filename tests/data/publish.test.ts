import { afterEach, describe, expect, it, vi } from "vitest";
import { createD1RestClient } from "../../src/data/d1-rest.js";
import {
  buildUpsertStatement,
  formatModelVersion,
  type MatchPredictionRow,
  toPredictionRow,
  upsertPredictions,
} from "../../src/data/publish.js";
import type { MatchPrediction } from "../../src/types.js";

function makePrediction(overrides: Partial<MatchPrediction> = {}): MatchPrediction {
  return {
    matchId: 9001,
    date: "2026-07-16",
    round: "18",
    roundNumber: 18,
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

function makeRow(overrides: Partial<MatchPredictionRow> = {}): MatchPredictionRow {
  return {
    match_id: 9001,
    home_win_prob: 0.31,
    predicted_margin: -28.3,
    model_version: "predha-080 (2641f46f)",
    generated_at: "2026-07-16T07:30:00.000Z",
    ...overrides,
  };
}

function restBody(results: unknown[]): unknown {
  return {
    success: true,
    errors: [],
    result: [{ results, success: true, meta: {} }],
  };
}

describe("toPredictionRow", () => {
  const modelVersion = "predha-080 (2641f46f)";
  const generatedAt = "2026-07-16T07:30:00.000Z";

  it("keeps the home perspective when the AWAY team is favoured", () => {
    // The CLI displays this prediction as "Sydney by 28.3 (69%)" —
    // favourite-oriented. The published row must stay home-oriented:
    // the home team is the underdog, so prob < 0.5 and margin < 0.
    const row = toPredictionRow(makePrediction(), modelVersion, generatedAt);

    expect(row.home_win_prob).toBe(0.31);
    expect(row.home_win_prob).not.toBe(0.69);
    expect(row.predicted_margin).toBe(-28.3);
    expect(row.match_id).toBe(9001);
  });

  it("keeps the home perspective when the HOME team is favoured", () => {
    const row = toPredictionRow(
      makePrediction({
        predictedMargin: 12.7,
        predictedWinner: "home",
        winProbability: { home: 0.64, away: 0.36 },
      }),
      modelVersion,
      generatedAt,
    );

    expect(row.home_win_prob).toBe(0.64);
    expect(row.predicted_margin).toBe(12.7);
  });

  it("rounds the margin to one decimal, preserving sign", () => {
    const home = toPredictionRow(
      makePrediction({ predictedMargin: 12.3456 }),
      modelVersion,
      generatedAt,
    );
    expect(home.predicted_margin).toBe(12.3);

    const away = toPredictionRow(
      makePrediction({ predictedMargin: -7.26 }),
      modelVersion,
      generatedAt,
    );
    expect(away.predicted_margin).toBe(-7.3);
  });

  it("stamps model_version and generated_at verbatim", () => {
    const row = toPredictionRow(makePrediction(), modelVersion, generatedAt);
    expect(row.model_version).toBe("predha-080 (2641f46f)");
    expect(row.generated_at).toBe("2026-07-16T07:30:00.000Z");
  });
});

describe("formatModelVersion", () => {
  it("matches the CLI header format: config id + short hash", () => {
    expect(formatModelVersion("predha-080", "2641f46f")).toBe("predha-080 (2641f46f)");
  });
});

describe("buildUpsertStatement", () => {
  it("generates an INSERT ... ON CONFLICT (match_id) DO UPDATE upsert", () => {
    const { sql } = buildUpsertStatement([makeRow()]);

    expect(sql).toContain(
      "INSERT INTO match_predictions " +
        "(match_id, home_win_prob, predicted_margin, model_version, generated_at)",
    );
    expect(sql).toContain("ON CONFLICT (match_id) DO UPDATE SET");
    expect(sql).toContain("home_win_prob = excluded.home_win_prob");
    expect(sql).toContain("predicted_margin = excluded.predicted_margin");
    expect(sql).toContain("model_version = excluded.model_version");
    expect(sql).toContain("generated_at = excluded.generated_at");
  });

  it("emits one placeholder tuple and five ordered params per row", () => {
    const rows = [
      makeRow(),
      makeRow({ match_id: 9002, home_win_prob: 0.64, predicted_margin: 12.7 }),
    ];
    const { sql, params } = buildUpsertStatement(rows);

    expect(sql.match(/\(\?, \?, \?, \?, \?\)/g)).toHaveLength(2);
    expect(params).toEqual([
      9001,
      0.31,
      -28.3,
      "predha-080 (2641f46f)",
      "2026-07-16T07:30:00.000Z",
      9002,
      0.64,
      12.7,
      "predha-080 (2641f46f)",
      "2026-07-16T07:30:00.000Z",
    ]);
  });

  it("throws on an empty row set", () => {
    expect(() => buildUpsertStatement([])).toThrow(/at least one row/);
  });
});

describe("upsertPredictions", () => {
  afterEach(() => vi.restoreAllMocks());

  it("POSTs the upsert SQL and params to the D1 REST endpoint", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(restBody([])), { status: 200 }));
    const db = createD1RestClient("acc-1", "db-1", "tok");

    const written = await upsertPredictions(db, [makeRow()]);

    expect(written).toBe(1);
    expect(spy).toHaveBeenCalledTimes(1);
    const [url, init] = spy.mock.calls[0] ?? [];
    expect(url).toBe("https://api.cloudflare.com/client/v4/accounts/acc-1/d1/database/db-1/query");
    const body = JSON.parse((init as RequestInit).body as string) as {
      sql: string;
      params: unknown[];
    };
    expect(body.sql).toContain("ON CONFLICT (match_id) DO UPDATE SET");
    expect(body.params).toEqual([
      9001,
      0.31,
      -28.3,
      "predha-080 (2641f46f)",
      "2026-07-16T07:30:00.000Z",
    ]);
  });

  it("chunks large row sets into multiple statements (16 rows per chunk)", async () => {
    // A fresh Response per call — a shared one would fail on the second
    // read with "Body has already been read".
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => new Response(JSON.stringify(restBody([])), { status: 200 }));
    const db = createD1RestClient("a", "d", "t");

    const rows = Array.from({ length: 17 }, (_, i) => makeRow({ match_id: 9000 + i }));
    const written = await upsertPredictions(db, rows);

    expect(written).toBe(17);
    expect(spy).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse((spy.mock.calls[0]?.[1] as RequestInit).body as string) as {
      params: unknown[];
    };
    const secondBody = JSON.parse((spy.mock.calls[1]?.[1] as RequestInit).body as string) as {
      params: unknown[];
    };
    expect(firstBody.params).toHaveLength(80);
    expect(secondBody.params).toHaveLength(5);
  });

  it("maps a missing match_predictions table to an actionable error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          errors: [{ message: "no such table: match_predictions at offset 17" }],
          result: [],
        }),
        { status: 200 },
      ),
    );
    const db = createD1RestClient("a", "d", "t");

    await expect(upsertPredictions(db, [makeRow()])).rejects.toThrow(/AFL-MCP#140/);
  });

  it("rethrows other D1 errors unchanged", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          errors: [{ message: "FOREIGN KEY constraint failed" }],
          result: [],
        }),
        { status: 200 },
      ),
    );
    const db = createD1RestClient("a", "d", "t");

    await expect(upsertPredictions(db, [makeRow()])).rejects.toThrow(
      /FOREIGN KEY constraint failed/,
    );
  });
});
