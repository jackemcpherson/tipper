import type { FieldSeason, FieldTip } from "./field.js";
import { type Forecast, scoreForecast } from "./scoring.js";

/**
 * Fixed Squiggle baseline: every model scored on one stated set of completed
 * games, with hypothetical ranks for candidates. Squiggle-provided scores are
 * the source of truth for the field. Tipper and candidates are scored with the
 * same rules from their stored or replayed forecasts.
 */
export const MAJOR_BENCHMARKS = Object.freeze([
  "Wheelo Ratings",
  "s10",
  "Punters",
  "Don't Blame the Data",
  "Aggregate",
]);
export const PRODUCTION_LABEL = "Tipper production";

export interface Entry {
  readonly name: string;
  readonly matches: number;
  readonly marginMatches: number;
  readonly tips: number;
  readonly bits: number;
  readonly mae: number | null;
  /** True when the entry scores every game in the benchmark set. */
  readonly complete: boolean;
}
export interface GameResult {
  readonly gameId: number;
  readonly actual: number;
}

/** Score one forecast per game against the benchmark games. */
export function candidateEntry(
  name: string,
  forecasts: ReadonlyMap<number, Forecast>,
  games: readonly GameResult[],
): Entry {
  let tips = 0,
    bits = 0,
    error = 0,
    matches = 0;
  for (const game of games) {
    const forecast = forecasts.get(game.gameId);
    if (!forecast) continue;
    const scored = scoreForecast(forecast, game.actual);
    tips += scored.tip;
    bits += scored.bits;
    error += scored.error;
    matches++;
  }
  return {
    name,
    matches,
    marginMatches: matches,
    tips,
    bits,
    mae: matches ? error / matches : null,
    complete: matches === games.length,
  };
}

/** Score every Squiggle source from Squiggle's own per-tip results. */
export function fieldEntries(field: FieldSeason, games: readonly GameResult[]): Entry[] {
  const wanted = new Set(games.map((g) => g.gameId));
  const bySource = new Map<string, FieldTip[]>();
  for (const tip of field.tips) {
    if (!wanted.has(tip.gameid)) continue;
    bySource.set(tip.source, [...(bySource.get(tip.source) ?? []), tip]);
  }
  return [...bySource.entries()].map(([name, tips]) => {
    const scored = tips.filter((t) => t.correct !== null && t.bits !== null);
    const withMargin = scored.filter((t) => t.err !== null);
    return {
      name,
      matches: scored.length,
      marginMatches: withMargin.length,
      tips: scored.reduce((s, t) => s + (t.correct ?? 0), 0),
      bits: scored.reduce((s, t) => s + (t.bits ?? 0), 0),
      mae: withMargin.length
        ? withMargin.reduce((s, t) => s + Math.abs(t.err ?? 0), 0) / withMargin.length
        : null,
      complete: scored.length === games.length && withMargin.length === games.length,
    };
  });
}

export type Metric = "tips" | "bits" | "mae";
export interface Rank {
  readonly metric: Metric;
  readonly rank: number;
  readonly of: number;
}

/** Rank an entry among complete-coverage entries. Ties share the better rank. */
export function rankAmong(entry: Entry, field: readonly Entry[], metric: Metric): Rank {
  const complete = field.filter((e) => e.complete && e.name !== entry.name);
  const value = (e: Entry) => (metric === "mae" ? (e.mae ?? Number.POSITIVE_INFINITY) : e[metric]);
  const mine = value(entry);
  const better = complete.filter((e) => (metric === "mae" ? value(e) < mine : value(e) > mine));
  return { metric, rank: better.length + 1, of: complete.length + 1 };
}

export interface Delta {
  readonly tips: number;
  readonly bits: number;
  readonly mae: number | null;
}
export function delta(candidate: Entry, production: Entry): Delta {
  return {
    tips: candidate.tips - production.tips,
    bits: candidate.bits - production.bits,
    mae: candidate.mae !== null && production.mae !== null ? candidate.mae - production.mae : null,
  };
}

export interface Baseline {
  readonly year: number;
  readonly games: number;
  readonly caveat: string;
  readonly production: Entry;
  readonly candidates: readonly Entry[];
  readonly field: readonly Entry[];
}

const fmt = (n: number | null, digits: number) => (n === null ? "n/a" : n.toFixed(digits));
const pad = (s: string, width: number) => s.padStart(width);

/** Render the standard baseline table. Major benchmarks appear first; `full` adds the rest. */
export function renderBaseline(baseline: Baseline, full = false): string {
  const lines: string[] = [];
  lines.push(`${baseline.year} Squiggle baseline (${baseline.games} completed games)`);
  lines.push(baseline.caveat);
  lines.push("");
  lines.push(`${"".padEnd(32)}${pad("Tips", 6)}${pad("Bits", 8)}${pad("MAE", 8)}  Coverage`);
  const row = (e: Entry) =>
    `${e.name.padEnd(32)}${pad(String(e.tips), 6)}${pad(fmt(e.bits, 2), 8)}${pad(fmt(e.mae, 2), 8)}  ${
      e.complete ? "full" : `${e.matches}/${baseline.games} games, ${e.marginMatches} margins`
    }`;
  lines.push(row(baseline.production));
  for (const c of baseline.candidates) lines.push(row(c));
  const byName = new Map(baseline.field.map((e) => [e.name, e]));
  for (const name of MAJOR_BENCHMARKS) {
    const e = byName.get(name);
    lines.push(e ? row(e) : `${name.padEnd(32)}  not in stored field`);
  }
  if (full) {
    const rest = baseline.field
      .filter((e) => !MAJOR_BENCHMARKS.includes(e.name))
      .sort((a, b) => b.tips - a.tips || b.bits - a.bits);
    if (rest.length) lines.push("");
    for (const e of rest) lines.push(row(e));
  }
  for (const c of baseline.candidates) {
    lines.push("");
    lines.push(
      `${c.name} hypothetical rank in the ${baseline.year} field (complete-coverage sources)`,
    );
    for (const metric of ["tips", "bits", "mae"] as const) {
      const r = rankAmong(c, [...baseline.field, baseline.production], metric);
      lines.push(`  ${metric.padEnd(5)} ${r.rank} of ${r.of}`);
    }
    const d = delta(c, baseline.production);
    lines.push(`${c.name} vs ${PRODUCTION_LABEL}`);
    lines.push(`  Tips: ${d.tips >= 0 ? "+" : ""}${d.tips}`);
    lines.push(`  Bits: ${d.bits >= 0 ? "+" : ""}${d.bits.toFixed(2)}`);
    lines.push(`  MAE: ${d.mae === null ? "n/a" : `${d.mae >= 0 ? "+" : ""}${d.mae.toFixed(2)}`}`);
  }
  lines.push("");
  lines.push(`${PRODUCTION_LABEL} rank (complete-coverage sources)`);
  for (const metric of ["tips", "bits", "mae"] as const) {
    const r = rankAmong(baseline.production, baseline.field, metric);
    lines.push(`  ${metric.padEnd(5)} ${r.rank} of ${r.of}`);
  }
  return lines.join("\n");
}
