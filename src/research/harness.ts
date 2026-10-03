import { execFileSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import { basename, join } from "node:path";
import {
  type Baseline,
  candidateEntry,
  type Entry,
  fieldEntries,
  type GameResult,
  MAJOR_BENCHMARKS,
  PRODUCTION_LABEL,
  renderBaseline,
} from "./benchmark.js";
import {
  loadProductionPredictions,
  loadReference,
  loadSeason,
  loadSeasons,
  type Match,
  type Reference,
  type Season,
} from "./data.js";
import { type ComparedGame, compareSelections, renderSplit } from "./disagreement.js";
import { type FieldSeason, fetchField, loadField, mapGames, storeField } from "./field.js";
import { issuedCapture, leadTimeMinutes, readCaptures } from "./prospective.js";
import { type Forecast, type Summary, summarise } from "./scoring.js";

/**
 * Shared harness for the research commands: season context, the fixed
 * baseline, comparison rows and the prospective report. Candidate models plug
 * in through `CandidateProvider` so the harness never depends on one model.
 */
export const WARM_FROM = 2012;
export const FIT_FROM = 2016;
export const TUNE_TO = 2022;
export const EVALUATE_FROM = 2023;
export const BACKFILL_CAVEAT =
  "Tipper 2026 is predominantly a historical replay: 213 of 214 scored predictions were backfilled after the fact. It is not a prospective Squiggle entry.";

export type Args = Record<string, string | boolean | undefined>;
export type Command = (args: Args) => Promise<void>;

export const currentSeason = () => new Date().getUTCFullYear();
export const revision = () => {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
};
export const actual = (m: Match) => (m.home_points ?? 0) - (m.away_points ?? 0);
export const completed = (m: Match) =>
  m.status === "Complete" && m.home_points !== null && m.away_points !== null;
export const fmt = (n: number | null | undefined, digits = 2) =>
  n == null ? "n/a" : n.toFixed(digits);

export async function context(to: number) {
  const reference = await loadReference();
  const seasons = await loadSeasons(WARM_FROM, to, { currentSeason: currentSeason() });
  return { reference, seasons };
}

export function labelFor(reference: Reference, home: number, away: number): string {
  const name = (id: number) => reference.teams.find((t) => t.id === id)?.name ?? String(id);
  return `${name(home)} v ${name(away)}`;
}

/** Forecasts by Squiggle game id for one field source. */
export function sourceForecasts(field: FieldSeason, source: string): Map<number, Forecast> {
  const out = new Map<number, Forecast>();
  for (const t of field.tips) {
    if (t.source !== source || t.hconfidence === null || t.hmargin === null) continue;
    const p = t.hconfidence / 100;
    if (!(p > 0 && p < 1)) continue;
    out.set(t.gameid, { homeProbability: p, homeMargin: t.hmargin });
  }
  return out;
}

export const SUMMARY_HEADER = `${"".padEnd(32)}${"n".padStart(5)}${"Tips".padStart(6)}${"Bits".padStart(9)}${"MAE".padStart(8)}${"Acc%".padStart(8)}${"RMSE".padStart(8)}${"Brier".padStart(9)}${"LogLoss".padStart(9)}`;
export function summaryLine(name: string, s: Summary): string {
  return `${name.padEnd(32)}${String(s.matches).padStart(5)}${String(s.tips).padStart(6)}${fmt(s.bits).padStart(9)}${fmt(s.mae).padStart(8)}${fmt(s.accuracy === null ? null : 100 * s.accuracy, 1).padStart(8)}${fmt(s.rmse).padStart(8)}${fmt(s.brier, 4).padStart(9)}${fmt(s.logLoss, 4).padStart(9)}`;
}

export function entryFromRows(name: string, rows: readonly ComparedGame[]): Summary {
  return summarise(
    rows.flatMap((g) => {
      const f = g.forecasts.get(name);
      return f ? [{ ...f, actual: g.actual }] : [];
    }),
  );
}

/** A candidate model that can forecast one season's matches from the cached data. */
export interface CandidateProvider {
  readonly label: string;
  forecast(
    year: number,
    seasons: readonly Season[],
    reference: Reference,
  ): Promise<{ readonly forecasts: ReadonlyMap<number, Forecast>; readonly note: string }>;
}

/** Comparison rows for completed matches with a Squiggle game: every named forecast per game. */
export function comparedGames(
  reference: Reference,
  season: Season,
  field: FieldSeason,
  models: ReadonlyMap<string, ReadonlyMap<number, Forecast>>,
): ComparedGame[] {
  const mapping = mapGames(season.matches, reference.teams, field.games);
  const sources = [...new Set(field.tips.map((t) => t.source))];
  const perSource = new Map(sources.map((s) => [s, sourceForecasts(field, s)]));
  const games: ComparedGame[] = [];
  for (const m of season.matches) {
    if (!completed(m)) continue;
    const gameId = mapping.get(m.id);
    if (gameId === undefined) continue;
    const forecasts = new Map<string, Forecast>();
    for (const [name, byMatch] of models) {
      const f = byMatch.get(m.id);
      if (f) forecasts.set(name, f);
    }
    for (const [source, byGame] of perSource) {
      const f = byGame.get(gameId);
      if (f) forecasts.set(source, f);
    }
    games.push({
      gameId,
      label: labelFor(reference, m.home_team_id, m.away_team_id),
      round: m.round_number,
      actual: actual(m),
      forecasts,
    });
  }
  return games;
}

export interface BuiltBaseline {
  readonly baseline: Baseline;
  readonly games: ComparedGame[];
}

/** The fixed baseline for one season from stored production predictions, the stored field and candidates. */
export async function buildBaseline(
  year: number,
  candidates: readonly CandidateProvider[],
): Promise<BuiltBaseline> {
  const { reference, seasons } = await context(year);
  const season = seasons.find((s) => s.year === year);
  if (!season) throw new Error(`Season ${year} not loaded`);
  const field = await loadField(year);
  const stored = await loadProductionPredictions(year, { currentSeason: currentSeason() });
  const mapping = mapGames(season.matches, reference.teams, field.games);
  const production = new Map<number, Forecast>();
  const backfilled = stored.predictions.filter((p) => p.tipper_run_id === null).length;
  for (const p of stored.predictions)
    production.set(p.match_id, {
      homeProbability: p.home_win_prob,
      homeMargin: p.predicted_margin,
    });
  const scored = season.matches.filter(
    (m) => completed(m) && mapping.has(m.id) && production.has(m.id),
  );
  const results: GameResult[] = scored.map((m) => ({
    gameId: mapping.get(m.id) ?? -1,
    actual: actual(m),
  }));
  const unmapped = season.matches.filter((m) => completed(m) && !mapping.has(m.id)).length;
  const byGame = (byMatch: ReadonlyMap<number, Forecast>) =>
    new Map(
      [...byMatch].flatMap(([matchId, f]) => {
        const gameId = mapping.get(matchId);
        return gameId === undefined ? [] : [[gameId, f] as const];
      }),
    );
  const notes = [
    year === 2026
      ? BACKFILL_CAVEAT
      : `${backfilled} of ${stored.predictions.length} stored Tipper predictions have no live capture and were backfilled.`,
  ];
  if (unmapped)
    notes.push(
      `${unmapped} completed matches could not be mapped to Squiggle games and are excluded.`,
    );
  const models = new Map<string, ReadonlyMap<number, Forecast>>([[PRODUCTION_LABEL, production]]);
  const entries: Entry[] = [];
  for (const candidate of candidates) {
    const { forecasts, note } = await candidate.forecast(year, seasons, reference);
    models.set(candidate.label, forecasts);
    entries.push(candidateEntry(candidate.label, byGame(forecasts), results));
    if (note) notes.push(note);
  }
  const baseline: Baseline = {
    year,
    games: results.length,
    caveat: notes.join(" "),
    production: candidateEntry(PRODUCTION_LABEL, byGame(production), results),
    candidates: entries,
    field: fieldEntries(field, results),
  };
  const wanted = new Set(results.map((r) => r.gameId));
  return {
    baseline,
    games: comparedGames(reference, season, field, models).filter((g) => wanted.has(g.gameId)),
  };
}

export async function commandFetch(args: Args) {
  const from = Number(args.from ?? WARM_FROM);
  const to = Number(args.to ?? currentSeason());
  const refresh = args.refresh === true;
  await loadReference({ refresh });
  for (let year = from; year <= to; year++) {
    const season = await loadSeason(year, { refresh, currentSeason: currentSeason() });
    console.log(
      `${year}: ${season.matches.length} matches, ${season.stats.length} player rows, ${season.lineups.length} lineup rows`,
    );
  }
  const production = await loadProductionPredictions(to, {
    refresh,
    currentSeason: currentSeason(),
  });
  console.log(`${to}: ${production.predictions.length} stored production predictions`);
}

export async function commandField(args: Args) {
  const year = Number(args.year ?? currentSeason());
  const season = await fetchField(year);
  const path = await storeField(season);
  const complete = season.games.filter((g) => g.complete === 100).length;
  console.log(
    `${path}: ${season.games.length} games (${complete} complete), ${season.tips.length} tips, fetched ${season.fetchedAt}`,
  );
}

export function renderGameAnalysis(
  games: readonly ComparedGame[],
  candidates: readonly string[],
): string {
  const blocks: string[] = [];
  for (const label of candidates) {
    blocks.push(
      renderSplit(compareSelections(games, label, PRODUCTION_LABEL), [...MAJOR_BENCHMARKS], games),
    );
    blocks.push(renderSplit(compareSelections(games, label, "Wheelo Ratings"), [], [], false));
  }
  return blocks.join("\n\n");
}

export function baselineCommand(candidates: readonly CandidateProvider[]): Command {
  return async (args) => {
    const year = Number(args.year ?? 2026);
    const chosen = args.candidate === "none" ? [] : candidates;
    const built = await buildBaseline(year, chosen);
    console.log(renderBaseline(built.baseline, args.full === true));
    if (args.games === true) {
      console.log("");
      console.log(
        renderGameAnalysis(
          built.games,
          chosen.map((c) => c.label),
        ),
      );
    }
  };
}

/** Challenger captures stored for a season, keyed by model identity. */
export async function storedChallengers(season: number) {
  const dir = join("benchmark", "prospective", String(season));
  let files: string[] = [];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith(".jsonl")).sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const out = new Map<string, Awaited<ReturnType<typeof readCaptures>>>();
  for (const file of files) out.set(basename(file, ".jsonl"), await readCaptures(join(dir, file)));
  return out;
}

export function reportCommand(candidates: readonly CandidateProvider[]): Command {
  return async (args) => {
    const season = Number(args.season ?? currentSeason());
    const round = args.round === undefined ? undefined : Number(args.round);
    const reference = await loadReference();
    const refresh = args.refresh === true;
    const current = await loadSeason(season, { refresh, currentSeason: currentSeason() });
    const stored = await loadProductionPredictions(season, {
      refresh,
      currentSeason: currentSeason(),
    });
    const challengers = await storedChallengers(season);
    let field: FieldSeason | undefined;
    try {
      field = await loadField(season);
    } catch {
      field = undefined;
    }
    const mapping = field
      ? mapGames(current.matches, reference.teams, field.games)
      : new Map<number, number>();
    const perSource = new Map(
      (field ? [...new Set(field.tips.map((t) => t.source))] : []).map((s) => [
        s,
        sourceForecasts(field as FieldSeason, s),
      ]),
    );
    const done = current.matches
      .filter(completed)
      .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
    const games: ComparedGame[] = [];
    const missing = new Map<string, number[]>([[PRODUCTION_LABEL, []]]);
    const leadTimes = new Map<string, number[]>();
    const provisional = new Map<string, number>();
    for (const m of done) {
      const forecasts = new Map<string, Forecast>();
      const production = stored.predictions.find((p) => p.match_id === m.id);
      if (
        production?.tipper_run_id !== null &&
        production?.capture_published_at &&
        m.kickoff_at &&
        production.capture_published_at < m.kickoff_at
      )
        forecasts.set(PRODUCTION_LABEL, {
          homeProbability: production.home_win_prob,
          homeMargin: production.predicted_margin,
        });
      else missing.get(PRODUCTION_LABEL)?.push(m.id);
      for (const [model, captures] of challengers) {
        const issued = issuedCapture(captures, m.id);
        if (issued) {
          forecasts.set(model, {
            homeProbability: issued.homeProbability,
            homeMargin: issued.margin,
          });
          leadTimes.set(model, [...(leadTimes.get(model) ?? []), leadTimeMinutes(issued)]);
          if (issued.lineupState === "provisional")
            provisional.set(model, (provisional.get(model) ?? 0) + 1);
        } else missing.set(model, [...(missing.get(model) ?? []), m.id]);
      }
      const gameId = mapping.get(m.id);
      if (gameId !== undefined)
        for (const [source, byGame] of perSource) {
          const f = byGame.get(gameId);
          if (f) forecasts.set(source, f);
        }
      games.push({
        gameId: gameId ?? m.id,
        label: labelFor(reference, m.home_team_id, m.away_team_id),
        round: m.round_number,
        actual: actual(m),
        forecasts,
      });
    }
    const names = [PRODUCTION_LABEL, ...challengers.keys(), ...MAJOR_BENCHMARKS];
    const table = (title: string, rows: readonly ComparedGame[]) => {
      console.log(`${title}: ${rows.length} completed matches`);
      console.log(SUMMARY_HEADER);
      const entries = names.map((n) => ({ name: n, summary: entryFromRows(n, rows) }));
      for (const e of entries) console.log(summaryLine(e.name, e.summary));
      const ranked = entries.filter((e) => e.summary.matches === rows.length && rows.length > 0);
      for (const metric of ["tips", "bits"] as const) {
        const sorted = [...ranked].sort((a, b) => b.summary[metric] - a.summary[metric]);
        console.log(
          `  ${metric} rank among full-coverage entries: ${sorted.map((e, i) => `${i + 1}. ${e.name}`).join(", ")}`,
        );
      }
      console.log("");
    };
    console.log(`${season} prospective results (generated ${new Date().toISOString()})`);
    console.log(
      "Production predictions count only when a live capture was published before the recorded kickoff. Challenger predictions are the last capture before kickoff.",
    );
    console.log("");
    if (round !== undefined)
      table(
        `Round ${round}`,
        games.filter((g) => g.round === round),
      );
    table("Season to date", games);
    const listed = (ids: readonly number[]) =>
      ids.length
        ? ` (${ids.slice(0, 12).join(", ")}${ids.length > 12 ? `, and ${ids.length - 12} more` : ""})`
        : "";
    for (const [name, ids] of missing) console.log(`Missing ${name}: ${ids.length}${listed(ids)}`);
    for (const [model, times] of leadTimes) {
      const sorted = [...times].sort((a, b) => a - b);
      console.log(
        `${model}: ${provisional.get(model) ?? 0} provisional captures; median lead time ${(sorted[Math.floor(sorted.length / 2)] ?? 0).toFixed(0)} minutes`,
      );
    }
    if (!field)
      console.log(
        `No stored Squiggle field for ${season}. Run: bun run research field --year ${season}`,
      );
    console.log("");
    for (const model of challengers.keys()) {
      const shared = games.filter(
        (g) => g.forecasts.has(PRODUCTION_LABEL) && g.forecasts.has(model),
      );
      if (!shared.length) continue;
      console.log(
        renderSplit(
          compareSelections(shared, model, PRODUCTION_LABEL),
          [...MAJOR_BENCHMARKS],
          shared,
        ),
      );
      console.log("");
    }
    console.log("2026 historical baseline for the same candidate models");
    const built = await buildBaseline(2026, candidates);
    console.log(renderBaseline(built.baseline, false));
  };
}
