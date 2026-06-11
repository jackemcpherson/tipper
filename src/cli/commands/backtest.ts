import { Command } from "commander";
import { computeConfigHash, shortHash } from "../../config/hash.js";
import type { BacktestResultsFile } from "../../config/schema.js";
import { loadConfig, loadCurrentPointer, saveResults } from "../../config/store.js";
import type { CompetitionCode } from "../../data/types.js";
import { runBacktest } from "../../orchestration.js";
import { resolveSeasonDataCache } from "../cache.js";
import { getDatabase } from "../db.js";
import { compOption, configOption, jsonOption, noCacheOption, seasonOption } from "../flags.js";
import { formatHeader, formatMetrics } from "../format/human.js";

export const backtestCommand = new Command("backtest")
  .description("Run walk-forward backtest across historical seasons")
  .addOption(seasonOption)
  .addOption(compOption)
  .addOption(configOption)
  .addOption(jsonOption)
  .addOption(noCacheOption)
  .action(
    async (opts: {
      season?: number[];
      comp: CompetitionCode;
      config?: string;
      json: boolean;
      cache: boolean;
    }) => {
      const configId = opts.config ?? loadCurrentPointer()?.config_id;
      if (!configId) {
        console.error("Error: No config specified and no current config set.");
        process.exit(1);
      }

      const config = loadConfig(configId);

      const backtestConfig = opts.season
        ? { ...config, backtest: { ...config.backtest, test_seasons: opts.season } }
        : config;

      // Hash the *effective* config: a --season-overridden run stores a hash
      // that can never match the on-disk config, so cherry-picked scopes can't
      // satisfy the promotion guardrail (COR-09).
      const configHash = await computeConfigHash(backtestConfig);
      if (opts.season) {
        console.log(
          "Note: --season overrides the config's test_seasons; this run is not valid for promotion.",
        );
      }

      console.log(`Running backtest: ${configId} (${shortHash(configHash)})`);
      console.log(
        `Seasons: train=${backtestConfig.backtest.train_seasons.join(",")}, ` +
          `test=${backtestConfig.backtest.test_seasons.join(",")}`,
      );

      const db = getDatabase();
      const cache = resolveSeasonDataCache(opts.comp, opts.cache);
      const result = await runBacktest(db, backtestConfig, opts.comp, cache);

      const resultsFile: BacktestResultsFile = {
        config_id: configId,
        config_hash: configHash,
        ran_at: new Date().toISOString(),
        data_through: result.data_through ?? "unknown",
        scope: { seasons: backtestConfig.backtest.test_seasons },
        overall: result.overall,
        by_season: result.by_season,
        calibration: result.calibration,
        matches: result.matches ?? [],
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
            `  ${year}: ${(metrics.tip_pct * 100).toFixed(1)}% ` +
              `(${metrics.tips}/${metrics.matches})  MAE: ${metrics.mae_margin.toFixed(2)}`,
          );
        }

        console.log(`\nResults saved: configs/${configId}/${filename}`);
      }
    },
  );
