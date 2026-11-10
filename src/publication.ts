import { Schema } from "effect";
import { decodeRows, MATCHES, NOW, row, rows } from "./d1";
import { MODEL, type Prediction, predict } from "./model";
import {
  CompetitionSchema,
  InstantSchema,
  type Round,
  RoundSchema,
  SideSchema,
  type Snapshot,
  SnapshotSchema,
  UnknownRound,
} from "./types";

declare const SOURCE_REVISION: string;

/** The model identity and source revision recorded with every run and projection. */
const MODEL_VERSION = `${MODEL.identity}@${SOURCE_REVISION}`;

/*
 * The publication invariants, each written once. All fragments use the aliases `m` for the
 * match, `p` for its capture and `mp` for its compatibility projection.
 */

/** The latest admitted capture owns the lock, including after projection invalidation. */
const ELIGIBLE = `m.status='Upcoming' AND julianday(m.kickoff_at)>julianday('now')
 AND julianday(m.kickoff_at)<=julianday('now','+7 days')
 AND NOT EXISTS (SELECT 1 FROM tipper_predictions p WHERE p.match_id=m.id
   AND p.run_id=(SELECT MAX(q.run_id) FROM tipper_predictions q WHERE q.match_id=m.id)
   AND julianday(p.kickoff_at)<=julianday('now'))`;

/** The capture still names the match's season, round, teams, venue and source identity. */
export const SAME_FIXTURE = `m.season_id IS p.season_id AND m.round_number IS p.round_number
 AND m.home_team_id IS p.home_team_id AND m.away_team_id IS p.away_team_id
 AND m.venue_id IS p.venue_id AND m.external_afl_id IS p.external_afl_id`;

/** The capture's recorded kickoff is still the match's kickoff. */
export const SAME_KICKOFF = "m.kickoff_at IS p.kickoff_at";

/** The projection carries exactly what the capture issued. */
const LINKED = `mp.tipper_run_id IS p.run_id AND mp.predicted_margin IS p.issued_margin
 AND mp.home_win_prob IS p.issued_probability AND mp.generated_at IS p.published_at`;

const IN_ROUND = "c.code=? AND s.season_key=? AND m.round_number=?";

const COMPLETE =
  "m.status='Complete' AND m.home_points>=0 AND m.away_points>=0 AND m.date<date('now','+1 day')";

const FIXTURE_COLUMNS =
  "m.id,m.season_id,m.round_number,m.home_team_id,m.away_team_id,m.venue_id,m.external_afl_id,m.kickoff_at,m.date,m.status,m.home_points,m.away_points,s.year,s.season_key";

/** One publication attempt: an allocated run and the predictions it wants to commit. */
export interface Attempt {
  readonly runId: number;
  readonly snapshot: Snapshot;
  /** The input revision the snapshot was read at. Finalisation rejects any later revision. */
  readonly inputRevision: number;
  readonly predictions: ReadonlyArray<Prediction>;
}

const SnapshotHeaderSchema = Schema.Struct({
  observed_at: InstantSchema,
  count: Schema.Int,
  revision: Schema.NullOr(Schema.Int),
  in_progress: Schema.NullOr(Schema.Int),
});

/**
 * One native batch, which D1 runs as a transaction, supplies the complete bounded input
 * snapshot at one revision. Finalisation rejects the run if inputs are revised before commit.
 */
async function readSnapshot(
  db: D1Database,
  round: Round,
): Promise<Pick<Attempt, "snapshot" | "inputRevision">> {
  const inRound = [round.competition, round.seasonKey, round.round];
  const upTo = [round.competition, round.seasonKey];

  const results = await db.batch([
    db
      .prepare(
        `SELECT ${NOW} AS observed_at, COUNT(*) AS count,
        (SELECT revision FROM public_input_revision WHERE id=1) AS revision,
        (SELECT in_progress FROM public_input_revision WHERE id=1) AS in_progress ${MATCHES} WHERE ${IN_ROUND}`,
      )
      .bind(...inRound),
    db
      .prepare(
        `SELECT ${FIXTURE_COLUMNS} ${MATCHES} WHERE c.code=? AND s.year>=2020 AND s.season_key<=? AND ${COMPLETE} LIMIT 10001`,
      )
      .bind(...upTo),
    db
      .prepare(
        `SELECT ${FIXTURE_COLUMNS} ${MATCHES} WHERE ${IN_ROUND} AND ${ELIGIBLE} ORDER BY m.kickoff_at,m.id LIMIT 21`,
      )
      .bind(...inRound),
    db
      .prepare(
        `SELECT ps.match_id,ps.player_id,ps.team_id,ps.goals,ps.behinds,ps.hitouts,ps.goal_assists,ps.inside_fifties,ps.marks_inside_fifty,ps.free_kicks_for,ps.free_kicks_against,ps.rebounds,ps.one_percenters,ps.marks,ps.clearances,ps.tackles FROM player_match_stats ps JOIN matches m ON m.id=ps.match_id
      JOIN seasons s ON s.id=m.season_id JOIN competitions c ON c.id=s.competition_id
      WHERE c.code=? AND s.season_key=? AND ${COMPLETE} LIMIT 30001`,
      )
      .bind(...upTo),
    db
      .prepare(
        `SELECT p.player_id,p.team_id,p.off_pav,p.mid_pav,p.def_pav FROM player_season_pav p JOIN seasons s ON s.id=p.season_id
      JOIN competitions c ON c.id=s.competition_id WHERE c.code=? AND s.season_key=(
        SELECT MAX(previous.season_key) FROM seasons previous WHERE previous.competition_id=s.competition_id AND previous.season_key<?) LIMIT 2001`,
      )
      .bind(...upTo),
    db
      .prepare(
        `SELECT ml.match_id,ml.player_id,ml.team_id,ml.is_emergency,m.lineups_observed_at AS observed_at FROM match_lineups ml
      JOIN matches m ON m.id=ml.match_id JOIN seasons s ON s.id=m.season_id
      JOIN competitions c ON c.id=s.competition_id WHERE ${IN_ROUND} AND ${ELIGIBLE}
      AND m.lineups_observed_at IS NOT NULL LIMIT 1201`,
      )
      .bind(...inRound),
    db
      .prepare(
        `SELECT
      (SELECT COALESCE(SUM(m.home_points+m.away_points),0) ${MATCHES} WHERE c.code=? AND s.year>=2021 AND s.season_key<? AND ${COMPLETE}) AS points,
      (SELECT COALESCE(SUM(ps.inside_fifties),0) FROM player_match_stats ps JOIN matches m ON m.id=ps.match_id
       JOIN seasons s ON s.id=m.season_id JOIN competitions c ON c.id=s.competition_id
       WHERE c.code=? AND s.year>=2021 AND s.season_key<? AND ${COMPLETE}) AS inside50`,
      )
      .bind(...upTo, ...upTo),
  ]);

  const [header] = decodeRows(SnapshotHeaderSchema, results[0]);

  if (!header?.count) throw new UnknownRound({ round });

  if (header.in_progress !== 0 || header.revision === null)
    throw new Error("Inputs are being repaired; snapshot unavailable");

  return {
    inputRevision: header.revision,
    snapshot: Schema.decodeUnknownSync(SnapshotSchema)({
      round,
      observedAt: header.observed_at,
      matches: results[1]?.results,
      candidates: results[2]?.results,
      stats: results[3]?.results,
      priors: results[4]?.results,
      lineups: results[5]?.results,
      league: results[6]?.results[0],
    }),
  };
}

/**
 * Allocate a run, read its inputs and predict. Nothing is published until `commit`.
 *
 * The run is allocated before any input is read, so overlapping attempts have a database order.
 *
 * @param db - The shared AFL database.
 * @param round - The round to predict.
 * @returns The attempt to pass to `commit`.
 * @throws UnknownRound when the round has no matches.
 */
export async function prepare(db: D1Database, round: Round): Promise<Attempt> {
  const run = await row(
    Schema.Struct({ id: Schema.Int }),
    db
      .prepare(
        `INSERT INTO tipper_runs(competition,season,round,started_at,source_revision,model_version,season_key)
    VALUES(?,?,?,${NOW},?,?,?) RETURNING id`,
      )
      .bind(
        round.competition,
        Number(round.seasonKey.slice(0, 4)),
        round.round,
        SOURCE_REVISION,
        MODEL_VERSION,
        round.seasonKey,
      ),
  );

  if (!run) throw new Error("Run allocation failed");

  const { snapshot, inputRevision } = await readSnapshot(db, round);

  return { runId: run.id, snapshot, inputRevision, predictions: predict(snapshot) };
}

/**
 * Commit an attempt's captures, compatibility projections and checked finalisation in one
 * transaction. Either the whole mutable set is published or nothing is.
 *
 * Finalisation rejects the attempt, rolling everything back, when inputs were revised, a newer
 * run already published, the eligible set changed, a fixture or kickoff changed, a recorded
 * kickoff has passed, or a projection does not carry its capture.
 *
 * @param db - The shared AFL database.
 * @param attempt - An attempt from `prepare`.
 * @returns The number of predictions published.
 */
export async function commit(db: D1Database, attempt: Attempt): Promise<number> {
  const { runId, inputRevision, predictions } = attempt;
  const { round, observedAt } = attempt.snapshot;
  const inRound = [round.competition, round.seasonKey, round.round];

  if (!predictions.length) return 0;

  const captures = predictions.flatMap((prediction) => {
    const fixture = prediction.fixture;

    return [
      db
        .prepare(
          `INSERT INTO tipper_predictions(run_id,match_id,season_id,round_number,
      home_team_id,away_team_id,venue_id,external_afl_id,kickoff_at,margin,home_probability,winner,
      issued_margin,issued_probability,provisional,evidence,observed_at,published_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,${NOW})`,
        )
        .bind(
          runId,
          fixture.id,
          fixture.season_id,
          fixture.round_number,
          fixture.home_team_id,
          fixture.away_team_id,
          fixture.venue_id,
          fixture.external_afl_id,
          fixture.kickoff_at,
          prediction.margin,
          prediction.homeProbability,
          prediction.winner,
          prediction.issuedMargin,
          prediction.homeProbability,
          prediction.isProvisional ? 1 : 0,
          JSON.stringify(prediction.evidence),
          observedAt,
        ),
      db
        .prepare(
          `INSERT INTO match_predictions(match_id,home_win_prob,predicted_margin,model_version,generated_at,tipper_run_id)
      SELECT match_id,issued_probability,issued_margin,?,published_at,run_id FROM tipper_predictions WHERE run_id=? AND match_id=?
      ON CONFLICT(match_id) DO UPDATE SET home_win_prob=excluded.home_win_prob,predicted_margin=excluded.predicted_margin,
      model_version=excluded.model_version,generated_at=excluded.generated_at,tipper_run_id=excluded.tipper_run_id`,
        )
        .bind(MODEL_VERSION, runId, fixture.id),
    ];
  });

  // CHECK(finalized=1) forces rollback, unlike an UPDATE whose WHERE quietly matches no rows.
  // In order, the conditions admit the run only when: it has not published; inputs are at the
  // revision it read; no newer run published; it covers exactly the eligible set; and every
  // capture is of an eligible, unchanged fixture whose previous lock has not passed and whose
  // projection carries it. A capture's own kickoff is in the future because it equals an
  // eligible match's kickoff.
  const finalise = db
    .prepare(
      `UPDATE tipper_runs SET published_at=${NOW}, published_count=?, finalized=CASE WHEN
    published_at IS NULL
    AND EXISTS(SELECT 1 FROM public_input_revision WHERE id=1 AND in_progress=0 AND revision=?)
    AND NOT EXISTS(SELECT 1 FROM tipper_runs newer WHERE newer.competition=tipper_runs.competition
      AND newer.season_key=tipper_runs.season_key AND newer.round=tipper_runs.round AND newer.id>tipper_runs.id AND newer.published_at IS NOT NULL)
    AND (SELECT COUNT(*) ${MATCHES} WHERE ${IN_ROUND} AND ${ELIGIBLE})=?
    AND NOT EXISTS(SELECT 1 FROM tipper_predictions p JOIN matches m ON m.id=p.match_id
      JOIN seasons s ON s.id=m.season_id JOIN competitions c ON c.id=s.competition_id
      LEFT JOIN match_predictions mp ON mp.match_id=p.match_id
      WHERE p.run_id=tipper_runs.id AND (
        NOT (${IN_ROUND} AND ${ELIGIBLE})
        OR NOT (${SAME_FIXTURE} AND ${SAME_KICKOFF})
        OR EXISTS(SELECT 1 FROM tipper_predictions old WHERE old.match_id=p.match_id AND old.run_id<>p.run_id
          AND old.run_id=(SELECT MAX(q.run_id) FROM tipper_predictions q WHERE q.match_id=p.match_id AND q.run_id<>p.run_id)
          AND julianday(old.kickoff_at)<=julianday('now'))
        OR NOT (${LINKED}) OR mp.model_version IS NOT ?))
    THEN 1 ELSE 0 END WHERE id=?`,
    )
    .bind(
      predictions.length,
      inputRevision,
      ...inRound,
      predictions.length,
      ...inRound,
      MODEL_VERSION,
      runId,
    );

  try {
    await db.batch([...captures, finalise]);
  } catch (error) {
    // A transport failure can follow a successful commit. Resolve this attempt before retrying.
    const run = await row(
      Schema.Struct({ published_count: Schema.Int }),
      db
        .prepare("SELECT published_count FROM tipper_runs WHERE id=? AND published_at IS NOT NULL")
        .bind(runId),
    );

    if (run) return run.published_count;

    throw error;
  }

  return predictions.length;
}

/**
 * Publish a round's mutable set. Manual and scheduled execution use exactly this publisher.
 *
 * @param db - The shared AFL database.
 * @param round - The round to publish.
 * @returns The number of predictions published.
 * @throws UnknownRound when the round has no matches.
 */
export async function publishRound(db: D1Database, round: Round): Promise<number> {
  return commit(db, await prepare(db, round));
}

/**
 * How long an issued prediction stays fresh: five minutes inside 90 minutes of kickoff, an
 * hour inside a day, otherwise a day.
 *
 * @param kickoff - The match kickoff instant.
 * @param now - The current time.
 * @returns The refresh interval in milliseconds.
 */
export function refreshInterval(kickoff: string, now: Date): number {
  const remaining = Date.parse(kickoff) - now.getTime();

  return remaining <= 90 * 60_000
    ? 5 * 60_000
    : remaining <= 24 * 3600_000
      ? 3600_000
      : 24 * 3600_000;
}

const DueMatchSchema = Schema.Struct({
  competition: CompetitionSchema,
  seasonKey: Schema.String,
  round: Schema.Int,
  kickoff_at: Schema.String,
  generated_at: Schema.NullOr(Schema.String),
});

/**
 * Publish every round holding an unlocked match whose prediction is missing or stale,
 * including rounds already underway. One round's failure does not stop the others.
 *
 * @param db - The shared AFL database.
 * @returns The rounds that were due.
 */
export async function publishDue(db: D1Database): Promise<ReadonlyArray<Round>> {
  const now = new Date();

  const matches = await rows(
    DueMatchSchema,
    db.prepare(
      `SELECT c.code AS competition,s.season_key AS seasonKey,m.round_number AS round,
    m.kickoff_at,mp.generated_at ${MATCHES} LEFT JOIN match_predictions mp ON mp.match_id=m.id
    WHERE c.code IN ('AFLM','AFLW') AND ${ELIGIBLE}`,
    ),
  );

  const due = new Map(
    matches
      .filter(
        (match) =>
          !match.generated_at ||
          now.getTime() - Date.parse(match.generated_at) >= refreshInterval(match.kickoff_at, now),
      )
      .map(({ competition, seasonKey, round }) => [
        `${competition}:${seasonKey}:${round}`,
        { competition, seasonKey, round },
      ]),
  );

  for (const round of due.values()) {
    try {
      await publishRound(db, Schema.decodeUnknownSync(RoundSchema)(round));
    } catch (error) {
      console.error("Publication failed", { round, error: String(error) });
    }
  }

  return [...due.values()];
}

/** When prospective coverage began and when the scheduler last ran. */
const StatusSchema = Schema.Struct({
  activated_at: InstantSchema,
  scheduler_at: Schema.NullOr(InstantSchema),
});

export type Status = typeof StatusSchema.Type;

/**
 * Record a scheduler run. The first run registers when prospective coverage began, so
 * activation never happens on a read.
 */
export async function recordHeartbeat(db: D1Database): Promise<void> {
  await db
    .prepare(
      `INSERT INTO tipper_status(id,activated_at,scheduler_at) VALUES(1,${NOW},${NOW})
    ON CONFLICT(id) DO UPDATE SET scheduler_at=excluded.scheduler_at`,
    )
    .run();
}

/** Read the activation and heartbeat instants, or `undefined` before the first scheduler run. */
export async function readStatus(db: D1Database): Promise<Status | undefined> {
  return row(
    StatusSchema,
    db.prepare("SELECT activated_at,scheduler_at FROM tipper_status WHERE id=1"),
  );
}

/**
 * A match with whatever Tipper has issued for it. Every issued field is null until a capture
 * exists, and `consistent` is 1 only while the projection still carries a published capture of
 * the unchanged fixture.
 */
const StoredTipSchema = Schema.Struct({
  competition: CompetitionSchema,
  id: Schema.Int,
  kickoff_at: Schema.NullOr(Schema.String),
  winner: Schema.NullOr(SideSchema),
  issued_margin: Schema.NullOr(Schema.Finite),
  issued_probability: Schema.NullOr(Schema.Finite),
  generated_at: Schema.NullOr(Schema.String),
  consistent: Schema.Literals([0, 1]),
  game_id: Schema.NullOr(Schema.Int),
  home_name: Schema.NullOr(Schema.String),
  away_name: Schema.NullOr(Schema.String),
  squiggle_home_id: Schema.NullOr(Schema.Int),
  squiggle_away_id: Schema.NullOr(Schema.Int),
});

export type StoredTip = typeof StoredTipSchema.Type;

// Read by recorded identity. A newer build never hides an older valid issued tip.
const STORED = `SELECT c.code AS competition,m.id,m.kickoff_at,
  p.winner,p.issued_margin,p.issued_probability,mp.generated_at,g.game_id,g.home_name,g.away_name,
  g.squiggle_home_id,g.squiggle_away_id,
  CASE WHEN r.published_at IS NOT NULL AND mp.model_version=r.model_version
    AND ${LINKED} AND ${SAME_FIXTURE} AND ${SAME_KICKOFF} THEN 1 ELSE 0 END AS consistent
  ${MATCHES}
  LEFT JOIN match_predictions mp ON mp.match_id=m.id
  LEFT JOIN tipper_predictions p ON p.match_id=m.id AND p.run_id=mp.tipper_run_id
  LEFT JOIN tipper_runs r ON r.id=p.run_id
  LEFT JOIN tipper_game_ids g ON g.match_id=m.id AND g.home_team_id=m.home_team_id
    AND g.away_team_id=m.away_team_id AND g.year=s.year AND g.round=m.round_number`;

/** The AFLM matches of one round with their issued tips, in kickoff order. */
export async function roundTips(
  db: D1Database,
  year: number,
  round: number,
): Promise<ReadonlyArray<StoredTip>> {
  return rows(
    StoredTipSchema,
    db
      .prepare(
        `${STORED} WHERE c.code='AFLM' AND s.year=? AND m.round_number=? ORDER BY m.kickoff_at,m.id`,
      )
      .bind(year, round),
  );
}

/** The next AFLM round to kick off, or failing that the most recent round with issued tips. */
export async function currentRound(
  db: D1Database,
): Promise<{ readonly year: number; readonly round: number } | undefined> {
  return row(
    Schema.Struct({ year: Schema.Int, round: Schema.Int }),
    db.prepare(
      `SELECT s.year,m.round_number AS round ${MATCHES} WHERE c.code='AFLM'
      AND (m.status='Upcoming' OR EXISTS(SELECT 1 FROM match_predictions mp WHERE mp.match_id=m.id AND mp.tipper_run_id IS NOT NULL))
      ORDER BY CASE WHEN m.status='Upcoming' AND julianday(m.kickoff_at)>julianday('now') THEN 0 ELSE 1 END,
        CASE WHEN m.status='Upcoming' THEN m.kickoff_at END ASC,m.kickoff_at DESC LIMIT 1`,
    ),
  );
}

/** Every match since activation that should hold an issued tip within the coming week. */
export async function expectedTips(
  db: D1Database,
  activatedAt: string,
  now: Date,
): Promise<ReadonlyArray<StoredTip>> {
  const instant = now.toISOString();

  return rows(
    StoredTipSchema,
    db
      .prepare(
        `${STORED} WHERE c.code IN ('AFLM','AFLW') AND
    ((m.kickoff_at>=? AND julianday(m.kickoff_at)<=julianday(?,'+7 days') AND m.status IN ('Upcoming','Live'))
    OR (m.kickoff_at IS NULL AND m.date>=substr(?,1,10) AND m.date<=date(?,'+7 days') AND m.status='Upcoming'))`,
      )
      .bind(activatedAt, instant, instant, instant),
  );
}
