import { Command } from "commander";
import { computeConfigHash, shortHash } from "../../config/hash.js";
import { loadConfig, loadCurrentPointer } from "../../config/store.js";
import { runPrediction } from "../../orchestration.js";
import { getDatabase } from "../db.js";
import { configOption, jsonOption, roundOption, seasonOption, teamOption } from "../flags.js";
import { formatHeader, formatPrediction } from "../format/human.js";
import { formatPredictionsJson } from "../format/json.js";

export const predictCommand = new Command("predict")
  .description("Predict match outcomes for a specific round")
  .addOption(seasonOption)
  .addOption(roundOption)
  .addOption(teamOption)
  .addOption(configOption)
  .addOption(jsonOption)
  .action(
    async (opts: {
      season?: number[];
      round?: number;
      team?: string;
      config?: string;
      json: boolean;
    }) => {
      if (!opts.season || opts.season.length !== 1) {
        console.error("Error: predict requires exactly one --season value.");
        process.exit(1);
      }
      if (opts.round === undefined) {
        console.error("Error: predict requires --round.");
        process.exit(1);
      }

      const configId = opts.config ?? loadCurrentPointer()?.config_id;
      if (!configId) {
        console.error("Error: No config specified and no current config set.");
        process.exit(1);
      }

      const config = loadConfig(configId);
      const configHash = await computeConfigHash(config);

      const targetYear = opts.season[0];
      if (targetYear === undefined) {
        process.exit(1);
      }

      const predictConfig = {
        ...config,
        backtest: {
          ...config.backtest,
          test_seasons: [targetYear],
        },
      };

      const db = getDatabase();
      const result = await runPrediction(db, predictConfig, targetYear, opts.round);

      let predictions = result.predictions;
      if (opts.team) {
        const team = opts.team.toLowerCase();
        predictions = predictions.filter(
          (p) => p.home.toLowerCase().includes(team) || p.away.toLowerCase().includes(team),
        );
      }

      const dataThrough = result.data_through ?? "unknown";

      if (opts.json) {
        console.log(formatPredictionsJson(predictions, configId, configHash, dataThrough));
      } else {
        const scope = `Round ${opts.round}, ${targetYear} — predictions`;
        console.log(formatHeader(configId, shortHash(configHash), dataThrough, scope));
        for (const p of predictions) {
          console.log(formatPrediction(p));
        }
      }
    },
  );
