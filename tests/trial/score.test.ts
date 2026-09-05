import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import {
  consensusWrong,
  scoreTrial,
  selectAtLock,
  TRIAL_RULES,
  type TrialArchive,
  TrialArchiveSchema,
  type TrialRow,
} from "../../src/trial/score.js";

const fixture = TrialArchiveSchema.parse(
  JSON.parse(
    gunzipSync(readFileSync(new URL("../fixtures/trial-2026.json.gz", import.meta.url))).toString(),
  ),
);
const now = new Date("2027-10-01T00:00:00Z");
function row(primary = true, match = 1, margin = primary ? -0.1 : 0.1): TrialRow {
  const original = fixture.rows.find((value) => value.is_primary === Number(primary));
  if (!original) throw new Error("Missing golden model");
  const inputs = JSON.parse(original.inputs_json);
  return {
    ...original,
    match_id: match,
    season_year: 2027,
    captured_at: "2027-03-17T08:00:00.000Z",
    round_first_kickoff: "2027-03-18T19:30:00",
    match_kickoff: "2027-03-20T13:00:00",
    predicted_margin: Math.round(margin * 10) / 10,
    inputs_json: JSON.stringify({
      ...inputs,
      reconstructed: false,
      prediction: { ...inputs.prediction, home: "Alpha", away: "Beta", predictedMargin: margin },
    }),
    field_json: JSON.stringify(
      Array.from({ length: 20 }, (_, sourceid) => ({
        sourceid,
        tip: "Beta",
        hteam: "Alpha",
        ateam: "Beta",
        hconfidence: 40,
      })),
    ),
    field_captured_at: "2027-03-17T07:59:00.000Z",
  };
}
function population(n: number, homeWins: number): TrialArchive {
  return {
    provenance: "prospective",
    rows: Array.from({ length: n }, (_, index) => [row(true, index), row(false, index)]).flat(),
    results: Array.from({ length: n }, (_, match_id) => ({
      match_id,
      actual_margin: match_id < homeWins ? 1 : -1,
      round_type: "Regular",
    })),
  };
}

describe("frozen trial", () => {
  it("reproduces Task 40 full-2026 tips, close band, consensus and legacy losses", () => {
    const score = scoreTrial(fixture, 2026, now, true);
    const reports: {
      id: string;
      seasons: Record<
        string,
        {
          tips: number;
          closeN: number;
          closeTips: number;
          candidate: { logLossBits: number };
          baseline: { logLossBits: number };
        }
      >;
      consensus2026: { n: number; tips: number };
    }[] = JSON.parse(
      readFileSync(new URL("../../analysis/task40-score-results.json", import.meta.url), "utf8"),
    );
    const expected = reports.find((report) => report.id === "t40-od");
    expect(score.pairedMatches).toBe(211);
    expect(score.tips).toMatchObject({
      n: 208,
      primary: 152,
      shadow: 153,
      delta: expected?.seasons["2026"]?.tips,
    });
    expect(score.compTotals).toEqual({ primary: 155, shadow: 156 });
    expect(score.close).toMatchObject({
      n: expected?.seasons["2026"]?.closeN,
      delta: expected?.seasons["2026"]?.closeTips,
    });
    expect(score.consensusWrong).toMatchObject({
      n: expected?.consensus2026.n,
      delta: expected?.consensus2026.tips,
    });
    expect(score.logLossBits.legacy.primary).toBeCloseTo(
      expected?.seasons["2026"]?.baseline.logLossBits ?? 0,
      12,
    );
    expect(score.logLossBits.legacy.shadow).toBeCloseTo(
      expected?.seasons["2026"]?.candidate.logLossBits ?? 0,
      12,
    );
    expect(score.logLossBits.standard_normal.primary).toBeCloseTo(0.7865320725996802, 12);
    expect(score.logLossBits.standard_normal.shadow).toBeCloseTo(0.7749803333892384, 12);
    expect(score.verdict).toBe("PARK");
    expect(score.tips.ci95).toEqual([-6, 7]);
    expect(
      scoreTrial(
        { ...fixture, rows: [...fixture.rows].reverse(), results: [...fixture.results].reverse() },
        2026,
        now,
        true,
      ),
    ).toEqual(score);
  });

  it("keeps constants identical to the frozen document", () => {
    const document = readFileSync(
      new URL("../../docs/trial-2027-adjudication.md", import.meta.url),
      "utf8",
    );
    const json = /```json\n([\s\S]*?)\n```/.exec(document)?.[1];
    expect(JSON.parse(json ?? "null")).toEqual(TRIAL_RULES);
  });

  it("selects the last pre-round capture across DST and excludes equality and later games", () => {
    const early = row();
    const last = { ...early, captured_at: "2027-03-18T08:29:59.999Z" };
    const locked = { ...early, captured_at: "2027-03-18T08:30:00.000Z" };
    const later = { ...early, captured_at: "2027-03-19T08:00:00.000Z" };
    expect(selectAtLock([early, later, locked, last])).toEqual([last]);
    expect(
      selectAtLock([
        {
          ...early,
          captured_at: "2027-07-18T09:30:00.000Z",
          round_first_kickoff: "2027-07-18T19:30:00",
          match_kickoff: "2027-07-20T13:00:00",
        },
      ]),
    ).toEqual([]);
    expect(selectAtLock([{ ...early, match_kickoff: "2027-03-17T19:00:00" }])).toEqual([]);
    expect(() => selectAtLock([early, early])).toThrow("Duplicate archive");
  });

  it("uses distinct pre-lock sources and the inclusive 65% boundary", () => {
    const base = row();
    const tips: {
      sourceid: number;
      tip: string;
      hteam: string;
      ateam: string;
      hconfidence: number;
    }[] = JSON.parse(base.field_json ?? "[]");
    const boundary = tips.map((tip, index) => ({ ...tip, tip: index < 13 ? "Beta" : "Alpha" }));
    expect(consensusWrong({ ...base, field_json: JSON.stringify(boundary) }, 1)).toBe(true);
    expect(
      consensusWrong(
        {
          ...base,
          field_json: JSON.stringify(
            boundary.map((tip, index) => (index === 0 ? { ...tip, tip: "Alpha" } : tip)),
          ),
        },
        1,
      ),
    ).toBe(false);
    expect(consensusWrong({ ...base, field_json: JSON.stringify(tips.slice(0, 7)) }, 1)).toBeNull();
    expect(consensusWrong({ ...base, field_json: JSON.stringify([...tips, ...tips]) }, 1)).toBe(
      true,
    );
    expect(
      consensusWrong({ ...base, field_captured_at: "2027-03-18T08:30:00.000Z" }, 1),
    ).toBeNull();
    expect(consensusWrong(base, 0)).toBeNull();
    expect(consensusWrong({ ...base, field_json: null }, 1)).toBeNull();
    expect(() =>
      consensusWrong(
        { ...base, field_json: JSON.stringify([...tips, { ...tips[0], tip: "Alpha" }]) },
        1,
      ),
    ).toThrow("Conflicting field source");
  });

  it("uses raw incumbent close margin and excludes draws while crediting comp totals", () => {
    const archive = population(3, 3);
    archive.rows[0] = row(true, 0, 11.999);
    archive.rows[2] = row(true, 1, 12);
    archive.results[2] = { match_id: 2, actual_margin: 0, round_type: "Regular" };
    const score = scoreTrial(archive, 2027, now);
    expect(score.close.n).toBe(1);
    expect(score.tips.n).toBe(2);
    expect(score.draws).toBe(1);
    expect(score.compTotals.primary).toBe(score.tips.primary + 1);
    expect(score.teamBias[0]?.n).toBe(3);
  });

  it("applies power floor, completeness, provenance and final-season gates", () => {
    const strong = population(200, 120);
    expect(scoreTrial(strong, 2027, now)).toMatchObject({
      verdict: "PROMOTE",
      rule: "primary",
      tips: { delta: 40 },
    });
    expect(scoreTrial(population(200, 110), 2027, now).verdict).toBe("PARK");
    expect(scoreTrial({ ...strong, rows: strong.rows.slice(1) }, 2027, now)).toMatchObject({
      verdict: "PARK",
      complete: false,
    });
    expect(scoreTrial({ ...strong, provenance: "reconstructed" }, 2027, now).verdict).toBe("PARK");
    expect(scoreTrial(strong, 2027, new Date("2027-08-31T12:00:00Z")).verdict).toBe("PARK");
    expect(scoreTrial(strong, 2027, now, true).verdict).toBe("PARK");
    expect(
      scoreTrial(
        {
          ...strong,
          results: strong.results.map((result, index) =>
            index === 0 ? { ...result, actual_margin: null } : result,
          ),
        },
        2027,
        now,
      ).verdict,
    ).toBe("PARK");
    const forged = {
      ...strong,
      rows: strong.rows.map((capture, index) =>
        index === 0
          ? {
              ...capture,
              inputs_json: capture.inputs_json.replace(
                '"reconstructed":false',
                '"reconstructed":true',
              ),
            }
          : capture,
      ),
    };
    expect(scoreTrial(forged, 2027, now).verdict).toBe("PARK");
  });

  it("evaluates fallback cuts and bias when the paired interval contains zero", () => {
    const archive = population(300, 165);
    const score = scoreTrial(archive, 2027, now);
    expect(score.tips.ci95?.[0]).toBeLessThanOrEqual(0);
    expect(score).toMatchObject({ verdict: "PROMOTE", rule: "fallback", tips: { delta: 30 } });
    expect(
      scoreTrial(
        { ...archive, rows: archive.rows.map((capture) => ({ ...capture, field_json: null })) },
        2027,
        now,
      ).verdict,
    ).toBe("PARK");
    const biased = {
      ...archive,
      rows: archive.rows.map((capture) =>
        capture.is_primary ? capture : row(false, capture.match_id, 50),
      ),
    };
    expect(scoreTrial(biased, 2027, now).verdict).toBe("PARK");
  });
});
