/**
 * CLI database factory.
 *
 * Resolves Cloudflare credentials in order:
 *   1. Environment variables (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
 *   2. Wrangler OAuth config (~/.wrangler/config/default.toml)
 *
 * Account ID and database ID have hardcoded defaults since they're stable.
 */

import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createD1RestClient } from "../data/d1-rest.js";

const DEFAULT_ACCOUNT_ID = "3fe79ca9bd3dfd5397249c39ec674a25";
const DEFAULT_DATABASE_ID = "fe1c1a89-805f-481d-9ba0-b9f8dee04a36";

function readWranglerToken(): string | undefined {
  const configPath = join(homedir(), ".wrangler", "config", "default.toml");
  if (!existsSync(configPath)) return undefined;

  const content = readFileSync(configPath, "utf-8");
  const match = /^oauth_token\s*=\s*"(.+)"$/m.exec(content);
  return match?.[1];
}

export function getDatabase(): D1Database {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN ?? readWranglerToken();
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID ?? DEFAULT_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID ?? DEFAULT_DATABASE_ID;

  if (!apiToken) {
    console.error(
      "Error: No Cloudflare credentials found.\n" +
        "Either run `wrangler login` or set CLOUDFLARE_API_TOKEN.",
    );
    process.exit(1);
  }

  return createD1RestClient(accountId, databaseId, apiToken);
}
