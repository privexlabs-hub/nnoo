import { randomInt } from 'node:crypto';
import pg from 'pg';
import { inject } from 'vitest';
import { createApiApp, createJobsApp } from '../../src/app.ts';
import { FakeInbox } from '../../src/modules/identity/public.ts';
import { boot } from '../../src/platform/boot.ts';
import { fixedClock } from '../../src/platform/clock.ts';
import { EDGE_SECRET, testEnv } from '../unit/helpers.ts';

export { EDGE_SECRET };
export const EDGE = { 'x-edge-auth': EDGE_SECRET } as const;

/** A full app wired to the integration database as the runtime role. */
export function harness(opts: { realRateLimits?: boolean; start?: Date } = {}) {
  const inbox = new FakeInbox();
  const clock = fixedClock(opts.start ?? new Date());
  const env = testEnv({ APP_DATABASE_URL: inject('appUrl') });
  // Background work (post-commit kicks) is collected so tests can wait for it: settle().
  const pending: Promise<unknown>[] = [];
  const logs: string[] = [];
  const deps = boot({
    env,
    clock,
    sms: inbox,
    email: inbox,
    logSink: (l) => logs.push(l),
    defer: (p) =>
      void pending.push(p.catch((e: unknown) => logs.push(`deferred failed: ${String(e)}`))),
    ...(opts.realRateLimits
      ? {}
      : { rateLimiter: { take: async () => ({ allowed: true, retryAfterSeconds: 0 }) } }),
  });
  const api = createApiApp(deps);
  const jobs = createJobsApp(deps);

  const call = (
    path: string,
    init: { method?: string; headers?: Record<string, string>; json?: unknown } = {},
  ) =>
    api.request(path, {
      method: init.method ?? (init.json !== undefined ? 'POST' : 'GET'),
      headers: {
        ...EDGE,
        ...(init.json !== undefined ? { 'content-type': 'application/json' } : {}),
        ...init.headers,
      },
      ...(init.json !== undefined ? { body: JSON.stringify(init.json) } : {}),
    });

  const settle = async () => {
    while (pending.length) await Promise.all(pending.splice(0));
  };
  return {
    deps,
    inbox,
    clock,
    api,
    jobs,
    call,
    logs,
    settle,
    close: async () => (await settle(), deps.database.pool.end()),
  };
}

export type Harness = ReturnType<typeof harness>;

/** A Nigerian-format test number that is unique per call (synthetic, never a real person). */
export const testPhone = () => `+23480${String(randomInt(0, 99_999_999)).padStart(8, '0')}`;

/** Phone OTP sign-in → session exchange. Returns tokens plus the Better Auth ceremony token. */
export async function signInWithPhone(
  h: Harness,
  phone = testPhone(),
  platform: 'ios' | 'android' | 'web' = 'android',
) {
  const sent = await h.call('/v1/auth/phone-number/send-otp', { json: { phoneNumber: phone } });
  if (sent.status !== 200) throw new Error(`send-otp ${sent.status}: ${await sent.text()}`);
  const code = h.inbox.latestCode(phone)!;
  const verified = await h.call('/v1/auth/phone-number/verify', {
    json: { phoneNumber: phone, code },
  });
  if (verified.status !== 200)
    throw new Error(`verify ${verified.status}: ${await verified.text()}`);
  const { token: ceremonyToken } = (await verified.json()) as { token: string };
  const exchanged = await h.call('/v1/sessions', {
    json: { platform },
    headers: { 'x-auth-session': ceremonyToken },
  });
  if (exchanged.status !== 201)
    throw new Error(`exchange ${exchanged.status}: ${await exchanged.text()}`);
  const session = (await exchanged.json()) as {
    sessionId: string;
    deviceId: string;
    accessToken: string;
    refreshToken: string;
  };
  return { phone, ceremonyToken, ...session };
}

/** Owner connection for assertions that bypass the runtime role. Tests only. */
export async function asOwner<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: inject('ownerUrl') });
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.end();
  }
}

export async function asApp<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: inject('appUrl') });
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.end();
  }
}
