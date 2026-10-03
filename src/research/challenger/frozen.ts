import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";
import { CHALLENGER_IDENTITY, type ChallengerParams } from "./model.js";

/**
 * A frozen challenger: structural parameters selected on the tuning window
 * plus the margin fit used for live captures. Freezing records when and from
 * which source revision the parameters were chosen, so prospective captures
 * can be traced to a specific selection.
 */
export const ChallengerParamsSchema = z.object({
  team: z.object({
    k: z.number(),
    regression: z.number(),
    meanHalfLifeMatches: z.number(),
  }),
  accuracy: z.object({
    actualWeight: z.number(),
    teamShrinkShots: z.number(),
    leagueHalfLifeMatches: z.number(),
  }),
  player: z.object({
    decay: z.number(),
    window: z.number(),
    priorWeight: z.number(),
    prior: z.number().nullable(),
  }),
  venue: z.object({
    homeAdvantage: z.number(),
    travelK: z.number(),
    travelExponent: z.number(),
    experienceK: z.number(),
    experienceExponent: z.number(),
    experienceOffset: z.number(),
    homeStateKm: z.number(),
  }),
  weights: z.object({ team: z.number(), player: z.number() }),
  playerMode: z.enum(["sum", "relative"]),
  sigma: z.number(),
  typicalHalfLifeMatches: z.number(),
});
const FitSchema = z.object({
  from: z.number().int(),
  to: z.number().int(),
  n: z.number().int(),
  weights: z.object({ team: z.number(), player: z.number() }),
  sigma: z.number(),
});
export const FrozenModelSchema = z.object({
  identity: z.literal(CHALLENGER_IDENTITY),
  frozenAt: z.string(),
  sourceRevision: z.string(),
  /** Structural parameters with the tuning-window margin fit. */
  params: ChallengerParamsSchema,
  tuning: z.object({
    window: z.object({ from: z.number().int(), to: z.number().int() }),
    warmFrom: z.number().int(),
    objective: z.string(),
    stages: z.array(
      z.object({
        stage: z.string(),
        selected: z.string(),
        logLoss: z.number(),
        mae: z.number(),
        tips: z.number(),
        candidates: z.number().int(),
      }),
    ),
  }),
  /** Margin fit on every completed season, for live captures. */
  prospectiveFit: FitSchema,
});
export type FrozenModel = z.infer<typeof FrozenModelSchema>;
export const FROZEN_PATH = `benchmark/challenger/${CHALLENGER_IDENTITY}.json`;

/** Short digest of the structural parameters, recorded with every capture. */
export function paramsHash(params: ChallengerParams): string {
  const { weights, sigma, ...structural } = params;
  return createHash("sha256")
    .update(JSON.stringify({ structural, weights, sigma }))
    .digest("hex")
    .slice(0, 12);
}

export async function loadFrozen(path = FROZEN_PATH): Promise<FrozenModel> {
  return FrozenModelSchema.parse(JSON.parse(await readFile(path, "utf8")));
}

export async function saveFrozen(model: FrozenModel, path = FROZEN_PATH): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(FrozenModelSchema.parse(model), null, 2)}\n`);
}

/** Parameters for live use: structural parameters with the prospective margin fit. */
export function liveParams(model: FrozenModel): ChallengerParams {
  return {
    ...model.params,
    weights: model.prospectiveFit.weights,
    sigma: model.prospectiveFit.sigma,
  };
}
