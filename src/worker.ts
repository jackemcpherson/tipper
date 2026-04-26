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
import type { MatchLineupRow, PlayerMatchStatsRow } from "./data/types.js";
import type { HarnessData } from "./engine/harness.js";
import { runHarness, runPredict } from "./engine/harness.js";
import { computeCalibration, computeMetrics } from "./engine/metrics.js";

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

    return new Response(
      "tipper worker\n\nEndpoints:\n  POST /backtest (body: config JSON)\n  POST /calibrate (body: config JSON)\n",
      { headers: { "Content-Type": "text/plain" } },
    );
  },
};

async function runBacktest(db: D1Database, config: Config) {
  const allSeasonYears = [...config.backtest.train_seasons, ...config.backtest.test_seasons];
  const seasons = await fetchSeasons(db, allSeasonYears);
  const seasonIdToYear = new Map(seasons.map((s) => [s.id, s.year]));
  const seasonYearToId = new Map(seasons.map((s) => [s.year, s.id]));

  const allSeasonIds = seasons.map((s) => s.id);
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

  const matches = await fetchMatchesForSeasons(db, allSeasonIds);
  const matchIds = matches.map((m) => m.id);
  const lineups = await fetchLineupsForMatches(db, matchIds);
  const stats = await fetchPlayerStatsForMatches(db, matchIds);

  const priorPavBySeason = new Map<number, Awaited<ReturnType<typeof fetchPriorSeasonPav>>>();
  for (const testYear of config.backtest.test_seasons) {
    const priorYear = testYear - 1;
    const priorSeasonId = seasonYearToId.get(priorYear);
    if (priorSeasonId !== undefined) {
      const priorPav = await fetchPriorSeasonPav(db, priorYear);
      priorPavBySeason.set(priorSeasonId, priorPav);
    }
  }

  const teams = await fetchTeams(db);
  const venues = await fetchVenues(db);
  const latestDate = await fetchLatestMatchDate(db);

  const lineupsByMatch = new Map<number, MatchLineupRow[]>();
  for (const l of lineups) {
    const existing = lineupsByMatch.get(l.match_id);
    if (existing) {
      existing.push(l);
    } else {
      lineupsByMatch.set(l.match_id, [l]);
    }
  }

  const statsByMatch = new Map<number, PlayerMatchStatsRow[]>();
  for (const s of stats) {
    const existing = statsByMatch.get(s.match_id);
    if (existing) {
      existing.push(s);
    } else {
      statsByMatch.set(s.match_id, [s]);
    }
  }

  const harnessData: HarnessData = {
    matches,
    lineupsByMatch,
    statsByMatch,
    priorPavBySeason,
    teamNames: new Map(teams.map((t) => [t.id, t.name])),
    venueNames: new Map(venues.map((v) => [v.id, v.name])),
    seasonYearById: seasonIdToYear,
  };

  const harnessResult = runHarness(harnessData, config, trainSeasonIds, testSeasonIds);

  const overall = computeMetrics(harnessResult.predictions);
  const bySeason: Record<string, ReturnType<typeof computeMetrics>> = {};
  for (const testYear of config.backtest.test_seasons) {
    const seasonPredictions = harnessResult.predictions.filter((p) => {
      const matchSeasonId = matches.find((m) => m.id === p.matchId)?.season_id;
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
  };
}

/**
 * Run predictions for a specific round.
 *
 * Builds state from all completed matches up to the target round,
 * then predicts unplayed matches in that round.
 */
async function runPrediction(db: D1Database, config: Config, season: number, roundNumber: number) {
  const allYears = [...new Set([...config.backtest.train_seasons, season, season - 1])];
  const seasons = await fetchSeasons(db, allYears);
  const seasonIdToYear = new Map(seasons.map((s) => [s.id, s.year]));
  const seasonYearToId = new Map(seasons.map((s) => [s.year, s.id]));

  const targetSeasonId = seasonYearToId.get(season);
  if (targetSeasonId === undefined) {
    throw new Error(`Season ${season} not found in database.`);
  }

  const allSeasonIds = seasons.map((s) => s.id);
  const matches = await fetchMatchesForSeasons(db, allSeasonIds);
  const matchIds = matches.map((m) => m.id);
  const lineups = await fetchLineupsForMatches(db, matchIds);
  const stats = await fetchPlayerStatsForMatches(db, matchIds);

  const priorPavBySeason = new Map<number, Awaited<ReturnType<typeof fetchPriorSeasonPav>>>();
  const priorYear = season - 1;
  const priorSeasonId = seasonYearToId.get(priorYear);
  if (priorSeasonId !== undefined) {
    const priorPav = await fetchPriorSeasonPav(db, priorYear);
    priorPavBySeason.set(priorSeasonId, priorPav);
  }

  const teams = await fetchTeams(db);
  const venues = await fetchVenues(db);
  const latestDate = await fetchLatestMatchDate(db);

  const lineupsByMatch = new Map<number, MatchLineupRow[]>();
  for (const l of lineups) {
    const existing = lineupsByMatch.get(l.match_id);
    if (existing) existing.push(l);
    else lineupsByMatch.set(l.match_id, [l]);
  }

  const statsByMatch = new Map<number, PlayerMatchStatsRow[]>();
  for (const s of stats) {
    const existing = statsByMatch.get(s.match_id);
    if (existing) existing.push(s);
    else statsByMatch.set(s.match_id, [s]);
  }

  const harnessData: HarnessData = {
    matches,
    lineupsByMatch,
    statsByMatch,
    priorPavBySeason,
    teamNames: new Map(teams.map((t) => [t.id, t.name])),
    venueNames: new Map(venues.map((v) => [v.id, v.name])),
    seasonYearById: seasonIdToYear,
  };

  const result = runPredict(harnessData, config, roundNumber, targetSeasonId);

  return {
    data_through: latestDate,
    predictions: result.predictions,
    skipped_matches: result.skippedMatches.length,
  };
}

/**
 * Run a backtest and return per-match PAV differentials + actual margins
 * for slope calibration. Uses the same harness but extracts the raw data
 * needed for regression.
 *
 * Calibration window should be a subset of test_seasons (e.g. 2021-2023)
 * to avoid fitting on validation data.
 */
async function runCalibration(db: D1Database, config: Config) {
  const allSeasonYears = [...config.backtest.train_seasons, ...config.backtest.test_seasons];
  const seasons = await fetchSeasons(db, allSeasonYears);
  const seasonIdToYear = new Map(seasons.map((s) => [s.id, s.year]));
  const seasonYearToId = new Map(seasons.map((s) => [s.year, s.id]));

  const allSeasonIds = seasons.map((s) => s.id);
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

  const matches = await fetchMatchesForSeasons(db, allSeasonIds);
  const matchIds = matches.map((m) => m.id);
  const lineups = await fetchLineupsForMatches(db, matchIds);
  const stats = await fetchPlayerStatsForMatches(db, matchIds);

  const priorPavBySeason = new Map<number, Awaited<ReturnType<typeof fetchPriorSeasonPav>>>();
  for (const testYear of config.backtest.test_seasons) {
    const priorYear = testYear - 1;
    const priorSeasonId = seasonYearToId.get(priorYear);
    if (priorSeasonId !== undefined) {
      const priorPav = await fetchPriorSeasonPav(db, priorYear);
      priorPavBySeason.set(priorSeasonId, priorPav);
    }
  }

  const teams = await fetchTeams(db);
  const venues = await fetchVenues(db);

  const lineupsByMatch = new Map<number, MatchLineupRow[]>();
  for (const l of lineups) {
    const existing = lineupsByMatch.get(l.match_id);
    if (existing) existing.push(l);
    else lineupsByMatch.set(l.match_id, [l]);
  }

  const statsByMatch = new Map<number, PlayerMatchStatsRow[]>();
  for (const s of stats) {
    const existing = statsByMatch.get(s.match_id);
    if (existing) existing.push(s);
    else statsByMatch.set(s.match_id, [s]);
  }

  const harnessData: HarnessData = {
    matches,
    lineupsByMatch,
    statsByMatch,
    priorPavBySeason,
    teamNames: new Map(teams.map((t) => [t.id, t.name])),
    venueNames: new Map(venues.map((v) => [v.id, v.name])),
    seasonYearById: seasonIdToYear,
  };

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
