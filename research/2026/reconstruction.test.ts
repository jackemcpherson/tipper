import { describe, expect, it } from "vitest";
import { insertSql, loadDataset, replay, replayMatch } from "./replay";

const data = loadDataset();
const target = data.matches.find(
  (m) =>
    m.year === 2026 && m.status === "Complete" && m.round_number === 8 && m.competition === "AFLM",
);
if (!target) throw new Error("Missing regression fixture");

describe("one-time kickoff reconstruction", () => {
  it("covers all completed pre-activation matches, uses recovered lineups and only earlier local-day evidence", () => {
    const rows = replay(data);
    expect(rows.filter((r) => r.competition === "AFLM")).toHaveLength(213);
    expect(rows.filter((r) => r.competition === "AFLW")).toHaveLength(31);
    expect(new Set(rows.map((r) => r.match_id)).size).toBe(244);
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Melbourne" });
    for (const row of rows) {
      expect(row.provisional).toBe(0);
      expect(row.home_probability).toBeGreaterThanOrEqual(0.01);
      expect(row.home_probability).toBeLessThanOrEqual(0.99);
      const evidence = JSON.parse(row.evidence);
      expect(evidence.lineupObservation.observed_at > row.kickoff_at).toBe(true);
      expect(evidence.simulatedLineupAvailableAt).toBe(row.cutoff_at);
      expect(evidence.ratingInputs.completedMatchIds).not.toContain(row.match_id);
      for (const id of evidence.ratingInputs.completedMatchIds) {
        const match = data.matches.find((m) => m.id === id);
        expect(match?.status).toBe("Complete");
        if (match?.year === 2026) {
          expect(
            date.format(new Date(match.kickoff_at ?? "")) < date.format(new Date(row.kickoff_at)),
          ).toBe(true);
        }
      }
      expect(row.winner).toBe(row.margin >= 0 ? "home" : "away");
      expect(row.issued_margin).toBe(Math.round(row.margin * 10) / 10);
    }
  }, 15_000);

  it("target and later scores and statistics cannot influence the reconstructed output", () => {
    const baseline = replayMatch(data, target);
    const included = new Set<number>(JSON.parse(baseline.evidence).ratingInputs.completedMatchIds);
    const changed = structuredClone(data);
    for (const match of changed.matches)
      if (!included.has(match.id)) {
        match.home_points = 999;
        match.away_points = 0;
      }
    for (const stat of changed.stats)
      if (!included.has(stat.match_id)) {
        stat.goals = 999;
        stat.inside_fifties = 999;
        stat.clearances = 999;
      }
    const updated = replayMatch(changed, target);
    expect(updated.margin).toBe(baseline.margin);
    expect(updated.home_probability).toBe(baseline.home_probability);
    expect(JSON.parse(updated.evidence).input_sha256).toBe(
      JSON.parse(baseline.evidence).input_sha256,
    );
  });

  it("earlier completed results change ratings, live results do not", () => {
    const baseline = replayMatch(data, target);
    const included = new Set<number>(JSON.parse(baseline.evidence).ratingInputs.completedMatchIds);
    const changed = structuredClone(data);
    const earlier = changed.matches.find(
      (m) =>
        m.year === 2026 &&
        included.has(m.id) &&
        [m.home_team_id, m.away_team_id].includes(target.home_team_id),
    );
    if (!earlier) throw new Error("Missing earlier fixture");
    earlier.home_points = 250;
    earlier.away_points = 0;
    expect(replayMatch(changed, target).margin).not.toBe(baseline.margin);
    earlier.status = "Live";
    const live = replayMatch(changed, target);
    earlier.home_points = 0;
    earlier.away_points = 250;
    expect(replayMatch(changed, target).margin).toBe(live.margin);
    expect(JSON.parse(live.evidence).ratingInputs.completedMatchIds).not.toContain(earlier.id);
  });

  it("develops PAV from earlier player performances independently of team Elo", () => {
    const baseline = replayMatch(data, target);
    const evidence = JSON.parse(baseline.evidence);
    const included = new Set<number>(evidence.ratingInputs.completedMatchIds);
    const selected = new Set<number>(
      evidence.lineupObservation.players
        .filter((p: { is_emergency: number }) => p.is_emergency === 0)
        .map((p: { player_id: number }) => p.player_id),
    );
    const changed = structuredClone(data);
    const stat = changed.stats.find((s) => included.has(s.match_id) && selected.has(s.player_id));
    if (!stat) throw new Error("Missing earlier player performance");
    stat.clearances = (stat.clearances ?? 0) + 30;
    const updated = replayMatch(changed, target);
    const ratings = JSON.parse(updated.evidence).ratingInputs;
    expect(ratings.homeElo).toBe(evidence.ratingInputs.homeElo);
    expect(ratings.awayElo).toBe(evidence.ratingInputs.awayElo);
    expect([ratings.homePav, ratings.awayPav]).not.toEqual([
      evidence.ratingInputs.homePav,
      evidence.ratingInputs.awayPav,
    ]);
    expect(updated.margin).not.toBe(baseline.margin);
  });

  it("neutralizes both lineups when a source roster is incomplete and rejects mismatched identities", () => {
    const changed = structuredClone(data);
    const lineup = changed.lineups.find((o) => o.fixture.id === target.id);
    if (!lineup) throw new Error("Missing lineup");
    lineup.players = lineup.players.filter((p) => p.team_id === target.home_team_id);
    const row = replayMatch(changed, target);
    expect(row.provisional).toBe(1);
    expect(JSON.parse(row.evidence).ratingInputs.homePav).toEqual([0, 0, 0]);
    expect(JSON.parse(row.evidence).ratingInputs.awayPav).toEqual([0, 0, 0]);
    lineup.fixture.home_team_id = target.away_team_id;
    expect(() => replayMatch(changed, target)).toThrow("mismatched lineup");
  });

  it("rejects duplicates, unknown kickoff and targets belonging to live publication", () => {
    const changed = structuredClone(data);
    changed.matches.push(target);
    expect(() => replay(changed)).toThrow("Duplicate");
    expect(() => replayMatch(data, { ...target, kickoff_at: null })).toThrow("outside");
    expect(() => replayMatch(data, { ...target, status: "Upcoming" })).toThrow("outside");
    expect(() => replayMatch(data, { ...target, kickoff_at: data.activatedAt })).toThrow("outside");
  });

  it("orders the rebuild independently of extraction order and quotes SQL evidence literally", () => {
    const changed = structuredClone(data);
    changed.matches.reverse();
    expect(replayMatch(changed, target).margin).toBe(replayMatch(data, target).margin);
    expect(
      insertSql("tipper_reconstructions", { evidence: "O'Brien; DROP TABLE matches;" }),
    ).toContain("'O''Brien; DROP TABLE matches;'");
    expect(() => insertSql("tipper_reconstructions", { margin: Number.NaN })).toThrow(
      "Unsupported",
    );
  });
});
