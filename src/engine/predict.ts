/**
 * Rating difference → margin → win probability.
 *
 * Pure functions consuming the blended team rating to produce
 * match predictions.
 */

import type { Config } from "../config/schema.js";

/** Standard normal CDF approximation (Abramowitz and Stegun). */
function normalCdf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp((-absX * absX) / 2);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Predict match margin from rating difference.
 *
 * predicted_margin = (home_rating - away_rating) × margin_per_rating_point
 *
 * Positive = home favoured.
 */
export function predictMargin(
  homeRating: number,
  awayRating: number,
  outputConfig: Config["output"],
): number {
  return (homeRating - awayRating) * outputConfig.margin_per_rating_point;
}

/** Win probability clamp bounds. */
const WIN_PROB_MIN = 0.01;
const WIN_PROB_MAX = 0.99;

/**
 * Compute home win probability from predicted margin.
 *
 * win_prob_home = NormalCDF(margin / sigma), clamped to [0.01, 0.99].
 *
 * @param predictedMargin - Predicted margin (positive = home favoured).
 * @param sigma - Standard deviation of margin distribution.
 * @returns Clamped win probability.
 */
export function computeWinProbability(
  predictedMargin: number,
  sigma: number,
): { home: number; away: number } {
  const rawHome = normalCdf(predictedMargin / sigma);
  const home = Math.max(WIN_PROB_MIN, Math.min(WIN_PROB_MAX, rawHome));
  return { home, away: 1 - home };
}
