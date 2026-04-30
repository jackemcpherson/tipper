/**
 * CLI database factory.
 *
 * Creates a D1 REST client from environment variables.
 */

import { createD1RestClient } from "../data/d1-rest.js";

const DEFAULT_DATABASE_ID = "fe1c1a89-805f-481d-9ba0-b9f8dee04a36";

export function getDatabase(): D1Database {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID ?? DEFAULT_DATABASE_ID;

  if (!apiToken || !accountId) {
    console.error(
      "Error: CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID must be set.\n" +
        "Create an API token at https://dash.cloudflare.com/profile/api-tokens\n" +
        "Find your account ID in the Cloudflare dashboard URL.",
    );
    process.exit(1);
  }

  return createD1RestClient(accountId, databaseId, apiToken);
}
