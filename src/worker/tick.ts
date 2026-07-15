/**
 * Integration seam between the Worker shell and the engine (tipper#30).
 *
 * Wires: state query → publishPlan → per-round publishRound (the exact
 * pipeline the publish CLI uses) with the baked config. Each round is
 * independently caught and logged (fail-soft): one competition's failure
 * never blocks the other, and the next 15-minute tick self-heals. When
 * nothing is due the tick performs no engine runs at all.
 */

import { fetchPublishRoundStates } from "../data/queries.js";
import { publishRound, runPrediction } from "../orchestration.js";
import { BAKED_CONFIG, BAKED_CONFIG_HASH, BAKED_CONFIG_ID } from "./baked-config.js";
import {
  melbourneClock,
  publishPlan,
  publishWindowEndWall,
  type RoundKey,
  type RoundState,
} from "./plan.js";

/**
 * Run the one-per-tick state query and map rows into the pure core's
 * `RoundState` shape. Also serves GET /health, so the health verdict is
 * derived from exactly the data the publisher acts on.
 */
export async function fetchRoundStates(db: D1Database, now: Date): Promise<RoundState[]> {
  const today = melbourneClock(now).date;
  const rows = await fetchPublishRoundStates(db, today, publishWindowEndWall(now));
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
  readonly published: (RoundKey & { readonly rows: number })[];
  readonly failed: RoundKey[];
}

function roundKey(state: RoundState): RoundKey {
  return { competition: state.competition, season: state.season, roundNumber: state.roundNumber };
}

/**
 * One cron tick: publish every round the plan says is due.
 *
 * Rows are stamped with the baked model version and `now` as
 * generated_at; scheduled and manual publishes of the same round are
 * identical because both run through publishRound.
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

  for (const round of due) {
    const label = `${round.competition} ${round.season} R${round.roundNumber}`;
    try {
      const result = await publishRound(
        db,
        BAKED_CONFIG,
        BAKED_CONFIG_ID,
        BAKED_CONFIG_HASH,
        round.season,
        round.roundNumber,
        round.competition,
        now.toISOString(),
        undefined,
        predict,
      );
      if (result.written === 0) {
        console.error(`[publish-tick] ${label}: engine returned no predictions; nothing written`);
        failed.push(roundKey(round));
        continue;
      }
      published.push({ ...roundKey(round), rows: result.written });
      console.log(
        `[publish-tick] ${label}: upserted ${result.written} rows (${result.model_version})`,
      );
    } catch (error) {
      // Fail-soft: log and move on — the next tick is the retry.
      console.error(`[publish-tick] ${label}: publish failed`, error);
      failed.push(roundKey(round));
    }
  }

  return { planned: due.length, published, failed };
}
