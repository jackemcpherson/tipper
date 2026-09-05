/**
 * Comp-format output for Squiggle submission.
 *
 * Produces a JSON payload mirroring the fields Squiggle ingests per tip
 * (inferred from the read API at api.squiggle.com.au/?q=tips). The gameid
 * field comes only from resolved Squiggle fixtures, never our internal ids.
 *
 * See docs/task-39-squiggle-submission.md for the channel spike findings.
 */

import type { SquiggleGameIdentity } from "./squiggle.js";
import type { MatchPrediction } from "./types.js";

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
  readonly gameid?: number;
  readonly tipteamid?: number;
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
export type CompPrediction = Pick<
  MatchPrediction,
  | "matchId"
  | "home"
  | "away"
  | "predictedWinner"
  | "predictedMargin"
  | "winProbability"
  | "roundNumber"
>;

export function toCompTip(
  prediction: CompPrediction,
  year: number,
  game?: SquiggleGameIdentity,
): CompTip {
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
    ...(game
      ? {
          gameid: game.id,
          tipteamid: prediction.predictedWinner === "home" ? game.hteamid : game.ateamid,
        }
      : {}),
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
export function formatTipsForComp(
  predictions: readonly CompPrediction[],
  year: number,
  games: ReadonlyMap<number, SquiggleGameIdentity> = new Map(),
): string {
  const tips = predictions.map((p) => toCompTip(p, year, games.get(p.matchId)));
  return JSON.stringify({ tips }, null, 2);
}
