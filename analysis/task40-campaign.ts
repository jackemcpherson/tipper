/** Execute the committed registration. Config/result writes are create-only. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { computeConfigHash } from "../src/config/hash.js";
import { type Config, ConfigSchema } from "../src/config/schema.js";
import { runHarness } from "../src/engine/harness.js";
import { computeCalibration, computeMetrics } from "../src/engine/metrics.js";
import { deriveVenueHA } from "../src/engine/venue.js";
import type { OverallMetrics } from "../src/types.js";
import { loadSnapshot, seasonIds, selectData } from "./task40-data.js";
import { fitAgeZones, fitGain } from "./task40-fit.js";

export interface Candidate {
  id: string;
  family: string;
  config: Config;
}
const readConfig = (id: string): Config =>
  ConfigSchema.parse(JSON.parse(readFileSync(`configs/${id}/config.json`, "utf8")));
const baseline = readConfig("predha-080");
const od = readConfig("od-w100-k008");
const v4 = readConfig("v4-shotoff");

export function candidates(): Candidate[] {
  const entries: Candidate[] = [];
  const add = (id: string, family: string, base: Config, edit: (c: Config) => void = () => {}) => {
    const config = structuredClone(base);
    config.id = id;
    config.notes = "Task 40 registered experiment; not promoted.";
    edit(config);
    entries.push({ id, family, config: ConfigSchema.parse(config) });
  };
  add("t40-baseline", "control", baseline);
  add("t40-travel-probe", "D", baseline, (c) => {
    c.notes = "Task 40 Plan 008 diagnostic only; see analysis/task40-travel-results.json.";
  });
  add("t40-od", "A", od);
  for (const [label, weight] of [
    ["025", 0.25],
    ["050", 0.5],
    ["075", 0.75],
    ["100", 1],
  ] as const) {
    add(`t40-shot-${label}`, "A", baseline, (c) => {
      c.elo.shot_margin_weight = weight;
    });
    add(`t40-od-shot-${label}`, "B", od, (c) => {
      assert(c.elo.od);
      c.elo.od.shot_score_weight = weight;
    });
  }
  for (const mode of ["neutral", "bucket"] as const) {
    add(`t40-ha-${mode}`, "A", baseline, (c) => {
      c.output.prediction_ha_mode = mode;
    });
  }
  add("t40-od-ha-bucket", "B", od, (c) => {
    c.output.prediction_ha_mode = "bucket";
  });
  for (const ha of [70, 90, 100])
    add(`t40-ha-${String(ha).padStart(3, "0")}`, "A", baseline, (c) => {
      c.output.prediction_home_advantage = ha;
    });
  for (const ha of [60, 100, 120])
    add(`t40-od-ha-${String(ha).padStart(3, "0")}`, "B", od, (c) => {
      c.output.prediction_home_advantage = ha;
    });
  for (const [kLabel, k] of [
    ["04", 0.04],
    ["08", 0.08],
    ["12", 0.12],
  ] as const) {
    for (const [rLabel, rtm] of [
      ["10", 0.1],
      ["20", 0.2],
      ["40", 0.4],
    ] as const) {
      add(`t40-od-reverse-k${kLabel}-r${rLabel}`, "B", od, (c) => {
        assert(c.elo.od);
        c.elo.od.k = k;
        c.elo.od.regression_to_mean = rtm;
      });
    }
  }
  add("t40-offset-v4", "A", v4);
  for (const k of [8, 16])
    add(`t40-offset-k${String(k).padStart(2, "0")}`, "A", v4, (c) => {
      assert(c.output.team_offset);
      c.output.team_offset.k = k;
    });
  for (const carry of [0, 1])
    add(`t40-offset-c${carry}`, "A", v4, (c) => {
      assert(c.output.team_offset);
      c.output.team_offset.season_carry = carry;
    });
  add("t40-offset-tail", "A", v4, (c) => {
    assert(c.output.team_offset);
    c.output.team_offset.tail_threshold = 24;
  });
  add("t40-venue-geo", "A", baseline, (c) => {
    c.output.prediction_ha_mode = "geographic";
  });
  add("t40-venue-static", "A", baseline);
  add("t40-venue-team", "A", baseline, (c) => {
    c.output.team_venue = { k: 32, season_carry: 0.5 };
  });
  add("t40-cdf", "F", baseline, (c) => {
    c.output.probability_model = "standard_normal";
  });
  add("t40-pav-day-end", "F", baseline, (c) => {
    c.pav.update_timing = "previous_day";
  });
  for (const sigma of [32, 40])
    add(`t40-sigma-${String(sigma).padStart(3, "0")}`, "F", baseline, (c) => {
      c.output.sigma = sigma;
    });
  add("t40-finals-ha", "E", baseline, (c) => {
    c.output.finals_home_advantage = 0;
  });
  add("t40-finals-k", "E", baseline, (c) => {
    c.elo.finals_k_multiplier = 1.5;
  });
  add("t40-finals-both", "E", baseline, (c) => {
    c.elo.finals_k_multiplier = 1.5;
    c.output.finals_home_advantage = 0;
  });
  add("t40-points", "E", baseline, (c) => {
    c.elo.points_residual_k = 0.04;
    c.elo.home_advantage = 10 / 0.07;
    c.elo.regression_to_mean = 0.2;
  });
  add("t40-derived", "E", od);
  for (const variant of ["r4", "zone", "k30"] as const) {
    add(`t40-age-${variant}`, "C", baseline, (c) => {
      c.pav.age_curve_weight = 0.5;
      if (variant === "r4") c.pav.age_curve_max_round = 4;
      if (variant === "k30") c.pav.prior_weight_k = 30;
    });
  }
  add("t40-prior-k30", "C", baseline, (c) => {
    c.pav.prior_weight_k = 30;
  });
  for (const target of ["quarter", "minutes", "rushed"] as const) {
    add(`t40-${target}`, "D", od, (c) => {
      assert(c.elo.od);
      c.elo.od.update_target = target;
    });
  }
  add("t40-weather", "D", od, (c) => {
    assert(c.elo.od);
    c.elo.od.weather_luck_weight = 0.25;
  });
  for (const feature of ["involvement", "intercepts", "pressure", "shots"] as const) {
    add(`t40-rich-${feature}`, "C", baseline, (c) => {
      c.pav.involvement_feature = feature;
    });
  }
  add("t40-lineup-delta", "C", baseline, (c) => {
    c.pav.signal = "lineup_delta";
  });
  add("t40-position", "C", baseline, (c) => {
    c.pav.position_weight = 1;
  });
  add("t40-tog", "C", baseline, (c) => {
    c.pav.tog_weight = 1;
  });
  add("t40-position-prior", "C", baseline, (c) => {
    c.pav.position_prior_k = 5;
  });
  add("t40-rating-points", "C", baseline, (c) => {
    c.pav.rating_points = true;
  });
  for (const mode of ["current", "normalized", "corrected"] as const) {
    add(`t40-pav-${mode}`, "F", baseline, (c) => {
      if (mode !== "normalized") c.pav.league_average = "current_season";
      if (mode !== "current") c.pav.normalize_zone_pools = true;
    });
  }
  return entries;
}

export function storedMetrics(m: OverallMetrics) {
  return {
    matches: m.matches,
    tips: m.tips,
    tip_pct: m.tipPct,
    mae_margin: m.maeMargin,
    rmse_margin: m.rmseMargin,
    log_loss_bits: m.logLossBits,
    brier: m.brier,
  };
}

if (import.meta.main) {
  const familyIndex = process.argv.indexOf("--family");
  const family = familyIndex < 0 ? undefined : process.argv[familyIndex + 1];
  const idIndex = process.argv.indexOf("--ids");
  const ids = idIndex < 0 ? undefined : process.argv[idIndex + 1]?.split(",");
  const data = loadSnapshot();
  const extra = JSON.parse(readFileSync("/tmp/tipper-task40-extra.json", "utf8"));
  const extraHash = createHash("sha256")
    .update(readFileSync("/tmp/tipper-task40-extra.json"))
    .digest("hex");
  const newConfigs: string[] = [];
  const extraMatches = new Map(extra.matches.map((m: { id: number }) => [m.id, m]));
  const rawVenues = new Map<number, { roof: string | null; timezone: string | null }>(
    extra.venues.map((v: { id: number }) => [v.id, v]),
  );
  interface Weather {
    match_id: number;
    kind: string;
    precip_mm: number | null;
    fetched_at: string;
  }
  const weather: Weather[] = extra.weather;
  const forecasts = new Map(
    weather.filter((w) => w.kind === "forecast").map((w) => [w.match_id, w]),
  );
  const observed = new Map(
    weather.filter((w) => w.kind === "observed").map((w) => [w.match_id, w]),
  );
  data.matches = data.matches.map((match) => {
    const extraMatch = extraMatches.get(match.id) ?? {};
    const features = Object.fromEntries(
      Object.entries(extraMatch).filter(
        ([key]) =>
          key.includes("_q") ||
          key.includes("_minutes_in_front") ||
          key.includes("_rushed_behinds"),
      ),
    );
    const venue = rawVenues.get(match.venue_id);
    const forecast = forecasts.get(match.id);
    const observation = observed.get(match.id);
    let precipSurprise: number | undefined;
    if (
      venue?.roof === "none" &&
      venue.timezone &&
      match.local_time &&
      forecast &&
      observation &&
      forecast.precip_mm !== null &&
      observation.precip_mm !== null
    ) {
      const zone = new Intl.DateTimeFormat("en-US", {
        timeZone: venue.timezone,
        timeZoneName: "shortOffset",
      })
        .formatToParts(new Date(`${match.date}T12:00:00Z`))
        .find((part) => part.type === "timeZoneName")?.value;
      const offset = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(zone ?? "");
      assert(offset, `Cannot resolve kickoff offset: ${zone}`);
      const time = match.local_time.length === 5 ? `${match.local_time}:00` : match.local_time;
      const kickoff = Date.parse(
        `${match.date}T${time}${offset[1]}${offset[2]?.padStart(2, "0")}:${offset[3] ?? "00"}`,
      );
      assert(Number.isFinite(kickoff));
      if (Date.parse(forecast.fetched_at) < kickoff)
        precipSurprise = Math.max(0, observation.precip_mm - forecast.precip_mm);
    }
    return precipSurprise === undefined
      ? { ...match, ...features }
      : { ...match, ...features, precip_surprise: precipSurprise };
  });
  data.venueGeoById = new Map(extra.venues.map((v: { id: number }) => [v.id, v]));
  const richStats = new Map(
    extra.stats.map((s: { match_id: number; player_id: number }) => [
      `${s.match_id}:${s.player_id}`,
      s,
    ]),
  );
  data.statsByMatch = new Map(
    [...data.statsByMatch].map(([id, rows]) => [
      id,
      rows.map((row) => ({ ...row, ...(richStats.get(`${id}:${row.player_id}`) ?? {}) })),
    ]),
  );
  const engineCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const entries = candidates().filter(
    (entry) =>
      (!family || entry.family === family || entry.family === "control") &&
      (!ids || ids.includes(entry.id) || entry.family === "control"),
  );
  for (const entry of entries) {
    if (entry.id === "t40-derived" || entry.id === "t40-age-zone") {
      const fit = entry.id === "t40-derived" ? fitGain(data) : fitAgeZones(data);
      const path = `analysis/${entry.id}-fit.json`;
      if (existsSync(path)) assert.deepEqual(JSON.parse(readFileSync(path, "utf8")), fit);
      else writeFileSync(path, `${JSON.stringify(fit, null, 2)}\n`, { flag: "wx" });
      if ("gain" in fit) {
        assert(entry.config.elo.od);
        entry.config.elo.od.k = 2 * fit.gain;
        entry.config.elo.od.regression_to_mean = fit.rtm;
      } else entry.config.pav.age_zone_ratios = fit.ratios;
    }
    if (entry.id === "t40-venue-static") {
      const fitConfig = structuredClone(baseline);
      fitConfig.backtest = {
        train_seasons: [],
        test_seasons: Array.from({ length: 10 }, (_, i) => 2010 + i),
        walk_forward: true,
      };
      const fitData = {
        ...data,
        matches: data.matches.filter((m) => (data.seasonYearById.get(m.season_id) ?? 9999) <= 2019),
      };
      const fit = runHarness(
        fitData,
        fitConfig,
        new Set(),
        seasonIds(data, fitConfig.backtest.test_seasons),
      );
      const byId = new Map(fitData.matches.map((m) => [m.id, m]));
      const table = deriveVenueHA(
        fit.predictions.map((p) => {
          const match = byId.get(p.matchId);
          assert(match);
          return { match, homeElo: p.homeElo, awayElo: p.awayElo };
        }),
        data.venueNames,
        0.07,
      );
      entry.config.output.prediction_ha_table = Object.fromEntries(
        table.map((r) => [String(r.venueId), 0.5 * r.haElo + 40]),
      );
    }
    // Reverse selection requires early to be computed first. Score code selects only on it.
    for (const [suffix, train, test] of [
      ["-early", [2015], [2016, 2017, 2018, 2019]],
      ["", [2020], [2021, 2022, 2023, 2024, 2025]],
      ["-2026", [2020], [2026]],
    ] as const) {
      const config = ConfigSchema.parse({
        ...entry.config,
        id: entry.id + suffix,
        backtest: { train_seasons: [...train], test_seasons: [...test], walk_forward: true },
      });
      const hash = await computeConfigHash(config);
      const directory = `configs/${config.id}`;
      const resultPath = `${directory}/results-2026-09-05-${hash.slice(0, 8)}.json`;
      mkdirSync(directory, { recursive: true });
      const configPath = `${directory}/config.json`;
      if (existsSync(configPath)) assert.deepEqual(readConfig(config.id), config);
      else {
        writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, { flag: "wx" });
        newConfigs.push(configPath);
      }
      if (existsSync(resultPath)) {
        if (entry.family === "control") {
          const selected = selectData(data, config, true);
          const replay = runHarness(
            selected,
            config,
            seasonIds(data, [...train]),
            seasonIds(data, [...test]),
          );
          assert.deepEqual(
            JSON.parse(JSON.stringify(replay.predictions)),
            JSON.parse(readFileSync(resultPath, "utf8")).matches,
          );
        }
        console.log(`Already frozen: ${config.id}`);
        continue;
      }
      const selected = selectData(data, config, true);
      const result = runHarness(
        selected,
        config,
        seasonIds(data, [...train]),
        seasonIds(data, [...test]),
      );
      const overall = storedMetrics(computeMetrics(result.predictions));
      if (entry.id === "t40-points") {
        const reference = { ...od, backtest: config.backtest };
        const odResult = runHarness(
          selected,
          reference,
          seasonIds(data, [...train]),
          seasonIds(data, [...test]),
        );
        assert.equal(result.predictions.length, odResult.predictions.length);
        for (let i = 0; i < result.predictions.length; i++) {
          assert(
            Math.abs(
              (result.predictions[i]?.predictedMargin ?? NaN) -
                (odResult.predictions[i]?.predictedMargin ?? NaN),
            ) < 1e-10,
            "Points/OD prediction identity failed",
          );
        }
      }
      const bySeason = Object.fromEntries(
        test.map((year) => [
          String(year),
          storedMetrics(
            computeMetrics(result.predictions.filter((p) => Number(p.date.slice(0, 4)) === year)),
          ),
        ]),
      );
      writeFileSync(
        resultPath,
        `${JSON.stringify(
          {
            config_id: config.id,
            config_hash: hash,
            ran_at: new Date().toISOString(),
            data_through: "2026-09-04",
            scope: { seasons: [...test] },
            overall,
            by_season: bySeason,
            calibration: computeCalibration(result.predictions),
            matches: result.predictions,
            campaign: {
              family: entry.family,
              engineCommit,
              snapshot: "705f3d2bed9f5db50d726718adf41ef732d56f590255041590f77a6849bbdd17",
              completeWarmupPriors: true,
              extraSnapshot: extraHash,
            },
          },
          null,
          2,
        )}\n`,
        { flag: "wx" },
      );
      console.log(
        `${config.id}: ${overall.matches} games, ${overall.tips} tips, LL ${overall.log_loss_bits.toFixed(6)}`,
      );
    }
  }
  if (newConfigs.length) execFileSync("bunx", ["biome", "format", "--write", ...newConfigs]);
}
