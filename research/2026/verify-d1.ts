import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { Miniflare } from "miniflare";
import { sha256 } from "./replay";

const root = new URL("./", import.meta.url);
const mf = new Miniflare({
  modules: true,
  script: "export default {fetch(){return new Response('test')}}",
  compatibilityDate: "2026-07-01",
  d1Databases: { DB: "reconstruction-test" },
});
try {
  const db = await mf.getD1Database("DB");
  await db.prepare("CREATE TABLE matches(id INTEGER PRIMARY KEY)").run();
  const migration = readFileSync(new URL("0022_tipper_reconstructions.sql", root), "utf8").replace(
    /--[^\n]*/g,
    "",
  );
  const [regular, ...triggers] = migration.split("CREATE TRIGGER");
  if (!regular) throw new Error("Missing migration");
  for (const statement of regular.split(";").filter((s) => s.trim()))
    await db.prepare(statement).run();
  for (const trigger of triggers) await db.prepare(`CREATE TRIGGER${trigger}`).run();
  const rows = JSON.parse(readFileSync(new URL("output.json", root), "utf8")) as {
    match_id: number;
  }[];
  await db.batch(rows.map((r) => db.prepare("INSERT INTO matches(id) VALUES(?)").bind(r.match_id)));
  const statements = readFileSync(new URL("import.sql", root), "utf8").split("\n").filter(Boolean);
  // A bad finalization must roll back all 244 inserts and the batch itself.
  const missing = statements.filter((_, index) => index !== 1);
  await assert.rejects(
    db.batch(missing.map((sql) => db.prepare(sql))),
    /incomplete reconstruction batch/,
  );
  assert.equal(await db.prepare("SELECT COUNT(*) AS n FROM tipper_reconstructions").first("n"), 0);
  assert.equal(
    await db.prepare("SELECT COUNT(*) AS n FROM tipper_reconstruction_batches").first("n"),
    0,
  );
  const result = await db.batch(statements.map((sql) => db.prepare(sql)));
  assert.equal(result.length, 246);
  const stored = await db
    .prepare(
      "SELECT match_id,competition,round_number,cutoff_at,kickoff_at,home_team_id,away_team_id,margin,home_probability,winner,issued_margin,issued_probability,provisional,evidence FROM tipper_reconstructions ORDER BY match_id",
    )
    .all();
  assert.deepEqual(stored.results, rows);
  const manifest = JSON.parse(readFileSync(new URL("manifest.json", root), "utf8"));
  assert.equal(sha256(JSON.stringify(stored.results)), manifest.output_sha256);
  assert.equal(
    await db
      .prepare(
        "SELECT COUNT(*) AS n FROM tipper_reconstruction_batches WHERE completed_at IS NOT NULL",
      )
      .first("n"),
    1,
  );
  console.log(
    JSON.stringify({
      rows: rows.length,
      statements: result.length,
      outputSha256: manifest.output_sha256,
      rollback: "verified",
      roundTrip: "exact",
    }),
  );
} finally {
  await mf.dispose();
}
