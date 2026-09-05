import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import { fetchRoundGames, SquiggleGamesSchema } from "../data/squiggle-games.js";
import type { SquiggleGameIdentity } from "../squiggle.js";

/** The CLI and Worker share validation and matching; only storage differs. */
export async function diskCachedRoundGames(
  year: number,
  round: number,
  directory = join(homedir(), ".cache", "tipper", "squiggle"),
  now = Date.now(),
): Promise<SquiggleGameIdentity[] | null> {
  const path = join(directory, `games-${year}-r${round}.json`);
  let stale: SquiggleGameIdentity[] | null = null;
  try {
    const value = z
      .object({ savedAt: z.number(), games: SquiggleGamesSchema.shape.games })
      .parse(JSON.parse(readFileSync(path, "utf8")));
    if (value.games.some((game) => game.year !== year || game.round !== round))
      throw new Error("Cached round mismatch");
    stale = value.games;
    if (now - value.savedAt >= 0 && now - value.savedAt < 3600000) return value.games;
  } catch {
    /* A missing or invalid file is a cache miss. */
  }
  const games = await fetchRoundGames(year, round);
  if (!games) return stale;
  try {
    mkdirSync(directory, { recursive: true });
    writeFileSync(path, JSON.stringify({ savedAt: now, games }));
  } catch (error) {
    console.warn("[tips] Cannot save Squiggle games cache", error);
  }
  return games;
}
