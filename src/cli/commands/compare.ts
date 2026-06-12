import { Command, Option } from "commander";
import { loadConfig } from "../../config/store.js";
import type { CompetitionCode } from "../../data/types.js";
import { runCompare } from "../../orchestration.js";
import { resolveSeasonDataCache } from "../cache.js";
import { getDatabase } from "../db.js";
import { compOption, jsonOption, noCacheOption, seasonOption } from "../flags.js";

const configAOption = new Option(
  "-a, --config-a <id>",
  "Config ID for model A",
).makeOptionMandatory();
const configBOption = new Option(
  "-b, --config-b <id>",
  "Config ID for model B",
).makeOptionMandatory();

export const compareCommand = new Command("compare")
  .description("Bootstrap-compare two configs (paired by match)")
  .addOption(configAOption)
  .addOption(configBOption)
  .addOption(seasonOption)
  .addOption(compOption)
  .addOption(jsonOption)
  .addOption(noCacheOption)
  .action(
    async (opts: {
      configA: string;
      configB: string;
      season?: number[];
      comp: CompetitionCode;
      json: boolean;
      cache: boolean;
    }) => {
      let configA = loadConfig(opts.configA);
      let configB = loadConfig(opts.configB);

      if (opts.season) {
        configA = { ...configA, backtest: { ...configA.backtest, test_seasons: opts.season } };
        configB = { ...configB, backtest: { ...configB.backtest, test_seasons: opts.season } };
        console.log("Note: --season overrides both configs' test_seasons.");
      }

      console.log(`Comparing: ${opts.configA} vs ${opts.configB}`);
      console.log(`Test seasons: ${configA.backtest.test_seasons.join(", ")}`);

      const db = getDatabase();
      const cache = resolveSeasonDataCache(opts.comp, opts.cache);
      const result = await runCompare(db, configA, configB, opts.comp, undefined, undefined, cache);

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
    },
  );
