/**
 * Plan 008, frozen in report commit 00b8508 before results.
 * Slope gates: |km slope|>=1 point/1000km or |timezone slope|>=1.5/hour,
 * primary 95% CI excludes zero, early sign replicates.
 * Close gate: primary CI excludes zero, early sign replicates.
 * Report both the plan's final weaker GO rule (close direction only) and
 * its two-test stronger rule. Neither rule is changed after execution.
 */
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { TEAM_STATE, travelFeatures, VENUE_STATE, type VenueGeo } from "../src/engine/geography.js";
import { createPrng } from "../src/engine/prng.js";
import { loadSnapshot } from "./task40-data.js";
import { loadResult } from "./task40-score.js";

const data = loadSnapshot();
const venues: ({ id: number } & VenueGeo)[] = JSON.parse(
  readFileSync("/tmp/tipper-task40-extra.json", "utf8"),
).venues;
const geo = new Map(venues.map((v) => [v.id, v]));
const matches = new Map(data.matches.map((m) => [m.id, m]));
function slope(rows: { x: number; y: number }[]): number {
  const meanX = rows.reduce((s, r) => s + r.x, 0) / rows.length;
  const meanY = rows.reduce((s, r) => s + r.y, 0) / rows.length;
  const variance = rows.reduce((s, r) => s + (r.x - meanX) ** 2, 0);
  return variance > 0 ? rows.reduce((s, r) => s + (r.x - meanX) * (r.y - meanY), 0) / variance : 0;
}
assert.equal(
  slope([
    { x: 1, y: 5 },
    { x: 2, y: 8 },
    { x: 3, y: 11 },
  ]),
  3,
);
function bootstrap<T>(rows: T[], statistic: (rows: T[]) => number) {
  assert(rows.length > 0);
  const rand = createPrng(42);
  const samples = [];
  for (let iteration = 0; iteration < 1000; iteration++) {
    const selected = Array.from({ length: rows.length }, () => {
      const row = rows[Math.floor(rand() * rows.length)];
      assert(row !== undefined);
      return row;
    });
    samples.push(statistic(selected));
  }
  samples.sort((a, b) => a - b);
  const lo = samples[25];
  const hi = samples[975];
  assert(lo !== undefined && hi !== undefined);
  return { point: statistic(rows), ci95: [lo, hi], excludesZero: lo > 0 || hi < 0 };
}
const output = [];
for (const [window, id] of [
  ["primary", "t40-baseline"],
  ["early", "t40-baseline-early"],
  ["2026", "t40-baseline-2026"],
] as const) {
  const predictions = await loadResult(id);
  const rows = predictions.map((p) => {
    const match = matches.get(p.matchId);
    assert(match);
    const features = travelFeatures(p.home, p.away, match.venue_id, geo);
    const venueState = VENUE_STATE[p.venue];
    assert(venueState);
    const homeTravelled = TEAM_STATE[p.home] !== venueState;
    const awayTravelled = TEAM_STATE[p.away] !== venueState;
    return {
      ...p,
      ...features,
      residual: (p.actualMargin ?? 0) - p.predictedMargin,
      bucket: homeTravelled
        ? awayTravelled
          ? "both_travelled"
          : "home_travelled"
        : awayTravelled
          ? "away_travelled"
          : "both_local",
    };
  });
  const km = bootstrap(
    rows.map((r) => ({ x: r.deltaKm / 1000, y: r.residual })),
    slope,
  );
  const timezone = bootstrap(
    rows.map((r) => ({ x: r.deltaTimezone, y: r.residual })),
    slope,
  );
  const close = rows.filter((r) => Math.abs(r.predictedMargin) < 12 && r.actualMargin !== 0);
  const distances = close.map((r) => Math.abs(r.deltaKm)).sort((a, b) => a - b);
  const threshold = distances[Math.floor(0.75 * distances.length)];
  assert(threshold !== undefined);
  const labelled = close.map((r) => ({
    high: Math.abs(r.deltaKm) >= threshold,
    correct: Number(r.correct === true),
  }));
  const closeDifference = bootstrap(labelled, (sample) => {
    const high = sample.filter((r) => r.high);
    const rest = sample.filter((r) => !r.high);
    return (
      high.reduce((s, r) => s + r.correct, 0) / high.length -
      rest.reduce((s, r) => s + r.correct, 0) / rest.length
    );
  });
  const buckets = Object.fromEntries(
    ["both_local", "away_travelled", "home_travelled", "both_travelled"].map((bucket) => {
      const selected = rows.filter((r) => r.bucket === bucket);
      return [
        bucket,
        {
          n: selected.length,
          meanHomeKm: selected.reduce((s, r) => s + r.homeKm, 0) / selected.length,
          meanAwayKm: selected.reduce((s, r) => s + r.awayKm, 0) / selected.length,
        },
      ];
    }),
  );
  output.push({
    window,
    n: rows.length,
    mappedVenues: new Set(rows.map((r) => r.venue)).size,
    km,
    timezone,
    closeDifference,
    threshold,
    closeN: close.length,
    highN: labelled.filter((r) => r.high).length,
    buckets,
  });
}
const [primary, early] = output;
assert(primary && early);
const kmPass =
  Math.abs(primary.km.point) >= 1 &&
  primary.km.excludesZero &&
  primary.km.point * early.km.point > 0;
const tzPass =
  Math.abs(primary.timezone.point) >= 1.5 &&
  primary.timezone.excludesZero &&
  primary.timezone.point * early.timezone.point > 0;
const closeDirection = primary.closeDifference.point * early.closeDifference.point > 0;
const tests = {
  kmPass,
  tzPass,
  closeDirection,
  closePass: primary.closeDifference.excludesZero && closeDirection,
  planVerdict: (kmPass || tzPass) && closeDirection ? "GO" : "NO-GO",
  strictVerdict:
    (kmPass || tzPass) && closeDirection && primary.closeDifference.excludesZero ? "GO" : "NO-GO",
};
const pooledBuckets = Object.fromEntries(
  Object.keys(primary.buckets).map((bucket) => [
    bucket,
    (primary.buckets[bucket]?.n ?? 0) + (early.buckets[bucket]?.n ?? 0),
  ]),
);
// T26 continuity is an observed check, not permission to redefine travel flags.
const continuity = {
  historicalExpected: {
    away_travelled: 1115,
    home_travelled: 17,
    both_travelled: 165,
    both_local: 593,
  },
  observed: pooledBuckets,
};
assert.deepEqual(continuity.observed, continuity.historicalExpected);
const result = {
  output,
  tests,
  continuity,
  fixedOffsets: "AEST10 ACST9.5 AWST8, no DST; signed venue-minus-base shift",
  highCut: "within-window close-set 75th percentile, ties included",
};
writeFileSync("analysis/task40-travel-results.json", `${JSON.stringify(result, null, 2)}\n`, {
  flag: "wx",
});
console.log(JSON.stringify(result, null, 2));
