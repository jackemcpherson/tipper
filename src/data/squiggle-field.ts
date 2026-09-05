/** Read a round's pre-match field without making prediction publication depend on it. */
import { z } from "zod";

const FieldTipSchema = z.object({
  gameid: z.number().int(),
  sourceid: z.number().int(),
  source: z.string(),
  hteam: z.string(),
  ateam: z.string(),
  tip: z.string(),
  hconfidence: z.union([z.number(), z.string()]).nullable().optional(),
});
const FieldResponseSchema = z.object({ tips: z.array(FieldTipSchema) });

/** Validated field tip before outcome information is available. */
export type FieldTip = z.infer<typeof FieldTipSchema>;

/** Capture of all sources in a single round response. */
export interface RoundField {
  readonly capturedAt: string;
  readonly tips: readonly FieldTip[];
}

/** Fetch failure is visible in logs and represented by a missing snapshot. */
export async function fetchRoundField(
  season: number,
  round: number,
  clock: () => Date = () => new Date(),
): Promise<RoundField | null> {
  try {
    const response = await fetch(
      `https://api.squiggle.com.au/?q=tips;year=${season};round=${round}`,
      {
        headers: { "User-Agent": "tipper-worker/1.0 (jackemcpherson@gmail.com)" },
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!response.ok) throw new Error(`Squiggle HTTP ${response.status}`);
    const parsed = FieldResponseSchema.parse(await response.json());
    return { capturedAt: clock().toISOString(), tips: parsed.tips };
  } catch (error) {
    console.warn("[archive] Squiggle field unavailable", error);
    return null;
  }
}
