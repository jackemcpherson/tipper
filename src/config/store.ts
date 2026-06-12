/**
 * Filesystem-backed config store.
 *
 * Reads and writes configs and results from the `configs/` directory.
 * All I/O is in this module — the rest of the system works with
 * validated in-memory objects.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { computeConfigHash } from "./hash.js";
import {
  type BacktestResultsFile,
  BacktestResultsSchema,
  type Config,
  ConfigSchema,
  type CurrentPointer,
  CurrentPointerSchema,
} from "./schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIGS_DIR = resolve(__dirname, "..", "..", "configs");
const CURRENT_FILE = "_current.json";

/** List all config IDs (directory names under configs/). */
export function listConfigIds(): string[] {
  if (!existsSync(CONFIGS_DIR)) return [];
  return readdirSync(CONFIGS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

/** Load and validate a config by ID. Throws on missing or invalid. */
export function loadConfig(id: string): Config {
  const configPath = join(CONFIGS_DIR, id, "config.json");
  if (!existsSync(configPath)) {
    throw new Error(`Config not found: ${id} (expected ${configPath})`);
  }
  const raw = JSON.parse(readFileSync(configPath, "utf-8"));
  return ConfigSchema.parse(raw);
}

/** Save a config to disk. Creates the directory if needed. */
export function saveConfig(config: Config): void {
  const dir = join(CONFIGS_DIR, config.id);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(join(dir, "config.json"), `${JSON.stringify(config, null, 2)}\n`);
}

/** Load the _current.json pointer. Returns null if not set. */
export function loadCurrentPointer(): CurrentPointer | null {
  const currentPath = join(CONFIGS_DIR, CURRENT_FILE);
  if (!existsSync(currentPath)) return null;
  const raw = JSON.parse(readFileSync(currentPath, "utf-8"));
  return CurrentPointerSchema.parse(raw);
}

/** Write the _current.json pointer. */
export function saveCurrentPointer(pointer: CurrentPointer): void {
  if (!existsSync(CONFIGS_DIR)) {
    mkdirSync(CONFIGS_DIR, { recursive: true });
  }
  writeFileSync(join(CONFIGS_DIR, CURRENT_FILE), `${JSON.stringify(pointer, null, 2)}\n`);
}

/** List results files for a config, sorted by date (newest first). */
export function listResultFiles(configId: string): string[] {
  const dir = join(CONFIGS_DIR, configId);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.startsWith("results-") && f.endsWith(".json"))
    .sort()
    .reverse();
}

/** Load and validate a results file. */
export function loadResults(configId: string, filename: string): BacktestResultsFile {
  const filePath = join(CONFIGS_DIR, configId, filename);
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));
  return BacktestResultsSchema.parse(raw);
}

/** Save backtest results. Filename is results-<iso-date>-<short-hash>.json. */
export function saveResults(configId: string, results: BacktestResultsFile): string {
  const dir = join(CONFIGS_DIR, configId);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const date = new Date().toISOString().slice(0, 10);
  // Short hash in the name so a scope-overridden run (different effective
  // hash) can't overwrite a promotion-valid run from the same day.
  const filename = `results-${date}-${results.config_hash.slice(0, 8)}.json`;
  writeFileSync(join(dir, filename), `${JSON.stringify(results, null, 2)}\n`);
  return filename;
}

/**
 * Validate promotion guardrails.
 *
 * Returns null if promotion is allowed, or an error message if not.
 */
export async function validatePromotion(configId: string, reason: string): Promise<string | null> {
  if (!reason || reason.trim().length === 0) {
    return "Promotion requires a --reason flag with a non-empty value.";
  }

  let config: Config;
  try {
    config = loadConfig(configId);
  } catch {
    return `Config '${configId}' does not exist in configs/.`;
  }

  const resultFiles = listResultFiles(configId);
  if (resultFiles.length === 0) {
    return `Config '${configId}' has no backtest results. Run a backtest first.`;
  }
  // Any results file whose hash matches the current config content proves a
  // backtest ran on exactly this config. The hash covers test_seasons, so a
  // --season-overridden run can never satisfy this (COR-09). Requiring the
  // *latest* file to match would let a same-day scope-overridden run block a
  // legitimate promotion.
  const currentHash = await computeConfigHash(config);
  for (const filename of resultFiles) {
    const results = loadResults(configId, filename);
    if (results.config_hash === currentHash) {
      return null;
    }
  }
  return `Config '${configId}' has no backtest results matching its current content (hash ${currentHash.slice(0, 8)}). The config was modified after its backtests ran. Re-run the backtest before promoting.`;
}

/**
 * Check if a config has stale results (config edited after backtesting).
 *
 * Returns a warning message if stale, null otherwise.
 */
export async function checkStaleResults(configId: string): Promise<string | null> {
  const resultFiles = listResultFiles(configId);
  if (resultFiles.length === 0) return null;

  const config = loadConfig(configId);
  const currentHash = await computeConfigHash(config);

  const staleFiles = [];
  for (const filename of resultFiles) {
    const results = loadResults(configId, filename);
    if (results.config_hash !== currentHash) {
      staleFiles.push(filename);
    }
  }

  if (staleFiles.length > 0) {
    return `Warning: ${staleFiles.length} prior results file(s) for '${configId}' have a different config hash. The config was edited after those backtests ran.`;
  }

  return null;
}
