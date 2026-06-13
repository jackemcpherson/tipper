/**
 * Task 35 (D1) evaluator: walk-forward stack (M1 ridge margin / M2 logistic) vs v3,
 * scored with engine metrics.ts conventions and the official stratified bootstrap.
 * Fallback matches (insufficient training data) carry v3's prediction on both sides,
 * so paired deltas there are zero by construction.
 *
 * Run: bun run analysis/task35-stack-eval.ts   (after stacking-head-walkforward.py)
 */

import { readFileSync } from "node:fs";
import { bootstrapCompareStratified, computeMetrics } from "../src/engine/metrics.js";
import { computeWinProbability } from "../src/engine/predict.js";

const SIGMA = 36;
const CLOSE = 12;
const REPO = "/Users/jackmcpherson/Projects/tipper";

interface Rec {
  matchId: number;
  date: string;
  home: string;
  away: string;
  predictedMargin: number;
  predictedWinner: string;
  winProbability: { home: number; away: number };
  actualMargin?: number;
  actualWinner?: string;
  correct?: boolean;
}

type StackPred = {
  pool: string;
  season: number;
  m1_margin: number | null;
  m2_prob: number | null;
  m3_margin: number | null;
};

const stack: Record<string, StackPred> = JSON.parse(
  readFileSync("/tmp/task35-stack-preds.json", "utf-8"),
);

function load(path: string): Rec[] {
  return JSON.parse(readFileSync(`${REPO}/configs/${path}`, "utf-8")).matches;
}
const early = load("predha80-early/results-2026-06-12-909461e1.json");
const primary = load("predha-080/results-2026-06-12-2641f46f.json");
const cur26 = load("predha-080/results-2026-06-12-e8e0cede.json");

type Mode = "m1" | "m2" | "m3";

function candidate(r: Rec, mode: Mode): Rec {
  const s = stack[String(r.matchId)];
  if (!s) throw new Error(`no stack pred for ${r.matchId}`);
  const raw = mode === "m1" ? s.m1_margin : mode === "m3" ? s.m3_margin : s.m2_prob;
  if (raw === null) return r; // v3 fallback
  let margin: number;
  let winProb: { home: number; away: number };
  if (mode === "m1" || mode === "m3") {
    margin = raw;
    winProb = computeWinProbability(margin, SIGMA);
  } else {
    // M2 has no margin head; clamp prob per engine bounds, margin via inverse-free
    // convention: keep v3's margin magnitude but M2's sign for the tip/correct fields.
    const p = Math.max(0.01, Math.min(0.99, s.m2_prob as number));
    winProb = { home: p, away: 1 - p };
    margin = p >= 0.5 ? Math.abs(r.predictedMargin) : -Math.abs(r.predictedMargin);
  }
  const predictedWinner = margin >= 0 ? "home" : "away";
  const out: Rec = { ...r, predictedMargin: margin, winProbability: winProb, predictedWinner };
  if (r.actualWinner !== undefined && r.actualWinner !== "draw") {
    out.correct = predictedWinner === r.actualWinner;
  } else {
    delete out.correct;
  }
  return out;
}

function evalWindow(name: string, recs: Rec[], mode: Mode) {
  const a = recs.map((r) => candidate(r, mode));
  const mA = computeMetrics(a as never);
  const mB = computeMetrics(recs as never);
  const closeIds = new Set(
    recs.filter((r) => Math.abs(r.predictedMargin) < CLOSE).map((r) => r.matchId),
  );
  const ct = (rs: Rec[]) => rs.filter((r) => closeIds.has(r.matchId) && r.correct === true).length;
  const closeN = recs.filter(
    (r) => closeIds.has(r.matchId) && r.actualWinner !== undefined && r.actualWinner !== "draw",
  ).length;
  console.log(
    `${name} [${mode}]: tips ${mB.tips} -> ${mA.tips} (${mA.tips - mB.tips >= 0 ? "+" : ""}${mA.tips - mB.tips})  ` +
      `close ${ct(recs)}/${closeN} -> ${ct(a)}/${closeN}  ` +
      `LL ${mB.logLossBits.toFixed(4)} -> ${mA.logLossBits.toFixed(4)} (Δ ${(mA.logLossBits - mB.logLossBits).toFixed(4)})  ` +
      `MAE ${mB.maeMargin.toFixed(2)} -> ${mA.maeMargin.toFixed(2)}`,
  );
  return { a, b: recs };
}

const LABELS: Record<Mode, string> = {
  m1: "M1 ridge margin stack",
  m2: "M2 logistic sign stack",
  m3: "M3 residual stack (shrink toward v3)",
};
for (const mode of ["m1", "m2", "m3"] as const) {
  console.log(`\n=== ${LABELS[mode]} ===`);
  const e = evalWindow("early 2016-19  ", early, mode);
  const p = evalWindow("primary 2021-25", primary, mode);
  evalWindow("2026 R1-13     ", cur26, mode);

  // per-season tips delta
  const deltas: string[] = [];
  for (const recs of [early, primary, cur26]) {
    const byYear = new Map<string, Rec[]>();
    for (const r of recs) {
      const y = r.date.slice(0, 4);
      byYear.set(y, [...(byYear.get(y) ?? []), r]);
    }
    for (const [y, rs] of [...byYear.entries()].sort()) {
      const d =
        computeMetrics(rs.map((r) => candidate(r, mode)) as never).tips -
        computeMetrics(rs as never).tips;
      deltas.push(`${y}:${d > 0 ? "+" : ""}${d}`);
    }
  }
  console.log(`per-season tips Δ: ${deltas.join(" ")}`);

  const cmp = bootstrapCompareStratified(
    [
      { predictionsA: e.a as never, predictionsB: e.b as never },
      { predictionsA: p.a as never, predictionsB: p.b as never },
    ],
    1000,
    42,
  );
  const d = cmp.deltas.logLossBits;
  console.log(
    `pooled bootstrap: ΔLL ${d.point.toFixed(4)} CI [${d.ci95[0].toFixed(4)}, ${d.ci95[1].toFixed(4)}] ` +
      `excludesZero=${d.excludesZero}  Δtip% ${cmp.deltas.tipPct.point.toFixed(4)} ` +
      `CI [${cmp.deltas.tipPct.ci95[0].toFixed(4)}, ${cmp.deltas.tipPct.ci95[1].toFixed(4)}]`,
  );
}
