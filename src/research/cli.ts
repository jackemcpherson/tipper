import { parseArgs } from "node:util";
import { challengerCandidate, challengerCommands } from "./challenger/commands.js";
import {
  baselineCommand,
  type CandidateProvider,
  type Command,
  commandFetch,
  commandField,
  reportCommand,
} from "./harness.js";

/**
 * Research command line. Candidate models register here; the harness itself
 * never depends on one model.
 */
const CANDIDATES: readonly CandidateProvider[] = [challengerCandidate];

const COMMANDS: Record<string, Command> = {
  fetch: commandFetch,
  field: commandField,
  baseline: baselineCommand(CANDIDATES),
  report: reportCommand(CANDIDATES),
  ...challengerCommands,
};

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      from: { type: "string" },
      to: { type: "string" },
      "fit-to": { type: "string" },
      year: { type: "string" },
      season: { type: "string" },
      round: { type: "string" },
      days: { type: "string" },
      json: { type: "string" },
      candidate: { type: "string" },
      refresh: { type: "boolean" },
      full: { type: "boolean" },
      games: { type: "boolean" },
      verbose: { type: "boolean" },
    },
  });
  const command = positionals[0] ?? "";
  const run = COMMANDS[command];
  if (!run) {
    console.error(`Usage: bun run research <${Object.keys(COMMANDS).join("|")}> [options]`);
    process.exit(2);
  }
  await run(values);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
