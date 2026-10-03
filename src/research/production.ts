import { MODEL, type Prediction, predict, type Snapshot } from "../prediction.js";
import type { Match, Season } from "./data.js";

/**
 * Historical replay of the production predictor. The replay feeds the pure
 * predictor a snapshot built from cached seasons, using the same conservative
 * rule as the 2026 backfill: results from the target match's own date and
 * later are unknown, and the source matchday lineup stands in for the
 * announced lineup.
 */
export const PRODUCTION_IDENTITY = MODEL.identity;

export interface ReplayResult {
  readonly match: Match;
  readonly margin: number;
  readonly homeProbability: number;
  readonly issuedMargin: number;
  readonly provisional: boolean;
  readonly homeElo: number;
  readonly awayElo: number;
}

const kickoff = (m: Match) => m.kickoff_at ?? `${m.date}T00:00:00.000Z`;

/** Replay production for every completed match of one season. */
export function replayProduction(
  seasons: readonly Season[],
  year: number,
  filter: (m: Match) => boolean = () => true,
): ReplayResult[] {
  const byYear = new Map(seasons.map((s) => [s.year, s]));
  const target = byYear.get(year);
  if (!target) throw new Error(`Season ${year} is not loaded`);
  const history = seasons.filter((s) => s.year >= 2020 && s.year <= year);
  const priors = byYear.get(year - 1)?.pav ?? [];
  const complete = (m: Match) =>
    m.status === "Complete" && m.home_points !== null && m.away_points !== null;
  const league = { points: 0, inside50: 0 };
  for (const s of seasons) {
    if (s.year < 2021 || s.year >= year) continue;
    const completed = new Set(s.matches.filter(complete).map((m) => m.id));
    for (const m of s.matches)
      if (completed.has(m.id)) league.points += (m.home_points ?? 0) + (m.away_points ?? 0);
    for (const row of s.stats)
      if (completed.has(row.match_id)) league.inside50 += row.inside_fifties ?? 0;
  }
  const lineupsByMatch = new Map<number, Season["lineups"]>();
  for (const l of target.lineups) {
    if (l.is_emergency !== 0) continue;
    lineupsByMatch.set(l.match_id, [...(lineupsByMatch.get(l.match_id) ?? []), l]);
  }
  // Late changes appended after the match leave more than one team's worth of
  // named players. The players who took the field are the matchday lineup then.
  const playedByMatch = new Map<number, Season["lineups"]>();
  for (const s of target.stats)
    playedByMatch.set(s.match_id, [
      ...(playedByMatch.get(s.match_id) ?? []),
      { match_id: s.match_id, player_id: s.player_id, team_id: s.team_id, is_emergency: 0 },
    ]);
  const size = MODEL.lineupSize.AFLM;
  const lineupFor = (match: Match) => {
    const named = lineupsByMatch.get(match.id) ?? [];
    const valid =
      named.filter((l) => l.team_id === match.home_team_id).length === size &&
      named.filter((l) => l.team_id === match.away_team_id).length === size;
    return valid ? named : (playedByMatch.get(match.id) ?? []);
  };
  const results: ReplayResult[] = [];
  for (const match of target.matches) {
    if (!complete(match) || !filter(match)) continue;
    const observedAt = `${match.date}T00:00:00.000Z`;
    const fixture = {
      ...match,
      status: "Upcoming",
      kickoff_at: `${match.date}T23:59:59.000Z`,
      home_points: null,
      away_points: null,
    };
    const snapshot: Snapshot = {
      round: { competition: "AFLM", season: year, round: match.round_number },
      observedAt,
      matches: history.flatMap((s) =>
        s.matches.filter((m) => complete(m) && kickoff(m) < observedAt).map(toFixture),
      ),
      candidates: [toFixture(fixture)],
      stats: target.stats.map((s) => ({
        match_id: s.match_id,
        player_id: s.player_id,
        team_id: s.team_id,
        goals: s.goals,
        behinds: s.behinds,
        hitouts: s.hitouts,
        goal_assists: s.goal_assists,
        inside_fifties: s.inside_fifties,
        marks_inside_fifty: s.marks_inside_fifty,
        free_kicks_for: s.free_kicks_for,
        free_kicks_against: s.free_kicks_against,
        rebounds: s.rebounds,
        one_percenters: s.one_percenters,
        marks: s.marks,
        clearances: s.clearances,
        tackles: s.tackles,
      })),
      lineups: lineupFor(match).map((l) => ({
        match_id: l.match_id,
        player_id: l.player_id,
        team_id: l.team_id,
        is_emergency: 0,
        observed_at: observedAt,
      })),
      priors,
      league: { ...league },
    };
    const [prediction] = predict(snapshot) as [Prediction];
    results.push({
      match,
      margin: prediction.margin,
      homeProbability: prediction.homeProbability,
      issuedMargin: prediction.issuedMargin,
      provisional: prediction.provisional,
      homeElo: prediction.evidence.homeElo,
      awayElo: prediction.evidence.awayElo,
    });
  }
  return results;
}

function toFixture(m: Match): Snapshot["matches"][number] {
  return {
    id: m.id,
    season_id: m.season_id,
    year: m.year,
    round_number: m.round_number,
    home_team_id: m.home_team_id,
    away_team_id: m.away_team_id,
    venue_id: m.venue_id,
    external_afl_id: m.external_afl_id,
    kickoff_at: m.kickoff_at,
    date: m.date,
    status: m.status ?? "",
    home_points: m.home_points,
    away_points: m.away_points,
  };
}
