import { describe, expect, it } from "vitest";
import {
  greatCircleKm,
  homeAdvantageBucket,
  travelFeatures,
  type VenueGeo,
} from "../../src/engine/geography.js";

describe("fixed geography rules", () => {
  const melbourne: VenueGeo = {
    latitude: -37.82,
    longitude: 144.9834,
    timezone: "Australia/Melbourne",
  };
  const perth: VenueGeo = { latitude: -31.9512, longitude: 115.8891, timezone: "Australia/Perth" };
  it("computes symmetric great-circle distance with an exact zero", () => {
    expect(greatCircleKm(melbourne, melbourne)).toBe(0);
    expect(greatCircleKm(melbourne, perth)).toBeGreaterThan(2700);
    expect(greatCircleKm(melbourne, perth)).toBeLessThan(2800);
    expect(greatCircleKm(melbourne, perth)).toBe(greatCircleKm(perth, melbourne));
    expect(() => greatCircleKm({ ...perth, latitude: null }, melbourne)).toThrow();
  });
  it("uses signed travel shift and counts displaced home teams", () => {
    const venues = new Map([
      [18, melbourne],
      [12, perth],
    ]);
    const east = travelFeatures("Carlton", "West Coast", 18, venues);
    expect(east.homeKm).toBe(0);
    expect(east.deltaKm).toBeGreaterThan(2700);
    expect(east.deltaTimezone).toBe(2);
    const displaced = travelFeatures("Carlton", "West Coast", 12, venues);
    expect(displaced.deltaKm).toBeLessThan(-2700);
    expect(displaced.deltaTimezone).toBe(2);
    expect(() => travelFeatures("Unknown", "Carlton", 18, venues)).toThrow();
  });
  it("matches the Task 22/33 shared-ground and secondary-ground definitions", () => {
    expect(homeAdvantageBucket("Carlton", "Collingwood", "MCG")).toBe("derby");
    expect(homeAdvantageBucket("Geelong", "Carlton", "Kardinia Park")).toBe("other");
    expect(homeAdvantageBucket("Carlton", "West Coast", "MCG")).toBe("true_home");
    expect(homeAdvantageBucket("Carlton", "West Coast", "Adelaide Oval")).toBe("neutral");
    expect(homeAdvantageBucket("Hawthorn", "West Coast", "UTAS Stadium")).toBe("other");
    expect(() => homeAdvantageBucket("Carlton", "West Coast", "Unknown")).toThrow();
  });
});
