import { describe, expect, it } from "vitest";
import {
  AccuracyTracker,
  adjustedScore,
  expectedPoints,
  shrunkAccuracy,
} from "../../src/research/challenger/adjusted-score.js";
import { paramsHash } from "../../src/research/challenger/frozen.js";
import {
  combine,
  DEFAULT_CHALLENGER,
  fitWeights,
  normalCdf,
  runChallenger,
} from "../../src/research/challenger/model.js";
import { estimateRating, PlayerRatings } from "../../src/research/challenger/player-ratings.js";
import { TeamRatings } from "../../src/research/challenger/team-ratings.js";
import { haversineKm, VenueModel } from "../../src/research/challenger/venue.js";
import type { Match, Reference, Season } from "../../src/research/data.js";

describe("accuracy-adjusted scores", () => {
  it("values shots at the expected conversion", () => {
    expect(expectedPoints(16, 0.5)).toBe(56);
    expect(expectedPoints(16, 1)).toBe(96);
  });
  it("gives an accurate and an inaccurate scoreline the same fully adjusted score", () => {
    const accurate = adjustedScore({ goals: 10, behinds: 2 }, 0.5, 0);
    const wasteful = adjustedScore({ goals: 6, behinds: 6 }, 0.5, 0);
    expect(accurate).toBe(wasteful);
    expect(adjustedScore({ goals: 10, behinds: 2 }, 0.5, 1)).toBe(62);
    expect(adjustedScore({ goals: 10, behinds: 2 }, 0.5, 0.5)).toBe((62 + 42) / 2);
  });
  it("shrinks a team's accuracy toward the competition rate", () => {
    expect(shrunkAccuracy(0, 0, 0.53, 100)).toBe(0.53);
    expect(shrunkAccuracy(60, 100, 0.5, 100)).toBeCloseTo(0.55, 10);
  });
  it("tracks team accuracy inside a season and resets between seasons", () => {
    const tracker = new AccuracyTracker({
      actualWeight: 0,
      teamShrinkShots: 10,
      leagueHalfLifeMatches: 1000,
    });
    tracker.record(1, { goals: 20, behinds: 0 });
    tracker.record(2, { goals: 0, behinds: 20 });
    expect(tracker.leagueAccuracy()).toBeCloseTo(0.5, 2);
    expect(tracker.expectedAccuracy(1)).toBeCloseTo(25 / 30, 2);
    expect(tracker.expectedAccuracy(2)).toBeCloseTo(5 / 30, 2);
    expect(tracker.adjusted(1, { goals: 10, behinds: 0 })).toBeCloseTo(10 * (1 + 5 * (25 / 30)), 1);
    tracker.newSeason();
    expect(tracker.expectedAccuracy(1)).toBe(tracker.expectedAccuracy(2));
  });
});

describe("team ratings", () => {
  it("moves attack up and the opponent's defence down when a team outscores expectation", () => {
    const teams = new TeamRatings({ k: 0.1, regression: 0.5, meanHalfLifeMatches: 100 });
    const expected = teams.expected(1, 2, 0);
    teams.update(
      1,
      2,
      expected,
      { home: expected.home + 20, away: expected.away },
      { home: 105, away: 85 },
    );
    expect(teams.rating(1).attack).toBeCloseTo(2, 10);
    expect(teams.rating(2).defence).toBeCloseTo(-2, 10);
    expect(teams.rating(1).defence).toBe(0);
    expect(teams.rating(2).attack).toBe(0);
    expect(teams.margin(1, 2)).toBeCloseTo(4, 10);
    teams.newSeason();
    expect(teams.rating(1).attack).toBeCloseTo(1, 10);
    expect([...teams.snapshot().keys()].sort()).toEqual([1, 2]);
  });
  it("splits the venue effect between the expected scores", () => {
    const teams = new TeamRatings();
    const e = teams.expected(1, 2, 8);
    expect(e.home - e.away).toBe(8);
  });
});

describe("player ratings", () => {
  it("weights recent matches more and shrinks toward the prior", () => {
    expect(estimateRating([], 5, { decay: 0.9, priorWeight: 2 })).toBe(5);
    const recentHigh = estimateRating([0, 20], 5, { decay: 0.5, priorWeight: 1 });
    const recentLow = estimateRating([20, 0], 5, { decay: 0.5, priorWeight: 1 });
    expect(recentHigh).toBeGreaterThan(recentLow);
    expect(recentHigh).toBeCloseTo((5 + 20 + 0) / 2.5, 10);
  });
  it("never treats a missing observation as zero", () => {
    const players = new PlayerRatings({ decay: 0.9, window: 5, priorWeight: 1, prior: 6 });
    players.record(1, null);
    expect(players.games(1)).toBe(0);
    expect(players.estimate(1)).toBe(6);
    players.record(1, 12);
    expect(players.estimate(1)).toBe(9);
    expect(players.lineupStrength([1, 2])).toBe(15);
  });
  it("tracks debut ratings as the prior when none is fixed", () => {
    const players = new PlayerRatings({ decay: 0.9, window: 5, priorWeight: 1, prior: null });
    const before = players.prior();
    players.record(7, 30);
    expect(players.prior()).toBeGreaterThan(before);
  });
});

const reference: Reference = {
  fetchedAt: "2026-01-01T00:00:00.000Z",
  venues: [
    { id: 18, name: "MCG", latitude: -37.82, longitude: 144.9834, canonical_venue_id: 18 },
    {
      id: 12,
      name: "Perth Stadium",
      latitude: -31.9512,
      longitude: 115.8891,
      canonical_venue_id: 12,
    },
    { id: 6, name: "Subiaco", latitude: -31.9442, longitude: 115.8299, canonical_venue_id: 6 },
    {
      id: 17606,
      name: "Domain Stadium",
      latitude: -31.9442,
      longitude: 115.8299,
      canonical_venue_id: 6,
    },
  ],
  teams: [
    { id: 3, name: "West Coast", abbreviation: "WCE" },
    { id: 13, name: "Melbourne", abbreviation: "MELB" },
  ],
};

const match = (overrides: Partial<Match>): Match => ({
  id: 1,
  season_id: 1,
  year: 2025,
  round_number: 1,
  round_type: "Regular",
  round: "Round 1",
  date: "2025-03-15",
  local_time: "19:30:00",
  kickoff_at: null,
  lineups_observed_at: null,
  venue_id: 18,
  external_afl_id: null,
  home_team_id: 13,
  away_team_id: 3,
  home_goals: 12,
  home_behinds: 10,
  home_points: 82,
  away_goals: 10,
  away_behinds: 8,
  away_points: 68,
  status: "Complete",
  ...overrides,
});

describe("venue effect", () => {
  it("measures great-circle distance", () => {
    expect(
      haversineKm(
        { latitude: -37.82, longitude: 144.9834 },
        { latitude: -31.9512, longitude: 115.8891 },
      ),
    ).toBeCloseTo(2700, -2);
  });
  it("charges the travelling side and credits venue experience through aliases", () => {
    const venue = new VenueModel(reference, {
      homeAdvantage: 6,
      travelK: 0.1,
      travelExponent: 0.5,
      experienceK: 1,
      experienceExponent: 0.5,
      experienceOffset: 0,
      homeStateKm: 300,
    });
    venue.record(match({ year: 2024, venue_id: 17606, home_team_id: 3, away_team_id: 13 }));
    const effect = venue.effect(match({ venue_id: 6, home_team_id: 3, away_team_id: 13 }));
    expect(effect.homeAdvantage).toBe(6);
    expect(effect.homeTravelKm).toBeLessThan(10);
    expect(effect.awayTravelKm).toBeGreaterThan(2000);
    expect(effect.travel).toBeGreaterThan(0);
    expect(effect.homeExperience).toBe(1);
    expect(effect.awayExperience).toBe(1);
    expect(effect.total).toBeCloseTo(6 + effect.travel + effect.experience, 10);
    expect(venue.experience(3, 6, 2030)).toBe(0);
  });
  it("removes home advantage from a Grand Final played away from the home state", () => {
    const venue = new VenueModel(reference);
    const effect = venue.effect(
      match({ round: "Grand Final", venue_id: 18, home_team_id: 3, away_team_id: 13 }),
    );
    expect(effect.homeAdvantage).toBe(0);
    expect(venue.effect(match({ round: "Grand Final" })).homeAdvantage).toBe(8);
  });
});

describe("challenger model", () => {
  it("clamps probabilities and combines components with the configured weights", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
    const venue = {
      homeAdvantage: 4,
      travel: 0,
      experience: 0,
      total: 4,
      homeTravelKm: 0,
      awayTravelKm: 0,
      homeExperience: 0,
      awayExperience: 0,
    };
    const out = combine(
      { teamMargin: 10, playerDiff: 5, playerRelativeDiff: 2, venue },
      { weights: { team: 1, player: 0.5 }, playerMode: "relative", sigma: 30 },
    );
    expect(out.margin).toBe(15);
    expect(out.homeProbability).toBeCloseTo(normalCdf(0.5), 10);
    expect(
      combine({ teamMargin: 1000, playerDiff: 0, playerRelativeDiff: 0, venue }, DEFAULT_CHALLENGER)
        .homeProbability,
    ).toBe(0.99);
  });
  it("predicts chronologically from prior results only", () => {
    const season = (year: number, matches: Match[]): Season => ({
      competition: "AFLM",
      year,
      fetchedAt: "2026-01-01T00:00:00.000Z",
      matches,
      stats: matches
        .filter((m) => m.status === "Complete")
        .flatMap((m) => [
          {
            match_id: m.id,
            player_id: 100 + m.id,
            team_id: m.home_team_id,
            rating_points: 12,
            time_on_ground_pct: 80,
            goals: 1,
            behinds: 0,
            hitouts: 0,
            goal_assists: 0,
            inside_fifties: 0,
            marks_inside_fifty: 0,
            free_kicks_for: 0,
            free_kicks_against: 0,
            rebounds: 0,
            one_percenters: 0,
            marks: 0,
            clearances: 0,
            tackles: 0,
          },
          {
            match_id: m.id,
            player_id: 200 + m.id,
            team_id: m.away_team_id,
            rating_points: 6,
            time_on_ground_pct: 80,
            goals: 1,
            behinds: 0,
            hitouts: 0,
            goal_assists: 0,
            inside_fifties: 0,
            marks_inside_fifty: 0,
            free_kicks_for: 0,
            free_kicks_against: 0,
            rebounds: 0,
            one_percenters: 0,
            marks: 0,
            clearances: 0,
            tackles: 0,
          },
        ]),
      lineups: [],
      pav: [],
    });
    const first = match({ id: 1, date: "2025-03-15" });
    const second = match({ id: 2, date: "2025-03-22", home_team_id: 3, away_team_id: 13 });
    const sameDay = match({ id: 3, date: "2025-03-22", home_team_id: 13, away_team_id: 3 });
    const upcoming = match({
      id: 4,
      date: "2025-03-29",
      status: "Upcoming",
      home_points: null,
      away_points: null,
      home_goals: null,
      home_behinds: null,
      away_goals: null,
      away_behinds: null,
    });
    const predictions = runChallenger(
      [season(2025, [first, second, sameDay, upcoming])],
      reference,
      DEFAULT_CHALLENGER,
      { predictFrom: 2025 },
    );
    expect(predictions.map((p) => p.match.id)).toEqual([1, 2, 3, 4]);
    const [p1, p2, p3, p4] = predictions;
    expect(p1?.teamMargin).toBe(0);
    expect(p1?.home.attack).toBe(0);
    // Melbourne won the first match, so it is rated above West Coast before the second.
    expect(p2?.teamMargin).toBeLessThan(0);
    // Two matches on one date see the same state.
    expect(p3?.teamMargin).toBeCloseTo(-(p2?.teamMargin ?? 0), 10);
    expect(p4?.match.status).toBe("Upcoming");
    expect(p4?.lineupSource).toBe("none");
    expect(p4?.playerDiff).toBe(0);
    expect(p2?.lineupSource).toBe("played");
    const fit = fitWeights(predictions, "sum");
    expect(fit.n).toBe(3);
    expect(Number.isFinite(fit.sigma)).toBe(true);
  });
  it("hashes structural parameters and the fit", () => {
    expect(paramsHash(DEFAULT_CHALLENGER)).toHaveLength(12);
    expect(paramsHash({ ...DEFAULT_CHALLENGER, sigma: 30 })).not.toBe(
      paramsHash(DEFAULT_CHALLENGER),
    );
  });
});
