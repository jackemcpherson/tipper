/**
 * Task 36 (D2) evaluator: pooled stratified bootstrap of od-w100-k008 vs v3
 * (predha-080) across primary 2021-25 + confirmatory 2016-19 windows, plus
 * close-band (|v3 pred margin| < 12) sign accuracy per window.
 *
 * The CLI `compare` command is single-window. The promotion bar's
 * confirmatory step (T25/T32) asks for an era-stratified pooled bootstrap;
 * each stratum is resampled independently, preserving its size, so era
 * composition is held fixed across iterations.
 *
 * Run: bun run analysis/task36-pooled-eval.ts
 */

import { readFileSync } from "node:fs";
import { bootstrapCompareStratified } from "../src/engine/metrics.js";
import type { MatchPrediction } from "../src/types.js";

const REPO = "/Users/jackmcpherson/Projects/tipper";
const CLOSE = 12;

function load(path: string): MatchPrediction[] {
  return JSON.parse(readFileSync(`${REPO}/configs/${path}`, "utf-8")).matches;
}

const v3Primary = load("predha-080/results-2026-06-13-2641f46f.json");
const v3Early = load("predha80-early/results-2026-06-12-909461e1.json");
const odPrimary = load("od-w100-k008/results-2026-06-13-c8c7b6b7.json");
const odEarly = load("od-w100-k008-early/results-2026-06-13-e5ca5027.json");

function tipsCount(preds: readonly MatchPrediction[]): number {
  return preds.reduce((n, p) => n + (p.correct === true ? 1 : 0), 0);
}

function decidedCount(preds: readonly MatchPrediction[]): number {
  return preds.filter((p) => p.actualMargin !== undefined && p.actualMargin !== 0).length;
}

console.log("=== Task 36: od-w100-k008 vs predha-080 (v3) — pooled era-stratified bootstrap ===\n");
console.log("A = v3, B = OD. Delta = A − B (negative LL/Brier = OD better).\n");

const comp = bootstrapCompareStratified(
  [
    { predictionsA: v3Primary, predictionsB: odPrimary },
    { predictionsA: v3Early, predictionsB: odEarly },
  ],
  1000,
  42,
);

const v3PoolTips = tipsCount(v3Primary) + tipsCount(v3Early);
const odPoolTips = tipsCount(odPrimary) + tipsCount(odEarly);
const v3PoolN = v3Primary.length + v3Early.length;
const odPoolN = odPrimary.length + odEarly.length;

console.log(`Pooled n: ${v3PoolN} (primary ${v3Primary.length} + early ${v3Early.length})`);
console.log(
  `  v3 LL ${comp.configA.logLossBits.toFixed(4)}  tips ${v3PoolTips}/${v3PoolN} (${((100 * v3PoolTips) / v3PoolN).toFixed(1)}%)`,
);
console.log(
  `  OD LL ${comp.configB.logLossBits.toFixed(4)}  tips ${odPoolTips}/${odPoolN} (${((100 * odPoolTips) / odPoolN).toFixed(1)}%)`,
);
console.log("");
console.log("Pooled stratified bootstrap, 1000 iter, seed 42:");
const dLL = comp.deltas.logLossBits;
const dTip = comp.deltas.tipPct;
console.log(
  `  Δ LogLoss  ${dLL.point.toFixed(4)}  CI [${dLL.ci95[0].toFixed(4)}, ${dLL.ci95[1].toFixed(4)}]  excludes 0: ${dLL.excludesZero}`,
);
console.log(
  `  Δ Tip%    ${(100 * dTip.point).toFixed(2)}%  CI [${(100 * dTip.ci95[0]).toFixed(2)}%, ${(100 * dTip.ci95[1]).toFixed(2)}%]  excludes 0: ${dTip.excludesZero}`,
);

console.log("\n=== close band (|v3 pred margin| < 12) sign accuracy ===");
function closeBand(
  a: readonly MatchPrediction[],
  b: readonly MatchPrediction[],
  label: string,
): void {
  const aById = new Map(a.map((p) => [p.matchId, p]));
  let n = 0;
  let aOk = 0;
  let bOk = 0;
  for (const pb of b) {
    const pa = aById.get(pb.matchId);
    if (!pa || pa.actualMargin === undefined || pa.actualMargin === 0) continue;
    if (Math.abs(pa.predictedMargin) >= CLOSE) continue;
    n++;
    if (pa.correct === true) aOk++;
    if (pb.correct === true) bOk++;
  }
  console.log(
    `  ${label} n=${n}  v3 ${aOk} (${((100 * aOk) / n).toFixed(1)}%)  OD ${bOk} (${((100 * bOk) / n).toFixed(1)}%)  Δ ${bOk - aOk >= 0 ? "+" : ""}${bOk - aOk}`,
  );
}
closeBand(v3Primary, odPrimary, "primary 2021-25");
closeBand(v3Early, odEarly, "early   2016-19");
const pooledV3 = [...v3Primary, ...v3Early];
const pooledOd = [...odPrimary, ...odEarly];
closeBand(pooledV3, pooledOd, "pooled         ");

console.log("\n=== per-season tip delta (pooled), recent-3 (2023-25) and 2024 watch ===");
function perSeasonTips(preds: MatchPrediction[]): Map<string, { n: number; tips: number }> {
  const m = new Map<string, { n: number; tips: number }>();
  for (const p of preds) {
    if (p.actualMargin === undefined) continue;
    const yr = p.date.slice(0, 4);
    const row = m.get(yr) ?? { n: 0, tips: 0 };
    row.n++;
    if (p.correct === true) row.tips++;
    m.set(yr, row);
  }
  return m;
}
const v3S = perSeasonTips(pooledV3);
const odS = perSeasonTips(pooledOd);
for (const yr of [...v3S.keys()].sort()) {
  const v = v3S.get(yr);
  const o = odS.get(yr);
  if (!v || !o) continue;
  const d = o.tips - v.tips;
  console.log(`  ${yr}: v3 ${v.tips}/${v.n}  OD ${o.tips}/${o.n}  Δ ${d >= 0 ? "+" : ""}${d}`);
}
const recent = ["2023", "2024", "2025"].reduce(
  (s, y) => s + ((odS.get(y)?.tips ?? 0) - (v3S.get(y)?.tips ?? 0)),
  0,
);
const decidedV3 = decidedCount(pooledV3);
const decidedOd = decidedCount(pooledOd);
console.log(`  recent (2023-25): Δ ${recent >= 0 ? "+" : ""}${recent}`);
console.log(`  (pooled decided non-draws: v3 ${decidedV3}, OD ${decidedOd})`);
