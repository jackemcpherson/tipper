import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { diskCachedRoundGames } from "../../src/cli/squiggle-games.js";
import {
  fetchRoundGames,
  SQUIGGLE_USER_AGENT,
  SquiggleGamesSchema,
} from "../../src/data/squiggle-games.js";
import { resolveGameIds } from "../../src/squiggle.js";

const fixture: unknown = JSON.parse(
  readFileSync(new URL("../fixtures/squiggle-games-2026-r24.json", import.meta.url), "utf8"),
);
const games = SquiggleGamesSchema.parse(fixture).games;
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
it("matches a real round with GWS mapping and preserves home-away order", () => {
  const matches = [
    { matchId: 99, home: "Adelaide", away: "GWS Giants" },
    { matchId: 100, home: "GWS Giants", away: "Adelaide" },
  ];
  const resolved = resolveGameIds(matches, games);
  expect(resolved.get(99)?.id).toBe(38699);
  expect(resolved.has(100)).toBe(false);
  expect(() => resolveGameIds(matches, [...games, ...games])).toThrow("Ambiguous");
  expect(() =>
    resolveGameIds(
      [matches[0], matches[0]].filter((match) => match !== undefined),
      games,
    ),
  ).toThrow("Duplicate local");
});
it("uses one-hour CLI disk cache and retains stale ids during a network outage", async () => {
  const directory = mkdtempSync(join(tmpdir(), "tipper-games-"));
  try {
    const fetch = vi.fn(async () => Response.json(fixture));
    vi.stubGlobal("fetch", fetch);
    expect(await diskCachedRoundGames(2026, 24, directory, 1000)).toHaveLength(9);
    expect(await diskCachedRoundGames(2026, 24, directory, 2000)).toHaveLength(9);
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({
      headers: { "User-Agent": SQUIGGLE_USER_AGENT },
    });
    fetch.mockImplementation(async () => new Response("down", { status: 503 }));
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await diskCachedRoundGames(2026, 24, directory, 3601001)).toHaveLength(9);
    expect(fetch).toHaveBeenCalledTimes(2);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
it.each([{ games: [{ id: "wrong" }] }, { games: games.map((game) => ({ ...game, year: 2025 })) }])(
  "fails soft on invalid or wrong-round responses",
  async (body) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(body)),
    );
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await fetchRoundGames(2026, 24)).toBeNull();
  },
);
