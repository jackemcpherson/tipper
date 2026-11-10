import { Schema } from "effect";

/** The current instant in SQLite, in the format every stored instant uses. */
export const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";

/** Matches joined to their season and competition, aliased `m`, `s` and `c`. */
export const MATCHES =
  "FROM matches m JOIN seasons s ON s.id=m.season_id JOIN competitions c ON c.id=s.competition_id";

/**
 * Decode the rows of a completed query. Rows are checked here, once, so the rest of the
 * Worker can trust their types.
 *
 * @param schema - The schema of one row.
 * @param result - A D1 result from `all` or `batch`.
 * @returns The decoded rows.
 */
export function decodeRows<S extends Schema.ConstraintDecoder<unknown>>(
  schema: S,
  result: D1Result | undefined,
): ReadonlyArray<S["Type"]> {
  return Schema.decodeUnknownSync(Schema.Array(schema))(result?.results);
}

/** Run a query and decode every row. */
export async function rows<S extends Schema.ConstraintDecoder<unknown>>(
  schema: S,
  statement: D1PreparedStatement,
): Promise<ReadonlyArray<S["Type"]>> {
  return decodeRows(schema, await statement.all());
}

/** Run a query and decode its first row, or return `undefined` when there is none. */
export async function row<S extends Schema.ConstraintDecoder<unknown>>(
  schema: S,
  statement: D1PreparedStatement,
): Promise<S["Type"] | undefined> {
  const [first] = await rows(schema, statement);

  return first;
}
