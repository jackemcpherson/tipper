/**
 * Cloudflare Worker entry: the cron publisher for match_predictions
 * (tipper#30). Logic-free shell — every decision lives in plan.ts (pure)
 * and tick.ts (integration seam).
 *
 * - `scheduled`: fires every 15 minutes (cron owned by cloudflare-infra
 *   in prod, wrangler.jsonc for local dev); the in-code gate decides
 *   whether any round actually needs publishing.
 * - `fetch`: GET /health returns 200/503 derived from match_predictions
 *   freshness against the fixture window. GET /tips serves primary predictions.
 */

import { healthStatus } from "./plan.js";
import { fetchRoundStates, runPublishTick } from "./tick.js";
import { TIPS_HEADERS, tipsResponse } from "./tips.js";

export interface Env {
  /** Read-write D1 binding to the afl-stats database. */
  readonly DB: D1Database;
}

export default {
  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    await runPublishTick(env.DB, new Date());
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/tips") {
      if (request.method === "OPTIONS")
        return new Response(null, { status: 204, headers: TIPS_HEADERS });
      if (request.method === "GET") return tipsResponse(request, env.DB);
      return new Response(null, {
        status: 405,
        headers: { ...TIPS_HEADERS, Allow: "GET, OPTIONS" },
      });
    }
    if (request.method === "GET" && url.pathname === "/health") {
      const now = new Date();
      const states = await fetchRoundStates(env.DB, now);
      const status = healthStatus(now, states);
      return Response.json(status, { status: status.healthy ? 200 : 503 });
    }
    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
