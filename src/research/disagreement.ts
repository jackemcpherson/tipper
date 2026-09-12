import { correlation, type Forecast, scoreForecast, tipOf } from "./scoring.js";

/**
 * Game-level comparison between models over one shared set of games:
 * selections one model got right and another missed, games major
 * benchmarks got right that both missed, consensus versus contrarian
 * selections and margin-error relationships.
 */
export interface ComparedGame {
  readonly gameId: number;
  readonly label: string;
  readonly round: number;
  readonly actual: number;
  readonly forecasts: ReadonlyMap<string, Forecast>;
}

export interface SelectionSplit {
  readonly a: string;
  readonly b: string;
  readonly games: number;
  readonly aRightBWrong: readonly ComparedGame[];
  readonly bRightAWrong: readonly ComparedGame[];
  readonly bothWrong: readonly ComparedGame[];
  readonly bothRight: number;
  readonly sameSelection: number;
  readonly errorCorrelation: number | null;
  readonly marginCorrelation: number | null;
  readonly meanAbsoluteMarginDifference: number | null;
  readonly maeDifference: number | null;
}

const right = (f: Forecast, actual: number) => scoreForecast(f, actual).tip === 1;

/** Compare selections and margin errors of model `a` against model `b`. */
export function compareSelections(
  games: readonly ComparedGame[],
  a: string,
  b: string,
): SelectionSplit {
  const paired = games.filter((g) => g.forecasts.has(a) && g.forecasts.has(b));
  const get = (g: ComparedGame, name: string) => g.forecasts.get(name) as Forecast;
  const aRightBWrong: ComparedGame[] = [],
    bRightAWrong: ComparedGame[] = [],
    bothWrong: ComparedGame[] = [];
  let bothRight = 0,
    same = 0;
  const errorsA: number[] = [],
    errorsB: number[] = [],
    marginsA: number[] = [],
    marginsB: number[] = [];
  let absDiff = 0;
  for (const g of paired) {
    const fa = get(g, a),
      fb = get(g, b);
    const ra = right(fa, g.actual),
      rb = right(fb, g.actual);
    if (ra && rb) bothRight++;
    else if (ra) aRightBWrong.push(g);
    else if (rb) bRightAWrong.push(g);
    else bothWrong.push(g);
    if (tipOf(fa) === tipOf(fb)) same++;
    errorsA.push(fa.homeMargin - g.actual);
    errorsB.push(fb.homeMargin - g.actual);
    marginsA.push(fa.homeMargin);
    marginsB.push(fb.homeMargin);
    absDiff += Math.abs(fa.homeMargin - fb.homeMargin);
  }
  const mae = (errors: number[]) =>
    errors.length ? errors.reduce((s, e) => s + Math.abs(e), 0) / errors.length : null;
  const maeA = mae(errorsA),
    maeB = mae(errorsB);
  return {
    a,
    b,
    games: paired.length,
    aRightBWrong,
    bRightAWrong,
    bothWrong,
    bothRight,
    sameSelection: same,
    errorCorrelation: correlation(errorsA, errorsB),
    marginCorrelation: correlation(marginsA, marginsB),
    meanAbsoluteMarginDifference: paired.length ? absDiff / paired.length : null,
    maeDifference: maeA !== null && maeB !== null ? maeA - maeB : null,
  };
}

/** Games a benchmark got right that both compared models missed. */
export function benchmarkRescues(
  split: SelectionSplit,
  games: readonly ComparedGame[],
  benchmark: string,
): ComparedGame[] {
  const missed = new Set(split.bothWrong.map((g) => g.gameId));
  return games.filter((g) => {
    const f = g.forecasts.get(benchmark);
    return f !== undefined && missed.has(g.gameId) && right(f, g.actual);
  });
}

export interface ConsensusBucket {
  readonly bucket: "consensus" | "split" | "contrarian";
  readonly games: number;
  readonly right: number;
}

/**
 * Classify a model's selections by the share of field sources that agreed.
 * Consensus: at least `agree` of sources tipped the same side. Contrarian:
 * at most `1 - agree`. Anything else is split.
 */
export function consensusBuckets(
  games: readonly ComparedGame[],
  model: string,
  fieldSources: readonly string[],
  agree = 0.65,
  minimumSources = 8,
): ConsensusBucket[] {
  const counts = { consensus: [0, 0], split: [0, 0], contrarian: [0, 0] };
  for (const g of games) {
    const f = g.forecasts.get(model);
    if (!f) continue;
    const field = fieldSources.flatMap((s) => {
      const t = g.forecasts.get(s);
      return t && s !== model ? [tipOf(t)] : [];
    });
    if (field.length < minimumSources) continue;
    const share = field.filter((side) => side === tipOf(f)).length / field.length;
    const bucket = share >= agree ? "consensus" : share <= 1 - agree ? "contrarian" : "split";
    const entry = counts[bucket];
    entry[0] = (entry[0] ?? 0) + 1;
    entry[1] = (entry[1] ?? 0) + (right(f, g.actual) ? 1 : 0);
  }
  return (["consensus", "split", "contrarian"] as const).map((bucket) => ({
    bucket,
    games: counts[bucket][0] ?? 0,
    right: counts[bucket][1] ?? 0,
  }));
}

const fmt = (n: number | null, digits = 3) => (n === null ? "n/a" : n.toFixed(digits));

export function renderSplit(
  split: SelectionSplit,
  benchmarks: readonly string[] = [],
  games: readonly ComparedGame[] = [],
  listGames = true,
): string {
  const lines: string[] = [];
  lines.push(`${split.a} vs ${split.b} on ${split.games} shared games`);
  lines.push(
    `  same selection ${split.sameSelection}/${split.games}, both right ${split.bothRight}, both wrong ${split.bothWrong.length}`,
  );
  lines.push(
    `  ${split.a} right, ${split.b} wrong: ${split.aRightBWrong.length}; ${split.b} right, ${split.a} wrong: ${split.bRightAWrong.length}`,
  );
  lines.push(
    `  margin-error correlation ${fmt(split.errorCorrelation)}, margin correlation ${fmt(split.marginCorrelation)}, mean |margin difference| ${fmt(split.meanAbsoluteMarginDifference, 2)}, MAE difference ${fmt(split.maeDifference, 2)}`,
  );
  const list = (title: string, rows: readonly ComparedGame[]) => {
    if (!rows.length || !listGames) return;
    lines.push(`  ${title}`);
    for (const g of rows) {
      const fa = g.forecasts.get(split.a),
        fb = g.forecasts.get(split.b);
      lines.push(
        `    R${g.round} ${g.label}: actual ${g.actual > 0 ? "+" : ""}${g.actual}, ${split.a} ${fmt(fa?.homeMargin ?? null, 1)}, ${split.b} ${fmt(fb?.homeMargin ?? null, 1)}`,
      );
    }
  };
  list(`${split.a} right, ${split.b} wrong`, split.aRightBWrong);
  list(`${split.b} right, ${split.a} wrong`, split.bRightAWrong);
  for (const benchmark of benchmarks) {
    const rescued = benchmarkRescues(split, games, benchmark);
    lines.push(`  ${benchmark} right where both missed: ${rescued.length}`);
    if (!listGames) continue;
    for (const g of rescued)
      lines.push(`    R${g.round} ${g.label}: actual ${g.actual > 0 ? "+" : ""}${g.actual}`);
  }
  return lines.join("\n");
}

export function renderConsensus(model: string, buckets: readonly ConsensusBucket[]): string {
  return [
    `${model} by field agreement`,
    ...buckets.map(
      (b) =>
        `  ${b.bucket.padEnd(11)} ${b.right}/${b.games} right${b.games ? ` (${((100 * b.right) / b.games).toFixed(1)}%)` : ""}`,
    ),
  ].join("\n");
}
