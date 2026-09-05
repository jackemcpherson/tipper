/** Canonical game identity is independent of our database ids. */
import { toSquiggleName } from "./comp.js";
export interface SquiggleGameIdentity {
  readonly id: number;
  readonly hteam: string;
  readonly ateam: string;
  readonly hteamid: number;
  readonly ateamid: number;
  readonly year: number;
  readonly round: number;
}
export interface MatchIdentity {
  readonly matchId: number;
  readonly home: string;
  readonly away: string;
}

/** Match a single round by ordered canonical team names. Ambiguity fails closed. */
export function resolveGameIds(
  matches: readonly MatchIdentity[],
  games: readonly SquiggleGameIdentity[],
): Map<number, SquiggleGameIdentity> {
  const byPair = new Map<string, SquiggleGameIdentity>();
  for (const game of games) {
    const key = JSON.stringify([game.hteam, game.ateam]);
    if (byPair.has(key))
      throw new Error(`Ambiguous Squiggle pairing: ${game.hteam} v ${game.ateam}`);
    byPair.set(key, game);
  }
  const resolved = new Map<number, SquiggleGameIdentity>();
  const seen = new Set<number>();
  for (const match of matches) {
    if (seen.has(match.matchId)) throw new Error(`Duplicate local match ${match.matchId}`);
    seen.add(match.matchId);
    const game = byPair.get(
      JSON.stringify([toSquiggleName(match.home), toSquiggleName(match.away)]),
    );
    if (game) resolved.set(match.matchId, game);
  }
  return resolved;
}
