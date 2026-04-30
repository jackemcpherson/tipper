/**
 * Cloudflare Worker entry point.
 *
 * Thin HTTP wrapper around the shared orchestration layer.
 * Parses requests, calls orchestration functions with the D1 binding,
 * and returns JSON responses.
 */

import type { Config } from "./config/schema.js";
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
        const config = (await request.json()) as Config;
        return jsonResponse(await runBacktest(env.DB, config));
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
        };
        return jsonResponse(
          await runPrediction(env.DB, body.config, body.season, body.round_number),
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
          nBootstrap?: number;
          seed?: number;
        };
        return jsonResponse(
          await runCompare(env.DB, body.configA, body.configB, body.nBootstrap, body.seed),
        );
      } catch (err) {
        return errorResponse(err);
      }
    }

    if (url.pathname === "/calibrate" && request.method === "POST") {
      try {
        const config = (await request.json()) as Config;
        return jsonResponse(await runCalibration(env.DB, config));
      } catch (err) {
        return errorResponse(err);
      }
    }

    if (url.pathname === "/derive-venue-ha" && request.method === "POST") {
      try {
        const body = (await request.json()) as {
          seasons: number[];
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
        return jsonResponse(await runDeriveVenueHA(env.DB, body));
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
