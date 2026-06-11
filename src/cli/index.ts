#!/usr/bin/env node

import { createRequire } from "node:module";
import { program } from "commander";
import { backtestCommand } from "./commands/backtest.js";
import { calibrateCommand } from "./commands/calibrate.js";
import { compareCommand } from "./commands/compare.js";
import { configCommand } from "./commands/config/index.js";
import { predictCommand } from "./commands/predict.js";

// Single source of truth for the version: package.json sits two levels
// above this file both in src/cli/ and in the compiled dist/cli/.
const { version } = createRequire(import.meta.url)("../../package.json") as { version: string };

program
  .name("tipper")
  .description("AFL match prediction CLI — MOV-Elo + PAV ratings")
  .version(version);

program.addCommand(configCommand);
program.addCommand(backtestCommand);
program.addCommand(calibrateCommand);
program.addCommand(compareCommand);
program.addCommand(predictCommand);

try {
  await program.parseAsync(process.argv);
} catch (error) {
  // Async command actions reject here; print a clean message instead of
  // an unhandled-rejection stack trace.
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\x1b[31mError: ${message}\x1b[0m`);
  process.exit(1);
}
