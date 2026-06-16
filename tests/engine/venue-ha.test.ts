import { describe, expect, it } from "vitest";
import {
  createVenueHaPredState,
  getVenueHaPred,
  updateVenueHaPred,
} from "../../src/engine/venue-ha.js";

describe("per-venue prediction HGA (Task 38a)", () => {
  it("returns 0 for unknown venues when state is empty", () => {
    const state = createVenueHaPredState();
    expect(getVenueHaPred(state, 1, 1, 5)).toBe(0);
  });

  it("falls back to global mean when venue has fewer than min_n updates", () => {
    const state = createVenueHaPredState();
    // Venue 1 accumulates +10 across 3 matches (below min_n=5).
    updateVenueHaPred(state, 1, 10);
    updateVenueHaPred(state, 1, 10);
    updateVenueHaPred(state, 1, 10);
    // Venue 2 accumulates −2 across 7 matches (above min_n=5).
    for (let i = 0; i < 7; i++) updateVenueHaPred(state, 2, -2);
    // Global mean = (30 − 14) / 10 = 1.6
    // Venue 1 has n=3 < min_n=5, returns global mean 1.6.
    expect(getVenueHaPred(state, 1, 1, 5)).toBeCloseTo(1.6, 10);
    // Venue 2 has n=7 ≥ min_n=5; α=1 → its own mean, −2.
    expect(getVenueHaPred(state, 2, 1, 5)).toBeCloseTo(-2, 10);
  });

  it("alpha=1 uses the venue mean directly (no shrinkage)", () => {
    const state = createVenueHaPredState();
    for (let i = 0; i < 10; i++) updateVenueHaPred(state, 1, 8);
    for (let i = 0; i < 10; i++) updateVenueHaPred(state, 2, -4);
    // Global mean = (80 − 40) / 20 = 2
    expect(getVenueHaPred(state, 1, 1, 5)).toBeCloseTo(8, 10);
    expect(getVenueHaPred(state, 2, 1, 5)).toBeCloseTo(-4, 10);
  });

  it("alpha=0.5 mixes venue mean with global mean 50/50", () => {
    const state = createVenueHaPredState();
    for (let i = 0; i < 10; i++) updateVenueHaPred(state, 1, 8);
    for (let i = 0; i < 10; i++) updateVenueHaPred(state, 2, -4);
    // Global mean = 2. Shrunk venue 1 = 0.5×8 + 0.5×2 = 5.
    expect(getVenueHaPred(state, 1, 0.5, 5)).toBeCloseTo(5, 10);
    // Shrunk venue 2 = 0.5×(−4) + 0.5×2 = −1.
    expect(getVenueHaPred(state, 2, 0.5, 5)).toBeCloseTo(-1, 10);
  });

  it("alpha=0 collapses to the global mean", () => {
    const state = createVenueHaPredState();
    for (let i = 0; i < 10; i++) updateVenueHaPred(state, 1, 8);
    for (let i = 0; i < 10; i++) updateVenueHaPred(state, 2, -4);
    expect(getVenueHaPred(state, 1, 0, 5)).toBeCloseTo(2, 10);
    expect(getVenueHaPred(state, 2, 0, 5)).toBeCloseTo(2, 10);
  });

  it("min_n=0 always uses the venue's own mean once it has updates", () => {
    const state = createVenueHaPredState();
    updateVenueHaPred(state, 1, 12);
    expect(getVenueHaPred(state, 1, 1, 0)).toBeCloseTo(12, 10);
  });
});
