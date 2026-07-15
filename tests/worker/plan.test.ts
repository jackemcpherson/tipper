import { describe, expect, it } from "vitest";
import {
  healthStatus,
  melbourneClock,
  publishPlan,
  type RoundState,
} from "../../src/worker/plan.js";

/**
 * Clock facts used throughout (verified against the 2026 calendar):
 * - 2026-07-16 is a Thursday; July is AEST (UTC+10), so Melbourne
 *   wall time = UTC + 10h (e.g. 17:00 Melbourne = 07:00Z).
 * - AEDT starts Sunday 2026-10-04: Thursday 2026-10-01 is AEST (+10),
 *   Thursday 2026-10-08 is AEDT (+11).
 */

function makeState(overrides: Partial<RoundState> = {}): RoundState {
  return {
    competition: "AFLM",
    season: 2026,
    roundNumber: 19,
    firstKickoff: "2026-07-16T19:30:00", // Thursday night, AEST
    hasMatchToday: false,
    lastGeneratedAt: null,
    ...overrides,
  };
}

describe("melbourneClock", () => {
  it("projects a UTC instant onto the Melbourne wall clock (AEST)", () => {
    const clock = melbourneClock(new Date("2026-07-16T07:00:00Z"));
    expect(clock.wall).toBe("2026-07-16T17:00:00");
    expect(clock.date).toBe("2026-07-16");
    expect(clock.weekday).toBe("Thu");
    expect(clock.minutesOfDay).toBe(17 * 60);
  });

  it("tracks the AEDT transition with no offset arithmetic", () => {
    // Same UTC hour, one week apart, straddling the Oct 4 spring-forward.
    expect(melbourneClock(new Date("2026-10-01T07:00:00Z")).wall).toBe("2026-10-01T17:00:00");
    expect(melbourneClock(new Date("2026-10-08T07:00:00Z")).wall).toBe("2026-10-08T18:00:00");
  });
});

describe("publishPlan: 7-day window entry", () => {
  const kickoff = "2026-07-16T19:30:00";

  it("skips a round more than 7 days from its first kickoff", () => {
    const plan = publishPlan(new Date("2026-07-09T09:29:59Z"), [
      makeState({ firstKickoff: kickoff }),
    ]);
    expect(plan).toEqual([]);
  });

  it("plans a never-published round exactly at window entry (inclusive)", () => {
    // 2026-07-09T09:30:00Z + 7d projects to Melbourne 2026-07-16T19:30:00.
    const plan = publishPlan(new Date("2026-07-09T09:30:00Z"), [
      makeState({ firstKickoff: kickoff }),
    ]);
    expect(plan).toHaveLength(1);
  });
});

describe("publishPlan: never-published rounds", () => {
  it("publishes immediately regardless of cadence context", () => {
    // Tuesday midday Melbourne, no match today: the 24h baseline applies,
    // but a round with no rows at all is always due.
    const plan = publishPlan(new Date("2026-07-14T02:00:00Z"), [
      makeState({ lastGeneratedAt: null }),
    ]);
    expect(plan).toHaveLength(1);
  });
});

describe("publishPlan: interval stepping", () => {
  // Tuesday 2026-07-14 12:00 Melbourne (02:00Z) — outside the Thursday window.
  const now = new Date("2026-07-14T02:00:00Z");

  it("baseline (no match today): republishes at 24h, not 23h59m59s", () => {
    const fresh = makeState({ lastGeneratedAt: "2026-07-13T02:00:01.000Z" });
    const stale = makeState({ lastGeneratedAt: "2026-07-13T02:00:00.000Z" });
    expect(publishPlan(now, [fresh])).toEqual([]);
    expect(publishPlan(now, [stale])).toHaveLength(1);
  });

  it("match day: republishes hourly", () => {
    const fresh = makeState({ hasMatchToday: true, lastGeneratedAt: "2026-07-14T01:00:01.000Z" });
    const stale = makeState({ hasMatchToday: true, lastGeneratedAt: "2026-07-14T01:00:00.000Z" });
    expect(publishPlan(now, [fresh])).toEqual([]);
    expect(publishPlan(now, [stale])).toHaveLength(1);
  });

  it("Thursday announcement window: republishes every 15 minutes", () => {
    // Thursday 17:00 Melbourne (07:00Z); round kicks off Friday night.
    const thursday = new Date("2026-07-16T07:00:00Z");
    const kickoff = "2026-07-17T19:50:00";
    const fresh = makeState({ firstKickoff: kickoff, lastGeneratedAt: "2026-07-16T06:45:01.000Z" });
    const stale = makeState({ firstKickoff: kickoff, lastGeneratedAt: "2026-07-16T06:45:00.000Z" });
    expect(publishPlan(thursday, [fresh])).toEqual([]);
    expect(publishPlan(thursday, [stale])).toHaveLength(1);
  });
});

describe("publishPlan: Thursday window edges (Melbourne)", () => {
  // Friday-night kickoff so the round is never frozen during the window.
  const kickoff = "2026-07-17T19:50:00";
  // 20 minutes stale: due on the 15-min step, fresh on hourly/daily.
  const cases: Array<{ label: string; nowUtc: string; hasMatchToday: boolean; due: boolean }> = [
    {
      label: "16:59 is outside (baseline)",
      nowUtc: "2026-07-16T06:59:00Z",
      hasMatchToday: false,
      due: false,
    },
    {
      label: "17:00 opens the window",
      nowUtc: "2026-07-16T07:00:00Z",
      hasMatchToday: false,
      due: true,
    },
    {
      label: "20:59 is still inside",
      nowUtc: "2026-07-16T10:59:00Z",
      hasMatchToday: false,
      due: true,
    },
    {
      label: "21:00 closes it (falls back to hourly)",
      nowUtc: "2026-07-16T11:00:00Z",
      hasMatchToday: true,
      due: false,
    },
  ];

  it.each(cases)("$label", ({ nowUtc, hasMatchToday, due }) => {
    const now = new Date(nowUtc);
    const lastGeneratedAt = new Date(now.getTime() - 20 * 60 * 1000).toISOString();
    const plan = publishPlan(now, [
      makeState({ firstKickoff: kickoff, hasMatchToday, lastGeneratedAt }),
    ]);
    expect(plan).toHaveLength(due ? 1 : 0);
  });

  it("only applies on Thursdays", () => {
    // Friday 17:30 Melbourne (07:30Z), 20 minutes stale, no match today.
    const plan = publishPlan(new Date("2026-07-17T07:30:00Z"), [
      makeState({
        firstKickoff: "2026-07-18T13:20:00",
        lastGeneratedAt: "2026-07-17T07:10:00.000Z",
      }),
    ]);
    expect(plan).toEqual([]);
  });
});

describe("publishPlan: AEST/AEDT transition (2026-10-04)", () => {
  it("the window tracks the Melbourne clock, not a fixed UTC hour", () => {
    // 10:30Z is 20:30 AEST on Oct 1 (inside) but 21:30 AEDT on Oct 8 (outside).
    const staleBy20min = (now: Date) => new Date(now.getTime() - 20 * 60 * 1000).toISOString();

    const beforeDst = new Date("2026-10-01T10:30:00Z");
    const inWindow = publishPlan(beforeDst, [
      makeState({ firstKickoff: "2026-10-03T13:00:00", lastGeneratedAt: staleBy20min(beforeDst) }),
    ]);
    expect(inWindow).toHaveLength(1);

    const afterDst = new Date("2026-10-08T10:30:00Z");
    const outside = publishPlan(afterDst, [
      makeState({ firstKickoff: "2026-10-10T13:00:00", lastGeneratedAt: staleBy20min(afterDst) }),
    ]);
    expect(outside).toEqual([]);
  });

  it("staleness is pure instant arithmetic across the spring-forward", () => {
    // Generated Saturday 19:00 AEST; the 24h baseline elapses at the same
    // UTC instant on Sunday even though the wall clock says 25h later.
    const state = makeState({
      firstKickoff: "2026-10-10T13:00:00",
      lastGeneratedAt: "2026-10-03T09:00:00.000Z",
    });
    expect(publishPlan(new Date("2026-10-04T08:59:59Z"), [state])).toEqual([]);
    expect(publishPlan(new Date("2026-10-04T09:00:00Z"), [state])).toHaveLength(1);
  });
});

describe("publishPlan: freeze at first kickoff", () => {
  const kickoff = "2026-07-16T19:30:00"; // 09:30Z

  it("still publishes one second before kickoff", () => {
    const plan = publishPlan(new Date("2026-07-16T09:29:59Z"), [
      makeState({ firstKickoff: kickoff }),
    ]);
    expect(plan).toHaveLength(1);
  });

  it("freezes at the exact kickoff instant, even when never published", () => {
    const plan = publishPlan(new Date("2026-07-16T09:30:00Z"), [
      makeState({ firstKickoff: kickoff, lastGeneratedAt: null }),
    ]);
    expect(plan).toEqual([]);
  });

  it("a frozen round R coexists with a publishable round R+1", () => {
    // Friday midday: R19's Thursday opener has been played; R20 opens next
    // Thursday and has never been published.
    const now = new Date("2026-07-17T02:00:00Z");
    const frozen = makeState({ roundNumber: 19, firstKickoff: "2026-07-16T19:30:00" });
    const next = makeState({ roundNumber: 20, firstKickoff: "2026-07-23T19:30:00" });
    const plan = publishPlan(now, [frozen, next]);
    expect(plan).toHaveLength(1);
    expect(plan[0]?.roundNumber).toBe(20);
  });
});

describe("publishPlan: both competitions", () => {
  it("plans each competition's rounds independently", () => {
    const now = new Date("2026-07-14T02:00:00Z");
    const staleAflm = makeState({
      competition: "AFLM",
      lastGeneratedAt: "2026-07-13T01:00:00.000Z", // 25h old — due at baseline
    });
    const freshAflw = makeState({
      competition: "AFLW",
      roundNumber: 1,
      firstKickoff: "2026-07-18T13:05:00",
      lastGeneratedAt: "2026-07-14T01:00:00.000Z", // 1h old — fresh at baseline
    });
    const plan = publishPlan(now, [staleAflm, freshAflw]);
    expect(plan).toHaveLength(1);
    expect(plan[0]?.competition).toBe("AFLM");
  });
});

describe("healthStatus", () => {
  // Tuesday 12:00 Melbourne, baseline cadence.
  const now = new Date("2026-07-14T02:00:00Z");

  it("reports healthy when every round is within interval + grace", () => {
    const status = healthStatus(now, [
      makeState({ lastGeneratedAt: "2026-07-13T03:00:00.000Z" }), // 23h old
    ]);
    expect(status).toEqual({ healthy: true, checked: 1, overdue: [] });
  });

  it("grace boundary: exactly interval + 30min is still healthy, beyond is not", () => {
    const atBoundary = makeState({ lastGeneratedAt: "2026-07-13T01:30:00.000Z" }); // 24h30m
    const beyond = makeState({ lastGeneratedAt: "2026-07-13T01:29:59.000Z" }); // 24h30m1s
    expect(healthStatus(now, [atBoundary]).healthy).toBe(true);
    const status = healthStatus(now, [beyond]);
    expect(status.healthy).toBe(false);
    expect(status.overdue).toEqual([beyond]);
  });

  it("a never-published round is overdue only once window entry is more than grace ago", () => {
    // now + 7d is Melbourne 2026-07-21T12:00:00; grace is 30 minutes.
    const justEntered = makeState({ firstKickoff: "2026-07-21T11:31:00" }); // 29m in-window
    const lingering = makeState({ firstKickoff: "2026-07-21T11:29:00" }); // 31m in-window
    expect(healthStatus(now, [justEntered]).healthy).toBe(true);
    expect(healthStatus(now, [lingering]).healthy).toBe(false);
  });

  it("never-published grace across the spring-forward day (2026-10-04) is real elapsed time", () => {
    // Kickoff Sunday 2026-10-04 10:00 AEDT — hours after the 02:00→03:00
    // jump — i.e. instant 2026-10-03T23:00:00Z. Window entry is kickoff
    // − 7d = 2026-09-26T23:00:00Z; the intervening week is 167 wall-clock
    // hours, but the 30-minute grace is measured in instants: healthy at
    // entry + 29m59s, overdue at entry + 30m exactly.
    const state = makeState({ firstKickoff: "2026-10-04T10:00:00" });
    expect(healthStatus(new Date("2026-09-26T23:29:59Z"), [state]).healthy).toBe(true);
    expect(healthStatus(new Date("2026-09-26T23:30:00Z"), [state]).healthy).toBe(false);
  });

  it("never-published grace across the fall-back day (2026-04-05) does not double-count the repeated hour", () => {
    // Kickoff Sunday 2026-04-05 13:10 AEST — after the 03:00→02:00 repeat
    // — i.e. instant 2026-04-05T03:10:00Z. The week back from it is 169
    // wall-clock hours; overdue flips exactly at entry + 30m
    // (2026-03-29T03:40:00Z), not an hour early or late.
    const state = makeState({ firstKickoff: "2026-04-05T13:10:00" });
    expect(healthStatus(new Date("2026-03-29T03:39:59Z"), [state]).healthy).toBe(true);
    expect(healthStatus(new Date("2026-03-29T03:40:00Z"), [state]).healthy).toBe(false);
  });

  it("ignores frozen rounds no matter how stale their rows are", () => {
    const frozen = makeState({
      firstKickoff: "2026-07-10T19:30:00", // kicked off days ago
      lastGeneratedAt: "2026-07-09T00:00:00.000Z",
    });
    expect(healthStatus(now, [frozen])).toEqual({ healthy: true, checked: 1, overdue: [] });
  });

  it("uses the 15-minute interval inside the Thursday window", () => {
    const thursday = new Date("2026-07-16T07:00:00Z"); // 17:00 Melbourne
    const kickoff = "2026-07-17T19:50:00";
    // interval 15m + grace 30m = 45m budget.
    const within = makeState({
      firstKickoff: kickoff,
      lastGeneratedAt: "2026-07-16T06:15:00.000Z",
    });
    const beyond = makeState({
      firstKickoff: kickoff,
      lastGeneratedAt: "2026-07-16T06:14:00.000Z",
    });
    expect(healthStatus(thursday, [within]).healthy).toBe(true);
    expect(healthStatus(thursday, [beyond]).healthy).toBe(false);
  });

  it("one overdue round flips the whole verdict, listing only that round", () => {
    const overdue = makeState({ lastGeneratedAt: "2026-07-12T00:00:00.000Z" });
    const fine = makeState({
      competition: "AFLW",
      roundNumber: 1,
      firstKickoff: "2026-07-18T13:05:00",
      lastGeneratedAt: "2026-07-14T01:00:00.000Z",
    });
    const status = healthStatus(now, [overdue, fine]);
    expect(status.healthy).toBe(false);
    expect(status.checked).toBe(2);
    expect(status.overdue).toEqual([overdue]);
  });
});
