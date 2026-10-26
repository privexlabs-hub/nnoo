import type { Hono } from 'hono';
import { z } from 'zod';
import { capture } from '@nnoo/contracts';
import type { AccountActor } from '../../../platform/actor.ts';
import type { AppEnv } from '../../../platform/app-env.ts';
import { route } from '../../../platform/route.ts';
import {
  addNote,
  createElder,
  createRecording,
  discardRecording,
  getRecording,
  listMyRecordings,
} from '../application/recordings.ts';
import { captureSession, listOwnRecordings } from '../domain/policies.ts';
import { problem } from '../../../platform/problem.ts';

const IdParam = z.object({ id: z.uuid() });
/** A malformed id can never exist: answer 404, like a missing one. */
const idOf = (p: Record<string, string>) => {
  const r = IdParam.safeParse(p);
  if (!r.success) throw problem('archive.recording_not_found', 404);
  return r.data.id;
};

export function archiveRoutes(app: Hono<AppEnv>): void {
  route(app, {
    method: 'POST',
    path: '/v1/elders',
    body: capture.CreateElderBody,
    response: capture.ElderView,
    status: 201,
    policy: captureSession,
    rateLimit: 'write',
    idempotent: true, // offline replay: the client's UUIDv7 is the Idempotency-Key (04 §5)
    handler: ({ deps, actor, requestId }, _p, b) =>
      createElder(deps, actor as AccountActor, b, requestId),
  });

  route(app, {
    method: 'POST',
    path: '/v1/recordings',
    body: capture.CreateRecordingBody,
    response: capture.RecordingView,
    status: 201,
    policy: captureSession,
    rateLimit: 'write',
    idempotent: true,
    handler: ({ deps, actor, requestId }, _p, b) =>
      createRecording(deps, actor as AccountActor, b, requestId),
  });

  route(app, {
    method: 'GET',
    path: '/v1/recordings',
    query: capture.RecordingListQuery,
    response: capture.RecordingList,
    policy: listOwnRecordings,
    rateLimit: 'read',
    handler: ({ deps, actor }, _p, _b, q) => listMyRecordings(deps, actor as AccountActor, q),
  });

  route(app, {
    method: 'GET',
    path: '/v1/recordings/:id',
    response: capture.RecordingView,
    policy: listOwnRecordings,
    rateLimit: 'read',
    handler: ({ deps, actor }, p) => getRecording(deps, actor as AccountActor, idOf(p)),
  });

  route(app, {
    method: 'POST',
    path: '/v1/recordings/:id/discard',
    response: capture.RecordingView,
    policy: captureSession,
    rateLimit: 'write',
    idempotent: true,
    handler: ({ deps, actor, requestId }, p) =>
      discardRecording(deps, actor as AccountActor, idOf(p), requestId),
  });

  route(app, {
    method: 'POST',
    path: '/v1/recordings/:id/notes',
    body: capture.AddNoteBody,
    response: capture.NoteView,
    status: 201,
    policy: captureSession,
    rateLimit: 'write',
    idempotent: true,
    handler: ({ deps, actor, requestId }, p, b) =>
      addNote(deps, actor as AccountActor, idOf(p), b, requestId),
  });
}
