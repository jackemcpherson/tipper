/**
 * Shared CLI flag definitions (fitzRoy-aligned where applicable).
 */

import { Option } from "commander";

export const seasonOption = new Option(
  "-s, --season <seasons>",
  "Season year(s), e.g. 2024 or 2021,2022,2023",
).argParser(parseSeasons);

export const roundOption = new Option("-r, --round <round>", "Round number").argParser(Number);

export const compOption = new Option("--comp <comp>", "Competition code").default("AFLM");

export const teamOption = new Option("-t, --team <team>", "Filter to a single team");

export const configOption = new Option("-c, --config <id>", "Config ID override");

export const jsonOption = new Option("-j, --json", "Output as JSON").default(false);

export const reasonOption = new Option("--reason <reason>", "Promotion reason (required)");

function parseSeasons(value: string): number[] {
  return value.split(",").map((s) => {
    const n = Number(s.trim());
    if (!Number.isInteger(n) || n < 1900 || n > 2100) {
      throw new Error(`Invalid season: ${s}`);
    }
    return n;
  });
}
