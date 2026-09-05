/** Retrospective scorer fixture only. These captures cannot establish deadline truth. */

import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { toSquiggleName } from "../src/comp.js";
import { computeConfigHash } from "../src/config/hash.js";
import { loadConfig } from "../src/config/store.js";
import { toPredictionRow } from "../src/data/publish.js";
import { TRIAL_RULES, TrialArchiveSchema } from "../src/trial/score.js";
import { loadResult } from "./task40-score.js";

const fieldPath = process.argv[2] ?? "/tmp/tipper-task40-squiggle-2026.json";
const output = process.argv[3] ?? "/tmp/tipper-trial-2026.json";
const field: {
  date: string;
  sourceid: number;
  source: string;
  gameid: number;
  hteam: string;
  ateam: string;
  tip: string;
  correct: number | null;
  hconfidence: string | number | null;
}[] = JSON.parse(readFileSync(fieldPath, "utf8")).tips;
const primary = await loadResult("t40-baseline-2026");
const shadow = await loadResult("t40-od-2026");
const first = new Map<number, string>();
for (const prediction of primary) {
  const previous = first.get(prediction.roundNumber);
  if (!previous || prediction.date < previous) first.set(prediction.roundNumber, prediction.date);
}
const rows = [];
for (const [predictions, id, version, isPrimary] of [
  [primary, "predha-080", TRIAL_RULES.primary, 1],
  [shadow, "t40-od", TRIAL_RULES.challenger, 0],
] as const) {
  const config = loadConfig(id);
  const hash = await computeConfigHash(config);
  for (const prediction of predictions) {
    const date = first.get(prediction.roundNumber)?.slice(0, 10);
    if (!date) throw new Error("Missing round start");
    const captured = new Date(`${date}T00:00:00Z`);
    captured.setUTCDate(captured.getUTCDate() - 1);
    const capturedAt = captured.toISOString();
    const published = toPredictionRow(prediction, version, capturedAt);
    const {
      actualMargin: _margin,
      actualWinner: _winner,
      correct: _correct,
      ...forecast
    } = prediction;
    const tips = field
      .filter(
        (tip) =>
          tip.date.slice(0, 10) === prediction.date.slice(0, 10) &&
          tip.hteam === toSquiggleName(prediction.home) &&
          tip.ateam === toSquiggleName(prediction.away) &&
          tip.hconfidence !== null &&
          [0, 1].includes(tip.correct ?? -1),
      )
      .map(({ sourceid, source, gameid, hteam, ateam, tip, hconfidence }) => ({
        sourceid,
        source,
        gameid,
        hteam,
        ateam,
        tip,
        hconfidence,
      }));
    rows.push({
      ...published,
      captured_at: capturedAt,
      competition: "AFLM",
      season_year: 2026,
      round_number: prediction.roundNumber,
      round_first_kickoff: `${date}T00:00:00`,
      match_kickoff: `${prediction.date.slice(0, 10)}T00:00:00`,
      is_primary: isPrimary,
      lineups_json: "[]",
      inputs_json: JSON.stringify({
        reconstructed: true,
        prediction: forecast,
        config_hash: hash,
        sigma: config.output.sigma,
        round_type: "Regular",
      }),
      field_json: JSON.stringify(tips),
      field_captured_at: capturedAt,
    });
  }
}
const archive = TrialArchiveSchema.parse({
  provenance: "reconstructed",
  rows,
  results: primary.map((prediction) => ({
    match_id: prediction.matchId,
    actual_margin: prediction.actualMargin,
    round_type: "Regular",
  })),
});
// Exclusive create prevents accidental replacement of any stored evidence.
const content = `${JSON.stringify(archive)}\n`;
writeFileSync(output, output.endsWith(".gz") ? gzipSync(content) : content, { flag: "wx" });
console.log(`Wrote ${rows.length} synthetic captures to ${output}; no historical lineups claimed.`);
