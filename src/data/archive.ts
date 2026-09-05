/** Append-only prediction storage. The engine never sees SQL or refetched lineups. */

import { toSquiggleName } from "../comp.js";
import type { Config } from "../config/schema.js";
import type { MatchPrediction } from "../types.js";
import { toPredictionRow } from "./publish.js";
import type { RoundField } from "./squiggle-field.js";
import type { CompetitionCode, MatchLineupRow, MatchRow } from "./types.js";

/** Exact inputs retained from the prediction's own read, not a later query. */
export interface PredictionCaptureInputs {
  readonly matches: readonly MatchRow[];
  readonly lineups: readonly MatchLineupRow[];
}

/** Fixed context for one model's capture of a round. */
export interface ArchiveContext {
  readonly modelVersion: string;
  readonly configHash: string;
  readonly config: Config;
  readonly capturedAt: string;
  readonly competition: CompetitionCode;
  readonly season: number;
  readonly roundNumber: number;
  readonly firstKickoff: string;
  readonly isPrimary: boolean;
}

/** Row contract shared with AFL-MCP migration 0021. */
export interface PredictionArchiveRow {
  readonly match_id: number;
  readonly model_version: string;
  readonly captured_at: string;
  readonly competition: CompetitionCode;
  readonly season_year: number;
  readonly round_number: number;
  readonly round_first_kickoff: string;
  readonly match_kickoff: string;
  readonly is_primary: number;
  readonly home_win_prob: number;
  readonly predicted_margin: number;
  readonly lineups_json: string;
  readonly inputs_json: string;
  readonly field_json: string | null;
  readonly field_captured_at: string | null;
}

/** Retain published precision and original engine precision, with home orientation. */
export function buildArchiveRows(
  predictions: readonly MatchPrediction[],
  inputs: PredictionCaptureInputs,
  context: ArchiveContext,
  field: RoundField | null,
): PredictionArchiveRow[] {
  return predictions.map((prediction) => {
    const match = inputs.matches.find((row) => row.id === prediction.matchId);
    if (!match) throw new Error(`Missing captured fixture for match ${prediction.matchId}`);
    const published = toPredictionRow(prediction, context.modelVersion, context.capturedAt);
    const home = toSquiggleName(prediction.home);
    const away = toSquiggleName(prediction.away);
    const tips = field?.tips.filter((tip) => tip.hteam === home && tip.ateam === away);
    // Outcomes belong to the scorer's later result join, never to input evidence.
    const {
      actualMargin: _margin,
      actualWinner: _winner,
      correct: _correct,
      ...forecast
    } = prediction;
    return {
      match_id: prediction.matchId,
      model_version: context.modelVersion,
      captured_at: context.capturedAt,
      competition: context.competition,
      season_year: context.season,
      round_number: context.roundNumber,
      round_first_kickoff: context.firstKickoff.padEnd(19, ":00"),
      match_kickoff: `${match.date}T${match.local_time ? match.local_time.padEnd(8, ":00") : "00:00:00"}`,
      is_primary: Number(context.isPrimary),
      home_win_prob: published.home_win_prob,
      predicted_margin: published.predicted_margin,
      lineups_json: JSON.stringify(
        inputs.lineups
          .filter((row) => row.match_id === prediction.matchId)
          .map((row) => ({
            player_id: row.player_id,
            team_id: row.team_id,
            position: row.position,
            is_emergency: row.is_emergency,
            is_substitute: row.is_substitute,
          })),
      ),
      inputs_json: JSON.stringify({
        prediction: forecast,
        home_team_id: match.home_team_id,
        away_team_id: match.away_team_id,
        round_type: match.round_type,
        config_hash: context.configHash,
        sigma: context.config.output.sigma,
        probability_model: context.config.output.probability_model ?? "legacy",
        lineup_include: context.config.pav.include,
      }),
      field_json: tips ? JSON.stringify(tips) : null,
      field_captured_at: field?.capturedAt ?? null,
    };
  });
}

const COLUMNS = [
  "match_id",
  "model_version",
  "captured_at",
  "competition",
  "season_year",
  "round_number",
  "round_first_kickoff",
  "match_kickoff",
  "is_primary",
  "home_win_prob",
  "predicted_margin",
  "lineups_json",
  "inputs_json",
  "field_json",
  "field_captured_at",
] as const;

/** Append captures in bounded statements. A retry cannot replace existing evidence. */
export async function appendPredictionArchive(
  db: D1Database,
  rows: readonly PredictionArchiveRow[],
): Promise<void> {
  for (let offset = 0; offset < rows.length; offset += 5) {
    const chunk = rows.slice(offset, offset + 5);
    const placeholders = chunk.map(() => `(${COLUMNS.map(() => "?").join(", ")})`).join(", ");
    try {
      await db
        .prepare(`INSERT INTO prediction_archive (${COLUMNS.join(", ")}) VALUES ${placeholders}
        ON CONFLICT (match_id, model_version, captured_at) DO NOTHING`)
        .bind(...chunk.flatMap((row) => COLUMNS.map((column) => row[column])))
        .all();
    } catch (error) {
      if (/no such table:?\s*prediction_archive/i.test(String(error))) {
        console.warn(
          "[archive] prediction_archive absent; skipping until AFL-MCP migration 0021 applies",
        );
        return;
      }
      throw error;
    }
  }
}
