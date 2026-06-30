/**
 * Pure comp-scoring functions for the weekly monitor.
 *
 * These mirror the Python conventions in analysis/weekly-monitor.py:
 *   - comp_tip:   draws are correct for every source (comp convention)
 *   - sign_tip:   draws excluded (engine convention, used in close band)
 *   - compRank:   rank among full-coverage sources by tips, MAE tiebreak
 *   - closeBandSign: sign accuracy on games the model considers close
 *   - marketGap:  season-to-date tip delta vs the market (Punters)
 *
 * No I/O — all inputs are plain values or MatchPrediction arrays.
 */

import type { MatchPrediction } from "../../types.js";

// ---------------------------------------------------------------------------
// Comp-tip convention
// ---------------------------------------------------------------------------

/**
 * Comp convention: draws are correct for EVERY source.
 *
 * A tip is correct when the game is a draw, OR when the predicted direction
 * matches the actual direction.
 */
export function compTip(predictedMargin: number, actualMargin: number): boolean {
  return actualMargin === 0 || predictedMargin >= 0 === actualMargin > 0;
}

// ---------------------------------------------------------------------------
// Rank table
// ---------------------------------------------------------------------------

/** One row in the comp rank table. */
export interface RankEntry {
  readonly name: string;
  readonly tips: number;
  /** Mean absolute margin error (null when not available). */
  readonly mae: number | null;
}

/**
 * Sort entries by tips descending, MAE ascending (null MAE treated as 99).
 *
 * Returns a new sorted array — does not mutate the input.
 */
export function sortRankTable(entries: readonly RankEntry[]): RankEntry[] {
  return [...entries].sort((a, b) => {
    if (b.tips !== a.tips) return b.tips - a.tips;
    return (a.mae ?? 99) - (b.mae ?? 99);
  });
}

/**
 * Rank a model in a combined field of full-coverage sources.
 *
 * `modelEntry` is inserted into `fieldEntries` (full-coverage Squiggle sources
 * only), and the resulting sorted position (1-indexed) is returned.
 */
export function compRank(modelEntry: RankEntry, fieldEntries: readonly RankEntry[]): number {
  const all = [...fieldEntries, modelEntry];
  const sorted = sortRankTable(all);
  return sorted.findIndex((e) => e === modelEntry || e.name === modelEntry.name) + 1;
}

// ---------------------------------------------------------------------------
// Close-band sign accuracy
// ---------------------------------------------------------------------------

/**
 * Sign accuracy on games the model considers close.
 *
 * "Close" means |predictedMargin| < threshold. Draws are excluded from both
 * the denominator and the numerator (engine convention: sign_tip).
 *
 * @param predictions - Full prediction array; filtering is done here.
 * @param threshold - Close-band threshold in margin points (default 12).
 */
export function closeBandSign(
  predictions: readonly Pick<
    MatchPrediction,
    "predictedMargin" | "actualMargin" | "actualWinner"
  >[],
  threshold = 12,
): { readonly correct: number; readonly total: number } {
  let correct = 0;
  let total = 0;

  for (const p of predictions) {
    if (p.actualMargin === undefined || p.actualWinner === undefined) continue;
    if (p.actualWinner === "draw") continue;
    if (Math.abs(p.predictedMargin) >= threshold) continue;

    total++;
    // direction: predictedMargin >= 0 means home predicted; actualMargin > 0 means home won
    if (p.predictedMargin >= 0 === p.actualMargin > 0) correct++;
  }

  return { correct, total };
}

// ---------------------------------------------------------------------------
// Market gap
// ---------------------------------------------------------------------------

const ALERT_THRESHOLD = 3;

/**
 * Season-to-date tip gap between the model and the market (Punters).
 *
 * Both tip counts are over the paired-games set (games where Punters has a
 * tip). The alert fires when |gap| >= 3 (A3 convention).
 */
export function marketGap(
  modelTips: number,
  puntersTips: number,
): { readonly gap: number; readonly alert: boolean } {
  const gap = modelTips - puntersTips;
  return { gap, alert: Math.abs(gap) >= ALERT_THRESHOLD };
}
