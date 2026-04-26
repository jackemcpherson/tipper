/**
 * Backtest metric computation.
 *
 * Computes aggregate metrics from an array of MatchPrediction results.
 */

import type { CalibrationBucket, MatchPrediction, OverallMetrics } from "../types.js";

/**
 * Compute aggregate metrics for a set of predictions.
 *
 * Draws are excluded from tip_pct (denominator only counts decisive matches).
 * Log loss is clamped to [0.01, 0.99] before computation.
 */
export function computeMetrics(predictions: readonly MatchPrediction[]): OverallMetrics {
  const withActuals = predictions.filter(
    (p) => p.actualMargin !== undefined && p.actualWinner !== undefined,
  );

  if (withActuals.length === 0) {
    return {
      matches: 0,
      tips: 0,
      tipPct: 0,
      maeMargin: 0,
      rmseMargin: 0,
      logLossBits: 0,
      brier: 0,
    };
  }

  const decisive = withActuals.filter((p) => p.actualWinner !== "draw");
  const tips = decisive.filter((p) => p.correct === true).length;
  const tipPct = decisive.length > 0 ? tips / decisive.length : 0;

  let sumAbsError = 0;
  let sumSqError = 0;
  let sumLogLoss = 0;
  let sumBrier = 0;

  for (const p of withActuals) {
    const actualMargin = p.actualMargin ?? 0;
    const error = p.predictedMargin - actualMargin;
    sumAbsError += Math.abs(error);
    sumSqError += error * error;

    // Win probability for the team that actually won (or home for draws)
    const homeWon = (p.actualMargin ?? 0) > 0;
    const probCorrect = homeWon ? p.winProbability.home : p.winProbability.away;
    const clamped = Math.max(0.01, Math.min(0.99, probCorrect));

    // Log loss in bits (base 2)
    sumLogLoss += -Math.log2(clamped);

    // Brier score: (forecast - outcome)^2
    const outcome = homeWon ? 1 : 0;
    sumBrier += (p.winProbability.home - outcome) ** 2;
  }

  return {
    matches: withActuals.length,
    tips,
    tipPct,
    maeMargin: sumAbsError / withActuals.length,
    rmseMargin: Math.sqrt(sumSqError / withActuals.length),
    logLossBits: sumLogLoss / withActuals.length,
    brier: sumBrier / withActuals.length,
  };
}

/**
 * Compute calibration buckets for reliability diagrams.
 *
 * Buckets predicted win probability into deciles and compares
 * against actual outcomes.
 */
export function computeCalibration(predictions: readonly MatchPrediction[]): CalibrationBucket[] {
  const buckets: { predicted: number; actual: number; n: number }[] = Array.from(
    { length: 10 },
    () => ({ predicted: 0, actual: 0, n: 0 }),
  );

  for (const p of predictions) {
    if (p.actualWinner === undefined) continue;

    // Use higher of home/away prob as the "confidence"
    const confidence = Math.max(p.winProbability.home, p.winProbability.away);
    const bucketIdx = Math.min(9, Math.floor(confidence * 10));
    const bucket = buckets[bucketIdx];
    if (!bucket) continue;

    bucket.predicted += confidence;
    bucket.actual += p.correct === true ? 1 : 0;
    bucket.n += 1;
  }

  return buckets
    .map((b, i) => ({
      bucket: `${(i * 10).toString()}-${((i + 1) * 10).toString()}%`,
      predicted: b.n > 0 ? b.predicted / b.n : 0,
      actual: b.n > 0 ? b.actual / b.n : 0,
      n: b.n,
    }))
    .filter((b) => b.n > 0);
}
