import { Schema } from "effect";
import { decodeRows, MATCHES, row, rows } from "./d1";
import { SAME_FIXTURE, SAME_KICKOFF } from "./publication";
import { type FieldTip, type Squiggle, squiggleName } from "./squiggle";
import { type Side, SideSchema } from "./types";

const Flag = Schema.Literals([0, 1]);

/**
 * A completed match with the tip Tipper issued for it, if any. Field order is the stored
 * evidence order.
 */
const ScoringMatchSchema = Schema.Struct({
  id: Schema.Int,
  game_id: Schema.NullOr(Schema.Int),
  home: Schema.String,
  away: Schema.String,
  actual_margin: Schema.Int,
  fixture_changed: Flag,
  schedule_changed: Flag,
  run_id: Schema.NullOr(Schema.Int),
  winner: Schema.NullOr(SideSchema),
  issued_margin: Schema.NullOr(Schema.Finite),
  issued_probability: Schema.NullOr(Schema.Finite),
  source_revision: Schema.NullOr(Schema.String),
  kickoff_at: Schema.NullOr(Schema.String),
});

export type ScoringMatch = typeof ScoringMatchSchema.Type;

/** Tipper against one competitor, over the matches both tipped. */
interface Comparison {
  readonly source: string;
  readonly matchIds: ReadonlyArray<number>;
  readonly count: number;
  readonly modelTips: number;
  readonly tips: number;
  readonly mae: number | null;
  readonly marginCount: number;
}

/** One weekly scoring of issued tips against results and the competitor field. */
export interface Score {
  readonly fixtureCorrections: ReadonlyArray<number>;
  readonly scheduleCorrections: ReadonlyArray<number>;
  readonly coverage: {
    readonly expected: number;
    readonly published: number;
    readonly missing: ReadonlyArray<number>;
    readonly missingField: ReadonlyArray<number>;
  };
  readonly correct: number;
  readonly accuracy: number | null;
  readonly draws: number;
  readonly mae: number | null;
  readonly logLoss: number | null;
  readonly brier: number | null;
  readonly closeBand: { readonly total: number; readonly correct: number };
  readonly comparisons: ReadonlyArray<Comparison>;
  readonly ranking: ReadonlyArray<{
    readonly source: string;
    readonly tips: number;
    readonly mae: number | null;
  }>;
  readonly rankingMatchIds: ReadonlyArray<number>;
  readonly marketGap: number | null;
  readonly alert: boolean;
}

type Covered = ScoringMatch & {
  readonly winner: Side;
  readonly issued_margin: number;
  readonly issued_probability: number;
};

const isCorrect = (winner: Side, margin: number): boolean =>
  margin === 0 || (winner === "home") === margin > 0;

const mean = (values: ReadonlyArray<number>): number | null =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

/** The ids of the matches that satisfy a condition, in order. */
const idsWhere = <T extends ScoringMatch>(
  matches: ReadonlyArray<T>,
  holds: (match: T) => boolean,
): ReadonlyArray<number> => matches.flatMap((match) => (holds(match) ? [match.id] : []));

/** The outcome as a probability target: a draw counts as half a home win. */
const outcome = (margin: number): number => (margin === 0 ? 0.5 : margin > 0 ? 1 : 0);

/**
 * Score recorded issued outputs, with explicit paired comparison sets.
 *
 * Each competitor is compared only over the matches it also tipped, and enters the ranking
 * only when it tipped every match Tipper did.
 *
 * @param matches - The week's completed matches with any issued tip.
 * @param field - The competitor tips for the season.
 * @returns The score retained as the weekly report.
 */
export function score(matches: ReadonlyArray<ScoringMatch>, field: ReadonlyArray<FieldTip>): Score {
  const covered = matches.filter(
    (match): match is Covered =>
      match.run_id !== null &&
      match.winner !== null &&
      match.issued_margin !== null &&
      match.issued_probability !== null,
  );

  const close = covered.filter(
    (match) => Math.abs(match.issued_margin) < 12 && match.actual_margin !== 0,
  );

  // A source that tips the same game twice is ambiguous, so neither tip is used.
  const tips = new Map<string, FieldTip | null>();

  for (const tip of field) {
    const key = `${tip.source}:${tip.gameid}`;

    tips.set(key, tips.has(key) ? null : tip);
  }

  const comparisons = [...new Set(field.map((tip) => tip.source))].map((source): Comparison => {
    const paired = covered.flatMap((match) => {
      const tip = tips.get(`${source}:${match.game_id}`);

      return tip &&
        tip.hteam === squiggleName(match.home) &&
        tip.ateam === squiggleName(match.away) &&
        (tip.tip === tip.hteam || tip.tip === tip.ateam)
        ? [{ match, tip }]
        : [];
    });

    return {
      source,
      matchIds: paired.map((pair) => pair.match.id),
      count: paired.length,
      modelTips: paired.filter((pair) => isCorrect(pair.match.winner, pair.match.actual_margin))
        .length,
      tips: paired.filter((pair) =>
        isCorrect(pair.tip.tip === pair.tip.hteam ? "home" : "away", pair.match.actual_margin),
      ).length,
      mae: mean(
        paired.flatMap((pair) =>
          pair.tip.hmargin == null ? [] : [Math.abs(pair.tip.hmargin - pair.match.actual_margin)],
        ),
      ),
      marginCount: paired.filter((pair) => pair.tip.hmargin != null).length,
    };
  });

  const modelTips = covered.filter((match) => isCorrect(match.winner, match.actual_margin)).length;
  const mae = mean(covered.map((match) => Math.abs(match.issued_margin - match.actual_margin)));

  const ranking = (
    covered.length
      ? [
          { source: "Tipper", tips: modelTips, mae },
          ...comparisons.flatMap((comparison) =>
            comparison.count === covered.length && comparison.count > 0
              ? [
                  {
                    ...comparison,
                    mae: comparison.marginCount === comparison.count ? comparison.mae : null,
                  },
                ]
              : [],
          ),
        ]
      : []
  ).toSorted((a, b) => b.tips - a.tips || (a.mae ?? Infinity) - (b.mae ?? Infinity));

  const punters = comparisons.find((comparison) => comparison.source === "Punters");
  const marketGap = punters?.count ? punters.modelTips - punters.tips : null;

  return {
    fixtureCorrections: idsWhere(matches, (match) => match.fixture_changed === 1),
    scheduleCorrections: idsWhere(matches, (match) => match.schedule_changed === 1),
    coverage: {
      expected: matches.length,
      published: covered.length,
      missing: idsWhere(matches, (match) => match.run_id === null),
      missingField: idsWhere(
        covered,
        (match) => !comparisons.some((comparison) => comparison.matchIds.includes(match.id)),
      ),
    },
    correct: modelTips,
    accuracy: covered.length ? modelTips / covered.length : null,
    draws: covered.filter((match) => match.actual_margin === 0).length,
    mae,
    logLoss: mean(
      covered.map((match) => {
        const y = outcome(match.actual_margin);

        return (
          -y * Math.log(match.issued_probability) - (1 - y) * Math.log(1 - match.issued_probability)
        );
      }),
    ),
    brier: mean(
      covered.map((match) => (match.issued_probability - outcome(match.actual_margin)) ** 2),
    ),
    closeBand: {
      total: close.length,
      correct: close.filter((match) => isCorrect(match.winner, match.actual_margin)).length,
    },
    comparisons,
    ranking,
    rankingMatchIds: covered.map((match) => match.id),
    marketGap,
    alert: marketGap !== null && Math.abs(marketGap) >= 3,
  };
}

/**
 * The start of the current reporting week: the most recent Monday 22:00 UTC.
 *
 * @param now - The current time.
 * @returns The week's opening instant.
 */
export function reportingWeek(now: Date): string {
  const date = new Date(now);

  date.setUTCHours(22, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));

  if (date > now) date.setUTCDate(date.getUTCDate() - 7);

  return date.toISOString();
}

const AttemptSchema = Schema.Struct({
  id: Schema.Int,
  observed_at: Schema.String,
  week: Schema.String,
  status: Schema.String,
  error: Schema.NullOr(Schema.String),
});

const RetainedSchema = Schema.Struct({
  observed_at: Schema.String,
  week: Schema.String,
  result: Schema.fromJsonString(Schema.Json),
});

/** The newest retained report for a season, alongside the newest collection attempt. */
export interface LatestReport {
  readonly observedAt: string | null;
  readonly status: string;
  /** True when no report has been retained for the current reporting week. */
  readonly stale: boolean;
  readonly latestAttempt: typeof AttemptSchema.Type | null;
  /** The retained score, served exactly as it was stored. */
  readonly report: Schema.Json;
}

/**
 * Read the latest report. A failed attempt is reported as the status but never hides the
 * last successful report.
 *
 * @param db - The shared AFL database.
 * @param season - The season year.
 * @param now - The current time.
 * @returns The latest attempt and the latest retained report.
 */
export async function latestReport(
  db: D1Database,
  season: number,
  now: Date,
): Promise<LatestReport> {
  const results = await db.batch([
    db
      .prepare(
        "SELECT id,observed_at,week,status,error FROM tipper_reports WHERE season=? ORDER BY id DESC LIMIT 1",
      )
      .bind(season),
    db
      .prepare(
        "SELECT observed_at,week,result FROM tipper_reports WHERE season=? AND status<>'failed' AND result IS NOT NULL ORDER BY id DESC LIMIT 1",
      )
      .bind(season),
  ]);

  const [latest] = decodeRows(AttemptSchema, results[0]);
  const [retained] = decodeRows(RetainedSchema, results[1]);

  return {
    observedAt: retained?.observed_at ?? null,
    status: latest?.status ?? "unavailable",
    stale: !retained || retained.week < reportingWeek(now),
    latestAttempt: latest ?? null,
    report: retained?.result ?? null,
  };
}

/** What one collection attempt observed, retained with the report whether or not it succeeded. */
interface Observations {
  matches?: ReadonlyArray<ScoringMatch>;
  field?: ReadonlyArray<FieldTip>;
}

/**
 * Collect the weekly report for the current reporting week, at most once per hour until one
 * succeeds. Failed attempts are retained with whatever was observed and never replace
 * successful evidence. Nothing is collected before prospective coverage is activated.
 *
 * @param db - The shared AFL database.
 * @param api - The Squiggle client.
 * @param now - The current time.
 */
export async function collectReport(db: D1Database, api: Squiggle, now: Date): Promise<void> {
  const season = now.getUTCFullYear();
  const week = reportingWeek(now);

  const activation = await row(
    Schema.Struct({ activated_at: Schema.String }),
    db.prepare("SELECT activated_at FROM tipper_status WHERE id=1"),
  );

  if (!activation || week < activation.activated_at) return;

  const previous = await row(
    Schema.Struct({ status: Schema.String, observed_at: Schema.String }),
    db
      .prepare(
        "SELECT status,observed_at FROM tipper_reports WHERE season=? AND week=? ORDER BY id DESC LIMIT 1",
      )
      .bind(season, week),
  );

  if (
    previous &&
    (previous.status === "ok" || now.getTime() - Date.parse(previous.observed_at) < 3600_000)
  )
    return;

  // Filled in as each observation succeeds, so a failure retains everything seen before it.
  const evidence: Observations = {};

  try {
    // The authoritative capture is the last one published before its own recorded kickoff.
    evidence.matches = await rows(
      ScoringMatchSchema,
      db
        .prepare(
          `SELECT m.id,g.game_id,h.name AS home,a.name AS away,m.home_points-m.away_points AS actual_margin,
      CASE WHEN p.run_id IS NOT NULL AND NOT (${SAME_FIXTURE}) THEN 1 ELSE 0 END AS fixture_changed,
      CASE WHEN p.run_id IS NOT NULL AND NOT (${SAME_KICKOFF}) THEN 1 ELSE 0 END AS schedule_changed,
      CASE WHEN p.home_team_id=m.home_team_id AND p.away_team_id=m.away_team_id AND p.season_id=m.season_id
        THEN p.run_id ELSE NULL END AS run_id,p.winner,p.issued_margin,p.issued_probability,r.source_revision,COALESCE(p.kickoff_at,m.kickoff_at) AS kickoff_at
      ${MATCHES}
      JOIN teams h ON h.id=m.home_team_id JOIN teams a ON a.id=m.away_team_id
      LEFT JOIN tipper_game_ids g ON g.match_id=m.id AND g.home_team_id=m.home_team_id AND g.away_team_id=m.away_team_id
      LEFT JOIN tipper_predictions p ON p.match_id=m.id AND p.run_id=(SELECT MAX(q.run_id) FROM tipper_predictions q
        JOIN tipper_runs qr ON qr.id=q.run_id WHERE q.match_id=m.id AND qr.published_at<q.kickoff_at
        AND qr.published_at IS NOT NULL)
      LEFT JOIN tipper_runs r ON r.id=p.run_id
      WHERE c.code='AFLM' AND s.year=? AND m.status='Complete' AND m.home_points>=0 AND m.away_points>=0
        AND ((COALESCE(p.kickoff_at,m.kickoff_at)>=? AND COALESCE(p.kickoff_at,m.kickoff_at)<=?)
        OR (p.kickoff_at IS NULL AND m.kickoff_at IS NULL AND m.date>=substr(?,1,10) AND m.date<=substr(?,1,10)))`,
        )
        .bind(season, activation.activated_at, week, activation.activated_at, week),
    );
    evidence.field = await api.tips(season);

    const result = score(evidence.matches, evidence.field);

    const isPartial =
      result.coverage.expected > 0 &&
      (result.coverage.missingField.length > 0 ||
        !result.comparisons.some(
          (comparison) =>
            comparison.source === "Punters" && comparison.count === result.coverage.published,
        ));

    await db
      .prepare(
        "INSERT INTO tipper_reports(season,week,observed_at,status,evidence,result) VALUES(?,?,?,?,?,?)",
      )
      .bind(
        season,
        week,
        now.toISOString(),
        isPartial ? "partial" : "ok",
        JSON.stringify(evidence),
        JSON.stringify(result),
      )
      .run();
  } catch (error) {
    await db
      .prepare(
        "INSERT INTO tipper_reports(season,week,observed_at,status,evidence,error) VALUES(?,?,?,'failed',?,?)",
      )
      .bind(
        season,
        week,
        now.toISOString(),
        JSON.stringify(evidence),
        error instanceof Error ? error.message : String(error),
      )
      .run();
  }

  await db
    .prepare("UPDATE tipper_status SET reporting_at=? WHERE id=1")
    .bind(now.toISOString())
    .run();
}
