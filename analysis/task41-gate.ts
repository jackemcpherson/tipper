/** Task 41 read-only gate. Writes evidence only to a new local /tmp file. */
import { strict as assert } from "node:assert";
import { readFileSync, writeFileSync } from "node:fs";
import { createSeasonDataCache } from "../src/cli/cache.js";
import { getDatabase } from "../src/cli/db.js";
import { computeConfigHash, shortHash } from "../src/config/hash.js";
import { loadConfig } from "../src/config/store.js";
import { toPredictionRow } from "../src/data/publish.js";
import { runBacktest, runPrediction } from "../src/orchestration.js";

const config = loadConfig("predha-080");
const hash = shortHash(await computeConfigHash(config));
assert.equal(hash, "2641f46f");
const db = getDatabase();
const cache = createSeasonDataCache("AFLM");
const readOnlyCache = { get: cache.get, set: () => {} };
const result = await runBacktest(db, config, "AFLM", readOnlyCache);
assert.equal(result.overall.tips, 716);
assert.equal(Number(result.overall.log_loss_bits.toFixed(9)), 0.848459853);
const stored = JSON.parse(
  readFileSync("configs/predha-080/results-2026-09-05-2641f46f.json", "utf8"),
);
// Stored JSON omits undefined draw flags; compare the serialised row shape.
assert.deepEqual(JSON.parse(JSON.stringify(result.matches)), stored.matches);
console.log("baseline", hash, result.overall.tips, result.overall.log_loss_bits);

const published = await db
  .prepare(`
 SELECT p.*, m.round_number FROM match_predictions p
 JOIN matches m ON m.id = p.match_id JOIN seasons s ON s.id = m.season_id
 JOIN competitions c ON c.id = s.competition_id
 WHERE s.year = 2026 AND c.code = 'AFLM'
 ORDER BY m.round_number DESC, m.id
`)
  .all<{
    match_id: number;
    home_win_prob: number;
    predicted_margin: number;
    model_version: string;
    generated_at: string;
    round_number: number;
  }>();
const round = published.results[0]?.round_number;
assert.notEqual(round, undefined, "Need a published 2026 AFLM round for the live-path gate");
const live = await runPrediction(db, config, 2026, round as number, "AFLM", readOnlyCache);
const diffs = published.results
  .filter((row) => row.round_number === round)
  .map((row) => {
    const prediction = live.predictions.find((p) => p.matchId === row.match_id);
    assert.ok(prediction, `No prediction for published match ${row.match_id}`);
    const replay = toPredictionRow(prediction, row.model_version, row.generated_at);
    return {
      match_id: row.match_id,
      model_version: row.model_version,
      generated_at: row.generated_at,
      published_margin: row.predicted_margin,
      replay_margin: replay.predicted_margin,
      margin_delta: replay.predicted_margin - row.predicted_margin,
      probability_delta: replay.home_win_prob - row.home_win_prob,
    };
  });
const evidence = {
  captured_at: new Date().toISOString(),
  hash,
  overall: result.overall,
  stored_predictions_identical: true,
  round,
  diffs,
};
const path = `/tmp/tipper-task41-gate-${Date.now()}.json`;
writeFileSync(path, JSON.stringify(evidence, null, 2), { flag: "wx" });
console.log(JSON.stringify({ path, ...evidence }, null, 2));
