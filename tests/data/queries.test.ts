import { afterEach, describe, expect, it, vi } from "vitest";
import { createD1RestClient } from "../../src/data/d1-rest.js";
import { fetchNextUnplayedRound } from "../../src/data/queries.js";

function restBody(results: unknown[]): unknown {
  return {
    success: true,
    errors: [],
    result: [{ results, success: true, meta: {} }],
  };
}

function mockFetch(body: unknown): ReturnType<typeof vi.spyOn> {
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
}

describe("fetchNextUnplayedRound", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns the smallest unplayed round, scoped to competition and season", async () => {
    const spy = mockFetch(restBody([{ next_round: 18 }]));
    const db = createD1RestClient("a", "d", "t");

    const round = await fetchNextUnplayedRound(db, 2026, "AFLW");

    expect(round).toBe(18);
    const body = JSON.parse((spy.mock.calls[0]?.[1] as RequestInit).body as string) as {
      sql: string;
      params: unknown[];
    };
    expect(body.sql).toContain("MIN(m.round_number)");
    expect(body.sql).toContain("m.home_points IS NULL");
    expect(body.sql).toContain("c.code = ?");
    expect(body.params).toEqual(["AFLW", 2026]);
  });

  it("returns null when the season is fully played or unknown", async () => {
    mockFetch(restBody([{ next_round: null }]));
    const db = createD1RestClient("a", "d", "t");

    expect(await fetchNextUnplayedRound(db, 2019, "AFLM")).toBeNull();
  });
});
