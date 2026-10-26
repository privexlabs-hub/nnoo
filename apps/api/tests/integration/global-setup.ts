/**
 * Integration database (07 §2). Never production:
 *  - default: a throwaway Postgres 18 container (Testcontainers; needs Docker);
 *  - fallback: INTEGRATION_DATABASE_URL pointing at a disposable `test-*` branch of the
 *    nnoo-dev Neon project (INTEGRATION_NEON_BRANCH must name it). Anything else is refused.
 * Migrations run as the owner; tests connect as nnoo_app_login, like the runtime.
 */
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import pg from 'pg';
import type { TestProject } from 'vitest/node';
import { assertProjectMatchesEnv } from '@nnoo/config/environments';
import { runMigrations } from '../../scripts/migrate.ts';

declare module 'vitest' {
  export interface ProvidedContext {
    ownerUrl: string;
    appUrl: string;
    dbSource: 'container' | 'neon-test-branch';
  }
}

async function provisionAppRole(ownerUrl: string): Promise<string> {
  const password = `t${randomBytes(18).toString('hex')}A1`;
  const c = new pg.Client({ connectionString: ownerUrl });
  await c.connect();
  try {
    await c.query(`do $$ begin
      if not exists (select 1 from pg_roles where rolname = 'nnoo_app_login') then
        create role nnoo_app_login login;
      end if; end $$`);
    await c.query(`alter role nnoo_app_login with login password '${password}'`);
    await c.query('grant nnoo_app to nnoo_app_login');
  } finally {
    await c.end();
  }
  const u = new URL(ownerUrl);
  u.username = 'nnoo_app_login';
  u.password = password;
  return u.toString();
}

export default async function setup(project: TestProject) {
  let ownerUrl: string;
  let stop: () => Promise<void> = async () => {};
  let source: 'container' | 'neon-test-branch';

  if (process.env.INTEGRATION_DATABASE_URL) {
    const branch = process.env.INTEGRATION_NEON_BRANCH ?? '';
    if (!/^test-[a-z0-9-]+$/.test(branch))
      throw new Error('INTEGRATION_NEON_BRANCH must name a disposable test-* branch');
    const ctx = JSON.parse(readFileSync(new URL('../../../../.neon', import.meta.url), 'utf8')) as {
      projectId?: string;
    };
    assertProjectMatchesEnv('test', ctx.projectId); // dev project only, never production
    ownerUrl = process.env.INTEGRATION_DATABASE_URL;
    source = 'neon-test-branch';
  } else {
    const { PostgreSqlContainer } = await import('@testcontainers/postgresql');
    const container = await new PostgreSqlContainer('postgres:18-alpine')
      .withDatabase('nnoo')
      .start();
    ownerUrl = container.getConnectionUri();
    stop = async () => void (await container.stop());
    source = 'container';
  }

  await runMigrations(ownerUrl);
  const appUrl = await provisionAppRole(ownerUrl);
  project.provide('ownerUrl', ownerUrl);
  project.provide('appUrl', appUrl);
  project.provide('dbSource', source);
  return stop;
}
