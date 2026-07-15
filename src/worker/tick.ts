/**
 * Integration seam between the Worker shell and the engine (tipper#30).
 *
 * Wires: state query → publishPlan → per-round runPrediction +
 * upsertPredictions with the baked config. Each round is independently
 * caught and logged (fail-soft): one competition's failure never blocks
 * the other, and the next 15-minute tick self-heals. When nothing is due
 * the tick performs no engine runs at all.
 */

import { shortHash } from "../config/hash.js";
import { formatModelVersion, toPredictionRow, upsertPredictions } from "../data/publish.js";
import { fetchPublishRoundStates } from "../data/queries.js";
import { runPrediction } from "../orchestration.js";
import { BAKED_CONFIG, BAKED_CONFIG_HASH, BAKED_CONFIG_ID } from "./baked-config.js";
import { melbourneClock, PUBLISH_WINDOW_MS, publishPlan, type RoundState } from "./plan.js";

/**
 * Run the one-per-tick state query and map rows into the pure core's
 * `RoundState` shape. Also serves GET /health, so the health verdict is
 * derived from exactly the data the publisher acts on.
 */
export async function fetchRoundStates(db: D1Database, now: Date): Promise<RoundState[]> {
  const today = melbourneClock(now).date;
  const windowEndWall = melbourneClock(new Date(now.getTime() + PUBLISH_WINDOW_MS)).wall;
  const rows = await fetchPublishRoundStates(db, today, windowEndWall);
  return rows.map((row) => ({
    competition: row.competition,
    season: row.season,
    roundNumber: row.round_number,
    firstKickoff: row.first_kickoff,
    hasMatchToday: row.has_match_today === 1,
    lastGeneratedAt: row.last_generated_at,
  }));
}

/** The prediction entry point the tick drives — injectable for tests. */
export type PredictFn = typeof runPrediction;

/** Per-tick outcome summary (also handy for tests and log lines). */
export interface PublishTickResult {
  readonly planned: number;
  readonly published: { competition: string; season: number; roundNumber: number; rows: number }[];
  readonly failed: { competition: string; season: number; roundNumber: number }[];
}

/**
 * One cron tick: publish every round the plan says is due.
 *
 * Rows are stamped with the baked model version and `now` as
 * generated_at, matching what a manual `tipper publish` of the same
 * round would write.
 *
 * @param db - The afl-stats D1 binding.
 * @param now - The current instant (injectable for tests).
 * @param predict - Prediction runner (defaults to runPrediction).
 */
export async function runPublishTick(
  db: D1Database,
  now: Date,
  predict: PredictFn = runPrediction,
): Promise<PublishTickResult> {
  const states = await fetchRoundStates(db, now);
  const due = publishPlan(now, states);

  const published: PublishTickResult["published"] = [];
  const failed: PublishTickResult["failed"] = [];
  const modelVersion = formatModelVersion(BAKED_CONFIG_ID, shortHash(BAKED_CONFIG_HASH));

  for (const round of due) {
    const label = `${round.competition} ${round.season} R${round.roundNumber}`;
    try {
      // Same test_seasons override as the publish CLI, so a scheduled
      // publish and a manual publish of the same round are identical.
      const predictConfig = {
        ...BAKED_CONFIG,
        backtest: { ...BAKED_CONFIG.backtest, test_seasons: [round.season] },
      };
      const result = await predict(
        db,
        predictConfig,
        round.season,
        round.roundNumber,
        round.competition,
      );
      if (result.predictions.length === 0) {
        console.error(`[publish-tick] ${label}: engine returned no predictions; nothing written`);
        failed.push({
          competition: round.competition,
          season: round.season,
          roundNumber: round.roundNumber,
        });
        continue;
      }
      const generatedAt = now.toISOString();
      const rows = result.predictions.map((p) => toPredictionRow(p, modelVersion, generatedAt));
      const written = await upsertPredictions(db, rows);
      published.push({
        competition: round.competition,
        season: round.season,
        roundNumber: round.roundNumber,
        rows: written,
      });
      console.log(`[publish-tick] ${label}: upserted ${written} rows (${modelVersion})`);
    } catch (error) {
      // Fail-soft: log and move on — the next tick is the retry.
      console.error(`[publish-tick] ${label}: publish failed`, error);
      failed.push({
        competition: round.competition,
        season: round.season,
        roundNumber: round.roundNumber,
      });
    }
  }

  return { planned: due.length, published, failed };
}
