import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createSeasonDataCache } from "../../src/cli/cache.js";
import type { MatchRow } from "../../src/data/types.js";
import type { SeasonData } from "../../src/orchestration.js";

function makeMatch(id: number): MatchRow {
  return {
    id,
    season_id: 1,
    round: "R1",
    round_number: 1,
    round_type: "Regular",
    date: "2024-03-15",
    local_time: "19:30",
    venue_id: 1,
    home_team_id: 1,
    away_team_id: 2,
    home_goals: 10,
    home_behinds: 8,
    home_points: 68,
    away_goals: 8,
    away_behinds: 6,
    away_points: 54,
    margin: 14,
    attendance: null,
    weather_temp_c: null,
    weather_type: null,
    external_afl_id: null,
  };
}

function seasonData(): SeasonData {
  return { matches: [makeMatch(1), makeMatch(2)], lineups: [], stats: [] };
}

describe("createSeasonDataCache (OPT-02)", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "tipper-cache-test-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("round-trips a historical season", () => {
    const cache = createSeasonDataCache("AFLM", dir, 2026);
    const data = seasonData();

    expect(cache.get(2024)).toBeUndefined();
    cache.set(2024, data);
    expect(cache.get(2024)).toEqual(data);
  });

  it("never caches the current (or future) season", () => {
    const cache = createSeasonDataCache("AFLM", dir, 2026);

    cache.set(2026, seasonData());
    expect(cache.get(2026)).toBeUndefined();
    cache.set(2027, seasonData());
    expect(cache.get(2027)).toBeUndefined();
  });

  it("keys by competition so AFLW data never leaks into AFLM", () => {
    const aflm = createSeasonDataCache("AFLM", dir, 2026);
    const aflw = createSeasonDataCache("AFLW", dir, 2026);

    aflm.set(2024, seasonData());
    expect(aflw.get(2024)).toBeUndefined();
  });

  it("treats corrupt or unrecognised cache files as misses", () => {
    const cache = createSeasonDataCache("AFLM", dir, 2026);

    writeFileSync(join(dir, "AFLM-2023.json"), "not json{");
    expect(cache.get(2023)).toBeUndefined();

    writeFileSync(join(dir, "AFLM-2022.json"), JSON.stringify({ version: 99 }));
    expect(cache.get(2022)).toBeUndefined();
  });
});
