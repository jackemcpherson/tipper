import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createD1RestClient } from "../../src/data/d1-rest.js";
import worker from "../../src/worker/index.js";
import { cachedRoundGames } from "../../src/worker/squiggle.js";

const fixture: unknown = JSON.parse(
  readFileSync(new URL("../fixtures/squiggle-games-2026-r24.json", import.meta.url), "utf8"),
);
const db = createD1RestClient("a", "b", "c");
const rows = [
  {
    match_id: 1,
    home: "St Kilda",
    away: "Gold Coast",
    round_number: 24,
    home_win_prob: 0.7,
    predicted_margin: 12.3,
  },
  {
    match_id: 2,
    home: "Adelaide",
    away: "GWS Giants",
    round_number: 24,
    home_win_prob: 0.31,
    predicted_margin: -28.3,
  },
];
function setup(options: { outage?: boolean; unknown?: boolean } = {}) {
  const calls: { sql: string; params: unknown[] }[] = [];
  const put = vi.fn(async () => {});
  vi.stubGlobal("caches", { default: { match: vi.fn(async () => undefined), put } });
  const fetch = vi.fn(async (url: string, request: RequestInit) => {
    if (String(url).includes("api.squiggle"))
      return options.outage ? new Response("offline", { status: 503 }) : Response.json(fixture);
    const body = JSON.parse(String(request.body));
    calls.push(body);
    const results = body.sql.includes("AS round FROM")
      ? [{ year: 2026, round: 24 }]
      : body.sql.includes("SELECT m.id FROM")
        ? options.unknown
          ? []
          : [{ id: 1 }]
        : body.sql.includes("GROUP BY")
          ? []
          : rows;
    return Response.json({ success: true, result: [{ results }] });
  });
  vi.stubGlobal("fetch", fetch);
  return { calls, fetch, put };
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("exported Worker tips handler", () => {
  it("serves both orientations with canonical game/team ids and only primary SQL", async () => {
    const { calls, put } = setup();
    const response = await worker.fetch(
      new Request("https://tipper.test/tips?year=2026&round=24"),
      { DB: db },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(await response.json()).toEqual({
      tips: [
        {
          gameid: 38697,
          tipteamid: 15,
          hteam: "St Kilda",
          ateam: "Gold Coast",
          tip: "St Kilda",
          margin: 12,
          hmargin: 12,
          confidence: 70,
          hconfidence: 70,
          year: 2026,
          round: 24,
        },
        {
          gameid: 38699,
          tipteamid: 9,
          hteam: "Adelaide",
          ateam: "Greater Western Sydney",
          tip: "Greater Western Sydney",
          margin: 28,
          hmargin: -28,
          confidence: 69,
          hconfidence: 31,
          year: 2026,
          round: 24,
        },
      ],
    });
    expect(calls.at(-1)?.params).toEqual([2026, 24, "predha-080 (2641f46f)"]);
    expect(calls.every(({ sql }) => !/prediction_archive|INSERT|UPDATE|DELETE/.test(sql))).toBe(
      true,
    );
    expect(put).toHaveBeenCalledOnce();
    const cached = put.mock.calls[0]?.[1] as Response | undefined;
    expect(cached?.headers.get("Cache-Control")).toBe("public, max-age=3600");
  });
  it("serves primary tips without invented ids when Squiggle fails", async () => {
    setup({ outage: true });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const response = await worker.fetch(
      new Request("https://tipper.test/tips?year=2026&round=24"),
      { DB: db },
    );
    expect(response.status).toBe(200);
    const value = (await response.json()) as { tips: Record<string, unknown>[] };
    expect(value.tips).toHaveLength(2);
    expect(value.tips[0]).not.toHaveProperty("gameid");
    expect(value.tips[1]?.tip).toBe("Greater Western Sydney");
  });
  it("returns 404 for unknown rounds without fetching Squiggle", async () => {
    const { fetch } = setup({ unknown: true });
    const response = await worker.fetch(
      new Request("https://tipper.test/tips?year=2026&round=49"),
      { DB: db },
    );
    expect(response.status).toBe(404);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("defaults to the selected current or next published round", async () => {
    const { calls } = setup();
    const response = await worker.fetch(new Request("https://tipper.test/tips"), { DB: db });
    expect(response.status).toBe(200);
    expect(calls[0]?.params[0]).toBe("predha-080 (2641f46f)");
    expect(calls.at(-1)?.params.slice(0, 2)).toEqual([2026, 24]);
  });
  it.each(["?year=2026", "?round=24", "?year=2026&round=", "?year=2026&round=foo"])(
    "rejects malformed query %s before I/O",
    async (query) => {
      const { fetch } = setup();
      expect(
        (await worker.fetch(new Request(`https://tipper.test/tips${query}`), { DB: db })).status,
      ).toBe(400);
      expect(fetch).not.toHaveBeenCalled();
    },
  );
  it("handles CORS preflight, rejects writes, and keeps health independent", async () => {
    setup();
    expect(
      (
        await worker.fetch(new Request("https://tipper.test/tips", { method: "OPTIONS" }), {
          DB: db,
        })
      ).status,
    ).toBe(204);
    expect(
      (await worker.fetch(new Request("https://tipper.test/tips", { method: "POST" }), { DB: db }))
        .status,
    ).toBe(405);
    expect((await worker.fetch(new Request("https://tipper.test/health"), { DB: db })).status).toBe(
      200,
    );
    expect(
      (await worker.fetch(new Request("https://tipper.test/unknown"), { DB: db })).status,
    ).toBe(404);
  });
  it("reads a valid one-hour Cache API response without network access", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const cache = { match: vi.fn(async () => Response.json(fixture)) } as unknown as Cache;
    expect(await cachedRoundGames(2026, 24, cache)).toHaveLength(9);
    expect(fetch).not.toHaveBeenCalled();
  });
});
