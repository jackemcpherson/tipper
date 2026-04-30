/**
 * Worker entry point for running tipper against D1.
 *
 * Accepts a config object in the request body (since Workers can't
 * access the filesystem). The CLI layer handles reading configs from
 * disk and posting them here.
 */

import type { Config } from "./config/schema.js";
import {
  fetchLatestMatchDate,
  fetchLineupsForMatches,
  fetchMatchesForSeasons,
  fetchPlayerStatsForMatches,
  fetchPriorSeasonPav,
  fetchSeasons,
  fetchTeams,
  fetchVenues,
} from "./data/queries.js";
import type { PlayerSeasonPavRow } from "./data/types.js";
import { type EloState, getRating, updateElo } from "./engine/elo.js";
import type { HarnessData } from "./engine/harness.js";
import { runHarness, runPredict } from "./engine/harness.js";
import { bootstrapCompare, computeCalibration, computeMetrics } from "./engine/metrics.js";
import { deriveVenueHA } from "./engine/venue.js";

interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/backtest" && request.method === "POST") {
      try {
        const config = (await request.json()) as Config;
        const result = await runBacktest(env.DB, config);
        return new Response(JSON.stringify(result, null, 2), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ error: message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (url.pathname === "/predict" && request.method === "POST") {
      try {
        const body = (await request.json()) as {
          config: Config;
          season: number;
          round_number: number;
          team?: string;
        };
        const result = await runPrediction(env.DB, body.config, body.season, body.round_number);
        return new Response(JSON.stringify(result, null, 2), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ error: message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (url.pathname === "/compare" && request.method === "POST") {
      try {
        const body = (await request.json()) as {
          configA: Config;
          configB: Config;
          nBootstrap?: number;
          seed?: number;
        };
        const result = await runCompare(
          env.DB,
          body.configA,
          body.configB,
          body.nBootstrap,
          body.seed,
        );
        return new Response(JSON.stringify(result, null, 2), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ error: message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (url.pathname === "/calibrate" && request.method === "POST") {
      try {
        const config = (await request.json()) as Config;
        const result = await runCalibration(env.DB, config);
        return new Response(JSON.stringify(result, null, 2), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ error: message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (url.pathname === "/derive-venue-ha" && request.method === "POST") {
      try {
        const body = (await request.json()) as {
          seasons: number[];
          elo: {
            k: number;
            initial_rating: number;
            home_advantage: number;
            regression_to_mean: number;
            mov_multiplier: "538_log" | "none";
          };
          margin_per_rating_point: number;
          min_matches?: number;
        };
        const result = await runDeriveVenueHA(env.DB, body);
        return new Response(JSON.stringify(result, null, 2), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ error: message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      "tipper worker\n\nEndpoints:\n  POST /backtest\n  POST /calibrate\n  POST /compare\n  POST /derive-venue-ha\n",
      { headers: { "Content-Type": "text/plain" } },
    );
  },
};

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

interface FetchedData {
  harnessData: HarnessData;
  seasonIdToYear: Map<number, number>;
  seasonYearToId: Map<number, number>;
  matches: Awaited<ReturnType<typeof fetchMatchesForSeasons>>;
  latestDate: string | null;
}

/**
 * Fetch all data needed for a harness run.
 *
 * Shared by backtest, predict, and calibrate endpoints to avoid
 * duplicating the data-fetching and HarnessData assembly logic.
 */
async function fetchHarnessData(
  db: D1Database,
  seasonYears: number[],
  priorYears: number[],
): Promise<FetchedData> {
  const seasons = await fetchSeasons(db, seasonYears);
  const seasonIdToYear = new Map(seasons.map((s) => [s.id, s.year]));
  const seasonYearToId = new Map(seasons.map((s) => [s.year, s.id]));

  const allSeasonIds = seasons.map((s) => s.id);
  const matches = await fetchMatchesForSeasons(db, allSeasonIds);
  const matchIds = matches.map((m) => m.id);
  const [lineups, stats] = await Promise.all([
    fetchLineupsForMatches(db, matchIds),
    fetchPlayerStatsForMatches(db, matchIds),
  ]);

  const priorPavBySeason = new Map<number, PlayerSeasonPavRow[]>();
  for (const priorYear of priorYears) {
    const priorSeasonId = seasonYearToId.get(priorYear);
    if (priorSeasonId !== undefined) {
      const priorPav = await fetchPriorSeasonPav(db, priorYear);
      priorPavBySeason.set(priorSeasonId, priorPav);
    }
  }

  const [teams, venues, latestDate] = await Promise.all([
    fetchTeams(db),
    fetchVenues(db),
    fetchLatestMatchDate(db),
  ]);

  const harnessData: HarnessData = {
    matches,
    lineupsByMatch: groupByMatchId(lineups),
    statsByMatch: groupByMatchId(stats),
    priorPavBySeason,
    teamNames: new Map(teams.map((t) => [t.id, t.name])),
    venueNames: new Map(venues.map((v) => [v.id, v.name])),
    seasonYearById: seasonIdToYear,
  };

  return { harnessData, seasonIdToYear, seasonYearToId, matches, latestDate };
}

async function runBacktest(db: D1Database, config: Config) {
  const allSeasonYears = [...config.backtest.train_seasons, ...config.backtest.test_seasons];
  const priorYears = config.backtest.test_seasons.map((y) => y - 1);

  const { harnessData, seasonIdToYear, seasonYearToId, matches, latestDate } =
    await fetchHarnessData(db, allSeasonYears, priorYears);

  const trainSeasonIds = new Set(
    config.backtest.train_seasons
      .map((y) => seasonYearToId.get(y))
      .filter((id): id is number => id !== undefined),
  );
  const testSeasonIds = new Set(
    config.backtest.test_seasons
      .map((y) => seasonYearToId.get(y))
      .filter((id): id is number => id !== undefined),
  );

  const harnessResult = runHarness(harnessData, config, trainSeasonIds, testSeasonIds);

  const overall = computeMetrics(harnessResult.predictions);

  // Map for O(1) matchId → seasonId lookup
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

async function runPrediction(db: D1Database, config: Config, season: number, roundNumber: number) {
  const allYears = [...new Set([...config.backtest.train_seasons, season, season - 1])];
  const priorYears = [season - 1];

  const { harnessData, seasonYearToId, latestDate } = await fetchHarnessData(
    db,
    allYears,
    priorYears,
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

async function runCalibration(db: D1Database, config: Config) {
  const allSeasonYears = [...config.backtest.train_seasons, ...config.backtest.test_seasons];
  const priorYears = config.backtest.test_seasons.map((y) => y - 1);

  const { harnessData, seasonYearToId } = await fetchHarnessData(db, allSeasonYears, priorYears);

  const trainSeasonIds = new Set(
    config.backtest.train_seasons
      .map((y) => seasonYearToId.get(y))
      .filter((id): id is number => id !== undefined),
  );
  const testSeasonIds = new Set(
    config.backtest.test_seasons
      .map((y) => seasonYearToId.get(y))
      .filter((id): id is number => id !== undefined),
  );

  const result = runHarness(harnessData, config, trainSeasonIds, testSeasonIds);

  // Extract PAV differentials and actual margins for regression
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

  // OLS: actual_margin ~ β * pav_diff
  // β = Σ(pav_diff * actual_margin) / Σ(pav_diff²)
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

  // pav_calibration_slope = pavSlopeVsMargin / margin_per_rating_point
  const recommendedSlope =
    config.output.margin_per_rating_point > 0
      ? pavSlopeVsMargin / config.output.margin_per_rating_point
      : 0;

  // Summary stats on PAV differentials
  const pavDiffs = dataPoints.map((d) => d.pavDiff);
  const pavMean = pavDiffs.reduce((a, b) => a + b, 0) / pavDiffs.length;
  const pavStd = Math.sqrt(pavDiffs.reduce((a, b) => a + (b - pavMean) ** 2, 0) / pavDiffs.length);
  const pavMin = Math.min(...pavDiffs);
  const pavMax = Math.max(...pavDiffs);

  // Correlation between PAV diff and Elo diff (complementarity signal)
  let sumPavElo = 0;
  for (const d of dataPoints) {
    sumPavElo += d.pavDiff * d.eloDiff;
  }
  const pavEloCor =
    sumPavSq > 0 && sumEloDiffSq > 0 ? sumPavElo / Math.sqrt(sumPavSq * sumEloDiffSq) : 0;

  return {
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

async function runCompare(
  db: D1Database,
  configA: Config,
  configB: Config,
  nBootstrap?: number,
  seed?: number,
) {
  // Both configs must use the same test_seasons for paired comparison
  const seasonsA = configA.backtest.test_seasons;
  const seasonsB = configB.backtest.test_seasons;
  if (seasonsA.length !== seasonsB.length || !seasonsA.every((s, i) => s === seasonsB[i])) {
    throw new Error(
      `Configs must have identical test_seasons for paired comparison. A=${seasonsA.join(",")}, B=${seasonsB.join(",")}`,
    );
  }

  // Merge all season years needed by both configs
  const allSeasonYears = [
    ...new Set([
      ...configA.backtest.train_seasons,
      ...configA.backtest.test_seasons,
      ...configB.backtest.train_seasons,
      ...configB.backtest.test_seasons,
    ]),
  ].sort((a, b) => a - b);
  const priorYears = [
    ...new Set([
      ...configA.backtest.test_seasons.map((y) => y - 1),
      ...configB.backtest.test_seasons.map((y) => y - 1),
    ]),
  ];

  const { harnessData, seasonYearToId } = await fetchHarnessData(db, allSeasonYears, priorYears);

  // Run both harnesses
  const buildSeasonIdSet = (config: Config, key: "train_seasons" | "test_seasons") =>
    new Set(
      config.backtest[key]
        .map((y) => seasonYearToId.get(y))
        .filter((id): id is number => id !== undefined),
    );

  const resultA = runHarness(
    harnessData,
    configA,
    buildSeasonIdSet(configA, "train_seasons"),
    buildSeasonIdSet(configA, "test_seasons"),
  );

  const resultB = runHarness(
    harnessData,
    configB,
    buildSeasonIdSet(configB, "train_seasons"),
    buildSeasonIdSet(configB, "test_seasons"),
  );

  const comparison = bootstrapCompare(resultA.predictions, resultB.predictions, nBootstrap, seed);

  return {
    config_a_id: configA.id,
    config_b_id: configB.id,
    ...comparison,
  };
}

async function runDeriveVenueHA(
  db: D1Database,
  body: {
    seasons: number[];
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
  const seasons = await fetchSeasons(db, body.seasons);
  const seasonIds = seasons.map((s) => s.id);

  const matches = await fetchMatchesForSeasons(db, seasonIds);
  const venues = await fetchVenues(db);
  const venueNames = new Map(venues.map((v) => [v.id, v.name]));

  // Build Elo state and collect per-match ratings
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
    // Season boundary: apply regression
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

    // Update Elo after recording pre-match ratings
    updateElo(eloState, match, eloConfig);
  }

  const results = deriveVenueHA(
    matchesWithElo,
    venueNames,
    body.margin_per_rating_point,
    body.min_matches,
  );

  // Build venue_ha map for config embedding
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
