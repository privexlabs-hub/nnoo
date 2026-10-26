import { and, eq, isNull } from 'drizzle-orm';
import type { capture } from '@nnoo/contracts';
import * as archive from '../../archive/public.ts';
import * as audit from '../../audit/public.ts';
import type { AccountActor } from '../../../platform/actor.ts';
import { inTransaction } from '../../../platform/db.ts';
import type { Deps } from '../../../platform/deps.ts';
import { enqueue } from '../../../platform/jobs/queue.ts';
import { DomainError, problem } from '../../../platform/problem.ts';
import { readOwnUpload, uploadMedia } from '../domain/policies.ts';
import {
  PART_SIZE,
  partCount,
  storageKey,
  UPLOAD_RULES,
  uploadProblem,
  type UploadKind,
} from '../domain/upload.ts';
import type { Bucket } from '../infrastructure/storage.ts';
import { mediaAsset, uploadSession } from '../infrastructure/schema.ts';

/** Part URLs live an hour (07 §5); the session itself survives a week of being offline. */
const PART_URL_SECONDS = 3600;
const SESSION_DAYS = 7;

type Asset = typeof mediaAsset.$inferSelect;
type Session = typeof uploadSession.$inferSelect;

async function partUrls(deps: Deps, a: Asset, s: Session, missing: number[]) {
  return Promise.all(
    missing.map(async (partNumber) => ({
      partNumber,
      url: await deps.storage.presignPart(
        a.bucket as Bucket,
        a.storageKey,
        s.s3UploadId,
        partNumber,
        PART_URL_SECONDS,
      ),
    })),
  );
}

function view(
  a: Asset,
  s: Session | null,
  parts: { partNumber: number; url: string }[],
  uploaded: number[],
  deps: Deps,
): capture.UploadView {
  return {
    id: a.id,
    kind: a.kind as UploadKind,
    status: a.status,
    partSize: s?.partSize ?? PART_SIZE,
    partCount: s?.partCount ?? partCount(a.bytes),
    parts,
    uploadedParts: uploaded,
    urlsExpireAt: parts.length
      ? new Date(deps.clock.now().getTime() + PART_URL_SECONDS * 1000).toISOString()
      : null,
  };
}

async function loadOwn(deps: Deps, actor: AccountActor, id: string) {
  const [row] = await deps.db
    .select({ a: mediaAsset, s: uploadSession })
    .from(mediaAsset)
    .leftJoin(uploadSession, eq(uploadSession.mediaAssetId, mediaAsset.id))
    .where(and(eq(mediaAsset.id, id), eq(mediaAsset.createdBy, actor.id)));
  if (!row) throw problem('media.not_found', 404);
  const d = readOwnUpload.rule(actor, { createdBy: row.a.createdBy }, deps);
  if (!d.allow) throw new DomainError(d.code, d.status);
  return row;
}

/**
 * POST /v1/uploads (docs/neon/05 §3). Three steps, never a provider call inside a transaction:
 * 1. policy + asset row (pending)  2. CreateMultipartUpload  3. session row + part URLs.
 * A retry with the same id resumes whichever step did not finish.
 */
export async function createUpload(
  deps: Deps,
  actor: AccountActor,
  b: capture.CreateUploadBody,
  requestId: string,
): Promise<capture.UploadView> {
  const bad = uploadProblem(b.kind, b.mime, b.bytes, b.sha256);
  if (bad) throw new DomainError('media.invalid_upload', 422, bad);
  const rule = UPLOAD_RULES[b.kind];

  const asset = await inTransaction(deps.db, { actorId: actor.id, requestId }, async (tx) => {
    const rec = await archive.recordingForMedia(tx, b.recordingId, true);
    if (!rec) throw problem('archive.recording_not_found', 404);
    const d = uploadMedia.rule(
      actor,
      { kind: b.kind, recording: rec, forConsentChange: b.purpose === 'consent_change' },
      deps,
    );
    if (!d.allow) throw new DomainError(d.code, d.status);

    // The DB trigger media_no_nso is the third Nsọ guard (after policy and this API).
    const inserted = await tx
      .insert(mediaAsset)
      .values({
        id: b.id,
        recordingId: b.recordingId,
        kind: b.kind,
        bucket: rule.bucket,
        storageKey: storageKey(b.kind, b.id),
        sha256: Buffer.from(b.sha256, 'hex'),
        bytes: b.bytes,
        mime: b.mime,
        createdBy: actor.id,
      })
      .onConflictDoNothing()
      .returning();
    if (inserted[0]) {
      await audit.record(tx, {
        actorId: actor.id,
        action: 'media.upload_started',
        resourceType: 'media_asset',
        resourceId: b.id,
        detail: { kind: b.kind, bytes: b.bytes },
        requestId,
      });
      return inserted[0];
    }
    const [existing] = await tx.select().from(mediaAsset).where(eq(mediaAsset.id, b.id));
    // Same id from the same person for the same file: a retry. Anything else is a conflict.
    if (
      !existing ||
      existing.createdBy !== actor.id ||
      !existing.sha256.equals(Buffer.from(b.sha256, 'hex')) ||
      existing.bytes !== b.bytes
    ) {
      throw problem('archive.recording_exists', 409, 'An upload with this id already exists.');
    }
    return existing;
  });

  if (asset.status !== 'pending') return getUpload(deps, actor, asset.id);

  let [session] = await deps.db
    .select()
    .from(uploadSession)
    .where(eq(uploadSession.mediaAssetId, asset.id));
  if (!session) {
    const s3UploadId = await deps.storage.createMultipart(
      asset.bucket as Bucket,
      asset.storageKey,
      asset.mime,
    );
    const now = deps.clock.now();
    const created = await deps.db
      .insert(uploadSession)
      .values({
        id: asset.id,
        mediaAssetId: asset.id,
        s3UploadId,
        partSize: PART_SIZE,
        partCount: partCount(asset.bytes),
        createdBy: actor.id,
        createdAt: now,
        expiresAt: new Date(now.getTime() + SESSION_DAYS * 86_400_000),
      })
      .onConflictDoNothing()
      .returning();
    if (created[0]) {
      session = created[0];
    } else {
      // A concurrent retry won the race: use its upload and abandon ours.
      await deps.storage.abortMultipart(asset.bucket as Bucket, asset.storageKey, s3UploadId);
      [session] = await deps.db
        .select()
        .from(uploadSession)
        .where(eq(uploadSession.mediaAssetId, asset.id));
    }
  }
  const all = Array.from({ length: session!.partCount }, (_, i) => i + 1);
  return view(asset, session!, await partUrls(deps, asset, session!, all), [], deps);
}

/** GET /v1/uploads/:id — resume after any interruption: which parts are stored, fresh URLs for the rest. */
export async function getUpload(
  deps: Deps,
  actor: AccountActor,
  id: string,
): Promise<capture.UploadView> {
  const { a, s } = await loadOwn(deps, actor, id);
  if (a.status !== 'pending' || !s || s.completedAt || s.abortedAt) return view(a, s, [], [], deps);
  const stored = await deps.storage.listParts(a.bucket as Bucket, a.storageKey, s.s3UploadId);
  const done = new Set(stored.map((p) => p.partNumber));
  const missing = Array.from({ length: s.partCount }, (_, i) => i + 1).filter((n) => !done.has(n));
  return view(
    a,
    s,
    await partUrls(deps, a, s, missing),
    [...done].sort((x, y) => x - y),
    deps,
  );
}

/**
 * POST /v1/uploads/:id/complete. Finishes the multipart upload, checks the size, then — in a
 * fresh transaction, because consent may have been revoked meanwhile — marks it uploaded and
 * queues processing. The worker verifies the SHA-256 and the real format (ADR-032).
 */
export async function completeUpload(
  deps: Deps,
  actor: AccountActor,
  id: string,
  b: capture.CompleteUploadBody,
  requestId: string,
): Promise<capture.UploadView> {
  const { a, s } = await loadOwn(deps, actor, id);
  if (a.status !== 'pending') return view(a, s, [], [], deps); // already completed: idempotent
  if (!s || s.abortedAt) throw problem('media.upload_incomplete', 409);

  const expected = Array.from({ length: s.partCount }, (_, i) => i + 1);
  const given = [...b.parts].sort((x, y) => x.partNumber - y.partNumber);
  if (given.length !== expected.length || given.some((p, i) => p.partNumber !== expected[i])) {
    throw new DomainError('media.upload_incomplete', 409, `Expected parts 1..${s.partCount}.`);
  }
  try {
    await deps.storage.completeMultipart(a.bucket as Bucket, a.storageKey, s.s3UploadId, given);
  } catch {
    // Unknown or wrong ETags, or a part missing: the client resumes with GET /v1/uploads/:id.
    throw problem('media.upload_incomplete', 409);
  }
  return finishUpload(deps, a, requestId, actor.id);
}

/**
 * Shared by /complete and the storage trigger backstop (device crashed after the last part).
 * Idempotent: only a pending asset moves on, once.
 */
export async function finishUpload(
  deps: Deps,
  a: Asset,
  requestId: string | null,
  actorId: string | null,
): Promise<capture.UploadView> {
  const size = await deps.storage.head(a.bucket as Bucket, a.storageKey);
  if (size === null) throw problem('media.upload_incomplete', 409);

  const outcome = await inTransaction(deps.db, { actorId, requestId }, async (tx) => {
    const rec = a.recordingId ? await archive.recordingForMedia(tx, a.recordingId, true) : null;
    const [current] = await tx
      .select()
      .from(mediaAsset)
      .where(eq(mediaAsset.id, a.id))
      .for('update');
    if (!current || current.status !== 'pending')
      return { asset: current ?? a, deleteObject: false };

    const reject = async (reason: string) => {
      const [r] = await tx
        .update(mediaAsset)
        .set({ status: 'rejected', rejectReason: reason })
        .where(eq(mediaAsset.id, a.id))
        .returning();
      return { asset: r!, deleteObject: true };
    };
    if (size !== a.bytes) return reject('media.size_mismatch');
    if (
      a.kind === 'audio_raw' &&
      (!rec || rec.tier === null || rec.tier === 'nso' || rec.status !== 'draft')
    ) {
      return reject('media.recording_closed'); // consent revoked, narrowed to Nsọ, or discarded meanwhile
    }
    const [u] = await tx
      .update(mediaAsset)
      .set({ status: 'uploaded', uploadedAt: deps.clock.now() })
      .where(eq(mediaAsset.id, a.id))
      .returning();
    await tx
      .update(uploadSession)
      .set({ completedAt: deps.clock.now() })
      .where(and(eq(uploadSession.mediaAssetId, a.id), isNull(uploadSession.completedAt)));
    if (a.kind === 'audio_raw') {
      await enqueue(tx, {
        type: 'audio.process',
        queue: 'audio',
        payload: { assetId: a.id },
        dedupeKey: `audio.process:${a.id}`,
        maxAttempts: 5,
      });
    }
    await audit.record(tx, {
      actorId,
      action: 'media.upload_completed',
      resourceType: 'media_asset',
      resourceId: a.id,
      detail: { kind: a.kind },
      requestId,
    });
    return { asset: u!, deleteObject: false };
  });

  if (outcome.deleteObject) {
    await deps.storage.delete(a.bucket as Bucket, a.storageKey);
    await deps.db
      .update(mediaAsset)
      .set({ objectDeletedAt: deps.clock.now() })
      .where(eq(mediaAsset.id, a.id));
  }
  return view(outcome.asset, null, [], [], deps);
}

/** GET /v1/recordings/:id/media — the facilitator's view of what has arrived and what is ready. */
export async function listRecordingMedia(
  deps: Deps,
  actor: AccountActor,
  recordingId: string,
): Promise<capture.MediaList> {
  const rec = await archive.recordingForMedia(deps.db, recordingId);
  if (!rec || rec.facilitatorId !== actor.id) throw problem('archive.recording_not_found', 404);
  const rows = await deps.db
    .select()
    .from(mediaAsset)
    .where(eq(mediaAsset.recordingId, recordingId))
    .orderBy(mediaAsset.createdAt);
  return {
    items: rows.map((m) => ({
      id: m.id,
      kind: m.kind,
      status: m.status,
      bytes: m.bytes,
      durationMs: m.durationMs,
      rejectReason: m.rejectReason,
    })),
  };
}
