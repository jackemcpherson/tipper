import { afterEach, expect, it, vi } from "vitest";
import { monitorFailureCode, monitorSeason } from "../../src/cli/monitor/errors.js";
import { fetchSquiggleField } from "../../src/cli/monitor/squiggle.js";

afterEach(() => vi.unstubAllGlobals());
it.each([
  ["No Cloudflare credentials found", 3],
  ["D1 REST API error (401): unauthorized", 3],
  ["D1 REST API error (403): forbidden", 3],
  ["Squiggle field unavailable: HTTP 503", 4],
  ["D1 query failed: missing table", 1],
])("classifies %s as exit %s", (message, expected) => {
  expect(monitorFailureCode(new Error(message))).toBe(expected);
});
it("derives each new season and accepts one explicit override", () => {
  expect(monitorSeason(undefined, new Date("2027-01-01T00:00:00Z"))).toBe(2027);
  expect(monitorSeason([2026], new Date("2027-01-01T00:00:00Z"))).toBe(2026);
  expect(() => monitorSeason([2026, 2027])).toThrow("exactly one");
  expect(() => monitorSeason([])).toThrow("exactly one");
});
it.each(["network", "schema"])("labels Squiggle %s failures distinctly", async (kind) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      if (kind === "network") throw new Error("socket closed");
      return Response.json({ games: "broken", tips: [] });
    }),
  );
  try {
    await fetchSquiggleField(2027);
    throw new Error("Expected failure");
  } catch (error) {
    expect(monitorFailureCode(error)).toBe(4);
  }
});
