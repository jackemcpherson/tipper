/**
 * CLI database factory.
 *
 * Resolves Cloudflare credentials in order:
 *   1. CLOUDFLARE_API_TOKEN environment variable
 *   2. Wrangler's OAuth config (current platform locations, then the
 *      legacy ~/.wrangler path)
 *
 * Account ID and database ID have hardcoded defaults since they're stable,
 * but can be overridden with CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_D1_DATABASE_ID.
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createD1RestClient } from "../data/d1-rest.js";

const DEFAULT_ACCOUNT_ID = "3fe79ca9bd3dfd5397249c39ec674a25";
const DEFAULT_DATABASE_ID = "fe1c1a89-805f-481d-9ba0-b9f8dee04a36";

/**
 * Candidate locations of wrangler's config/default.toml, newest first.
 *
 * Modern wrangler stores its global config via xdg-app-paths:
 * ~/Library/Preferences/.wrangler on macOS, $XDG_CONFIG_HOME/.wrangler
 * (default ~/.config/.wrangler) elsewhere. WRANGLER_HOME overrides all.
 * The bare ~/.wrangler path is the legacy (wrangler v1/v2) location.
 */
function wranglerConfigCandidates(): string[] {
  const home = homedir();
  const candidates: Array<string | undefined> = [
    process.env.WRANGLER_HOME,
    process.platform === "darwin" ? join(home, "Library", "Preferences", ".wrangler") : undefined,
    process.env.XDG_CONFIG_HOME ? join(process.env.XDG_CONFIG_HOME, ".wrangler") : undefined,
    join(home, ".config", ".wrangler"),
    join(home, ".wrangler"),
  ];
  return candidates
    .filter((dir): dir is string => dir !== undefined && dir.length > 0)
    .map((dir) => join(dir, "config", "default.toml"));
}

function readWranglerToken(): string | undefined {
  // Multiple config locations can coexist (e.g. an abandoned macOS
  // Library/Preferences file alongside an actively-refreshed ~/.wrangler),
  // so pick the unexpired token with the latest expiration rather than the
  // first file found.
  let best: { token: string; expiresAt: number } | undefined;
  for (const configPath of wranglerConfigCandidates()) {
    if (!existsSync(configPath)) continue;
    const content = readFileSync(configPath, "utf-8");
    // Tolerate leading whitespace and trailing content (e.g. comments) —
    // newer wrangler versions format the TOML differently to v1.
    const tokenMatch = /^\s*oauth_token\s*=\s*"([^"]+)"/m.exec(content);
    if (!tokenMatch?.[1]) continue;
    const expiryMatch = /^\s*expiration_time\s*=\s*"([^"]+)"/m.exec(content);
    const expiresAt = expiryMatch?.[1] ? Date.parse(expiryMatch[1]) : Number.POSITIVE_INFINITY;
    if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) continue;
    if (!best || expiresAt > best.expiresAt) {
      best = { token: tokenMatch[1], expiresAt };
    }
  }
  return best?.token;
}

export function getDatabase(): D1Database {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN ?? readWranglerToken();
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID ?? DEFAULT_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID ?? DEFAULT_DATABASE_ID;

  if (!apiToken) {
    console.error(
      [
        "Error: No Cloudflare credentials found. Provide a token one of two ways:",
        "",
        "  1. Set CLOUDFLARE_API_TOKEN to an API token with D1 read access:",
        "       export CLOUDFLARE_API_TOKEN=<token>",
        "  2. Run `wrangler login` — tipper reuses wrangler's OAuth token from",
        "     its config/default.toml (current and legacy locations are checked).",
      ].join("\n"),
    );
    process.exit(1);
  }

  return createD1RestClient(accountId, databaseId, apiToken);
}
