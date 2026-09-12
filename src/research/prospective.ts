import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";

/**
 * Append-only prospective captures for challenger models.
 *
 * Every capture records what a challenger predicted before a match, from which
 * inputs and source revision. Lines are only ever appended. The issued
 * prediction for scoring is the last capture generated before the recorded
 * kickoff, so later captures or backfills cannot replace it.
 */
export const CaptureSchema = z.object({
  matchId: z.number().int().positive(),
  season: z.number().int(),
  round: z.number().int(),
  homeTeamId: z.number().int().positive(),
  awayTeamId: z.number().int().positive(),
  kickoffAt: z.string(),
  model: z.string(),
  version: z.string(),
  paramsHash: z.string(),
  sourceRevision: z.string(),
  generatedAt: z.string(),
  lineupObservedAt: z.string().nullable(),
  lineupState: z.enum(["provisional", "lineup-ready"]),
  winner: z.enum(["home", "away"]),
  margin: z.number(),
  issuedMargin: z.number(),
  homeProbability: z.number(),
  inputs: z.object({
    seasonsFetchedAt: z.string(),
    completedMatches: z.number().int(),
    latestCompletedMatchId: z.number().int().nullable(),
    lineupSource: z.string(),
    frozenAt: z.string(),
  }),
});
export type Capture = z.infer<typeof CaptureSchema>;

export const capturePath = (season: number, model: string) =>
  `benchmark/prospective/${season}/${model}.jsonl`;

export async function readCaptures(path: string): Promise<Capture[]> {
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  return text
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => CaptureSchema.parse(JSON.parse(line)));
}

/**
 * Decide whether a fresh prediction adds evidence. A capture is new when the
 * match has none, the lineup state improved, the kickoff moved, or the
 * forecast changed after new results arrived.
 */
export function isNewCapture(existing: readonly Capture[], fresh: Capture): boolean {
  const previous = existing.filter((c) => c.matchId === fresh.matchId).at(-1);
  if (!previous) return true;
  return (
    previous.lineupState !== fresh.lineupState ||
    previous.kickoffAt !== fresh.kickoffAt ||
    previous.version !== fresh.version ||
    previous.inputs.latestCompletedMatchId !== fresh.inputs.latestCompletedMatchId ||
    previous.margin !== fresh.margin
  );
}

/** Append captures. Existing lines are never rewritten. */
export async function appendCaptures(path: string, captures: readonly Capture[]): Promise<number> {
  if (!captures.length) return 0;
  await mkdir(dirname(path), { recursive: true });
  await appendFile(
    path,
    `${captures.map((c) => JSON.stringify(CaptureSchema.parse(c))).join("\n")}\n`,
  );
  return captures.length;
}

/** The capture that counts: the last one generated before its own recorded kickoff. */
export function issuedCapture(captures: readonly Capture[], matchId: number): Capture | undefined {
  return captures
    .filter((c) => c.matchId === matchId && c.generatedAt < c.kickoffAt)
    .sort((a, b) => a.generatedAt.localeCompare(b.generatedAt))
    .at(-1);
}

export function leadTimeMinutes(capture: Capture): number {
  return (Date.parse(capture.kickoffAt) - Date.parse(capture.generatedAt)) / 60_000;
}
