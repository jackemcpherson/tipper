/**
 * Walk-forward team performance offsets.
 *
 * A slow-moving, heavily-shrunk per-team estimate of how far a team
 * performs above or below its blended rating, in margin points
 * (Task 24/31: cellar-dweller tail bias). Learned from prediction
 * residuals against the offset-adjusted margin, so the estimator is
 * self-correcting: once the offset explains the residual, updates
 * stop drifting.
 */

/** Team offset state: running residual sums and effective counts. */
export interface TeamOffsetState {
  sum: Map<number, number>;
  n: Map<number, number>;
}

export function createTeamOffsetState(): TeamOffsetState {
  return { sum: new Map(), n: new Map() };
}

/**
 * Current offset for a team: shrunk mean of its attributed residuals.
 *
 * offset = sum / (n + k) — equivalent to a zero-mean prior worth k
 * games of evidence (James-Stein-style shrinkage toward 0).
 */
export function getTeamOffset(state: TeamOffsetState, teamId: number, k: number): number {
  return (state.sum.get(teamId) ?? 0) / ((state.n.get(teamId) ?? 0) + k);
}

/**
 * Update offsets after a completed match.
 *
 * The home-oriented residual (actual − offset-adjusted predicted margin)
 * is split half to each side: home outperforming means the away side
 * underperformed by the same evidence.
 */
export function updateTeamOffsets(
  state: TeamOffsetState,
  homeTeamId: number,
  awayTeamId: number,
  residual: number,
): void {
  state.sum.set(homeTeamId, (state.sum.get(homeTeamId) ?? 0) + residual / 2);
  state.sum.set(awayTeamId, (state.sum.get(awayTeamId) ?? 0) - residual / 2);
  state.n.set(homeTeamId, (state.n.get(homeTeamId) ?? 0) + 0.5);
  state.n.set(awayTeamId, (state.n.get(awayTeamId) ?? 0) + 0.5);
}

/**
 * Decay offset evidence at a season boundary.
 *
 * carry = 1 keeps the full estimate across seasons, 0 resets it.
 */
export function decayTeamOffsets(state: TeamOffsetState, carry: number): void {
  for (const [teamId, value] of state.sum) {
    state.sum.set(teamId, value * carry);
  }
  for (const [teamId, value] of state.n) {
    state.n.set(teamId, value * carry);
  }
}
