import { describe, expect, it } from "vitest";
import type { MatchRow } from "../../src/data/types.js";
import { deriveVenueHA } from "../../src/engine/venue.js";

function makeMatch(overrides: Partial<MatchRow>): MatchRow {
  return {
    id: 1,
    season_id: 1,
    round: "R1",
    round_number: 1,
    round_type: "Regular",
    date: "2024-01-01",
    local_time: "19:25",
    venue_id: 1,
    home_team_id: 100,
    away_team_id: 200,
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
    ...overrides,
  };
}

describe("deriveVenueHA", () => {
  it("derives positive HA for venue where home team consistently wins", () => {
    // 40 matches at venue 1, all with equal Elo, home wins by ~15 points
    const matches = Array.from({ length: 40 }, (_, i) => ({
      match: makeMatch({
        id: i,
        venue_id: 1,
        home_points: 75 + (i % 5),
        away_points: 60 + (i % 3),
      }),
      homeElo: 1500,
      awayElo: 1500,
    }));

    const venueNames = new Map([[1, "Test Ground"]]);
    const results = deriveVenueHA(matches, venueNames, 0.07, 30);

    expect(results).toHaveLength(1);
    expect(results[0]?.haPoints).toBeGreaterThan(0);
    expect(results[0]?.haElo).toBeGreaterThan(0);
    expect(results[0]?.nMatches).toBe(40);
    expect(results[0]?.venueName).toBe("Test Ground");
  });

  it("excludes venues below minimum match threshold", () => {
    const matches = Array.from({ length: 20 }, (_, i) => ({
      match: makeMatch({ id: i, venue_id: 2, home_points: 70, away_points: 60 }),
      homeElo: 1500,
      awayElo: 1500,
    }));

    const venueNames = new Map([[2, "Small Ground"]]);
    const results = deriveVenueHA(matches, venueNames, 0.07, 30);

    expect(results).toHaveLength(0);
  });

  it("handles multiple venues with different HA", () => {
    // Venue 1: strong home advantage (home always wins big)
    const venue1 = Array.from({ length: 35 }, (_, i) => ({
      match: makeMatch({ id: i, venue_id: 1, home_points: 100, away_points: 60 }),
      homeElo: 1500,
      awayElo: 1500,
    }));
    // Venue 2: neutral venue (home margin near 0)
    const venue2 = Array.from({ length: 35 }, (_, i) => ({
      match: makeMatch({
        id: 100 + i,
        venue_id: 2,
        home_points: 70 + (i % 2),
        away_points: 70 - (i % 2),
      }),
      homeElo: 1500,
      awayElo: 1500,
    }));

    const venueNames = new Map([
      [1, "Fortress"],
      [2, "Neutral"],
    ]);
    const results = deriveVenueHA([...venue1, ...venue2], venueNames, 0.07, 30);

    expect(results).toHaveLength(2);
    // Fortress should have much higher HA than Neutral
    const fortress = results.find((r) => r.venueName === "Fortress");
    const neutral = results.find((r) => r.venueName === "Neutral");
    expect(fortress?.haPoints).toBeGreaterThan(30);
    // Neutral venue has ~1 point HA due to alternating pattern
    expect(Math.abs(neutral?.haPoints ?? 99)).toBeLessThan(5);
  });

  it("ignores null-score matches in both the sums and the divisor (COR-13)", () => {
    // 35 played matches with a constant 15-point home margin, plus 5
    // unplayed (null-score) matches mixed in. The regression must see
    // n=35: dividing by 40 would deflate the means and report a HA of
    // 15 * 35/40 = 13.125 instead of 15.
    const played = Array.from({ length: 35 }, (_, i) => ({
      match: makeMatch({ id: i, venue_id: 1, home_points: 75, away_points: 60 }),
      homeElo: 1500,
      awayElo: 1500,
    }));
    const unplayed = Array.from({ length: 5 }, (_, i) => ({
      match: makeMatch({ id: 100 + i, venue_id: 1, home_points: null, away_points: null }),
      homeElo: 1500,
      awayElo: 1500,
    }));
    // Interleave so the fix can't depend on ordering
    const matches = [...played.slice(0, 20), ...unplayed, ...played.slice(20)];

    const venueNames = new Map([[1, "Mixed Ground"]]);
    const results = deriveVenueHA(matches, venueNames, 0.07, 30);

    expect(results).toHaveLength(1);
    expect(results[0]?.haPoints).toBeCloseTo(15, 6);
    expect(results[0]?.nMatches).toBe(35);
  });

  it("applies the minimum-match threshold to scored matches only", () => {
    // 32 matches at the venue but only 28 have scores — below the
    // threshold of 30, so the venue must be excluded.
    const matches = Array.from({ length: 32 }, (_, i) => ({
      match: makeMatch(
        i < 28
          ? { id: i, venue_id: 3, home_points: 70, away_points: 60 }
          : { id: i, venue_id: 3, home_points: null, away_points: null },
      ),
      homeElo: 1500,
      awayElo: 1500,
    }));

    const results = deriveVenueHA(matches, new Map([[3, "Sparse"]]), 0.07, 30);
    expect(results).toHaveLength(0);
  });

  it("controls for team strength via Elo differential", () => {
    // Mix of Elo differentials with consistent relationship
    // margin ~ 5 (HA) + 0.07 * eloDiff
    // With varying Elo diffs, regression should separate HA from Elo effect
    const matches = Array.from({ length: 40 }, (_, i) => {
      const eloDiff = (i - 20) * 10; // -200 to +190
      const margin = 5 + 0.07 * eloDiff; // True HA = 5
      return {
        match: makeMatch({
          id: i,
          venue_id: 1,
          home_points: Math.round(70 + margin / 2),
          away_points: Math.round(70 - margin / 2),
        }),
        homeElo: 1500 + eloDiff / 2,
        awayElo: 1500 - eloDiff / 2,
      };
    });

    const venueNames = new Map([[1, "Controlled"]]);
    const results = deriveVenueHA(matches, venueNames, 0.07, 30);

    // Intercept should be close to 5 (the true HA), not 5 + slope*meanEloDiff
    expect(results[0]?.haPoints).toBeCloseTo(5, 0);
  });
});
