import { readFileSync } from "node:fs";
import { Miniflare } from "miniflare";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { collectReport, latestReport } from "../src/evidence.js";
import { predict } from "../src/prediction.js";
import { beginRun, commitRun, dueRounds, publishRound, readSnapshot } from "../src/publication.js";
import { resolveMappings } from "../src/squiggle.js";

let mf: Miniflare;
let db: D1Database;
const round = { competition: "AFLM", season: 2026, round: 2 } as const;
const instant = (offset: number) => new Date(Date.now() + offset).toISOString();
async function apply(sql: string) {
  const stripped = sql.replace(/--[^\n]*/g, "");
  const [regular, trigger] = stripped.split("CREATE TRIGGER");
  for (const statement of regular
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean))
    await db.prepare(statement).run();
  if (trigger) await db.prepare(`CREATE TRIGGER${trigger}`).run();
}
async function attempt() {
  const id = await beginRun(db, round);
  const s = await readSnapshot(db, round);
  return { id, s, p: predict(s) };
}
async function counts() {
  return db
    .prepare(
      "SELECT (SELECT COUNT(*) FROM tipper_predictions) AS captures,(SELECT COUNT(*) FROM match_predictions) AS projections,(SELECT COUNT(*) FROM tipper_runs WHERE published_at IS NOT NULL) AS runs",
    )
    .first();
}
beforeAll(async () => {
  mf = new Miniflare({
    modules: true,
    scriptPath: "dist-worker/index.js",
    compatibilityDate: "2026-07-01",
    d1Databases: { DB: "test" },
    bindings: { ADMIN_TOKEN: "test-token" },
  });
  db = await mf.getD1Database("DB");
  await apply(readFileSync("tests/fixtures/shared-schema.sql", "utf8"));
  await apply(readFileSync("tests/fixtures/0021_tipper_publication.sql", "utf8"));
});
afterAll(async () => {
  await mf?.dispose();
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
      "matches",
      "teams",
      "seasons",
    ].map((t) => db.prepare(`DELETE FROM ${t}`)),
  );
  await db.prepare("INSERT INTO seasons(id,competition_id,year) VALUES(1,1,2026)").run();
  await db
    .prepare(
      "INSERT INTO teams(id,name,competition_id) VALUES(1,'Alpha',1),(2,'Beta',1),(3,'Gamma',1),(4,'Delta',1)",
    )
    .run();
  for (const [id, h, a] of [
    [1, 1, 2],
    [2, 3, 4],
  ])
    await db
      .prepare(
        "INSERT INTO matches(id,season_id,round,round_number,round_type,date,home_team_id,away_team_id,status,kickoff_at) VALUES(?,1,'R2',2,'Regular',?,?,?,?,?)",
      )
      .bind(id, instant(3600_000).slice(0, 10), h, a, "Upcoming", instant(3600_000 + id * 60_000))
      .run();
});
describe("native D1 publication", () => {
  it("atomically publishes a whole mutable set", async () => {
    expect(await publishRound(db, round)).toBe(2);
    expect(await counts()).toEqual({ captures: 2, projections: 2, runs: 1 });
    expect(await dueRounds(db)).toEqual([]);
  });
  for (const table of ["tipper_predictions", "match_predictions", "tipper_runs"])
    it(`rolls back ${table} failure`, async () => {
      const a = await attempt();
      await db
        .prepare(
          `CREATE TRIGGER fail_write BEFORE ${table === "tipper_runs" ? "UPDATE" : "INSERT"} ON ${table} BEGIN SELECT RAISE(ABORT,'injected'); END`,
        )
        .run();
      try {
        await expect(commitRun(db, a.id, round, a.s.observedAt, a.p)).rejects.toThrow();
        expect(await counts()).toEqual({ captures: 0, projections: 0, runs: 0 });
      } finally {
        await db.prepare("DROP TRIGGER fail_write").run();
      }
    });
  it("rejects an older overlapping run after the newer one commits", async () => {
    const a = await attempt(),
      b = await attempt();
    await commitRun(db, b.id, round, b.s.observedAt, b.p);
    await expect(commitRun(db, a.id, round, a.s.observedAt, a.p)).rejects.toThrow();
    expect(await counts()).toEqual({ captures: 2, projections: 2, runs: 1 });
  });
  it("rejects partial output, extra fixtures, changed identity and crossed kickoff", async () => {
    let a = await attempt();
    await expect(commitRun(db, a.id, round, a.s.observedAt, a.p.slice(0, 1))).rejects.toThrow();
    a = await attempt();
    await db.prepare("UPDATE matches SET venue_id=NULL,external_afl_id='changed' WHERE id=1").run();
    await expect(commitRun(db, a.id, round, a.s.observedAt, a.p)).rejects.toThrow();
    a = await attempt();
    await db.prepare("UPDATE matches SET kickoff_at=? WHERE id=1").bind(instant(-1000)).run();
    await expect(commitRun(db, a.id, round, a.s.observedAt, a.p)).rejects.toThrow();
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
    expect((await readSnapshot(db, round)).candidates.map((m) => m.id)).toEqual([2]);
    expect(
      await db.prepare("SELECT COUNT(*) AS n FROM tipper_predictions WHERE match_id=1").first(),
    ).toEqual({ n: 1 });
  });
  it("serves recorded rounding, orientation and revisions without external fetch", async () => {
    await publishRound(db, round);
    expect((await mf.dispatchFetch("https://tipper.test/tips?year=2026&round=2")).status).toBe(503);
    for (const [match, home, away] of [
      [1, 1, 2],
      [2, 3, 4],
    ])
      await db
        .prepare("INSERT INTO tipper_game_ids VALUES(?,?,2026,2,?,?,?,?,?,?,?)")
        .bind(
          match,
          100 + match,
          home,
          away,
          10 + home,
          10 + away,
          home === 1 ? "Alpha" : "Gamma",
          away === 2 ? "Beta" : "Delta",
          instant(0),
        )
        .run();
    const response = await mf.dispatchFetch("https://tipper.test/tips?year=2026&round=2");
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.tips[0]).toMatchObject({ gameid: 101, tip: "Alpha", hmargin: 6, margin: 6 });
    expect((await mf.dispatchFetch("https://tipper.test/tips?year=2026&round=44")).status).toBe(
      404,
    );
    expect((await mf.dispatchFetch("https://tipper.test/tips?year=2026")).status).toBe(400);
  });
  it("rejects bad authentication and parameter attempts to bypass locks", async () => {
    const url = "https://tipper.test/admin/refresh";
    const bad = await mf.dispatchFetch(url, {
      method: "POST",
      body: JSON.stringify(round),
      headers: { Authorization: "Bearer bad" },
    });
    expect(bad.status).toBe(401);
    expect(await counts()).toEqual({ captures: 0, projections: 0, runs: 0 });
    const extra = await mf.dispatchFetch(url, {
      method: "POST",
      body: JSON.stringify({ ...round, forceUnlock: true }),
      headers: { Authorization: "Bearer test-token" },
    });
    expect(extra.status).toBe(400);
    const good = await mf.dispatchFetch(url, {
      method: "POST",
      body: JSON.stringify(round),
      headers: { Authorization: "Bearer test-token" },
    });
    expect(good.status).toBe(200);
  });
});

describe("publication evidence and scheduler edges", () => {
  it("rejects a newly added candidate and preserves previous committed tips on rejection", async () => {
    await publishRound(db, round);
    const a = await attempt();
    await db
      .prepare(
        "INSERT INTO matches(id,season_id,round,round_number,round_type,date,home_team_id,away_team_id,status,kickoff_at) VALUES(3,1,'R2',2,'Regular',?,1,4,'Upcoming',?)",
      )
      .bind(instant(3600_000).slice(0, 10), instant(3600_000))
      .run();
    await expect(commitRun(db, a.id, round, a.s.observedAt, a.p)).rejects.toThrow();
    expect(await counts()).toEqual({ captures: 2, projections: 2, runs: 1 });
  });
  it("rejects kickoff crossed during computation without any fixture mutation", async () => {
    await db.prepare("UPDATE matches SET kickoff_at=? WHERE id=1").bind(instant(750)).run();
    const a = await attempt();
    await new Promise((resolve) => setTimeout(resolve, 850));
    await expect(commitRun(db, a.id, round, a.s.observedAt, a.p)).rejects.toThrow();
    expect(await counts()).toEqual({ captures: 0, projections: 0, runs: 0 });
  });
  it("resolves an ambiguous successful commit through its original run", async () => {
    const a = await attempt();
    const transport = new Proxy(db, {
      get(target, key) {
        if (key === "batch")
          return async (statements: D1PreparedStatement[]) => {
            await target.batch(statements);
            throw new Error("response lost");
          };
        const value = Reflect.get(target, key);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
    expect(await commitRun(transport, a.id, round, a.s.observedAt, a.p)).toBe(2);
    expect(await counts()).toEqual({ captures: 2, projections: 2, runs: 1 });
  });
  it("retains an empty first prospective report without inventing coverage or retrying it", async () => {
    await db
      .prepare("INSERT INTO tipper_status(id,activated_at) VALUES(1,'2026-09-05T23:32:55.293Z')")
      .run();
    await db
      .prepare(
        "UPDATE matches SET status='Complete',home_points=90,away_points=60,kickoff_at='2026-09-05T00:00:00.000Z' WHERE id=1",
      )
      .run();
    await db.prepare("UPDATE matches SET kickoff_at='2026-09-11T00:00:00.000Z' WHERE id=2").run();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => Response.json({ tips: [] }));
    try {
      await collectReport(db, 2026, new Date("2026-09-07T22:05:00Z"));
      const report = await latestReport(db, 2026, new Date("2026-09-07T22:06:00Z"));
      expect(report.status).toBe("ok");
      expect(report.stale).toBe(false);
      expect(report.report).toMatchObject({
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
      });
      expect(await counts()).toEqual({ captures: 0, projections: 0, runs: 0 });
      const saved = await db
        .prepare("SELECT evidence FROM tipper_reports")
        .first<{ evidence: string }>();
      expect(JSON.parse(saved?.evidence ?? "{}")).toEqual({ matches: [], field: [] });
      await collectReport(db, 2026, new Date("2026-09-07T23:06:00Z"));
      expect(await db.prepare("SELECT COUNT(*) AS n FROM tipper_reports").first()).toEqual({
        n: 1,
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // A later expected match without a capture remains a missed tip.
      await db
        .prepare("UPDATE matches SET status='Complete',home_points=70,away_points=60 WHERE id=2")
        .run();
      await collectReport(db, 2026, new Date("2026-09-14T22:05:00Z"));
      const missing = await latestReport(db, 2026, new Date("2026-09-14T22:06:00Z"));
      expect(missing.status).toBe("partial");
      expect(missing.report.coverage).toMatchObject({ expected: 1, published: 0, missing: [2] });
    } finally {
      fetchMock.mockRestore();
    }
  });
  it("retains observations before reporting a collection failure and preserves the previous report", async () => {
    await publishRound(db, round);
    await db
      .prepare("INSERT INTO tipper_status(id,activated_at) VALUES(1,'2026-03-01T00:00:00.000Z')")
      .run();
    await db
      .prepare(
        "UPDATE tipper_predictions SET kickoff_at='2026-08-22T00:00:00.000Z',published_at='2026-08-20T00:00:00.000Z'",
      )
      .run();
    await db.prepare("UPDATE tipper_runs SET published_at='2026-08-20T00:00:00.000Z'").run();
    await db
      .prepare(
        "UPDATE matches SET status='Complete',home_points=90,away_points=60,kickoff_at='2026-08-22T00:00:00.000Z'",
      )
      .run();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ tips: [] }));
    try {
      await collectReport(db, 2026, new Date("2026-08-24T22:05:00Z"));
      let report = await latestReport(db, 2026, new Date("2026-08-24T22:06:00Z"));
      expect(report.status).toBe("partial");
      expect(report.report.coverage).toMatchObject({ expected: 2, published: 2 });
      fetchMock.mockRejectedValue(new Error("Squiggle outage"));
      await collectReport(db, 2026, new Date("2026-08-24T23:06:00Z"));
      report = await latestReport(db, 2026, new Date("2026-08-24T23:07:00Z"));
      expect(report.status).toBe("failed");
      expect(report.report.coverage.published).toBe(2);
      const failure = await db
        .prepare("SELECT evidence FROM tipper_reports WHERE status='failed'")
        .first<{ evidence: string }>();
      expect(JSON.parse(failure?.evidence ?? "{}").matches).toHaveLength(2);
    } finally {
      fetchMock.mockRestore();
    }
  });
  it("retains known mappings on outages and invalidates a confirmed ambiguous pairing", async () => {
    const good = {
      id: 101,
      hteam: "Alpha",
      ateam: "Beta",
      hteamid: 11,
      ateamid: 12,
      year: 2026,
      round: 2,
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ games: [good] }));
    try {
      await resolveMappings(db, round);
      fetchMock.mockRejectedValue(new Error("outage"));
      await expect(resolveMappings(db, round)).rejects.toThrow();
      expect(await db.prepare("SELECT COUNT(*) AS n FROM tipper_game_ids").first()).toEqual({
        n: 1,
      });
      fetchMock.mockResolvedValue(Response.json({ games: [good, { ...good, id: 102 }] }));
      await expect(resolveMappings(db, round)).rejects.toThrow("Ambiguous");
      expect(await db.prepare("SELECT COUNT(*) AS n FROM tipper_game_ids").first()).toEqual({
        n: 0,
      });
    } finally {
      fetchMock.mockRestore();
    }
  });
});

it("flags per-match gaps and corrupted capture links without treating AFLW as unmapped", async () => {
  await db
    .prepare("INSERT INTO tipper_status(id,activated_at,scheduler_at) VALUES(1,?,?)")
    .bind(instant(-60000), instant(0))
    .run();
  await db.prepare("INSERT INTO seasons(id,competition_id,year) VALUES(2,2,2026)").run();
  await db
    .prepare(
      "INSERT INTO teams(id,name,competition_id) VALUES(5,'Alpha Women',2),(6,'Beta Women',2)",
    )
    .run();
  await db
    .prepare(
      "INSERT INTO matches(id,season_id,round,round_number,round_type,date,home_team_id,away_team_id,status,kickoff_at) VALUES(3,2,'R2',2,'Regular',?,5,6,'Upcoming',?)",
    )
    .bind(instant(3600_000).slice(0, 10), instant(3600_000))
    .run();
  await publishRound(db, round);
  await publishRound(db, { ...round, competition: "AFLW" });
  const response = await mf.dispatchFetch("https://tipper.test/health");
  const result = await response.json();
  expect(result.inputs.missingMappings).toEqual([1, 2]);
  expect(result.publication.missing).toEqual([]);
  await db
    .prepare("UPDATE match_predictions SET generated_at=? WHERE match_id=1")
    .bind(instant(60000))
    .run();
  const corrupted = await (await mf.dispatchFetch("https://tipper.test/health")).json();
  expect(corrupted.publication.missing).toContain(1);
});
