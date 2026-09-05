/** Matched scoring for every completed campaign config, with fixed guards. */
import assert from "node:assert/strict";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { computeConfigHash } from "../src/config/hash.js";
import { ConfigSchema } from "../src/config/schema.js";
import { bootstrapCompareStratified, computeMetrics } from "../src/engine/metrics.js";
import { computeWinProbability } from "../src/engine/predict.js";
import { createPrng } from "../src/engine/prng.js";
import type { MatchPrediction } from "../src/types.js";
import { storedMetrics } from "./task40-campaign.js";

export async function loadResult(id: string): Promise<MatchPrediction[]> {
  const cfg = ConfigSchema.parse(JSON.parse(readFileSync(`configs/${id}/config.json`, "utf8")));
  const hash = await computeConfigHash(cfg);
  const result = JSON.parse(
    readFileSync(`configs/${id}/results-2026-09-05-${hash.slice(0, 8)}.json`, "utf8"),
  );
  assert.equal(result.config_hash, hash);
  const rows = result.matches as MatchPrediction[];
  assert.equal(new Set(rows.map((p) => p.matchId)).size, rows.length);
  assert.deepEqual(storedMetrics(computeMetrics(rows)), result.overall);
  return rows;
}

export function paired(a: MatchPrediction[], b: MatchPrediction[]) {
  assert.equal(a.length, b.length);
  const byId = new Map(b.map((p) => [p.matchId, p]));
  assert.equal(byId.size, b.length);
  return a.map((p) => {
    const base = byId.get(p.matchId);
    assert(base);
    assert.equal(base.actualMargin, p.actualMargin);
    assert.equal(base.home, p.home);
    assert.equal(base.away, p.away);
    return { candidate: p, base };
  });
}

function loss(p: MatchPrediction, drawTarget = 0): number {
  const target = p.actualMargin === 0 ? drawTarget : (p.actualMargin ?? 0) > 0 ? 1 : 0;
  const prob = Math.max(0.01, Math.min(0.99, p.winProbability.home));
  return -target * Math.log2(prob) - (1 - target) * Math.log2(1 - prob);
}

export function summary(a: MatchPrediction[], b: MatchPrediction[]) {
  const pairs = paired(a, b);
  const ma = computeMetrics(a);
  const mb = computeMetrics(b);
  const close = pairs.filter(
    (p) => Math.abs(p.base.predictedMargin) < 12 && p.base.actualMargin !== 0,
  );
  return {
    n: a.length,
    candidate: ma,
    baseline: mb,
    ll: ma.logLossBits - mb.logLossBits,
    tips: ma.tips - mb.tips,
    closeN: close.length,
    closeTips: close.reduce(
      (s, p) => s + Number(p.candidate.correct === true) - Number(p.base.correct === true),
      0,
    ),
    halfDrawLl:
      pairs.reduce((s, p) => s + loss(p.candidate, 0.5) - loss(p.base, 0.5), 0) / pairs.length,
    noDrawLl:
      computeMetrics(a.filter((p) => p.actualMargin !== 0)).logLossBits -
      computeMetrics(b.filter((p) => p.actualMargin !== 0)).logLossBits,
  };
}

function biasTable(a: MatchPrediction[], b: MatchPrediction[], by: "team" | "venue") {
  const groups = new Map<string, { n: number; a: number; b: number }>();
  for (const { candidate, base } of paired(a, b)) {
    const entries: [string, number][] =
      by === "team"
        ? [
            [base.home, 1],
            [base.away, -1],
          ]
        : [[base.venue, 1]];
    for (const [key, sign] of entries) {
      const group = groups.get(key) ?? { n: 0, a: 0, b: 0 };
      group.n++;
      group.a += sign * ((candidate.actualMargin ?? 0) - candidate.predictedMargin);
      group.b += sign * ((base.actualMargin ?? 0) - base.predictedMargin);
      groups.set(key, group);
    }
  }
  return [...groups]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, g]) => ({
      name,
      n: g.n,
      candidateBias: g.a / g.n,
      baselineBias: g.b / g.n,
      worsening: (Math.abs(g.a) - Math.abs(g.b)) / g.n,
    }));
}

/** Resample round blocks within seasons, retaining chronology-related clusters. */
function blockCi(a: MatchPrediction[], b: MatchPrediction[]) {
  const groups = new Map<string, Map<number, number[]>>();
  for (const { candidate, base } of paired(a, b)) {
    const year = base.date.slice(0, 4);
    const season = groups.get(year) ?? new Map<number, number[]>();
    const block = season.get(base.roundNumber) ?? [];
    block.push(loss(candidate) - loss(base));
    season.set(base.roundNumber, block);
    groups.set(year, season);
  }
  const strata = [...groups.values()].map((rounds) => [...rounds.values()]);
  const rand = createPrng(42);
  const deltas = [];
  for (let iteration = 0; iteration < 1000; iteration++) {
    let sum = 0;
    let n = 0;
    for (const stratum of strata)
      for (let i = 0; i < stratum.length; i++) {
        const block = stratum[Math.floor(rand() * stratum.length)];
        assert(block);
        n += block.length;
        sum += block.reduce((s, value) => s + value, 0);
      }
    deltas.push(sum / n);
  }
  deltas.sort((a, b) => a - b);
  return {
    ci95: [deltas[25], deltas[975]],
    nonnegativeFraction: deltas.filter((d) => d >= 0).length / 1000,
  };
}

interface FieldTip {
  date: string;
  hteam: string;
  ateam: string;
  sourceid: number;
  gameid: number;
  correct: number | null;
  hconfidence: string | number | null;
}
const canonical = (name: string) => (name === "Greater Western Sydney" ? "GWS Giants" : name);
const matchKey = (date: string, home: string, away: string) =>
  `${date.slice(0, 10)}|${canonical(home)}|${canonical(away)}`;

export function fieldShares(): Map<string, number> {
  const shares = new Map<string, number>();
  for (const year of [2017, 2018, 2019, 2021, 2022, 2023, 2024, 2025, 2026]) {
    const tips: FieldTip[] = JSON.parse(
      readFileSync(`/tmp/tipper-task40-squiggle-${year}.json`, "utf8"),
    ).tips;
    const byGame = new Map<string, Map<number, FieldTip>>();
    for (const tip of tips) {
      if (tip.hconfidence === null || ![0, 1].includes(tip.correct ?? -1)) continue;
      const key = matchKey(tip.date, tip.hteam, tip.ateam);
      const sources = byGame.get(key) ?? new Map<number, FieldTip>();
      const previous = sources.get(tip.sourceid);
      if (previous) assert.deepEqual(previous, tip, `Conflicting source/game duplicate ${key}`);
      sources.set(tip.sourceid, tip);
      byGame.set(key, sources);
    }
    for (const [key, sources] of byGame)
      if (sources.size >= 8) {
        shares.set(
          key,
          [...sources.values()].filter((tip) => tip.correct === 1).length / sources.size,
        );
      }
  }
  return shares;
}

if (import.meta.main) {
  const bPrimary = await loadResult("t40-baseline");
  const bEarly = await loadResult("t40-baseline-early");
  const b2026 = await loadResult("t40-baseline-2026");
  assert.equal(computeMetrics(bPrimary).tips, 716);
  assert.equal(computeMetrics(bPrimary).logLossBits, 0.8484598529648077);
  const shares = fieldShares();
  const ids = readdirSync("configs").filter(
    (id) =>
      id.startsWith("t40-") &&
      !id.endsWith("-early") &&
      !id.endsWith("-2026") &&
      id !== "t40-baseline",
  );
  const reports = [];
  for (const id of ids.sort()) {
    const aPrimary = await loadResult(id);
    const aEarly = await loadResult(`${id}-early`);
    const a2026 = await loadResult(`${id}-2026`);
    const legacyWindows = [
      [aPrimary, bPrimary],
      [aEarly, bEarly],
      [a2026.filter((p) => p.roundNumber >= 14), b2026.filter((p) => p.roundNumber >= 14)],
    ] as const;
    const modes: Record<string, unknown> = {};
    const historicalA = [...aPrimary, ...aEarly];
    const historicalB = [...bPrimary, ...bEarly];
    const allA = [...historicalA, ...a2026];
    const allB = [...historicalB, ...b2026];
    const teams = biasTable(historicalA, historicalB, "team");
    const extendedTeams = biasTable(allA, allB, "team");
    const consensus = (a: MatchPrediction[], b: MatchPrediction[]) => {
      const rows = paired(a, b).filter(
        ({ base }) =>
          base.actualMargin !== 0 &&
          (shares.get(matchKey(base.date, base.home, base.away)) ?? 2) <= 0.35,
      );
      return summary(
        rows.map((r) => r.candidate),
        rows.map((r) => r.base),
      );
    };
    const cw = consensus([...aPrimary, ...a2026], [...bPrimary, ...b2026]);
    const recent = summary(
      allA.filter((p) => Number(p.date.slice(0, 4)) >= 2024),
      allB.filter((p) => Number(p.date.slice(0, 4)) >= 2024),
    );
    const current = summary(a2026, b2026);
    const burned = summary(
      a2026.filter((p) => p.roundNumber < 14),
      b2026.filter((p) => p.roundNumber < 14),
    );
    for (const mode of ["legacy", "standard_normal"] as const) {
      const convert = (rows: MatchPrediction[]) =>
        mode === "legacy"
          ? rows
          : rows.map((p) => ({
              ...p,
              winProbability: computeWinProbability(p.predictedMargin, 36, "standard_normal"),
            }));
      const windows = legacyWindows.map(([a, b]) => ({
        predictionsA: convert(a),
        predictionsB: convert(b),
      }));
      const p = summary(windows[0].predictionsA, windows[0].predictionsB);
      const e = summary(windows[1].predictionsA, windows[1].predictionsB);
      const oos = summary(windows[2].predictionsA, windows[2].predictionsB);
      const pooled = bootstrapCompareStratified(windows.slice(0, 2), 1000, 42);
      const extended = bootstrapCompareStratified(windows, 1000, 42);
      const block = blockCi(convert(historicalA), convert(historicalB));
      const gates = {
        primary: p.ll < -0.005,
        early:
          e.ll < 0 &&
          Math.abs(e.ll) >= 0.5 * Math.abs(p.ll) &&
          Math.abs(e.ll) <= 1.5 * Math.abs(p.ll),
        pooledCI: pooled.deltas.logLossBits.ci95[1] < 0,
        pooledTips:
          pooled.configA.tips >= pooled.configB.tips &&
          extended.configA.tips >= extended.configB.tips,
        recentTips: recent.tips >= 0,
        oos: oos.ll <= 0 && oos.tips >= 0,
        consensus: cw.n >= 30 && cw.tips >= 0,
        bias: [...teams, ...extendedTeams].every((team) => team.n < 50 || team.worsening <= 2),
      };
      modes[mode] = {
        primary: p,
        early: e,
        oos,
        pooled,
        extended,
        block,
        gates,
        incumbentPass: Object.values(gates).every(Boolean),
        correctedNumericalPass:
          Object.values(gates).every(Boolean) &&
          pooled.deltas.logLossBits.point < -0.005 &&
          (block.ci95[1] ?? 1) < 0,
      };
    }
    const report = {
      id,
      modes,
      recent,
      current,
      burned,
      consensus: cw,
      consensusPrimary: consensus(aPrimary, bPrimary),
      consensus2026: consensus(a2026, b2026),
      consensusOos: consensus(legacyWindows[2][0], legacyWindows[2][1]),
      teams,
      extendedTeams,
      venues: biasTable(allA, allB, "venue"),
      seasons: Object.fromEntries(
        [...new Set(allB.map((p) => p.date.slice(0, 4)))].sort().map((year) => [
          year,
          summary(
            allA.filter((p) => p.date.startsWith(year)),
            allB.filter((p) => p.date.startsWith(year)),
          ),
        ]),
      ),
    };
    reports.push(report);
    console.log(`${id}: recent tips ${recent.tips}, consensus tips ${cw.tips}/${cw.n}`);
  }
  const outIndex = process.argv.indexOf("--out");
  const output = outIndex < 0 ? "analysis/task40-score-results.json" : process.argv[outIndex + 1];
  assert(output);
  writeFileSync(output, `${JSON.stringify(reports, null, 2)}\n`, { flag: "wx" });
  console.log(`Saved ${reports.length} candidates to ${output}`);
}
