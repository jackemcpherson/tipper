/**
 * Squiggle field loader for the weekly comp monitor.
 *
 * Fetches completed games and source tips for a season from the Squiggle API,
 * normalises team names to match the tipper model, and validates the response
 * with Zod at the boundary.
 */

import { z } from "zod";

/** User-Agent header required by Squiggle's API terms. */
const UA = "tipper-monitor/1.0 (jackemcpherson@gmail.com)";

/** Squiggle team name → our model team name. */
const SQ_TO_OURS: Record<string, string> = {
  "Greater Western Sydney": "GWS Giants",
};

function normaliseTeam(name: string): string {
  return SQ_TO_OURS[name] ?? name;
}

// ---------------------------------------------------------------------------
// Zod schemas (validate at the API boundary, trust types internally)
// ---------------------------------------------------------------------------

const RawGameSchema = z
  .object({
    id: z.number(),
    date: z.string(),
    hteam: z.string(),
    ateam: z.string(),
    hscore: z.number().nullable(),
    ascore: z.number().nullable(),
  })
  .passthrough();

const RawTipSchema = z
  .object({
    gameid: z.number(),
    source: z.string(),
    correct: z.number().nullable().optional(),
    err: z.union([z.number(), z.string()]).nullable().optional(),
    hconfidence: z.union([z.number(), z.string()]).nullable().optional(),
  })
  .passthrough();

const GamesResponseSchema = z.object({ games: z.array(RawGameSchema) });
const TipsResponseSchema = z.object({ tips: z.array(RawTipSchema) });

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** A completed Squiggle game with team names normalised to our model's names. */
export interface SquiggleGame {
  readonly id: number;
  /** Full date string from Squiggle — use `.slice(0, 10)` for the date-10 key. */
  readonly date: string;
  /** Home team name, normalised to our model's names. */
  readonly hteam: string;
  readonly ateam: string;
  readonly hscore: number;
  readonly ascore: number;
}

/** A single source tip for a completed game. */
export interface SquiggleTip {
  readonly gameid: number;
  readonly source: string;
  /** 1 if correct, 0 if wrong (null coerced to 0). */
  readonly correct: number;
  /** Absolute margin error (null when not provided). */
  readonly err: number | null;
  /** Home confidence as a percentage 0–100 (null when not provided). */
  readonly hconfidence: number | null;
}

/** Full Squiggle field for one season. */
export interface SquiggleField {
  readonly games: SquiggleGame[];
  readonly tips: SquiggleTip[];
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchJson(q: string, year: number): Promise<unknown> {
  const url = `https://api.squiggle.com.au/?q=${q};year=${year}`;
  const resp = await fetch(url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(15000),
  });
  if (!resp.ok) {
    throw new Error(`Squiggle API error: ${resp.status} ${resp.statusText} (${url})`);
  }
  return resp.json();
}

/**
 * Fetch the Squiggle field for a given season year.
 *
 * Fetches completed games and all source tips in parallel. Games with null
 * scores (in-progress or missing) are excluded. Team names are normalised to
 * match the tipper model.
 */
export async function fetchSquiggleField(year: number): Promise<SquiggleField> {
  try {
    const [gamesRaw, tipsRaw] = await Promise.all([
      fetchJson("games;complete=100", year),
      fetchJson("tips", year),
    ]);

    const { games: rawGames } = GamesResponseSchema.parse(gamesRaw);
    const { tips: rawTips } = TipsResponseSchema.parse(tipsRaw);

    const games: SquiggleGame[] = rawGames
      .filter((g) => g.hscore !== null && g.ascore !== null)
      .map((g) => ({
        id: g.id,
        date: g.date,
        hteam: normaliseTeam(g.hteam),
        ateam: normaliseTeam(g.ateam),
        hscore: g.hscore ?? 0,
        ascore: g.ascore ?? 0,
      }));

    const tips: SquiggleTip[] = rawTips.map((t) => ({
      gameid: t.gameid,
      source: t.source,
      correct: t.correct ?? 0,
      err: t.err !== undefined && t.err !== null ? Number(t.err) : null,
      hconfidence:
        t.hconfidence !== undefined && t.hconfidence !== null ? Number(t.hconfidence) : null,
    }));

    return { games, tips };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Squiggle field unavailable: ${message}`, { cause: error });
  }
}
