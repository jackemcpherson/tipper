import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { computeConfigHash } from "../../src/config/hash.js";
import { loadConfig, loadCurrentPointer } from "../../src/config/store.js";
import {
  BAKED_CONFIG,
  BAKED_CONFIG_HASH,
  BAKED_CONFIG_ID,
  BAKED_SHADOWS,
} from "../../src/worker/baked-config.js";

/**
 * Guards a stale generated module: src/worker/baked-config.ts is committed
 * output of `bun run bake-config`, and must always mirror the config the
 * configs/_current.json pointer resolves to.
 */
describe("baked-config", () => {
  it("hash matches computeConfigHash of the baked config object", async () => {
    expect(await computeConfigHash(BAKED_CONFIG)).toBe(BAKED_CONFIG_HASH);
  });

  it("id matches the baked config's own id", () => {
    expect(BAKED_CONFIG.id).toBe(BAKED_CONFIG_ID);
  });

  it("mirrors the promoted config on disk (re-run `bun run bake-config` if this fails)", async () => {
    const pointer = loadCurrentPointer();
    expect(pointer?.config_id).toBe(BAKED_CONFIG_ID);
    const promoted = loadConfig(BAKED_CONFIG_ID);
    expect(await computeConfigHash(promoted)).toBe(BAKED_CONFIG_HASH);
  });
  it("bakes the frozen OD challenger without changing the primary", async () => {
    const ids: unknown = JSON.parse(
      readFileSync(new URL("../../configs/_shadows.json", import.meta.url), "utf8"),
    );
    expect(BAKED_SHADOWS.map((shadow) => shadow.id)).toEqual(ids);
    expect(ids).toEqual(["t40-od"]);
    expect(BAKED_CONFIG_ID).toBe("predha-080");
    expect(BAKED_CONFIG_HASH.slice(0, 8)).toBe("2641f46f");
    for (const shadow of BAKED_SHADOWS) {
      expect(shadow.hash).toBe(await computeConfigHash(loadConfig(shadow.id)));
      expect(await computeConfigHash(shadow.config)).toBe(shadow.hash);
      expect(shadow.hash).toBe(await computeConfigHash(loadConfig("od-w100-k008")));
    }
  });
});
