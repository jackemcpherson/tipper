import { z } from "zod";

/**
 * Read-only SQL access to the shared afl-stats database through the public
 * AFL-MCP endpoint. The endpoint runs prepared statements in a sandbox and
 * returns at most one megabyte per call, so callers chunk large reads.
 */
export const MCP_URL = "https://afl.jackemcpherson.com/mcp";
const UA = "tipper-research/1.0 (jackemcpherson@gmail.com)";
const ResponseSchema = z.object({
  result: z.object({
    isError: z.boolean().optional(),
    content: z.array(z.object({ type: z.string(), text: z.string() })),
  }),
});
const PayloadSchema = z.object({
  columns: z.array(z.string()),
  rows: z.array(z.array(z.union([z.string(), z.number(), z.null()]))),
  truncated: z.boolean(),
});
export type SqlValue = string | number | null;
export type SqlRow = Record<string, SqlValue>;

/** Run one read-only statement and return its rows as objects. */
export async function query(
  sql: string,
  bindings: readonly SqlValue[] = [],
  fetchImpl: typeof fetch = fetch,
): Promise<SqlRow[]> {
  const code = `const statement = db.prepare(${JSON.stringify(sql)}).bind(...${JSON.stringify(bindings)});
const result = await statement.all();
const rows = result.results;
const columns = rows.length ? Object.keys(rows[0]) : [];
return JSON.stringify({ columns, rows: rows.map((row) => columns.map((c) => row[c] ?? null)), truncated: false });`;
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name: "code", arguments: { code } },
  });
  let response: Response | undefined;
  // The endpoint allows sixty calls per minute. Wait out rate limits instead of failing.
  for (let attempt = 0; attempt < 6; attempt++) {
    response = await fetchImpl(MCP_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "user-agent": UA,
      },
      body,
      signal: AbortSignal.timeout(60_000),
    });
    if (response.status !== 429) break;
    const retryAfter = Number(response.headers.get("retry-after"));
    await new Promise((resolve) =>
      setTimeout(
        resolve,
        Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 15_000,
      ),
    );
  }
  if (!response) throw new Error("AFL-MCP request was not attempted");
  if (!response.ok) throw new Error(`AFL-MCP HTTP ${response.status}`);
  const parsed = ResponseSchema.parse(await response.json());
  const text = parsed.result.content[0]?.text ?? "";
  if (parsed.result.isError) throw new Error(`AFL-MCP error: ${text.slice(0, 500)}`);
  let payload: unknown;
  try {
    // The sandbox returns a JSON string. Some transports encode it a second time.
    payload = JSON.parse(text);
    if (typeof payload === "string") payload = JSON.parse(payload);
  } catch {
    throw new Error(`AFL-MCP returned an unreadable payload (${text.length} bytes)`);
  }
  const { columns, rows } = PayloadSchema.parse(payload);
  return rows.map((row) => Object.fromEntries(columns.map((c, i) => [c, row[i] ?? null])));
}
