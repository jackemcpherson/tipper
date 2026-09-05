import type { FieldTip } from "./squiggle.js";
import { FieldSchema, squiggleJson, squiggleName } from "./squiggle.js";

export interface ScoringMatch {
  fixture_changed?: number;
  schedule_changed?: number;
  id: number;
  game_id: number | null;
  home: string;
  away: string;
  actual_margin: number;
  run_id: number | null;
  winner: "home" | "away" | null;
  issued_margin: number | null;
  issued_probability: number | null;
  source_revision: string | null;
  kickoff_at: string;
}
/** Score recorded issued outputs, with explicit paired comparison sets. */
export function score(matches: readonly ScoringMatch[], field: readonly FieldTip[]) {
  const covered = matches.filter(
    (
      m,
    ): m is ScoringMatch & {
      winner: "home" | "away";
      issued_margin: number;
      issued_probability: number;
    } =>
      m.run_id !== null &&
      m.winner !== null &&
      m.issued_margin !== null &&
      m.issued_probability !== null,
  );
  const correct = (winner: "home" | "away", margin: number) =>
    margin === 0 || (winner === "home") === margin > 0;
  const mean = (values: number[]) =>
    values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  const close = covered.filter((m) => Math.abs(m.issued_margin) < 12 && m.actual_margin !== 0);
  const sources = [...new Set(field.map((t) => t.source))];
  const indexed = new Map<string, FieldTip | null>();
  for (const tip of field) {
    const key = `${tip.source}:${tip.gameid}`;
    indexed.set(key, indexed.has(key) ? null : tip);
  }
  const comparisons = sources.map((source) => {
    const paired = covered.flatMap((m) => {
      const candidate = indexed.get(`${source}:${m.game_id}`);
      const t =
        candidate?.hteam === squiggleName(m.home) && candidate.ateam === squiggleName(m.away)
          ? candidate
          : null;
      if (!t || (t.tip !== t.hteam && t.tip !== t.ateam)) return [];
      return [{ m, t }];
    });
    return {
      source,
      matchIds: paired.map((p) => p.m.id),
      count: paired.length,
      modelTips: paired.filter((p) => correct(p.m.winner, p.m.actual_margin)).length,
      tips: paired.filter((p) =>
        correct(p.t.tip === p.t.hteam ? "home" : "away", p.m.actual_margin),
      ).length,
      mae: mean(
        paired.flatMap((p) =>
          p.t.hmargin == null ? [] : [Math.abs(p.t.hmargin - p.m.actual_margin)],
        ),
      ),
      marginCount: paired.filter((p) => p.t.hmargin != null).length,
    };
  });
  const modelTips = covered.filter((m) => correct(m.winner, m.actual_margin)).length;
  const mae = mean(covered.map((m) => Math.abs(m.issued_margin - m.actual_margin)));
  const ranking = (
    covered.length
      ? [
          { source: "Tipper", tips: modelTips, mae },
          ...comparisons
            .filter((c) => c.count === covered.length && c.count > 0)
            .map((c) => ({ ...c, mae: c.marginCount === c.count ? c.mae : null })),
        ]
      : []
  ).sort((a, b) => b.tips - a.tips || (a.mae ?? Infinity) - (b.mae ?? Infinity));
  const punters = comparisons.find((c) => c.source === "Punters");
  const gap = punters?.count ? punters.modelTips - punters.tips : null;
  return {
    fixtureCorrections: matches.filter((m) => m.fixture_changed).map((m) => m.id),
    scheduleCorrections: matches.filter((m) => m.schedule_changed).map((m) => m.id),
    coverage: {
      expected: matches.length,
      published: covered.length,
      missing: matches.filter((m) => m.run_id === null).map((m) => m.id),
      missingField: covered
        .filter((m) => !comparisons.some((c) => c.matchIds.includes(m.id)))
        .map((m) => m.id),
    },
    correct: modelTips,
    accuracy: covered.length ? modelTips / covered.length : null,
    draws: covered.filter((m) => m.actual_margin === 0).length,
    mae,
    logLoss: mean(
      covered.map((m) => {
        const y = m.actual_margin === 0 ? 0.5 : m.actual_margin > 0 ? 1 : 0;
        return -y * Math.log(m.issued_probability) - (1 - y) * Math.log(1 - m.issued_probability);
      }),
    ),
    brier: mean(
      covered.map(
        (m) =>
          (m.issued_probability - (m.actual_margin === 0 ? 0.5 : m.actual_margin > 0 ? 1 : 0)) ** 2,
      ),
    ),
    closeBand: {
      total: close.length,
      correct: close.filter((m) => correct(m.winner, m.actual_margin)).length,
    },
    comparisons,
    ranking,
    rankingMatchIds: covered.map((m) => m.id),
    marketGap: gap,
    alert: gap !== null && Math.abs(gap) >= 3,
  };
}

/** Most recent Monday 22:00 UTC, including the prior week before that instant. */
export function reportingWeek(now: Date): string {
  const date = new Date(now);
  date.setUTCHours(22, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  if (date > now) date.setUTCDate(date.getUTCDate() - 7);
  return date.toISOString();
}
export async function latestReport(db: D1Database, season: number, now = new Date()) {
  const rows = await db.batch([
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
  const latest = rows[0]?.results[0] as
    | { id: number; observed_at: string; week: string; status: string; error: string | null }
    | undefined;
  const successful = rows[1]?.results[0] as
    | { observed_at: string; week: string; result: string }
    | undefined;
  return {
    observedAt: successful?.observed_at ?? null,
    status: latest?.status ?? "unavailable",
    stale: !successful || successful.week < reportingWeek(now),
    latestAttempt: latest ?? null,
    report: successful?.result ? JSON.parse(successful.result) : null,
  };
}
/** Retain failed collection attempts and retry hourly without replacing successful evidence. */
export async function collectReport(
  db: D1Database,
  season: number,
  now = new Date(),
): Promise<void> {
  const week = reportingWeek(now);
  const activation = await db
    .prepare("SELECT activated_at FROM tipper_status WHERE id=1")
    .first<{ activated_at: string }>();
  if (!activation || week < activation.activated_at) return;
  const attempt = await db
    .prepare(
      "SELECT status,observed_at FROM tipper_reports WHERE season=? AND week=? ORDER BY id DESC LIMIT 1",
    )
    .bind(season, week)
    .first<{ status: string; observed_at: string }>();
  if (
    attempt &&
    (attempt.status === "ok" || now.getTime() - Date.parse(attempt.observed_at) < 3600_000)
  )
    return;
  let evidence: unknown = {};
  try {
    const rows = await db
      .prepare(`SELECT m.id,g.game_id,h.name AS home,a.name AS away,m.home_points-m.away_points AS actual_margin,
      CASE WHEN p.run_id IS NOT NULL AND (p.home_team_id IS NOT m.home_team_id OR p.away_team_id IS NOT m.away_team_id OR p.season_id IS NOT m.season_id OR p.round_number IS NOT m.round_number OR p.venue_id IS NOT m.venue_id OR p.external_afl_id IS NOT m.external_afl_id) THEN 1 ELSE 0 END AS fixture_changed,
      CASE WHEN p.run_id IS NOT NULL AND p.kickoff_at IS NOT m.kickoff_at THEN 1 ELSE 0 END AS schedule_changed,
      CASE WHEN p.home_team_id=m.home_team_id AND p.away_team_id=m.away_team_id AND p.season_id=m.season_id
        THEN p.run_id ELSE NULL END AS run_id,p.winner,p.issued_margin,p.issued_probability,r.source_revision,COALESCE(p.kickoff_at,m.kickoff_at) AS kickoff_at
      FROM matches m JOIN seasons s ON s.id=m.season_id JOIN competitions c ON c.id=s.competition_id
      JOIN teams h ON h.id=m.home_team_id JOIN teams a ON a.id=m.away_team_id
      LEFT JOIN tipper_game_ids g ON g.match_id=m.id AND g.home_team_id=m.home_team_id AND g.away_team_id=m.away_team_id
      LEFT JOIN tipper_predictions p ON p.match_id=m.id AND p.run_id=(SELECT MAX(q.run_id) FROM tipper_predictions q
        JOIN tipper_runs qr ON qr.id=q.run_id WHERE q.match_id=m.id AND qr.published_at<q.kickoff_at
        AND qr.published_at IS NOT NULL)
      LEFT JOIN tipper_runs r ON r.id=p.run_id
      WHERE c.code='AFLM' AND s.year=? AND m.status='Complete' AND m.home_points>=0 AND m.away_points>=0
        AND ((COALESCE(p.kickoff_at,m.kickoff_at)>=? AND COALESCE(p.kickoff_at,m.kickoff_at)<=?)
        OR (p.kickoff_at IS NULL AND m.kickoff_at IS NULL AND m.date>=substr(?,1,10) AND m.date<=substr(?,1,10)))`)
      .bind(season, activation.activated_at, week, activation.activated_at, week)
      .all<ScoringMatch>();
    evidence = { matches: rows.results };
    const field = FieldSchema.parse(await squiggleJson(`q=tips;year=${season}`)).tips;
    evidence = { matches: rows.results, field };
    const result = score(rows.results, field);
    const partial =
      result.coverage.expected > 0 &&
      (result.coverage.missingField.length > 0 ||
        !result.comparisons.some(
          (c) => c.source === "Punters" && c.count === result.coverage.published,
        ));
    await db
      .prepare(
        "INSERT INTO tipper_reports(season,week,observed_at,status,evidence,result) VALUES(?,?,?,?,?,?)",
      )
      .bind(
        season,
        week,
        now.toISOString(),
        partial ? "partial" : "ok",
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
