/**
 * Content hashing for config identity.
 *
 * Hash = SHA-256 of the canonical JSON of a config minus `id` and `notes`.
 * Two configs with the same hash are the same model regardless of naming.
 */

import type { Config } from "./schema.js";

/**
 * Compute the content hash of a config, excluding `id` and `notes`.
 *
 * Uses the Web Crypto API (available in both Node.js 20+ and Workers).
 *
 * @param config - The validated config object.
 * @returns Hex-encoded SHA-256 hash.
 */
export async function computeConfigHash(config: Config): Promise<string> {
  const { id: _id, notes: _notes, ...hashable } = config;
  const canonical = JSON.stringify(canonicalize(hashable));
  const encoded = new TextEncoder().encode(canonical);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Recursively sorts object keys so JSON serialisation is order-independent
 * at every nesting level.
 *
 * The previous implementation passed `Object.keys(hashable).sort()` as
 * JSON.stringify's replacer; the array form acts as a key allowlist at every
 * depth, which stripped all nested parameters and made every config hash
 * identical.
 */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, canonicalize(record[key])]),
    );
  }
  return value;
}

/** Return the first 8 characters of a config hash for display. */
export function shortHash(hash: string): string {
  return hash.slice(0, 8);
}
