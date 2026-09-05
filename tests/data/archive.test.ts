import { afterEach, describe, expect, it, vi } from "vitest";
import {
  appendPredictionArchive,
  buildArchiveRows,
  type PredictionCaptureInputs,
} from "../../src/data/archive.js";
import { createD1RestClient } from "../../src/data/d1-rest.js";
import { fetchRoundField } from "../../src/data/squiggle-field.js";
import type { MatchPrediction } from "../../src/types.js";
import { BAKED_CONFIG, BAKED_CONFIG_HASH } from "../../src/worker/baked-config.js";

const prediction: MatchPrediction = {
  matchId: 1,
  date: "2027-03-18",
  round: "R1",
  roundNumber: 1,
  home: "GWS Giants",
  away: "Sydney",
  venue: "SCG",
  homeTeamRating: 1500,
  awayTeamRating: 1600,
  homeElo: 1480,
  awayElo: 1620,
  homePavTotal: 120,
  awayPavTotal: 140,
  homePavZones: { off: 50, mid: 40, def: 30 },
  awayPavZones: { off: 60, mid: 50, def: 30 },
  predictedMargin: -28.34,
  predictedWinner: "away",
  winProbability: { home: 0.31, away: 0.69 },
  actualMargin: -10,
  actualWinner: "away",
  correct: true,
};
const inputs: PredictionCaptureInputs = {
  matches: [
    {
      id: 1,
      season_id: 2027,
      round: "R1",
      round_number: 1,
      round_type: "Regular",
      date: "2027-03-18",
      local_time: null,
      venue_id: 1,
      home_team_id: 1,
      away_team_id: 2,
      home_goals: null,
      home_behinds: null,
      home_points: null,
      away_goals: null,
      away_behinds: null,
      away_points: null,
      margin: null,
      attendance: null,
      external_afl_id: null,
    },
  ],
  lineups: [
    {
      id: 1,
      match_id: 1,
      team_id: 1,
      player_id: 17,
      position: "SUB",
      guernsey_number: 17,
      is_emergency: 1,
      is_substitute: 1,
    },
  ],
};
const context = {
  modelVersion: "predha-080 (2641f46f)",
  configHash: BAKED_CONFIG_HASH,
  config: BAKED_CONFIG,
  capturedAt: "2027-03-17T08:00:00.000Z",
  competition: "AFLM" as const,
  season: 2027,
  roundNumber: 1,
  firstKickoff: "2027-03-18T00:00:00",
  isPrimary: true,
};
const field = {
  capturedAt: context.capturedAt,
  tips: [
    {
      gameid: 42,
      sourceid: 1,
      source: "One",
      hteam: "Greater Western Sydney",
      ateam: "Sydney",
      tip: "Sydney",
      hconfidence: "31",
    },
    {
      gameid: 42,
      sourceid: 2,
      source: "Two",
      hteam: "Greater Western Sydney",
      ateam: "Sydney",
      tip: "Greater Western Sydney",
      hconfidence: 60,
    },
    { gameid: 43, sourceid: 1, source: "One", hteam: "Carlton", ateam: "Richmond", tip: "Carlton" },
  ],
};

describe("append-only capture", () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([-1, 1])(
    "preserves published home orientation and full precision for sign %s",
    (sign) => {
      const p = {
        ...prediction,
        predictedMargin: sign * 28.34,
        winProbability: { home: sign < 0 ? 0.31 : 0.69, away: sign < 0 ? 0.69 : 0.31 },
      };
      const [row] = buildArchiveRows([p], inputs, context, field);
      expect(row?.predicted_margin).toBe(sign * 28.3);
      expect(row?.home_win_prob).toBe(p.winProbability.home);
      expect(row?.match_kickoff).toBe("2027-03-18T00:00:00");
      const retained = JSON.parse(row?.inputs_json ?? "{}");
      expect(retained.prediction.predictedMargin).toBe(sign * 28.34);
      expect(retained.prediction.actualMargin).toBeUndefined();
      expect(retained.prediction.correct).toBeUndefined();
      expect(retained.config_hash).toBe(BAKED_CONFIG_HASH);
      expect(JSON.parse(row?.lineups_json ?? "[]")).toEqual([
        { player_id: 17, team_id: 1, position: "SUB", is_emergency: 1, is_substitute: 1 },
      ]);
      expect(JSON.parse(row?.field_json ?? "[]")).toEqual(field.tips.slice(0, 2));
    },
  );

  it("distinguishes unavailable field from a known empty field and requires captured fixtures", () => {
    expect(buildArchiveRows([prediction], inputs, context, null)[0]?.field_json).toBeNull();
    expect(
      buildArchiveRows([prediction], inputs, context, { ...field, tips: [] })[0]?.field_json,
    ).toBe("[]");
    expect(() =>
      buildArchiveRows([prediction], { matches: [], lineups: [] }, context, null),
    ).toThrow("Missing captured fixture");
  });

  it("writes only INSERT DO NOTHING to archive, with bounded parameters", async () => {
    const calls: { sql: string; params: unknown[] }[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      calls.push(JSON.parse(String(init?.body)));
      return Response.json({
        success: true,
        errors: [],
        result: [{ results: [], success: true, meta: {} }],
      });
    });
    const rows = Array.from(
      { length: 6 },
      (_, index) =>
        buildArchiveRows(
          [prediction],
          inputs,
          { ...context, capturedAt: `2027-03-17T08:0${index}:00.000Z` },
          field,
        )[0],
    );
    await appendPredictionArchive(
      createD1RestClient("a", "d", "t"),
      rows.filter((row) => row !== undefined),
    );
    expect(calls).toHaveLength(2);
    expect(calls[0]?.params).toHaveLength(75);
    expect(calls[1]?.params).toHaveLength(15);
    expect(
      calls.every(
        (call) =>
          call.sql.includes("INSERT INTO prediction_archive") && call.sql.includes("DO NOTHING"),
      ),
    ).toBe(true);
    expect(calls.some((call) => /UPDATE|DELETE|REPLACE|match_predictions/.test(call.sql))).toBe(
      false,
    );
    expect(calls[0]?.params.slice(9, 11)).toEqual([0.31, -28.3]);
  });

  it("warns on absent table, but propagates other storage failures for the tick to log", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("no such table: prediction_archive"));
    const db = createD1RestClient("a", "d", "t");
    const rows = buildArchiveRows([prediction], inputs, context, null);
    await expect(appendPredictionArchive(db, rows)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("migration 0021"));
    spy.mockRejectedValue(new Error("database offline"));
    await expect(appendPredictionArchive(db, rows)).rejects.toThrow("database offline");
  });

  it("validates round field, sends required identity, and fails soft on HTTP errors", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ tips: field.tips }));
    const clock = () => new Date(context.capturedAt);
    expect(await fetchRoundField(2027, 1, clock)).toEqual(field);
    expect(spy).toHaveBeenCalledWith(
      "https://api.squiggle.com.au/?q=tips;year=2027;round=1",
      expect.objectContaining({
        headers: { "User-Agent": "tipper-worker/1.0 (jackemcpherson@gmail.com)" },
      }),
    );
    spy.mockResolvedValue(new Response("down", { status: 503 }));
    expect(await fetchRoundField(2027, 1, clock)).toBeNull();
    spy.mockResolvedValue(Response.json({ tips: [{ broken: true }] }));
    expect(await fetchRoundField(2027, 1, clock)).toBeNull();
    expect(warn).toHaveBeenCalledTimes(2);
  });
});
