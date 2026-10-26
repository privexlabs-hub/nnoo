// Owner: community. Geography and dialects (docs/03 §3). Kin memberships and vouches
// arrive in Phase 2. Names are Igbo text: NFC, never folded for display.
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  foreignKey,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

const nfc = (col: unknown) => sql`${col} = normalize(${col}, NFC)`;

export const state = pgTable(
  'state',
  { id: uuid('id').primaryKey(), name: text('name').notNull().unique() },
  (t) => [check('state_name_nfc', nfc(t.name))],
);

export const lga = pgTable(
  'lga',
  {
    id: uuid('id').primaryKey(),
    stateId: uuid('state_id')
      .notNull()
      .references(() => state.id),
    name: text('name').notNull(),
  },
  (t) => [uniqueIndex('lga_state_name').on(t.stateId, t.name), check('lga_name_nfc', nfc(t.name))],
);

export const hometown = pgTable(
  'hometown',
  {
    id: uuid('id').primaryKey(),
    lgaId: uuid('lga_id')
      .notNull()
      .references(() => lga.id),
    name: text('name').notNull(),
    /** Search key only (ADR-014). Never displayed. */
    nameSearch: text('name_search').generatedAlwaysAs(sql`lower(igbo_fold(name))`),
    /** Fewer than 20 verified active kin: LGA-scope quorum (01 §6); maintained by nightly stats. */
    bootstrapMode: boolean('bootstrap_mode').notNull().default(true),
  },
  (t) => [
    uniqueIndex('hometown_lga_name').on(t.lgaId, t.name),
    index('hometown_name_search').using('gin', sql`${t.nameSearch} gin_trgm_ops`),
    check('hometown_name_nfc', nfc(t.name)),
  ],
);

export const dialect = pgTable(
  'dialect',
  {
    id: uuid('id').primaryKey(),
    name: text('name').notNull().unique(),
    parentId: uuid('parent_id'),
  },
  (t) => [
    foreignKey({ columns: [t.parentId], foreignColumns: [t.id], name: 'dialect_parent_fk' }),
    check('dialect_name_nfc', nfc(t.name)),
    check('dialect_not_own_parent', sql`${t.parentId} is distinct from ${t.id}`),
  ],
);

export const hometownDialect = pgTable(
  'hometown_dialect',
  {
    hometownId: uuid('hometown_id')
      .notNull()
      .references(() => hometown.id),
    dialectId: uuid('dialect_id')
      .notNull()
      .references(() => dialect.id),
    isPrimary: boolean('is_primary').notNull().default(false),
  },
  (t) => [
    primaryKey({ columns: [t.hometownId, t.dialectId] }),
    uniqueIndex('hometown_one_primary_dialect')
      .on(t.hometownId)
      .where(sql`${t.isPrimary}`),
  ],
);

// ── facilitators (01 §3: training + 2 custodian sign-offs) ─────────────────────
export const facilitatorApplication = pgTable(
  'facilitator_application',
  {
    id: uuid('id').primaryKey(),
    accountId: uuid('account_id').notNull(),
    hometownId: uuid('hometown_id')
      .notNull()
      .references(() => hometown.id),
    status: text('status').notNull().default('pending'),
    trainingCompletedAt: timestamp('training_completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
  },
  (t) => [
    check('facilitator_app_status', sql`${t.status} in ('pending','approved','withdrawn')`),
    uniqueIndex('facilitator_app_open')
      .on(t.accountId, t.hometownId)
      .where(sql`${t.status} = 'pending'`),
    index('facilitator_app_hometown').on(t.hometownId, t.status),
  ],
);

export const facilitatorSignoff = pgTable(
  'facilitator_signoff',
  {
    applicationId: uuid('application_id')
      .notNull()
      .references(() => facilitatorApplication.id),
    custodianId: uuid('custodian_id').notNull(),
    signedAt: timestamp('signed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.applicationId, t.custodianId] })],
);
