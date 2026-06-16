/**
 * Walk-forward per-venue prediction-side home advantage (Task 38a).
 *
 * Mirrors the team-offset pattern: residuals against the offset-adjusted
 * predicted margin accumulate by venue, the venue's running mean is mixed
 * with the global mean by `alpha`, and small-sample venues fall back to
 * the global mean. Self-correcting — once the venue HGA absorbs the
 * venue's residual, updates stop drifting.
 */

export interface VenueHaPredState {
  sum: Map<number, number>;
  n: Map<number, number>;
  globalSum: number;
  globalN: number;
}

export function createVenueHaPredState(): VenueHaPredState {
  return { sum: new Map(), n: new Map(), globalSum: 0, globalN: 0 };
}

/**
 * Current per-venue prediction-side HGA in margin points.
 *
 * Returns the global mean when the venue has fewer than `minN` updates,
 * otherwise an alpha-weighted mix of the venue's own mean and the global
 * mean: alpha=1 uses the venue mean directly (no shrinkage), alpha=0
 * collapses to the global mean (full shrinkage).
 */
export function getVenueHaPred(
  state: VenueHaPredState,
  venueId: number,
  alpha: number,
  minN: number,
): number {
  const globalMean = state.globalN > 0 ? state.globalSum / state.globalN : 0;
  const n = state.n.get(venueId) ?? 0;
  if (n < minN) return globalMean;
  const venueMean = (state.sum.get(venueId) ?? 0) / n;
  return alpha * venueMean + (1 - alpha) * globalMean;
}

/**
 * Record a completed match's residual against the full prediction.
 *
 * Pass `actualMargin - predictedMargin` (the same residual used by the
 * team-offset updater). Self-correcting: once the per-venue HGA absorbs
 * the venue's mean residual, the residuals oscillate around zero.
 */
export function updateVenueHaPred(
  state: VenueHaPredState,
  venueId: number,
  residual: number,
): void {
  state.sum.set(venueId, (state.sum.get(venueId) ?? 0) + residual);
  state.n.set(venueId, (state.n.get(venueId) ?? 0) + 1);
  state.globalSum += residual;
  state.globalN += 1;
}
