import type { Hono } from 'hono';
import { z } from 'zod';
import { capture } from '@nnoo/contracts';
import type { AccountActor } from '../../../platform/actor.ts';
import type { AppEnv } from '../../../platform/app-env.ts';
import { definePolicy, requireActiveAccount, requireStepUp } from '../../../platform/policy.ts';
import { problem } from '../../../platform/problem.ts';
import { route } from '../../../platform/route.ts';
import {
  captureFirstConsent,
  changeConsentTerms,
  listConsents,
  revokeConsent,
} from '../application/consent.ts';

const consentSession = definePolicy({
  action: 'consent.session',
  description:
    'A signed-in, active account in a passkey session (07 §1); who may act is decided per recording.',
  rule: (actor) => requireStepUp(actor),
});
const signedIn = definePolicy({
  action: 'consent.read.session',
  description: 'A signed-in, active account; the recording-level rule follows.',
  rule: (actor) => requireActiveAccount(actor),
});
const idOf = (p: Record<string, string>) => {
  const r = z.uuid().safeParse(p.id);
  if (!r.success) throw problem('archive.recording_not_found', 404);
  return r.data;
};

export function consentRoutes(app: Hono<AppEnv>): void {
  route(app, {
    method: 'POST',
    path: '/v1/consents',
    body: capture.CaptureConsentBody,
    response: capture.ConsentView,
    status: 201,
    policy: consentSession,
    rateLimit: 'write',
    idempotent: true,
    handler: ({ deps, actor, requestId }, _p, b) =>
      captureFirstConsent(deps, actor as AccountActor, b, requestId),
  });

  route(app, {
    method: 'GET',
    path: '/v1/recordings/:id/consents',
    response: capture.ConsentList,
    policy: signedIn,
    rateLimit: 'read',
    handler: ({ deps, actor }, p) => listConsents(deps, actor as AccountActor, idOf(p)),
  });

  route(app, {
    method: 'POST',
    path: '/v1/recordings/:id/consents',
    body: capture.ChangeConsentBody,
    response: capture.ConsentView,
    status: 201,
    policy: consentSession,
    rateLimit: 'write',
    idempotent: true,
    handler: ({ deps, actor, requestId }, p, b) =>
      changeConsentTerms(deps, actor as AccountActor, idOf(p), b, requestId),
  });

  route(app, {
    method: 'POST',
    path: '/v1/recordings/:id/consents/revoke',
    body: capture.RevokeConsentBody,
    response: capture.ConsentView,
    policy: consentSession,
    rateLimit: 'write',
    idempotent: true,
    handler: ({ deps, actor, requestId }, p, b) =>
      revokeConsent(deps, actor as AccountActor, idOf(p), b, requestId),
  });
}
