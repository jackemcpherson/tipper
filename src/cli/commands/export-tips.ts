import { writeFileSync } from "node:fs";
import { Command, Option } from "commander";
import { loadConfig, loadCurrentPointer } from "../../config/store.js";
import type { CompetitionCode } from "../../data/types.js";
import { runPrediction } from "../../orchestration.js";
import { resolveGameIds } from "../../squiggle.js";
import { resolveSeasonDataCache } from "../cache.js";
import { getDatabase } from "../db.js";
import { compOption, configOption, noCacheOption, roundOption, seasonOption } from "../flags.js";
import { formatTipsForComp } from "../format/comp.js";
import { diskCachedRoundGames } from "../squiggle-games.js";

const outOption = new Option("-o, --out <file>", "Write output to file instead of stdout");

export const exportTipsCommand = new Command("export-tips")
  .description("Export round predictions in Squiggle comp format (dry-run, no submission)")
  .addOption(seasonOption)
  .addOption(roundOption)
  .addOption(compOption)
  .addOption(configOption)
  .addOption(noCacheOption)
  .addOption(outOption)
  .option("--with-gameid", "Resolve canonical Squiggle game and tipped-team ids")
  .action(
    async (opts: {
      season?: number[];
      round?: number;
      comp: CompetitionCode;
      config?: string;
      cache: boolean;
      out?: string;
      withGameid?: boolean;
    }) => {
      if (!opts.season || opts.season.length !== 1) {
        console.error("Error: export-tips requires exactly one --season value.");
        process.exit(1);
      }
      if (opts.round === undefined) {
        console.error("Error: export-tips requires --round.");
        process.exit(1);
      }

      if (opts.withGameid && opts.comp !== "AFLM")
        throw new Error("Squiggle game ids support AFLM only");

      const configId = opts.config ?? loadCurrentPointer()?.config_id;
      if (!configId) {
        console.error("Error: No config specified and no current config set.");
        process.exit(1);
      }

      const config = loadConfig(configId);

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
      const cache = resolveSeasonDataCache(opts.comp, opts.cache);
      const result = await runPrediction(
        db,
        predictConfig,
        targetYear,
        opts.round,
        opts.comp,
        cache,
      );

      const games = opts.withGameid ? await diskCachedRoundGames(targetYear, opts.round) : null;
      const resolved = resolveGameIds(result.predictions, games ?? []);
      const payload = formatTipsForComp(result.predictions, targetYear, resolved);

      if (opts.out) {
        writeFileSync(opts.out, payload, "utf-8");
        console.log(`Written to ${opts.out}`);
      } else {
        console.log(payload);
      }
    },
  );
