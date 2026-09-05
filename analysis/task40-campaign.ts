/** Execute the committed registration. Config/result writes are create-only. */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { computeConfigHash } from "../src/config/hash.js";
import { type Config, ConfigSchema } from "../src/config/schema.js";
import { runHarness } from "../src/engine/harness.js";
import { computeCalibration, computeMetrics } from "../src/engine/metrics.js";
import { deriveVenueHA } from "../src/engine/venue.js";
import type { OverallMetrics } from "../src/types.js";
import { loadSnapshot, seasonIds, selectData } from "./task40-data.js";

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
  add("t40-cdf", "F", baseline, (c) => {
    c.output.probability_model = "standard_normal";
  });
  for (const sigma of [32, 40])
    add(`t40-sigma-${String(sigma).padStart(3, "0")}`, "F", baseline, (c) => {
      c.output.sigma = sigma;
    });
  add("t40-finals-ha", "E", baseline, (c) => {
    c.output.finals_home_advantage = 0;
  });
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
  data.venueGeoById = new Map(extra.venues.map((v: { id: number }) => [v.id, v]));
  const engineCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const entries = candidates().filter(
    (entry) =>
      (!family || entry.family === family || entry.family === "control") &&
      (!ids || ids.includes(entry.id) || entry.family === "control"),
  );
  for (const entry of entries) {
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
      else writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, { flag: "wx" });
      if (existsSync(resultPath)) {
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
}
