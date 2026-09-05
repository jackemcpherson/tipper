/** Exit codes consumed by the weekly workflow. Alert status 2 belongs to scoring. */
export function monitorFailureCode(error: unknown): 1 | 3 | 4 {
  const message = error instanceof Error ? error.message : String(error);
  if (/No Cloudflare credentials|D1 REST API error \((401|403)\)/i.test(message)) return 3;
  if (/Squiggle field unavailable/i.test(message)) return 4;
  return 1;
}

/** Current season by default; a monitor run accepts exactly one explicit season. */
export function monitorSeason(seasons: readonly number[] | undefined, now = new Date()): number {
  if (!seasons) return now.getUTCFullYear();
  if (
    seasons.length !== 1 ||
    !Number.isInteger(seasons[0]) ||
    (seasons[0] ?? 0) < 1900 ||
    (seasons[0] ?? 0) > 2100
  )
    throw new Error("monitor requires exactly one valid season");
  return seasons[0] ?? now.getUTCFullYear();
}
