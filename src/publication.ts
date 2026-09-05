import {
  MODEL,
  type Prediction,
  predict,
  type Round,
  RoundSchema,
  SnapshotSchema,
} from "./prediction.js";

declare const SOURCE_REVISION: string;
export const REVISION = typeof SOURCE_REVISION === "string" ? SOURCE_REVISION : "development";
export const MODEL_VERSION = `${MODEL.identity}@${REVISION}`;
const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";
/** The latest admitted capture owns the lock, including after projection invalidation. */
export const ELIGIBLE = `m.status='Upcoming' AND julianday(m.kickoff_at)>julianday('now')
 AND julianday(m.kickoff_at)<=julianday('now','+7 days')
 AND NOT EXISTS (SELECT 1 FROM tipper_predictions p WHERE p.match_id=m.id
   AND p.run_id=(SELECT MAX(q.run_id) FROM tipper_predictions q WHERE q.match_id=m.id)
   AND julianday(p.kickoff_at)<=julianday('now'))`;
const ROUND = "c.code=? AND s.year=? AND m.round_number=?";
const JOINS =
  "FROM matches m JOIN seasons s ON s.id=m.season_id JOIN competitions c ON c.id=s.competition_id";

/** Allocate before input reads, so overlapping attempts have a database order. */
export async function beginRun(db: D1Database, input: Round): Promise<number> {
  const round = RoundSchema.parse(input);
  const run = await db
    .prepare(`INSERT INTO tipper_runs(competition,season,round,started_at,source_revision,model_version)
    VALUES(?,?,?,${NOW},?,?) RETURNING id`)
    .bind(round.competition, round.season, round.round, REVISION, MODEL_VERSION)
    .first<{ id: number }>();
  if (!run) throw new Error("Run allocation failed");
  return run.id;
}

/** One native batch supplies the complete bounded input snapshot. */
export async function readSnapshot(db: D1Database, round: Round) {
  const args = [round.competition, round.season, round.round];
  const complete =
    "m.status='Complete' AND m.home_points>=0 AND m.away_points>=0 AND m.date<date('now','+1 day')";
  const results = await db.batch([
    db
      .prepare(`SELECT ${NOW} AS observed_at, COUNT(*) AS count ${JOINS} WHERE ${ROUND}`)
      .bind(...args),
    db
      .prepare(
        `SELECT m.id,m.season_id,m.round_number,m.home_team_id,m.away_team_id,m.venue_id,m.external_afl_id,m.kickoff_at,m.date,m.status,m.home_points,m.away_points,s.year ${JOINS} WHERE c.code=? AND s.year BETWEEN 2020 AND ? AND ${complete} LIMIT 10001`,
      )
      .bind(round.competition, round.season),
    db
      .prepare(
        `SELECT m.id,m.season_id,m.round_number,m.home_team_id,m.away_team_id,m.venue_id,m.external_afl_id,m.kickoff_at,m.date,m.status,m.home_points,m.away_points,s.year ${JOINS} WHERE ${ROUND} AND ${ELIGIBLE} ORDER BY m.kickoff_at,m.id LIMIT 21`,
      )
      .bind(...args),
    db
      .prepare(`SELECT ps.match_id,ps.player_id,ps.team_id,ps.goals,ps.behinds,ps.hitouts,ps.goal_assists,ps.inside_fifties,ps.marks_inside_fifty,ps.free_kicks_for,ps.free_kicks_against,ps.rebounds,ps.one_percenters,ps.marks,ps.clearances,ps.tackles FROM player_match_stats ps JOIN matches m ON m.id=ps.match_id
      JOIN seasons s ON s.id=m.season_id JOIN competitions c ON c.id=s.competition_id
      WHERE c.code=? AND s.year=? AND ${complete} LIMIT 30001`)
      .bind(round.competition, round.season),
    db
      .prepare(`SELECT p.player_id,p.team_id,p.off_pav,p.mid_pav,p.def_pav FROM player_season_pav p JOIN seasons s ON s.id=p.season_id
      JOIN competitions c ON c.id=s.competition_id WHERE c.code=? AND s.year=? LIMIT 2001`)
      .bind(round.competition, round.season - 1),
    db
      .prepare(`SELECT ml.match_id,ml.player_id,ml.team_id,ml.is_emergency,m.lineups_observed_at AS observed_at FROM match_lineups ml
      JOIN matches m ON m.id=ml.match_id JOIN seasons s ON s.id=m.season_id
      JOIN competitions c ON c.id=s.competition_id WHERE ${ROUND} AND ${ELIGIBLE}
      AND m.lineups_observed_at IS NOT NULL LIMIT 1201`)
      .bind(...args),
    db
      .prepare(`SELECT
      (SELECT COALESCE(SUM(m.home_points+m.away_points),0) ${JOINS} WHERE c.code=? AND s.year>=2021 AND s.year<? AND ${complete}) AS points,
      (SELECT COALESCE(SUM(ps.inside_fifties),0) FROM player_match_stats ps JOIN matches m ON m.id=ps.match_id
       JOIN seasons s ON s.id=m.season_id JOIN competitions c ON c.id=s.competition_id
       WHERE c.code=? AND s.year>=2021 AND s.year<? AND ${complete}) AS inside50`)
      .bind(round.competition, round.season, round.competition, round.season),
  ]);
  const header = results[0]?.results[0] as { observed_at: string; count: number } | undefined;
  if (!header?.count) throw new Error("Unknown round");
  return SnapshotSchema.parse({
    round,
    observedAt: header.observed_at,
    matches: results[1]?.results,
    candidates: results[2]?.results,
    stats: results[3]?.results,
    priors: results[4]?.results,
    lineups: results[5]?.results,
    league: results[6]?.results[0],
  });
}

/** Commit captures, compatibility projections and checked finalization in one transaction. */
export async function commitRun(
  db: D1Database,
  runId: number,
  round: Round,
  observedAt: string,
  predictions: readonly Prediction[],
): Promise<number> {
  if (!predictions.length) return 0;
  if (new Set(predictions.map((p) => p.fixture.id)).size !== predictions.length)
    throw new Error("Duplicate prediction");
  const statements: D1PreparedStatement[] = [];
  for (const p of predictions) {
    if (
      ![p.margin, p.homeProbability, p.issuedMargin, p.issuedProbability].every(Number.isFinite) ||
      p.winner !== (p.margin >= 0 ? "home" : "away") ||
      p.issuedMargin !== Math.round(p.margin * 10) / 10 ||
      p.issuedProbability !== p.homeProbability
    )
      throw new Error("Invalid prediction output");
    const m = p.fixture;
    statements.push(
      db
        .prepare(`INSERT INTO tipper_predictions(run_id,match_id,season_id,round_number,
      home_team_id,away_team_id,venue_id,external_afl_id,kickoff_at,margin,home_probability,winner,
      issued_margin,issued_probability,provisional,evidence,observed_at,published_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,${NOW})`)
        .bind(
          runId,
          m.id,
          m.season_id,
          m.round_number,
          m.home_team_id,
          m.away_team_id,
          m.venue_id,
          m.external_afl_id,
          m.kickoff_at,
          p.margin,
          p.homeProbability,
          p.winner,
          p.issuedMargin,
          p.issuedProbability,
          p.provisional ? 1 : 0,
          JSON.stringify(p.evidence),
          observedAt,
        ),
    );
    statements.push(
      db
        .prepare(`INSERT INTO match_predictions(match_id,home_win_prob,predicted_margin,model_version,generated_at,tipper_run_id)
      SELECT match_id,issued_probability,issued_margin,?,published_at,run_id FROM tipper_predictions WHERE run_id=? AND match_id=?
      ON CONFLICT(match_id) DO UPDATE SET home_win_prob=excluded.home_win_prob,predicted_margin=excluded.predicted_margin,
      model_version=excluded.model_version,generated_at=excluded.generated_at,tipper_run_id=excluded.tipper_run_id`)
        .bind(MODEL_VERSION, runId, m.id),
    );
  }
  // CHECK(finalized=1) forces rollback, unlike an UPDATE whose WHERE quietly matches no rows.
  statements.push(
    db
      .prepare(`UPDATE tipper_runs SET published_at=${NOW}, published_count=?, finalized=CASE WHEN
    competition=? AND season=? AND round=? AND published_at IS NULL
    AND NOT EXISTS(SELECT 1 FROM tipper_runs newer WHERE newer.competition=tipper_runs.competition
      AND newer.season=tipper_runs.season AND newer.round=tipper_runs.round AND newer.id>tipper_runs.id AND newer.published_at IS NOT NULL)
    AND (SELECT COUNT(*) FROM match_predictions WHERE tipper_run_id=tipper_runs.id)= (SELECT COUNT(*) FROM tipper_predictions WHERE run_id=tipper_runs.id)
    AND (SELECT COUNT(*) FROM tipper_predictions WHERE run_id=?)=?
    AND (SELECT COUNT(*) ${JOINS} WHERE ${ROUND} AND ${ELIGIBLE})=?
    AND NOT EXISTS(SELECT 1 FROM tipper_predictions p JOIN matches m ON m.id=p.match_id
      JOIN seasons s ON s.id=m.season_id JOIN competitions c ON c.id=s.competition_id
      LEFT JOIN match_predictions projection ON projection.match_id=p.match_id
      WHERE p.run_id=? AND (
        NOT (${ROUND} AND ${ELIGIBLE}) OR m.kickoff_at IS NOT p.kickoff_at
        OR m.season_id IS NOT p.season_id OR m.round_number IS NOT p.round_number
        OR m.home_team_id IS NOT p.home_team_id OR m.away_team_id IS NOT p.away_team_id
        OR m.venue_id IS NOT p.venue_id OR m.external_afl_id IS NOT p.external_afl_id
        OR julianday(p.kickoff_at)<=julianday('now')
        OR EXISTS(SELECT 1 FROM tipper_predictions old WHERE old.match_id=p.match_id AND old.run_id<>p.run_id
          AND old.run_id=(SELECT MAX(q.run_id) FROM tipper_predictions q WHERE q.match_id=p.match_id AND q.run_id<>p.run_id)
          AND julianday(old.kickoff_at)<=julianday('now'))
        OR projection.tipper_run_id IS NOT p.run_id OR projection.predicted_margin IS NOT p.issued_margin
        OR projection.home_win_prob IS NOT p.issued_probability OR projection.generated_at IS NOT p.published_at OR projection.model_version IS NOT ?))
    THEN 1 ELSE 0 END WHERE id=?`)
      .bind(
        predictions.length,
        round.competition,
        round.season,
        round.round,
        runId,
        predictions.length,
        round.competition,
        round.season,
        round.round,
        predictions.length,
        runId,
        round.competition,
        round.season,
        round.round,
        MODEL_VERSION,
        runId,
      ),
  );
  try {
    await db.batch(statements);
  } catch (error) {
    // A transport failure can follow a successful commit. Resolve this attempt before retrying.
    const run = await db
      .prepare("SELECT published_count FROM tipper_runs WHERE id=? AND published_at IS NOT NULL")
      .bind(runId)
      .first<{ published_count: number }>();
    if (run) return run.published_count;
    throw error;
  }
  return predictions.length;
}

/** Manual and scheduled execution use exactly the same publisher. */
export async function publishRound(db: D1Database, round: Round): Promise<number> {
  const run = await beginRun(db, round);
  const snapshot = await readSnapshot(db, round);
  return commitRun(db, run, round, snapshot.observedAt, predict(snapshot));
}

export function refreshInterval(kickoff: string, now: Date): number {
  const remaining = Date.parse(kickoff) - now.getTime();
  return remaining <= 90 * 60_000
    ? 5 * 60_000
    : remaining <= 24 * 3600_000
      ? 3600_000
      : 24 * 3600_000;
}
/** Select rounds by individual unlocked match freshness, including underway rounds. */
export async function dueRounds(db: D1Database, now = new Date()): Promise<Round[]> {
  const rows = await db
    .prepare(`SELECT c.code AS competition,s.year AS season,m.round_number AS round,
    m.kickoff_at,p.generated_at ${JOINS} LEFT JOIN match_predictions p ON p.match_id=m.id
    WHERE c.code IN ('AFLM','AFLW') AND ${ELIGIBLE}`)
    .all<Round & { kickoff_at: string; generated_at: string | null }>();
  const rounds = new Map<string, Round>();
  for (const r of rows.results)
    if (
      !r.generated_at ||
      now.getTime() - Date.parse(r.generated_at) >= refreshInterval(r.kickoff_at, now)
    )
      rounds.set(`${r.competition}:${r.season}:${r.round}`, {
        competition: r.competition,
        season: r.season,
        round: r.round,
      });
  return [...rounds.values()];
}
