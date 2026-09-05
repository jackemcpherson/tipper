/** Training-only method-of-moments gain and survivor-inclusive age-zone fit. */
import assert from "node:assert/strict";
import type { HarnessData } from "../src/engine/harness.js";
import { ageAtDate } from "../src/engine/prior.js";

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const variance = (xs: number[]) => {
  const m = mean(xs);
  return xs.reduce((sum, x) => sum + (x - m) ** 2, 0) / (xs.length - 1);
};

export function fitGain(data: HarnessData) {
  const groups = new Map<string, number[]>();
  for (const m of data.matches) {
    const year = data.seasonYearById.get(m.season_id) ?? 0;
    if (year < 2010 || year > 2014 || m.home_points === null || m.away_points === null) continue;
    const margin = m.home_points - m.away_points - 10;
    for (const [team, value] of [
      [m.home_team_id, margin],
      [m.away_team_id, -margin],
    ]) {
      const key = `${team}:${year}`;
      const values = groups.get(key) ?? [];
      values.push(value as number);
      groups.set(key, values);
    }
  }
  const residuals = [...groups.values()].flatMap((xs) => xs.map((x) => x - mean(xs)));
  const r = residuals.reduce((s, x) => s + x * x, 0) / (residuals.length - groups.size);
  const pairs: { x: number; y: number; sampling: number }[] = [];
  for (const [key, xs] of groups) {
    const [team, year] = key.split(":");
    const ys = groups.get(`${team}:${Number(year) + 1}`);
    if (ys) pairs.push({ x: mean(xs), y: mean(ys), sampling: r / xs.length + r / ys.length });
  }
  const q = Math.max(0, variance(pairs.map((p) => p.y - p.x)) - mean(pairs.map((p) => p.sampling)));
  const p = (-q + Math.sqrt(q * q + 4 * q * r)) / 2;
  const rawGain = (p + q) / (p + q + r);
  const gain = Math.max(0.01, Math.min(0.15, rawGain));
  const mx = mean(pairs.map((p) => p.x));
  const my = mean(pairs.map((p) => p.y));
  const slope =
    pairs.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) /
    pairs.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  const rtm = Math.max(0, Math.min(1, 1 - slope));
  assert([r, q, rawGain, gain, slope, rtm].every(Number.isFinite));
  return {
    fitYears: [2010, 2011, 2012, 2013, 2014],
    groups: groups.size,
    pairs: pairs.length,
    r,
    q,
    rawGain,
    gain,
    slope,
    rtm,
  };
}

export function fitAgeZones(data: HarnessData) {
  const seasons = new Map(
    [...data.priorPavBySeason].map(([id, rows]) => [data.seasonYearById.get(id), rows]),
  );
  const buckets = Array.from({ length: 4 }, () => ({
    n: 0,
    exited: 0,
    before: [0, 0, 0],
    after: [0, 0, 0],
  }));
  for (let year = 2010; year < 2014; year++) {
    const before = seasons.get(year);
    const after = seasons.get(year + 1);
    assert(before?.length && after?.length, `Missing age fit season ${year}`);
    const next = new Map(after.map((p) => [p.player_id, p]));
    const date = data.matches.find((m) => data.seasonYearById.get(m.season_id) === year + 1)?.date;
    assert(date);
    for (const row of before) {
      const dob = data.dobByPlayerId.get(row.player_id);
      if (!dob) continue;
      const age = ageAtDate(dob, date);
      const b = buckets[age <= 22 ? 0 : age <= 27 ? 1 : age <= 31 ? 2 : 3];
      assert(b);
      b.n++;
      const n = next.get(row.player_id);
      if (!n) b.exited++;
      for (const [i, key] of ["off_pav", "mid_pav", "def_pav"].entries()) {
        b.before[i] = (b.before[i] ?? 0) + (row[key as "off_pav"] ?? 0);
        b.after[i] = (b.after[i] ?? 0) + (n?.[key as "off_pav"] ?? 0);
      }
    }
  }
  // Twenty pseudo-pairs, each with the cell's mean prior zone PAV and ratio one.
  const ratios = buckets.map(
    (b) =>
      b.before.map((sum, i) => {
        const pseudo = (20 * sum) / b.n;
        return sum > 0 ? ((b.after[i] ?? 0) + pseudo) / (sum + pseudo) : 1;
      }) as [number, number, number],
  );
  assert(ratios.flat().every((x) => Number.isFinite(x) && x >= 0));
  return { fitYears: [2010, 2011, 2012, 2013, 2014], buckets, ratios };
}

assert.equal(variance([1, 2, 3]), 1);
assert.equal(mean([1, 2, 3]), 2);
