/**
 * Local filesystem cache for historical season data (CLI-only).
 *
 * Historical seasons are append-only: once a season has finished, its
 * matches/lineups/stats never change, so they can be cached indefinitely.
 * Only seasons strictly before the current calendar year are cached —
 * the current season is always fetched live. Best-effort: any read or
 * write failure silently falls back to fetching from the database.
 *
 * Cache location: $XDG_CACHE_HOME/tipper or ~/.cache/tipper.
 * Bypass with `--no-cache` or the TIPPER_NO_CACHE env var.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { z } from "zod";
import type { CompetitionCode } from "../data/types.js";
import type { SeasonData, SeasonDataCache } from "../orchestration.js";

const CACHE_VERSION = 1;

/**
 * Loose envelope validation: confirms the file is a cache file of the
 * right version/competition/year and has the three row arrays. The row
 * contents are trusted — they were written by us from typed query results.
 */
const CacheFileSchema = z.object({
  version: z.literal(CACHE_VERSION),
  competition: z.string(),
  year: z.number(),
  matches: z.array(z.record(z.string(), z.unknown())),
  lineups: z.array(z.record(z.string(), z.unknown())),
  stats: z.array(z.record(z.string(), z.unknown())),
});

function defaultCacheDir(): string {
  const xdg = process.env.XDG_CACHE_HOME;
  const base = xdg !== undefined && xdg.length > 0 ? xdg : join(homedir(), ".cache");
  return join(base, "tipper");
}

/** True when the cache should be bypassed entirely (TIPPER_NO_CACHE set). */
export function cacheDisabledByEnv(): boolean {
  const value = process.env.TIPPER_NO_CACHE;
  return value !== undefined && value !== "" && value !== "0";
}

/**
 * Resolve the cache for a command invocation.
 *
 * Returns undefined (no caching) when the `--no-cache` flag was passed
 * (commander sets `cache: false`) or TIPPER_NO_CACHE is set.
 */
export function resolveSeasonDataCache(
  competition: CompetitionCode,
  cacheFlag: boolean,
): SeasonDataCache | undefined {
  if (!cacheFlag || cacheDisabledByEnv()) return undefined;
  return createSeasonDataCache(competition);
}

/**
 * Create a filesystem-backed season data cache for one competition.
 *
 * @param competition - Competition code, part of the cache key.
 * @param dir - Cache directory (default: ~/.cache/tipper).
 * @param currentYear - Seasons >= this year are never cached (default: now).
 */
export function createSeasonDataCache(
  competition: CompetitionCode,
  dir: string = defaultCacheDir(),
  currentYear: number = new Date().getUTCFullYear(),
): SeasonDataCache {
  const fileFor = (year: number): string => join(dir, `${competition}-${year}.json`);
  const isCacheable = (year: number): boolean => year < currentYear;

  return {
    get(year: number): SeasonData | undefined {
      if (!isCacheable(year)) return undefined;
      try {
        const raw = readFileSync(fileFor(year), "utf-8");
        const parsed = CacheFileSchema.safeParse(JSON.parse(raw));
        if (
          !parsed.success ||
          parsed.data.competition !== competition ||
          parsed.data.year !== year
        ) {
          return undefined;
        }
        return {
          matches: parsed.data.matches as unknown as SeasonData["matches"],
          lineups: parsed.data.lineups as unknown as SeasonData["lineups"],
          stats: parsed.data.stats as unknown as SeasonData["stats"],
        };
      } catch {
        return undefined;
      }
    },

    set(year: number, data: SeasonData): void {
      if (!isCacheable(year)) return;
      try {
        mkdirSync(dir, { recursive: true });
        writeFileSync(
          fileFor(year),
          JSON.stringify({ version: CACHE_VERSION, competition, year, ...data }),
        );
      } catch {
        // Best-effort: a failed write just means a re-fetch next run.
      }
    },
  };
}
