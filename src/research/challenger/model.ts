import type { Match, Reference, Season } from "../data.js";
import { type AccuracyParams, AccuracyTracker, DEFAULT_ACCURACY } from "./adjusted-score.js";
import { DEFAULT_PLAYER, type PlayerParams, PlayerRatings } from "./player-ratings.js";
import { DEFAULT_TEAM_RATING, type TeamRatingParams, TeamRatings } from "./team-ratings.js";
import { DEFAULT_VENUE, type VenueEffect, VenueModel, type VenueParams } from "./venue.js";

/**
 * Wheelo-inspired challenger: attacking and defensive team ratings updated on
 * accuracy-adjusted scores, a named-lineup Player Rating component and an
 * explicit venue effect. This is an independent implementation of the parts
 * of Andrew Whelan's published methodology that Tipper's data supports. It is
 * not a reproduction of Wheelo.
 *
 * Every prediction uses only matches completed before the target match's
 * date, so a chronological replay cannot leak later results.
 */
export const CHALLENGER_IDENTITY = "wheelo-inspired-v1";

export interface Weights {
  readonly team: number;
  readonly player: number;
}
export type PlayerMode = "sum" | "relative";
export interface ChallengerParams {
  readonly team: TeamRatingParams;
  readonly accuracy: AccuracyParams;
  readonly player: PlayerParams;
  readonly venue: VenueParams;
  readonly weights: Weights;
  readonly playerMode: PlayerMode;
  /** Standard deviation of the margin error, for the win probability. */
  readonly sigma: number;
  /** Matches over which a club's typical lineup strength loses half its weight. */
  readonly typicalHalfLifeMatches: number;
}
export const DEFAULT_CHALLENGER: ChallengerParams = Object.freeze({
  team: DEFAULT_TEAM_RATING,
  accuracy: DEFAULT_ACCURACY,
  player: DEFAULT_PLAYER,
  venue: DEFAULT_VENUE,
  weights: Object.freeze({ team: 1, player: 0 }),
  playerMode: "sum",
  sigma: 34,
  typicalHalfLifeMatches: 8,
});
/** The 2020 season played sixteen-minute quarters. Scores scale to a full-length match. */
export const SHORT_QUARTER_SCALE: Readonly<Record<number, number>> = Object.freeze({ 2020: 1.25 });

export type LineupSource = "named" | "played" | "none";
export interface Lineup {
  readonly home: readonly number[];
  readonly away: readonly number[];
  readonly source: LineupSource;
}
export interface SideState {
  readonly attack: number;
  readonly defence: number;
  readonly players: number;
  readonly typicalPlayers: number;
  readonly lineup: number;
}
export interface ChallengerPrediction {
  readonly match: Match;
  readonly teamMargin: number;
  readonly playerDiff: number;
  readonly playerRelativeDiff: number;
  readonly venue: VenueEffect;
  readonly home: SideState;
  readonly away: SideState;
  readonly lineupSource: LineupSource;
  readonly margin: number;
  readonly homeProbability: number;
}

export interface RunOptions {
  /** First season whose matches are predicted. Earlier seasons only warm the state. */
  readonly predictFrom: number;
  /** Override lineups, for prospective use with observed announced teams. */
  readonly lineups?: (match: Match) => Lineup | undefined;
}

/** Standard normal integral. */
export function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const poly =
    t *
    (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const tail = (Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI)) * poly;
  return x >= 0 ? 1 - tail : tail;
}

/** Combine components into a margin and clamped win probability. */
export function combine(
  components: Pick<
    ChallengerPrediction,
    "teamMargin" | "playerDiff" | "playerRelativeDiff" | "venue"
  >,
  params: Pick<ChallengerParams, "weights" | "playerMode" | "sigma">,
): { margin: number; homeProbability: number } {
  const player =
    params.playerMode === "relative" ? components.playerRelativeDiff : components.playerDiff;
  const margin =
    params.weights.team * components.teamMargin +
    params.weights.player * player +
    components.venue.total;
  const homeProbability = Math.max(0.01, Math.min(0.99, normalCdf(margin / params.sigma)));
  return { margin, homeProbability };
}

/** Recompute margins and probabilities for new weights without replaying. */
export function recombine(
  predictions: readonly ChallengerPrediction[],
  params: Pick<ChallengerParams, "weights" | "playerMode" | "sigma">,
): ChallengerPrediction[] {
  return predictions.map((p) => ({ ...p, ...combine(p, params) }));
}

const complete = (m: Match) =>
  m.status === "Complete" &&
  m.home_points !== null &&
  m.away_points !== null &&
  m.home_goals !== null &&
  m.home_behinds !== null &&
  m.away_goals !== null &&
  m.away_behinds !== null;

const LINEUP_SIZES = new Set([22, 23]);

/** Walk every season chronologically, predicting from `predictFrom` onward. */
export function runChallenger(
  seasons: readonly Season[],
  reference: Reference,
  params: ChallengerParams = DEFAULT_CHALLENGER,
  options: RunOptions,
): ChallengerPrediction[] {
  const teams = new TeamRatings(params.team);
  const accuracy = new AccuracyTracker(params.accuracy);
  const players = new PlayerRatings(params.player);
  const venue = new VenueModel(reference, params.venue);
  const typical = new Map<number, number>();
  const typicalDecay = 0.5 ** (1 / params.typicalHalfLifeMatches);
  const predictions: ChallengerPrediction[] = [];
  let year: number | undefined;
  for (const season of [...seasons].sort((a, b) => a.year - b.year)) {
    if (year !== undefined && season.year !== year) {
      teams.newSeason();
      accuracy.newSeason();
    }
    year = season.year;
    const scale = SHORT_QUARTER_SCALE[season.year] ?? 1;
    const named = new Map<number, Map<number, number[]>>();
    for (const l of season.lineups) {
      if (l.is_emergency !== 0) continue;
      const byTeam = named.get(l.match_id) ?? new Map<number, number[]>();
      byTeam.set(l.team_id, [...(byTeam.get(l.team_id) ?? []), l.player_id]);
      named.set(l.match_id, byTeam);
    }
    const stats = new Map<number, Season["stats"]>();
    for (const s of season.stats) stats.set(s.match_id, [...(stats.get(s.match_id) ?? []), s]);
    const lineupFor = (match: Match): Lineup => {
      const override = options.lineups?.(match);
      if (override) return override;
      const byTeam = named.get(match.id);
      const home = byTeam?.get(match.home_team_id) ?? [];
      const away = byTeam?.get(match.away_team_id) ?? [];
      if (LINEUP_SIZES.has(home.length) && LINEUP_SIZES.has(away.length))
        return { home, away, source: "named" };
      const played = stats.get(match.id) ?? [];
      if (played.length > 0)
        return {
          home: played.filter((s) => s.team_id === match.home_team_id).map((s) => s.player_id),
          away: played.filter((s) => s.team_id === match.away_team_id).map((s) => s.player_id),
          source: "played",
        };
      return { home: [], away: [], source: "none" };
    };
    const ordered = [...season.matches].sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.local_time ?? "").localeCompare(b.local_time ?? "") ||
        a.id - b.id,
    );
    const byDate = new Map<string, Match[]>();
    for (const m of ordered) byDate.set(m.date, [...(byDate.get(m.date) ?? []), m]);
    for (const day of byDate.values()) {
      if (season.year >= options.predictFrom) {
        for (const match of day) {
          const lineup = lineupFor(match);
          const side = (team: number, ids: readonly number[]): SideState => {
            const strength = lineup.source === "none" ? 0 : players.lineupStrength(ids);
            const rating = teams.rating(team);
            return {
              attack: rating.attack,
              defence: rating.defence,
              players: strength,
              typicalPlayers: typical.get(team) ?? strength,
              lineup: ids.length,
            };
          };
          const home = side(match.home_team_id, lineup.home);
          const away = side(match.away_team_id, lineup.away);
          const effect = venue.effect(match);
          const components = {
            teamMargin: teams.margin(match.home_team_id, match.away_team_id),
            playerDiff: lineup.source === "none" ? 0 : home.players - away.players,
            playerRelativeDiff:
              lineup.source === "none"
                ? 0
                : home.players - home.typicalPlayers - (away.players - away.typicalPlayers),
            venue: effect,
          };
          predictions.push({
            match,
            ...components,
            home,
            away,
            lineupSource: lineup.source,
            ...combine(components, params),
          });
        }
      }
      for (const match of day) {
        if (!complete(match)) continue;
        const effect = venue.effect(match);
        const expected = teams.expected(match.home_team_id, match.away_team_id, effect.total);
        const homeScore = { goals: match.home_goals ?? 0, behinds: match.home_behinds ?? 0 };
        const awayScore = { goals: match.away_goals ?? 0, behinds: match.away_behinds ?? 0 };
        const adjusted = {
          home: accuracy.adjusted(match.home_team_id, homeScore) * scale,
          away: accuracy.adjusted(match.away_team_id, awayScore) * scale,
        };
        const actual = {
          home: (match.home_points ?? 0) * scale,
          away: (match.away_points ?? 0) * scale,
        };
        teams.update(match.home_team_id, match.away_team_id, expected, adjusted, actual);
        accuracy.record(match.home_team_id, homeScore);
        accuracy.record(match.away_team_id, awayScore);
        const played = stats.get(match.id) ?? [];
        for (const team of [match.home_team_id, match.away_team_id]) {
          const ids = played.filter((s) => s.team_id === team).map((s) => s.player_id);
          if (ids.length === 0) continue;
          const strength = players.lineupStrength(ids);
          const previous = typical.get(team);
          typical.set(
            team,
            previous === undefined
              ? strength
              : previous + (1 - typicalDecay) * (strength - previous),
          );
        }
        for (const s of played) players.record(s.player_id, s.rating_points);
        venue.record(match);
      }
    }
  }
  return predictions;
}

/** Ordinary least squares of the venue-free margin on the team and player components. */
export function fitWeights(
  predictions: readonly ChallengerPrediction[],
  mode: PlayerMode,
): { weights: Weights; sigma: number; n: number } {
  const rows = predictions.filter(
    (p) => complete(p.match) && SHORT_QUARTER_SCALE[p.match.year] === undefined,
  );
  let sxx = 0,
    sxy = 0,
    syy = 0,
    sxz = 0,
    syz = 0;
  for (const p of rows) {
    const x = p.teamMargin;
    const y = mode === "relative" ? p.playerRelativeDiff : p.playerDiff;
    const z = (p.match.home_points ?? 0) - (p.match.away_points ?? 0) - p.venue.total;
    sxx += x * x;
    sxy += x * y;
    syy += y * y;
    sxz += x * z;
    syz += y * z;
  }
  const det = sxx * syy - sxy * sxy;
  const weights: Weights =
    Math.abs(det) < 1e-9
      ? { team: sxx > 0 ? sxz / sxx : 1, player: 0 }
      : { team: (syy * sxz - sxy * syz) / det, player: (sxx * syz - sxy * sxz) / det };
  let sse = 0;
  for (const p of rows) {
    const { margin } = combine(p, { weights, playerMode: mode, sigma: 1 });
    sse += (margin - ((p.match.home_points ?? 0) - (p.match.away_points ?? 0))) ** 2;
  }
  return { weights, sigma: rows.length ? Math.sqrt(sse / rows.length) : 36, n: rows.length };
}
