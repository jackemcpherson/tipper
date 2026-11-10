import type { Fixture, League, Lineup, PlayerStats, Side, Snapshot } from "./types.ts";

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

/** Offensive, midfield and defensive value, in that order. */
type Zones = readonly [number, number, number];

const ZONES = [0, 1, 2] as const;

/** One issued prediction and the rating evidence that produced it. */
export interface Prediction {
  readonly fixture: Fixture;
  /** Full-precision predicted home margin. The winner is decided from this, not the issued one. */
  readonly margin: number;
  readonly homeProbability: number;
  readonly winner: Side;
  /** The margin as published, rounded to one decimal place. */
  readonly issuedMargin: number;
  /** True when either announced lineup was unusable, so neither team has a lineup contribution. */
  readonly isProvisional: boolean;
  readonly evidence: {
    readonly homeElo: number;
    readonly awayElo: number;
    readonly homePav: Zones;
    readonly awayPav: Zones;
    readonly lineups: ReadonlyArray<Lineup>;
    readonly league: League;
    readonly completedMatchIds: ReadonlyArray<number>;
  };
}

/**
 * Probability that the home team wins, from the standard normal integral of the margin.
 *
 * The series is symmetric about zero, and the result is clamped to [0.01, 0.99].
 *
 * @param margin - Predicted home margin in points.
 * @returns The home win probability.
 */
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

function assertUnique<T>(rows: ReadonlyArray<T>, key: (row: T) => string | number): void {
  if (new Set(rows.map(key)).size !== rows.length) throw new Error("Duplicate input");
}

type Completed = Fixture & { readonly home_points: number; readonly away_points: number };

/** Completed matches that may inform this snapshot, oldest first. */
function completedBefore(snapshot: Snapshot): ReadonlyArray<Completed> {
  const candidates = new Set(snapshot.candidates.map((fixture) => fixture.id));

  return snapshot.matches
    .filter(
      (match): match is Completed =>
        match.status === "Complete" &&
        match.home_points !== null &&
        match.away_points !== null &&
        !candidates.has(match.id) &&
        match.year >= 2020 &&
        match.season_key <= snapshot.round.seasonKey &&
        (match.kickoff_at ?? `${match.date}T00:00:00.000Z`) < snapshot.observedAt,
    )
    .toSorted(
      (a, b) =>
        a.year - b.year ||
        (a.kickoff_at ?? a.date).localeCompare(b.kickoff_at ?? b.date) ||
        a.id - b.id,
    );
}

/** A team's current-season totals. Mutated only while ratings are rebuilt. */
interface TeamForm {
  points: number;
  conceded: number;
  inside50: number;
  conceded50: number;
  games: number;
  zones: [number, number, number];
}

/** A player's raw zone contribution from one match. */
function zoneContribution(stats: PlayerStats): Zones {
  const value = (stat: number | null): number => stat ?? 0;
  const freeKicks = value(stats.free_kicks_for) - value(stats.free_kicks_against);

  return [
    6 * value(stats.goals) +
      value(stats.behinds) +
      0.25 * value(stats.hitouts) +
      3 * value(stats.goal_assists) +
      value(stats.inside_fifties) +
      value(stats.marks_inside_fifty) +
      freeKicks,
    15 * value(stats.inside_fifties) +
      20 * value(stats.clearances) +
      3 * value(stats.tackles) +
      1.5 * value(stats.hitouts) +
      freeKicks,
    20 * value(stats.rebounds) +
      12 * value(stats.one_percenters) +
      value(stats.marks) -
      4 * value(stats.marks_inside_fifty) +
      2 * freeKicks -
      (2 / 3) * value(stats.hitouts),
  ];
}

/** Ratings rebuilt from completed evidence, as they stand for the snapshot's round. */
interface Ratings {
  readonly elo: (team: number) => number;
  readonly form: (team: number) => TeamForm;
  readonly players: ReadonlyMap<number, Zones>;
  readonly league: League;
  readonly completedMatchIds: ReadonlyArray<number>;
}

/**
 * Replay every completed match in order. Elo carries across seasons with regression at each
 * season boundary; team form and player zones accumulate from the snapshot's season only.
 */
function rebuild(snapshot: Snapshot): Ratings {
  const completed = completedBefore(snapshot);
  const elo = new Map<number, number>();
  const forms = new Map<number, TeamForm>();
  const players = new Map<number, [number, number, number]>();
  const league = { ...snapshot.league };
  const stats = Map.groupBy(snapshot.stats, (row) => row.match_id);
  let season: string | undefined;

  const rating = (team: number): number => elo.get(team) ?? MODEL.initial;

  const form = (team: number): TeamForm => {
    const existing = forms.get(team);

    if (existing) return existing;

    const fresh: TeamForm = {
      points: 0,
      conceded: 0,
      inside50: 0,
      conceded50: 0,
      games: 0,
      zones: [0, 0, 0],
    };

    forms.set(team, fresh);

    return fresh;
  };

  const regress = (): void => {
    for (const [team, value] of elo)
      elo.set(team, value * (1 - MODEL.regression) + MODEL.initial * MODEL.regression);
  };

  for (const match of completed) {
    if (match.home_team_id === match.away_team_id) throw new Error("Identical teams");

    if (season !== undefined && match.season_key !== season) regress();

    season = match.season_key;

    const home = rating(match.home_team_id);
    const away = rating(match.away_team_id);
    const margin = match.home_points - match.away_points;
    const expected = 1 / (1 + 10 ** ((away - home - MODEL.updateHome) / 400));

    const marginOfVictory =
      (Math.log(Math.abs(margin) + 1) * 2.2) /
      ((margin >= 0 ? home - away : away - home) * 0.001 + 2.2);

    if (!Number.isFinite(marginOfVictory) || marginOfVictory < 0) throw new Error("Invalid MOV");

    const result = margin > 0 ? 1 : margin < 0 ? 0 : 0.5;
    const change = MODEL.k * marginOfVictory * (result - expected);

    elo.set(match.home_team_id, home + change);
    elo.set(match.away_team_id, away - change);

    if (match.season_key !== snapshot.round.seasonKey) continue;

    const homeForm = form(match.home_team_id);
    const awayForm = form(match.away_team_id);
    let homeInside50 = 0;
    let awayInside50 = 0;

    for (const row of stats.get(match.id) ?? []) {
      if (row.team_id !== match.home_team_id && row.team_id !== match.away_team_id)
        throw new Error("Stats team mismatch");

      if (row.team_id === match.home_team_id) homeInside50 += row.inside_fifties ?? 0;
      else awayInside50 += row.inside_fifties ?? 0;

      const zones = zoneContribution(row);
      const player = players.get(row.player_id) ?? [0, 0, 0];
      const team = form(row.team_id);

      for (const zone of ZONES) {
        player[zone] += zones[zone];
        team.zones[zone] += zones[zone];
      }

      players.set(row.player_id, player);
    }

    homeForm.points += match.home_points;
    homeForm.conceded += match.away_points;
    homeForm.inside50 += homeInside50;
    homeForm.conceded50 += awayInside50;
    homeForm.games++;
    awayForm.points += match.away_points;
    awayForm.conceded += match.home_points;
    awayForm.inside50 += awayInside50;
    awayForm.conceded50 += homeInside50;
    awayForm.games++;
    league.points += match.home_points + match.away_points;
    league.inside50 += homeInside50 + awayInside50;
  }

  if (season !== undefined && season !== snapshot.round.seasonKey) regress();

  return {
    elo: rating,
    form,
    players,
    league,
    completedMatchIds: completed.map((match) => match.id),
  };
}

/**
 * Rebuild ratings from completed evidence and predict the currently eligible fixtures.
 *
 * Pure: the same snapshot always yields the same predictions.
 *
 * @param snapshot - A decoded input snapshot for one round.
 * @returns One prediction per candidate fixture, in candidate order.
 */
export function predict(snapshot: Snapshot): ReadonlyArray<Prediction> {
  assertUnique(snapshot.matches, (match) => match.id);
  assertUnique(snapshot.candidates, (fixture) => fixture.id);
  assertUnique(snapshot.stats, (row) => `${row.match_id}:${row.player_id}`);
  assertUnique(snapshot.priors, (prior) => prior.player_id);

  const ratings = rebuild(snapshot);
  const priors = new Map(snapshot.priors.map((prior) => [prior.player_id, prior]));
  const lineupSize = MODEL.lineupSize[snapshot.round.competition];

  return snapshot.candidates.map((fixture) => {
    if (
      fixture.season_key !== snapshot.round.seasonKey ||
      fixture.round_number !== snapshot.round.round ||
      fixture.status !== "Upcoming" ||
      !fixture.kickoff_at ||
      fixture.kickoff_at <= snapshot.observedAt ||
      fixture.home_team_id === fixture.away_team_id
    )
      throw new Error("Ineligible target");

    const lineups = snapshot.lineups.filter(
      (lineup) => lineup.match_id === fixture.id && lineup.is_emergency === 0,
    );

    const selected = (team: number): ReadonlyArray<Lineup> =>
      lineups.filter((lineup) => lineup.team_id === team);

    const isProvisional =
      new Set(lineups.map((lineup) => lineup.player_id)).size !== lineups.length ||
      lineups.some(
        (lineup) =>
          (lineup.team_id !== fixture.home_team_id && lineup.team_id !== fixture.away_team_id) ||
          lineup.observed_at > snapshot.observedAt,
      ) ||
      selected(fixture.home_team_id).length !== lineupSize ||
      selected(fixture.away_team_id).length !== lineupSize;

    /** Sum each selected player's value: a prior blended with this season's share of team output. */
    const pav = (team: number): Zones => {
      const sum: [number, number, number] = [0, 0, 0];

      if (isProvisional) return sum;

      const form = ratings.form(team);

      const average =
        ratings.league.inside50 > 0 ? ratings.league.points / ratings.league.inside50 : 1;

      const defence = form.conceded50 > 0 ? form.conceded / form.conceded50 / average : 1;

      const strengths: Zones =
        form.inside50 === 0 || average === 0
          ? [1, 1, 1]
          : [
              form.points / form.inside50 / average,
              form.conceded50 > 0 ? form.inside50 / form.conceded50 : 1,
              defence === 0 ? 2 : ((2 * defence - defence * defence) / (2 * defence)) * 2,
            ];

      for (const lineup of selected(team)) {
        const player = ratings.players.get(lineup.player_id);
        const prior = priors.get(lineup.player_id);

        const priorValue: Zones = prior
          ? [prior.off_pav ?? 0, prior.mid_pav ?? 0, prior.def_pav ?? 0]
          : [MODEL.missingPlayer / 3, MODEL.missingPlayer / 3, MODEL.missingPlayer / 3];

        for (const zone of ZONES) {
          const current =
            player && form.zones[zone] > 0
              ? (player[zone] / form.zones[zone]) * MODEL.pool * strengths[zone]
              : 0;

          sum[zone] +=
            (MODEL.priorWeight * priorValue[zone] + form.games * current) /
            (MODEL.priorWeight + form.games);
        }
      }

      return sum;
    };

    const homePav = pav(fixture.home_team_id);
    const awayPav = pav(fixture.away_team_id);
    const homeElo = ratings.elo(fixture.home_team_id);
    const awayElo = ratings.elo(fixture.away_team_id);

    const blended = (elo: number, zones: Zones): number =>
      MODEL.eloWeight * elo +
      (1 - MODEL.eloWeight) * MODEL.pavSlope * zones.reduce((a, b) => a + b, 0);

    const margin =
      (blended(homeElo, homePav) - blended(awayElo, awayPav) + MODEL.predictionHome) *
      MODEL.marginScale;

    return {
      fixture,
      margin,
      homeProbability: homeProbability(margin),
      winner: margin >= 0 ? "home" : "away",
      issuedMargin: Math.round(margin * 10) / 10,
      isProvisional,
      evidence: {
        homeElo,
        awayElo,
        homePav,
        awayPav,
        lineups,
        league: { ...ratings.league },
        completedMatchIds: ratings.completedMatchIds,
      },
    };
  });
}
