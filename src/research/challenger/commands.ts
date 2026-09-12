import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { MAJOR_BENCHMARKS } from "../benchmark.js";
import {
  loadReference,
  loadSeason,
  loadSeasons,
  type Match,
  type Reference,
  type Season,
} from "../data.js";
import {
  compareSelections,
  consensusBuckets,
  renderConsensus,
  renderSplit,
} from "../disagreement.js";
import { loadField } from "../field.js";
import {
  type Args,
  type CandidateProvider,
  type Command,
  comparedGames,
  completed,
  context,
  currentSeason,
  EVALUATE_FROM,
  entryFromRows,
  FIT_FROM,
  labelFor,
  revision,
  SUMMARY_HEADER,
  summaryLine,
  TUNE_TO,
  WARM_FROM,
} from "../harness.js";
import { replayProduction } from "../production.js";
import {
  appendCaptures,
  type Capture,
  capturePath,
  isNewCapture,
  readCaptures,
} from "../prospective.js";
import type { Forecast } from "../scoring.js";
import { pooledSummary, walkForward } from "./backtest.js";
import {
  FROZEN_PATH,
  type FrozenModel,
  liveParams,
  loadFrozen,
  paramsHash,
  saveFrozen,
} from "./frozen.js";
import { CHALLENGER_IDENTITY, fitWeights, type Lineup, runChallenger } from "./model.js";
import { tune } from "./tune.js";

/** Research commands for the Wheelo-inspired challenger. */
export const CHALLENGER_LABEL = `Challenger (${CHALLENGER_IDENTITY})`;
const PRODUCTION_REPLAY = "Tipper production (replay)";

/** The frozen challenger as a baseline candidate, with weights refitted on seasons before the target. */
export const challengerCandidate: CandidateProvider = {
  label: CHALLENGER_LABEL,
  async forecast(year, seasons, reference) {
    const frozen = await loadFrozen();
    const [evaluation] = walkForward(seasons, reference, frozen.params, {
      warmFrom: WARM_FROM,
      fitFrom: FIT_FROM,
      from: year,
      to: year,
    });
    const forecasts = new Map<number, Forecast>();
    for (const p of evaluation?.predictions ?? [])
      forecasts.set(p.match.id, { homeProbability: p.homeProbability, homeMargin: p.margin });
    return {
      forecasts,
      note: `${CHALLENGER_LABEL} uses parameters selected on ${frozen.tuning.window.from}-${frozen.tuning.window.to} with margin weights fitted on ${evaluation?.fit.from}-${evaluation?.fit.to}.`,
    };
  },
};

async function commandTune(args: Args) {
  const from = Number(args.from ?? FIT_FROM);
  const to = Number(args.to ?? TUNE_TO);
  const fitTo = Number(args["fit-to"] ?? currentSeason());
  const { reference, seasons } = await context(fitTo);
  const result = tune(seasons, reference, { from, to }, WARM_FROM, (line) => {
    if (args.verbose === true) console.log(line);
  });
  for (const stage of result.stages)
    console.log(
      `${stage.stage}: ${stage.selected.label} (log loss ${stage.selected.logLoss.toFixed(4)}, MAE ${stage.selected.mae.toFixed(2)}, tips ${stage.selected.tips}) from ${stage.candidates.length} candidates`,
    );
  const raw = runChallenger(seasons, reference, result.params, { predictFrom: from });
  const prospective = fitWeights(
    raw.filter((p) => p.match.year <= fitTo && completed(p.match)),
    result.params.playerMode,
  );
  const frozen: FrozenModel = {
    identity: CHALLENGER_IDENTITY,
    frozenAt: new Date().toISOString(),
    sourceRevision: revision(),
    params: result.params,
    tuning: {
      window: result.window,
      warmFrom: result.warmFrom,
      objective: "mean natural log loss, ties by margin MAE",
      stages: result.stages.map((s) => ({
        stage: s.stage,
        selected: s.selected.label,
        logLoss: s.selected.logLoss,
        mae: s.selected.mae,
        tips: s.selected.tips,
        candidates: s.candidates.length,
      })),
    },
    prospectiveFit: { from, to: fitTo, ...prospective },
  };
  await saveFrozen(frozen);
  const tuningPath = `benchmark/challenger/tuning-${from}-${to}.json`;
  await mkdir(dirname(tuningPath), { recursive: true });
  await writeFile(
    tuningPath,
    `${JSON.stringify(
      {
        ...result,
        stages: result.stages.map((s) => ({
          stage: s.stage,
          selected: s.selected.label,
          candidates: s.candidates.map(({ params: _params, ...rest }) => rest),
        })),
      },
      null,
      2,
    )}\n`,
  );
  console.log(`Frozen ${FROZEN_PATH}; tuning detail ${tuningPath}`);
}

async function commandBacktest(args: Args) {
  const from = Number(args.from ?? EVALUATE_FROM);
  const to = Number(args.to ?? currentSeason());
  const frozen = await loadFrozen();
  const { reference, seasons } = await context(to);
  const evaluations = walkForward(seasons, reference, frozen.params, {
    warmFrom: WARM_FROM,
    fitFrom: FIT_FROM,
    from,
    to,
  });
  console.log(
    `Walk-forward ${from}-${to}. Structural parameters selected on ${frozen.tuning.window.from}-${frozen.tuning.window.to}; margin weights refitted on ${FIT_FROM} to the season before each evaluated season.`,
  );
  console.log("");
  const names = [CHALLENGER_LABEL, PRODUCTION_REPLAY, ...MAJOR_BENCHMARKS];
  const perSeason: { year: number; games: ReturnType<typeof comparedGames> }[] = [];
  for (const evaluation of evaluations) {
    const season = seasons.find((s) => s.year === evaluation.year);
    if (!season) continue;
    const field = await loadField(evaluation.year);
    const production = new Map<number, Forecast>(
      replayProduction(seasons, evaluation.year).map((r) => [
        r.match.id,
        { homeProbability: r.homeProbability, homeMargin: r.issuedMargin },
      ]),
    );
    const challenger = new Map<number, Forecast>(
      evaluation.predictions.map((p) => [
        p.match.id,
        { homeProbability: p.homeProbability, homeMargin: p.margin },
      ]),
    );
    const games = comparedGames(
      reference,
      season,
      field,
      new Map([
        [CHALLENGER_LABEL, challenger],
        [PRODUCTION_REPLAY, production],
      ]),
    ).filter((g) => names.every((n) => g.forecasts.has(n)));
    perSeason.push({ year: evaluation.year, games });
    console.log(
      `${evaluation.year}: ${games.length} shared games; weights team ${evaluation.weights.team.toFixed(3)} player ${evaluation.weights.player.toFixed(3)} sigma ${evaluation.sigma.toFixed(2)} (fit ${evaluation.fit.from}-${evaluation.fit.to}, n=${evaluation.fit.n}); lineups ${JSON.stringify(evaluation.lineupSources)}`,
    );
    console.log(SUMMARY_HEADER);
    for (const name of names) console.log(summaryLine(name, entryFromRows(name, games)));
    console.log("");
  }
  const pooled = perSeason.flatMap((r) => r.games);
  console.log(`Pooled ${from}-${to}: ${pooled.length} shared games`);
  console.log(SUMMARY_HEADER);
  for (const name of names) console.log(summaryLine(name, entryFromRows(name, pooled)));
  console.log("");
  console.log(
    `Challenger alone (all completed matches, not only shared games): ${JSON.stringify(pooledSummary(evaluations))}`,
  );
  console.log("");
  const split = compareSelections(pooled, CHALLENGER_LABEL, PRODUCTION_REPLAY);
  console.log(renderSplit(split, [], [], false));
  console.log(
    renderSplit(compareSelections(pooled, CHALLENGER_LABEL, "Wheelo Ratings"), [], [], false),
  );
  const fieldSources = [...new Set(pooled.flatMap((g) => [...g.forecasts.keys()]))].filter(
    (s) => s !== CHALLENGER_LABEL && s !== PRODUCTION_REPLAY,
  );
  console.log(
    renderConsensus(CHALLENGER_LABEL, consensusBuckets(pooled, CHALLENGER_LABEL, fieldSources)),
  );
  console.log(
    renderConsensus(PRODUCTION_REPLAY, consensusBuckets(pooled, PRODUCTION_REPLAY, fieldSources)),
  );
  if (typeof args.json === "string") {
    await mkdir(dirname(args.json), { recursive: true });
    await writeFile(
      args.json,
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          sourceRevision: revision(),
          frozenAt: frozen.frozenAt,
          seasons: evaluations.map((e) => ({
            year: e.year,
            fit: e.fit,
            weights: e.weights,
            sigma: e.sigma,
            summary: e.summary,
            lineupSources: e.lineupSources,
          })),
          pooled: pooledSummary(evaluations),
          shared: perSeason.map((r) => ({
            year: r.year,
            games: r.games.length,
            entries: Object.fromEntries(names.map((n) => [n, entryFromRows(n, r.games)])),
          })),
          pooledShared: Object.fromEntries(names.map((n) => [n, entryFromRows(n, pooled)])),
          disagreement: {
            ...split,
            aRightBWrong: split.aRightBWrong.length,
            bRightAWrong: split.bRightAWrong.length,
            bothWrong: split.bothWrong.length,
          },
        },
        null,
        2,
      )}\n`,
    );
    console.log(`Wrote ${args.json}`);
  }
}

async function commandCapture(args: Args) {
  const season = Number(args.season ?? currentSeason());
  const horizonDays = Number(args.days ?? 7);
  const frozen = await loadFrozen();
  const reference: Reference = await loadReference();
  const history: Season[] = await loadSeasons(WARM_FROM, season - 1, {});
  const current = await loadSeason(season, { refresh: true });
  const now = new Date();
  const horizon = new Date(now.getTime() + horizonDays * 86_400_000).toISOString();
  const upcoming = current.matches.filter(
    (m) =>
      m.status === "Upcoming" &&
      m.kickoff_at !== null &&
      m.kickoff_at > now.toISOString() &&
      m.kickoff_at <= horizon,
  );
  const named = new Map<number, Map<number, number[]>>();
  for (const l of current.lineups) {
    if (l.is_emergency !== 0) continue;
    const byTeam = named.get(l.match_id) ?? new Map<number, number[]>();
    byTeam.set(l.team_id, [...(byTeam.get(l.team_id) ?? []), l.player_id]);
    named.set(l.match_id, byTeam);
  }
  const lineupFor = (m: Match): Lineup | undefined => {
    if (m.status !== "Upcoming") return undefined;
    const byTeam = named.get(m.id);
    const home = byTeam?.get(m.home_team_id) ?? [];
    const away = byTeam?.get(m.away_team_id) ?? [];
    const ready =
      m.lineups_observed_at !== null &&
      [22, 23].includes(home.length) &&
      [22, 23].includes(away.length);
    return ready ? { home, away, source: "named" } : { home: [], away: [], source: "none" };
  };
  const params = liveParams(frozen);
  const predictions = runChallenger([...history, current], reference, params, {
    predictFrom: season,
    lineups: lineupFor,
  });
  const done = current.matches.filter(completed);
  const latest = done.sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id).at(-1);
  const version = `${CHALLENGER_IDENTITY}@${revision()}`;
  const path = capturePath(season, CHALLENGER_IDENTITY);
  const existing = await readCaptures(path);
  const fresh: Capture[] = [];
  for (const m of upcoming) {
    const p = predictions.find((x) => x.match.id === m.id);
    if (!p || m.kickoff_at === null) continue;
    const capture: Capture = {
      matchId: m.id,
      season,
      round: m.round_number,
      homeTeamId: m.home_team_id,
      awayTeamId: m.away_team_id,
      kickoffAt: m.kickoff_at,
      model: CHALLENGER_IDENTITY,
      version,
      paramsHash: paramsHash(params),
      sourceRevision: revision(),
      generatedAt: now.toISOString(),
      lineupObservedAt: m.lineups_observed_at,
      lineupState: p.lineupSource === "named" ? "lineup-ready" : "provisional",
      winner: p.margin >= 0 ? "home" : "away",
      margin: p.margin,
      issuedMargin: Math.round(p.margin * 10) / 10,
      homeProbability: p.homeProbability,
      inputs: {
        seasonsFetchedAt: current.fetchedAt,
        completedMatches: done.length,
        latestCompletedMatchId: latest?.id ?? null,
        lineupSource: p.lineupSource,
        frozenAt: frozen.frozenAt,
      },
    };
    if (isNewCapture(existing, capture)) fresh.push(capture);
  }
  const appended = await appendCaptures(path, fresh);
  console.log(
    `${upcoming.length} upcoming matches within ${horizonDays} days; ${appended} new captures appended to ${path}`,
  );
  for (const c of fresh)
    console.log(
      `  ${c.matchId} R${c.round} ${labelFor(reference, c.homeTeamId, c.awayTeamId)}: ${c.winner} ${c.issuedMargin} (${(100 * c.homeProbability).toFixed(1)}% home) ${c.lineupState}`,
    );
}

export const challengerCommands: Record<string, Command> = {
  tune: commandTune,
  backtest: commandBacktest,
  capture: commandCapture,
};
