import { readFileSync, writeFileSync } from "node:fs";
import { Command } from "commander";
import { z } from "zod";
import { fetchTrialArchive } from "../../data/trial.js";
import { scoreTrial, TrialArchiveSchema } from "../../trial/score.js";
import { getDatabase } from "../db.js";

export const trialCommand = new Command("trial")
  .description("Score frozen at-lock v3 versus OD captures; never promote automatically")
  .option("--season <year>", "Season, default current year", String(new Date().getFullYear()))
  .option("--archive <file>", "Read a local archive instead of D1")
  .option("--include-finals", "Diagnostic all-round score; cannot return PROMOTE")
  .option("--out <file>", "Write JSON to a file")
  .action(
    async (opts: { season: string; archive?: string; includeFinals?: boolean; out?: string }) => {
      const season = z.coerce.number().int().min(1900).max(2100).parse(opts.season);
      const archive = opts.archive
        ? TrialArchiveSchema.parse(JSON.parse(readFileSync(opts.archive, "utf8")))
        : await fetchTrialArchive(getDatabase(), season);
      const output = `${JSON.stringify(scoreTrial(archive, season, new Date(), opts.includeFinals), null, 2)}\n`;
      if (opts.out) writeFileSync(opts.out, output);
      else console.log(output);
    },
  );
