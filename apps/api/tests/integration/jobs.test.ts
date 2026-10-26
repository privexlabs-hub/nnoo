import { randomUUID } from 'node:crypto';
import type { Hono } from 'hono';
import { afterAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import type { AppEnv } from '../../src/platform/app-env.ts';
import {
  claim,
  createRegistry,
  drain,
  enqueue,
  PermanentJobError,
  runJob,
} from '../../src/platform/jobs/queue.ts';
import { definePolicy, requireActiveAccount } from '../../src/platform/policy.ts';
import { createPlatformApp } from '../../src/platform/http.ts';
import { route } from '../../src/platform/route.ts';
import { identityRoutes } from '../../src/modules/identity/public.ts';
import { asApp, asOwner, EDGE, harness, signInWithPhone } from './harness.ts';

const h = harness();
afterAll(() => h.close());

function triggerBody(invocationId: string, name = 'jobs-drain') {
  return {
    version: 1,
    invocation_id: invocationId,
    trigger: { type: 'schedule', id: `trg_${name}`, name },
    data: { scheduled_at: new Date().toISOString() },
  };
}

const deliver = (
  path: string,
  invocationId: string,
  headers: Record<string, string> = { 'x-neon-trigger-invocation-id': invocationId },
) =>
  h.jobs.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(triggerBody(invocationId)),
  });

describe('outbox → job → handler through the drain trigger (docs/neon/10 §0.10)', () => {
  it('delivers a PlatformPing event to its handler exactly once', async () => {
    const aggregate = randomUUID();
    await asApp((c) =>
      c.query(
        `insert into outbox_event (type, aggregate_id, payload) values ('PlatformPing', $1, '{}')`,
        [aggregate],
      ),
    );

    const inv = `inv-${randomUUID()}`;
    const res = await deliver('/internal/jobs/drain', inv);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });

    const handled = await asOwner((c) =>
      c.query(
        `select count(*)::int as n from audit_log where action = 'platform.ping_handled' and resource_id = $1`,
        [aggregate],
      ),
    );
    expect(handled.rows[0]!.n).toBe(1);

    // A duplicate delivery (platform retry) is a no-op.
    const dup = await deliver('/internal/jobs/drain', inv);
    expect(await dup.json()).toEqual({ duplicate: true });
    // A fresh drain does not run the handler again.
    await deliver('/internal/jobs/drain', `inv-${randomUUID()}`);
    const again = await asOwner((c) =>
      c.query(
        `select count(*)::int as n from audit_log where action = 'platform.ping_handled' and resource_id = $1`,
        [aggregate],
      ),
    );
    expect(again.rows[0]!.n).toBe(1);
  });

  it('rejects calls without the trigger header (spoof attempt) and malformed bodies', async () => {
    const res = await deliver('/internal/jobs/drain', `inv-${randomUUID()}`, {});
    expect(res.status).toBe(401);
    const bad = await h.jobs.request('/internal/jobs/drain', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-neon-trigger-invocation-id': 'x' },
      body: JSON.stringify({ hello: 'world' }),
    });
    expect(bad.status).toBe(400);
  });

  it('exposes no /v1 routes and no edge on the jobs function', async () => {
    expect((await h.jobs.request('/v1/health', { headers: EDGE })).status).toBe(404);
    expect((await h.jobs.request('/internal/health')).status).toBe(200);
  });

  it('runs read-only monitors and daily maintenance through triggers', async () => {
    const mon = await deliver('/internal/invariants/check', `inv-${randomUUID()}`);
    expect(mon.status).toBe(200);
    expect(await mon.json()).toMatchObject({ ok: true });
    const maint = await deliver('/internal/maintenance', `inv-${randomUUID()}`);
    expect(maint.status).toBe(200);
  });
});

describe('job queue semantics (06 §2)', () => {
  it('concurrent claims never hand the same job to two workers', async () => {
    const tag = randomUUID();
    for (let i = 0; i < 30; i++)
      await enqueue(h.deps.db, { type: 'test.noop', queue: 'notify', payload: { tag, i } });
    const [a, b, c] = await Promise.all([
      claim(h.deps.db, 'notify', 15),
      claim(h.deps.db, 'notify', 15),
      claim(h.deps.db, 'notify', 15),
    ]);
    const ids = [...a, ...b, ...c]
      .filter((j) => (j.payload as { tag?: string }).tag === tag)
      .map((j) => j.id);
    expect(new Set(ids).size).toBe(ids.length);
    await asOwner((cl) =>
      cl.query(`update job set done_at = now() where payload->>'tag' = $1`, [tag]),
    );
  });

  it('dedupe keys coalesce open jobs (debounce)', async () => {
    const key = `test.debounce:${randomUUID()}`;
    expect(
      await enqueue(h.deps.db, {
        type: 'test.noop',
        queue: 'default',
        payload: {},
        dedupeKey: key,
      }),
    ).toBe(true);
    expect(
      await enqueue(h.deps.db, {
        type: 'test.noop',
        queue: 'default',
        payload: {},
        dedupeKey: key,
      }),
    ).toBe(false);
    await asOwner((c) => c.query(`update job set done_at = now() where dedupe_key = $1`, [key]));
  });

  it('retries with backoff, then fails permanently after max attempts and calls onExhausted', async () => {
    let exhausted = 0;
    const tag = randomUUID();
    const registry = createRegistry(
      [
        {
          type: 'test.flaky',
          queue: 'default',
          maxAttempts: 2,
          run: async () => {
            throw new Error('provider timeout');
          },
          onExhausted: async () => void exhausted++,
        },
      ],
      {},
    );
    await enqueue(h.deps.db, {
      type: 'test.flaky',
      queue: 'default',
      payload: { tag },
      maxAttempts: 2,
    });
    const mine = async () =>
      (await claim(h.deps.db, 'default', 50)).filter(
        (j) => (j.payload as { tag?: string }).tag === tag,
      );

    const [first] = await mine();
    expect(await runJob(h.deps.db, registry, first!, () => new Date())).toBe('retry');
    await asOwner((c) =>
      c.query(`update job set run_at = now() where payload->>'tag' = $1`, [tag]),
    ); // skip the backoff wait
    const [second] = await mine();
    expect(await runJob(h.deps.db, registry, second!, () => new Date())).toBe('failed');
    expect(exhausted).toBe(1);
    const row = await asOwner((c) =>
      c.query(
        `select attempts, failed_at is not null as failed, last_error from job where payload->>'tag' = $1`,
        [tag],
      ),
    );
    expect(row.rows[0]).toMatchObject({ attempts: 2, failed: true });
    expect(row.rows[0].last_error).toContain('provider timeout');
  });

  it('a permanent error fails at once', async () => {
    const tag = randomUUID();
    const registry = createRegistry(
      [
        {
          type: 'test.bad',
          queue: 'default',
          run: async () => {
            throw new PermanentJobError('bad payload');
          },
        },
      ],
      {},
    );
    await enqueue(h.deps.db, { type: 'test.bad', queue: 'default', payload: { tag } });
    const [j] = (await claim(h.deps.db, 'default', 50)).filter(
      (x) => (x.payload as { tag?: string }).tag === tag,
    );
    expect(await runJob(h.deps.db, registry, j!, () => new Date())).toBe('failed');
  });

  it('a worker whose claim expired cannot overwrite a newer attempt', async () => {
    const tag = randomUUID();
    const registry = createRegistry(
      [{ type: 'test.slow', queue: 'default', run: async () => {} }],
      {},
    );
    await enqueue(h.deps.db, { type: 'test.slow', queue: 'default', payload: { tag } });
    const [stale] = (await claim(h.deps.db, 'default', 50, 1)).filter(
      (x) => (x.payload as { tag?: string }).tag === tag,
    );
    await asOwner((c) =>
      c.query(
        `update job set locked_until = now() - interval '1 second' where payload->>'tag' = $1`,
        [tag],
      ),
    );
    const [fresh] = (await claim(h.deps.db, 'default', 50)).filter(
      (x) => (x.payload as { tag?: string }).tag === tag,
    );
    expect(await runJob(h.deps.db, registry, stale!, () => new Date())).toBe('lost');
    expect(await runJob(h.deps.db, registry, fresh!, () => new Date())).toBe('done');
  });

  it('drain respects its time budget', async () => {
    const registry = createRegistry([], {});
    const r = await drain(h.deps.db, registry, { budgetMs: 0, now: () => new Date() });
    expect(r.stoppedByBudget).toBe(true);
  });
});

describe('idempotent commands (02 §6, 04 §5)', () => {
  // A test-only route: identity has no idempotent commands yet; modules in Phase 1 will.
  const writePolicy = definePolicy({
    action: 'test.write',
    description: 'test',
    rule: requireActiveAccount,
  });
  let executions = 0;
  const app: Hono<AppEnv> = createPlatformApp(h.deps, 'public');
  identityRoutes(app);
  route(app, {
    method: 'POST',
    path: '/v1/test/things',
    body: z.object({ name: z.string() }).strict(),
    response: z.object({ n: z.number(), name: z.string() }),
    status: 201,
    policy: writePolicy,
    rateLimit: 'write',
    idempotent: true,
    handler: async (_ctx, _p, body) => ({ n: ++executions, name: body.name }),
  });

  const post = (token: string, key: string | undefined, body: unknown) =>
    app.request('/v1/test/things', {
      method: 'POST',
      headers: {
        ...EDGE,
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        ...(key ? { 'idempotency-key': key } : {}),
      },
      body: JSON.stringify(body),
    });

  it('requires an Idempotency-Key', async () => {
    const s = await signInWithPhone(h);
    const res = await post(s.accessToken, undefined, { name: 'a' });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: 'http.idempotency_key_required' });
  });

  it('replays the identical response 3× and executes once (S-06 shape)', async () => {
    const s = await signInWithPhone(h);
    const key = randomUUID();
    const before = executions;
    const responses = [];
    for (let i = 0; i < 3; i++) responses.push(await post(s.accessToken, key, { name: 'ụlọ' }));
    expect(responses.map((r) => r.status)).toEqual([201, 201, 201]);
    const bodies = await Promise.all(responses.map((r) => r.json()));
    expect(bodies[1]).toEqual(bodies[0]);
    expect(bodies[2]).toEqual(bodies[0]);
    expect(executions - before).toBe(1);
  });

  it('rejects the same key with a different body', async () => {
    const s = await signInWithPhone(h);
    const key = randomUUID();
    await post(s.accessToken, key, { name: 'a' });
    const res = await post(s.accessToken, key, { name: 'b' });
    expect(res.status).toBe(422);
    expect(await res.json()).toMatchObject({ code: 'http.idempotency_key_reused' });
  });

  it('keeps keys per account: another person using the same key is independent', async () => {
    const a = await signInWithPhone(h);
    const b = await signInWithPhone(h);
    const key = randomUUID();
    const ra = await (await post(a.accessToken, key, { name: 'a' })).json();
    const rb = await (await post(b.accessToken, key, { name: 'a' })).json();
    expect((rb as { n: number }).n).not.toBe((ra as { n: number }).n);
  });

  it('concurrent duplicates execute once', async () => {
    const s = await signInWithPhone(h);
    const key = randomUUID();
    const before = executions;
    const results = await Promise.all([
      post(s.accessToken, key, { name: 'x' }),
      post(s.accessToken, key, { name: 'x' }),
      post(s.accessToken, key, { name: 'x' }),
    ]);
    expect(executions - before).toBe(1);
    for (const r of results) expect([201, 409]).toContain(r.status);
  });
});
