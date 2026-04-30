/**
 * Backtest metric computation.
 *
 * Computes aggregate metrics from an array of MatchPrediction results.
 */

import type {
  BootstrapComparison,
  BootstrapDelta,
  CalibrationBucket,
  MatchPrediction,
  OverallMetrics,
} from "../types.js";
import { createPrng } from "./prng.js";

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

/**
 * Paired bootstrap comparison of two prediction sets.
 *
 * Both arrays must cover the same matches (paired by matchId).
 * Resamples match indices with replacement and computes metric
 * deltas (A minus B) for each bootstrap iteration. Returns point
 * estimates and 95% CIs for each metric delta.
 *
 * @param predictionsA - Predictions from config A.
 * @param predictionsB - Predictions from config B.
 * @param nBootstrap - Number of bootstrap iterations (default 1000).
 * @param seed - PRNG seed for reproducibility (default 42).
 * @returns Bootstrap comparison with point estimates and CIs.
 * @throws If prediction arrays don't cover the same matches.
 */
export function bootstrapCompare(
  predictionsA: readonly MatchPrediction[],
  predictionsB: readonly MatchPrediction[],
  nBootstrap = 1000,
  seed = 42,
): BootstrapComparison {
  // Build paired arrays indexed by matchId
  const mapA = new Map(predictionsA.map((p) => [p.matchId, p]));
  const mapB = new Map(predictionsB.map((p) => [p.matchId, p]));

  if (mapA.size !== mapB.size) {
    throw new Error(
      `Prediction arrays have different match counts: A=${mapA.size}, B=${mapB.size}`,
    );
  }

  const matchIds: number[] = [];
  const pairedA: MatchPrediction[] = [];
  const pairedB: MatchPrediction[] = [];

  for (const [matchId, predA] of mapA) {
    const predB = mapB.get(matchId);
    if (predB === undefined) {
      throw new Error(`Match ${matchId} present in A but not in B`);
    }
    matchIds.push(matchId);
    pairedA.push(predA);
    pairedB.push(predB);
  }

  // Check B doesn't have extra matches
  for (const matchId of mapB.keys()) {
    if (!mapA.has(matchId)) {
      throw new Error(`Match ${matchId} present in B but not in A`);
    }
  }

  const n = matchIds.length;
  const metricsA = computeMetrics(predictionsA);
  const metricsB = computeMetrics(predictionsB);

  // Bootstrap: resample indices and compute deltas
  const rand = createPrng(seed);
  const logLossDeltas: number[] = [];
  const brierDeltas: number[] = [];
  const tipPctDeltas: number[] = [];

  for (let b = 0; b < nBootstrap; b++) {
    // Resample indices with replacement
    const sampleA: MatchPrediction[] = [];
    const sampleB: MatchPrediction[] = [];
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(rand() * n);
      const predA = pairedA[idx];
      const predB = pairedB[idx];
      if (predA === undefined || predB === undefined) continue;
      sampleA.push(predA);
      sampleB.push(predB);
    }

    const mA = computeMetrics(sampleA);
    const mB = computeMetrics(sampleB);

    logLossDeltas.push(mA.logLossBits - mB.logLossBits);
    brierDeltas.push(mA.brier - mB.brier);
    tipPctDeltas.push(mA.tipPct - mB.tipPct);
  }

  return {
    configA: metricsA,
    configB: metricsB,
    deltas: {
      logLossBits: buildDelta(metricsA.logLossBits - metricsB.logLossBits, logLossDeltas),
      brier: buildDelta(metricsA.brier - metricsB.brier, brierDeltas),
      tipPct: buildDelta(metricsA.tipPct - metricsB.tipPct, tipPctDeltas),
    },
    nBootstrap,
    seed,
  };
}

function buildDelta(point: number, samples: number[]): BootstrapDelta {
  const sorted = [...samples].sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length * 0.025)] ?? 0;
  const hi = sorted[Math.floor(sorted.length * 0.975)] ?? 0;
  const excludesZero = lo > 0 || hi < 0;
  return { point, ci95: [lo, hi], excludesZero };
}
