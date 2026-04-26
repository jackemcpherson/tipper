import { Command } from "commander";
import type { CurrentPointer } from "../../../config/schema.js";
import {
  loadCurrentPointer,
  saveCurrentPointer,
  validatePromotion,
} from "../../../config/store.js";
import { reasonOption } from "../../flags.js";

export const promoteCommand = new Command("promote")
  .description("Update _current.json to point to a config")
  .argument("<id>", "Config ID to promote")
  .addOption(reasonOption)
  .action(async (id: string, opts: { reason?: string }) => {
    const error = await validatePromotion(id, opts.reason ?? "");
    if (error) {
      console.error(`Error: ${error}`);
      process.exit(1);
    }

    const previousPointer = loadCurrentPointer();
    const pointer: CurrentPointer = {
      config_id: id,
      promoted_at: new Date().toISOString(),
      promoted_from: previousPointer?.config_id,
      promotion_reason: opts.reason ?? "",
    };

    saveCurrentPointer(pointer);
    console.log(`Promoted '${id}' as current config.`);
    if (previousPointer) {
      console.log(`Previous: ${previousPointer.config_id}`);
    }
  });
