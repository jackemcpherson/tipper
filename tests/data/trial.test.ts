import { afterEach, expect, it, vi } from "vitest";
import { createD1RestClient } from "../../src/data/d1-rest.js";
import { fetchTrialArchive } from "../../src/data/trial.js";

afterEach(() => vi.unstubAllGlobals());
it("scopes reads to one AFLM season and preserves unplayed fixtures", async () => {
  const requests: { sql: string; params: unknown[] }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, options: RequestInit) => {
      const body = JSON.parse(String(options.body));
      requests.push(body);
      return Response.json({
        success: true,
        result: [
          {
            results: body.sql.includes("prediction_archive")
              ? []
              : [{ match_id: 1, actual_margin: null, round_type: "Regular" }],
          },
        ],
      });
    }),
  );
  const result = await fetchTrialArchive(createD1RestClient("a", "b", "c"), 2027);
  expect(result).toEqual({
    provenance: "prospective",
    rows: [],
    results: [{ match_id: 1, actual_margin: null, round_type: "Regular" }],
  });
  expect(requests.map((request) => request.params)).toEqual([[2027, 0], [2027]]);
  expect(requests.every((request) => request.sql.includes("AFLM"))).toBe(true);
  expect(requests.every((request) => !/INSERT|UPDATE|DELETE/.test(request.sql))).toBe(true);
});
it("reports a missing migration instead of silently returning an empty trial", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({ success: false, errors: [{ message: "no such table: prediction_archive" }] }),
    ),
  );
  await expect(fetchTrialArchive(createD1RestClient("a", "b", "c"), 2027)).rejects.toThrow(
    "no such table",
  );
});
