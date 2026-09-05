import { expect, it } from "vitest";
import {
  decayTeamVenue,
  type TeamVenueState,
  teamVenueAdjustment,
  updateTeamVenue,
} from "../../src/engine/team-venue.js";

it("attributes half residuals, isolates venues and decays evidence", () => {
  const state: TeamVenueState = new Map();
  expect(teamVenueAdjustment(state, 1, 10, 20, 32)).toBe(0);
  updateTeamVenue(state, 1, 10, 20, 66);
  expect(teamVenueAdjustment(state, 1, 10, 20, 32)).toBe(2);
  expect(teamVenueAdjustment(state, 2, 10, 20, 32)).toBe(0);
  expect(teamVenueAdjustment(state, 1, 20, 10, 32)).toBe(-2);
  decayTeamVenue(state, 0.5);
  expect(teamVenueAdjustment(state, 1, 10, 20, 32)).toBeCloseTo(33 / 32.5, 12);
  decayTeamVenue(state, 0);
  expect(teamVenueAdjustment(state, 1, 10, 20, 32)).toBe(0);
});
