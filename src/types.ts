import { Schema, SchemaTransformation } from "effect";

const Id = Schema.Int.check(Schema.isGreaterThan(0));
const Count = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0));
const Stat = Schema.NullOr(Schema.Finite.check(Schema.isGreaterThanOrEqualTo(0)));

/** A UTC instant as D1 stores it, compared as text throughout. */
export const InstantSchema = Schema.String.check(
  Schema.isPattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?Z$/),
);

/** The competitions Tipper predicts. */
export const CompetitionSchema = Schema.Literals(["AFLM", "AFLW"]);

export type Competition = typeof CompetitionSchema.Type;

/** The side of a fixture, as stored in issued captures. */
export const SideSchema = Schema.Literals(["home", "away"]);

export type Side = typeof SideSchema.Type;

const FIRST_YEAR = 2021;
const LAST_YEAR = 2100;
const SPLIT_SEASONS = ["2022-S6", "2022-S7"];

function hasValidSeason(round: { competition: Competition; seasonKey: string }): boolean {
  const year = Number(round.seasonKey.slice(0, 4));
  const isSplit = SPLIT_SEASONS.includes(round.seasonKey);

  if (year < FIRST_YEAR || year > LAST_YEAR) return false;

  // AFLW played two 2022 seasons, so the bare year is ambiguous and a suffix is valid nowhere else.
  return round.competition === "AFLW"
    ? round.seasonKey !== "2022" && (isSplit || !round.seasonKey.includes("-S"))
    : !round.seasonKey.includes("-S");
}

/**
 * One round of one season. The season key is the year, except for the two AFLW 2022 seasons,
 * and orders seasons chronologically as text.
 */
export const RoundSchema = Schema.Struct({
  competition: CompetitionSchema,
  seasonKey: Schema.String.check(Schema.isPattern(/^\d{4}(?:-S[67])?$/)),
  round: Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 50 })),
}).check(Schema.makeFilter((round) => hasValidSeason(round) || "Ambiguous or invalid season"));

export type Round = typeof RoundSchema.Type;

/** A round as callers name it: the season may be a year number or a season key. */
export const RoundRequestSchema = Schema.Struct({
  competition: CompetitionSchema,
  season: Schema.Union([Schema.Finite, Schema.String]),
  round: Schema.Finite,
}).pipe(
  Schema.decodeTo(
    RoundSchema,
    SchemaTransformation.transform({
      decode: ({ competition, season, round }) => ({
        competition,
        seasonKey: String(season),
        round,
      }),
      encode: ({ competition, seasonKey, round }) => ({ competition, season: seasonKey, round }),
    }),
  ),
);

/** A match row with the season it belongs to. */
export const FixtureSchema = Schema.Struct({
  id: Id,
  season_id: Id,
  year: Schema.Int,
  season_key: Schema.String,
  round_number: Schema.Int,
  home_team_id: Id,
  away_team_id: Id,
  venue_id: Schema.NullOr(Id),
  external_afl_id: Schema.NullOr(Schema.String),
  kickoff_at: Schema.NullOr(InstantSchema),
  date: Schema.String,
  status: Schema.String,
  home_points: Schema.NullOr(Count),
  away_points: Schema.NullOr(Count),
});

export type Fixture = typeof FixtureSchema.Type;

const PlayerStatsSchema = Schema.Struct({
  match_id: Id,
  player_id: Id,
  team_id: Id,
  goals: Stat,
  behinds: Stat,
  hitouts: Stat,
  goal_assists: Stat,
  inside_fifties: Stat,
  marks_inside_fifty: Stat,
  free_kicks_for: Stat,
  free_kicks_against: Stat,
  rebounds: Stat,
  one_percenters: Stat,
  marks: Stat,
  clearances: Stat,
  tackles: Stat,
});

export type PlayerStats = typeof PlayerStatsSchema.Type;

const LineupSchema = Schema.Struct({
  match_id: Id,
  player_id: Id,
  team_id: Id,
  is_emergency: Schema.Literals([0, 1]),
  observed_at: InstantSchema,
});

export type Lineup = typeof LineupSchema.Type;

const PriorSchema = Schema.Struct({
  player_id: Id,
  team_id: Id,
  off_pav: Schema.NullOr(Schema.Finite),
  mid_pav: Schema.NullOr(Schema.Finite),
  def_pav: Schema.NullOr(Schema.Finite),
});

const LeagueSchema = Schema.Struct({
  points: Schema.Finite.check(Schema.isGreaterThanOrEqualTo(0)),
  inside50: Schema.Finite.check(Schema.isGreaterThanOrEqualTo(0)),
});

export type League = typeof LeagueSchema.Type;

/**
 * Everything one prediction run reads, observed at one instant. The array bounds are the
 * schema maximums; a read that reaches one is rejected instead of predicting from part of it.
 */
export const SnapshotSchema = Schema.Struct({
  round: RoundSchema,
  observedAt: InstantSchema,
  matches: Schema.Array(FixtureSchema).check(Schema.isMaxLength(10000)),
  candidates: Schema.Array(FixtureSchema).check(Schema.isMaxLength(20)),
  stats: Schema.Array(PlayerStatsSchema).check(Schema.isMaxLength(30000)),
  lineups: Schema.Array(LineupSchema).check(Schema.isMaxLength(1200)),
  priors: Schema.Array(PriorSchema).check(Schema.isMaxLength(2000)),
  league: LeagueSchema,
});

export type Snapshot = typeof SnapshotSchema.Type;

/** The requested round has no matches. The only failure a caller is expected to handle. */
export class UnknownRound extends Schema.TaggedError<UnknownRound>()("UnknownRound", {
  round: RoundSchema,
}) {}
