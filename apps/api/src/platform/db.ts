import { sql } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './all-schema.ts';

export type Schema = typeof schema;
export type Db = NodePgDatabase<Schema>;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
/** Anything that can run a query: the pool-backed db or an open transaction. */
export type Queryable = Db | Tx;

export type DatabaseOptions = {
  connectionString: string;
  applicationName: string;
  /** Per-isolate pool size. Keep small: total = max × live isolates (docs/neon/03 §1). */
  max?: number;
  statementTimeoutMs?: number;
};

export type Database = { pool: pg.Pool; db: Db };

/**
 * Creates the pooled client. On Neon Functions the caller also passes the pool to
 * attachDatabasePool() so idle disconnects don't crash the isolate.
 */
export function createDatabase(opts: DatabaseOptions): Database {
  const pool = new pg.Pool({
    connectionString: opts.connectionString,
    max: opts.max ?? 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    statement_timeout: opts.statementTimeoutMs ?? 5_000,
    application_name: opts.applicationName,
  });
  return { pool, db: drizzle(pool, { schema }) };
}

/**
 * The one transaction pattern (docs/neon/03 §5): domain decision → writes → outbox,
 * inside one transaction. Sets transaction-local context for audit triggers.
 * Never call providers, AI or fetch inside `fn`.
 */
export async function inTransaction<T>(
  db: Db,
  context: { actorId?: string | null; requestId?: string | null },
  fn: (tx: Tx) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    // set_config(..., true) is transaction-local: safe with the transaction-mode pooler.
    await tx.execute(
      sql`select set_config('app.actor_id', ${context.actorId ?? ''}, true), set_config('app.request_id', ${context.requestId ?? ''}, true)`,
    );
    return fn(tx);
  });
}
