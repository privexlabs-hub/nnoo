import type { Hono } from 'hono';
import { z } from 'zod';
import { capture } from '@nnoo/contracts';
import type { AccountActor } from '../../../platform/actor.ts';
import type { AppEnv } from '../../../platform/app-env.ts';
import { definePolicy, requireActiveAccount, requireStepUp } from '../../../platform/policy.ts';
import { DomainError, problem } from '../../../platform/problem.ts';
import { registryOf, route } from '../../../platform/route.ts';
import { triggerRoute } from '../../../platform/triggers.ts';
import {
  AudioResultBody,
  claimAudioJob,
  onObjectCreated,
  recordAudioResult,
  revocationSlaCheck,
  sweepStaleUploads,
} from '../application/processing.ts';
import {
  completeUpload,
  createUpload,
  getUpload,
  listRecordingMedia,
} from '../application/uploads.ts';

const uploadSession = definePolicy({
  action: 'media.upload.session',
  description:
    'A signed-in, active account in a passkey session; resource checks follow in the use case.',
  rule: (actor) => requireStepUp(actor),
});
const signedIn = definePolicy({
  action: 'media.read.session',
  description:
    'A signed-in, active account; results are scoped to their own uploads and recordings.',
  rule: (actor) => requireActiveAccount(actor),
});

const idOf = (p: Record<string, string>) => {
  const r = z.uuid().safeParse(p.id);
  if (!r.success) throw problem('media.not_found', 404);
  return r.data;
};

export function mediaRoutes(app: Hono<AppEnv>): void {
  route(app, {
    method: 'POST',
    path: '/v1/uploads',
    body: capture.CreateUploadBody,
    response: capture.UploadView,
    status: 201,
    policy: uploadSession,
    rateLimit: 'media',
    idempotent: true,
    handler: ({ deps, actor, requestId }, _p, b) =>
      createUpload(deps, actor as AccountActor, b, requestId),
  });

  route(app, {
    method: 'GET',
    path: '/v1/uploads/:id',
    response: capture.UploadView,
    policy: signedIn,
    rateLimit: 'media',
    handler: ({ deps, actor }, p) => getUpload(deps, actor as AccountActor, idOf(p)),
  });

  route(app, {
    method: 'POST',
    path: '/v1/uploads/:id/complete',
    body: capture.CompleteUploadBody,
    response: capture.UploadView,
    policy: uploadSession,
    rateLimit: 'media',
    idempotent: true,
    handler: ({ deps, actor, requestId }, p, b) =>
      completeUpload(deps, actor as AccountActor, idOf(p), b, requestId),
  });

  route(app, {
    method: 'GET',
    path: '/v1/recordings/:id/media',
    response: capture.MediaList,
    policy: signedIn,
    rateLimit: 'read',
    handler: ({ deps, actor }, p) => listRecordingMedia(deps, actor as AccountActor, idOf(p)),
  });
}

/** `/internal/*` on the jobs function: the audio worker (service credentials) and storage triggers. */
export function mediaInternalRoutes(app: Hono<AppEnv>): void {
  registryOf(app).push(
    {
      method: 'POST',
      path: '/internal/audio/claim',
      policy: 'service',
      publicReason: 'audio worker: AUDIO_WORKER_KEYS bearer',
      rateLimit: 'write',
      idempotent: false,
    },
    {
      method: 'POST',
      path: '/internal/audio/:jobId/result',
      policy: 'service',
      publicReason: 'audio worker: per-job token, single use',
      rateLimit: 'write',
      idempotent: false,
    },
  );

  app.post('/internal/audio/claim', async (c) =>
    c.json(await claimAudioJob(c.get('deps'), c.req.header('authorization'))),
  );

  app.post('/internal/audio/:jobId/result', async (c) => {
    const jobId = Number(c.req.param('jobId'));
    if (!Number.isSafeInteger(jobId) || jobId <= 0) throw problem('worker.job_not_found', 404);
    const parsed = AudioResultBody.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) throw new DomainError('http.validation_failed', 400);
    return c.json(
      await recordAudioResult(c.get('deps'), jobId, c.req.header('authorization'), parsed.data),
    );
  });

  triggerRoute(
    app,
    '/internal/storage/object-created',
    'reconcile a new object in media-uploads or consent-evidence',
    async (deps, d) => {
      if (d.type !== 'storage_object_created') return { skipped: 'not a storage event' };
      return { outcome: await onObjectCreated(deps, d.data.bucketName, d.data.objectKey) };
    },
  );

  triggerRoute(
    app,
    '/internal/consent/sla-check',
    'revocation SLA monitor (INV-7): unservable objects must be gone within 15 min',
    async (deps) => revocationSlaCheck(deps),
  );

  triggerRoute(
    app,
    '/internal/media/sweep',
    'abandon uploads idle for more than 7 days (lifecycle is not enforced, ADR-032)',
    async (deps) => ({
      abandoned: await sweepStaleUploads(deps),
    }),
  );
}
