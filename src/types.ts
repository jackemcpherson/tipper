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
  readonly homePavZones: { readonly off: number; readonly mid: number; readonly def: number };
  readonly awayPavZones: { readonly off: number; readonly mid: number; readonly def: number };

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

/** Bootstrap delta for a single metric. */
export interface BootstrapDelta {
  readonly point: number;
  readonly ci95: readonly [number, number];
  readonly excludesZero: boolean;
}

/** Result of paired bootstrap comparison between two configs. */
export interface BootstrapComparison {
  readonly configA: OverallMetrics;
  readonly configB: OverallMetrics;
  readonly deltas: {
    readonly logLossBits: BootstrapDelta;
    readonly brier: BootstrapDelta;
    readonly tipPct: BootstrapDelta;
  };
  readonly nBootstrap: number;
  readonly seed: number;
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
