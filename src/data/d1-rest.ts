/**
 * D1Database-compatible shim that calls the Cloudflare D1 REST API.
 *
 * Implements only the subset used by queries.ts:
 *   db.prepare(sql).bind(...params).all<T>()
 *   db.prepare(sql).all<T>()
 *   db.prepare(sql).bind(param).first<T>()
 */

interface D1RestResponse {
  result: Array<{ results: unknown[]; success: boolean; meta: Record<string, unknown> }>;
  success: boolean;
  errors: Array<{ message: string }>;
}

export interface D1RestClientOptions {
  /** Total attempts for a query that keeps returning HTTP 429 (default 3). */
  maxAttempts?: number;
  /** Base backoff delay in ms when no Retry-After header is present (default 500). */
  retryBaseDelayMs?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createD1RestClient(
  accountId: string,
  databaseId: string,
  apiToken: string,
  options: D1RestClientOptions = {},
): D1Database {
  const baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
  const maxAttempts = options.maxAttempts ?? 3;
  const retryBaseDelayMs = options.retryBaseDelayMs ?? 500;

  /**
   * POST the query, retrying on HTTP 429 (Cloudflare rate limit).
   *
   * Honours the Retry-After header when present; otherwise exponential
   * backoff with jitter. Gives up after maxAttempts and returns the
   * final 429 response for normal error handling.
   */
  async function fetchWithRetry(body: string): Promise<Response> {
    for (let attempt = 1; ; attempt++) {
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body,
      });

      if (response.status !== 429 || attempt >= maxAttempts) {
        return response;
      }

      const retryAfterHeader = response.headers.get("Retry-After");
      const retryAfterSec = retryAfterHeader === null ? Number.NaN : Number(retryAfterHeader);
      const delayMs =
        Number.isFinite(retryAfterSec) && retryAfterSec >= 0
          ? retryAfterSec * 1000
          : retryBaseDelayMs * 2 ** (attempt - 1) * (1 + Math.random());
      await sleep(delayMs);
    }
  }

  async function execute<T>(sql: string, params: unknown[]): Promise<{ results: T[] }> {
    const response = await fetchWithRetry(JSON.stringify({ sql, params }));

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`D1 REST API error (${response.status}): ${text}`);
    }

    const body = (await response.json()) as D1RestResponse;

    if (!body.success) {
      const msg = body.errors[0]?.message ?? "Unknown D1 error";
      throw new Error(`D1 query failed: ${msg}`);
    }

    const first = body.result[0];
    if (!first) {
      throw new Error("D1 REST API returned empty result array");
    }

    return { results: first.results as T[] };
  }

  function makeStatement(sql: string, params: unknown[] = []) {
    return {
      bind(...bindParams: unknown[]) {
        return makeStatement(sql, bindParams);
      },
      async all<T>(): Promise<{ results: T[] }> {
        return execute<T>(sql, params);
      },
      async first<T>(column?: string): Promise<T | null> {
        const { results } = await execute<T>(sql, params);
        const row = results[0];
        if (row === undefined) return null;
        if (column !== undefined) {
          return (row as Record<string, unknown>)[column] as T;
        }
        return row;
      },
      async raw<T>(): Promise<T[]> {
        throw new Error("raw() not implemented in D1 REST shim");
      },
      async run(): Promise<D1Response> {
        throw new Error("run() not implemented in D1 REST shim");
      },
    };
  }

  return {
    prepare(sql: string) {
      return makeStatement(sql);
    },
    batch() {
      throw new Error("batch() not implemented in D1 REST shim");
    },
    exec() {
      throw new Error("exec() not implemented in D1 REST shim");
    },
    dump() {
      throw new Error("dump() not implemented in D1 REST shim");
    },
  } as unknown as D1Database;
}
