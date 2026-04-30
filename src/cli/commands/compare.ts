import { Command, Option } from "commander";
import { loadConfig } from "../../config/store.js";
import { runCompare } from "../../orchestration.js";
import { getDatabase } from "../db.js";
import { jsonOption } from "../flags.js";

const configAOption = new Option("--config-a <id>", "Config ID for model A").makeOptionMandatory();
const configBOption = new Option("--config-b <id>", "Config ID for model B").makeOptionMandatory();

export const compareCommand = new Command("compare")
  .description("Bootstrap-compare two configs (paired by match)")
  .addOption(configAOption)
  .addOption(configBOption)
  .addOption(jsonOption)
  .action(async (opts: { configA: string; configB: string; json: boolean }) => {
    const configA = loadConfig(opts.configA);
    const configB = loadConfig(opts.configB);

    console.log(`Comparing: ${opts.configA} vs ${opts.configB}`);
    console.log(`Test seasons: ${configA.backtest.test_seasons.join(", ")}`);

    const db = getDatabase();
    const result = await runCompare(db, configA, configB);

    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`\nMatches: ${result.configA.matches}`);
      console.log(`Bootstrap: ${result.nBootstrap} iterations, seed=${result.seed}\n`);

      console.log(
        "  Metric      | A          | B          | Delta      | 95% CI              | Sig?",
      );
      console.log(
        "  ------------|------------|------------|------------|---------------------|-----",
      );

      const fmtPct = (v: number) => `${(v * 100).toFixed(1)}%`.padStart(10);
      const fmt4 = (v: number) => v.toFixed(4).padStart(10);

      const d = result.deltas;
      const tipDelta = d.tipPct;
      const llDelta = d.logLossBits;
      const brDelta = d.brier;

      if (tipDelta) {
        console.log(
          `  Tip%        | ${fmtPct(result.configA.tipPct)} | ${fmtPct(result.configB.tipPct)} ` +
            `| ${fmtPct(tipDelta.point)} | [${fmtPct(tipDelta.ci95[0])}, ` +
            `${fmtPct(tipDelta.ci95[1])}] | ${tipDelta.excludesZero ? "YES" : "no"}`,
        );
      }
      if (llDelta) {
        console.log(
          `  LogLoss     | ${fmt4(result.configA.logLossBits)} | ` +
            `${fmt4(result.configB.logLossBits)} | ${fmt4(llDelta.point)} | ` +
            `[${fmt4(llDelta.ci95[0])}, ${fmt4(llDelta.ci95[1])}] | ` +
            `${llDelta.excludesZero ? "YES" : "no"}`,
        );
      }
      if (brDelta) {
        console.log(
          `  Brier       | ${fmt4(result.configA.brier)} | ${fmt4(result.configB.brier)} ` +
            `| ${fmt4(brDelta.point)} | [${fmt4(brDelta.ci95[0])}, ` +
            `${fmt4(brDelta.ci95[1])}] | ${brDelta.excludesZero ? "YES" : "no"}`,
        );
      }

      console.log("");
      console.log(
        "  Delta = A - B. Negative LogLoss/Brier = A is better. Positive Tip% = A is better.",
      );
      console.log("  Sig? = 95% CI excludes zero.");
    }
  });
