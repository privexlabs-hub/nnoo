// Owner: governance. Append-only record of governance events (01 §10, 10 §4).
import { sql } from 'drizzle-orm';
import { check, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const governanceEvent = pgTable(
  'governance_event',
  {
    id: uuid('id').primaryKey(),
    kind: text('kind').notNull(),
    /** What was decided, e.g. the interim custodians and their hometowns. */
    payload: jsonb('payload').notNull(),
    /** Who approved it outside the system (e.g. the two CI environment reviewers). */
    approvals: jsonb('approvals').notNull(),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('governance_event_kind', sql`${t.kind} in ('interim_council_bootstrap')`),
    check('governance_payload_object', sql`jsonb_typeof(${t.payload}) = 'object'`),
    check(
      'governance_approvals_two',
      sql`jsonb_typeof(${t.approvals}) = 'array' and jsonb_array_length(${t.approvals}) >= 2`,
    ),
    // The interim council is bootstrapped once per environment; afterwards only panels grant.
    uniqueIndex('governance_one_bootstrap')
      .on(t.kind)
      .where(sql`${t.kind} = 'interim_council_bootstrap'`),
  ],
);
