// Owner: archive. Elders, recordings, revisions, notes (docs/03 §3). Foreign keys to other
// modules' tables (hometown, dialect, account) are declared in the custom migration owned by
// archive, so these TypeScript schemas never import another module (docs/neon/03 §2).
import { sql } from 'drizzle-orm';
import {
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { consentTier } from '../../../platform/enums.ts';

const tz = (name: string) => timestamp(name, { withTimezone: true });
const nfc = (col: unknown) => sql`${col} is null or ${col} = normalize(${col}, NFC)`;

export const recordingStatus = pgEnum('recording_status', [
  'draft',
  'in_review',
  'published',
  'returned',
  'withdrawn',
  'unpublished',
  'discarded',
]);
/** Brief §07 facilitator topics. */
export const recordingTopic = pgEnum('recording_topic', [
  'story',
  'proverb',
  'song',
  'recipe',
  'craft',
  'place_lore',
]);
/** Who is paid when Ikpe passes (Brief §24). Never bank data: destinations are tokenised in Phase 5. */
export const payeeKind = pgEnum('payee_kind', ['elder', 'family_member']);

export const elderProfile = pgTable(
  'elder_profile',
  {
    id: uuid('id').primaryKey(), // client-generated UUIDv7 (offline capture)
    displayName: text('display_name').notNull(),
    hometownId: uuid('hometown_id').notNull(),
    dialectId: uuid('dialect_id').notNull(),
    birthYear: smallint('birth_year'),
    /** Umunna / lineage as the elder names it (Brief §28). */
    lineage: text('lineage'),
    deceasedAt: date('deceased_at'),
    /** Holds the elder's consent rights after death or incapacity (01 §8). */
    stewardAccountId: uuid('steward_account_id'),
    /** Family representative named at consent (Brief §23), when they have no account. */
    familyRepresentativeName: text('family_representative_name'),
    payeeKind: payeeKind('payee_kind').notNull().default('elder'),
    payeeName: text('payee_name'),
    createdBy: uuid('created_by').notNull(),
    createdAt: tz('created_at').notNull().defaultNow(),
  },
  (t) => [
    check('elder_display_name_nfc', nfc(t.displayName)),
    check('elder_display_name_len', sql`length(${t.displayName}) between 1 and 120`),
    check('elder_lineage_nfc', nfc(t.lineage)),
    check('elder_family_rep_nfc', nfc(t.familyRepresentativeName)),
    check('elder_payee_name_nfc', nfc(t.payeeName)),
    check('elder_payee', sql`(${t.payeeKind} = 'family_member') = (${t.payeeName} is not null)`),
    check('elder_birth_year', sql`${t.birthYear} is null or ${t.birthYear} between 1880 and 2100`),
    index('elder_hometown').on(t.hometownId),
  ],
);

export const recording = pgTable(
  'recording',
  {
    id: uuid('id').primaryKey(), // client-generated (offline)
    elderId: uuid('elder_id')
      .notNull()
      .references(() => elderProfile.id),
    facilitatorId: uuid('facilitator_id').notNull(),
    hometownId: uuid('hometown_id').notNull(),
    dialectId: uuid('dialect_id').notNull(),
    topic: recordingTopic('topic').notNull(),
    status: recordingStatus('status').notNull().default('draft'),
    /** Cached from the active consent by a trigger; null while no consent is active. */
    tier: consentTier('tier'),
    currentRevisionId: uuid('current_revision_id'),
    recordedAt: tz('recorded_at').notNull(),
    createdAt: tz('created_at').notNull().defaultNow(),
    updatedAt: tz('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('recording_facilitator').on(t.facilitatorId, t.createdAt),
    index('recording_hometown_status').on(t.hometownId, t.status),
    index('recording_elder').on(t.elderId),
  ],
);

/** Allowed status transitions; the DB trigger refuses anything else (docs/03 §4). Reference data. */
export const recordingStatusTransition = pgTable(
  'recording_status_transition',
  {
    fromStatus: recordingStatus('from_status').notNull(),
    toStatus: recordingStatus('to_status').notNull(),
  },
  (t) => [primaryKey({ columns: [t.fromStatus, t.toStatus] })],
);

export const recordingRevision = pgTable(
  'recording_revision',
  {
    id: uuid('id').primaryKey(),
    recordingId: uuid('recording_id')
      .notNull()
      .references(() => recording.id),
    rev: integer('rev').notNull(),
    titleIg: text('title_ig').notNull(),
    transcriptIg: text('transcript_ig'),
    /** {locale: {title, translation}}; locale keys are BCP 47 (docs/03 §7). */
    glosses: jsonb('glosses').notNull().default({}),
    tags: text('tags')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    draftSource: text('draft_source').notNull().default('human'),
    createdBy: uuid('created_by').notNull(),
    createdAt: tz('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('recording_revision_rev').on(t.recordingId, t.rev),
    check('revision_rev_positive', sql`${t.rev} >= 1`),
    check('revision_title_nfc', nfc(t.titleIg)),
    check('revision_title_len', sql`length(${t.titleIg}) between 1 and 200`),
    check('revision_transcript_nfc', nfc(t.transcriptIg)),
    check('revision_glosses_object', sql`jsonb_typeof(${t.glosses}) = 'object'`),
    check('revision_draft_source', sql`${t.draftSource} in ('human','machine_assisted')`),
  ],
);

/** Facilitator notes at a point in the recording ("Add note", Brief §07). */
export const recordingNote = pgTable(
  'recording_note',
  {
    id: uuid('id').primaryKey(),
    recordingId: uuid('recording_id')
      .notNull()
      .references(() => recording.id),
    atMs: integer('at_ms').notNull(),
    body: text('body').notNull(),
    createdBy: uuid('created_by').notNull(),
    createdAt: tz('created_at').notNull().defaultNow(),
  },
  (t) => [
    check('note_at_ms', sql`${t.atMs} >= 0`),
    check('note_body_nfc', nfc(t.body)),
    check('note_body_len', sql`length(${t.body}) between 1 and 2000`),
    index('note_recording').on(t.recordingId),
  ],
);
