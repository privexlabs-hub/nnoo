// Owner: platform. Runtime tables added for Neon (docs/neon/03 §3, 06 §2).
import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

const tz = (name: string) => timestamp(name, { withTimezone: true });

/** Durable work queue, claimed with FOR UPDATE SKIP LOCKED (06 §2). */
export const job = pgTable(
  'job',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    queue: text('queue').notNull(),
    type: text('type').notNull(),
    dedupeKey: text('dedupe_key'),
    payload: jsonb('payload').notNull(),
    runAt: tz('run_at').notNull().defaultNow(),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(8),
    lockedUntil: tz('locked_until'),
    lastError: text('last_error'),
    doneAt: tz('done_at'),
    failedAt: tz('failed_at'),
    createdAt: tz('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('job_dedupe_open')
      .on(t.dedupeKey)
      .where(sql`${t.doneAt} is null and ${t.failedAt} is null`),
    index('job_ready')
      .on(t.queue, t.runAt)
      .where(sql`${t.doneAt} is null and ${t.failedAt} is null`),
    check('job_queue', sql`${t.queue} in ('default','payments','notify','audio','ikpe','ai')`),
    check('job_attempts', sql`${t.attempts} >= 0 and ${t.maxAttempts} between 1 and 50`),
    check('job_terminal', sql`not (${t.doneAt} is not null and ${t.failedAt} is not null)`),
  ],
);

/** Domain events written in the same transaction as the state change (ADR-006). Append-only. */
export const outboxEvent = pgTable(
  'outbox_event',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    type: text('type').notNull(),
    aggregateId: uuid('aggregate_id').notNull(),
    payload: jsonb('payload').notNull(),
    createdAt: tz('created_at').notNull().defaultNow(),
    dispatchedAt: tz('dispatched_at'),
  },
  (t) => [
    index('outbox_pending')
      .on(t.id)
      .where(sql`${t.dispatchedAt} is null`),
    check('outbox_payload_object', sql`jsonb_typeof(${t.payload}) = 'object'`),
  ],
);

/** Function-trigger deliveries already handled; dedupes retries and replays (06 §5). */
export const triggerInvocation = pgTable('trigger_invocation', {
  invocationId: text('invocation_id').primaryKey(),
  path: text('path').notNull(),
  receivedAt: tz('received_at').notNull().defaultNow(),
});

/** Stored responses for idempotent commands, kept 24 h (02 §6, 04 §5). */
export const idempotencyKey = pgTable(
  'idempotency_key',
  {
    accountId: uuid('account_id').notNull(),
    key: text('key').notNull(),
    method: text('method').notNull(),
    path: text('path').notNull(),
    requestHash: text('request_hash').notNull(),
    status: smallint('status').notNull(),
    response: jsonb('response').notNull(),
    createdAt: tz('created_at').notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.accountId, t.key] }),
    index('idempotency_key_created').on(t.createdAt),
    check('idempotency_key_len', sql`length(${t.key}) between 8 and 128`),
  ],
);

/** Token buckets for limits the edge cannot see (per account, per phone hash). */
export const rateLimitBucket = pgTable('rate_limit_bucket', {
  bucketKey: text('bucket_key').primaryKey(),
  tokens: real('tokens').notNull(),
  refilledAt: tz('refilled_at').notNull(),
});

/** Short-lived tokens issued to the audio worker, one per claimed job (ADR-021). */
export const serviceToken = pgTable(
  'service_token',
  {
    jti: uuid('jti').primaryKey(),
    jobId: bigint('job_id', { mode: 'number' }).notNull(),
    issuedAt: tz('issued_at').notNull().defaultNow(),
    expiresAt: tz('expires_at').notNull(),
    revokedAt: tz('revoked_at'),
  },
  (t) => [check('service_token_expiry', sql`${t.expiresAt} > ${t.issuedAt}`)],
);
