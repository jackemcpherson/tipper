/** Reproduce historical records and quantify correctness findings before experiments. */
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { computeConfigHash } from "../src/config/hash.js";
import { ConfigSchema } from "../src/config/schema.js";
import { runHarness, runPredict } from "../src/engine/harness.js";
import { computeMetrics } from "../src/engine/metrics.js";
import { applyOdRegression, createOdState, updateOd } from "../src/engine/odelo.js";
import { computePlayerPav, createPavSeasonState, updatePavState } from "../src/engine/pav.js";
import { computeWinProbability } from "../src/engine/predict.js";
import type { MatchPrediction } from "../src/types.js";
import { loadSnapshot, seasonIds, selectData } from "./task40-data.js";

const data = loadSnapshot();
const config = ConfigSchema.parse(
  JSON.parse(readFileSync("configs/predha-080/config.json", "utf8")),
);
const outputs: Record<string, unknown> = {};
const predictions = new Map<string, MatchPrediction[]>();
for (const [id, hash] of [
  ["predha-080", "2641f46f"],
  ["predha80-early", "909461e1"],
  ["v4-shotoff", "7af312c5"],
  ["od-w100-k008", "c8c7b6b7"],
] as const) {
  const cfg = ConfigSchema.parse(JSON.parse(readFileSync(`configs/${id}/config.json`, "utf8")));
  assert.equal((await computeConfigHash(cfg)).slice(0, 8), hash);
  const selected = selectData(data, cfg);
  const result = runHarness(
    selected,
    cfg,
    seasonIds(data, cfg.backtest.train_seasons),
    seasonIds(data, cfg.backtest.test_seasons),
  );
  const stored = JSON.parse(readFileSync(`configs/${id}/results-2026-09-05-${hash}.json`, "utf8"));
  // JSON removes undefined optional fields, exactly as the result writer does.
  assert.deepEqual(JSON.parse(JSON.stringify(result.predictions)), stored.matches);
  const metrics = computeMetrics(result.predictions);
  assert.equal(metrics.logLossBits, stored.overall.log_loss_bits);
  assert.equal(metrics.tips, stored.overall.tips);
  outputs[id] = { hash, exactRecords: true, metrics };
  predictions.set(id, result.predictions);
}

const primary = predictions.get("predha-080");
assert(primary);
// Numerical integration independent of the erf polynomial being audited.
function referenceCdf(x: number): number {
  const steps = 10000;
  const h = Math.abs(x) / steps;
  let integral = 0;
  for (let i = 0; i <= steps; i++) {
    const weight = i === 0 || i === steps ? 1 : i % 2 === 0 ? 2 : 4;
    integral += (weight * Math.exp(-((i * h) ** 2) / 2)) / Math.sqrt(2 * Math.PI);
  }
  return 0.5 + (Math.sign(x) * integral * h) / 3;
}
outputs.cdf = [0, 0.25, 0.5, 1, 2].map((z) => ({
  z,
  legacy: computeWinProbability(z, 1).home,
  standardNormal: referenceCdf(z),
}));
outputs.draws = Object.fromEntries(
  [...predictions].map(([id, rows]) => {
    const draws = rows.filter((row) => row.actualMargin === 0);
    const alternative = (target: number) =>
      rows.reduce((sum, row) => {
        const p = row.winProbability.home;
        return (
          sum +
          (row.actualMargin === 0
            ? -target * Math.log2(p) - (1 - target) * Math.log2(1 - p)
            : -Math.log2((row.actualMargin ?? 0) > 0 ? p : 1 - p))
        );
      }, 0) / rows.length;
    return [
      id,
      {
        n: draws.length,
        legacy: alternative(0),
        halfTarget: alternative(0.5),
        homeTarget: alternative(1),
        excluding: computeMetrics(rows.filter((p) => p.actualMargin !== 0)),
      },
    ];
  }),
);

const odConfig = ConfigSchema.parse(
  JSON.parse(readFileSync("configs/od-w100-k008/config.json", "utf8")),
).elo.od;
assert(odConfig);
const od = createOdState();
const scalar = new Map<number, number>();
let season = -1;
let maxError = 0;
for (const match of data.matches) {
  if (match.season_id !== season) {
    applyOdRegression(od, odConfig.regression_to_mean);
    for (const [team, value] of scalar) scalar.set(team, value * (1 - odConfig.regression_to_mean));
    season = match.season_id;
  }
  if (match.home_points === null || match.away_points === null) continue;
  const h = scalar.get(match.home_team_id) ?? 0;
  const a = scalar.get(match.away_team_id) ?? 0;
  const gain =
    (odConfig.k / 2) *
    (match.home_points - match.away_points - (h - a + odConfig.home_advantage_points));
  scalar.set(match.home_team_id, h + gain);
  scalar.set(match.away_team_id, a - gain);
  updateOd(od, match, odConfig);
  for (const team of [match.home_team_id, match.away_team_id]) {
    const implied = ((od.attack.get(team) ?? 0) - (od.concede.get(team) ?? 0)) / 2;
    maxError = Math.max(maxError, Math.abs(implied - (scalar.get(team) ?? 0)));
  }
}
assert(maxError < 1e-10);
outputs.odScalarIdentity = { matches: data.matches.length, maxAbsoluteRatingError: maxError };

outputs.coverage = [...data.seasonYearById].map(([id, year]) => {
  const matches = data.matches.filter((m) => m.season_id === id && m.home_points !== null);
  const lineups = matches.flatMap((m) => data.lineupsByMatch.get(m.id) ?? []);
  return {
    year,
    n: matches.length,
    missingTime: matches.filter((m) => !m.local_time).length,
    missingLineup: matches.filter((m) => !data.lineupsByMatch.get(m.id)?.length).length,
    benchUnflagged: lineups.filter(
      (p) => ["INT", "SUB"].includes(p.position ?? "") && !p.is_substitute,
    ).length,
    startersFlagged: lineups.filter(
      (p) => !["INT", "SUB", "EMERG"].includes(p.position ?? "") && p.is_substitute,
    ).length,
  };
});

outputs.pavUnits = [2015, 2019, 2020, 2025].map((year) => {
  const id = [...seasonIds(data, [year])][0];
  assert(id !== undefined);
  const matches = data.matches.filter((m) => m.season_id === id);
  const teams = new Set(matches.flatMap((m) => [m.home_team_id, m.away_team_id]));
  const state = createPavSeasonState(teams.size);
  for (const m of matches) updatePavState(state, m, data.statsByMatch.get(m.id) ?? []);
  const rows = data.priorPavBySeason.get(id) ?? [];
  const totals = { upstream: [0, 0, 0], engine: [0, 0, 0], absoluteError: 0 };
  for (const row of rows) {
    const p = computePlayerPav(state, row.player_id, row.team_id);
    [row.off_pav ?? 0, row.mid_pav ?? 0, row.def_pav ?? 0].forEach((v, i) => {
      totals.upstream[i] = (totals.upstream[i] ?? 0) + v;
    });
    [p.offPav, p.midPav, p.defPav].forEach((v, i) => {
      totals.engine[i] = (totals.engine[i] ?? 0) + v;
    });
    totals.absoluteError += Math.abs(p.totalPav - (row.total_pav ?? 0));
  }
  return {
    year,
    players: rows.length,
    ...totals,
    meanAbsPlayerError: totals.absoluteError / rows.length,
  };
});

outputs.calibrateTrainOnly = [2015, 2019, 2020, 2025].map((year) => {
  const cfg = {
    ...config,
    backtest: { ...config.backtest, train_seasons: [year], test_seasons: [year] },
  };
  const selected = selectData(data, cfg);
  const rows = runHarness(selected, cfg, new Set(), seasonIds(data, [year])).predictions;
  const cross = rows.reduce(
    (s, p) => s + (p.homePavTotal - p.awayPavTotal) * (p.actualMargin ?? 0),
    0,
  );
  const sq = rows.reduce((s, p) => s + (p.homePavTotal - p.awayPavTotal) ** 2, 0);
  return {
    year,
    n: rows.length,
    recommendedSlope: cross / sq / config.output.margin_per_rating_point,
  };
});

const selected = selectData(data, config);
const liveData = {
  ...selected,
  priorPavBySeason: new Map(
    [...selected.priorPavBySeason].filter(([id]) => data.seasonYearById.get(id) === 2024),
  ),
};
const yearId = [...seasonIds(data, [2025])][0];
assert(yearId !== undefined);
const live = runPredict(liveData, config, 10, yearId).predictions;
const backById = new Map(primary.map((p) => [p.matchId, p]));
outputs.liveBacktest = live.map((p) => ({
  matchId: p.matchId,
  marginDifference: p.predictedMargin - (backById.get(p.matchId)?.predictedMargin ?? NaN),
}));

if (!process.argv.includes("--verify-only")) {
  writeFileSync("analysis/task40-audit-results.json", `${JSON.stringify(outputs, null, 2)}\n`, {
    flag: "wx",
  });
}
console.log(
  JSON.stringify(
    process.argv.includes("--verify-only")
      ? { historicalRecords: "four exact replicas", liveBacktest: outputs.liveBacktest }
      : outputs,
    null,
    2,
  ),
);
