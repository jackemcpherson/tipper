import { z } from "zod";
import { formatTipsForComp } from "../comp.js";
import { shortHash } from "../config/hash.js";
import { formatModelVersion } from "../data/publish.js";
import { fetchDefaultTipsRound, fetchPrimaryTips } from "../data/tips.js";
import { resolveGameIds, type SquiggleGameIdentity } from "../squiggle.js";
import { BAKED_CONFIG_HASH, BAKED_CONFIG_ID } from "./baked-config.js";
import { melbourneClock } from "./plan.js";
import { cachedRoundGames } from "./squiggle.js";

export const TIPS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

/** Serve primary rows even when Squiggle is unavailable. No external fetch writes predictions. */
export async function tipsResponse(
  request: Request,
  db: D1Database,
  now = new Date(),
): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const year = params.get("year");
  const round = params.get("round");
  const version = formatModelVersion(BAKED_CONFIG_ID, shortHash(BAKED_CONFIG_HASH));
  let selected: { year: number; round: number } | null;
  if (year !== null || round !== null) {
    if (year === null || round === null)
      return Response.json(
        { error: "Provide both year and round" },
        { status: 400, headers: TIPS_HEADERS },
      );
    const parsed = z
      .object({
        year: z.coerce.number().int().min(1900).max(2100),
        round: z.coerce.number().int().min(0).max(50),
      })
      .safeParse({ year, round });
    if (!parsed.success || !/^\d+$/.test(year) || !/^\d+$/.test(round))
      return Response.json(
        { error: "Invalid year or round" },
        { status: 400, headers: TIPS_HEADERS },
      );
    selected = parsed.data;
  } else selected = await fetchDefaultTipsRound(db, version, melbourneClock(now).date);
  if (!selected)
    return Response.json({ error: "No published round" }, { status: 404, headers: TIPS_HEADERS });
  const result = await fetchPrimaryTips(db, selected.year, selected.round, version);
  if (!result.exists)
    return Response.json({ error: "Unknown round" }, { status: 404, headers: TIPS_HEADERS });
  let games = new Map<number, SquiggleGameIdentity>();
  if (result.predictions.length) {
    try {
      games = resolveGameIds(
        result.predictions,
        (await cachedRoundGames(selected.year, selected.round)) ?? [],
      );
    } catch (error) {
      console.warn("[tips] Cannot resolve Squiggle game ids", error);
    }
  }
  return new Response(formatTipsForComp(result.predictions, selected.year, games), {
    headers: TIPS_HEADERS,
  });
}
