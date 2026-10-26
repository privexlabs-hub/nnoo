import { and, eq, inArray, isNotNull, isNull, lt, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { z } from 'zod';
import * as archive from '../../archive/public.ts';
import * as audit from '../../audit/public.ts';
import { constantTimeEqual, randomToken, sha256 } from '../../../platform/crypto.ts';
import { inTransaction } from '../../../platform/db.ts';
import type { Deps } from '../../../platform/deps.ts';
import { claim, writeOutbox } from '../../../platform/jobs/queue.ts';
import { DomainError, problem } from '../../../platform/problem.ts';
import { job, serviceToken } from '../../../platform/schema.ts';
import { storageKey } from '../domain/upload.ts';
import { finishUpload } from './uploads.ts';
import type { Bucket } from '../infrastructure/storage.ts';
import { mediaAsset, uploadSession } from '../infrastructure/schema.ts';

/** A claim lasts long enough to transcode a long session; the token slightly longer. */
const CLAIM_SECONDS = 15 * 60;
const TOKEN_SECONDS = 20 * 60;
const URL_SECONDS = 20 * 60;

/** Derivatives the worker produces (05 §5). Keys derive from the claim's token id, so the
 * worker cannot choose where it writes. */
const OUTPUTS = {
  master: { kind: 'audio_master', bucket: 'media-masters', mime: 'audio/flac' },
  opus: { kind: 'audio_opus', bucket: 'media-derivatives', mime: 'audio/ogg' },
  aac: { kind: 'audio_aac', bucket: 'media-derivatives', mime: 'audio/mp4' },
  peaks: { kind: 'peaks', bucket: 'media-derivatives', mime: 'application/json' },
} as const;
type OutputName = keyof typeof OUTPUTS;

export const PROCESSING_PARAMS = {
  loudnessLufs: -18,
  opusKbps: 32,
  aacKbps: 64,
  peaks: 800,
} as const;

function workerKeyValid(deps: Deps, header: string | undefined): boolean {
  const m = header ? /^Bearer (.+)$/.exec(header) : null;
  return !!m && deps.env.AUDIO_WORKER_KEYS.some((k) => constantTimeEqual(m[1]!, k));
}

export type ClaimResponse =
  | { job: null }
  | {
      job: {
        jobId: number;
        assetId: string;
        token: string;
        input: { getUrl: string; sha256: string; bytes: number };
        output: Record<OutputName, string>;
        params: typeof PROCESSING_PARAMS;
      };
    };

/** POST /internal/audio/claim — the external worker asks for one job (ADR-021). */
export async function claimAudioJob(
  deps: Deps,
  authorization: string | undefined,
): Promise<ClaimResponse> {
  if (!workerKeyValid(deps, authorization)) throw problem('worker.unauthenticated', 401);

  for (let guard = 0; guard < 5; guard++) {
    const [j] = await claim(deps.db, 'audio', 1, CLAIM_SECONDS);
    if (!j) return { job: null };
    const assetId = (j.payload as { assetId?: string }).assetId;

    if (j.attempts > j.maxAttempts) {
      // Exhausted: the facilitator sees "Preparing audio is taking longer than usual." (05 §5)
      await deps.db
        .update(job)
        .set({ failedAt: sql`now()`, lockedUntil: null, lastError: 'attempts exhausted' })
        .where(eq(job.id, j.id));
      deps.log.error('audio job exhausted', { alert: true, job_id: j.id });
      continue;
    }
    const [asset] = assetId
      ? await deps.db.select().from(mediaAsset).where(eq(mediaAsset.id, assetId))
      : [];
    const rec = asset?.recordingId
      ? await archive.recordingForMedia(deps.db, asset.recordingId)
      : null;
    if (!asset || asset.status !== 'uploaded' || !rec || rec.tier === null || rec.tier === 'nso') {
      // Nothing to do any more (revoked, narrowed to Nsọ, discarded): finish the job quietly.
      await deps.db
        .update(job)
        .set({ doneAt: sql`now()`, lockedUntil: null })
        .where(eq(job.id, j.id));
      continue;
    }

    const jti = uuidv7();
    const secret = randomToken();
    await deps.db.insert(serviceToken).values({
      jti,
      jobId: j.id,
      secretHash: sha256(secret),
      expiresAt: new Date(deps.clock.now().getTime() + TOKEN_SECONDS * 1000),
    });
    const output = {} as Record<OutputName, string>;
    for (const [name, o] of Object.entries(OUTPUTS) as [
      OutputName,
      (typeof OUTPUTS)[OutputName],
    ][]) {
      output[name] = await deps.storage.presignPut(
        o.bucket,
        storageKey(o.kind, jti),
        o.mime,
        URL_SECONDS,
      );
    }
    return {
      job: {
        jobId: j.id,
        assetId: asset.id,
        token: `${jti}.${secret}`,
        input: {
          getUrl: await deps.storage.presignGet(
            asset.bucket as Bucket,
            asset.storageKey,
            URL_SECONDS,
          ),
          sha256: asset.sha256.toString('hex'),
          bytes: asset.bytes,
        },
        output,
        params: PROCESSING_PARAMS,
      },
    };
  }
  return { job: null };
}

const OutputReport = z
  .object({ sha256: z.string().regex(/^[0-9a-f]{64}$/), bytes: z.number().int().positive() })
  .strict();

export const AudioResultBody = z.discriminatedUnion('status', [
  z
    .object({
      status: z.literal('ok'),
      sha256: z.string().regex(/^[0-9a-f]{64}$/),
      durationMs: z
        .number()
        .int()
        .positive()
        .max(24 * 3600 * 1000),
      format: z.string().max(40),
      lufs: z.number().min(-70).max(0),
      algoVersion: z.string().max(40),
      outputs: z
        .object({
          master: OutputReport,
          opus: OutputReport,
          aac: OutputReport,
          peaks: OutputReport,
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      status: z.literal('rejected'),
      reason: z.enum(['hash_mismatch', 'format_not_allowed', 'unreadable', 'too_long', 'silent']),
    })
    .strict(),
]);
export type AudioResult = z.infer<typeof AudioResultBody>;

/** Verifies the per-job token: right job, not used, not expired. */
async function verifyToken(deps: Deps, jobId: number, authorization: string | undefined) {
  const m = authorization
    ? /^Bearer ([0-9a-f-]{36})\.([A-Za-z0-9_-]{43})$/.exec(authorization)
    : null;
  if (!m) throw problem('worker.unauthenticated', 401);
  const [t] = await deps.db.select().from(serviceToken).where(eq(serviceToken.jti, m[1]!));
  const ok =
    t &&
    t.jobId === jobId &&
    !t.revokedAt &&
    t.expiresAt > deps.clock.now() &&
    t.secretHash !== null &&
    t.secretHash.equals(sha256(m[2]!));
  if (!ok) throw problem('worker.unauthenticated', 401);
  return t;
}

/** POST /internal/audio/:jobId/result — the worker reports; we verify every output exists. */
export async function recordAudioResult(
  deps: Deps,
  jobId: number,
  authorization: string | undefined,
  body: AudioResult,
) {
  const token = await verifyToken(deps, jobId, authorization);
  const [j] = await deps.db.select().from(job).where(eq(job.id, jobId));
  if (!j || j.queue !== 'audio') throw problem('worker.job_not_found', 404);
  const assetId = (j.payload as { assetId: string }).assetId;
  const [raw] = await deps.db.select().from(mediaAsset).where(eq(mediaAsset.id, assetId));
  if (!raw) throw problem('worker.job_not_found', 404);

  const outputKeys = Object.fromEntries(
    (Object.entries(OUTPUTS) as [OutputName, (typeof OUTPUTS)[OutputName]][]).map(([n, o]) => [
      n,
      { ...o, key: storageKey(o.kind, token.jti) },
    ]),
  ) as Record<OutputName, (typeof OUTPUTS)[OutputName] & { key: string }>;

  // Network checks before the transaction: every reported output must really be in storage.
  if (body.status === 'ok') {
    if (body.sha256 !== raw.sha256.toString('hex')) {
      throw new DomainError(
        'http.validation_failed',
        400,
        'Reported hash does not match the declared upload; report status=rejected/hash_mismatch.',
      );
    }
    for (const [name, o] of Object.entries(outputKeys) as [
      OutputName,
      (typeof outputKeys)[OutputName],
    ][]) {
      const size = await deps.storage.head(o.bucket, o.key);
      if (size !== body.outputs[name].bytes)
        throw new DomainError(
          'http.validation_failed',
          400,
          `Output ${name} is missing or has the wrong size.`,
        );
    }
  }

  const outcome = await inTransaction(deps.db, { requestId: `audio-job-${jobId}` }, async (tx) => {
    // Single use: revoke the token first; a concurrent replay finds it revoked.
    const revoked = await tx
      .update(serviceToken)
      .set({ revokedAt: deps.clock.now() })
      .where(and(eq(serviceToken.jti, token.jti), isNull(serviceToken.revokedAt)))
      .returning({ jti: serviceToken.jti });
    if (revoked.length === 0) throw problem('worker.unauthenticated', 401);

    const [current] = await tx
      .select()
      .from(mediaAsset)
      .where(eq(mediaAsset.id, raw.id))
      .for('update');
    const rec = current?.recordingId
      ? await archive.recordingForMedia(tx, current.recordingId, true)
      : null;
    await tx
      .update(job)
      .set({ doneAt: sql`now()`, lockedUntil: null })
      .where(and(eq(job.id, jobId), isNull(job.doneAt)));

    // Revoked, narrowed to Nsọ or discarded while processing: keep nothing.
    const stillWanted =
      current?.status === 'uploaded' && rec && rec.tier !== null && rec.tier !== 'nso';
    if (!stillWanted || body.status === 'rejected') {
      if (current?.status === 'uploaded' && body.status === 'rejected') {
        await tx
          .update(mediaAsset)
          .set({ status: 'rejected', rejectReason: `media.${body.reason}` })
          .where(eq(mediaAsset.id, raw.id));
      }
      return { keep: false as const };
    }

    const now = deps.clock.now();
    for (const [name, o] of Object.entries(outputKeys) as [
      OutputName,
      (typeof outputKeys)[OutputName],
    ][]) {
      await tx.insert(mediaAsset).values({
        id: uuidv7(),
        recordingId: raw.recordingId,
        kind: o.kind,
        bucket: o.bucket,
        storageKey: o.key,
        sha256: Buffer.from(body.outputs[name].sha256, 'hex'),
        bytes: body.outputs[name].bytes,
        durationMs: name === 'peaks' ? null : body.durationMs,
        mime: o.mime,
        status: 'ready',
        sourceAssetId: raw.id,
        uploadedAt: now,
      });
    }
    // The raw upload has done its job; it is deleted from storage (05 §5) and kept as provenance.
    await tx
      .update(mediaAsset)
      .set({ status: 'purged', purgedAt: now, durationMs: body.durationMs })
      .where(eq(mediaAsset.id, raw.id));
    await writeOutbox(tx, 'DerivativesReady', raw.recordingId!, {
      recordingId: raw.recordingId,
      rawAssetId: raw.id,
    });
    await audit.record(tx, {
      actorId: null,
      action: 'media.derivatives_ready',
      resourceType: 'media_asset',
      resourceId: raw.id,
      detail: { algoVersion: body.algoVersion, durationMs: body.durationMs },
    });
    return { keep: true as const };
  });

  if (!outcome.keep) {
    for (const o of Object.values(outputKeys))
      await deps.storage.delete(o.bucket, o.key).catch(() => {});
  }
  await deps.storage.delete(raw.bucket as Bucket, raw.storageKey);
  await deps.db
    .update(mediaAsset)
    .set({ objectDeletedAt: deps.clock.now() })
    .where(and(eq(mediaAsset.id, raw.id), isNull(mediaAsset.objectDeletedAt)));
  deps.kick();
  return { accepted: true as const, kept: outcome.keep };
}

/**
 * Job `media.purgeObjects` (consumer of ConsentRevoked, ConsentNarrowed, RecordingDiscarded):
 * delete from storage every object already marked unservable (purged) for the recording, and
 * abort its open uploads. Idempotent: deleting a missing object is a no-op.
 */
export async function purgeRecordingObjects(deps: Deps, recordingId: string): Promise<number> {
  const due = await deps.db
    .select()
    .from(mediaAsset)
    .where(
      and(
        eq(mediaAsset.recordingId, recordingId),
        isNotNull(mediaAsset.purgedAt),
        isNull(mediaAsset.objectDeletedAt),
      ),
    );
  for (const a of due) {
    await deps.storage.delete(a.bucket as Bucket, a.storageKey);
    await deps.db
      .update(mediaAsset)
      .set({ objectDeletedAt: deps.clock.now() })
      .where(eq(mediaAsset.id, a.id));
  }
  const open = await deps.db
    .select({ s: uploadSession, a: mediaAsset })
    .from(uploadSession)
    .innerJoin(mediaAsset, eq(mediaAsset.id, uploadSession.mediaAssetId))
    .where(
      and(
        eq(mediaAsset.recordingId, recordingId),
        isNull(uploadSession.completedAt),
        isNull(uploadSession.abortedAt),
        inArray(mediaAsset.status, ['purged', 'rejected']),
      ),
    );
  for (const { s, a } of open) {
    await deps.storage.abortMultipart(a.bucket as Bucket, a.storageKey, s.s3UploadId);
    await deps.db
      .update(uploadSession)
      .set({ abortedAt: deps.clock.now() })
      .where(eq(uploadSession.id, s.id));
  }
  return due.length;
}

/** Revocation SLA (INV-7, 05 §6): anything unservable for > 15 min whose bytes still exist pages on-call. */
export async function revocationSlaCheck(
  deps: Deps,
): Promise<{ overdue: number; reachable: number; retried: number }> {
  const cutoff = new Date(deps.clock.now().getTime() - 15 * 60_000);
  const overdue = await deps.db
    .select()
    .from(mediaAsset)
    .where(
      and(
        isNotNull(mediaAsset.purgedAt),
        isNull(mediaAsset.objectDeletedAt),
        lt(mediaAsset.purgedAt, cutoff),
      ),
    )
    .limit(200);
  let retried = 0;
  for (const a of overdue) {
    deps.log.error('revocation SLA breach', {
      alert: true,
      page: true,
      invariant: 'INV-7',
      asset_id: a.id,
    });
    await deps.storage.delete(a.bucket as Bucket, a.storageKey);
    await deps.db
      .update(mediaAsset)
      .set({ objectDeletedAt: deps.clock.now() })
      .where(eq(mediaAsset.id, a.id));
    retried++;
  }
  // Probe: assets confirmed deleted in the last 24 h must really be gone from storage.
  const recent = await deps.db
    .select()
    .from(mediaAsset)
    .where(
      and(
        isNotNull(mediaAsset.objectDeletedAt),
        sql`${mediaAsset.objectDeletedAt} > now() - interval '24 hours'`,
        sql`${mediaAsset.kind} <> 'audio_raw'`,
      ),
    )
    .limit(200);
  let reachable = 0;
  for (const a of recent) {
    if ((await deps.storage.head(a.bucket as Bucket, a.storageKey)) !== null) {
      reachable++;
      deps.log.error('purged object still reachable', {
        alert: true,
        page: true,
        invariant: 'INV-7',
        asset_id: a.id,
      });
      await deps.storage.delete(a.bucket as Bucket, a.storageKey);
    }
  }
  return { overdue: overdue.length, reachable, retried };
}

/**
 * storage_object_created on media-uploads / consent-evidence (05 §4). Trigger-safe: it only
 * reconciles state that already exists. Unknown objects are quarantined; Nsọ audio is purged.
 */
export async function onObjectCreated(
  deps: Deps,
  bucket: string,
  key: string,
): Promise<'quarantined' | 'nso_purged' | 'completed' | 'noop'> {
  const [a] = await deps.db.select().from(mediaAsset).where(eq(mediaAsset.storageKey, key));
  if (!a || a.bucket !== bucket) {
    await deps.storage.delete(bucket as Bucket, key);
    deps.log.error('orphan object quarantined', {
      alert: true,
      bucket,
      key_prefix: key.split('/')[0],
    });
    return 'quarantined';
  }
  if (
    a.kind === 'audio_raw' &&
    a.recordingId &&
    (await archive.tierOf(deps.db, a.recordingId)) === 'nso'
  ) {
    await deps.storage.delete(bucket as Bucket, key);
    deps.log.error('Nsọ audio reached storage', {
      alert: true,
      page: true,
      invariant: 'INV-2',
      asset_id: a.id,
    });
    return 'nso_purged';
  }
  if (a.status === 'pending') {
    await finishUpload(deps, a, null, null).catch(() => {});
    return 'completed';
  }
  return 'noop';
}

/** Daily sweep (ADR-032: lifecycle rules are not enforced): abandon uploads idle for > 7 days. */
export async function sweepStaleUploads(deps: Deps): Promise<number> {
  const stale = await deps.db
    .select({ s: uploadSession, a: mediaAsset })
    .from(uploadSession)
    .innerJoin(mediaAsset, eq(mediaAsset.id, uploadSession.mediaAssetId))
    .where(
      and(
        isNull(uploadSession.completedAt),
        isNull(uploadSession.abortedAt),
        lt(uploadSession.expiresAt, deps.clock.now()),
      ),
    )
    .limit(500);
  for (const { s, a } of stale) {
    await deps.storage.abortMultipart(a.bucket as Bucket, a.storageKey, s.s3UploadId);
    await deps.db
      .update(uploadSession)
      .set({ abortedAt: deps.clock.now() })
      .where(eq(uploadSession.id, s.id));
    await deps.db
      .update(mediaAsset)
      .set({ status: 'rejected', rejectReason: 'media.upload_expired' })
      .where(and(eq(mediaAsset.id, a.id), eq(mediaAsset.status, 'pending')));
  }
  return stale.length;
}
