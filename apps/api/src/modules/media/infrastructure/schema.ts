// Owner: media. Object metadata and upload sessions (docs/03 §3, docs/neon/05). Binary data
// never lives in Postgres. The recording foreign key and the Nsọ guard (INV-2) are in media's
// custom migration.
import { sql } from 'drizzle-orm';
import {
  bigint,
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
import { bytea } from '../../../platform/db-types.ts';

const tz = (name: string) => timestamp(name, { withTimezone: true });

export const mediaKind = pgEnum('media_kind', [
  'audio_raw', // untrusted upload from the device
  'audio_master', // FLAC, never served
  'audio_opus',
  'audio_aac',
  'peaks', // waveform JSON
  'consent_evidence', // spoken consent statement (audio, but consent data, not content)
  'consent_signature', // photographed form or signature
]);
export const mediaStatus = pgEnum('media_status', [
  'pending',
  'uploaded',
  'ready',
  'rejected',
  'purged',
]);

export const mediaAsset = pgTable(
  'media_asset',
  {
    id: uuid('id').primaryKey(),
    recordingId: uuid('recording_id'),
    kind: mediaKind('kind').notNull(),
    bucket: text('bucket').notNull(),
    /** Opaque: `<kind>/<uuidv7>`; never names, places or titles. */
    storageKey: text('storage_key').notNull().unique(),
    /** SHA-256 declared by the client (raw, evidence) or computed by the worker (derivatives). */
    sha256: bytea('sha256').notNull(),
    bytes: bigint('bytes', { mode: 'number' }).notNull(),
    durationMs: integer('duration_ms'),
    mime: text('mime').notNull(),
    status: mediaStatus('status').notNull().default('pending'),
    /** For derivatives: the raw or master they were made from. */
    sourceAssetId: uuid('source_asset_id'),
    rejectReason: text('reject_reason'),
    createdBy: uuid('created_by'),
    createdAt: tz('created_at').notNull().defaultNow(),
    uploadedAt: tz('uploaded_at'),
    /** When the asset became unservable (set in the revoking transaction, INV-7). */
    purgedAt: tz('purged_at'),
    /** When the purge job confirmed the object is gone from storage. */
    objectDeletedAt: tz('object_deleted_at'),
  },
  (t) => [
    index('media_recording').on(t.recordingId, t.kind),
    index('media_pending')
      .on(t.createdAt)
      .where(sql`${t.status} in ('pending','uploaded')`),
    index('media_purge_due')
      .on(t.purgedAt)
      .where(sql`${t.purgedAt} is not null and ${t.objectDeletedAt} is null`),
    check('media_bytes', sql`${t.bytes} > 0`),
    check('media_sha256_len', sql`length(${t.sha256}) = 32`),
    check('media_key_opaque', sql`${t.storageKey} ~ '^[a-z_]+/[0-9a-f-]{36}$'`),
    check(
      'media_bucket',
      sql`${t.bucket} in ('media-uploads','media-masters','media-derivatives','consent-evidence')`,
    ),
    check('media_purged', sql`(${t.status} = 'purged') = (${t.purgedAt} is not null)`),
    check('media_reject_reason', sql`(${t.status} = 'rejected') = (${t.rejectReason} is not null)`),
  ],
);

/** A resumable multipart upload of one asset (docs/neon/05 §3). */
export const uploadSession = pgTable(
  'upload_session',
  {
    id: uuid('id').primaryKey(),
    mediaAssetId: uuid('media_asset_id')
      .notNull()
      .references(() => mediaAsset.id),
    s3UploadId: text('s3_upload_id').notNull(),
    partSize: integer('part_size').notNull(),
    partCount: integer('part_count').notNull(),
    createdBy: uuid('created_by').notNull(),
    createdAt: tz('created_at').notNull().defaultNow(),
    expiresAt: tz('expires_at').notNull(),
    completedAt: tz('completed_at'),
    abortedAt: tz('aborted_at'),
  },
  (t) => [
    uniqueIndex('upload_session_asset').on(t.mediaAssetId),
    check('upload_part_size', sql`${t.partSize} between 5242880 and 104857600`),
    check('upload_part_count', sql`${t.partCount} between 1 and 10000`),
    check(
      'upload_terminal',
      sql`not (${t.completedAt} is not null and ${t.abortedAt} is not null)`,
    ),
  ],
);
