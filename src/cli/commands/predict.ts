import { Command } from "commander";
import { computeConfigHash, shortHash } from "../../config/hash.js";
import { loadConfig, loadCurrentPointer } from "../../config/store.js";
import {
  WORKER_URL,
  configOption,
  jsonOption,
  roundNumberOption,
  seasonOption,
  teamOption,
} from "../flags.js";
import { formatHeader, formatPrediction } from "../format/human.js";
import { formatPredictionsJson } from "../format/json.js";

export const predictCommand = new Command("predict")
  .description("Predict match outcomes for a specific round")
  .addOption(seasonOption)
  .addOption(roundNumberOption)
  .addOption(teamOption)
  .addOption(configOption)
  .addOption(jsonOption)
  .action(
    async (opts: {
      season?: number[];
      roundNumber?: number;
      team?: string;
      config?: string;
      json: boolean;
    }) => {
      if (!opts.season || opts.season.length !== 1) {
        console.error("Error: predict requires exactly one --season value.");
        process.exit(1);
      }
      if (opts.roundNumber === undefined) {
        console.error("Error: predict requires --round-number.");
        process.exit(1);
      }

      const configId = opts.config ?? loadCurrentPointer()?.config_id;
      if (!configId) {
        console.error("Error: No config specified and no current config set.");
        process.exit(1);
      }

      const config = loadConfig(configId);
      const configHash = await computeConfigHash(config);

      // Build a config that includes all seasons from train through target
      const targetYear = opts.season[0];
      if (targetYear === undefined) {
        console.error("Error: predict requires exactly one --season value.");
        process.exit(1);
      }

      const predictConfig = {
        ...config,
        backtest: {
          ...config.backtest,
          train_seasons: config.backtest.train_seasons,
          test_seasons: [targetYear],
        },
      };

      try {
        const response = await fetch(`${WORKER_URL}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            config: predictConfig,
            season: targetYear,
            round_number: opts.roundNumber,
            team: opts.team,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error(`Error: ${(error as { error: string }).error}`);
          process.exit(1);
        }

        const result = (await response.json()) as {
          predictions: Array<{
            home: string;
            away: string;
            venue: string;
            predictedMargin: number;
            predictedWinner: string;
            winProbability: { home: number; away: number };
          }>;
          data_through: string;
        };

        let predictions = result.predictions;
        if (opts.team) {
          const team = opts.team.toLowerCase();
          predictions = predictions.filter(
            (p) => p.home.toLowerCase().includes(team) || p.away.toLowerCase().includes(team),
          );
        }

        if (opts.json) {
          console.log(
            formatPredictionsJson(predictions as never, configId, configHash, result.data_through),
          );
        } else {
          const scope = `Round ${opts.roundNumber}, ${targetYear} — predictions`;
          console.log(formatHeader(configId, shortHash(configHash), result.data_through, scope));
          for (const p of predictions) {
            console.log(formatPrediction(p as never));
          }
        }
      } catch {
        console.error(
          `Error: Could not connect to worker at ${WORKER_URL}.\nStart the worker first: bunx wrangler dev --remote`,
        );
        process.exit(1);
      }
    },
  );
