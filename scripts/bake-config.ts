/**
 * Bake the promoted config into a generated Worker module.
 *
 * Resolves the configs/_current.json pointer, validates the config, and
 * emits src/worker/baked-config.ts exporting the parsed config object,
 * its id, and its content hash. The generated file is COMMITTED (footyBot
 * baked-schema pattern): promoting a config = `tipper config promote` +
 * `bun run bake-config` + commit, and the normal GitOps deploy ships it.
 * tests/worker/baked-config.test.ts fails if the snapshot goes stale.
 *
 * This script runs under Bun/Node (fs allowed); the generated OUTPUT uses
 * only Web Standard APIs so it can ship in the Worker bundle.
 *
 * Usage: `bun run bake-config`
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { computeConfigHash } from "../src/config/hash.js";
import { loadConfig, loadCurrentPointer } from "../src/config/store.js";

const OUTPUT_PATH = fileURLToPath(new URL("../src/worker/baked-config.ts", import.meta.url));

const pointer = loadCurrentPointer();
if (!pointer) {
  console.error("bake-config: configs/_current.json not found — promote a config first.");
  process.exit(1);
}

const config = loadConfig(pointer.config_id);
const hash = await computeConfigHash(config);

// Embed the PARSED config (schema validated), so the Worker's
// cold-start re-parse is idempotent and hashes identically.
const json = JSON.stringify(config);
const shadowIds = z
  .array(z.string().min(1))
  .parse(JSON.parse(readFileSync(new URL("../configs/_shadows.json", import.meta.url), "utf8")));
if (new Set(shadowIds).size !== shadowIds.length || shadowIds.includes(pointer.config_id)) {
  throw new Error("Shadow ids must be unique and exclude the promoted model");
}
const shadows = await Promise.all(
  shadowIds.map(async (id) => {
    const shadow = loadConfig(id);
    return { id, hash: await computeConfigHash(shadow), config: shadow };
  }),
);

const content = `// GENERATED FILE — do not edit by hand.
// Produced by \`bun run bake-config\` from configs/_current.json.
// Regenerate and commit after every config promotion; this committed
// snapshot is what ships in the Worker artifact (tipper#30).

import { type Config, ConfigSchema } from "../config/schema.js";

/** Promoted config id (configs/_current.json) at bake time. */
export const BAKED_CONFIG_ID = ${JSON.stringify(pointer.config_id)};

/** Content hash (computeConfigHash) of the baked config. */
export const BAKED_CONFIG_HASH = ${JSON.stringify(hash)};

const RAW_CONFIG = ${JSON.stringify(json)};

/** The promoted model config, validated at Worker cold start. */
export const BAKED_CONFIG: Config = ConfigSchema.parse(JSON.parse(RAW_CONFIG));

/** Frozen challengers. These models may write only prediction_archive. */
export const BAKED_SHADOWS: readonly { id: string; hash: string; config: Config }[] =
  ${JSON.stringify(shadows)}.map((shadow) => ({
    ...shadow, config: ConfigSchema.parse(shadow.config),
  }));
`;

writeFileSync(OUTPUT_PATH, content);
execFileSync(
  fileURLToPath(new URL("../node_modules/.bin/biome", import.meta.url)),
  ["format", "--write", OUTPUT_PATH],
  { stdio: "pipe" },
);
console.log(`bake-config: wrote ${OUTPUT_PATH} (${pointer.config_id}, ${hash.slice(0, 8)})`);
