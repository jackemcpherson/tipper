/** Multiplicity, paired power and correlated selection-null sensitivity. */
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { createPrng } from "../src/engine/prng.js";
import type { BootstrapComparison } from "../src/types.js";
import { loadResult, loss, paired, type summary, type windowCi } from "./task40-score.js";

export interface ModeScore {
  primary: ReturnType<typeof summary>;
  early: ReturnType<typeof summary>;
  oos: ReturnType<typeof summary>;
  pooled: BootstrapComparison;
  extended: BootstrapComparison;
  windowCi: ReturnType<typeof windowCi>[];
  power: ReturnType<typeof windowCi>;
  roundNullP: number;
  block: { ci95: number[]; nonnegativeFraction: number };
  gates: Record<string, boolean>;
  incumbentPass: boolean;
  correctedNumericalPass: boolean;
}
export interface Score {
  id: string;
  modes: Record<"legacy" | "standard_normal", ModeScore>;
  current: ReturnType<typeof summary>;
  burned: ReturnType<typeof summary>;
  recent: ReturnType<typeof summary>;
  consensus: ReturnType<typeof summary>;
  consensusPrimary: ReturnType<typeof summary>;
  consensus2026: ReturnType<typeof summary>;
  consensusOos: ReturnType<typeof summary>;
  seasons: Record<string, ReturnType<typeof summary>>;
  teams: {
    name: string;
    n: number;
    candidateBias: number;
    baselineBias: number;
    worsening: number;
  }[];
  extendedTeams: Score["teams"];
  venues: Score["teams"];
  incrementVsOd?: (ReturnType<typeof summary> & { ci: ReturnType<typeof windowCi> })[];
}
export function readScores(): Score[] {
  const result = [
    "analysis/task40-score-results.json",
    "analysis/task40-score-availability.json",
  ].flatMap((path) => JSON.parse(readFileSync(path, "utf8")) as Score[]);
  assert.equal(new Set(result.map((r) => r.id)).size, result.length);
  for (const r of result)
    for (const mode of Object.values(r.modes))
      assert(Number.isFinite(mode.roundNullP) && mode.roundNullP > 0 && mode.roundNullP <= 1);
  return result;
}

if (import.meta.main) {
  const scores = readScores();
  const holm = Object.fromEntries(
    (["legacy", "standard_normal"] as const).map((mode) => {
      const ordered = scores
        .map((r) => ({ id: r.id, rawP: r.modes[mode].roundNullP }))
        .sort((a, b) => a.rawP - b.rawP || a.id.localeCompare(b.id));
      let previous = 0;
      return [
        mode,
        ordered.map((r, i) => {
          previous = Math.min(1, Math.max(previous, r.rawP * (ordered.length - i)));
          return { ...r, adjustedP: previous, pass: previous < 0.05 };
        }),
      ];
    }),
  );
  const base = [...(await loadResult("t40-baseline")), ...(await loadResult("t40-baseline-early"))];
  const keys = [...new Set(base.map((p) => `${p.date.slice(0, 4)}:${p.roundNumber}`))];
  const index = new Map(keys.map((key, i) => [key, i]));
  const differences = [];
  for (const s of scores) {
    const candidate = [...(await loadResult(s.id)), ...(await loadResult(`${s.id}-early`))];
    const pairs = paired(candidate, base);
    const values = pairs.map(({ candidate, base }) => loss(candidate) - loss(base));
    const mean = values.reduce((sum, x) => sum + x, 0) / values.length;
    const blocks = new Array<number>(keys.length).fill(0);
    for (let i = 0; i < pairs.length; i++) {
      const row = pairs[i];
      assert(row);
      const j = index.get(`${row.base.date.slice(0, 4)}:${row.base.roundNumber}`);
      assert(j !== undefined);
      blocks[j] = (blocks[j] ?? 0) + (values[i] ?? 0) - mean;
    }
    differences.push(blocks);
  }
  const rand = createPrng(42);
  const gains: number[] = [];
  const falseCounts: number[] = [];
  for (let i = 0; i < 1000; i++) {
    const signs = keys.map(() => (rand() < 0.5 ? -1 : 1));
    const deltas = differences.map(
      (blocks) => blocks.reduce((s, x, j) => s + x * (signs[j] ?? 0), 0) / base.length,
    );
    gains.push(-Math.min(...deltas));
    falseCounts.push(deltas.filter((d) => d < -0.005).length);
  }
  gains.sort((a, b) => a - b);
  const od = scores.find((r) => r.id === "t40-od");
  assert(od);
  const se = od.modes.legacy.power.llSe;
  let falsePasses = 0;
  for (let i = 0; i < 100000; i++) {
    const z = Math.sqrt(-2 * Math.log(Math.max(1e-12, rand()))) * Math.cos(2 * Math.PI * rand());
    if (z * se < -0.005) falsePasses++;
  }
  const reverse = scores
    .filter((r) => r.id.startsWith("t40-od-reverse"))
    .sort(
      (a, b) =>
        a.modes.legacy.early.candidate.logLossBits - b.modes.legacy.early.candidate.logLossBits ||
        a.id.localeCompare(b.id),
    );
  const output = {
    candidates: scores.length,
    historicalN: base.length,
    blocks: keys.length,
    holm,
    nullSelection: {
      iterations: 1000,
      seed: 42,
      medianBestApparentGain: gains[500],
      ci95BestApparentGain: [gains[25], gains[975]],
      meanNumberClearing005: falseCounts.reduce((s, n) => s + n, 0) / falseCounts.length,
      probabilityAnyClears005: falseCounts.filter((n) => n > 0).length / falseCounts.length,
      caveat:
        "Shared round signs preserve cross-candidate dependence. Centered empirical alternatives are a sensitivity null, not an estimate of historical v3 tuning optimism.",
    },
    old156Illustration: {
      odScaleStandardError: se,
      probability005UnderGaussianNull: falsePasses / 100000,
      expected156ClearingMagnitudeOnly: (156 * falsePasses) / 100000,
      expected156OneSided025: 3.9,
      caveat:
        "Expected counts do not require independence, but assume equal marginal null behavior. Full promotion-gate probability is not identified by these calculations.",
    },
    power: scores.map((r) => ({
      id: r.id,
      legacy: r.modes.legacy.power,
      standardNormal: r.modes.standard_normal.power,
    })),
    reverseSelected: reverse[0]?.id,
    reverseGrid: reverse.map((r) => ({
      id: r.id,
      earlyLl: r.modes.legacy.early.ll,
      primaryLl: r.modes.legacy.primary.ll,
      tips2026: r.current.tips,
      consensus: r.consensus.tips,
    })),
    incumbentSurvivors: scores.filter((r) => r.modes.legacy.incumbentPass).map((r) => r.id),
    correctedNumericalSurvivors: scores
      .filter((r) => r.modes.standard_normal.correctedNumericalPass)
      .map((r) => r.id),
  };
  writeFileSync("analysis/task40-statistics-results.json", `${JSON.stringify(output, null, 2)}\n`, {
    flag: "wx",
  });
  console.log(
    JSON.stringify(
      {
        ...output,
        holm: Object.fromEntries(
          Object.entries(holm).map(([k, rows]) => [k, rows.filter((r) => r.pass)]),
        ),
        power: output.power.filter((r) => r.id === "t40-od"),
        reverseGrid: undefined,
      },
      null,
      2,
    ),
  );
}
