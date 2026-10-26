import { parseTriggerDelivery, type TriggerDelivery } from '@neon/functions/triggers';
import { sql } from 'drizzle-orm';
import type { Context, Hono } from 'hono';
import type { AppEnv } from './app-env.ts';
import type { Deps } from './deps.ts';
import { DomainError, problem } from './problem.ts';
import { registryOf } from './route.ts';
import { triggerInvocation } from './schema.ts';

/**
 * Trigger-safe endpoints (docs/neon/06 §5, ADR-030). Every handler must be:
 *  1. safe by construction — it only does work the system would do anyway now
 *     (sweeps, drains, reconciliation) and never grants, publishes, pays or deletes on a
 *     payload's say-so;
 *  2. idempotent — the invocation id is recorded and a duplicate is a no-op;
 *  3. bounded — a time/row budget per call;
 *  4. rate-limited per path.
 * Origin: Neon strips client-supplied X-Neon-* headers at its edge, so a delivery
 * carrying the invocation header came from the trigger system (parseTriggerDelivery).
 */
export type TriggerHandler = (
  deps: Deps,
  delivery: TriggerDelivery,
) => Promise<Record<string, unknown>>;

export function triggerRoute(
  app: Hono<AppEnv>,
  path: string,
  description: string,
  fn: TriggerHandler,
): void {
  registryOf(app).push({
    method: 'POST',
    path,
    policy: 'trigger',
    publicReason: `Neon Function Trigger: ${description}`,
    rateLimit: 'write',
    idempotent: true,
  });

  app.post(path, async (c: Context<AppEnv>) => {
    const deps = c.get('deps');
    const parsed = await parseTriggerDelivery(c.req.raw);
    if (!parsed.ok) {
      if (parsed.error === 'invalid_body')
        throw new DomainError('http.validation_failed', 400, 'Not a trigger delivery.');
      throw problem('auth.unauthenticated', 401);
    }
    const limit = await deps.rateLimiter.take('trigger', path);
    if (!limit.allowed) {
      throw new DomainError('http.rate_limited', 429, undefined, undefined, {
        'Retry-After': String(limit.retryAfterSeconds),
      });
    }
    const fresh = await deps.db
      .insert(triggerInvocation)
      .values({ invocationId: parsed.invocation.invocationId, path })
      .onConflictDoNothing()
      .returning({ id: triggerInvocation.invocationId });
    if (fresh.length === 0) return c.json({ duplicate: true });

    const started = Date.now();
    try {
      const result = await fn(deps, parsed.invocation);
      deps.log.info('trigger handled', {
        path,
        trigger: parsed.invocation.trigger.name,
        ms: Date.now() - started,
        ...result,
      });
      return c.json({ ok: true, ...result });
    } catch (e) {
      // Let the platform retry with the same invocation id: forget it so the retry runs.
      await deps.db.execute(
        sql`delete from trigger_invocation where invocation_id = ${parsed.invocation.invocationId}`,
      );
      throw e;
    }
  });
}
