import { z } from "zod";
import type { SquiggleGameIdentity } from "../squiggle.js";

export const SQUIGGLE_USER_AGENT = "tipper-worker/1.0 (jackemcpherson@gmail.com)";
export const SquiggleGamesSchema = z.object({
  games: z.array(
    z.object({
      id: z.number().int().positive(),
      hteam: z.string(),
      ateam: z.string(),
      hteamid: z.number().int().positive(),
      ateamid: z.number().int().positive(),
      year: z.number().int(),
      round: z.number().int(),
    }),
  ),
});

/** Public read API. An outage means unknown ids, never our internal ids. */
export async function fetchRoundGames(
  year: number,
  round: number,
): Promise<SquiggleGameIdentity[] | null> {
  try {
    const response = await fetch(
      `https://api.squiggle.com.au/?q=games;year=${year};round=${round}`,
      {
        headers: { "User-Agent": SQUIGGLE_USER_AGENT },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!response.ok) throw new Error(`Squiggle games HTTP ${response.status}`);
    const { games } = SquiggleGamesSchema.parse(await response.json());
    if (games.some((game) => game.year !== year || game.round !== round))
      throw new Error("Squiggle returned another round");
    return games;
  } catch (error) {
    console.warn("[tips] Squiggle game ids unavailable", error);
    return null;
  }
}
