/**
 * Cross-cutting types used across the tipper CLI.
 *
 * Domain types for match predictions, backtest results, and aggregate
 * metrics. Config-specific types live in src/config/schema.ts.
 */

/** Per-match prediction emitted by both predict and backtest commands. */
export interface MatchPrediction {
  readonly matchId: number;
  readonly date: string;
  readonly round: string;
  readonly roundNumber: number;
  readonly home: string;
  readonly away: string;
  readonly venue: string;

  readonly homeTeamRating: number;
  readonly awayTeamRating: number;
  readonly homeElo: number;
  readonly awayElo: number;
  readonly homePavTotal: number;
  readonly awayPavTotal: number;

  readonly predictedMargin: number;
  readonly predictedWinner: "home" | "away";
  readonly winProbability: { readonly home: number; readonly away: number };

  readonly actualMargin?: number | undefined;
  readonly actualWinner?: "home" | "away" | "draw" | undefined;
  readonly correct?: boolean | undefined;
}

/** Aggregate metrics for a set of predictions. */
export interface OverallMetrics {
  readonly matches: number;
  readonly tips: number;
  readonly tipPct: number;
  readonly maeMargin: number;
  readonly rmseMargin: number;
  readonly logLossBits: number;
  readonly brier: number;
}

/** Calibration bucket for reliability diagrams. */
export interface CalibrationBucket {
  readonly bucket: string;
  readonly predicted: number;
  readonly actual: number;
  readonly n: number;
}

/** Full backtest results bundle. */
export interface BacktestResults {
  readonly configId: string;
  readonly configHash: string;
  readonly ranAt: string;
  readonly dataThrough: string;
  readonly scope: {
    readonly seasons: readonly number[];
    readonly rounds?: readonly number[];
    readonly teams?: readonly string[];
  };

  readonly overall: OverallMetrics;
  readonly bySeason: Record<string, OverallMetrics>;
  readonly byRound?: ReadonlyArray<{ readonly roundNumber: number } & OverallMetrics>;

  readonly calibration: readonly CalibrationBucket[];
  readonly matches: readonly MatchPrediction[];
}

/** Elo state for all teams. */
export type EloState = Map<number, number>;

/** Per-player cumulative PAV state within a season. */
export interface PlayerPavState {
  readonly offPav: number;
  readonly midPav: number;
  readonly defPav: number;
  readonly totalPav: number;
}

/** Cumulative team-level stats used for PAV team-strength computation. */
export interface TeamCumulativeStats {
  points: number;
  insideFifties: number;
  pointsConceded: number;
  insideFiftiesConceded: number;
  gamesPlayed: number;
}

/** League-wide cumulative averages for PAV normalisation. */
export interface LeagueAverages {
  pointsPerInsideFifty: number;
  matchesProcessed: number;
}
