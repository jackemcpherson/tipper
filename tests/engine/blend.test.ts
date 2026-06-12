import { describe, expect, it } from "vitest";
import type { Config } from "../../src/config/schema.js";
import { computeTeamRating, type TeamPavSums } from "../../src/engine/blend.js";

const basBlend: Config["blend"] = {
  weight_elo: 0.6,
  pav_calibration_slope: 6.986,
  where: "team_rating",
};

const pav: TeamPavSums = { off: 90, mid: 110, def: 70, total: 270 };

describe("computeTeamRating", () => {
  it("uses the global slope on the total when no zone slopes are set", () => {
    const rating = computeTeamRating(1500, pav, basBlend);
    expect(rating).toBeCloseTo(0.6 * 1500 + 0.4 * (6.986 * 270), 8);
  });

  it("equal zone slopes reproduce the global slope exactly", () => {
    const zoned: Config["blend"] = {
      ...basBlend,
      pav_zone_slopes: { off: 6.986, mid: 6.986, def: 6.986 },
    };
    expect(computeTeamRating(1500, pav, zoned)).toBeCloseTo(
      computeTeamRating(1500, pav, basBlend),
      10,
    );
  });

  it("distinct zone slopes weight zones independently", () => {
    const zoned: Config["blend"] = {
      ...basBlend,
      pav_zone_slopes: { off: 10, mid: 5, def: 2 },
    };
    const rating = computeTeamRating(1500, pav, zoned);
    expect(rating).toBeCloseTo(0.6 * 1500 + 0.4 * (10 * 90 + 5 * 110 + 2 * 70), 8);
  });
});
