/**
 * Shared orchestration layer.
 *
 * Contains the data-fetching and engine-invocation logic used by both
 * the Cloudflare Worker and the CLI. All functions take a D1Database
 * (either the Worker binding or the REST shim) as their first argument.
 */

import { shortHash } from "./config/hash.js";
import type { Config } from "./config/schema.js";
import { formatModelVersion, toPredictionRow, upsertPredictions } from "./data/publish.js";
import {
  fetchLatestMatchDate,
  fetchLineupsForMatches,
  fetchMatchesForSeasons,
  fetchPlayerDobs,
  fetchPlayerStatsForMatches,
  fetchPriorSeasonPav,
  fetchSeasons,
  fetchTeams,
  fetchVenues,
} from "./data/queries.js";
import type {
  CompetitionCode,
  MatchLineupRow,
  MatchRow,
  PlayerMatchStatsRow,
  PlayerSeasonPavRow,
} from "./data/types.js";
import { type EloState, getRating, updateElo } from "./engine/elo.js";
import type { HarnessData } from "./engine/harness.js";
import { runHarness, runPredict } from "./engine/harness.js";
import { bootstrapCompare, computeCalibration, computeMetrics } from "./engine/metrics.js";
import { deriveVenueHA } from "./engine/venue.js";
import type { MatchPrediction } from "./types.js";

/** Resolve season years to a Set of season IDs via a year→id map. */
function resolveSeasonIds(years: number[], yearToId: Map<number, number>): Set<number> {
  return new Set(years.map((y) => yearToId.get(y)).filter((id): id is number => id !== undefined));
}

/** Group an array of rows into a Map keyed by match_id. */
function groupByMatchId<T extends { match_id: number }>(rows: T[]): Map<number, T[]> {
  const map = new Map<number, T[]>();
  for (const row of rows) {
    const existing = map.get(row.match_id);
    if (existing) {
      existing.push(row);
    } else {
      map.set(row.match_id, [row]);
    }
  }
  return map;
}

export interface FetchedData {
  harnessData: HarnessData;
  seasonIdToYear: Map<number, number>;
  seasonYearToId: Map<number, number>;
  matches: Awaited<ReturnType<typeof fetchMatchesForSeasons>>;
  latestDate: string | null;
}

/** All raw rows for a single season — the unit of the local season cache. */
export interface SeasonData {
  matches: MatchRow[];
  lineups: MatchLineupRow[];
  stats: PlayerMatchStatsRow[];
}

/**
 * Optional cache for per-season raw data.
 *
 * Historical seasons are append-only, so a completed season's rows can be
 * cached indefinitely. Implementations decide which years are cacheable
 * (e.g. only past seasons) — `get` returns undefined on miss or for
 * non-cacheable years, and `set` may no-op. This interface keeps the
 * orchestration layer runtime-agnostic; the CLI provides a Node fs
 * implementation.
 */
export interface SeasonDataCache {
  get(year: number): SeasonData | undefined;
  set(year: number, data: SeasonData): void;
}

/** Fetch matches, lineups, and stats for one season from the database. */
async function fetchSeasonData(db: D1Database, seasonId: number): Promise<SeasonData> {
  const matches = await fetchMatchesForSeasons(db, [seasonId]);
  const matchIds = matches.map((m) => m.id);
  const [lineups, stats] = await Promise.all([
    fetchLineupsForMatches(db, matchIds),
    fetchPlayerStatsForMatches(db, matchIds),
  ]);
  return { matches, lineups, stats };
}

/**
 * Fetch all data needed for a harness run.
 *
 * Shared by backtest, predict, and calibrate endpoints to avoid
 * duplicating the data-fetching and HarnessData assembly logic.
 *
 * Seasons are fetched independently (in parallel), so each season can be
 * served from the optional cache. Concatenating per-season results in
 * ascending season_id order preserves the walk-forward sort invariant
 * (each season's matches are already ordered by date, time, id).
 */
export async function fetchHarnessData(
  db: D1Database,
  seasonYears: number[],
  priorYears: number[],
  competition: CompetitionCode,
  cache?: SeasonDataCache,
): Promise<FetchedData> {
  const seasons = await fetchSeasons(db, seasonYears, competition);
  const seasonIdToYear = new Map(seasons.map((s) => [s.id, s.year]));
  const seasonYearToId = new Map(seasons.map((s) => [s.year, s.id]));

  const orderedSeasons = [...seasons].sort((a, b) => a.id - b.id);
  const perSeason = await Promise.all(
    orderedSeasons.map(async (season) => {
      const cached = cache?.get(season.year);
      if (cached) return cached;
      const data = await fetchSeasonData(db, season.id);
      cache?.set(season.year, data);
      return data;
    }),
  );

  const matches = perSeason.flatMap((d) => d.matches);
  const lineups = perSeason.flatMap((d) => d.lineups);
  const stats = perSeason.flatMap((d) => d.stats);

  const priorPavBySeason = new Map<number, PlayerSeasonPavRow[]>();
  const priorEntries = priorYears
    .map((y) => ({ year: y, seasonId: seasonYearToId.get(y) }))
    .filter((e): e is { year: number; seasonId: number } => e.seasonId !== undefined);
  await Promise.all(
    priorEntries.map(async ({ year, seasonId }) => {
      const priorPav = await fetchPriorSeasonPav(db, year, competition);
      priorPavBySeason.set(seasonId, priorPav);
    }),
  );

  // Task 37: gather every player_id referenced by priors or lineups so the age-curve
  // adjustment can find a DOB. We hit the players table once (chunked by 80 per the
  // D1 bind limit) rather than per-season. Players without DOB pass through unchanged.
  const dobPlayerIds = new Set<number>();
  for (const rows of priorPavBySeason.values()) {
    for (const row of rows) dobPlayerIds.add(row.player_id);
  }
  for (const row of lineups) dobPlayerIds.add(row.player_id);

  const [teams, venues, latestDate, dobByPlayerId] = await Promise.all([
    fetchTeams(db, competition),
    fetchVenues(db),
    fetchLatestMatchDate(db, competition),
    fetchPlayerDobs(db, [...dobPlayerIds]),
  ]);

  const harnessData: HarnessData = {
    matches,
    lineupsByMatch: groupByMatchId(lineups),
    statsByMatch: groupByMatchId(stats),
    priorPavBySeason,
    teamNames: new Map(teams.map((t) => [t.id, t.name])),
    venueNames: new Map(venues.map((v) => [v.id, v.name])),
    seasonYearById: seasonIdToYear,
    dobByPlayerId,
  };

  return { harnessData, seasonIdToYear, seasonYearToId, matches, latestDate };
}

/** Inclusive year range; empty when start > end. */
function seasonRange(start: number, end: number): number[] {
  const years: number[] = [];
  for (let y = start; y <= end; y++) {
    years.push(y);
  }
  return years;
}

export async function runBacktest(
  db: D1Database,
  config: Config,
  competition: CompetitionCode,
  cache?: SeasonDataCache,
) {
  // Seasons between train and test are fetched as implicit warm-up (Elo and
  // PAV update, no predictions). Without them a --season 2026 run jumps from
  // 2020 state straight to 2026 and the 2025 PAV prior fetch silently finds
  // no season id (Task 6 cold-start bug).
  const gapYears = seasonRange(
    Math.max(...config.backtest.train_seasons) + 1,
    Math.min(...config.backtest.test_seasons) - 1,
  );
  const allSeasonYears = [
    ...config.backtest.train_seasons,
    ...gapYears,
    ...config.backtest.test_seasons,
  ];
  const priorYears = config.backtest.test_seasons.map((y) => y - 1);

  const { harnessData, seasonIdToYear, seasonYearToId, matches, latestDate } =
    await fetchHarnessData(db, allSeasonYears, priorYears, competition, cache);

  const trainSeasonIds = resolveSeasonIds(config.backtest.train_seasons, seasonYearToId);
  const testSeasonIds = resolveSeasonIds(config.backtest.test_seasons, seasonYearToId);

  const harnessResult = runHarness(harnessData, config, trainSeasonIds, testSeasonIds);

  const overall = computeMetrics(harnessResult.predictions);

  const matchSeasonMap = new Map(matches.map((m) => [m.id, m.season_id]));

  const bySeason: Record<string, ReturnType<typeof computeMetrics>> = {};
  for (const testYear of config.backtest.test_seasons) {
    const seasonPredictions = harnessResult.predictions.filter((p) => {
      const matchSeasonId = matchSeasonMap.get(p.matchId);
      return matchSeasonId !== undefined && seasonIdToYear.get(matchSeasonId) === testYear;
    });
    bySeason[testYear.toString()] = computeMetrics(seasonPredictions);
  }

  const calibration = computeCalibration(harnessResult.predictions);

  return {
    data_through: latestDate,
    matches_fetched: matches.length,
    predictions_count: harnessResult.predictions.length,
    skipped_matches: harnessResult.skippedMatches.length,
    overall: {
      matches: overall.matches,
      tips: overall.tips,
      tip_pct: overall.tipPct,
      mae_margin: overall.maeMargin,
      rmse_margin: overall.rmseMargin,
      log_loss_bits: overall.logLossBits,
      brier: overall.brier,
    },
    by_season: Object.fromEntries(
      Object.entries(bySeason).map(([year, m]) => [
        year,
        {
          matches: m.matches,
          tips: m.tips,
          tip_pct: m.tipPct,
          mae_margin: m.maeMargin,
          rmse_margin: m.rmseMargin,
          log_loss_bits: m.logLossBits,
          brier: m.brier,
        },
      ]),
    ),
    calibration,
    matches: harnessResult.predictions,
  };
}

export async function runPrediction(
  db: D1Database,
  config: Config,
  season: number,
  roundNumber: number,
  competition: CompetitionCode,
  cache?: SeasonDataCache,
) {
  // Warm up over every season from the end of training through the target
  // season — skipping intermediate years leaves Elo state years stale.
  const allYears = [
    ...new Set([
      ...config.backtest.train_seasons,
      ...seasonRange(Math.max(...config.backtest.train_seasons) + 1, season),
    ]),
  ];
  const priorYears = [season - 1];

  const { harnessData, seasonYearToId, latestDate } = await fetchHarnessData(
    db,
    allYears,
    priorYears,
    competition,
    cache,
  );

  const targetSeasonId = seasonYearToId.get(season);
  if (targetSeasonId === undefined) {
    throw new Error(`Season ${season} not found in database.`);
  }

  const result = runPredict(harnessData, config, roundNumber, targetSeasonId);

  return {
    data_through: latestDate,
    predictions: result.predictions,
    skipped_matches: result.skippedMatches.length,
  };
}

/** Outcome of a publishRound call. */
export interface PublishRoundResult {
  readonly data_through: string | null;
  readonly predictions: readonly MatchPrediction[];
  /** Rows upserted into match_predictions (0 when the engine yielded none). */
  readonly written: number;
  /** Identity string stamped on every row, e.g. "predha-080 (2641f46f)". */
  readonly model_version: string;
  readonly generated_at: string;
}

/**
 * Predict a round and upsert the results into match_predictions — the
 * single publish pipeline shared by the CLI `publish` command and the
 * Worker cron tick (tipper#30), so a scheduled publish and a manual
 * publish of the same round produce identical rows.
 *
 * The config's test_seasons are overridden to the target season before
 * prediction. When the engine yields no predictions, nothing is written
 * (`written: 0`) and the caller decides how to report that.
 *
 * @param db - The database (Worker binding or REST shim).
 * @param config - The model config to run.
 * @param configId - Config identity for the model_version string.
 * @param configHash - Full content hash of `config` (computeConfigHash).
 * @param generatedAt - ISO-8601 instant stamped on every row.
 * @param cache - Optional per-season data cache (CLI only).
 * @param predict - Prediction runner, injectable for tests.
 */
export async function publishRound(
  db: D1Database,
  config: Config,
  configId: string,
  configHash: string,
  season: number,
  roundNumber: number,
  competition: CompetitionCode,
  generatedAt: string,
  cache?: SeasonDataCache,
  predict: typeof runPrediction = runPrediction,
): Promise<PublishRoundResult> {
  const predictConfig = {
    ...config,
    backtest: { ...config.backtest, test_seasons: [season] },
  };
  const result = await predict(db, predictConfig, season, roundNumber, competition, cache);
  const modelVersion = formatModelVersion(configId, shortHash(configHash));

  if (result.predictions.length === 0) {
    return {
      data_through: result.data_through,
      predictions: [],
      written: 0,
      model_version: modelVersion,
      generated_at: generatedAt,
    };
  }

  const rows = result.predictions.map((p) => toPredictionRow(p, modelVersion, generatedAt));
  const written = await upsertPredictions(db, rows);
  return {
    data_through: result.data_through,
    predictions: result.predictions,
    written,
    model_version: modelVersion,
    generated_at: generatedAt,
  };
}

export async function runCalibration(
  db: D1Database,
  config: Config,
  competition: CompetitionCode,
  cache?: SeasonDataCache,
) {
  // Fit the slope on TRAIN seasons only (COR-08). It was previously fitted
  // on the test seasons and then evaluated on those same seasons, so the
  // promoted slope made headline test metrics optimistically biased. The
  // harness runs with the train seasons as its prediction window (PAV
  // active, walk-forward within them); test seasons stay untouched.
  const allSeasonYears = [...config.backtest.train_seasons];
  const priorYears = config.backtest.train_seasons.map((y) => y - 1);

  const { harnessData, seasonYearToId } = await fetchHarnessData(
    db,
    allSeasonYears,
    priorYears,
    competition,
    cache,
  );

  const fitSeasonIds = resolveSeasonIds(config.backtest.train_seasons, seasonYearToId);

  const result = runHarness(harnessData, config, new Set(), fitSeasonIds);

  const dataPoints: { pavDiff: number; eloDiff: number; actualMargin: number }[] = [];
  for (const p of result.predictions) {
    if (p.actualMargin !== undefined) {
      dataPoints.push({
        pavDiff: p.homePavTotal - p.awayPavTotal,
        eloDiff: p.homeElo - p.awayElo,
        actualMargin: p.actualMargin,
      });
    }
  }

  let sumPavMargin = 0;
  let sumPavSq = 0;
  let sumEloDiffMargin = 0;
  let sumEloDiffSq = 0;
  for (const d of dataPoints) {
    sumPavMargin += d.pavDiff * d.actualMargin;
    sumPavSq += d.pavDiff * d.pavDiff;
    sumEloDiffMargin += d.eloDiff * d.actualMargin;
    sumEloDiffSq += d.eloDiff * d.eloDiff;
  }

  const pavSlopeVsMargin = sumPavSq > 0 ? sumPavMargin / sumPavSq : 0;
  const eloSlopeVsMargin = sumEloDiffSq > 0 ? sumEloDiffMargin / sumEloDiffSq : 0;

  const recommendedSlope =
    config.output.margin_per_rating_point > 0
      ? pavSlopeVsMargin / config.output.margin_per_rating_point
      : 0;

  const pavDiffs = dataPoints.map((d) => d.pavDiff);
  const pavMean = pavDiffs.reduce((a, b) => a + b, 0) / pavDiffs.length;
  const pavStd = Math.sqrt(pavDiffs.reduce((a, b) => a + (b - pavMean) ** 2, 0) / pavDiffs.length);
  const pavMin = Math.min(...pavDiffs);
  const pavMax = Math.max(...pavDiffs);

  let sumPavElo = 0;
  for (const d of dataPoints) {
    sumPavElo += d.pavDiff * d.eloDiff;
  }
  const pavEloCor =
    sumPavSq > 0 && sumEloDiffSq > 0 ? sumPavElo / Math.sqrt(sumPavSq * sumEloDiffSq) : 0;

  return {
    fitted_on: { seasons: config.backtest.train_seasons, scope: "train_seasons" },
    data_points: dataPoints.length,
    pav_diff_stats: {
      mean: pavMean,
      std: pavStd,
      min: pavMin,
      max: pavMax,
    },
    regression: {
      pav_slope_vs_margin: pavSlopeVsMargin,
      elo_slope_vs_margin: eloSlopeVsMargin,
      margin_per_rating_point: config.output.margin_per_rating_point,
      recommended_pav_calibration_slope: recommendedSlope,
    },
    complementarity: {
      pav_elo_diff_correlation: pavEloCor,
      note: "<0.7 = good complementarity, >0.85 = redundant signals",
    },
  };
}

export async function runCompare(
  db: D1Database,
  configA: Config,
  configB: Config,
  competition: CompetitionCode,
  nBootstrap?: number,
  seed?: number,
  cache?: SeasonDataCache,
) {
  const seasonsA = configA.backtest.test_seasons;
  const seasonsB = configB.backtest.test_seasons;
  if (seasonsA.length !== seasonsB.length || !seasonsA.every((s, i) => s === seasonsB[i])) {
    throw new Error(
      `Configs must have identical test_seasons for paired comparison. A=${seasonsA.join(",")}, B=${seasonsB.join(",")}`,
    );
  }

  // Same implicit warm-up of gap seasons as runBacktest, so a 2026-only
  // comparison doesn't run on years-stale state.
  const trainMax = Math.max(...configA.backtest.train_seasons, ...configB.backtest.train_seasons);
  const testMax = Math.max(...seasonsA);
  const allSeasonYears = [
    ...new Set([
      ...configA.backtest.train_seasons,
      ...configB.backtest.train_seasons,
      ...seasonRange(trainMax + 1, testMax),
    ]),
  ].sort((a, b) => a - b);
  const priorYears = [
    ...new Set([
      ...configA.backtest.test_seasons.map((y) => y - 1),
      ...configB.backtest.test_seasons.map((y) => y - 1),
    ]),
  ];

  const { harnessData, seasonYearToId } = await fetchHarnessData(
    db,
    allSeasonYears,
    priorYears,
    competition,
    cache,
  );

  const resultA = runHarness(
    harnessData,
    configA,
    resolveSeasonIds(configA.backtest.train_seasons, seasonYearToId),
    resolveSeasonIds(configA.backtest.test_seasons, seasonYearToId),
  );

  const resultB = runHarness(
    harnessData,
    configB,
    resolveSeasonIds(configB.backtest.train_seasons, seasonYearToId),
    resolveSeasonIds(configB.backtest.test_seasons, seasonYearToId),
  );

  const comparison = bootstrapCompare(resultA.predictions, resultB.predictions, nBootstrap, seed);

  return {
    config_a_id: configA.id,
    config_b_id: configB.id,
    ...comparison,
  };
}

export async function runDeriveVenueHA(
  db: D1Database,
  body: {
    seasons: number[];
    competition: CompetitionCode;
    elo: {
      k: number;
      initial_rating: number;
      home_advantage: number;
      regression_to_mean: number;
      mov_multiplier: "538_log" | "none";
    };
    margin_per_rating_point: number;
    min_matches?: number;
  },
) {
  const seasons = await fetchSeasons(db, body.seasons, body.competition);
  const seasonIds = seasons.map((s) => s.id);

  const [matches, venues] = await Promise.all([
    fetchMatchesForSeasons(db, seasonIds),
    fetchVenues(db),
  ]);
  const venueNames = new Map(venues.map((v) => [v.id, v.name]));

  const eloState: EloState = new Map();
  const eloConfig = {
    ...body.elo,
    k_context_sensitivity: 0,
    k_context_window: 8,
    home_advantage_source: "static" as const,
  };
  let currentSeasonId: number | null = null;

  const matchesWithElo: Array<{
    match: (typeof matches)[number];
    homeElo: number;
    awayElo: number;
  }> = [];

  for (const match of matches) {
    if (match.season_id !== currentSeasonId) {
      if (currentSeasonId !== null) {
        const mean = 1500;
        for (const [teamId, rating] of eloState) {
          eloState.set(teamId, rating + body.elo.regression_to_mean * (mean - rating));
        }
      }
      currentSeasonId = match.season_id;
    }

    if (match.home_points === null || match.away_points === null) continue;

    const homeElo = getRating(eloState, match.home_team_id, body.elo.initial_rating);
    const awayElo = getRating(eloState, match.away_team_id, body.elo.initial_rating);

    matchesWithElo.push({ match, homeElo, awayElo });

    updateElo(eloState, match, eloConfig);
  }

  const results = deriveVenueHA(
    matchesWithElo,
    venueNames,
    body.margin_per_rating_point,
    body.min_matches,
  );

  const venueHaMap: Record<string, number> = {};
  for (const r of results) {
    venueHaMap[r.venueId.toString()] = Math.round(r.haElo);
  }

  return {
    derivation_window: body.seasons,
    matches_used: matchesWithElo.length,
    venues: results,
    venue_ha_map: venueHaMap,
    default_ha: body.elo.home_advantage,
  };
}
