import { Command } from "commander";
import { computeConfigHash, shortHash } from "../../../config/hash.js";
import { listResultFiles, loadConfig, loadResults } from "../../../config/store.js";

export const showCommand = new Command("show")
  .description("Pretty-print full config and most recent results")
  .argument("<id>", "Config ID")
  .action(async (id: string) => {
    const config = loadConfig(id);
    const hash = await computeConfigHash(config);

    console.log(`Config: ${config.id} (${shortHash(hash)})`);
    console.log("─".repeat(60));
    console.log(JSON.stringify(config, null, 2));

    const resultFiles = listResultFiles(id);
    const latestFile = resultFiles[0];
    if (latestFile) {
      const latest = loadResults(id, latestFile);
      console.log(`\nMost recent results: ${latestFile}`);
      console.log("─".repeat(60));
      console.log(`  Matches: ${latest.overall.matches}`);
      console.log(`  Tip %:   ${(latest.overall.tip_pct * 100).toFixed(1)}%`);
      console.log(`  MAE:     ${latest.overall.mae_margin.toFixed(2)}`);
      console.log(`  RMSE:    ${latest.overall.rmse_margin.toFixed(2)}`);
      console.log(`  Log loss: ${latest.overall.log_loss_bits.toFixed(4)} bits`);
      console.log(`  Brier:   ${latest.overall.brier.toFixed(4)}`);
    } else {
      console.log("\nNo backtest results yet.");
    }
  });
