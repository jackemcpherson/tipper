import { Option, Schema } from "effect";
import {
  currentRound,
  expectedTips,
  publishDue,
  publishRound,
  readStatus,
  recordHeartbeat,
  refreshInterval,
  roundTips,
} from "./publication";
import { collectReport, latestReport } from "./report";
import { squiggle, syncIdentities } from "./squiggle";
import { RoundRequestSchema, UnknownRound } from "./types";

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Cache-Control": "no-store",
};

const MAX_REFRESH_BYTES = 1024;

const json = (body: Schema.Json, status = 200): Response =>
  Response.json(body, { status, headers: HEADERS });

const DIGITS = /^\d+$/;

const decodeYear = Schema.decodeUnknownOption(
  Schema.Int.check(Schema.isBetween({ minimum: 1900, maximum: 2100 })),
);

const decodeRoundNumber = Schema.decodeUnknownOption(
  Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 50 })),
);

const decodeJson = Schema.decodeUnknownOption(Schema.fromJsonString(Schema.Json));
const decodeRound = Schema.decodeUnknownOption(RoundRequestSchema, { onExcessProperty: "error" });

/** The Squiggle-compatible AFLM feed for one round, or for the current round by default. */
async function tips(url: URL, db: D1Database): Promise<Response> {
  const yearText = url.searchParams.get("year");
  const roundText = url.searchParams.get("round");
  let selected: { readonly year: number; readonly round: number } | undefined;

  if (yearText !== null || roundText !== null) {
    if (
      yearText === null ||
      roundText === null ||
      !DIGITS.test(yearText) ||
      !DIGITS.test(roundText)
    )
      return json({ error: "Provide valid year and round" }, 400);

    const year = Option.getOrUndefined(decodeYear(Number(yearText)));
    const round = Option.getOrUndefined(decodeRoundNumber(Number(roundText)));

    if (year === undefined || round === undefined)
      return json({ error: "Invalid year or round" }, 400);

    selected = { year, round };
  } else {
    selected = await currentRound(db);

    if (!selected) return json({ error: "No published round" }, 404);
  }

  const { year, round } = selected;
  const stored = await roundTips(db, year, round);

  if (!stored.length) return json({ error: "Unknown round" }, 404);

  // Serve the whole round or nothing: every match needs a consistent tip and a Squiggle identity.
  const feed = stored.flatMap((tip) => {
    if (
      !tip.consistent ||
      !tip.game_id ||
      !tip.home_name ||
      !tip.away_name ||
      !tip.winner ||
      tip.issued_margin === null ||
      tip.issued_probability === null
    )
      return [];

    const isHome = tip.winner === "home";
    const hmargin = Math.round(tip.issued_margin);

    return [
      {
        gameid: tip.game_id,
        tipteamid: isHome ? tip.squiggle_home_id : tip.squiggle_away_id,
        hteam: tip.home_name,
        ateam: tip.away_name,
        tip: isHome ? tip.home_name : tip.away_name,
        margin: Math.abs(hmargin),
        hmargin,
        confidence: Math.round(
          (isHome ? tip.issued_probability : 1 - tip.issued_probability) * 100,
        ),
        hconfidence: Math.round(tip.issued_probability * 100),
        year,
        round,
      },
    ];
  });

  if (feed.length !== stored.length)
    return json(
      {
        error: "Round feed unavailable",
        missing: stored.filter((tip) => !tip.consistent || !tip.game_id).map((tip) => tip.id),
      },
      503,
    );

  return json({ tips: feed });
}

/** Per-match operational diagnostics. Historical misses belong to retained reports. */
async function health(db: D1Database, now: Date): Promise<Response> {
  const status = await readStatus(db);

  if (!status)
    return json(
      { ok: false, publication: { error: "Not activated" }, inputs: {}, reporting: {} },
      503,
    );

  const expected = await expectedTips(db, status.activated_at, now);
  const ids = (tips: typeof expected): ReadonlyArray<number> => tips.map((tip) => tip.id);
  const missing = ids(expected.filter((tip) => !tip.consistent));

  const stale = ids(
    expected.filter(
      (tip) =>
        tip.kickoff_at &&
        tip.kickoff_at > now.toISOString() &&
        tip.generated_at &&
        now.getTime() - Date.parse(tip.generated_at) >
          refreshInterval(tip.kickoff_at, now) + 5 * 60_000,
    ),
  );

  const unknownKickoff = ids(expected.filter((tip) => !tip.kickoff_at));
  const missingMappings = ids(expected.filter((tip) => tip.competition === "AFLM" && !tip.game_id));

  const hasHeartbeat =
    !!status.scheduler_at && now.getTime() - Date.parse(status.scheduler_at) < 15 * 60_000;

  const reporting = await latestReport(db, now.getUTCFullYear(), now);

  const isHealthy =
    hasHeartbeat &&
    !missing.length &&
    !stale.length &&
    !unknownKickoff.length &&
    !missingMappings.length;

  return json(
    {
      ok: isHealthy,
      publication: {
        heartbeat: hasHeartbeat,
        schedulerAt: status.scheduler_at,
        expected: expected.length,
        missing,
        stale,
      },
      inputs: { unknownKickoff, missingMappings },
      reporting: {
        status: reporting.status,
        stale: reporting.stale,
        observedAt: reporting.observedAt,
      },
    },
    isHealthy ? 200 : 503,
  );
}

/** Hash both secrets to fixed-size buffers before the platform timing-safe comparison. */
async function isAuthenticated(request: Request, token: string | undefined): Promise<boolean> {
  const header = request.headers.get("Authorization");

  if (!token || !header?.startsWith("Bearer ")) return false;

  const encoder = new TextEncoder();

  const [expected, actual] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(token)),
    crypto.subtle.digest("SHA-256", encoder.encode(header.slice(7))),
  ]);

  return crypto.subtle.timingSafeEqual(expected, actual);
}

/** Publish one round on demand, through the same publisher and locks as the scheduler. */
async function refresh(request: Request, env: Env): Promise<Response> {
  if (!(await isAuthenticated(request, env.ADMIN_TOKEN)))
    return json({ error: "Unauthorized" }, 401);

  const body = await request.arrayBuffer();

  if (body.byteLength > MAX_REFRESH_BYTES) return json({ error: "Request too large" }, 413);

  const parsed = decodeJson(new TextDecoder().decode(body));

  if (Option.isNone(parsed)) return json({ error: "Invalid JSON" }, 400);

  const round = decodeRound(parsed.value);

  if (Option.isNone(round)) return json({ error: "Invalid refresh parameters" }, 400);

  return json({ published: await publishRound(env.DB, round.value) });
}

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const now = new Date();

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: HEADERS });

  if (request.method === "GET" && url.pathname === "/tips") return tips(url, env.DB);

  if (request.method === "GET" && url.pathname === "/health") return health(env.DB, now);

  if (request.method === "GET" && url.pathname === "/performance") {
    const yearText = url.searchParams.get("year") ?? String(now.getUTCFullYear());

    const year = DIGITS.test(yearText)
      ? Option.getOrUndefined(decodeYear(Number(yearText)))
      : undefined;

    if (year === undefined) return json({ error: "Invalid year" }, 400);

    return json({ ...(await latestReport(env.DB, year, now)) });
  }

  if (request.method === "POST" && url.pathname === "/admin/refresh") return refresh(request, env);

  return json({ error: "Not found" }, 404);
}

export default {
  async fetch(request, env): Promise<Response> {
    try {
      return await route(request, env);
    } catch (error) {
      console.error("Request failed", String(error));

      return error instanceof UnknownRound
        ? json({ error: "Unknown round" }, 404)
        : json({ error: "Temporarily unavailable" }, 503);
    }
  },

  /** Every five minutes: heartbeat, publish what is due, resolve identities, collect the report. */
  async scheduled(_controller, env): Promise<void> {
    await recordHeartbeat(env.DB);
    await publishDue(env.DB);
    await syncIdentities(env.DB, squiggle);
    await collectReport(env.DB, squiggle, new Date());
  },
} satisfies ExportedHandler<Env>;
