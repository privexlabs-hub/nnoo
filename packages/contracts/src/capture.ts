import { z } from 'zod';

const nfc = (s: string) => s === s.normalize('NFC');
/** Igbo or personal-name text: trimmed, NFC (refused otherwise, never rewritten), bounded. */
const text = (max: number) => z.string().trim().min(1).max(max).refine(nfc, 'must be Unicode NFC');
const id = z.uuid();
const instant = z.iso.datetime({ offset: true });

export const Tier = z.enum(['oha', 'umunna', 'nso']);
export const Topic = z.enum(['story', 'proverb', 'song', 'recipe', 'craft', 'place_lore']);
export const RecordingStatus = z.enum([
  'draft',
  'in_review',
  'published',
  'returned',
  'withdrawn',
  'unpublished',
  'discarded',
]);

// ── community ────────────────────────────────────────────────────────────────
export const HometownQuery = z
  .object({
    q: z.string().trim().max(60).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();
export const HometownView = z.object({
  id,
  name: z.string(),
  lga: z.string(),
  state: z.string(),
  dialects: z.array(z.object({ id, name: z.string(), primary: z.boolean() })),
});
export const HometownList = z.object({ items: z.array(HometownView) });

// ── archive ──────────────────────────────────────────────────────────────────
export const Payee = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('elder') }).strict(),
  z.object({ kind: z.literal('family_member'), name: text(120) }).strict(),
]);

export const CreateElderBody = z
  .object({
    id,
    displayName: text(120),
    hometownId: id,
    dialectId: id,
    birthYear: z.number().int().min(1880).max(2100).optional(),
    lineage: text(120).optional(),
    familyRepresentativeName: text(120).optional(),
    payee: Payee.default({ kind: 'elder' }),
  })
  .strict();
export const ElderView = z.object({
  id,
  displayName: z.string(),
  hometownId: id,
  dialectId: id,
  birthYear: z.number().nullable(),
  lineage: z.string().nullable(),
  familyRepresentativeName: z.string().nullable(),
  payee: z.object({ kind: z.enum(['elder', 'family_member']), name: z.string().nullable() }),
});

export const CreateRecordingBody = z
  .object({
    id,
    elderId: id,
    topic: Topic,
    titleIg: text(200),
    recordedAt: instant,
    dialectId: id.optional(),
  })
  .strict();

export const MediaSummary = z.object({
  id,
  kind: z.enum([
    'audio_raw',
    'audio_master',
    'audio_opus',
    'audio_aac',
    'peaks',
    'consent_evidence',
    'consent_signature',
  ]),
  status: z.enum(['pending', 'uploaded', 'ready', 'rejected', 'purged']),
  bytes: z.number(),
  durationMs: z.number().nullable(),
  /** Brand-voice message key when rejected, e.g. "media.hash_mismatch". */
  rejectReason: z.string().nullable(),
});

export const RecordingView = z.object({
  id,
  elderId: id,
  hometownId: id,
  dialectId: id,
  topic: Topic,
  status: RecordingStatus,
  tier: Tier.nullable(),
  titleIg: z.string(),
  recordedAt: z.string(),
  capabilities: z.object({
    canCaptureConsent: z.boolean(),
    canUploadAudio: z.boolean(),
    canDiscard: z.boolean(),
    canAddNote: z.boolean(),
  }),
});
export const RecordingListQuery = z
  .object({
    cursor: z.string().max(200).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();
export const RecordingList = z.object({
  items: z.array(RecordingView),
  nextCursor: z.string().nullable(),
});

export const MediaList = z.object({ items: z.array(MediaSummary) });
export const ConsentList = z.object({ items: z.array(z.lazy(() => ConsentView)) });

export const AddNoteBody = z
  .object({
    id,
    atMs: z
      .number()
      .int()
      .min(0)
      .max(24 * 3600 * 1000),
    body: text(2000),
  })
  .strict();
export const NoteView = z.object({
  id,
  recordingId: id,
  atMs: z.number(),
  body: z.string(),
  createdAt: z.string(),
});

// ── consent ──────────────────────────────────────────────────────────────────
export const Permissions = z
  .object({
    archive: z.boolean(),
    lessons: z.boolean(),
    social: z.boolean(),
    photo: z.boolean(),
    machineAssist: z.boolean().default(false),
  })
  .strict();

const terms = {
  tier: Tier,
  umunnaScope: z.array(id).min(1).max(3).optional(),
  permissions: Permissions,
  stewardMayWidenTo: Tier.optional(),
  witnessName: text(120).optional(),
  signatureMediaId: id.optional(),
  capturedAt: instant,
};

export const CaptureConsentBody = z
  .object({ id, recordingId: id, evidenceMediaId: id, ...terms })
  .strict();
/** A new version: narrowing, widening or amending. The spoken statement is required unless the steward acts. */
export const ChangeConsentBody = z
  .object({ id, evidenceMediaId: id.optional(), ...terms })
  .strict();
export const RevokeConsentBody = z.object({ evidenceMediaId: id.optional() }).strict();

export const ConsentView = z.object({
  id,
  recordingId: id,
  version: z.number(),
  tier: Tier,
  umunnaScope: z.array(id).nullable(),
  permissions: z.object({
    archive: z.boolean(),
    lessons: z.boolean(),
    social: z.boolean(),
    photo: z.boolean(),
    machineAssist: z.boolean(),
  }),
  stewardMayWidenTo: Tier.nullable(),
  witnessName: z.string().nullable(),
  capturedAt: z.string(),
  active: z.boolean(),
  endReason: z.enum(['withdrawn', 'narrowed', 'widened', 'amended']).nullable(),
});

// ── media ────────────────────────────────────────────────────────────────────
export const CreateUploadBody = z
  .object({
    id,
    recordingId: id,
    kind: z.enum(['audio_raw', 'consent_evidence', 'consent_signature']),
    /** `consent_change`: a new spoken statement for narrowing/withdrawal by a hometown facilitator. */
    purpose: z.enum(['capture', 'consent_change']).default('capture'),
    mime: z.string().max(60),
    bytes: z.number().int().positive(),
    sha256: z.string().regex(/^[0-9a-f]{64}$/),
  })
  .strict();
export const UploadView = z.object({
  id,
  kind: z.enum(['audio_raw', 'consent_evidence', 'consent_signature']),
  status: z.enum(['pending', 'uploaded', 'ready', 'rejected', 'purged']),
  partSize: z.number(),
  partCount: z.number(),
  /** Presigned URLs for parts not yet stored (all of them on create; the missing ones on resume). */
  parts: z.array(z.object({ partNumber: z.number(), url: z.string() })),
  uploadedParts: z.array(z.number()),
  urlsExpireAt: z.string().nullable(),
});
export const CompleteUploadBody = z
  .object({
    parts: z
      .array(
        z.object({
          partNumber: z.number().int().min(1).max(10_000),
          etag: z.string().min(1).max(200),
        }),
      )
      .min(1)
      .max(10_000),
  })
  .strict();

export type HometownList = z.infer<typeof HometownList>;
export type HometownView = z.infer<typeof HometownView>;
export type CreateElderBody = z.infer<typeof CreateElderBody>;
export type ElderView = z.infer<typeof ElderView>;
export type CreateRecordingBody = z.infer<typeof CreateRecordingBody>;
export type RecordingView = z.infer<typeof RecordingView>;
export type RecordingList = z.infer<typeof RecordingList>;
export type MediaSummary = z.infer<typeof MediaSummary>;
export type MediaList = z.infer<typeof MediaList>;
export type AddNoteBody = z.infer<typeof AddNoteBody>;
export type NoteView = z.infer<typeof NoteView>;
export type CaptureConsentBody = z.infer<typeof CaptureConsentBody>;
export type ChangeConsentBody = z.infer<typeof ChangeConsentBody>;
export type RevokeConsentBody = z.infer<typeof RevokeConsentBody>;
export type ConsentView = z.infer<typeof ConsentView>;
export type ConsentList = z.infer<typeof ConsentList>;
export type CreateUploadBody = z.infer<typeof CreateUploadBody>;
export type UploadView = z.infer<typeof UploadView>;
export type CompleteUploadBody = z.infer<typeof CompleteUploadBody>;
