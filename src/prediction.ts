import { z } from "zod";

/** One production model. Changes require a new source revision. */
export const MODEL = Object.freeze({
  identity: "elo-pav-normal-v1",
  initial: 1500,
  k: 25,
  updateHome: 160,
  regression: 0.1,
  pool: 100,
  priorWeight: 15,
  missingPlayer: 5,
  eloWeight: 0.6,
  pavSlope: 6.986,
  predictionHome: 80,
  marginScale: 0.07,
  sigma: 36,
  lineupSize: Object.freeze({ AFLM: 23, AFLW: 21 }),
});
export const RoundSchema = z.strictObject({
  competition: z.enum(["AFLM", "AFLW"]),
  season: z.number().int().min(2021).max(2100),
  round: z.number().int().min(0).max(50),
});
export type Round = z.infer<typeof RoundSchema>;
const id = z.number().int().positive();
const utc = z.iso.datetime();
export const FixtureSchema = z.object({
  id,
  season_id: id,
  year: z.number().int(),
  round_number: z.number().int(),
  home_team_id: id,
  away_team_id: id,
  venue_id: id.nullable(),
  external_afl_id: z.string().nullable(),
  kickoff_at: utc.nullable(),
  date: z.string(),
  status: z.string(),
  home_points: z.number().int().nonnegative().nullable(),
  away_points: z.number().int().nonnegative().nullable(),
});
export type Fixture = z.infer<typeof FixtureSchema>;
const stat = z.number().nonnegative().nullable();
const StatsSchema = z.object({
  match_id: id,
  player_id: id,
  team_id: id,
  goals: stat,
  behinds: stat,
  hitouts: stat,
  goal_assists: stat,
  inside_fifties: stat,
  marks_inside_fifty: stat,
  free_kicks_for: stat,
  free_kicks_against: stat,
  rebounds: stat,
  one_percenters: stat,
  marks: stat,
  clearances: stat,
  tackles: stat,
});
const LineupSchema = z.object({
  match_id: id,
  player_id: id,
  team_id: id,
  is_emergency: z.union([z.literal(0), z.literal(1)]),
  observed_at: utc,
});
const PriorSchema = z.object({
  player_id: id,
  team_id: id,
  off_pav: z.number().nullable(),
  mid_pav: z.number().nullable(),
  def_pav: z.number().nullable(),
});
/** Validates the native database snapshot at the prediction boundary. */
export const SnapshotSchema = z.object({
  round: RoundSchema,
  observedAt: utc,
  matches: z.array(FixtureSchema).max(10000),
  candidates: z.array(FixtureSchema).max(20),
  stats: z.array(StatsSchema).max(30000),
  lineups: z.array(LineupSchema).max(1200),
  priors: z.array(PriorSchema).max(2000),
  league: z.object({ points: z.number().nonnegative(), inside50: z.number().nonnegative() }),
});
export type Snapshot = z.infer<typeof SnapshotSchema>;
type Zones = [number, number, number];
export interface Prediction {
  readonly fixture: Fixture;
  readonly margin: number;
  readonly homeProbability: number;
  readonly winner: "home" | "away";
  readonly issuedMargin: number;
  readonly issuedProbability: number;
  readonly provisional: boolean;
  readonly evidence: {
    readonly homeElo: number;
    readonly awayElo: number;
    readonly homePav: Zones;
    readonly awayPav: Zones;
    readonly lineups: Snapshot["lineups"];
    readonly league: Snapshot["league"];
    readonly completedMatchIds: number[];
  };
}

/** Correct standard-normal integral, with symmetric tails and probability clamps. */
export function homeProbability(margin: number): number {
  const x = margin / MODEL.sigma;
  if (!Number.isFinite(x)) throw new Error("Non-finite margin");
  if (x <= -8) return 0.01;
  if (x >= 8) return 0.99;
  let term = x;
  let sum = x;
  for (let denominator = 3; denominator < 1000; denominator += 2) {
    term *= (x * x) / denominator;
    const next = sum + term;
    if (next === sum) break;
    sum = next;
  }
  return Math.max(
    0.01,
    Math.min(0.99, 0.5 + (sum * Math.exp((-x * x) / 2)) / Math.sqrt(2 * Math.PI)),
  );
}
function unique<T>(rows: readonly T[], key: (row: T) => string | number): void {
  if (new Set(rows.map(key)).size !== rows.length) throw new Error("Duplicate input");
}
interface TeamState {
  points: number;
  conceded: number;
  inside50: number;
  conceded50: number;
  games: number;
  zones: Zones;
}

/** Rebuild ratings from completed evidence and predict the currently eligible fixtures. */
export function predict(snapshot: Snapshot): Prediction[] {
  unique(snapshot.matches, (m) => m.id);
  unique(snapshot.candidates, (m) => m.id);
  unique(snapshot.stats, (s) => `${s.match_id}:${s.player_id}`);
  unique(snapshot.priors, (p) => p.player_id);
  const candidates = new Set(snapshot.candidates.map((m) => m.id));
  const completed = snapshot.matches
    .filter(
      (m) =>
        m.status === "Complete" &&
        m.home_points !== null &&
        m.away_points !== null &&
        !candidates.has(m.id) &&
        m.year >= 2020 &&
        m.year <= snapshot.round.season &&
        (m.kickoff_at ?? `${m.date}T00:00:00.000Z`) < snapshot.observedAt,
    )
    .sort(
      (a, b) =>
        a.year - b.year ||
        (a.kickoff_at ?? a.date).localeCompare(b.kickoff_at ?? b.date) ||
        a.id - b.id,
    );
  const elo = new Map<number, number>();
  const teams = new Map<number, TeamState>();
  const players = new Map<number, Zones>();
  const priors = new Map(snapshot.priors.map((p) => [p.player_id, p]));
  const stats = new Map<number, Snapshot["stats"]>();
  for (const row of snapshot.stats) {
    const rows = stats.get(row.match_id) ?? [];
    rows.push(row);
    stats.set(row.match_id, rows);
  }
  const league = { ...snapshot.league };
  let season: number | undefined;
  const regress = () => {
    for (const [team, rating] of elo)
      elo.set(team, rating * (1 - MODEL.regression) + MODEL.initial * MODEL.regression);
  };
  const rating = (team: number) => elo.get(team) ?? MODEL.initial;
  const teamState = (team: number) => {
    let state = teams.get(team);
    if (!state) {
      state = { points: 0, conceded: 0, inside50: 0, conceded50: 0, games: 0, zones: [0, 0, 0] };
      teams.set(team, state);
    }
    return state;
  };
  for (const match of completed) {
    if (match.home_team_id === match.away_team_id) throw new Error("Identical teams");
    if (season !== undefined && match.year !== season) regress();
    season = match.year;
    const home = rating(match.home_team_id),
      away = rating(match.away_team_id);
    const margin = (match.home_points ?? 0) - (match.away_points ?? 0);
    const expected = 1 / (1 + 10 ** ((away - home - MODEL.updateHome) / 400));
    const mov =
      (Math.log(Math.abs(margin) + 1) * 2.2) /
      ((margin >= 0 ? home - away : away - home) * 0.001 + 2.2);
    if (!Number.isFinite(mov) || mov < 0) throw new Error("Invalid MOV");
    const change = MODEL.k * mov * ((margin > 0 ? 1 : margin < 0 ? 0 : 0.5) - expected);
    elo.set(match.home_team_id, home + change);
    elo.set(match.away_team_id, away - change);
    if (match.year !== snapshot.round.season) continue;
    const rows = stats.get(match.id) ?? [];
    const h = teamState(match.home_team_id),
      a = teamState(match.away_team_id);
    let hi = 0,
      ai = 0;
    for (const s of rows) {
      if (s.team_id !== match.home_team_id && s.team_id !== match.away_team_id)
        throw new Error("Stats team mismatch");
      const v = (n: number | null) => n ?? 0;
      if (s.team_id === match.home_team_id) hi += v(s.inside_fifties);
      else ai += v(s.inside_fifties);
      const fk = v(s.free_kicks_for) - v(s.free_kicks_against);
      const zones: Zones = [
        6 * v(s.goals) +
          v(s.behinds) +
          0.25 * v(s.hitouts) +
          3 * v(s.goal_assists) +
          v(s.inside_fifties) +
          v(s.marks_inside_fifty) +
          fk,
        15 * v(s.inside_fifties) +
          20 * v(s.clearances) +
          3 * v(s.tackles) +
          1.5 * v(s.hitouts) +
          fk,
        20 * v(s.rebounds) +
          12 * v(s.one_percenters) +
          v(s.marks) -
          4 * v(s.marks_inside_fifty) +
          2 * fk -
          (2 / 3) * v(s.hitouts),
      ];
      const p = players.get(s.player_id) ?? [0, 0, 0];
      const t = teamState(s.team_id);
      for (const i of [0, 1, 2] as const) {
        p[i] += zones[i];
        t.zones[i] += zones[i];
      }
      players.set(s.player_id, p);
    }
    h.points += match.home_points ?? 0;
    h.conceded += match.away_points ?? 0;
    h.inside50 += hi;
    h.conceded50 += ai;
    h.games++;
    a.points += match.away_points ?? 0;
    a.conceded += match.home_points ?? 0;
    a.inside50 += ai;
    a.conceded50 += hi;
    a.games++;
    league.points += (match.home_points ?? 0) + (match.away_points ?? 0);
    league.inside50 += hi + ai;
  }
  if (season !== undefined && season !== snapshot.round.season) regress();
  return snapshot.candidates.map((fixture) => {
    if (
      fixture.year !== snapshot.round.season ||
      fixture.round_number !== snapshot.round.round ||
      fixture.status !== "Upcoming" ||
      !fixture.kickoff_at ||
      fixture.kickoff_at <= snapshot.observedAt ||
      fixture.home_team_id === fixture.away_team_id
    )
      throw new Error("Ineligible target");
    const lineups = snapshot.lineups.filter(
      (l) => l.match_id === fixture.id && l.is_emergency === 0,
    );
    const size = MODEL.lineupSize[snapshot.round.competition];
    const provisional =
      new Set(lineups.map((l) => l.player_id)).size !== lineups.length ||
      lineups.some(
        (l) =>
          (l.team_id !== fixture.home_team_id && l.team_id !== fixture.away_team_id) ||
          l.observed_at > snapshot.observedAt,
      ) ||
      lineups.filter((l) => l.team_id === fixture.home_team_id).length !== size ||
      lineups.filter((l) => l.team_id === fixture.away_team_id).length !== size;
    const pav = (team: number): Zones => {
      const sum: Zones = [0, 0, 0];
      if (provisional) return sum;
      const t = teamState(team),
        avg = league.inside50 > 0 ? league.points / league.inside50 : 1;
      const dn = t.conceded50 > 0 ? t.conceded / t.conceded50 / avg : 1;
      const strengths: Zones =
        t.inside50 === 0 || avg === 0
          ? [1, 1, 1]
          : [
              t.points / t.inside50 / avg,
              t.conceded50 > 0 ? t.inside50 / t.conceded50 : 1,
              dn === 0 ? 2 : ((2 * dn - dn * dn) / (2 * dn)) * 2,
            ];
      for (const l of lineups.filter((l) => l.team_id === team)) {
        const p = players.get(l.player_id),
          prior = priors.get(l.player_id);
        const pv: Zones = prior
          ? [prior.off_pav ?? 0, prior.mid_pav ?? 0, prior.def_pav ?? 0]
          : [MODEL.missingPlayer / 3, MODEL.missingPlayer / 3, MODEL.missingPlayer / 3];
        for (const i of [0, 1, 2] as const) {
          const current = p && t.zones[i] > 0 ? (p[i] / t.zones[i]) * MODEL.pool * strengths[i] : 0;
          sum[i] += (MODEL.priorWeight * pv[i] + t.games * current) / (MODEL.priorWeight + t.games);
        }
      }
      return sum;
    };
    const homePav = pav(fixture.home_team_id),
      awayPav = pav(fixture.away_team_id);
    const homeElo = rating(fixture.home_team_id),
      awayElo = rating(fixture.away_team_id);
    const blended = (e: number, p: Zones) =>
      MODEL.eloWeight * e + (1 - MODEL.eloWeight) * MODEL.pavSlope * p.reduce((a, b) => a + b, 0);
    const margin =
      (blended(homeElo, homePav) - blended(awayElo, awayPav) + MODEL.predictionHome) *
      MODEL.marginScale;
    const probability = homeProbability(margin);
    return {
      fixture,
      margin,
      homeProbability: probability,
      winner: margin >= 0 ? "home" : "away",
      issuedMargin: Math.round(margin * 10) / 10,
      issuedProbability: probability,
      provisional,
      evidence: {
        homeElo,
        awayElo,
        homePav,
        awayPav,
        lineups,
        league: { ...league },
        completedMatchIds: completed.map((m) => m.id),
      },
    };
  });
}
