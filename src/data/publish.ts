/**
 * Write path for publishing predictions to the match_predictions D1 table.
 *
 * The only module that writes to the database (everything in queries.ts is
 * read-only). One row per match, PRIMARY KEY match_id (AFL-MCP#140):
 * republishing after late team changes overwrites in place.
 */

import type { MatchPrediction } from "../types.js";

/** Row shape of the match_predictions table (AFL-MCP#140). */
export interface MatchPredictionRow {
  readonly match_id: number;
  /** Home team's win probability, 0..1. */
  readonly home_win_prob: number;
  /** Predicted margin in points, one decimal; positive = home favoured. */
  readonly predicted_margin: number;
  /** Config id + short content hash, e.g. "predha-080 (2641f46f)". */
  readonly model_version: string;
  /** ISO-8601 instant of the publish run. */
  readonly generated_at: string;
}

/**
 * Convert an engine prediction into a match_predictions row.
 *
 * Orientation: the table is home-oriented — home_win_prob is always the
 * HOME team's probability and predicted_margin is positive when the home
 * team is favoured. `MatchPrediction` is already home-oriented internally
 * (predictedMargin = home − away; winProbability.home), so no sign flip
 * happens here. The human CLI output is the odd one out: it is
 * favourite-oriented ("Sydney by 28.3 (69%)" shows |margin| and the
 * winner's probability), so never derive these values from display
 * formatting. tests/data/publish.test.ts locks both orientations in.
 */
export function toPredictionRow(
  prediction: MatchPrediction,
  modelVersion: string,
  generatedAt: string,
): MatchPredictionRow {
  return {
    match_id: prediction.matchId,
    home_win_prob: prediction.winProbability.home,
    predicted_margin: Math.round(prediction.predictedMargin * 10) / 10,
    model_version: modelVersion,
    generated_at: generatedAt,
  };
}

/** The model_version string, matching the CLI header: "predha-080 (2641f46f)". */
export function formatModelVersion(configId: string, configHashShort: string): string {
  return `${configId} (${configHashShort})`;
}

const UPSERT_COLUMNS = [
  "match_id",
  "home_win_prob",
  "predicted_margin",
  "model_version",
  "generated_at",
] as const;

/**
 * Rows per INSERT statement. 5 binds per row keeps a full chunk at 80
 * parameters, the same ceiling queries.ts uses for D1's ~100-bind limit.
 */
const UPSERT_CHUNK_SIZE = 16;

/**
 * Build a multi-row upsert statement for match_predictions.
 *
 * INSERT ... ON CONFLICT (match_id) DO UPDATE, so republishing a round is
 * idempotent per match. Exported for direct testing of the generated SQL.
 */
export function buildUpsertStatement(rows: readonly MatchPredictionRow[]): {
  sql: string;
  params: unknown[];
} {
  if (rows.length === 0) {
    throw new Error("buildUpsertStatement requires at least one row.");
  }
  const placeholders = rows.map(() => `(${UPSERT_COLUMNS.map(() => "?").join(", ")})`).join(", ");
  const sql = `
    INSERT INTO match_predictions (${UPSERT_COLUMNS.join(", ")})
    VALUES ${placeholders}
    ON CONFLICT (match_id) DO UPDATE SET
      home_win_prob = excluded.home_win_prob,
      predicted_margin = excluded.predicted_margin,
      model_version = excluded.model_version,
      generated_at = excluded.generated_at
  `;
  const params = rows.flatMap((row) => [
    row.match_id,
    row.home_win_prob,
    row.predicted_margin,
    row.model_version,
    row.generated_at,
  ]);
  return { sql, params };
}

/**
 * Upsert prediction rows into match_predictions via the given database.
 *
 * Chunks sequentially (writes, unlike the read queries, are not fired in
 * parallel). Translates the "no such table" D1 error into an actionable
 * message — the table ships with the AFL-MCP#140 migration and may not
 * exist in the target database yet.
 *
 * @returns The number of rows written.
 */
export async function upsertPredictions(
  db: D1Database,
  rows: readonly MatchPredictionRow[],
): Promise<number> {
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK_SIZE);
    const { sql, params } = buildUpsertStatement(chunk);
    try {
      await db
        .prepare(sql)
        .bind(...params)
        .all();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/no such table:?\s*match_predictions/i.test(message)) {
        throw new Error(
          "The match_predictions table does not exist in the target database. " +
            "Deploy the AFL-MCP migration first (AFL-MCP#140), then re-run publish.",
        );
      }
      throw error;
    }
  }
  return rows.length;
}
