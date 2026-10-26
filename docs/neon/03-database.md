# 03 · Database on Neon

The data model itself is defined in `docs/03`. This file covers how to implement it on Neon with Drizzle.

## 1. Drivers and connections

| Context                               | Driver                                               | Host                              | Why                                                                                                                 |
| ------------------------------------- | ---------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `api` / `jobs` functions              | `pg` `Pool` (`max: 5`) + `drizzle-orm/node-postgres` | **pooled** (`-pooler`)            | Long-lived compute reuses connections. Quickstart guidance: don't use `@neondatabase/serverless` inside a function. |
| CI migrations                         | `drizzle-kit migrate`                                | **direct** (unpooled), owner role | DDL, `CREATE INDEX CONCURRENTLY`, advisory locks                                                                    |
| Partition maintenance, long admin SQL | `pg` client                                          | direct                            | session-level operations                                                                                            |
| Short-lived scripts / edge tools      | `@neondatabase/serverless` (HTTP)                    | —                                 | per-request use only                                                                                                |

```typescript
// apps/api/src/platform/db.ts
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { attachDatabasePool } from '@neon/functions';
import { env } from '@nnoo/config/env';
import * as schema from './schema'; // re-exports every module's schema file

export const pool = new Pool({
  connectionString: env.APP_DATABASE_URL, // nnoo_app role, pooled host (ADR-026)
  max: 5,
  idleTimeoutMillis: 30_000,
  statement_timeout: 5_000, // API requests never hold long statements
  application_name: env.FUNCTION_NAME, // 'api' | 'jobs' → visible in pg_stat_activity
});
attachDatabasePool(pool); // keep idle disconnects from crashing the isolate

export const db = drizzle(pool, { schema });
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
```

**Pooler (transaction mode) rules.** These apply to everything on the pooled host:

- No session state across transactions. Use `set_config(..., true)` (LOCAL) inside a transaction, never plain `SET`.
- No `LISTEN/NOTIFY` and no session advisory locks. Use `pg_try_advisory_xact_lock` instead.
- Named prepared statements are not guaranteed. Drizzle with `pg` uses unnamed statements by default; keep it that way.

**Connection budget.** `max 5 × concurrent isolates` must stay under the compute's pooler client limit. Alert at 70% of `max_connections` on the direct side. ⚠ Verify the per-compute limits for the chosen compute size.

## 2. Schema files per module

Every module owns one Drizzle file. That file is the only place its tables are defined.

```typescript
// apps/api/src/modules/ikpe/infrastructure/schema.ts   (owner: ikpe)
import {
  pgTable,
  pgEnum,
  uuid,
  integer,
  text,
  boolean,
  timestamp,
  interval,
  primaryKey,
  uniqueIndex,
  index,
  check,
  bigint,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const caseStatus = pgEnum('case_status', [
  'open',
  'paused',
  'passed',
  'returned',
  'withdrawn',
]);
export const voteChoice = pgEnum('vote_choice', ['keep', 'wait', 'no']);

export const ikpeCase = pgTable(
  'ikpe_case',
  {
    id: uuid('id').primaryKey(),
    recordingId: uuid('recording_id').notNull(), // FK added in custom SQL (cross-module)
    revisionId: uuid('revision_id').notNull(),
    kind: text('kind').notNull().default('recording'),
    status: caseStatus('status').notNull().default('open'),
    configVersion: integer('config_version').notNull(),
    quorumRequired: integer('quorum_required').notNull(),
    quorumScope: text('quorum_scope').notNull(),
    openedAt: timestamp('opened_at', { withTimezone: true }).notNull().defaultNow(),
    minCloseAt: timestamp('min_close_at', { withTimezone: true }).notNull(),
    timeoutAt: timestamp('timeout_at', { withTimezone: true }).notNull(),
    pausedTotal: interval('paused_total').notNull().default('0'),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    outcomeReason: text('outcome_reason'),
  },
  (t) => [
    uniqueIndex('ikpe_one_open_per_recording')
      .on(t.recordingId)
      .where(sql`status in ('open','paused')`),
    index('ikpe_open_due')
      .on(t.minCloseAt, t.timeoutAt)
      .where(sql`status = 'open'`),
    check('ikpe_kind', sql`${t.kind} in ('recording','governance')`),
    check('ikpe_scope', sql`${t.quorumScope} in ('hometown','lga_bootstrap')`),
    check('ikpe_quorum', sql`${t.quorumRequired} between 1 and 1000`),
    check(
      'ikpe_deadlines',
      sql`${t.minCloseAt} > ${t.openedAt} and ${t.timeoutAt} > ${t.minCloseAt}`,
    ),
  ],
);

export const ikpeVote = pgTable(
  'ikpe_vote',
  {
    caseId: uuid('case_id')
      .notNull()
      .references(() => ikpeCase.id),
    voterId: uuid('voter_id').notNull(),
    choice: voteChoice('choice').notNull(),
    countsForQuorum: boolean('counts_for_quorum').notNull(),
    waitReason: text('wait_reason'),
    castAt: timestamp('cast_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.caseId, t.voterId] })],
);

export const ikpeVoteEvent = pgTable('ikpe_vote_event', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  caseId: uuid('case_id').notNull(),
  voterId: uuid('voter_id').notNull(),
  oldChoice: voteChoice('old_choice'),
  newChoice: voteChoice('new_choice').notNull(),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
});

export const ikpeTally = pgTable(
  'ikpe_tally',
  {
    caseId: uuid('case_id')
      .primaryKey()
      .references(() => ikpeCase.id),
    kinKeep: integer('kin_keep').notNull().default(0),
    kinWait: integer('kin_wait').notNull().default(0),
    kinNo: integer('kin_no').notNull().default(0),
    otherKeep: integer('other_keep').notNull().default(0),
    otherWait: integer('other_wait').notNull().default(0),
    otherNo: integer('other_no').notNull().default(0),
  },
  (t) => [
    check(
      'tally_non_negative',
      sql`least(${t.kinKeep},${t.kinWait},${t.kinNo},${t.otherKeep},${t.otherWait},${t.otherNo}) >= 0`,
    ),
  ],
);
```

**Cross-module foreign keys** are declared in custom SQL migrations owned by the _referencing_ module. That keeps the TypeScript schema imports inside module boundaries while the DB still enforces integrity.

## 3. Tables added for the Neon runtime

These tables are in addition to the model in `docs/03`.

| Table                                            | Owner    | Purpose                                                                                         |
| ------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------- |
| `job`                                            | platform | durable work queue (06 §2)                                                                      |
| `trigger_invocation`                             | platform | `(invocation_id PK, path, received_at)` to deduplicate trigger calls                            |
| `idempotency_key`                                | platform | `(account_id, key) PK, request_hash, response jsonb, created_at`, TTL 24 h                      |
| `rate_limit_bucket`                              | platform | `(bucket_key PK, tokens, refilled_at)` for per-account limits the edge can't see (votes, plays) |
| `service_token`                                  | platform | issued audio-worker tokens `(jti PK, job_id, expires_at, revoked_at)`                           |
| `consent_record.allow_machine_assist`            | consent  | `boolean NOT NULL DEFAULT false`, for AI drafting (08)                                          |
| `recording_revision.draft_source`, `draft_model` | archive  | `'human' \| 'machine_assisted'`, plus the pinned model id when machine-assisted                 |

## 4. Migrations

```
apps/api/migrations/
  0000_init.sql                 # generated by drizzle-kit
  0001_custom_extensions.sql    # custom: citext, pg_trgm, igbo_fold()
  0002_custom_cross_fk.sql      # custom: cross-module foreign keys
  0003_custom_invariants.sql    # custom: triggers for INV-1/2/4/8, transition tables
  0004_custom_grants.sql        # custom: roles & grants (07 §4)
  0005_custom_partitions.sql    # custom: audit_log / ikpe_vote_event partitions
  meta/                         # drizzle journal — committed
```

```bash
pnpm drizzle-kit generate                 # from schema changes
pnpm drizzle-kit generate --custom --name=invariants   # empty SQL file for hand-written DDL
pnpm drizzle-kit migrate                  # applies pending migrations (CI only on shared branches)
```

**Example custom migration (INV-1, INV-2, NFC):**

```sql
-- 0003_custom_invariants.sql
-- INV-9: Igbo text is NFC (applied to every Igbo column via a domain)
CREATE DOMAIN igbo_text AS text CHECK (VALUE IS NULL OR VALUE = normalize(VALUE, NFC));

-- search folding (never used for display)
CREATE OR REPLACE FUNCTION igbo_fold(t text) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT translate(normalize(t, NFD),
         -- strip combining grave/acute/macron/dot-below; map ṅ→n
         E'\u0300\u0301\u0304\u0323', '')
$$;

-- INV-2: no audio objects for Nsọ recordings
CREATE OR REPLACE FUNCTION media_no_nso() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.kind::text LIKE 'audio_%' AND EXISTS (
       SELECT 1 FROM recording r WHERE r.id = NEW.recording_id AND r.tier = 'nso') THEN
    RAISE EXCEPTION 'INV-2: audio for nso recording %', NEW.recording_id USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER media_no_nso BEFORE INSERT OR UPDATE ON media_asset
  FOR EACH ROW EXECUTE FUNCTION media_no_nso();

-- INV-1: a publication must reference a passed case for the same recording+revision
CREATE OR REPLACE FUNCTION publication_requires_pass() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ikpe_case c
                 WHERE c.id = NEW.ikpe_case_id AND c.status = 'passed'
                   AND c.recording_id = NEW.recording_id AND c.revision_id = NEW.revision_id) THEN
    RAISE EXCEPTION 'INV-1: publication without passed case' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER publication_requires_pass BEFORE INSERT ON publication
  FOR EACH ROW EXECUTE FUNCTION publication_requires_pass();
```

**Expand/contract on Neon** (`docs/09 §4`):

1. The PR adds the migration. CI applies it to `preview/pr-<n>` (from `seed`) and runs the full suite.
2. For lock and duration risk on real volumes, CI applies it to a **schema + synthetic-volume** branch (`perf`, built from `seed` with year-1 row counts). ⚠ Verify whether Neon schema-only branches exist. Use one for schema checks; never use a data copy of `main`.
3. On release, migrations run against `main` from CI **before** the functions deploy, through the direct host with `lock_timeout = '2s'` and `statement_timeout = '15min'`.

## 5. Transactions

Use one pattern for every use case: domain decision → writes → outbox, all in one `db.transaction`.

```typescript
// apps/api/src/modules/ikpe/application/cast-vote.ts
import { db } from '@/platform/db';
import { and, eq, sql } from 'drizzle-orm';
import { ikpeCase, ikpeVote, ikpeVoteEvent, ikpeTally } from '../infrastructure/schema';
import { outbox } from '@/platform/outbox';
import { assertEligible } from '../domain/eligibility';
import { tallyDelta } from '../domain/tally';
import { community } from '@/modules/community/public';

export async function castVote(
  actor: Actor,
  caseId: string,
  choice: VoteChoice,
  waitReason?: string,
) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.actor_id', ${actor.id}, true)`); // audit trigger context

    const [c] = await tx.select().from(ikpeCase).where(eq(ikpeCase.id, caseId));
    if (!c) throw problem('ikpe.case_not_found', 404);

    const isKin = await community.isVerifiedKin(tx, actor.id, c, /* scope */ c.quorumScope);
    assertEligible(actor, c, { isKin }); // pure domain rule → throws ikpe.not_eligible

    // lock the tally row: serialises concurrent votes on the same case only
    const [t] = await tx.select().from(ikpeTally).where(eq(ikpeTally.caseId, caseId)).for('update');
    const [prev] = await tx
      .select()
      .from(ikpeVote)
      .where(and(eq(ikpeVote.caseId, caseId), eq(ikpeVote.voterId, actor.id)));

    const now = new Date();
    await tx
      .insert(ikpeVote)
      .values({
        caseId,
        voterId: actor.id,
        choice,
        waitReason,
        countsForQuorum: prev?.countsForQuorum ?? isKin, // frozen at first cast
        castAt: prev?.castAt ?? now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [ikpeVote.caseId, ikpeVote.voterId],
        set: { choice, waitReason, updatedAt: now },
      });

    await tx
      .insert(ikpeVoteEvent)
      .values({ caseId, voterId: actor.id, oldChoice: prev?.choice ?? null, newChoice: choice });
    await tx
      .update(ikpeTally)
      .set(tallyDelta(t, prev, { choice, countsForQuorum: prev?.countsForQuorum ?? isKin }))
      .where(eq(ikpeTally.caseId, caseId));

    await outbox(tx, 'IkpeVoteCast', caseId, { caseId }); // → job: ikpe.evaluate (debounced)
    return toVoteView(c, choice);
  });
}
```

Rules:

- No provider calls, AI calls or `fetch` inside `db.transaction`.
- Each transaction touches only its own module's tables, except for public-service calls listed in the manifest. Each such call receives the `tx` handle and is listed in the manifest.
- Use `READ COMMITTED` with explicit row locks. Use `SERIALIZABLE` only where an ADR justifies it; none do today.

## 6. Read replicas

Archive browse, search and admin reports may use a Neon **read replica** compute (`APP_DATABASE_URL_RO`). The routing rule is per use case, not per route: anything that reads its own recent write uses the primary. ⚠ Verify the replica compute setup and replication lag metrics.

## 7. Partitions and maintenance

`/internal/db/partitions` (monthly trigger, direct connection) creates the next two monthly partitions for `audit_log` and `ikpe_vote_event`. It detaches partitions older than 13 months and exports them (`COPY … TO STDOUT` → compressed object in a cold archive bucket) before dropping them. It is idempotent: it checks `pg_inherits` before acting.
