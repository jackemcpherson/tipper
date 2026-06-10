import { Command } from "commander";
import { loadConfig, loadCurrentPointer } from "../../config/store.js";
import type { CompetitionCode } from "../../data/types.js";
import { runCalibration } from "../../orchestration.js";
import { getDatabase } from "../db.js";
import { compOption, configOption, jsonOption } from "../flags.js";

export const calibrateCommand = new Command("calibrate")
  .description(
    "Derive the recommended PAV calibration slope from the config's train seasons " +
      "(test seasons are never used for fitting)",
  )
  .addOption(compOption)
  .addOption(configOption)
  .addOption(jsonOption)
  .action(async (opts: { comp: CompetitionCode; config?: string; json: boolean }) => {
    const configId = opts.config ?? loadCurrentPointer()?.config_id;
    if (!configId) {
      console.error("Error: No config specified and no current config set.");
      process.exit(1);
    }

    const config = loadConfig(configId);
    const db = getDatabase();
    const result = await runCalibration(db, config, opts.comp);

    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(
      `Calibration for ${configId} (fit on train seasons: ${config.backtest.train_seasons.join(", ")})`,
    );
    console.log(`  Data points: ${result.data_points}`);
    console.log(
      `  Recommended pav_calibration_slope: ${result.regression.recommended_pav_calibration_slope.toFixed(4)}`,
    );
    console.log(
      `  PAV/Elo diff correlation: ${result.complementarity.pav_elo_diff_correlation.toFixed(3)} ` +
        `(${result.complementarity.note})`,
    );
  });
