import { Schema, SchemaTransformation } from "effect";
import { MATCHES, NOW, rows } from "./d1";

const USER_AGENT = "tipper-worker/2.0 (jackemcpherson@gmail.com)";
const Id = Schema.Int.check(Schema.isGreaterThan(0));

/** Squiggle sends numbers as numbers or numeric strings. */
const WireNumberSchema = Schema.Union([Schema.String, Schema.Finite]).pipe(
  Schema.decodeTo(
    Schema.Finite,
    SchemaTransformation.transform({
      decode: (value: string | number) => Number(value),
      encode: (value: number): string | number => value,
    }),
  ),
);

/** Squiggle sends a missing margin as an empty string. */
const BlankSchema = Schema.Literal("").pipe(
  Schema.decodeTo(
    Schema.Null,
    SchemaTransformation.transform({ decode: () => null, encode: () => "" as const }),
  ),
);

const FieldTipSchema = Schema.Struct({
  gameid: Id,
  source: Schema.String,
  hteam: Schema.String,
  ateam: Schema.String,
  tip: Schema.String,
  hmargin: Schema.optional(Schema.Union([Schema.Null, BlankSchema, WireNumberSchema])),
  hconfidence: Schema.optional(
    Schema.Union([
      Schema.Null,
      WireNumberSchema.check(Schema.isBetween({ minimum: 0, maximum: 100 })),
    ]),
  ),
});

/** One competitor's tip for one game, as published in the Squiggle field. */
export type FieldTip = typeof FieldTipSchema.Type;

const GameSchema = Schema.Struct({
  id: Id,
  hteam: Schema.String,
  ateam: Schema.String,
  hteamid: Id,
  ateamid: Id,
  year: Schema.Int,
  round: Schema.Int,
});

/** One fixture as Squiggle identifies it. */
export type Game = typeof GameSchema.Type;

const decodeField = Schema.decodeUnknownSync(
  Schema.Struct({ tips: Schema.Array(FieldTipSchema).check(Schema.isMaxLength(100000)) }),
);

const decodeGames = Schema.decodeUnknownSync(
  Schema.Struct({ games: Schema.Array(GameSchema).check(Schema.isMaxLength(20)) }),
);

/** The two Squiggle reads Tipper depends on. Tests supply their own implementation. */
export interface Squiggle {
  /** Every competitor tip for a season. */
  readonly tips: (year: number) => Promise<ReadonlyArray<FieldTip>>;
  /** The fixtures of one round. */
  readonly games: (year: number, round: number) => Promise<ReadonlyArray<Game>>;
}

async function query(parameters: string): Promise<Response> {
  const response = await fetch(`https://api.squiggle.com.au/?${parameters}`, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error(`Squiggle HTTP ${response.status}`);

  return response;
}

/** The live Squiggle API, read with a 15-second deadline. */
export const squiggle: Squiggle = {
  tips: async (year) => decodeField(await (await query(`q=tips;year=${year}`)).json()).tips,
  games: async (year, round) =>
    decodeGames(await (await query(`q=games;year=${year};round=${round}`)).json()).games,
};

/** The name Squiggle uses for a team. */
export function squiggleName(name: string): string {
  return name === "GWS Giants" ? "Greater Western Sydney" : name;
}

const RoundMatchSchema = Schema.Struct({
  id: Schema.Int,
  home_team_id: Schema.Int,
  away_team_id: Schema.Int,
  home: Schema.String,
  away: Schema.String,
});

/**
 * Record Squiggle's game identity for each AFLM match of a round, pairing by ordered team
 * names. A confirmed ambiguous pairing removes the affected identities before failing, so the
 * feed never serves a guess.
 *
 * @param db - The shared AFL database.
 * @param api - The Squiggle client.
 * @param year - The season year.
 * @param round - The round number.
 */
export async function resolveIdentities(
  db: D1Database,
  api: Squiggle,
  year: number,
  round: number,
): Promise<void> {
  const games = await api.games(year, round);

  if (games.some((game) => game.year !== year || game.round !== round))
    throw new Error("Invalid Squiggle round");

  if (new Set(games.map((game) => game.id)).size !== games.length) {
    await db
      .prepare("DELETE FROM tipper_game_ids WHERE year=? AND round=?")
      .bind(year, round)
      .run();

    throw new Error("Ambiguous Squiggle mapping");
  }

  const matches = await rows(
    RoundMatchSchema,
    db
      .prepare(
        `SELECT m.id,m.home_team_id,m.away_team_id,h.name AS home,a.name AS away ${MATCHES}
    JOIN teams h ON h.id=m.home_team_id JOIN teams a ON a.id=m.away_team_id
    WHERE c.code='AFLM' AND s.year=? AND m.round_number=?`,
      )
      .bind(year, round),
  );

  const statements: Array<D1PreparedStatement> = [];

  for (const match of matches) {
    const [game, ...others] = games.filter(
      (candidate) =>
        candidate.hteam === squiggleName(match.home) &&
        candidate.ateam === squiggleName(match.away),
    );

    if (others.length) {
      await db.prepare("DELETE FROM tipper_game_ids WHERE match_id=?").bind(match.id).run();

      throw new Error("Ambiguous Squiggle mapping");
    }

    if (!game) continue;

    // The insert re-checks the fixture, so an identity is never attached to a changed match.
    statements.push(
      db
        .prepare(
          `INSERT INTO tipper_game_ids(match_id,game_id,year,round,home_team_id,away_team_id,
      squiggle_home_id,squiggle_away_id,home_name,away_name,observed_at)
      SELECT id,?,?,?,?,?,?,?,?,?,${NOW} FROM matches
      WHERE id=? AND home_team_id=? AND away_team_id=? AND round_number=?
      AND season_id IN (SELECT s.id FROM seasons s JOIN competitions c ON c.id=s.competition_id WHERE c.code='AFLM' AND s.year=?)
      ON CONFLICT(match_id) DO UPDATE SET game_id=excluded.game_id,year=excluded.year,round=excluded.round,
      home_team_id=excluded.home_team_id,away_team_id=excluded.away_team_id,squiggle_home_id=excluded.squiggle_home_id,
      squiggle_away_id=excluded.squiggle_away_id,home_name=excluded.home_name,away_name=excluded.away_name,observed_at=excluded.observed_at`,
        )
        .bind(
          game.id,
          game.year,
          game.round,
          match.home_team_id,
          match.away_team_id,
          game.hteamid,
          game.ateamid,
          game.hteam,
          game.ateam,
          match.id,
          match.home_team_id,
          match.away_team_id,
          round,
          year,
        ),
    );
  }

  if (statements.length) await db.batch(statements);
}

/**
 * Resolve identities for every AFLM round since activation that kicks off within a week and
 * still lacks one. Runs off the feed request path and independently of prediction freshness;
 * an outage leaves known identities in place.
 *
 * @param db - The shared AFL database.
 * @param api - The Squiggle client.
 */
export async function syncIdentities(db: D1Database, api: Squiggle): Promise<void> {
  const pending = await rows(
    Schema.Struct({ year: Schema.Int, round: Schema.Int }),
    db.prepare(
      `SELECT DISTINCT s.year,m.round_number AS round ${MATCHES}
    LEFT JOIN tipper_game_ids g ON g.match_id=m.id WHERE c.code='AFLM' AND g.match_id IS NULL
    AND m.kickoff_at>=(SELECT activated_at FROM tipper_status WHERE id=1)
    AND julianday(m.kickoff_at)<=julianday('now','+7 days') LIMIT 40`,
    ),
  );

  for (const { year, round } of pending) {
    try {
      await resolveIdentities(db, api, year, round);
    } catch (error) {
      console.warn("Mapping unavailable", String(error));
    }
  }
}
