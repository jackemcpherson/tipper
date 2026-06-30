/**
 * Comp-format output for Squiggle submission.
 *
 * Produces a JSON payload mirroring the fields Squiggle ingests per tip
 * (inferred from the read API at api.squiggle.com.au/?q=tips). The gameid
 * field is omitted because our matchId is an internal DB ID, not the
 * Squiggle canonical ID — that linkage belongs in the live-feed follow-up.
 *
 * See docs/task-39-squiggle-submission.md for the channel spike findings.
 */

import type { MatchPrediction } from "../../types.js";

/** Maps our DB team names to Squiggle's canonical spelling where they differ. */
const TEAM_NAME_MAP: Readonly<Record<string, string>> = {
  "GWS Giants": "Greater Western Sydney",
};

/** Translate one of our team names to Squiggle's canonical spelling. */
export function toSquiggleName(name: string): string {
  return TEAM_NAME_MAP[name] ?? name;
}

/** One game's entry in the comp payload. */
export interface CompTip {
  /** Home team name (Squiggle spelling). */
  readonly hteam: string;
  /** Away team name (Squiggle spelling). */
  readonly ateam: string;
  /** Predicted winning team name (Squiggle spelling). */
  readonly tip: string;
  /** Tipped team's predicted winning margin (positive, rounded to integer). */
  readonly margin: number;
  /** Predicted margin from home-team perspective (positive = home wins). */
  readonly hmargin: number;
  /** Tipped team's win probability as an integer percentage (0–100). */
  readonly confidence: number;
  /** Home team's win probability as an integer percentage (0–100). */
  readonly hconfidence: number;
  /** Season year. */
  readonly year: number;
  /** Round number. */
  readonly round: number;
}

/**
 * Map a single MatchPrediction to a CompTip entry.
 *
 * margin / hmargin are rounded to the nearest integer.
 * confidence / hconfidence are the win probabilities expressed as integer
 * percentages (0–100), matching Squiggle's convention.
 */
export function toCompTip(prediction: MatchPrediction, year: number): CompTip {
  const hteam = toSquiggleName(prediction.home);
  const ateam = toSquiggleName(prediction.away);
  const tip =
    prediction.predictedWinner === "home"
      ? toSquiggleName(prediction.home)
      : toSquiggleName(prediction.away);

  // predictedMargin is positive when home is favoured.
  const hmargin = Math.round(prediction.predictedMargin);
  const margin = Math.abs(hmargin);

  const hconfidence = Math.round(prediction.winProbability.home * 100);
  const confidence =
    prediction.predictedWinner === "home"
      ? hconfidence
      : Math.round(prediction.winProbability.away * 100);

  return {
    hteam,
    ateam,
    tip,
    margin,
    hmargin,
    confidence,
    hconfidence,
    year,
    round: prediction.roundNumber,
  };
}

/**
 * Format predictions as a Squiggle-compatible comp payload.
 *
 * Returns a JSON string with a `tips` array, one entry per game.
 */
export function formatTipsForComp(predictions: readonly MatchPrediction[], year: number): string {
  const tips = predictions.map((p) => toCompTip(p, year));
  return JSON.stringify({ tips }, null, 2);
}
