import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@effect/vitest";
import { Schema } from "effect";
import { Miniflare } from "miniflare";
import { row } from "../src/d1";
import { type Attempt, commit, prepare, publishDue, publishRound } from "../src/publication";
import { collectReport, latestReport } from "../src/report";
import { type FieldTip, type Game, resolveIdentities, type Squiggle } from "../src/squiggle";
import type { Round } from "../src/types";

let mf: Miniflare;
let db: D1Database;
const round: Round = { competition: "AFLM", seasonKey: "2026", round: 2 };
const instant = (offset: number): string => new Date(Date.now() + offset).toISOString();
const attempt = (): Promise<Attempt> => prepare(db, round);

/** A Squiggle double that serves fixed data, or fails every call when given an error. */
function squiggleServing(served: {
  readonly tips?: ReadonlyArray<FieldTip>;
  readonly games?: ReadonlyArray<Game>;
  readonly failure?: Error;
}): Squiggle & { readonly calls: () => number } {
  let calls = 0;

  const serve = async <T>(items: ReadonlyArray<T> | undefined): Promise<ReadonlyArray<T>> => {
    calls += 1;

    if (served.failure) throw served.failure;

    return items ?? [];
  };

  return {
    tips: () => serve(served.tips),
    games: () => serve(served.games),
    calls: () => calls,
  };
}

async function apply(sql: string): Promise<void> {
  const [regular = "", trigger] = sql.replace(/--[^\n]*/g, "").split("CREATE TRIGGER");

  for (const statement of regular.split(";").flatMap((part) => part.trim() || []))
    await db.prepare(statement).run();

  if (trigger) await db.prepare(`CREATE TRIGGER${trigger}`).run();
}

const CountsSchema = Schema.Struct({
  captures: Schema.Int,
  projections: Schema.Int,
  runs: Schema.Int,
});

async function counts(): Promise<typeof CountsSchema.Type | undefined> {
  return row(
    CountsSchema,
    db.prepare(
      "SELECT (SELECT COUNT(*) FROM tipper_predictions) AS captures,(SELECT COUNT(*) FROM match_predictions) AS projections,(SELECT COUNT(*) FROM tipper_runs WHERE published_at IS NOT NULL) AS runs",
    ),
  );
}

async function count(table: string): Promise<number | undefined> {
  const counted = await row(
    Schema.Struct({ n: Schema.Int }),
    db.prepare(`SELECT COUNT(*) AS n FROM ${table}`),
  );

  return counted?.n;
}

async function insertMatch(
  id: number,
  season: number,
  home: number,
  away: number,
  kickoff: string,
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO matches(id,season_id,round,round_number,round_type,date,home_team_id,away_team_id,status,kickoff_at) VALUES(?,?,'R2',2,'Regular',?,?,?,'Upcoming',?)",
    )
    .bind(id, season, kickoff.slice(0, 10), home, away, kickoff)
    .run();
}

async function insertWomensSeason(): Promise<void> {
  await db.batch([
    db.prepare("INSERT INTO seasons(id,competition_id,year,season_key) VALUES(2,2,2026,'2026')"),
    db.prepare(
      "INSERT INTO teams(id,name,competition_id) VALUES(5,'Alpha Women',2),(6,'Beta Women',2)",
    ),
  ]);
}

async function get(path: string): Promise<{ status: number; body: unknown }> {
  const response = await mf.dispatchFetch(`https://tipper.test${path}`);

  return { status: response.status, body: await response.json() };
}

async function refresh(body: Schema.Json, token: string): Promise<number> {
  const response = await mf.dispatchFetch("https://tipper.test/admin/refresh", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.status;
}

beforeAll(async () => {
  mf = new Miniflare({
    modules: true,
    scriptPath: "dist-worker/worker.js",
    compatibilityDate: "2026-07-01",
    d1Databases: { DB: "test" },
    bindings: { ADMIN_TOKEN: "test-token" },
    // The scheduler reads Squiggle; tests never reach the network.
    outboundService: () => Response.json({ games: [], tips: [] }),
  });
  db = await mf.getD1Database("DB");
  await apply(readFileSync("test/fixtures/shared-schema.sql", "utf8"));
  await apply(readFileSync("test/fixtures/0021_tipper_publication.sql", "utf8"));
  await db.prepare("ALTER TABLE tipper_runs ADD COLUMN season_key TEXT").run();
});

afterAll(async () => {
  await mf.dispose();
});

beforeEach(async () => {
  await db.batch(
    [
      "match_predictions",
      "tipper_predictions",
      "tipper_runs",
      "tipper_game_ids",
      "tipper_reports",
      "tipper_status",
      "match_lineups",
      "player_season_pav",
      "player_match_stats",
      "players",
      "matches",
      "teams",
      "seasons",
    ].map((table) => db.prepare(`DELETE FROM ${table}`)),
  );
  await db.batch([
    db.prepare("UPDATE public_input_revision SET revision=0,in_progress=0,write_started_at=NULL"),
    db.prepare("INSERT INTO seasons(id,competition_id,year,season_key) VALUES(1,1,2026,'2026')"),
    db.prepare(
      "INSERT INTO teams(id,name,competition_id) VALUES(1,'Alpha',1),(2,'Beta',1),(3,'Gamma',1),(4,'Delta',1)",
    ),
  ]);
  await insertMatch(1, 1, 1, 2, instant(3600_000 + 60_000));
  await insertMatch(2, 1, 3, 4, instant(3600_000 + 120_000));
});

describe("native D1 publication", () => {
  it("atomically publishes a whole mutable set", async () => {
    expect(await publishRound(db, round)).toBe(2);
    expect(await counts()).toEqual({ captures: 2, projections: 2, runs: 1 });
    expect(await publishDue(db)).toEqual([]);
  });

  for (const table of ["tipper_predictions", "match_predictions", "tipper_runs"])
    it(`rolls back ${table} failure`, async () => {
      const prepared = await attempt();

      await db
        .prepare(
          `CREATE TRIGGER fail_write BEFORE ${table === "tipper_runs" ? "UPDATE" : "INSERT"} ON ${table} BEGIN SELECT RAISE(ABORT,'injected'); END`,
        )
        .run();

      try {
        await expect(commit(db, prepared)).rejects.toThrow();
        expect(await counts()).toEqual({ captures: 0, projections: 0, runs: 0 });
      } finally {
        await db.prepare("DROP TRIGGER fail_write").run();
      }
    });

  it("rejects an older overlapping run after the newer one commits", async () => {
    const older = await attempt();
    const newer = await attempt();

    await commit(db, newer);
    await expect(commit(db, older)).rejects.toThrow();
    expect(await counts()).toEqual({ captures: 2, projections: 2, runs: 1 });
  });

  it("rejects partial output, extra fixtures, changed identity and crossed kickoff", async () => {
    const partial = await attempt();

    await expect(
      commit(db, { ...partial, predictions: partial.predictions.slice(0, 1) }),
    ).rejects.toThrow();

    const beforeIdentityChange = await attempt();

    await db.prepare("UPDATE matches SET venue_id=NULL,external_afl_id='changed' WHERE id=1").run();
    await expect(commit(db, beforeIdentityChange)).rejects.toThrow();

    const beforeKickoff = await attempt();

    await db.prepare("UPDATE matches SET kickoff_at=? WHERE id=1").bind(instant(-1000)).run();
    await expect(commit(db, beforeKickoff)).rejects.toThrow();
    expect(await counts()).toEqual({ captures: 0, projections: 0, runs: 0 });
  });

  it("rejects a newly added candidate and preserves previous committed tips on rejection", async () => {
    await publishRound(db, round);

    const prepared = await attempt();

    await insertMatch(3, 1, 1, 4, instant(3600_000));
    await expect(commit(db, prepared)).rejects.toThrow();
    expect(await counts()).toEqual({ captures: 2, projections: 2, runs: 1 });
  });

  it("rejects kickoff crossed during computation without any fixture mutation", async () => {
    await db.prepare("UPDATE matches SET kickoff_at=? WHERE id=1").bind(instant(750)).run();

    const prepared = await attempt();

    await new Promise((resolve) => setTimeout(resolve, 850));
    await expect(commit(db, prepared)).rejects.toThrow();
    expect(await counts()).toEqual({ captures: 0, projections: 0, runs: 0 });
  });

  it("keeps locked captures after late reschedules and refreshes later matches", async () => {
    // Simulate a committed capture whose original deadline has now passed.
    await publishRound(db, round);
    await db
      .prepare("UPDATE tipper_predictions SET kickoff_at=? WHERE match_id=1")
      .bind(instant(-1000))
      .run();
    await db.prepare("UPDATE matches SET kickoff_at=? WHERE id=1").bind(instant(7200_000)).run();

    expect(await publishRound(db, round)).toBe(1);
    expect((await attempt()).snapshot.candidates.map((fixture) => fixture.id)).toEqual([2]);
    expect(
      await db.prepare("SELECT COUNT(*) AS n FROM tipper_predictions WHERE match_id=1").first("n"),
    ).toBe(1);
  });

  it("resolves an ambiguous successful commit through its original run", async () => {
    const prepared = await attempt();

    const losingResponses: D1Database = {
      prepare: (query) => db.prepare(query),
      batch: async (statements) => {
        await db.batch(statements);

        throw new Error("response lost");
      },
      exec: (query) => db.exec(query),
      dump: () => db.dump(),
      withSession: (constraint) => db.withSession(constraint),
    };

    expect(await commit(losingResponses, prepared)).toBe(2);
    expect(await counts()).toEqual({ captures: 2, projections: 2, runs: 1 });
  });

  it("rejects active and stale repair markers and rolls back publication after input changes", async () => {
    for (const started of [instant(0), "2020-01-01T00:00:00Z"]) {
      await db
        .prepare("UPDATE public_input_revision SET in_progress=1,write_started_at=?")
        .bind(started)
        .run();
      await expect(attempt()).rejects.toThrow("being repaired");
    }

    await db.prepare("UPDATE public_input_revision SET in_progress=0,write_started_at=NULL").run();

    const prepared = await attempt();

    await db.prepare("UPDATE public_input_revision SET revision=revision+1").run();
    await expect(commit(db, prepared)).rejects.toThrow();
    expect(await counts()).toEqual({ captures: 0, projections: 0, runs: 0 });
  });

  it("loads only AFLW season seven PAV as the prior for 2023", async () => {
    await db.batch([
      db.prepare(
        "INSERT INTO seasons(id,competition_id,year,season_key) VALUES(2,2,2022,'2022-S6'),(3,2,2022,'2022-S7'),(4,2,2023,'2023')",
      ),
      db.prepare(
        "INSERT INTO teams(id,name,competition_id) VALUES(5,'Alpha Women',2),(6,'Beta Women',2)",
      ),
      db.prepare("INSERT INTO players(id,surname) VALUES(1,'Example')"),
      db.prepare(
        "INSERT INTO player_season_pav(player_id,season_id,team_id,off_pav,mid_pav,def_pav) VALUES(1,2,5,99,99,99),(1,3,5,7,7,7)",
      ),
    ]);
    await insertMatch(3, 4, 5, 6, instant(3600_000));

    const prepared = await prepare(db, { competition: "AFLW", seasonKey: "2023", round: 2 });

    expect(prepared.snapshot.priors).toEqual([
      { player_id: 1, team_id: 5, off_pav: 7, mid_pav: 7, def_pav: 7 },
    ]);
  });
});

describe("HTTP and scheduler", () => {
  it("serves recorded rounding, orientation and revisions without external fetch", async () => {
    await publishRound(db, round);
    expect((await get("/tips?year=2026&round=2")).status).toBe(503);

    for (const [match, home, away, homeName, awayName] of [
      [1, 1, 2, "Alpha", "Beta"],
      [2, 3, 4, "Gamma", "Delta"],
    ] as const)
      await db
        .prepare("INSERT INTO tipper_game_ids VALUES(?,?,2026,2,?,?,?,?,?,?,?)")
        .bind(match, 100 + match, home, away, 10 + home, 10 + away, homeName, awayName, instant(0))
        .run();

    const feed = await get("/tips?year=2026&round=2");

    expect(feed.status).toBe(200);
    expect(feed.body).toMatchObject({
      tips: [{ gameid: 101, tip: "Alpha", hmargin: 6, margin: 6 }, { gameid: 102 }],
    });
    expect((await get("/tips")).body).toEqual(feed.body);
    expect((await get("/tips?year=2026&round=44")).status).toBe(404);
    expect(await get("/tips?year=2026")).toMatchObject({
      status: 400,
      body: { error: "Provide valid year and round" },
    });
    expect(await get("/tips?year=2026&round=99")).toMatchObject({
      status: 400,
      body: { error: "Invalid year or round" },
    });
  });

  it("rejects bad authentication and parameter attempts to bypass locks", async () => {
    const request = { competition: "AFLM", season: 2026, round: 2 };

    expect(await refresh(request, "bad")).toBe(401);
    expect(await counts()).toEqual({ captures: 0, projections: 0, runs: 0 });
    expect(await refresh({ ...request, forceUnlock: true }, "test-token")).toBe(400);
    expect(await refresh({ ...request, padding: "x".repeat(1024) }, "test-token")).toBe(413);
    expect(await refresh({ ...request, round: 44 }, "test-token")).toBe(404);
    expect(await refresh(request, "test-token")).toBe(200);
    expect(await counts()).toEqual({ captures: 2, projections: 2, runs: 1 });
  });

  it("flags per-match gaps and corrupted capture links without treating AFLW as unmapped", async () => {
    await db
      .prepare("INSERT INTO tipper_status(id,activated_at,scheduler_at) VALUES(1,?,?)")
      .bind(instant(-60000), instant(0))
      .run();
    await insertWomensSeason();
    await insertMatch(3, 2, 5, 6, instant(3600_000));
    await publishRound(db, round);
    await publishRound(db, { ...round, competition: "AFLW" });

    expect((await get("/health")).body).toMatchObject({
      inputs: { missingMappings: [1, 2] },
      publication: { expected: 3, missing: [] },
    });

    await db
      .prepare("UPDATE match_predictions SET generated_at=? WHERE match_id=1")
      .bind(instant(60000))
      .run();

    expect((await get("/health")).body).toMatchObject({ publication: { missing: [1] } });
  });

  it("activates once, heartbeats and publishes every due round on the schedule", async () => {
    expect(await get("/health")).toMatchObject({
      status: 503,
      body: { publication: { error: "Not activated" } },
    });

    await insertWomensSeason();
    await insertMatch(3, 2, 5, 6, instant(3600_000));

    const worker = await mf.getWorker();

    await worker.scheduled({ cron: "*/5 * * * *" });

    const activated = await db.prepare("SELECT activated_at FROM tipper_status").first();

    expect(await counts()).toEqual({ captures: 3, projections: 3, runs: 2 });
    expect((await get("/health")).body).toMatchObject({
      publication: { heartbeat: true, expected: 3, missing: [], stale: [] },
    });

    await worker.scheduled({ cron: "*/5 * * * *" });

    // Fresh predictions are not republished, and activation is recorded only once.
    expect(await counts()).toEqual({ captures: 3, projections: 3, runs: 2 });
    expect(await db.prepare("SELECT activated_at FROM tipper_status").first()).toEqual(activated);
  });
});

describe("weekly report and Squiggle identities", () => {
  it("retains an empty first prospective report without inventing coverage or retrying it", async () => {
    await db.batch([
      db.prepare("INSERT INTO tipper_status(id,activated_at) VALUES(1,'2026-09-05T23:32:55.293Z')"),
      db.prepare(
        "UPDATE matches SET status='Complete',home_points=90,away_points=60,kickoff_at='2026-09-05T00:00:00.000Z' WHERE id=1",
      ),
      db.prepare("UPDATE matches SET kickoff_at='2026-09-11T00:00:00.000Z' WHERE id=2"),
    ]);

    const api = squiggleServing({});

    await collectReport(db, api, new Date("2026-09-07T22:05:00Z"));

    expect(await latestReport(db, 2026, new Date("2026-09-07T22:06:00Z"))).toMatchObject({
      status: "ok",
      stale: false,
      report: {
        coverage: { expected: 0, published: 0, missing: [], missingField: [] },
        accuracy: null,
        mae: null,
        logLoss: null,
        brier: null,
        marketGap: null,
        alert: false,
        comparisons: [],
        ranking: [],
        rankingMatchIds: [],
      },
    });
    expect(await counts()).toEqual({ captures: 0, projections: 0, runs: 0 });
    expect(await db.prepare("SELECT evidence FROM tipper_reports").first("evidence")).toBe(
      JSON.stringify({ matches: [], field: [] }),
    );

    await collectReport(db, api, new Date("2026-09-07T23:06:00Z"));
    expect(await count("tipper_reports")).toBe(1);
    expect(api.calls()).toBe(1);

    // A later expected match without a capture remains a missed tip.
    await db
      .prepare("UPDATE matches SET status='Complete',home_points=70,away_points=60 WHERE id=2")
      .run();
    await collectReport(db, api, new Date("2026-09-14T22:05:00Z"));

    expect(await latestReport(db, 2026, new Date("2026-09-14T22:06:00Z"))).toMatchObject({
      status: "partial",
      report: { coverage: { expected: 1, published: 0, missing: [2] } },
    });
  });

  it("retains observations before reporting a collection failure and preserves the previous report", async () => {
    await publishRound(db, round);
    await db.batch([
      db.prepare("INSERT INTO tipper_status(id,activated_at) VALUES(1,'2026-03-01T00:00:00.000Z')"),
      db.prepare(
        "UPDATE tipper_predictions SET kickoff_at='2026-08-22T00:00:00.000Z',published_at='2026-08-20T00:00:00.000Z'",
      ),
      db.prepare("UPDATE tipper_runs SET published_at='2026-08-20T00:00:00.000Z'"),
      db.prepare(
        "UPDATE matches SET status='Complete',home_points=90,away_points=60,kickoff_at='2026-08-22T00:00:00.000Z'",
      ),
    ]);
    await collectReport(db, squiggleServing({}), new Date("2026-08-24T22:05:00Z"));

    expect(await latestReport(db, 2026, new Date("2026-08-24T22:06:00Z"))).toMatchObject({
      status: "partial",
      report: { coverage: { expected: 2, published: 2 } },
    });

    await collectReport(
      db,
      squiggleServing({ failure: new Error("Squiggle outage") }),
      new Date("2026-08-24T23:06:00Z"),
    );

    expect(await latestReport(db, 2026, new Date("2026-08-24T23:07:00Z"))).toMatchObject({
      status: "failed",
      latestAttempt: { error: "Squiggle outage" },
      report: { coverage: { published: 2 } },
    });
    expect(
      await db
        .prepare(
          "SELECT json_array_length(evidence,'$.matches') AS n FROM tipper_reports WHERE status='failed'",
        )
        .first("n"),
    ).toBe(2);
  });

  it("retains known mappings on outages and invalidates a confirmed ambiguous pairing", async () => {
    const game: Game = {
      id: 101,
      hteam: "Alpha",
      ateam: "Beta",
      hteamid: 11,
      ateamid: 12,
      year: 2026,
      round: 2,
    };

    await resolveIdentities(db, squiggleServing({ games: [game] }), 2026, 2);
    await expect(
      resolveIdentities(db, squiggleServing({ failure: new Error("outage") }), 2026, 2),
    ).rejects.toThrow();
    expect(await count("tipper_game_ids")).toBe(1);

    await expect(
      resolveIdentities(db, squiggleServing({ games: [game, { ...game, id: 102 }] }), 2026, 2),
    ).rejects.toThrow("Ambiguous");
    expect(await count("tipper_game_ids")).toBe(0);
  });
});
