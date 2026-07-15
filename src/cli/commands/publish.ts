import { Command } from "commander";
import { computeConfigHash, shortHash } from "../../config/hash.js";
import { loadConfig, loadCurrentPointer } from "../../config/store.js";
import { fetchNextUnplayedRound } from "../../data/queries.js";
import type { CompetitionCode } from "../../data/types.js";
import { publishRound } from "../../orchestration.js";
import { resolveSeasonDataCache } from "../cache.js";
import { getDatabase } from "../db.js";
import { compOption, configOption, noCacheOption, roundOption, seasonOption } from "../flags.js";
import { formatHeader, formatPrediction } from "../format/human.js";

export const publishCommand = new Command("publish")
  .description(
    "Predict a round and upsert the results to the match_predictions D1 table. " +
      "Defaults to the current season's next unplayed round, so a scheduled run " +
      "needs no arguments. Requires a Cloudflare token with D1 write access.",
  )
  .addOption(seasonOption)
  .addOption(roundOption)
  .addOption(compOption)
  .addOption(configOption)
  .addOption(noCacheOption)
  .action(
    async (opts: {
      season?: number[];
      round?: number;
      comp: CompetitionCode;
      config?: string;
      cache: boolean;
    }) => {
      if (opts.season && opts.season.length !== 1) {
        console.error("Error: publish accepts exactly one --season value.");
        process.exit(1);
      }

      const configId = opts.config ?? loadCurrentPointer()?.config_id;
      if (!configId) {
        console.error("Error: No config specified and no current config set.");
        process.exit(1);
      }

      const config = loadConfig(configId);
      const configHash = await computeConfigHash(config);

      const db = getDatabase();

      // The AFL season never straddles a calendar-year boundary, so the
      // current UTC year is always the in-progress season.
      const targetYear = opts.season?.[0] ?? new Date().getUTCFullYear();

      let round = opts.round;
      if (round === undefined) {
        const nextRound = await fetchNextUnplayedRound(db, targetYear, opts.comp);
        if (nextRound === null) {
          console.error(
            `Error: No unplayed ${opts.comp} matches found for season ${targetYear}; ` +
              "nothing to publish. Pass --round to republish a completed round.",
          );
          process.exit(1);
        }
        round = nextRound;
      }

      const cache = resolveSeasonDataCache(opts.comp, opts.cache);
      // Shared pipeline with the Worker cron tick (test_seasons override,
      // model_version stamp, upsert) — see publishRound in orchestration.ts.
      const result = await publishRound(
        db,
        config,
        configId,
        configHash,
        targetYear,
        round,
        opts.comp,
        new Date().toISOString(),
        cache,
      );

      if (result.predictions.length === 0) {
        console.error(
          `Error: No predictions for ${opts.comp} round ${round}, ${targetYear}; nothing to publish.`,
        );
        process.exit(1);
      }

      const dataThrough = result.data_through ?? "unknown";
      const scope = `Round ${round}, ${targetYear} (${opts.comp}) — publishing to match_predictions`;
      console.log(formatHeader(configId, shortHash(configHash), dataThrough, scope));
      for (const p of result.predictions) {
        console.log(formatPrediction(p));
      }
      console.log(
        `\nUpserted ${result.written} prediction${result.written === 1 ? "" : "s"} ` +
          `(model_version: ${result.model_version}, generated_at: ${result.generated_at}).`,
      );
    },
  );
