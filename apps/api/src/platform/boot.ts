import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { attachDatabasePool, waitUntil } from '@neon/functions';
import { FAKE_PROVIDER_ENVS, loadRuntimeEnv, type RuntimeEnv } from '@nnoo/config/env';
import {
  createActorLoader,
  createAuth,
  createTokenService,
  FakeInbox,
  type EmailPort,
  type SmsPort,
} from '../modules/identity/public.ts';
import { ProviderNotConfiguredError } from '../modules/identity/infrastructure/ports.ts';
import { systemClock, type Clock } from './clock.ts';
import { createDatabase, type Database } from './db.ts';
import type { Deps } from './deps.ts';
import { createLogger } from './logger.ts';
import { createRateLimiter, type RateLimiter } from './rate-limit.ts';

export type BootOptions = {
  env?: RuntimeEnv;
  clock?: Clock;
  database?: Database;
  sms?: SmsPort;
  email?: EmailPort;
  rateLimiter?: RateLimiter;
  logSink?: (line: string) => void;
  defer?: (work: Promise<unknown>) => void;
};

function fakeInboxFor(env: RuntimeEnv): FakeInbox {
  if (!FAKE_PROVIDER_ENVS.includes(env.NNOO_ENV))
    throw new ProviderNotConfiguredError('fake providers are local/test only');
  if (env.NNOO_ENV !== 'local') return new FakeInbox();
  // Local development: codes land in <cwd>/.local/otp-inbox.jsonl (gitignored) so a developer
  // can sign in. Never logged.
  const dir = join(process.cwd(), '.local');
  return new FakeInbox((m) => {
    mkdirSync(dir, { recursive: true });
    appendFileSync(join(dir, 'otp-inbox.jsonl'), `${JSON.stringify(m)}\n`);
  });
}

/** Channel switched off (`none`): routes answer 503 before Better Auth is reached. */
const disabled: SmsPort & EmailPort = {
  sendOtp: async () => {
    throw new ProviderNotConfiguredError('sign-in channel is switched off');
  },
};

function providers(env: RuntimeEnv): { sms: SmsPort; email: EmailPort } {
  const fake =
    env.SMS_PROVIDER === 'fake' || env.EMAIL_PROVIDER === 'fake' ? fakeInboxFor(env) : undefined;
  const pick = (choice: string, name: string): SmsPort & EmailPort => {
    if (choice === 'fake') return fake!;
    if (choice === 'none') return disabled;
    throw new ProviderNotConfiguredError(
      `BOOT: ${name}=${choice} adapter is not implemented yet; see docs/neon/07-auth-and-security.md §6`,
    );
  };
  return {
    sms: pick(env.SMS_PROVIDER, 'SMS_PROVIDER'),
    email: pick(env.EMAIL_PROVIDER, 'EMAIL_PROVIDER'),
  };
}

/** Builds every dependency once per isolate. Throws (crashing the boot) on any invalid config. */
export function boot(opts: BootOptions = {}): Deps & { database: Database } {
  const env = opts.env ?? loadRuntimeEnv();
  const clock = opts.clock ?? systemClock;
  const log = createLogger(
    { fn: env.FUNCTION_NAME, env: env.NNOO_ENV },
    env.LOG_LEVEL,
    opts.logSink,
  );

  const database =
    opts.database ??
    createDatabase({ connectionString: env.APP_DATABASE_URL, applicationName: env.FUNCTION_NAME });
  if (!opts.database) attachDatabasePool(database.pool);

  const { sms, email } =
    opts.sms && opts.email ? { sms: opts.sms, email: opts.email } : providers(env);
  const auth = createAuth({ env, db: database.db, sms, email });
  const tokens = createTokenService(auth, clock, new URL(env.AUTH_BASE_URL).origin);

  return {
    env,
    db: database.db,
    database,
    clock,
    log,
    auth,
    tokens,
    actors: createActorLoader(database.db, clock),
    sms,
    email,
    rateLimiter: opts.rateLimiter ?? createRateLimiter(database.db),
    defer:
      opts.defer ??
      ((work) => {
        const tracked = work.catch((e: unknown) =>
          log.error('deferred work failed', { error: (e as Error)?.name }),
        );
        waitUntil(tracked);
      }),
  };
}
