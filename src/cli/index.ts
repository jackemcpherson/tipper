#!/usr/bin/env node

import { program } from "commander";
import { backtestCommand } from "./commands/backtest.js";
import { compareCommand } from "./commands/compare.js";
import { configCommand } from "./commands/config/index.js";
import { predictCommand } from "./commands/predict.js";

program
  .name("tipper")
  .description("AFL match prediction CLI — MOV-Elo + PAV ratings")
  .version("3.0.0");

program.addCommand(configCommand);
program.addCommand(backtestCommand);
program.addCommand(compareCommand);
program.addCommand(predictCommand);

program.parse();
