/** Freeze read-only campaign inputs; replay never touches D1 or the CLI cache. */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createSeasonDataCache } from "../src/cli/cache.js";
import { getDatabase } from "../src/cli/db.js";
import type { Config } from "../src/config/schema.js";
import type { HarnessData } from "../src/engine/harness.js";
import { fetchHarnessData } from "../src/orchestration.js";

export const snapshotPath = process.env.TASK40_SNAPSHOT ?? "/tmp/tipper-task40-data.json";

export function loadSnapshot(): HarnessData {
  return JSON.parse(readFileSync(snapshotPath, "utf8"), (_key, value: unknown) => {
    if (value !== null && typeof value === "object" && "task40Map" in value) {
      return new Map(value.task40Map as [unknown, unknown][]);
    }
    return value;
  }).harnessData as HarnessData;
}

/** Match the legacy orchestration's year and prior selection exactly. */
export function selectData(data: HarnessData, config: Config, completePriors = false): HarnessData {
  const start = Math.min(...config.backtest.train_seasons);
  const end = Math.max(...config.backtest.test_seasons);
  const years = new Set(config.backtest.test_seasons.map((year) => year - 1));
  return {
    ...data,
    matches: data.matches.filter((match) => {
      const year = data.seasonYearById.get(match.season_id);
      return year !== undefined && year >= start && year <= end;
    }),
    priorPavBySeason: new Map(
      [...data.priorPavBySeason].filter(([id]) => {
        const year = data.seasonYearById.get(id);
        return year !== undefined && year >= start && (completePriors || years.has(year));
      }),
    ),
  };
}

export function seasonIds(data: HarnessData, years: number[]): Set<number> {
  const ids = [...data.seasonYearById].filter(([, year]) => years.includes(year));
  if (ids.length !== years.length) throw new Error(`Missing seasons: ${years}`);
  return new Set(ids.map(([id]) => id));
}

if (import.meta.main) {
  if (existsSync(snapshotPath)) throw new Error(`Refusing to overwrite ${snapshotPath}`);
  const cache = createSeasonDataCache("AFLM");
  const years = Array.from({ length: 17 }, (_, index) => 2010 + index);
  const fetched = await fetchHarnessData(getDatabase(), years, years, "AFLM", {
    get: cache.get,
    set: () => {},
  });
  const serialized = JSON.stringify(
    { capturedAt: new Date().toISOString(), ...fetched },
    (_key, value: unknown) => (value instanceof Map ? { task40Map: [...value] } : value),
  );
  writeFileSync(snapshotPath, serialized, { flag: "wx" });
  console.log(
    JSON.stringify({
      path: snapshotPath,
      sha256: createHash("sha256").update(serialized).digest("hex"),
      matches: fetched.matches.length,
      dataThrough: fetched.latestDate,
    }),
  );
}
