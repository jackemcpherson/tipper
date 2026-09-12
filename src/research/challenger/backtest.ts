import type { Reference, Season } from "../data.js";
import { type Summary, summarise } from "../scoring.js";
import {
  type ChallengerParams,
  type ChallengerPrediction,
  fitWeights,
  recombine,
  runChallenger,
  type Weights,
} from "./model.js";

/**
 * Walk-forward evaluation. Structural parameters stay fixed. For every
 * evaluated season the margin weights and sigma are refitted on the seasons
 * before it, so no evaluated result informs its own forecast.
 */
export interface SeasonEvaluation {
  readonly year: number;
  readonly fit: { readonly from: number; readonly to: number; readonly n: number };
  readonly weights: Weights;
  readonly sigma: number;
  readonly summary: Summary;
  readonly predictions: readonly ChallengerPrediction[];
  readonly lineupSources: Readonly<Record<string, number>>;
}
export interface WalkForwardOptions {
  /** First season fed to the ratings. */
  readonly warmFrom: number;
  /** First season whose predictions may enter a weight fit. */
  readonly fitFrom: number;
  readonly from: number;
  readonly to: number;
}

export const actualMargin = (p: ChallengerPrediction) =>
  (p.match.home_points ?? 0) - (p.match.away_points ?? 0);

export function walkForward(
  seasons: readonly Season[],
  reference: Reference,
  params: ChallengerParams,
  options: WalkForwardOptions,
): SeasonEvaluation[] {
  const usable = seasons.filter((s) => s.year >= options.warmFrom && s.year <= options.to);
  const raw = runChallenger(usable, reference, params, { predictFrom: options.fitFrom });
  const evaluations: SeasonEvaluation[] = [];
  for (let year = options.from; year <= options.to; year++) {
    const history = raw.filter((p) => p.match.year >= options.fitFrom && p.match.year < year);
    const fit = fitWeights(history, params.playerMode);
    const fitted = { ...params, weights: fit.weights, sigma: fit.sigma };
    const predictions = recombine(
      raw.filter((p) => p.match.year === year),
      fitted,
    );
    const completed = predictions.filter((p) => p.match.status === "Complete");
    const lineupSources: Record<string, number> = {};
    for (const p of predictions)
      lineupSources[p.lineupSource] = (lineupSources[p.lineupSource] ?? 0) + 1;
    evaluations.push({
      year,
      fit: { from: options.fitFrom, to: year - 1, n: fit.n },
      weights: fit.weights,
      sigma: fit.sigma,
      summary: summarise(
        completed.map((p) => ({
          homeProbability: p.homeProbability,
          homeMargin: p.margin,
          actual: actualMargin(p),
        })),
      ),
      predictions,
      lineupSources,
    });
  }
  return evaluations;
}

/** Pool completed predictions across evaluations. */
export function pooledSummary(evaluations: readonly SeasonEvaluation[]): Summary {
  return summarise(
    evaluations.flatMap((e) =>
      e.predictions
        .filter((p) => p.match.status === "Complete")
        .map((p) => ({
          homeProbability: p.homeProbability,
          homeMargin: p.margin,
          actual: actualMargin(p),
        })),
    ),
  );
}
