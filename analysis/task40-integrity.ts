/** Frozen-input coverage, scheduling and baseline residual diagnostics. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homeAdvantageBucket } from "../src/engine/geography.js";
import { computeCalibration, computeMetrics } from "../src/engine/metrics.js";
import type { MatchPrediction } from "../src/types.js";
import { loadSnapshot } from "./task40-data.js";
import { loadResult } from "./task40-score.js";

const data = loadSnapshot();
interface ExtraMatch {
  id: number;
  year: number;
  [key: string]: number | string | null;
}
interface ExtraStat {
  match_id: number;
  player_id: number;
  year: number;
  [key: string]: number | string | null;
}
interface Weather {
  match_id: number;
  year: number;
  kind: string;
  precip_mm: number | null;
  fetched_at: string;
}
interface Venue {
  id: number;
  roof: string | null;
  timezone: string | null;
  canonical_venue_id: number | null;
}
const extra = JSON.parse(readFileSync("/tmp/tipper-task40-extra.json", "utf8")) as {
  matches: ExtraMatch[];
  stats: ExtraStat[];
  weather: Weather[];
  venues: Venue[];
};
const venues = new Map(extra.venues.map((v) => [v.id, v]));
const extraMatches = new Map(extra.matches.map((m) => [m.id, m]));
const years = Array.from({ length: 17 }, (_, i) => i + 2010);
const coverage = years.map((year) => {
  const matches = data.matches.filter(
    (m) =>
      data.seasonYearById.get(m.season_id) === year &&
      m.home_points !== null &&
      m.away_points !== null,
  );
  const rows = extra.stats.filter((s) => s.year === year);
  const statFields = [
    "rating_points",
    "shots_at_goal",
    "score_involvements",
    "intercepts",
    "pressure_acts",
    "time_on_ground_pct",
    "player_position",
  ];
  const matchFields = ["home_q1_goals", "home_minutes_in_front", "home_rushed_behinds"];
  return {
    year,
    matches: matches.length,
    playerRows: rows.length,
    stats: Object.fromEntries(
      statFields.map((f) => [f, rows.filter((r) => r[f] !== null && r[f] !== undefined).length]),
    ),
    matchFeatures: Object.fromEntries(
      matchFields.map((f) => [
        f,
        matches.filter(
          (m) => extraMatches.get(m.id)?.[f] !== null && extraMatches.get(m.id)?.[f] !== undefined,
        ).length,
      ]),
    ),
    weather: Object.fromEntries(
      ["observed", "forecast"].map((kind) => [
        kind,
        extra.weather.filter((w) => w.year === year && w.kind === kind).length,
      ]),
    ),
  };
});
function kickoff(m: (typeof data.matches)[number]) {
  const venue = venues.get(m.venue_id);
  assert(venue?.timezone && m.local_time);
  const zone = new Intl.DateTimeFormat("en-US", {
    timeZone: venue.timezone,
    timeZoneName: "shortOffset",
  })
    .formatToParts(new Date(`${m.date}T12:00:00Z`))
    .find((p) => p.type === "timeZoneName")?.value;
  const offset = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(zone ?? "");
  assert(offset);
  return Date.parse(
    `${m.date}T${m.local_time.length === 5 ? `${m.local_time}:00` : m.local_time}${offset[1]}${offset[2]?.padStart(2, "0")}:${offset[3] ?? "00"}`,
  );
}
const schedule = data.matches
  .filter((m) => m.home_points !== null && m.away_points !== null)
  .map((m) => ({ m, start: kickoff(m) }));
const ordering: { earlierId: number; laterId: number; year: number; kickoffGapMinutes: number }[] =
  [];
const possibleOverlap: typeof ordering = [];
for (let i = 0; i < schedule.length; i++) {
  const a = schedule[i];
  assert(a);
  for (let j = i + 1; j < schedule.length; j++) {
    const b = schedule[j];
    assert(b);
    if (b.m.date !== a.m.date) break;
    const gap = (b.start - a.start) / 60000;
    const pair = {
      earlierId: a.m.id,
      laterId: b.m.id,
      year: Number(a.m.date.slice(0, 4)),
      kickoffGapMinutes: gap,
    };
    if (gap < 0) ordering.push(pair);
    if (gap < 180) possibleOverlap.push(pair);
  }
}
const windows = {
  primary: await loadResult("t40-baseline"),
  early: await loadResult("t40-baseline-early"),
  current: await loadResult("t40-baseline-2026"),
};
const cuts = (rows: MatchPrediction[]) => {
  const groups = new Map<string, MatchPrediction[]>();
  for (const p of rows) {
    const magnitude = Math.abs(p.predictedMargin);
    const band =
      magnitude < 12 ? "0-12" : magnitude < 24 ? "12-24" : magnitude < 48 ? "24-48" : "48+";
    const phase =
      p.roundNumber <= 4
        ? "R0-4"
        : p.roundNumber <= 13
          ? "R5-13"
          : p.round.startsWith("R")
            ? "R14+ regular"
            : "finals";
    for (const key of [
      `margin ${band}`,
      `phase ${phase}`,
      `venue ${homeAdvantageBucket(p.home, p.away, p.venue)}`,
      `pick ${p.predictedWinner}`,
      `season ${p.date.slice(0, 4)}`,
    ]) {
      const group = groups.get(key) ?? [];
      group.push(p);
      groups.set(key, group);
    }
  }
  return Object.fromEntries(
    [...groups].map(([key, ps]) => [
      key,
      {
        ...computeMetrics(ps),
        residualMean:
          ps.reduce((s, p) => s + (p.actualMargin ?? 0) - p.predictedMargin, 0) / ps.length,
        calibration: computeCalibration(ps),
      },
    ]),
  );
};
const teams = (rows: MatchPrediction[], tail = false) => {
  const groups = new Map<string, number[]>();
  for (const p of rows) {
    if (tail && Math.abs(p.predictedMargin) <= 24) continue;
    for (const [team, sign] of [
      [p.home, 1],
      [p.away, -1],
    ] as const) {
      const g = groups.get(team) ?? [];
      g.push(sign * ((p.actualMargin ?? 0) - p.predictedMargin));
      groups.set(team, g);
    }
  }
  return [...groups].map(([team, xs]) => ({
    team,
    n: xs.length,
    bias: xs.reduce((s, x) => s + x, 0) / xs.length,
  }));
};
const files = [
  "/tmp/tipper-task40-data.json",
  "/tmp/tipper-task40-extra.json",
  ...readdirSync("/tmp")
    .filter((n) => /^tipper-task40-squiggle-\d{4}\.json$/.test(n))
    .map((n) => `/tmp/${n}`),
];
const forecast = extra.weather.filter((w) => w.kind === "forecast");
const forecastAudit = forecast.map((f) => {
  const m = data.matches.find((m) => m.id === f.match_id);
  assert(m);
  const observed = extra.weather.find((w) => w.match_id === f.match_id && w.kind === "observed");
  const prior = Date.parse(f.fetched_at) < kickoff(m);
  return {
    matchId: m.id,
    completed: m.home_points !== null,
    beforeKickoff: prior,
    roof: venues.get(m.venue_id)?.roof,
    surprise:
      prior &&
      f.precip_mm !== null &&
      observed?.precip_mm !== null &&
      observed?.precip_mm !== undefined
        ? Math.max(0, observed.precip_mm - f.precip_mm)
        : null,
  };
});
const out = {
  coverage,
  ordering,
  possibleOverlap,
  overlapAssumption:
    "180-minute match duration, not actual final-siren timestamps; negative gaps are definite ordering inversions",
  baselineCuts: Object.fromEntries(
    Object.entries(windows).map(([key, ps]) => [
      key,
      { cuts: cuts(ps), teams: teams(ps), tailTeams: teams(ps, true) },
    ]),
  ),
  r14: {
    cuts: cuts(windows.current.filter((p) => p.roundNumber >= 14)),
    teams: teams(
      windows.current.filter((p) => p.roundNumber >= 14),
      true,
    ),
  },
  forecastAudit,
  manifest: files.map((path) => {
    const bytes = readFileSync(path);
    return { path, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
  }),
};
writeFileSync("analysis/task40-integrity-results.json", `${JSON.stringify(out, null, 2)}\n`, {
  flag: "wx",
});
console.log(
  JSON.stringify(
    {
      inversions: ordering.length,
      possibleOverlap: possibleOverlap.length,
      forecastRows: forecastAudit.length,
      validCompletedForecast: forecastAudit.filter((r) => r.completed && r.beforeKickoff).length,
      exposedSurprises: forecastAudit.filter(
        (r) => r.completed && r.beforeKickoff && r.roof === "none" && (r.surprise ?? 0) > 0,
      ).length,
      coverage,
    },
    null,
    2,
  ),
);
