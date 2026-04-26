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
  const canonical = JSON.stringify(hashable, Object.keys(hashable).sort());
  const encoded = new TextEncoder().encode(canonical);
  const buffer = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Return the first 8 characters of a config hash for display. */
export function shortHash(hash: string): string {
  return hash.slice(0, 8);
}
