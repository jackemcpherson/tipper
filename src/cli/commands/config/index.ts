import { Command } from "commander";
import { createCommand } from "./create.js";
import { currentCommand } from "./current.js";
import { diffCommand } from "./diff.js";
import { listCommand } from "./list.js";
import { promoteCommand } from "./promote.js";
import { showCommand } from "./show.js";

export const configCommand = new Command("config")
  .description("Manage model configs")
  .addCommand(listCommand)
  .addCommand(showCommand)
  .addCommand(currentCommand)
  .addCommand(promoteCommand)
  .addCommand(diffCommand)
  .addCommand(createCommand);
