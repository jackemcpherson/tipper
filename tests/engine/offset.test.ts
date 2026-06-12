import { describe, expect, it } from "vitest";
import {
  createTeamOffsetState,
  decayTeamOffsets,
  getTeamOffset,
  updateTeamOffsets,
} from "../../src/engine/offset.js";

describe("team offsets", () => {
  it("returns 0 for unknown teams", () => {
    const state = createTeamOffsetState();
    expect(getTeamOffset(state, 1, 32)).toBe(0);
  });

  it("splits the residual half to each side with opposite signs", () => {
    const state = createTeamOffsetState();
    updateTeamOffsets(state, 1, 2, 20);
    // home: sum +10, n 0.5 → 10 / (0.5 + k)
    expect(getTeamOffset(state, 1, 32)).toBeCloseTo(10 / 32.5, 10);
    expect(getTeamOffset(state, 2, 32)).toBeCloseTo(-10 / 32.5, 10);
  });

  it("shrinks toward the running mean as evidence accumulates", () => {
    const state = createTeamOffsetState();
    for (let i = 0; i < 100; i++) {
      updateTeamOffsets(state, 1, 2, -20);
    }
    // sum −10/match over 50 effective games: −1000/(50+8); asymptote is the
    // full mean residual (−20), approached but never exceeded
    expect(getTeamOffset(state, 1, 8)).toBeCloseTo(-1000 / 58, 6);
    expect(getTeamOffset(state, 1, 8)).toBeGreaterThan(-20);
  });

  it("decays evidence at season boundaries", () => {
    const state = createTeamOffsetState();
    updateTeamOffsets(state, 1, 2, 20);
    const before = getTeamOffset(state, 1, 32);
    decayTeamOffsets(state, 0.5);
    // sum 10→5, n 0.5→0.25 → 5/32.25
    expect(getTeamOffset(state, 1, 32)).toBeCloseTo(5 / 32.25, 10);
    expect(Math.abs(getTeamOffset(state, 1, 32))).toBeLessThan(Math.abs(before));
    decayTeamOffsets(state, 0);
    expect(getTeamOffset(state, 1, 32)).toBe(0);
  });
});
