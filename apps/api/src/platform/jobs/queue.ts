import { and, eq, isNull, sql } from 'drizzle-orm';
import type { Db, Queryable } from '../db.ts';
import type { Deps } from '../deps.ts';
import { job, outboxEvent } from '../schema.ts';

export type Queue = 'default' | 'payments' | 'notify' | 'audio' | 'ikpe' | 'ai';
export type JobRow = typeof job.$inferSelect;

/** Thrown by a handler when retrying cannot help (bad payload, resource gone for good). */
export class PermanentJobError extends Error {
  override name = 'PermanentJobError';
}

/** What a job handler may use: the database, the clock, and the isolate's dependencies (storage…). */
export type JobContext = { db: Db; now: () => Date; deps: Deps };

export type JobHandler<P = Record<string, unknown>> = {
  type: string;
  queue: Exclude<Queue, 'audio'>;
  maxAttempts?: number;
  /** Must be idempotent: delivery is at-least-once (06 §6). Re-read current state; never trust payload snapshots. */
  run: (payload: P, ctx: JobContext) => Promise<void>;
  /** Called once when attempts are exhausted, e.g. payout → needs_attention. */
  onExhausted?: (payload: P, ctx: JobContext) => Promise<void>;
};

export type HandlerRegistry = {
  handlers: ReadonlyMap<string, JobHandler>;
  /** outbox event type → job types to create, one job per consumer. */
  consumers: ReadonlyMap<string, readonly string[]>;
};

export function createRegistry(
  handlers: JobHandler[],
  consumes: Record<string, string[]>,
): HandlerRegistry {
  const map = new Map(handlers.map((h) => [h.type, h] as const));
  for (const [event, types] of Object.entries(consumes)) {
    for (const t of types)
      if (!map.has(t)) throw new Error(`BOOT: event ${event} consumed by unknown job type ${t}`);
  }
  return { handlers: map, consumers: new Map(Object.entries(consumes)) };
}

/** Writes a domain event in the caller's transaction (ADR-006). Payloads carry ids, not data. */
export async function writeOutbox(
  tx: Queryable,
  type: string,
  aggregateId: string,
  payload: Record<string, unknown>,
) {
  await tx.insert(outboxEvent).values({ type, aggregateId, payload });
}

export async function enqueue(
  q: Queryable,
  j: {
    type: string;
    queue: Queue;
    payload: Record<string, unknown>;
    dedupeKey?: string;
    runAt?: Date;
    maxAttempts?: number;
  },
): Promise<boolean> {
  const rows = await q.execute(sql`
    insert into job (queue, type, dedupe_key, payload, run_at, max_attempts)
    values (${j.queue}, ${j.type}, ${j.dedupeKey ?? null}, ${JSON.stringify(j.payload)}::jsonb,
            ${j.runAt ?? sql`now()`}, ${j.maxAttempts ?? 8})
    on conflict (dedupe_key) where done_at is null and failed_at is null do nothing
    returning id`);
  return (rows.rowCount ?? 0) > 0;
}

/**
 * Outbox → job rows, one per consumer, in one transaction (06 §6). Safe to run
 * concurrently: rows are claimed with SKIP LOCKED.
 */
export async function dispatchOutbox(
  db: Db,
  registry: HandlerRegistry,
  limit = 500,
): Promise<number> {
  return db.transaction(async (tx) => {
    const pending = await tx
      .select({ id: outboxEvent.id, type: outboxEvent.type, aggregateId: outboxEvent.aggregateId })
      .from(outboxEvent)
      .where(isNull(outboxEvent.dispatchedAt))
      .orderBy(outboxEvent.id)
      .limit(limit)
      .for('update', { skipLocked: true });
    for (const ev of pending) {
      for (const type of registry.consumers.get(ev.type) ?? []) {
        const h = registry.handlers.get(type)!;
        await enqueue(tx, {
          type,
          queue: h.queue,
          dedupeKey: `${ev.id}:${type}`,
          payload: { eventId: ev.id, eventType: ev.type, aggregateId: ev.aggregateId },
          ...(h.maxAttempts ? { maxAttempts: h.maxAttempts } : {}),
        });
      }
      await tx
        .update(outboxEvent)
        .set({ dispatchedAt: sql`now()` })
        .where(eq(outboxEvent.id, ev.id));
    }
    return pending.length;
  });
}

/** Claims up to `limit` due jobs atomically (06 §2). A claim expires after `lockSeconds`. */
export async function claim(
  db: Db,
  queue: Queue,
  limit: number,
  lockSeconds = 120,
): Promise<JobRow[]> {
  const res = await db.execute<Record<string, unknown>>(sql`
    update job set locked_until = now() + make_interval(secs => ${lockSeconds}), attempts = attempts + 1
    where id in (
      select id from job
      where queue = ${queue} and done_at is null and failed_at is null
        and run_at <= now() and (locked_until is null or locked_until < now())
      order by run_at
      limit ${limit}
      for update skip locked)
    returning *`);
  return res.rows.map((r) => ({
    id: Number(r.id),
    queue: r.queue as string,
    type: r.type as string,
    dedupeKey: (r.dedupe_key as string | null) ?? null,
    payload: r.payload,
    runAt: new Date(r.run_at as string),
    attempts: Number(r.attempts),
    maxAttempts: Number(r.max_attempts),
    lockedUntil: r.locked_until ? new Date(r.locked_until as string) : null,
    lastError: (r.last_error as string | null) ?? null,
    doneAt: null,
    failedAt: null,
    createdAt: new Date(r.created_at as string),
  }));
}

/** Exponential backoff with jitter: 10 s, 20 s, 40 s … capped at 1 hour. */
export function backoffSeconds(attempts: number, random: () => number = Math.random): number {
  const base = Math.min(3600, 5 * 2 ** Math.max(1, attempts));
  return Math.round(base * (0.8 + 0.4 * random()));
}

function safeError(e: unknown): string {
  const err = e instanceof Error ? e : new Error(String(e));
  return `${err.name}: ${err.message}`.slice(0, 500);
}

export type RunOutcome = 'done' | 'retry' | 'failed' | 'lost';

/**
 * Runs one claimed job. Completion is conditional on still holding the claim (same
 * attempts count), so a worker whose lock expired cannot overwrite a newer attempt.
 */
export async function runJob(
  deps: Deps,
  registry: HandlerRegistry,
  row: JobRow,
): Promise<RunOutcome> {
  const db = deps.db;
  const now = () => deps.clock.now();
  const held = and(
    eq(job.id, row.id),
    eq(job.attempts, row.attempts),
    isNull(job.doneAt),
    isNull(job.failedAt),
  );
  const handler = registry.handlers.get(row.type);
  const ctx: JobContext = { db, now, deps };
  if (!handler) {
    const r = await db
      .update(job)
      .set({ failedAt: sql`now()`, lastError: `no handler for ${row.type}` })
      .where(held)
      .returning({ id: job.id });
    return r.length ? 'failed' : 'lost';
  }
  try {
    await handler.run(row.payload as Record<string, unknown>, ctx);
    const r = await db
      .update(job)
      .set({ doneAt: sql`now()`, lockedUntil: null })
      .where(held)
      .returning({ id: job.id });
    return r.length ? 'done' : 'lost';
  } catch (e) {
    const permanent = e instanceof PermanentJobError;
    if (permanent || row.attempts >= row.maxAttempts) {
      const r = await db
        .update(job)
        .set({ failedAt: sql`now()`, lockedUntil: null, lastError: safeError(e) })
        .where(held)
        .returning({ id: job.id });
      if (r.length && handler.onExhausted)
        await handler.onExhausted(row.payload as Record<string, unknown>, ctx).catch(() => {});
      return r.length ? 'failed' : 'lost';
    }
    const r = await db
      .update(job)
      .set({
        runAt: sql`now() + make_interval(secs => ${backoffSeconds(row.attempts)})`,
        lockedUntil: null,
        lastError: safeError(e),
      })
      .where(held)
      .returning({ id: job.id });
    return r.length ? 'retry' : 'lost';
  }
}

/** Priority order (06 §3). `audio` is claimed by the external worker; `ai` is off (ADR-029). */
export const DRAIN_ORDER: readonly Queue[] = ['ikpe', 'payments', 'notify', 'default'];

export type DrainReport = {
  dispatched: number;
  ran: Record<RunOutcome, number>;
  stoppedByBudget: boolean;
};

export async function drain(
  deps: Deps,
  registry: HandlerRegistry,
  opts: { budgetMs: number; batch?: number; queues?: readonly Queue[] },
): Promise<DrainReport> {
  const db = deps.db;
  const deadline = Date.now() + opts.budgetMs;
  const report: DrainReport = {
    dispatched: 0,
    ran: { done: 0, retry: 0, failed: 0, lost: 0 },
    stoppedByBudget: false,
  };
  report.dispatched = await dispatchOutbox(db, registry);
  for (const q of opts.queues ?? DRAIN_ORDER) {
    while (true) {
      if (Date.now() >= deadline) {
        report.stoppedByBudget = true;
        return report;
      }
      const batch = await claim(db, q, opts.batch ?? 20);
      if (batch.length === 0) break;
      const results = await Promise.allSettled(batch.map((row) => runJob(deps, registry, row)));
      for (const r of results) report.ran[r.status === 'fulfilled' ? r.value : 'lost']++;
    }
  }
  return report;
}
