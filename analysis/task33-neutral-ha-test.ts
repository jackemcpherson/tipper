/**
 * Task 33 Phase 4, candidate N0 (pre-registered): prediction HA -> 0 at neutral venues.
 *
 * Offline-exact (T22 method note): prediction_home_advantage affects predictions only,
 * so the candidate is evaluated from persisted match records. Margin' = margin - 5.6 on
 * neutral-bucket games; prob' = engine CDF(margin'/36); metrics via engine metrics.ts.
 *
 * Run: bun run analysis/task33-neutral-ha-test.ts
 */

import { readFileSync } from "node:fs";
import { bootstrapCompareStratified, computeMetrics } from "../src/engine/metrics.js";
import { computeWinProbability } from "../src/engine/predict.js";

const HA_MARGIN = 80 * 0.07; // 5.6 pts, predha-080 / predha80-early identical
const SIGMA = 36;
const CLOSE = 12;

const VENUE_STATE: Record<string, string> = {
  MCG: "VIC",
  "Marvel Stadium": "VIC",
  "Kardinia Park": "VIC",
  "Mars Stadium": "VIC",
  "Adelaide Oval": "SA",
  "Norwood Oval": "SA",
  "Barossa Park": "SA",
  "Perth Stadium": "WA",
  "Hands Oval": "WA",
  "Domain Stadium": "WA",
  Subiaco: "WA",
  Gabba: "QLD",
  Carrara: "QLD",
  "Cazalys Stadium": "QLD",
  "Riverway Stadium": "QLD",
  SCG: "NSW",
  "Sydney Showground": "NSW",
  "Accor Stadium": "NSW",
  "UTAS Stadium": "TAS",
  "Ninja Stadium": "TAS",
  "Blundstone Arena": "TAS",
  "Manuka Oval": "ACT",
  "TIO Stadium": "NT",
  "Traeger Park": "NT",
  "Jiangwan Stadium": "CHN",
};
const TEAM_STATE: Record<string, string> = {
  Carlton: "VIC",
  Collingwood: "VIC",
  Essendon: "VIC",
  Geelong: "VIC",
  Hawthorn: "VIC",
  Melbourne: "VIC",
  "North Melbourne": "VIC",
  Richmond: "VIC",
  "St Kilda": "VIC",
  "Western Bulldogs": "VIC",
  Adelaide: "SA",
  "Port Adelaide": "SA",
  "West Coast": "WA",
  Fremantle: "WA",
  "Brisbane Lions": "QLD",
  "Gold Coast": "QLD",
  Sydney: "NSW",
  "GWS Giants": "NSW",
};
const HOME_GROUNDS: Record<string, string[]> = {
  Geelong: ["Kardinia Park"],
  Adelaide: ["Adelaide Oval"],
  "Port Adelaide": ["Adelaide Oval"],
  "West Coast": ["Perth Stadium", "Domain Stadium", "Subiaco"],
  Fremantle: ["Perth Stadium", "Hands Oval", "Domain Stadium", "Subiaco"],
  "Brisbane Lions": ["Gabba"],
  "Gold Coast": ["Carrara", "TIO Stadium", "Cazalys Stadium"],
  Sydney: ["SCG"],
  "GWS Giants": ["Sydney Showground", "Manuka Oval"],
  Hawthorn: ["UTAS Stadium"],
  "North Melbourne": ["Ninja Stadium", "Blundstone Arena"],
  Melbourne: ["Traeger Park"],
  "Western Bulldogs": ["Mars Stadium"],
};

interface Rec {
  matchId: number;
  date: string;
  home: string;
  away: string;
  venue: string;
  predictedMargin: number;
  predictedWinner: string;
  winProbability: { home: number; away: number };
  actualMargin?: number;
  actualWinner?: string;
  correct?: boolean;
}

function isNeutral(r: Rec): boolean {
  const vs = VENUE_STATE[r.venue];
  if (vs === undefined) throw new Error(`unmapped venue: ${r.venue}`);
  if ((HOME_GROUNDS[r.home] ?? []).includes(r.venue)) return false;
  return vs !== TEAM_STATE[r.home];
}

function applyN0(r: Rec): Rec {
  if (!isNeutral(r)) return r;
  const margin = r.predictedMargin - HA_MARGIN;
  const winProb = computeWinProbability(margin, SIGMA);
  const predictedWinner = margin >= 0 ? "home" : "away";
  const correct =
    r.actualWinner === undefined || r.actualWinner === "draw"
      ? undefined
      : predictedWinner === r.actualWinner;
  const out: Rec = { ...r, predictedMargin: margin, winProbability: winProb, predictedWinner };
  if (correct !== undefined) out.correct = correct;
  else delete out.correct;
  return out;
}

function load(path: string): Rec[] {
  return JSON.parse(readFileSync(path, "utf-8")).matches;
}

const base = "/Users/jackmcpherson/Projects/tipper/configs";
const primary = load(`${base}/predha-080/results-2026-06-12-2641f46f.json`);
const early = load(`${base}/predha80-early/results-2026-06-12-909461e1.json`);
const cur26 = load(`${base}/predha-080/results-2026-06-12-e8e0cede.json`);

// validity check: replicate official metrics
for (const [name, recs, official] of [
  ["primary", primary, 0.8485] as const,
  ["early", early, 0.8555] as const,
]) {
  const m = computeMetrics(recs as never);
  console.log(
    `${name}: logloss ${m.logLossBits.toFixed(4)} (official ${official}) tips ${m.tips}/${m.matches}`,
  );
}

function report(name: string, recs: Rec[]) {
  const a = recs.map(applyN0); // candidate
  const b = recs; // incumbent
  const neutral = recs.filter(isNeutral);
  const mA = computeMetrics(a as never);
  const mB = computeMetrics(b as never);
  const closeSet = new Set(
    recs.filter((r) => Math.abs(r.predictedMargin) < CLOSE).map((r) => r.matchId),
  );
  const closeTips = (rs: Rec[]) =>
    rs.filter((r) => closeSet.has(r.matchId) && r.correct === true).length;
  const closeN = recs.filter(
    (r) => closeSet.has(r.matchId) && r.actualWinner !== "draw" && r.actualWinner !== undefined,
  ).length;
  const flips = a
    .map((r, i) => ({ cand: r, orig: b[i] as Rec }))
    .filter(({ cand, orig }) => cand.correct !== orig.correct);
  const gained = flips.filter(({ cand }) => cand.correct === true).length;
  const lost = flips.filter(({ cand }) => cand.correct === false).length;
  console.log(
    `\n${name}: n=${recs.length} neutral=${neutral.length}` +
      `\n  tips ${mB.tips} -> ${mA.tips} (${mA.tips - mB.tips >= 0 ? "+" : ""}${mA.tips - mB.tips}; won ${gained}, lost ${lost})` +
      `\n  close-band (|pred|<12, incumbent def) ${closeTips(b)}/${closeN} -> ${closeTips(a)}/${closeN}` +
      `\n  logloss ${mB.logLossBits.toFixed(4)} -> ${mA.logLossBits.toFixed(4)} (Δ ${(mA.logLossBits - mB.logLossBits).toFixed(4)})` +
      `\n  mae ${mB.maeMargin.toFixed(2)} -> ${mA.maeMargin.toFixed(2)}`,
  );
  for (const { cand, orig } of flips) {
    console.log(
      `    flip ${cand.correct ? "WIN " : "LOSS"} ${orig.date.slice(0, 10)} ${orig.home} v ${orig.away} @ ${orig.venue} pred ${orig.predictedMargin.toFixed(1)} -> ${cand.predictedMargin.toFixed(1)} act ${orig.actualMargin}`,
    );
  }
  return { a, b };
}

const p = report("primary 2021-25", primary);
const e = report("early 2016-19", early);
report("2026 (R1-13)", cur26);

// per-season tips delta
console.log("\nper-season tips delta (candidate - incumbent):");
for (const recs of [primary, early, cur26]) {
  const byYear = new Map<string, Rec[]>();
  for (const r of recs) {
    const y = r.date.slice(0, 4);
    byYear.set(y, [...(byYear.get(y) ?? []), r]);
  }
  for (const [y, rs] of [...byYear.entries()].sort()) {
    const d = computeMetrics(rs.map(applyN0) as never).tips - computeMetrics(rs as never).tips;
    if (d !== 0) console.log(`  ${y}: ${d > 0 ? "+" : ""}${d}`);
  }
}

// engine-exact stratified pooled bootstrap (primary + early), seed 42 / 1000
const cmp = bootstrapCompareStratified(
  [
    { predictionsA: p.a as never, predictionsB: p.b as never },
    { predictionsA: e.a as never, predictionsB: e.b as never },
  ],
  1000,
  42,
);
const d = cmp.deltas.logLossBits;
console.log(
  `\npooled stratified bootstrap (primary+early): Δlogloss ${d.point.toFixed(4)} ` +
    `CI95 [${d.ci95[0].toFixed(4)}, ${d.ci95[1].toFixed(4)}] excludesZero=${d.excludesZero}` +
    `\n  Δtip% ${cmp.deltas.tipPct.point.toFixed(4)} CI95 [${cmp.deltas.tipPct.ci95[0].toFixed(4)}, ${cmp.deltas.tipPct.ci95[1].toFixed(4)}]`,
);
