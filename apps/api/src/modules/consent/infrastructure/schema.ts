// Owner: consent. Versioned, append-only consent records (01 §8, ADR-031). The only mutable
// columns are the revocation fields (grants in the custom migration). Cross-module foreign keys
// (recording, media, account) are declared in consent's custom migration.
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { consentTier } from '../../../platform/enums.ts';

const tz = (name: string) => timestamp(name, { withTimezone: true });

/** Why a consent version stopped being active. */
export const consentEndReason = pgEnum('consent_end_reason', [
  'withdrawn', // the elder (or steward, or a panel) withdrew consent entirely
  'narrowed', // replaced by a narrower version
  'widened', // replaced by a wider version captured with the elder present
  'amended', // replaced by a version with the same tier and different permissions
]);

export const consentRecord = pgTable(
  'consent_record',
  {
    id: uuid('id').primaryKey(), // client-generated (offline)
    recordingId: uuid('recording_id').notNull(),
    version: integer('version').notNull(),
    tier: consentTier('tier').notNull(),
    /** Hometown ids whose verified kin may listen, when tier = umunna. */
    umunnaScope: uuid('umunna_scope').array(),
    allowArchive: boolean('allow_archive').notNull(),
    allowLessons: boolean('allow_lessons').notNull(),
    allowSocial: boolean('allow_social').notNull(),
    allowPhoto: boolean('allow_photo').notNull(),
    /** "A computer may help write down your words. A person will always check them." (ADR-025) */
    allowMachineAssist: boolean('allow_machine_assist').notNull().default(false),
    /** Widest tier a steward may later widen to, as the elder pre-authorised (01 §8). */
    stewardMayWidenTo: consentTier('steward_may_widen_to'),
    /** For an elder who cannot read or sign: the named family witness (Brief §23). */
    witnessName: text('witness_name'),
    /** Spoken consent statement (required before session audio, docs/neon/05 §3). Absent only
     * when the elder's steward acts in their own right. */
    evidenceMediaId: uuid('evidence_media_id'),
    actedAs: text('acted_as').notNull().default('facilitator'),
    signatureMediaId: uuid('signature_media_id'),
    capturedBy: uuid('captured_by').notNull(),
    capturedAt: tz('captured_at').notNull(),
    endedAt: tz('ended_at'),
    endedBy: uuid('ended_by'),
    endReason: consentEndReason('end_reason'),
    /** The new spoken statement behind a withdrawal by someone other than the original capture. */
    endedEvidenceMediaId: uuid('ended_evidence_media_id'),
    createdAt: tz('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('consent_recording_version').on(t.recordingId, t.version),
    uniqueIndex('consent_one_active')
      .on(t.recordingId)
      .where(sql`${t.endedAt} is null`),
    // A spoken statement backs exactly one consent act.
    uniqueIndex('consent_evidence_once').on(t.evidenceMediaId),
    uniqueIndex('consent_end_evidence_once').on(t.endedEvidenceMediaId),
    index('consent_recording').on(t.recordingId),
    check('consent_version_positive', sql`${t.version} >= 1`),
    check('consent_acted_as', sql`${t.actedAs} in ('facilitator','steward')`),
    check(
      'consent_evidence_unless_steward',
      sql`${t.actedAs} = 'steward' or ${t.evidenceMediaId} is not null`,
    ),
    check('consent_first_by_facilitator', sql`${t.version} > 1 or ${t.actedAs} = 'facilitator'`),
    check(
      'consent_umunna_scope',
      sql`(${t.tier} = 'umunna') = (${t.umunnaScope} is not null and cardinality(${t.umunnaScope}) > 0)`,
    ),
    check(
      'consent_end_fields',
      sql`(${t.endedAt} is null) = (${t.endReason} is null) and (${t.endedAt} is null) = (${t.endedBy} is null)`,
    ),
    check(
      'consent_witness_nfc',
      sql`${t.witnessName} is null or ${t.witnessName} = normalize(${t.witnessName}, NFC)`,
    ),
    // Nsọ is metadata only: nothing of it may be used in lessons, social media or by machines.
    check(
      'consent_nso_restrictions',
      sql`${t.tier} <> 'nso' or not (${t.allowLessons} or ${t.allowSocial} or ${t.allowMachineAssist})`,
    ),
  ],
);
