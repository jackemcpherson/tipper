import { afterEach, describe, expect, it, vi } from "vitest";
import { createD1RestClient } from "../../src/data/d1-rest.js";
import * as queries from "../../src/data/queries.js";
import type { MatchRow, PlayerSeasonPavRow } from "../../src/data/types.js";
import {
  runBacktest,
  runCompare,
  runPrediction,
  type SeasonData,
} from "../../src/orchestration.js";
import { BAKED_CONFIG } from "../../src/worker/baked-config.js";

/** One match per season, with a prior-sensitive home lineup. */
function seasonData(year: number): SeasonData {
  const match: MatchRow = {
    id: year,
    season_id: year,
    round: "R1",
    round_number: 1,
    round_type: "Regular",
    date: `${year}-03-15`,
    local_time: "19:30",
    venue_id: 1,
    home_team_id: 1,
    away_team_id: 2,
    home_goals: 10,
    home_behinds: 10,
    home_points: 70,
    away_goals: 5,
    away_behinds: 5,
    away_points: 35,
    margin: 35,
    attendance: null,
    external_afl_id: null,
  };
  return {
    matches: [match],
    stats: [],
    lineups: [1, 2].map((team) => ({
      id: team,
      match_id: year,
      team_id: team,
      player_id: team,
      guernsey_number: team,
      position: "C",
      is_emergency: 0,
      is_substitute: 0,
    })),
  };
}

describe("scoped comparison warmup", () => {
  afterEach(() => vi.restoreAllMocks());

  it("agrees with separate backtests when gap priors update residual offsets", async () => {
    vi.spyOn(queries, "fetchSeasons").mockImplementation(async (_db, years) =>
      years.map((year) => ({ id: year, year, competition_id: 1 })),
    );
    vi.spyOn(queries, "fetchTeams").mockResolvedValue([
      { id: 1, name: "Alpha", abbreviation: "A", competition_id: 1 },
      { id: 2, name: "Beta", abbreviation: "B", competition_id: 1 },
    ]);
    vi.spyOn(queries, "fetchVenues").mockResolvedValue([{ id: 1, name: "Oval" }]);
    vi.spyOn(queries, "fetchLatestMatchDate").mockResolvedValue("2022-03-15");
    vi.spyOn(queries, "fetchPlayerDobs").mockResolvedValue(new Map());
    const prior = vi.spyOn(queries, "fetchPriorSeasonPav").mockImplementation(async (_db, year) => {
      const row: PlayerSeasonPavRow = {
        id: year,
        season_id: year,
        team_id: 1,
        player_id: 1,
        off_pav: 50,
        mid_pav: 40,
        def_pav: 30,
        total_pav: 120,
      };
      return [row];
    });
    const config = {
      ...BAKED_CONFIG,
      output: { ...BAKED_CONFIG.output, team_offset: { k: 8, season_carry: 1 } },
      backtest: { ...BAKED_CONFIG.backtest, train_seasons: [2020], test_seasons: [2022] },
    };
    const db = createD1RestClient("test", "test", "test");
    const cache = { get: seasonData, set: () => {} };
    const baseline = await runBacktest(db, config, "AFLM", cache);
    prior.mockClear();
    const compared = await runCompare(db, config, config, "AFLM", 10, 42, cache);
    expect(compared.configA.logLossBits).toBe(baseline.overall.log_loss_bits);
    expect(compared.configB.maeMargin).toBe(baseline.overall.mae_margin);
    expect(compared.deltas.tipPct.point).toBe(0);
    expect(prior.mock.calls.map((call) => call[1]).sort()).toEqual([2020, 2021]);
    const live = await runPrediction(db, config, 2022, 1, "AFLM", cache);
    expect(live.capture_inputs.lineups).toEqual(seasonData(2022).lineups);
    expect(live.capture_inputs.matches).toEqual(seasonData(2022).matches);
  });
});
