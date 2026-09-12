import { describe, expect, it } from "vitest";
import { candidateEntry, fieldEntries, rankAmong } from "../../src/research/benchmark.js";
import { loadField, mapGames, squiggleName } from "../../src/research/field.js";
import {
  calibration,
  correlation,
  scoreForecast,
  summarise,
  tipOf,
} from "../../src/research/scoring.js";

describe("Squiggle scoring", () => {
  it("awards the tip and log-score bits for a correct favourite", () => {
    const s = scoreForecast({ homeProbability: 0.75, homeMargin: 20 }, 12);
    expect(s.tip).toBe(1);
    expect(s.bits).toBeCloseTo(1 + Math.log2(0.75), 10);
    expect(s.error).toBe(8);
    expect(s.correct).toBe(true);
  });
  it("penalises a wrong tip with the losing side's probability", () => {
    const s = scoreForecast({ homeProbability: 0.6893, homeMargin: 16.6 }, -5);
    expect(s.tip).toBe(0);
    expect(s.bits).toBeCloseTo(1 + Math.log2(1 - 0.6893), 10);
    expect(s.error).toBeCloseTo(21.6, 10);
  });
  it("gives every tipster the tip on a draw and scores the margin against zero", () => {
    const s = scoreForecast({ homeProbability: 0.2215, homeMargin: -27.2 }, 0);
    expect(s.tip).toBe(1);
    expect(s.bits).toBeCloseTo(1 + 0.5 * Math.log2(0.2215 * 0.7785), 10);
    expect(s.error).toBeCloseTo(27.2, 10);
    expect(s.correct).toBeNull();
  });
  it("tips by margin sign and falls back to probability at zero", () => {
    expect(tipOf({ homeProbability: 0.4, homeMargin: 1 })).toBe("home");
    expect(tipOf({ homeProbability: 0.4, homeMargin: 0 })).toBe("away");
    expect(tipOf({ homeProbability: 0.5, homeMargin: 0 })).toBe("home");
  });
  it("rejects probabilities outside the open interval", () => {
    expect(() => scoreForecast({ homeProbability: 1, homeMargin: 1 }, 1)).toThrow();
  });
  it("summarises decisive accuracy, draws and probability diagnostics", () => {
    const s = summarise([
      { homeProbability: 0.7, homeMargin: 10, actual: 5 },
      { homeProbability: 0.7, homeMargin: 10, actual: -5 },
      { homeProbability: 0.5, homeMargin: 0, actual: 0 },
    ]);
    expect(s.matches).toBe(3);
    expect(s.draws).toBe(1);
    expect(s.decisive).toBe(2);
    expect(s.decisiveCorrect).toBe(1);
    expect(s.tips).toBe(2);
    expect(s.mae).toBeCloseTo(20 / 3, 10);
    expect(s.brier).toBeCloseTo((0.09 + 0.49 + 0) / 3, 10);
    expect(s.logLoss).toBeCloseTo((-Math.log(0.7) - Math.log(0.3) - Math.log(0.5)) / 3, 10);
  });
  it("buckets calibration by the favoured side", () => {
    const buckets = calibration([
      { homeProbability: 0.72, homeMargin: 10, actual: 3 },
      { homeProbability: 0.28, homeMargin: -10, actual: 3 },
    ]);
    expect(buckets).toEqual([{ bucket: "70-80%", forecast: 0.72, observed: 0.5, n: 2 }]);
  });
  it("computes correlation", () => {
    expect(correlation([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 10);
    expect(correlation([1, 2, 3], [3, 2, 1])).toBeCloseTo(-1, 10);
    expect(correlation([1], [1])).toBeNull();
  });
});

describe("stored 2026 field", () => {
  it("reproduces Squiggle's own tips, bits and errors from probabilities and margins", async () => {
    const field = await loadField(2026);
    const games = new Map(field.games.map((g) => [g.id, g]));
    let checked = 0;
    let inconsistent = 0;
    for (const tip of field.tips) {
      const game = games.get(tip.gameid);
      if (
        !game ||
        game.complete !== 100 ||
        game.hscore === null ||
        game.ascore === null ||
        tip.hconfidence === null ||
        tip.hmargin === null ||
        tip.correct === null ||
        tip.bits === null ||
        tip.err === null
      )
        continue;
      const p = tip.hconfidence / 100;
      if (!(p > 0 && p < 1)) continue;
      // Squiggle scores the named tip. Tipper models always name the side their margin favours,
      // so field rows whose named tip contradicts their margin sign are outside this check.
      if (tip.hmargin === 0 || tip.hmargin > 0 !== (tip.tip === tip.hteam)) {
        inconsistent++;
        continue;
      }
      const s = scoreForecast(
        { homeProbability: p, homeMargin: tip.hmargin },
        game.hscore - game.ascore,
      );
      expect(s.tip).toBe(tip.correct);
      expect(s.bits).toBeCloseTo(tip.bits, 3);
      expect(s.error).toBeCloseTo(tip.err, 1);
      checked++;
    }
    expect(checked).toBeGreaterThan(6000);
    expect(inconsistent).toBeLessThan(100);
  });
  it("scores the stored field and ranks complete-coverage sources", async () => {
    const field = await loadField(2026);
    const results = field.games
      .filter((g) => g.complete === 100 && g.hscore !== null && g.ascore !== null)
      .map((g) => ({ gameId: g.id, actual: (g.hscore ?? 0) - (g.ascore ?? 0) }));
    expect(results).toHaveLength(214);
    const entries = fieldEntries(field, results);
    const wheelo = entries.find((e) => e.name === "Wheelo Ratings");
    expect(wheelo?.tips).toBe(157);
    expect(wheelo?.bits).toBeCloseTo(50.95, 1);
    expect(wheelo?.mae).toBeCloseTo(24.79, 1);
    expect(wheelo?.complete).toBe(true);
    const massey = entries.find((e) => e.name === "Massey Ratings");
    expect(massey?.complete).toBe(false);
    const candidate = candidateEntry(
      "perfect",
      new Map(results.map((r) => [r.gameId, { homeProbability: 0.99, homeMargin: r.actual }])),
      results,
    );
    expect(rankAmong(candidate, entries, "tips").rank).toBe(1);
    expect(rankAmong(candidate, entries, "mae").rank).toBe(1);
  });
  it("maps database matches to Squiggle games by round and names", async () => {
    const field = await loadField(2026);
    const teams = [
      { id: 9, name: "GWS Giants", abbreviation: "GWS" },
      { id: 1, name: "St Kilda", abbreviation: "STK" },
    ];
    const game = field.games.find(
      (g) => g.round === 2 && g.hteam === "Greater Western Sydney" && g.ateam === "St Kilda",
    );
    expect(game).toBeDefined();
    const match = {
      id: 1,
      season_id: 1,
      year: 2026,
      round_number: 2,
      round_type: "Regular",
      round: "Round 2",
      date: "2026-03-20",
      local_time: null,
      kickoff_at: null,
      lineups_observed_at: null,
      venue_id: null,
      external_afl_id: null,
      home_team_id: 9,
      away_team_id: 1,
      home_goals: null,
      home_behinds: null,
      home_points: null,
      away_goals: null,
      away_behinds: null,
      away_points: null,
      status: "Complete",
    };
    expect(mapGames([match], teams, field.games).get(1)).toBe(game?.id);
    expect(squiggleName("GWS Giants")).toBe("Greater Western Sydney");
  });
});
