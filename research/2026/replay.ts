import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import { z } from "zod";
import { type Fixture, MODEL, predict, type Snapshot, SnapshotSchema } from "../../src/prediction";

/** Pin the deployed production predictor, whose source bytes are checked before replay. */
export const SOURCE_REVISION = "da587769fdd23c7f084fa4e436b628a3e91eecfc";
export const POLICY = "kickoff-reconstruction-v1";
const competition = z.enum(["AFLM", "AFLW"]);
const utc = z.iso.datetime();
const lineupRow = SnapshotSchema.shape.lineups.element.omit({ observed_at: true });
const ObservationSchema = z.object({
  fixture: z.object({
    code: competition,
    id: z.number().int().positive(),
    external_afl_id: z.string(),
    round_number: z.number().int(),
    kickoff_at: utc,
    home_team_id: z.number().int().positive(),
    away_team_id: z.number().int().positive(),
  }),
  observed_at: utc,
  source_endpoint: z.url(),
  source_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  errors: z.array(z.string()).length(0),
  players: z.array(lineupRow.extend({ source_player_id: z.string() })),
});
type Observation = z.infer<typeof ObservationSchema>;
/** Frozen source inputs. Only the adapter creates simulated observation times. */
export interface Dataset {
  extractedAt: string;
  activatedAt: string;
  matches: (Fixture & { competition: "AFLM" | "AFLW" })[];
  stats: (Snapshot["stats"][number] & { competition: "AFLM" | "AFLW" })[];
  priors: (Snapshot["priors"][number] & { competition: "AFLM" | "AFLW" })[];
  league: Record<"AFLM" | "AFLW", Snapshot["league"]>;
  lineups: Observation[];
}
export function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}
const day = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Australia/Melbourne",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
function melbourneDay(instant: string): string {
  return day.format(new Date(instant));
}
function unique<T>(rows: T[], key: (row: T) => string | number): void {
  if (new Set(rows.map(key)).size !== rows.length) throw new Error("Duplicate replay input");
}

/** Decode the retained D1 query responses and independently observed source rosters. */
export function loadDataset(directory = new URL("./", import.meta.url)): Dataset {
  const raw = z
    .array(z.object({ success: z.literal(true), results: z.array(z.unknown()) }))
    .length(7)
    .parse(JSON.parse(gunzipSync(readFileSync(new URL("d1.json.gz", directory))).toString()));
  const header = z.object({ extracted_at: utc, activated_at: utc }).parse(raw[0]?.results[0]);
  const matches = z
    .array(SnapshotSchema.shape.matches.element.extend({ competition }))
    .parse(raw[1]?.results);
  const stats = z
    .array(SnapshotSchema.shape.stats.element.extend({ competition }))
    .parse(raw[2]?.results);
  const priors = z
    .array(SnapshotSchema.shape.priors.element.extend({ competition }))
    .parse(raw[3]?.results);
  const points = z
    .array(z.object({ competition, points: z.number().nonnegative() }))
    .length(2)
    .parse(raw[5]?.results);
  const inside = z
    .array(z.object({ competition, inside50: z.number().nonnegative() }))
    .length(2)
    .parse(raw[6]?.results);
  unique(points, (r) => r.competition);
  unique(inside, (r) => r.competition);
  const league = (code: "AFLM" | "AFLW") =>
    SnapshotSchema.shape.league.parse({
      points: points.find((r) => r.competition === code)?.points,
      inside50: inside.find((r) => r.competition === code)?.inside50,
    });
  return {
    extractedAt: header.extracted_at,
    activatedAt: header.activated_at,
    matches,
    stats,
    priors,
    league: { AFLM: league("AFLM"), AFLW: league("AFLW") },
    lineups: z
      .array(ObservationSchema)
      .parse(
        JSON.parse(gunzipSync(readFileSync(new URL("lineups.json.gz", directory))).toString()),
      ),
  };
}

/** Replay one pre-activation fixture, conservatively excluding its entire local match day. */
export function replayMatch(data: Dataset, target: Dataset["matches"][number]) {
  if (
    target.year !== 2026 ||
    target.status !== "Complete" ||
    !target.kickoff_at ||
    target.kickoff_at >= data.activatedAt ||
    target.kickoff_at >= data.extractedAt
  )
    throw new Error("Target is outside the pre-activation reconstruction scope");
  const cutoff = new Date(Date.parse(target.kickoff_at) - 1).toISOString();
  const targetDay = melbourneDay(target.kickoff_at);
  const history = data.matches.filter((m) => {
    if (
      m.competition !== target.competition ||
      m.id === target.id ||
      m.status !== "Complete" ||
      m.home_points === null ||
      m.away_points === null ||
      m.year < 2020 ||
      m.year > 2026
    )
      return false;
    if (m.year < 2026) return true;
    if (!m.kickoff_at) throw new Error(`Missing historical kickoff: ${m.id}`);
    return m.kickoff_at < cutoff && melbourneDay(m.kickoff_at) < targetDay;
  });
  const completedIds = new Set(history.map((m) => m.id));
  const observation = data.lineups.find((o) => o.fixture.id === target.id);
  if (
    !observation ||
    observation.fixture.code !== target.competition ||
    observation.fixture.external_afl_id !== target.external_afl_id ||
    observation.fixture.home_team_id !== target.home_team_id ||
    observation.fixture.away_team_id !== target.away_team_id ||
    observation.fixture.kickoff_at !== target.kickoff_at ||
    observation.fixture.round_number !== target.round_number
  )
    throw new Error(`Missing or mismatched lineup observation: ${target.id}`);
  const snapshot = SnapshotSchema.parse({
    round: { competition: target.competition, season: 2026, round: target.round_number },
    observedAt: cutoff,
    matches: history,
    candidates: [{ ...target, status: "Upcoming", home_points: null, away_points: null }],
    stats: data.stats.filter(
      (s) =>
        s.competition === target.competition &&
        completedIds.has(s.match_id) &&
        history.some((m) => m.id === s.match_id && m.year === 2026),
    ),
    priors: data.priors.filter((p) => p.competition === target.competition),
    // Simulated availability is an assumption, never an assertion of when we observed this roster.
    lineups: observation.players.map((p) => ({ ...p, observed_at: cutoff })),
    league: data.league[target.competition],
  });
  const prediction = predict(snapshot)[0];
  if (
    !prediction ||
    prediction.fixture.id !== target.id ||
    !Number.isFinite(prediction.margin) ||
    !Number.isFinite(prediction.homeProbability)
  )
    throw new Error(`Invalid prediction: ${target.id}`);
  const excludedSameDayMatchIds = data.matches
    .filter(
      (m) =>
        m.competition === target.competition &&
        m.id !== target.id &&
        m.status === "Complete" &&
        m.kickoff_at &&
        m.kickoff_at < cutoff &&
        melbourneDay(m.kickoff_at) === targetDay,
    )
    .map((m) => m.id)
    .sort((a, b) => a - b);
  return {
    match_id: target.id,
    competition: target.competition,
    round_number: target.round_number,
    cutoff_at: cutoff,
    kickoff_at: target.kickoff_at,
    home_team_id: target.home_team_id,
    away_team_id: target.away_team_id,
    margin: prediction.margin,
    home_probability: prediction.homeProbability,
    winner: prediction.winner,
    issued_margin: prediction.issuedMargin,
    issued_probability: prediction.issuedProbability,
    provisional: Number(prediction.provisional),
    evidence: JSON.stringify({
      classification: "reconstructed",
      policy: POLICY,
      input_sha256: sha256(JSON.stringify(snapshot)),
      sourceFixture: target,
      lineupObservation: observation,
      simulatedLineupAvailableAt: cutoff,
      excludedSameDayMatchIds,
      ratingInputs: prediction.evidence,
    }),
  };
}

/** Generate exactly one row for every stored completed 2026 pre-activation fixture. */
export function replay(data: Dataset) {
  unique(data.matches, (m) => m.id);
  unique(data.stats, (s) => `${s.match_id}:${s.player_id}`);
  unique(data.priors, (p) => `${p.competition}:${p.player_id}`);
  unique(data.lineups, (o) => o.fixture.id);
  const targets = data.matches.filter(
    (m) =>
      m.year === 2026 &&
      m.status === "Complete" &&
      (!m.kickoff_at || m.kickoff_at < data.activatedAt),
  );
  if (!targets.length) throw new Error("No reconstruction targets");
  return targets.sort((a, b) => a.id - b.id).map((target) => replayMatch(data, target));
}

function literal(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string") return `'${value.replaceAll("'", "''")}'`;
  throw new Error("Unsupported SQL value");
}
/** Offline SQL artifact contains only inserts into the separate reconstruction tables. */
export function insertSql(
  table: "tipper_reconstructions" | "tipper_reconstruction_batches",
  row: Record<string, unknown>,
): string {
  const sql = `INSERT INTO ${table}(${Object.keys(row).join(",")}) VALUES(${Object.values(row).map(literal).join(",")});`;
  if (Buffer.byteLength(sql) >= 100_000) throw new Error("Statement exceeds D1 limit");
  return sql;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const modelBytes = readFileSync(new URL("../../src/prediction.ts", import.meta.url));
  const pinnedHash = readFileSync(new URL("model.sha256", import.meta.url), "utf8").trim();
  if (sha256(modelBytes) !== pinnedHash) throw new Error("Production predictor source changed");
  const started = performance.now();
  const data = loadDataset();
  const rosters = z
    .record(z.string(), z.string())
    .parse(
      JSON.parse(
        gunzipSync(readFileSync(new URL("source-rosters.json.gz", import.meta.url))).toString(),
      ),
    );
  for (const observation of data.lineups) {
    const raw = rosters[`lineup-${observation.fixture.id}.json`];
    if (!raw || sha256(raw) !== observation.source_sha256)
      throw new Error(`Retained source roster checksum mismatch: ${observation.fixture.id}`);
  }
  const rows = replay(data);
  const output = JSON.stringify(rows);
  const manifest = {
    classification: "reconstructed",
    policy: POLICY,
    season: 2026,
    model_version: `${MODEL.identity}@${SOURCE_REVISION}`,
    source_revision: SOURCE_REVISION,
    model_sha256: pinnedHash,
    adapter_sha256: sha256(readFileSync(fileURLToPath(import.meta.url))),
    d1_sha256: sha256(readFileSync(new URL("d1.json.gz", import.meta.url))),
    lineups_sha256: sha256(readFileSync(new URL("lineups.json.gz", import.meta.url))),
    source_rosters_sha256: sha256(readFileSync(new URL("source-rosters.json.gz", import.meta.url))),
    source_audit_sha256: sha256(readFileSync(new URL("source-audit.json.gz", import.meta.url))),
    output_sha256: sha256(output),
    extracted_at: data.extractedAt,
    activated_at: data.activatedAt,
    scope:
      "Stored Complete 2026 fixtures before activation. Upcoming fixtures use the production publisher.",
    assumptions: [
      "Current source matchday rosters are proxies for the lineups available at kickoff; historical announcement observations do not exist.",
      "Only earlier Melbourne calendar-day completed results enter ratings; same-day results are excluded because completion times are unavailable.",
      "Final scores, player statistics, 2025 priors and fixture details are their extracted versions and may contain later source corrections.",
      "cutoff_at and simulated lineup availability describe the replay, not historical collection or publication timestamps.",
      "These are model reconstructions, excluded from prospective coverage, feeds and weekly competition reports.",
    ],
    counts: Object.fromEntries(
      ["AFLM", "AFLW"].map((c) => [c, rows.filter((r) => r.competition === c).length]),
    ),
    provisional_count: rows.filter((r) => r.provisional).length,
    same_day_exclusions: rows.filter(
      (r) => JSON.parse(r.evidence).excludedSameDayMatchIds.length > 0,
    ).length,
    match_ids: rows.map((r) => r.match_id),
  };
  const batchId = `2026-kickoff-${sha256(JSON.stringify(manifest)).slice(0, 16)}`;
  const sql = [
    insertSql("tipper_reconstruction_batches", {
      id: batchId,
      season: 2026,
      model_version: manifest.model_version,
      source_revision: SOURCE_REVISION,
      policy: POLICY,
      extracted_at: data.extractedAt,
      created_at: new Date().toISOString(),
      expected_count: rows.length,
      manifest: JSON.stringify(manifest),
    }),
    ...rows.map((row) => insertSql("tipper_reconstructions", { batch_id: batchId, ...row })),
    `UPDATE tipper_reconstruction_batches SET completed_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=${literal(batchId)} AND completed_at IS NULL;`,
  ].join("\n");
  writeFileSync(new URL("output.json", import.meta.url), output);
  writeFileSync(
    new URL("manifest.json", import.meta.url),
    JSON.stringify({ batch_id: batchId, ...manifest }, null, 2),
  );
  writeFileSync(new URL("import.sql", import.meta.url), sql);
  console.log(
    JSON.stringify({
      batchId,
      counts: manifest.counts,
      provisional: manifest.provisional_count,
      sameDayExclusions: manifest.same_day_exclusions,
      outputSha256: manifest.output_sha256,
      milliseconds: performance.now() - started,
      peakRss: process.resourceUsage().maxRSS,
      sqlBytes: Buffer.byteLength(sql),
    }),
  );
}
