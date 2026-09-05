/** Prediction residual effects for each team at each canonical venue. */
export type TeamVenueState = Map<string, { sum: number; n: number }>;

export function teamVenueAdjustment(
  state: TeamVenueState,
  venue: number,
  home: number,
  away: number,
  k: number,
): number {
  const effect = (team: number) => {
    const row = state.get(`${venue}:${team}`);
    return row ? row.sum / (row.n + k) : 0;
  };
  return effect(home) - effect(away);
}

/** Residual excludes this model's correction; one full appearance per team. */
export function updateTeamVenue(
  state: TeamVenueState,
  venue: number,
  home: number,
  away: number,
  residual: number,
): void {
  for (const [team, sign] of [
    [home, 1],
    [away, -1],
  ] as const) {
    const key = `${venue}:${team}`;
    const row = state.get(key) ?? { sum: 0, n: 0 };
    row.sum += (sign * residual) / 2;
    row.n++;
    state.set(key, row);
  }
}

export function decayTeamVenue(state: TeamVenueState, carry: number): void {
  for (const row of state.values()) {
    row.sum *= carry;
    row.n *= carry;
  }
}
