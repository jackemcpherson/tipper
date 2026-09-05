import { fetchRoundGames, SquiggleGamesSchema } from "../data/squiggle-games.js";
import type { SquiggleGameIdentity } from "../squiggle.js";

/** Cache API response is scoped by year and round and expires after one hour. */
export async function cachedRoundGames(
  year: number,
  round: number,
  cache: Cache = (caches as CacheStorage & { readonly default: Cache }).default,
): Promise<SquiggleGameIdentity[] | null> {
  const key = new Request(`https://api.squiggle.com.au/?q=games;year=${year};round=${round}`);
  try {
    const hit = await cache.match(key);
    if (hit) {
      const games = SquiggleGamesSchema.parse(await hit.json()).games;
      if (games.some((game) => game.year !== year || game.round !== round))
        throw new Error("Cached round mismatch");
      return games;
    }
  } catch (error) {
    console.warn("[tips] Squiggle cache read failed", error);
  }
  const games = await fetchRoundGames(year, round);
  if (games) {
    try {
      await cache.put(
        key,
        Response.json({ games }, { headers: { "Cache-Control": "public, max-age=3600" } }),
      );
    } catch (error) {
      console.warn("[tips] Squiggle cache write failed", error);
    }
  }
  return games;
}
