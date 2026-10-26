/**
 * Applies versioned migrations (ADR-018) with environment guards (ADR-027).
 *
 *   NNOO_ENV=local pnpm db:migrate            # your dev/<name> branch on nnoo-dev
 *   NNOO_ENV=production CI=true pnpm db:migrate -- --confirm-production
 *
 * - Uses the owner connection string (MIGRATION_DATABASE_URL, else DATABASE_URL_UNPOOLED,
 *   else DATABASE_URL) on the direct (unpooled) host. Runtime code never sees it.
 * - The Neon project in `.neon` (or NEON_PROJECT_ID) must match NNOO_ENV.
 * - Never drops or rewrites applied migrations; drizzle records them in drizzle.__drizzle_migrations.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { NNOO_ENVS, type NnooEnv } from '@nnoo/config/env';
import { assertProjectMatchesEnv } from '@nnoo/config/environments';

export const MIGRATIONS_FOLDER = fileURLToPath(new URL('../migrations', import.meta.url));
const LOCK_KEY = 72_665_001; // arbitrary, fixed: serialises concurrent migration runs

function fail(message: string): never {
  console.error(`migrate: ${message}`);
  process.exit(1);
}

function neonProjectId(): string | undefined {
  if (process.env.NEON_PROJECT_ID) return process.env.NEON_PROJECT_ID;
  try {
    const ctx = JSON.parse(readFileSync(new URL('../../../.neon', import.meta.url), 'utf8')) as {
      projectId?: string;
    };
    return ctx.projectId;
  } catch {
    return undefined;
  }
}

function isLocalHost(url: string): boolean {
  const h = new URL(url).hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '::1';
}

/** Runs migrations on an already-validated connection string. Used by tests and the CLI. */
export async function runMigrations(connectionString: string): Promise<void> {
  const client = new pg.Client({ connectionString, application_name: 'migrate' });
  await client.connect();
  try {
    await client.query(`set lock_timeout = '2s'`);
    await client.query(`set statement_timeout = '15min'`);
    await client.query('select pg_advisory_lock($1)', [LOCK_KEY]);
    await migrate(drizzle(client), { migrationsFolder: MIGRATIONS_FOLDER });
  } finally {
    await client.query('select pg_advisory_unlock($1)', [LOCK_KEY]).catch(() => {});
    await client.end();
  }
}

async function main() {
  const env = process.env.NNOO_ENV as NnooEnv | undefined;
  if (!env || !NNOO_ENVS.includes(env)) fail(`NNOO_ENV must be one of ${NNOO_ENVS.join(', ')}`);

  const url =
    process.env.MIGRATION_DATABASE_URL ??
    process.env.DATABASE_URL_UNPOOLED ??
    process.env.DATABASE_URL;
  if (!url)
    fail(
      'no owner connection string (MIGRATION_DATABASE_URL / DATABASE_URL_UNPOOLED / DATABASE_URL)',
    );

  if (env === 'production') {
    if (process.env.CI !== 'true') fail('production migrations run from CI only');
    if (!process.argv.includes('--confirm-production')) fail('pass --confirm-production');
  }

  if (isLocalHost(url)) {
    if (env !== 'local' && env !== 'test')
      fail(`a localhost database is only valid for local/test, not ${env}`);
  } else {
    try {
      assertProjectMatchesEnv(env, neonProjectId());
    } catch (e) {
      fail((e as Error).message);
    }
    if (new URL(url).hostname.includes('-pooler'))
      fail('use the direct (unpooled) host for migrations');
  }

  const started = Date.now();
  await runMigrations(url);
  console.log(`migrate: up to date (${env}, ${Date.now() - started} ms)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e: unknown) => {
    // Error messages from pg never contain the password; the URL itself is not printed.
    fail(e instanceof Error ? e.message : String(e));
  });
}
