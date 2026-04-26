import { Command } from "commander";
import type { Config } from "../../../config/schema.js";
import { loadConfig, saveConfig } from "../../../config/store.js";

export const createCommand = new Command("create")
  .description("Scaffold a new config by copying an existing one")
  .argument("<id>", "New config ID (kebab-case)")
  .requiredOption("--from <existing-id>", "Existing config ID to copy from")
  .action((id: string, opts: { from: string }) => {
    if (!/^[a-z0-9-]+$/.test(id)) {
      console.error("Error: Config ID must be kebab-case (a-z, 0-9, hyphens only).");
      process.exit(1);
    }

    const source = loadConfig(opts.from);
    const newConfig: Config = { ...source, id };
    saveConfig(newConfig);
    console.log(`Created config '${id}' from '${opts.from}'.`);
    console.log(`Edit configs/${id}/config.json to adjust parameters.`);
  });
