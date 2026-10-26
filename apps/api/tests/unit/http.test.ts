import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createApiApp } from '../../src/app.ts';
import type { AppEnv } from '../../src/platform/app-env.ts';
import { fixedClock } from '../../src/platform/clock.ts';
import type { Deps } from '../../src/platform/deps.ts';
import { createLogger } from '../../src/platform/logger.ts';
import { definePolicy, requireActiveAccount } from '../../src/platform/policy.ts';
import { problem } from '../../src/platform/problem.ts';
import { allowAll } from '../../src/platform/rate-limit.ts';
import { BootError, route } from '../../src/platform/route.ts';
import { EDGE_SECRET, testEnv } from './helpers.ts';

function stubDeps(overrides: Partial<Deps> = {}): Deps {
  return {
    env: testEnv(),
    db: {} as never,
    clock: fixedClock(new Date('2026-10-25T12:00:00Z')),
    log: createLogger({}, 'error', () => {}),
    auth: { handler: async () => new Response('should not be reached', { status: 599 }) } as never,
    tokens: {
      issue: async () => ({ token: 'x', expiresAt: new Date() }),
      verify: async () => {
        throw problem('auth.token_invalid', 401);
      },
    },
    actors: { load: async () => ({}) as never, invalidate: () => {} },
    sms: { sendOtp: async () => {} },
    email: { sendOtp: async () => {} },
    rateLimiter: allowAll,
    defer: () => {},
    ...overrides,
  };
}

const edge = { 'x-edge-auth': EDGE_SECRET };

describe('default-deny router (04 §4)', () => {
  const app = new Hono<AppEnv>();
  const ok = { response: z.object({}), rateLimit: 'read' as const, handler: async () => ({}) };

  it('refuses to boot a route without a policy', () => {
    expect(() => route(app, { method: 'GET', path: '/x', ...ok } as never)).toThrow(BootError);
  });
  it('refuses a public route without a reason', () => {
    expect(() => route(app, { method: 'GET', path: '/x', policy: { public: ' ' }, ...ok })).toThrow(
      /without a reason/,
    );
  });
  it('refuses a command that does not declare idempotency', () => {
    const p = definePolicy({ action: 't.write', description: 't', rule: requireActiveAccount });
    expect(() => route(app, { method: 'POST', path: '/x', policy: p, ...ok })).toThrow(
      /must declare idempotent/,
    );
  });
  it('refuses a route without a response schema', () => {
    expect(() =>
      route(app, {
        method: 'GET',
        path: '/x',
        policy: { public: 'r' },
        rateLimit: 'read',
        handler: async () => ({}),
      } as never),
    ).toThrow(/no response schema/);
  });
});

describe('public surface', () => {
  const app = createApiApp(stubDeps());

  it('hides /v1 from callers without the edge secret (ADR-023)', async () => {
    const res = await app.request('/v1/health');
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toContain('application/problem+json');
    const wrong = await app.request('/v1/health', {
      headers: { 'x-edge-auth': `${EDGE_SECRET}x` },
    });
    expect(wrong.status).toBe(404);
  });

  it('serves health through the edge', async () => {
    const res = await app.request('/v1/health', { headers: edge });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ status: 'ok', function: 'api', env: 'test' });
    expect(res.headers.get('x-request-id')).toBeTruthy();
  });

  it('answers unknown routes with a problem document', async () => {
    const res = await app.request('/v1/nope', { headers: edge });
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ code: 'http.not_found', status: 404 });
  });

  it('rejects a malformed bearer token instead of treating the caller as anonymous', async () => {
    const res = await app.request('/v1/health', {
      headers: { ...edge, authorization: 'Bearer not.a.jwt' },
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: 'auth.token_invalid' });
    const bad = await app.request('/v1/health', {
      headers: { ...edge, authorization: 'Basic abc' },
    });
    expect(bad.status).toBe(401);
  });

  it('requires sign-in for protected routes', async () => {
    const res = await app.request('/v1/me', { headers: edge });
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: 'auth.unauthenticated' });
  });

  it('only serves allow-listed Better Auth endpoints', async () => {
    for (const path of [
      '/v1/auth/token',
      '/v1/auth/sign-in/phone-number',
      '/v1/auth/delete-user',
      '/v1/auth/list-sessions',
    ]) {
      const res = await app.request(path, {
        method: path.endsWith('token') ? 'GET' : 'POST',
        headers: edge,
      });
      expect(res.status, path).toBe(404);
    }
  });

  it('forces an upgrade for clients below the minimum version (S-16)', async () => {
    const old = await app.request('/v1/health', {
      headers: { ...edge, 'x-client': 'mobile/1.5.9' },
    });
    expect(old.status).toBe(426);
    expect(await old.json()).toMatchObject({ code: 'client.upgrade_required' });
    const current = await app.request('/v1/health', {
      headers: { ...edge, 'x-client': 'mobile/1.6.0' },
    });
    expect(current.status).toBe(200);
  });

  it('allows CORS only for listed origins', async () => {
    const allowed = await app.request('/v1/health', {
      headers: { ...edge, origin: 'http://localhost:5173' },
    });
    expect(allowed.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
    const other = await app.request('/v1/health', {
      headers: { ...edge, origin: 'https://evil.example' },
    });
    expect(other.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('rejects oversized bodies', async () => {
    const res = await app.request('/v1/sessions', {
      method: 'POST',
      headers: { ...edge, 'content-type': 'application/json' },
      body: JSON.stringify({ platform: 'web', deviceLabel: 'x'.repeat(2 * 1024 * 1024) }),
    });
    expect(res.status).toBe(413);
  });

  it('answers 503 when a sign-in channel is switched off', async () => {
    const off = createApiApp(
      stubDeps({
        env: testEnv({ NNOO_ENV: 'preview', SMS_PROVIDER: 'none', EMAIL_PROVIDER: 'none' }),
      }),
    );
    const res = await off.request('/v1/auth/phone-number/send-otp', {
      method: 'POST',
      headers: { ...edge, 'content-type': 'application/json' },
      body: JSON.stringify({ phoneNumber: '+2348000000000' }),
    });
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ code: 'service.unavailable' });
  });

  it('rate-limits with Retry-After', async () => {
    const limited = createApiApp(
      stubDeps({ rateLimiter: { take: async () => ({ allowed: false, retryAfterSeconds: 7 }) } }),
    );
    const res = await limited.request('/v1/health', { headers: edge });
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('7');
  });
});
