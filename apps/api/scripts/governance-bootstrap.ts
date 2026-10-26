/**
 * One-time interim custodian council bootstrap (docs/plans/phase-1 §8, decision 2). Runs only
 * from CI (`.github/workflows/governance-bootstrap.yml`), after two required reviewers approve
 * the `governance` environment. There is no API endpoint for this.
 *
 *   CI=true NNOO_ENV=<env> APP_DATABASE_URL=… APPROVERS=alice,bob \
 *     tsx scripts/governance-bootstrap.ts council.json
 */
import { readFileSync } from 'node:fs';
import { NNOO_ENVS, type NnooEnv } from '@nnoo/config/env';
import { assertNotProductionDatabase } from '@nnoo/config/environments';
import { bootstrapInterimCouncil, BootstrapInput } from '../src/modules/governance/public.ts';
import { createDatabase } from '../src/platform/db.ts';

function fail(m: string): never {
  console.error(`governance-bootstrap: ${m}`);
  process.exit(1);
}

const env = process.env.NNOO_ENV as NnooEnv | undefined;
if (!env || !NNOO_ENVS.includes(env)) fail('NNOO_ENV is required');
if (process.env.CI !== 'true' && env !== 'local' && env !== 'test')
  fail('runs from CI only (with two approvers)');
const url = process.env.APP_DATABASE_URL ?? fail('APP_DATABASE_URL is required (runtime role)');
assertNotProductionDatabase(env, url);
const file = process.argv[2] ?? fail('pass the council JSON file');

const parsed = BootstrapInput.safeParse({
  ...(JSON.parse(readFileSync(file, 'utf8')) as object),
  approvers: (process.env.APPROVERS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
});
if (!parsed.success)
  fail(parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));

const { pool, db } = createDatabase({
  connectionString: url,
  applicationName: 'governance-bootstrap',
});
try {
  const r = await bootstrapInterimCouncil(db, parsed.data);
  console.log(`governance-bootstrap: event ${r.eventId}, ${r.granted} custodian grants (${env})`);
} catch (e) {
  fail(
    e instanceof Error ? `${e.name}: ${(e as { detail?: string }).detail ?? e.message}` : String(e),
  );
} finally {
  await pool.end();
}
