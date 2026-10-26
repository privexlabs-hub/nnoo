import { sql } from 'drizzle-orm';
import type { Hono } from 'hono';
import { platform as contracts } from '@nnoo/contracts';
import type { AppEnv } from './app-env.ts';
import { drain } from './jobs/queue.ts';
import { registry } from './jobs/registry.ts';
import { triggerRoute } from './triggers.ts';

/** Drain budget: finish well inside the minute between ticks (06 §3). */
export const DRAIN_BUDGET_MS = 45_000;

/** `/internal/*` on the `jobs` function. No CORS, no edge; trigger-safe or service-token only. */
export function internalRoutes(app: Hono<AppEnv>): void {
  app.get('/internal/health', (c) => {
    const { env, clock } = c.get('deps');
    return c.json(
      contracts.HealthView.parse({
        status: 'ok',
        function: 'jobs',
        env: env.NNOO_ENV,
        time: clock.now().toISOString(),
      }),
    );
  });

  triggerRoute(
    app,
    '/internal/jobs/drain',
    'dispatch the outbox and run due jobs',
    async (deps) => {
      const r = await drain(deps.db, registry, {
        budgetMs: DRAIN_BUDGET_MS,
        now: () => deps.clock.now(),
      });
      return { dispatched: r.dispatched, ...r.ran, stoppedByBudget: r.stoppedByBudget };
    },
  );

  // Read-only monitors (09 §6). Alerts are structured log lines with `alert: true`; the
  // log platform routes them. INV-1…12 checks are added with the modules that own them.
  triggerRoute(
    app,
    '/internal/invariants/check',
    'read-only invariant and queue-health monitors',
    async (deps) => {
      const res = await deps.db.execute<{
        outbox_lag_s: number | null;
        failed_1h: number;
        payments_failed_1h: number;
        depth: number;
      }>(sql`
      select
        (select extract(epoch from now() - min(created_at)) from outbox_event where dispatched_at is null) as outbox_lag_s,
        (select count(*)::int from job where failed_at > now() - interval '1 hour') as failed_1h,
        (select count(*)::int from job where queue = 'payments' and failed_at > now() - interval '1 hour') as payments_failed_1h,
        (select count(*)::int from job where done_at is null and failed_at is null) as depth`);
      const m = res.rows[0]!;
      const alerts: string[] = [];
      if (m.outbox_lag_s !== null && Number(m.outbox_lag_s) > 120) alerts.push('outbox_lag');
      if (m.payments_failed_1h > 0) alerts.push('payments_job_failed');
      if (m.failed_1h > 10) alerts.push('jobs_failing');
      if (m.depth > 1000) alerts.push('queue_depth');
      for (const a of alerts) deps.log.error('monitor alert', { alert: true, monitor: a, ...m });
      return {
        alerts: alerts.length,
        outboxLagSeconds: m.outbox_lag_s === null ? 0 : Math.round(Number(m.outbox_lag_s)),
      };
    },
  );

  triggerRoute(
    app,
    '/internal/maintenance',
    'daily housekeeping: expire stored replays, old invocations, partitions',
    async (deps) => {
      const { db } = deps;
      const idem = await db.execute(
        sql`delete from idempotency_key where created_at < now() - interval '24 hours'`,
      );
      const inv = await db.execute(
        sql`delete from trigger_invocation where received_at < now() - interval '7 days'`,
      );
      const tokens = await db.execute(
        sql`delete from refresh_token where expires_at < now() - interval '7 days'`,
      );
      const buckets = await db.execute(
        sql`delete from rate_limit_bucket where refilled_at < now() - interval '1 day'`,
      );
      await db.execute(
        sql`select ensure_monthly_partition('audit_log', (now() + make_interval(months => m))::date) from generate_series(0, 2) m`,
      );
      return {
        idempotencyKeys: idem.rowCount ?? 0,
        invocations: inv.rowCount ?? 0,
        refreshTokens: tokens.rowCount ?? 0,
        rateBuckets: buckets.rowCount ?? 0,
      };
    },
  );
}
