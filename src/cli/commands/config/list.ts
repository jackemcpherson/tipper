import { Command } from "commander";
import { listConfigIds, listResultFiles, loadCurrentPointer } from "../../../config/store.js";

export const listCommand = new Command("list")
  .description("List all configs with headline metric per config")
  .action(() => {
    const ids = listConfigIds();
    if (ids.length === 0) {
      console.log("No configs found in configs/.");
      return;
    }

    const current = loadCurrentPointer();

    for (const id of ids) {
      const results = listResultFiles(id);
      const isCurrent = current?.config_id === id;
      const marker = isCurrent ? " *" : "";
      const resultCount = results.length;
      console.log(`  ${id}${marker}  (${resultCount} result${resultCount === 1 ? "" : "s"})`);
    }

    if (current) {
      console.log(`\nCurrent: ${current.config_id}`);
    }
  });
