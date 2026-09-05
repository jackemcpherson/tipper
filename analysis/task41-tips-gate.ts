/** Read-only smoke test of the exported handler against published D1 rows. */
import assert from "node:assert/strict";
import { getDatabase } from "../src/cli/db.js";
import worker from "../src/worker/index.js";

// Bun has no Workers Cache API; this local cache stub never persists anything.
Object.defineProperty(globalThis, "caches", {
  value: {
    default: {
      match: async () => undefined,
      put: async () => {},
    },
  },
  configurable: true,
});
const response = await worker.fetch(new Request("https://tipper.test/tips?year=2026&round=24"), {
  DB: getDatabase(),
});
assert.equal(response.status, 200);
const result = (await response.json()) as {
  tips: { gameid?: number; tipteamid?: number; hteam: string; ateam: string; tip: string }[];
};
assert.equal(result.tips.length, 9);
assert.equal(new Set(result.tips.map((tip) => tip.gameid)).size, 9);
assert(result.tips.every((tip) => tip.gameid !== undefined && tip.tipteamid !== undefined));
assert(result.tips.some((tip) => tip.ateam === "Greater Western Sydney"));
console.log(
  JSON.stringify({
    status: response.status,
    tips: result.tips.length,
    ids: result.tips.map((tip) => tip.gameid),
  }),
);
