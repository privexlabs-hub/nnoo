/**
 * API for browser end-to-end tests (Playwright in apps/web). Never touches Neon:
 * a throwaway Postgres 18 container (Docker), migrated from empty, used through the runtime
 * role exactly like production. Fake SMS/email (NNOO_ENV=test) append each code to the file
 * named by E2E_INBOX, which the browser test reads. No test-only HTTP routes exist.
 *
 *   E2E_INBOX=/tmp/inbox.jsonl E2E_EDGE_SECRET=… pnpm --filter @nnoo/api e2e:server
 */
import { appendFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { serve } from '@hono/node-server';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { loadRuntimeEnv } from '@nnoo/config/env';
import { createApiApp } from '../src/app.ts';
import { FakeInbox } from '../src/modules/identity/public.ts';
import { boot } from '../src/platform/boot.ts';
import { provisionAppRole } from '../tests/integration/global-setup.ts';
import { runMigrations } from './migrate.ts';

const inboxFile = process.env.E2E_INBOX;
const edgeSecret = process.env.E2E_EDGE_SECRET;
const port = Number(process.env.E2E_API_PORT ?? 8788);
const webOrigin = process.env.E2E_WEB_ORIGIN ?? 'http://localhost:5174';
if (!inboxFile || !edgeSecret || edgeSecret.length < 32) {
  console.error('E2E_INBOX and E2E_EDGE_SECRET (≥ 32 chars) are required');
  process.exit(2);
}

const container = await new PostgreSqlContainer('postgres:18-alpine').withDatabase('nnoo').start();
const ownerUrl = container.getConnectionUri();
await runMigrations(ownerUrl);
const appUrl = await provisionAppRole(ownerUrl);

const env = loadRuntimeEnv({
  NNOO_ENV: 'test',
  FUNCTION_NAME: 'api',
  APP_DATABASE_URL: appUrl,
  AUTH_SECRET: randomBytes(36).toString('base64url'),
  AUTH_BASE_URL: `http://localhost:${port}`,
  AUTH_TRUSTED_ORIGINS: webOrigin,
  CORS_ALLOWED_ORIGINS: webOrigin,
  EDGE_AUTH_SECRETS: edgeSecret,
  SMS_PROVIDER: 'fake',
  EMAIL_PROVIDER: 'fake',
  STORAGE_PROVIDER: 'fake',
  LOG_LEVEL: 'warn',
});

writeFileSync(inboxFile, '');
const inbox = new FakeInbox((m) => appendFileSync(inboxFile, `${JSON.stringify(m)}\n`));
// One browser journey makes more than the 10 auth calls a minute an IP may make, so the durable
// limiter is off here, as in the integration harness; its limits have their own integration tests.
const deps = boot({
  env,
  sms: inbox,
  email: inbox,
  rateLimiter: { take: async () => ({ allowed: true, retryAfterSeconds: 0 }) },
});
const server = serve({ fetch: createApiApp(deps).fetch, port, hostname: '127.0.0.1' }, () =>
  console.warn(`e2e api ready on http://localhost:${port}`),
);

let stopping = false;
const stop = async () => {
  if (stopping) return;
  stopping = true;
  server.close();
  await deps.database.pool.end().catch(() => {});
  await container.stop().catch(() => {});
  process.exit(0);
};
process.on('SIGINT', () => void stop());
process.on('SIGTERM', () => void stop());
