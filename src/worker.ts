/**
 * Cloudflare Worker entry point.
 *
 * Thin HTTP wrapper around the shared orchestration layer.
 * Parses requests, calls orchestration functions with the D1 binding,
 * and returns JSON responses.
 */

import type { Config } from "./config/schema.js";
import { COMPETITION_CODES, type CompetitionCode } from "./data/types.js";
import {
  runBacktest,
  runCalibration,
  runCompare,
  runDeriveVenueHA,
  runPrediction,
} from "./orchestration.js";

interface Env {
  DB: D1Database;
}

function parseCompetition(value: unknown): CompetitionCode {
  if (typeof value === "string" && (COMPETITION_CODES as readonly string[]).includes(value)) {
    return value as CompetitionCode;
  }
  return "AFLM";
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(err: unknown): Response {
  const message = err instanceof Error ? err.message : String(err);
  return jsonResponse({ error: message }, 500);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/backtest" && request.method === "POST") {
      try {
        const body = (await request.json()) as { config: Config; competition?: string } | Config;
        const config = "config" in body ? body.config : body;
        const competition = parseCompetition("competition" in body ? body.competition : undefined);
        return jsonResponse(await runBacktest(env.DB, config, competition));
      } catch (err) {
        return errorResponse(err);
      }
    }

    if (url.pathname === "/predict" && request.method === "POST") {
      try {
        const body = (await request.json()) as {
          config: Config;
          season: number;
          round_number: number;
          competition?: string;
        };
        return jsonResponse(
          await runPrediction(
            env.DB,
            body.config,
            body.season,
            body.round_number,
            parseCompetition(body.competition),
          ),
        );
      } catch (err) {
        return errorResponse(err);
      }
    }

    if (url.pathname === "/compare" && request.method === "POST") {
      try {
        const body = (await request.json()) as {
          configA: Config;
          configB: Config;
          competition?: string;
          nBootstrap?: number;
          seed?: number;
        };
        return jsonResponse(
          await runCompare(
            env.DB,
            body.configA,
            body.configB,
            parseCompetition(body.competition),
            body.nBootstrap,
            body.seed,
          ),
        );
      } catch (err) {
        return errorResponse(err);
      }
    }

    if (url.pathname === "/calibrate" && request.method === "POST") {
      try {
        const body = (await request.json()) as { config: Config; competition?: string } | Config;
        const config = "config" in body ? body.config : body;
        const competition = parseCompetition("competition" in body ? body.competition : undefined);
        return jsonResponse(await runCalibration(env.DB, config, competition));
      } catch (err) {
        return errorResponse(err);
      }
    }

    if (url.pathname === "/derive-venue-ha" && request.method === "POST") {
      try {
        const body = (await request.json()) as {
          seasons: number[];
          competition?: string;
          elo: {
            k: number;
            initial_rating: number;
            home_advantage: number;
            regression_to_mean: number;
            mov_multiplier: "538_log" | "none";
          };
          margin_per_rating_point: number;
          min_matches?: number;
        };
        return jsonResponse(
          await runDeriveVenueHA(env.DB, {
            ...body,
            competition: parseCompetition(body.competition),
          }),
        );
      } catch (err) {
        return errorResponse(err);
      }
    }

    return new Response(
      "tipper worker\n\nEndpoints:\n  POST /backtest\n  POST /predict\n" +
        "  POST /calibrate\n  POST /compare\n  POST /derive-venue-ha\n",
      { headers: { "Content-Type": "text/plain" } },
    );
  },
};
