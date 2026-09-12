/**
 * Pre-match estimates of official AFL Player Rating points.
 *
 * A player's estimate is a recency-weighted average of previous matches, with
 * the latest match carrying the greatest weight, shrunk toward a prior by a
 * fixed weight. Players without any history receive the prior itself. The
 * prior tracks the competition's recent debut ratings, so a missing history is
 * never treated as zero.
 */
export interface PlayerParams {
  /** Weight multiplier per match further back in a player's history. */
  readonly decay: number;
  /** Most recent matches retained per player. */
  readonly window: number;
  /** Weight of the prior relative to one fully weighted match. */
  readonly priorWeight: number;
  /** Fixed prior rating, or null to track the competition's debut ratings. */
  readonly prior: number | null;
}
export const DEFAULT_PLAYER: PlayerParams = Object.freeze({
  decay: 0.9,
  window: 40,
  priorWeight: 3,
  prior: null,
});
/** Debut rating assumed before any debut is observed. */
export const INITIAL_DEBUT_RATING = 5;
const DEBUT_DECAY = 0.99;

/** Recency-weighted mean shrunk toward a prior. `history` is oldest first. */
export function estimateRating(
  history: readonly number[],
  prior: number,
  params: Pick<PlayerParams, "decay" | "priorWeight">,
): number {
  let sum = params.priorWeight * prior;
  let weights = params.priorWeight;
  for (let back = 0; back < history.length; back++) {
    const rating = history[history.length - 1 - back];
    if (rating === undefined) continue;
    const weight = params.decay ** back;
    sum += weight * rating;
    weights += weight;
  }
  return weights > 0 ? sum / weights : prior;
}

export class PlayerRatings {
  private readonly history = new Map<number, number[]>();
  private debutMean = INITIAL_DEBUT_RATING;

  constructor(private readonly params: PlayerParams = DEFAULT_PLAYER) {}

  prior(): number {
    return this.params.prior ?? this.debutMean;
  }

  games(player: number): number {
    return this.history.get(player)?.length ?? 0;
  }

  estimate(player: number): number {
    return estimateRating(this.history.get(player) ?? [], this.prior(), this.params);
  }

  /** Sum of estimates across a named lineup. */
  lineupStrength(players: readonly number[]): number {
    return players.reduce((sum, player) => sum + this.estimate(player), 0);
  }

  /** Record an observed rating after a match. Null observations are skipped, never zeroed. */
  record(player: number, rating: number | null): void {
    if (rating === null || !Number.isFinite(rating)) return;
    const rows = this.history.get(player) ?? [];
    if (rows.length === 0) this.debutMean += (1 - DEBUT_DECAY) * (rating - this.debutMean);
    rows.push(rating);
    if (rows.length > this.params.window) rows.splice(0, rows.length - this.params.window);
    this.history.set(player, rows);
  }
}
