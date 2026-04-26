import { Command } from "commander";
import { loadCurrentPointer } from "../../../config/store.js";

export const currentCommand = new Command("current")
  .description("Print current config ID and promotion reason")
  .action(() => {
    const pointer = loadCurrentPointer();
    if (!pointer) {
      console.log("No current config set. Use 'tipper config promote <id>' to set one.");
      return;
    }

    console.log(`Current config: ${pointer.config_id}`);
    console.log(`Promoted at:    ${pointer.promoted_at}`);
    if (pointer.promoted_from) {
      console.log(`Promoted from:  ${pointer.promoted_from}`);
    }
    console.log(`Reason:         ${pointer.promotion_reason}`);
  });
