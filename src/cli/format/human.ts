/**
 * Human-readable output formatting.
 */

import type { MatchPrediction, OverallMetrics } from "../../types.js";

/**
 * Format the config-aware header shown at the top of all output.
 */
export function formatHeader(
  configId: string,
  configHashShort: string,
  dataThrough: string,
  scope: string,
): string {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  return [
    `${scope}`,
    `Config: ${configId} (${configHashShort}) | Run: ${now} | Data: ${dataThrough}`,
    "─".repeat(75),
  ].join("\n");
}

/**
 * Format a single match prediction for display.
 *
 * Example: "Western Bulldogs vs Sydney (Marvel)        Sydney by 28.3    (69%)"
 */
export function formatPrediction(p: MatchPrediction): string {
  const matchup = `${p.home} vs ${p.away} (${p.venue})`;
  const winner = p.predictedWinner === "home" ? p.home : p.away;
  const margin = Math.abs(p.predictedMargin).toFixed(1);
  const prob = Math.round(Math.max(p.winProbability.home, p.winProbability.away) * 100);
  const prediction = `${winner} by ${margin}`;

  const padding = Math.max(2, 55 - matchup.length - prediction.length);
  return `${matchup}${" ".repeat(padding)}${prediction}    (${prob}%)`;
}

/**
 * Format overall metrics summary.
 */
export function formatMetrics(metrics: OverallMetrics, label: string): string {
  const lines = [
    label,
    "─".repeat(50),
    `  Matches: ${metrics.matches}`,
    `  Tips:    ${metrics.tips}/${metrics.matches} (${(metrics.tipPct * 100).toFixed(1)}%)`,
    `  MAE:     ${metrics.maeMargin.toFixed(2)}`,
    `  RMSE:    ${metrics.rmseMargin.toFixed(2)}`,
    `  Log loss: ${metrics.logLossBits.toFixed(4)} bits`,
    `  Brier:   ${metrics.brier.toFixed(4)}`,
  ];
  return lines.join("\n");
}
