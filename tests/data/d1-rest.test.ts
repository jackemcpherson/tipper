import { afterEach, describe, expect, it, vi } from "vitest";
import { createD1RestClient } from "../../src/data/d1-rest.js";

function restBody(results: unknown[]): unknown {
  return {
    success: true,
    errors: [],
    result: [{ results, success: true, meta: {} }],
  };
}

function mockFetch(body: unknown, status = 200): ReturnType<typeof vi.spyOn> {
  return vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

describe("createD1RestClient (TST-02)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("POSTs sql and bound params to the account/database query endpoint", async () => {
    const spy = mockFetch(restBody([{ n: 1 }]));
    const db = createD1RestClient("acc-1", "db-1", "tok");

    const { results } = await db.prepare("SELECT * FROM matches WHERE id = ?").bind(7).all();
    expect(results).toEqual([{ n: 1 }]);

    const [url, init] = spy.mock.calls[0] ?? [];
    expect(url).toBe("https://api.cloudflare.com/client/v4/accounts/acc-1/d1/database/db-1/query");
    const reqInit = init as RequestInit;
    expect((reqInit.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    expect(JSON.parse(reqInit.body as string)).toEqual({
      sql: "SELECT * FROM matches WHERE id = ?",
      params: [7],
    });
  });

  it("first() returns the first row or null", async () => {
    mockFetch(restBody([{ id: 1 }, { id: 2 }]));
    const db = createD1RestClient("a", "d", "t");
    expect(await db.prepare("SELECT 1").first()).toEqual({ id: 1 });

    vi.restoreAllMocks();
    mockFetch(restBody([]));
    expect(await db.prepare("SELECT 1").first()).toBeNull();
  });

  it("throws with status detail on HTTP errors", async () => {
    mockFetch({ message: "too many requests" }, 429);
    const db = createD1RestClient("a", "d", "t");
    await expect(db.prepare("SELECT 1").all()).rejects.toThrow(/429/);
  });

  it("throws the API error message when success=false", async () => {
    mockFetch({ success: false, errors: [{ message: "no such table: nope" }], result: [] });
    const db = createD1RestClient("a", "d", "t");
    await expect(db.prepare("SELECT * FROM nope").all()).rejects.toThrow(/no such table/);
  });
});
