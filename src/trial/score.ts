/** Frozen prospective scoring. SQL, files, and current time stay in the caller. */
import { z } from "zod";
import { toSquiggleName } from "../comp.js";
import { computeWinProbability } from "../engine/predict.js";
import { createPrng } from "../engine/prng.js";
import { melbourneClock } from "../worker/plan.js";

export const TRIAL_RULES = {
  season: 2027,
  primary: "predha-080 (2641f46f)",
  challenger: "t40-od (c8c7b6b7)",
  seed: 42,
  bootstrapDraws: 1000,
  confidence: 0.95,
  closeMarginExclusive: 12,
  minimumSources: 8,
  wrongShareInclusive: 0.65,
  maximumBiasWorsening: 2,
  minimumTeamGames: 10,
  minimumPromotionTipDelta: 30,
  minimumSeasonGames: 200,
  recentSeasons: [2024, 2025, 2026],
  earliestDecision: "2027-09-01",
} as const;

const ForecastSchema = z.object({
  home: z.string(),
  away: z.string(),
  predictedMargin: z.number(),
});
const InputsSchema = z.object({
  prediction: ForecastSchema,
  sigma: z.number().positive(),
  round_type: z.string(),
  config_hash: z.string().regex(/^[a-f0-9]{64}$/),
  reconstructed: z.boolean().optional(),
});
const FieldSchema = z.array(
  z.object({
    sourceid: z.number().int(),
    tip: z.string(),
    hteam: z.string(),
    ateam: z.string(),
    hconfidence: z.union([z.number(), z.string()]).nullable().optional(),
  }),
);
const WallSchema = z.string().regex(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d$/);
export const TrialRowSchema = z.object({
  match_id: z.number().int(),
  model_version: z.string(),
  captured_at: z.iso.datetime(),
  competition: z.literal("AFLM"),
  season_year: z.number().int(),
  round_number: z.number().int(),
  round_first_kickoff: WallSchema,
  match_kickoff: WallSchema,
  is_primary: z.number().int().min(0).max(1),
  home_win_prob: z.number().min(0).max(1),
  predicted_margin: z.number(),
  lineups_json: z.string(),
  inputs_json: z.string(),
  field_json: z.string().nullable(),
  field_captured_at: z.iso.datetime().nullable(),
});
export const TrialResultSchema = z.object({
  match_id: z.number().int(),
  actual_margin: z.number().nullable(),
  round_type: z.string(),
});
export const TrialArchiveSchema = z.object({
  provenance: z.enum(["prospective", "reconstructed"]),
  rows: z.array(TrialRowSchema),
  results: z.array(TrialResultSchema),
});
export type TrialRow = z.infer<typeof TrialRowSchema>;
export type TrialArchive = z.infer<typeof TrialArchiveSchema>;
type Inputs = z.infer<typeof InputsSchema>;
interface Pair {
  primary: TrialRow;
  shadow: TrialRow;
  p: Inputs;
  s: Inputs;
  actual: number;
}

/** Latest capture strictly before both archived deadlines; duplicate keys fail closed. */
export function selectAtLock(rows: readonly TrialRow[]): TrialRow[] {
  const latest = new Map<string, TrialRow>();
  const seen = new Set<string>();
  for (const row of rows) {
    const key = `${row.match_id}|${row.model_version}`;
    const captureKey = `${key}|${row.captured_at}`;
    if (seen.has(captureKey)) throw new Error(`Duplicate archive capture ${captureKey}`);
    seen.add(captureKey);
    const wall = melbourneClock(new Date(row.captured_at)).wall;
    if (wall >= row.round_first_kickoff || wall >= row.match_kickoff) continue;
    const previous = latest.get(key);
    if (!previous || row.captured_at > previous.captured_at) latest.set(key, row);
  }
  return [...latest.values()].sort(
    (a, b) => a.match_id - b.match_id || a.model_version.localeCompare(b.model_version),
  );
}

/** Distinct sources with confidence and a valid team tip. Missing field is unknown. */
export function consensusWrong(row: TrialRow, actual: number): boolean | null {
  if (!row.field_json || !row.field_captured_at || actual === 0) return null;
  const wall = melbourneClock(new Date(row.field_captured_at)).wall;
  if (
    wall >= row.round_first_kickoff ||
    wall >= row.match_kickoff ||
    row.field_captured_at > row.captured_at
  )
    return null;
  const prediction = InputsSchema.parse(JSON.parse(row.inputs_json)).prediction;
  const home = toSquiggleName(prediction.home);
  const away = toSquiggleName(prediction.away);
  const sources = new Map<number, string>();
  for (const tip of FieldSchema.parse(JSON.parse(row.field_json))) {
    if (tip.hteam !== home || tip.ateam !== away || ![home, away].includes(tip.tip)) continue;
    if (
      tip.hconfidence === null ||
      tip.hconfidence === undefined ||
      !Number.isFinite(Number(tip.hconfidence))
    )
      continue;
    const previous = sources.get(tip.sourceid);
    if (previous && previous !== tip.tip)
      throw new Error(`Conflicting field source ${tip.sourceid}`);
    sources.set(tip.sourceid, tip.tip);
  }
  if (sources.size < TRIAL_RULES.minimumSources) return null;
  const winner = actual > 0 ? home : away;
  const wrong = [...sources.values()].filter((tip) => tip !== winner).length;
  return wrong / sources.size >= TRIAL_RULES.wrongShareInclusive;
}

function correct(margin: number, actual: number): number {
  return Number(actual !== 0 && margin >= 0 === actual > 0);
}
function cut(pairs: readonly Pair[]) {
  const decisive = pairs.filter((pair) => pair.actual !== 0);
  const primary = decisive.reduce(
    (n, pair) => n + correct(pair.p.prediction.predictedMargin, pair.actual),
    0,
  );
  const shadow = decisive.reduce(
    (n, pair) => n + correct(pair.s.prediction.predictedMargin, pair.actual),
    0,
  );
  return {
    n: decisive.length,
    primary,
    shadow,
    delta: shadow - primary,
    primaryAccuracy: decisive.length ? primary / decisive.length : null,
    shadowAccuracy: decisive.length ? shadow / decisive.length : null,
  };
}
function logLoss(pairs: readonly Pair[], side: "p" | "s", model: "legacy" | "standard_normal") {
  if (!pairs.length) return null;
  return (
    pairs.reduce((sum, pair) => {
      const input = pair[side];
      const probability = computeWinProbability(
        input.prediction.predictedMargin,
        input.sigma,
        model,
      ).home;
      // Task 40 compatibility: draws have target zero here. They never affect tip delta.
      return sum - Math.log2(pair.actual > 0 ? probability : 1 - probability);
    }, 0) / pairs.length
  );
}
function pairedCi(pairs: readonly Pair[]): [number, number] | null {
  const deltas = pairs
    .filter((pair) => pair.actual !== 0)
    .map(
      (pair) =>
        correct(pair.s.prediction.predictedMargin, pair.actual) -
        correct(pair.p.prediction.predictedMargin, pair.actual),
    );
  if (!deltas.length) return null;
  const random = createPrng(TRIAL_RULES.seed);
  const draws = Array.from({ length: TRIAL_RULES.bootstrapDraws }, () => {
    let total = 0;
    for (let i = 0; i < deltas.length; i++)
      total += deltas[Math.floor(random() * deltas.length)] ?? 0;
    return total;
  }).sort((a, b) => a - b);
  return [draws[25] ?? 0, draws[975] ?? 0];
}
function teamBias(pairs: readonly Pair[]) {
  const groups = new Map<string, { n: number; primary: number; shadow: number }>();
  for (const pair of pairs) {
    for (const [name, sign] of [
      [pair.p.prediction.home, 1],
      [pair.p.prediction.away, -1],
    ] as const) {
      const group = groups.get(name) ?? { n: 0, primary: 0, shadow: 0 };
      group.n++;
      group.primary += sign * (pair.actual - pair.p.prediction.predictedMargin);
      group.shadow += sign * (pair.actual - pair.s.prediction.predictedMargin);
      groups.set(name, group);
    }
  }
  return [...groups]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([team, group]) => ({
      team,
      n: group.n,
      primary: group.primary / group.n,
      shadow: group.shadow / group.n,
      worsening: (Math.abs(group.shadow) - Math.abs(group.primary)) / group.n,
    }));
}

/** Score common at-lock matches. Incomplete, retrospective, or weak evidence cannot promote. */
export function scoreTrial(
  archive: TrialArchive,
  season: number,
  now: Date,
  includeFinals = false,
) {
  const rows = selectAtLock(archive.rows.filter((row) => row.season_year === season));
  const byKey = new Map(rows.map((row) => [`${row.match_id}|${row.model_version}`, row]));
  const results = archive.results.filter((row) => includeFinals || row.round_type === "Regular");
  if (new Set(results.map((row) => row.match_id)).size !== results.length)
    throw new Error("Duplicate match result");
  const pairs: Pair[] = [];
  for (const result of results) {
    if (result.actual_margin === null) continue;
    const primary = byKey.get(`${result.match_id}|${TRIAL_RULES.primary}`);
    const shadow = byKey.get(`${result.match_id}|${TRIAL_RULES.challenger}`);
    if (!primary || !shadow) continue;
    const p = InputsSchema.parse(JSON.parse(primary.inputs_json));
    const s = InputsSchema.parse(JSON.parse(shadow.inputs_json));
    if (
      p.prediction.home !== s.prediction.home ||
      p.prediction.away !== s.prediction.away ||
      primary.is_primary !== 1 ||
      shadow.is_primary !== 0 ||
      !TRIAL_RULES.primary.includes(p.config_hash.slice(0, 8)) ||
      !TRIAL_RULES.challenger.includes(s.config_hash.slice(0, 8))
    )
      throw new Error("Conflicting paired model inputs");
    pairs.push({ primary, shadow, p, s, actual: result.actual_margin });
  }
  pairs.sort((a, b) => a.primary.match_id - b.primary.match_id);
  const tips = cut(pairs);
  const close = cut(
    pairs.filter(
      (pair) => Math.abs(pair.p.prediction.predictedMargin) < TRIAL_RULES.closeMarginExclusive,
    ),
  );
  const consensus = pairs.map((pair) => ({
    pair,
    wrong: consensusWrong(pair.primary, pair.actual),
  }));
  const consensusCut = cut(consensus.filter(({ wrong }) => wrong === true).map(({ pair }) => pair));
  const bias = teamBias(pairs);
  const ci95 = pairedCi(pairs);
  const complete =
    results.length >= TRIAL_RULES.minimumSeasonGames && pairs.length === results.length;
  const prospective =
    archive.provenance === "prospective" &&
    pairs.every((pair) => !pair.p.reconstructed && !pair.s.reconstructed);
  const eligible =
    complete &&
    prospective &&
    season === TRIAL_RULES.season &&
    !includeFinals &&
    now.toISOString().slice(0, 10) >= TRIAL_RULES.earliestDecision;
  const primaryRule = tips.delta > 0 && (ci95?.[0] ?? 0) > 0;
  const fallback =
    tips.delta > 0 &&
    close.n > 0 &&
    close.delta >= 0 &&
    consensusCut.n > 0 &&
    consensusCut.delta >= 0 &&
    bias.every(
      (team) =>
        team.n < TRIAL_RULES.minimumTeamGames || team.worsening <= TRIAL_RULES.maximumBiasWorsening,
    );
  const verdict =
    eligible && tips.delta >= TRIAL_RULES.minimumPromotionTipDelta && (primaryRule || fallback)
      ? "PROMOTE"
      : "PARK";
  return {
    season,
    primary: TRIAL_RULES.primary,
    challenger: TRIAL_RULES.challenger,
    provenance: archive.provenance,
    scope: includeFinals ? "all rounds diagnostic" : "home and away",
    expectedMatches: results.length,
    pairedMatches: pairs.length,
    complete,
    eligible,
    verdict,
    rule: primaryRule ? "primary" : fallback ? "fallback" : "neither",
    tips: { ...tips, ci95 },
    draws: pairs.length - tips.n,
    compTotals: {
      primary: tips.primary + pairs.length - tips.n,
      shadow: tips.shadow + pairs.length - tips.n,
    },
    close,
    consensusWrong: {
      ...consensusCut,
      unknown: consensus.filter(({ wrong }) => wrong === null).length,
    },
    teamBias: bias,
    logLossBits: {
      legacy: { primary: logLoss(pairs, "p", "legacy"), shadow: logLoss(pairs, "s", "legacy") },
      standard_normal: {
        primary: logLoss(pairs, "p", "standard_normal"),
        shadow: logLoss(pairs, "s", "standard_normal"),
      },
    },
  };
}
