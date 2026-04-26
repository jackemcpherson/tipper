/**
 * JSON output formatting.
 *
 * Emits the contract defined in the project plan §7.
 */

import type { BacktestResults, MatchPrediction } from "../../types.js";

/**
 * Format predictions as JSON for piping.
 */
export function formatPredictionsJson(
  predictions: readonly MatchPrediction[],
  configId: string,
  configHash: string,
  dataThrough: string,
): string {
  return JSON.stringify(
    {
      config_id: configId,
      config_hash: configHash,
      ran_at: new Date().toISOString(),
      data_through: dataThrough,
      predictions,
    },
    null,
    2,
  );
}

/**
 * Format full backtest results as JSON.
 */
export function formatBacktestJson(results: BacktestResults): string {
  return JSON.stringify(results, null, 2);
}
