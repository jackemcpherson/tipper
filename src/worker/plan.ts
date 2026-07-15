/**
 * Pure decision core for the Worker cron publisher (tipper#30).
 *
 * The cron fires every 15 minutes; this module decides what (if anything)
 * each tick owes the match_predictions table, as a pure function of the
 * clock and fixture state. No I/O — `RoundState` rows come from a single
 * D1 query per tick (see src/worker/tick.ts) and the same interval logic
 * drives both the publish plan and the /health verdict, so the health
 * signal cannot drift from what the publisher actually does.
 *
 * All Melbourne wall-clock arithmetic goes through `Intl` with the IANA
 * zone (footyBot `previewPassKind` precedent) — no UTC offset arithmetic,
 * DST-correct by construction.
 */

import type { CompetitionCode } from "../data/types.js";

/** Identity of a round across competitions and seasons. */
export interface RoundKey {
  readonly competition: CompetitionCode;
  readonly season: number;
  readonly roundNumber: number;
}

/**
 * One candidate round: a (competition, season, round) with at least one
 * unplayed match, plus everything the gate needs to decide on it.
 */
export interface RoundState extends RoundKey {
  /**
   * Melbourne wall-clock datetime "YYYY-MM-DDTHH:MM:SS" of the round's
   * earliest match (over ALL its matches, played or not — a round in
   * progress must read as started). Matches with an unknown local_time
   * are treated as kicking off at 00:00:00, freezing the round from the
   * start of its first match day — conservative by design: a round is
   * never republished mid-match, so every row provably predates its round.
   */
  readonly firstKickoff: string;
  /** Whether the competition has any match today (Melbourne calendar day). */
  readonly hasMatchToday: boolean;
  /**
   * ISO-8601 UTC instant of the newest match_predictions row for the
   * round, or null when the round has never been published.
   */
  readonly lastGeneratedAt: string | null;
}

/** Health verdict for GET /health, derived from the same gate logic. */
export interface HealthStatus {
  readonly healthy: boolean;
  /** Number of candidate rounds inspected (including frozen ones). */
  readonly checked: number;
  /** Non-frozen, in-window rounds stale beyond their interval + grace. */
  readonly overdue: readonly RoundState[];
}

/** Candidate window: rounds whose first match starts within 7 days. */
export const PUBLISH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** Baseline refresh interval inside the 7-day window. */
const BASELINE_INTERVAL_MS = 24 * 60 * 60 * 1000;

/** Refresh interval when the competition has a match today. */
const MATCH_DAY_INTERVAL_MS = 60 * 60 * 1000;

/** Refresh interval during the Thursday team-announcement window. */
const ANNOUNCEMENT_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Health grace beyond the desired interval: two full 15-minute ticks, so
 * a single slow or in-flight tick never flaps the check.
 */
const HEALTH_GRACE_MS = 30 * 60 * 1000;

/** Thursday announcement window, Melbourne minutes-of-day: [17:00, 21:00). */
const ANNOUNCEMENT_START_MIN = 17 * 60;
const ANNOUNCEMENT_END_MIN = 21 * 60;

const MELBOURNE_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "Australia/Melbourne",
  weekday: "short",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/** An instant projected onto the Melbourne wall clock. */
export interface MelbourneClock {
  /** "YYYY-MM-DDTHH:MM:SS", lexicographically comparable to RoundState.firstKickoff. */
  readonly wall: string;
  /** "YYYY-MM-DD" Melbourne calendar date. */
  readonly date: string;
  /** "Mon".."Sun". */
  readonly weekday: string;
  readonly minutesOfDay: number;
}

/** Project a UTC instant onto the Melbourne wall clock via Intl (DST-correct). */
export function melbourneClock(instant: Date): MelbourneClock {
  const parts = MELBOURNE_FORMAT.formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes): string => {
    const value = parts.find((p) => p.type === type)?.value;
    if (value === undefined) {
      throw new Error(`Intl produced no "${type}" part for the Melbourne clock projection.`);
    }
    return value;
  };
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  const hour = get("hour");
  const minute = get("minute");
  return {
    wall: `${date}T${hour}:${minute}:${get("second")}`,
    date,
    weekday: get("weekday"),
    minutesOfDay: Number.parseInt(hour, 10) * 60 + Number.parseInt(minute, 10),
  };
}

/**
 * Melbourne wall clock of the 7-day window's leading edge (now + 7 days).
 * The single home for this computation — buildContext and the state-query
 * parameter derivation in tick.ts both call it.
 */
export function publishWindowEndWall(now: Date): string {
  return melbourneClock(new Date(now.getTime() + PUBLISH_WINDOW_MS)).wall;
}

/**
 * Convert a Melbourne wall-clock datetime to an epoch instant by
 * fixed-point iteration on the Intl projection — no offset tables, so it
 * stays DST-correct by construction. Ambiguous fall-back times resolve
 * to one of their two instants deterministically; wall times inside the
 * spring-forward gap (which never host kickoffs) resolve to a nearby
 * instant on the other side of the gap.
 */
function melbourneWallToEpochMs(wall: string): number {
  const target = Date.parse(`${wall}Z`);
  if (Number.isNaN(target)) {
    throw new Error(`Invalid Melbourne wall-clock datetime: ${wall}`);
  }
  let instant = target;
  for (let i = 0; i < 3; i++) {
    const projected = Date.parse(`${melbourneClock(new Date(instant)).wall}Z`);
    if (projected === target) break;
    instant += target - projected;
  }
  return instant;
}

/** Everything about `now` the per-round assessment needs, computed once. */
interface TickContext {
  readonly nowMs: number;
  readonly nowWall: string;
  /** Melbourne wall clock of now + 7 days: the window's leading edge. */
  readonly windowEndWall: string;
  /** True during Thursday 17:00–21:00 Melbourne. */
  readonly announcementWindow: boolean;
}

function buildContext(now: Date): TickContext {
  const clock = melbourneClock(now);
  return {
    nowMs: now.getTime(),
    nowWall: clock.wall,
    windowEndWall: publishWindowEndWall(now),
    announcementWindow:
      clock.weekday === "Thu" &&
      clock.minutesOfDay >= ANNOUNCEMENT_START_MIN &&
      clock.minutesOfDay < ANNOUNCEMENT_END_MIN,
  };
}

/**
 * Desired refresh interval for a round: 15 minutes during the Thursday
 * announcement window, hourly when the competition plays today, daily
 * otherwise. The tightest applicable step wins.
 */
function refreshIntervalMs(ctx: TickContext, state: RoundState): number {
  if (ctx.announcementWindow) return ANNOUNCEMENT_INTERVAL_MS;
  if (state.hasMatchToday) return MATCH_DAY_INTERVAL_MS;
  return BASELINE_INTERVAL_MS;
}

interface RoundAssessment {
  /** Publish this tick. */
  readonly due: boolean;
  /** Stale beyond interval + grace — flips /health to 503. */
  readonly overdue: boolean;
}

const SKIPPED: RoundAssessment = { due: false, overdue: false };

/**
 * Assess one round against the clock. Frozen rounds (first match already
 * kicked off) and rounds outside the 7-day window are skipped for both
 * publishing and health.
 */
function assessRound(ctx: TickContext, state: RoundState): RoundAssessment {
  // Freeze at round start: at (or after) the first kickoff the round's
  // rows are immutable history. `tipper publish --round` is the sole
  // escape hatch for rewriting a frozen round.
  if (state.firstKickoff <= ctx.nowWall) return SKIPPED;
  // Not yet inside the 7-day window (boundary inclusive: a round exactly
  // 7 days out is a candidate).
  if (state.firstKickoff > ctx.windowEndWall) return SKIPPED;

  const intervalMs = refreshIntervalMs(ctx, state);

  if (state.lastGeneratedAt === null) {
    // Never published: due immediately on window entry. Overdue once the
    // entry (kickoff − 7d) was more than the grace period ago. Pure
    // instant arithmetic like the published path below — a wall-clock
    // projection here would be non-monotonic across DST transitions.
    const kickoffMs = melbourneWallToEpochMs(state.firstKickoff);
    return { due: true, overdue: kickoffMs <= ctx.nowMs + PUBLISH_WINDOW_MS - HEALTH_GRACE_MS };
  }

  const ageMs = ctx.nowMs - Date.parse(state.lastGeneratedAt);
  return { due: ageMs >= intervalMs, overdue: ageMs > intervalMs + HEALTH_GRACE_MS };
}

/**
 * Decide which rounds to publish this tick.
 *
 * @param now - The current instant (UTC).
 * @param roundStates - Candidate rounds from the state query.
 * @returns The rounds due for a (re)publish now, in input order.
 */
export function publishPlan(now: Date, roundStates: readonly RoundState[]): RoundState[] {
  const ctx = buildContext(now);
  return roundStates.filter((state) => assessRound(ctx, state).due);
}

/**
 * Derive the /health verdict from the same interval logic as the plan:
 * unhealthy iff any active round is overdue by more than its desired
 * refresh interval plus a 30-minute grace (two ticks), so a single slow
 * tick never flaps the check.
 *
 * @param now - The current instant (UTC).
 * @param roundStates - Candidate rounds from the state query.
 */
export function healthStatus(now: Date, roundStates: readonly RoundState[]): HealthStatus {
  const ctx = buildContext(now);
  const overdue = roundStates.filter((state) => assessRound(ctx, state).overdue);
  return { healthy: overdue.length === 0, checked: roundStates.length, overdue };
}
