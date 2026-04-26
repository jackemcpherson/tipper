import { Command } from "commander";
import { computeConfigHash, shortHash } from "../../config/hash.js";
import type { BacktestResultsFile } from "../../config/schema.js";
import { loadConfig, loadCurrentPointer, saveResults } from "../../config/store.js";
import { configOption, jsonOption, seasonOption } from "../flags.js";
import { formatHeader, formatMetrics } from "../format/human.js";

const WORKER_URL = "http://localhost:8787";

export const backtestCommand = new Command("backtest")
  .description("Run walk-forward backtest across historical seasons")
  .addOption(seasonOption)
  .addOption(configOption)
  .addOption(jsonOption)
  .action(async (opts: { season?: number[]; config?: string; json: boolean }) => {
    const configId = opts.config ?? loadCurrentPointer()?.config_id;
    if (!configId) {
      console.error("Error: No config specified and no current config set.");
      process.exit(1);
    }

    const config = loadConfig(configId);
    const configHash = await computeConfigHash(config);

    // Override test_seasons if --season provided
    const backtestConfig = opts.season
      ? { ...config, backtest: { ...config.backtest, test_seasons: opts.season } }
      : config;

    console.log(`Running backtest: ${configId} (${shortHash(configHash)})`);
    console.log(
      `Seasons: train=${backtestConfig.backtest.train_seasons.join(",")}, test=${backtestConfig.backtest.test_seasons.join(",")}`,
    );

    try {
      const response = await fetch(`${WORKER_URL}/backtest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backtestConfig),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error(`Error: ${(error as { error: string }).error}`);
        process.exit(1);
      }

      const result = (await response.json()) as {
        data_through: string;
        overall: {
          matches: number;
          tips: number;
          tip_pct: number;
          mae_margin: number;
          rmse_margin: number;
          log_loss_bits: number;
          brier: number;
        };
        by_season: Record<string, typeof result.overall>;
        calibration: Array<{ bucket: string; predicted: number; actual: number; n: number }>;
        predictions_count: number;
        skipped_matches: number;
      };

      // Save results file
      const resultsFile: BacktestResultsFile = {
        config_id: configId,
        config_hash: configHash,
        ran_at: new Date().toISOString(),
        data_through: result.data_through ?? "unknown",
        scope: { seasons: backtestConfig.backtest.test_seasons },
        overall: result.overall,
        by_season: result.by_season,
        calibration: result.calibration,
        matches: [],
      };
      const filename = saveResults(configId, resultsFile);

      if (opts.json) {
        console.log(JSON.stringify(resultsFile, null, 2));
      } else {
        const scope = `Backtest: ${backtestConfig.backtest.test_seasons.join(", ")}`;
        console.log(
          formatHeader(configId, shortHash(configHash), result.data_through ?? "unknown", scope),
        );
        console.log(
          formatMetrics(
            {
              matches: result.overall.matches,
              tips: result.overall.tips,
              tipPct: result.overall.tip_pct,
              maeMargin: result.overall.mae_margin,
              rmseMargin: result.overall.rmse_margin,
              logLossBits: result.overall.log_loss_bits,
              brier: result.overall.brier,
            },
            "Overall",
          ),
        );

        console.log("");
        for (const [year, metrics] of Object.entries(result.by_season).sort()) {
          console.log(
            `  ${year}: ${(metrics.tip_pct * 100).toFixed(1)}% (${metrics.tips}/${metrics.matches})  MAE: ${metrics.mae_margin.toFixed(2)}`,
          );
        }

        console.log(`\nResults saved: configs/${configId}/${filename}`);
      }
    } catch {
      console.error(
        `Error: Could not connect to worker at ${WORKER_URL}.\nStart the worker first: bunx wrangler dev --remote`,
      );
      process.exit(1);
    }
  });
