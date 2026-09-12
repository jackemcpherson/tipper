import type { Reference, Season } from "../data.js";
import { summarise } from "../scoring.js";
import {
  type ChallengerParams,
  type ChallengerPrediction,
  DEFAULT_CHALLENGER,
  fitWeights,
  type PlayerMode,
  recombine,
  runChallenger,
} from "./model.js";

/**
 * Staged parameter selection on a tuning window. Each stage searches a small,
 * documented grid for one component while the others hold their current
 * values, and the margin weights and sigma are refitted by least squares
 * inside the window for every candidate. Selection minimises mean log loss on
 * the tuning seasons; margin error breaks ties. Evaluation seasons never enter
 * the objective.
 */
export interface TuningWindow {
  readonly from: number;
  readonly to: number;
}
export interface Candidate {
  readonly label: string;
  readonly params: ChallengerParams;
  readonly logLoss: number;
  readonly mae: number;
  readonly tips: number;
  readonly matches: number;
}
export interface StageResult {
  readonly stage: string;
  readonly candidates: readonly Candidate[];
  readonly selected: Candidate;
}
export interface TuningResult {
  readonly window: TuningWindow;
  readonly warmFrom: number;
  readonly stages: readonly StageResult[];
  readonly params: ChallengerParams;
}

export const GRID = Object.freeze({
  k: [0.05, 0.07, 0.09, 0.12, 0.15],
  regression: [0.2, 0.35, 0.5, 0.65],
  actualWeight: [0, 0.25, 0.5, 0.75, 1],
  decay: [0.8, 0.9, 0.95, 0.98, 0.99],
  priorWeight: [1, 3, 6],
  prior: [null, 4, 7] as readonly (number | null)[],
  playerMode: ["sum", "relative"] as readonly PlayerMode[],
  homeAdvantage: [0, 2, 4, 6, 8, 10],
  travelK: [0, 0.1, 0.2, 0.3],
  experienceK: [0, 0.5, 1, 2],
});

/** Refit weights and sigma inside the window, then score the window. */
export function evaluate(
  raw: readonly ChallengerPrediction[],
  params: ChallengerParams,
  window: TuningWindow,
  label: string,
): Candidate {
  const inWindow = raw.filter((p) => p.match.year >= window.from && p.match.year <= window.to);
  const fit = fitWeights(inWindow, params.playerMode);
  const fitted: ChallengerParams = { ...params, weights: fit.weights, sigma: fit.sigma };
  const scored = recombine(inWindow, fitted).filter((p) => p.match.status === "Complete");
  const summary = summarise(
    scored.map((p) => ({
      homeProbability: p.homeProbability,
      homeMargin: p.margin,
      actual: (p.match.home_points ?? 0) - (p.match.away_points ?? 0),
    })),
  );
  return {
    label,
    params: fitted,
    logLoss: summary.logLoss ?? Number.POSITIVE_INFINITY,
    mae: summary.mae ?? Number.POSITIVE_INFINITY,
    tips: summary.tips,
    matches: summary.matches,
  };
}

const better = (a: Candidate, b: Candidate) =>
  a.logLoss - b.logLoss || a.mae - b.mae || b.tips - a.tips;

export function tune(
  seasons: readonly Season[],
  reference: Reference,
  window: TuningWindow,
  warmFrom: number,
  log: (line: string) => void = () => {},
): TuningResult {
  const usable = seasons.filter((s) => s.year >= warmFrom && s.year <= window.to);
  let current: ChallengerParams = DEFAULT_CHALLENGER;
  const stages: StageResult[] = [];
  const runStage = (
    stage: string,
    variants: readonly { label: string; params: ChallengerParams }[],
  ) => {
    const candidates = variants.map((v) => {
      const raw = runChallenger(usable, reference, v.params, { predictFrom: window.from });
      const candidate = evaluate(raw, v.params, window, v.label);
      log(
        `${stage} ${v.label}: logLoss ${candidate.logLoss.toFixed(4)} mae ${candidate.mae.toFixed(2)} tips ${candidate.tips}`,
      );
      return candidate;
    });
    const selected = [...candidates].sort(better)[0];
    if (!selected) throw new Error(`Stage ${stage} produced no candidates`);
    stages.push({ stage, candidates, selected });
    current = selected.params;
  };

  const teamVariants: { label: string; params: ChallengerParams }[] = [];
  for (const k of GRID.k)
    for (const regression of GRID.regression)
      for (const actualWeight of GRID.actualWeight)
        teamVariants.push({
          label: `k=${k} regression=${regression} actualWeight=${actualWeight}`,
          params: {
            ...current,
            team: { ...current.team, k, regression },
            accuracy: { ...current.accuracy, actualWeight },
          },
        });
  runStage("team", teamVariants);

  const playerVariants: { label: string; params: ChallengerParams }[] = [];
  for (const decay of GRID.decay)
    for (const priorWeight of GRID.priorWeight)
      for (const prior of GRID.prior)
        for (const playerMode of GRID.playerMode)
          playerVariants.push({
            label: `decay=${decay} priorWeight=${priorWeight} prior=${prior ?? "debut"} mode=${playerMode}`,
            params: {
              ...current,
              player: { ...current.player, decay, priorWeight, prior },
              playerMode,
            },
          });
  runStage("player", playerVariants);

  const venueVariants: { label: string; params: ChallengerParams }[] = [];
  for (const homeAdvantage of GRID.homeAdvantage)
    for (const travelK of GRID.travelK)
      for (const experienceK of GRID.experienceK)
        venueVariants.push({
          label: `homeAdvantage=${homeAdvantage} travelK=${travelK} experienceK=${experienceK}`,
          params: {
            ...current,
            venue: { ...current.venue, homeAdvantage, travelK, experienceK },
          },
        });
  runStage("venue", venueVariants);

  return { window, warmFrom, stages, params: current };
}
