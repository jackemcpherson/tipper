import { z } from "zod";
import { collectReport, latestReport } from "../evidence.js";
import { RoundSchema } from "../prediction.js";
import { dueRounds, publishRound, refreshInterval } from "../publication.js";
import { resolveMappings } from "../squiggle.js";

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Cache-Control": "no-store",
};
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: HEADERS });
const yearSchema = z.coerce.number().int().min(1900).max(2100);
interface StoredTip {
  competition: string;
  id: number;
  year: number;
  round_number: number;
  home_team_id: number;
  away_team_id: number;
  kickoff_at: string | null;
  status: string;
  run_id: number | null;
  winner: "home" | "away" | null;
  issued_margin: number | null;
  issued_probability: number | null;
  generated_at: string | null;
  consistent: number;
  game_id: number | null;
  home_name: string | null;
  away_name: string | null;
  squiggle_home_id: number | null;
  squiggle_away_id: number | null;
}
// Read by recorded identity. A newer build never hides an older valid issued tip.
const STORED = `SELECT c.code AS competition,m.id,s.year,m.round_number,m.home_team_id,m.away_team_id,m.kickoff_at,m.status,
  p.run_id,p.winner,p.issued_margin,p.issued_probability,mp.generated_at,g.game_id,g.home_name,g.away_name,
  g.squiggle_home_id,g.squiggle_away_id,
  CASE WHEN p.run_id=mp.tipper_run_id AND r.published_at IS NOT NULL
    AND mp.model_version=r.model_version AND mp.generated_at=p.published_at
    AND mp.home_win_prob=p.issued_probability AND mp.predicted_margin=p.issued_margin
    AND m.home_team_id=p.home_team_id AND m.away_team_id=p.away_team_id
    AND m.season_id=p.season_id AND m.round_number=p.round_number
    AND m.venue_id IS p.venue_id AND m.external_afl_id IS p.external_afl_id
    AND m.kickoff_at=p.kickoff_at THEN 1 ELSE 0 END AS consistent
  FROM matches m JOIN seasons s ON s.id=m.season_id JOIN competitions c ON c.id=s.competition_id
  LEFT JOIN match_predictions mp ON mp.match_id=m.id
  LEFT JOIN tipper_predictions p ON p.match_id=m.id AND p.run_id=mp.tipper_run_id
  LEFT JOIN tipper_runs r ON r.id=p.run_id
  LEFT JOIN tipper_game_ids g ON g.match_id=m.id AND g.home_team_id=m.home_team_id
    AND g.away_team_id=m.away_team_id AND g.year=s.year AND g.round=m.round_number`;

async function tips(request: Request, db: D1Database) {
  const params = new URL(request.url).searchParams;
  let year: number, round: number;
  const y = params.get("year"),
    r = params.get("round");
  if (y !== null || r !== null) {
    if (y === null || r === null || !/^\d+$/.test(y) || !/^\d+$/.test(r))
      return json({ error: "Provide valid year and round" }, 400);
    const parsed = z
      .object({ year: yearSchema, round: z.coerce.number().int().min(0).max(50) })
      .safeParse({ year: y, round: r });
    if (!parsed.success) return json({ error: "Invalid year or round" }, 400);
    ({ year, round } = parsed.data);
  } else {
    const selected = await db
      .prepare(`SELECT s.year,m.round_number AS round FROM matches m JOIN seasons s ON s.id=m.season_id
      JOIN competitions c ON c.id=s.competition_id WHERE c.code='AFLM'
      AND (m.status='Upcoming' OR EXISTS(SELECT 1 FROM match_predictions p WHERE p.match_id=m.id AND p.tipper_run_id IS NOT NULL))
      ORDER BY CASE WHEN m.status='Upcoming' AND julianday(m.kickoff_at)>julianday('now') THEN 0 ELSE 1 END,
        CASE WHEN m.status='Upcoming' THEN m.kickoff_at END ASC,m.kickoff_at DESC LIMIT 1`)
      .first<{ year: number; round: number }>();
    if (!selected) return json({ error: "No published round" }, 404);
    ({ year, round } = selected);
  }
  const rows = (
    await db
      .prepare(
        `${STORED} WHERE c.code='AFLM' AND s.year=? AND m.round_number=? ORDER BY m.kickoff_at,m.id`,
      )
      .bind(year, round)
      .all<StoredTip>()
  ).results;
  if (!rows.length) return json({ error: "Unknown round" }, 404);
  if (
    rows.some(
      (m) =>
        !m.consistent ||
        !m.game_id ||
        !m.home_name ||
        !m.away_name ||
        !m.winner ||
        m.issued_margin === null ||
        m.issued_probability === null,
    )
  )
    return json(
      {
        error: "Round feed unavailable",
        missing: rows.filter((m) => !m.consistent || !m.game_id).map((m) => m.id),
      },
      503,
    );
  return json({
    tips: rows.map((m) => {
      const home = m.winner === "home",
        prob = m.issued_probability ?? 0.5,
        hmargin = Math.round(m.issued_margin ?? 0);
      return {
        gameid: m.game_id,
        tipteamid: home ? m.squiggle_home_id : m.squiggle_away_id,
        hteam: m.home_name,
        ateam: m.away_name,
        tip: home ? m.home_name : m.away_name,
        margin: Math.abs(hmargin),
        hmargin,
        confidence: Math.round((home ? prob : 1 - prob) * 100),
        hconfidence: Math.round(prob * 100),
        year,
        round,
      };
    }),
  });
}

/** Per-match operational diagnostics; historical misses belong to retained reports. */
export async function health(db: D1Database, now = new Date()) {
  const status = await db
    .prepare("SELECT * FROM tipper_status WHERE id=1")
    .first<{ activated_at: string; scheduler_at: string | null; reporting_at: string | null }>();
  if (!status)
    return { ok: false, publication: { error: "Not activated" }, inputs: {}, reporting: {} };
  const rows = (
    await db
      .prepare(`${STORED} WHERE c.code IN ('AFLM','AFLW') AND
    ((m.kickoff_at>=? AND julianday(m.kickoff_at)<=julianday(?,'+7 days') AND m.status IN ('Upcoming','Live'))
    OR (m.kickoff_at IS NULL AND m.date>=substr(?,1,10) AND m.date<=date(?,'+7 days') AND m.status='Upcoming'))`)
      .bind(status.activated_at, now.toISOString(), now.toISOString(), now.toISOString())
      .all<StoredTip>()
  ).results;
  const missing = rows.filter((m) => !m.consistent).map((m) => m.id);
  const stale = rows
    .filter(
      (m) =>
        m.kickoff_at &&
        m.kickoff_at > now.toISOString() &&
        m.generated_at &&
        now.getTime() - Date.parse(m.generated_at) >
          refreshInterval(m.kickoff_at, now) + 5 * 60_000,
    )
    .map((m) => m.id);
  const unknownKickoff = rows.filter((m) => !m.kickoff_at).map((m) => m.id);
  const heartbeat =
    !!status.scheduler_at && now.getTime() - Date.parse(status.scheduler_at) < 15 * 60_000;
  const missingMappings = rows
    .filter((m) => m.competition === "AFLM" && !m.game_id)
    .map((m) => m.id);
  const reporting = await latestReport(db, now.getUTCFullYear(), now);
  return {
    ok:
      heartbeat &&
      !missing.length &&
      !stale.length &&
      !unknownKickoff.length &&
      !missingMappings.length,
    publication: {
      heartbeat,
      schedulerAt: status.scheduler_at,
      expected: rows.length,
      missing,
      stale,
    },
    inputs: { unknownKickoff, missingMappings },
    reporting: {
      status: reporting.status,
      stale: reporting.stale,
      observedAt: reporting.observedAt,
    },
  };
}

/** Hash both secrets to fixed-size buffers before the platform timing-safe comparison. */
async function authenticated(request: Request, token: string | undefined): Promise<boolean> {
  const header = request.headers.get("Authorization");
  if (!token || !header?.startsWith("Bearer ")) return false;
  const encoder = new TextEncoder();
  const [expected, actual] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(token)),
    crypto.subtle.digest("SHA-256", encoder.encode(header.slice(7))),
  ]);
  return crypto.subtle.timingSafeEqual(expected, actual);
}
export async function tick(env: Env): Promise<void> {
  // First execution registers prospective coverage once, never on a health request.
  await env.DB.prepare(
    "INSERT OR IGNORE INTO tipper_status(id,activated_at) VALUES(1,strftime('%Y-%m-%dT%H:%M:%fZ','now'))",
  ).run();
  await env.DB.prepare(
    "UPDATE tipper_status SET scheduler_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=1",
  ).run();
  const rounds = await dueRounds(env.DB);
  for (const round of rounds) {
    try {
      await publishRound(env.DB, round);
    } catch (error) {
      console.error("Publication failed", { round, error: String(error) });
    }
  }
  // Retry identities independently of prediction freshness and retain old mappings on outages.
  const identities =
    await env.DB.prepare(`SELECT DISTINCT s.year AS season,m.round_number AS round FROM matches m
    JOIN seasons s ON s.id=m.season_id JOIN competitions c ON c.id=s.competition_id
    LEFT JOIN tipper_game_ids g ON g.match_id=m.id WHERE c.code='AFLM' AND g.match_id IS NULL
    AND m.kickoff_at>=(SELECT activated_at FROM tipper_status WHERE id=1)
    AND julianday(m.kickoff_at)<=julianday('now','+7 days') LIMIT 40`).all<{
      season: number;
      round: number;
    }>();
  for (const round of identities.results) {
    try {
      await resolveMappings(env.DB, { ...round, competition: "AFLM" });
    } catch (error) {
      console.warn("Mapping unavailable", String(error));
    }
  }
  await collectReport(env.DB, new Date().getUTCFullYear());
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      if (request.method === "OPTIONS")
        return new Response(null, { status: 204, headers: HEADERS });
      if (request.method === "GET" && url.pathname === "/tips") return await tips(request, env.DB);
      if (request.method === "GET" && url.pathname === "/health") {
        const result = await health(env.DB);
        return json(result, result.ok ? 200 : 503);
      }
      if (request.method === "GET" && url.pathname === "/performance") {
        const raw = url.searchParams.get("year") ?? String(new Date().getUTCFullYear());
        const year = yearSchema.safeParse(raw);
        if (!/^\d+$/.test(raw) || !year.success) return json({ error: "Invalid year" }, 400);
        return json(await latestReport(env.DB, year.data));
      }
      if (request.method === "POST" && url.pathname === "/admin/refresh") {
        if (!(await authenticated(request, env.ADMIN_TOKEN)))
          return json({ error: "Unauthorized" }, 401);
        if (Number(request.headers.get("Content-Length") ?? 0) > 1024)
          return json({ error: "Request too large" }, 413);
        const reader = request.body?.getReader();
        const decoder = new TextDecoder();
        let bytes = 0,
          body = "";
        if (reader)
          while (true) {
            const chunk = await reader.read();
            if (chunk.done) break;
            bytes += chunk.value.byteLength;
            if (bytes > 1024) {
              await reader.cancel();
              return json({ error: "Request too large" }, 413);
            }
            body += decoder.decode(chunk.value, { stream: true });
          }
        body += decoder.decode();
        let raw: unknown;
        try {
          raw = JSON.parse(body);
        } catch {
          return json({ error: "Invalid JSON" }, 400);
        }
        const parsed = RoundSchema.safeParse(raw);
        if (!parsed.success) return json({ error: "Invalid refresh parameters" }, 400);
        return json({ published: await publishRound(env.DB, parsed.data) });
      }
      return json({ error: "Not found" }, 404);
    } catch (error) {
      console.error("Request failed", String(error));
      return json(
        {
          error:
            error instanceof Error && error.message === "Unknown round"
              ? "Unknown round"
              : "Temporarily unavailable",
        },
        error instanceof Error && error.message === "Unknown round" ? 404 : 503,
      );
    }
  },
  async scheduled(_event: ScheduledController, env: Env): Promise<void> {
    await tick(env);
  },
} satisfies ExportedHandler<Env>;
