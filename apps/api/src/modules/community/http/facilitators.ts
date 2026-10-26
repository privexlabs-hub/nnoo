import type { Hono } from 'hono';
import { z } from 'zod';
import type { AccountActor } from '../../../platform/actor.ts';
import type { AppEnv } from '../../../platform/app-env.ts';
import { definePolicy, requireActiveAccount, requireStepUp } from '../../../platform/policy.ts';
import { problem } from '../../../platform/problem.ts';
import { route } from '../../../platform/route.ts';
import { apply, ApplicationView, completeTraining, signOff } from '../application/facilitators.ts';

const signedIn = definePolicy({
  action: 'community.session',
  description: 'A signed-in, active account.',
  rule: (a) => requireActiveAccount(a),
});
const stepUp = definePolicy({
  action: 'community.session.step_up',
  description: 'A signed-in, active account in a passkey session.',
  rule: (a) => requireStepUp(a),
});
const idOf = (p: Record<string, string>) => {
  const r = z.uuid().safeParse(p.id);
  if (!r.success) throw problem('community.application_not_found', 404);
  return r.data;
};

export function facilitatorRoutes(app: Hono<AppEnv>): void {
  route(app, {
    method: 'POST',
    path: '/v1/facilitator-applications',
    body: z.object({ id: z.uuid(), hometownId: z.uuid() }).strict(),
    response: ApplicationView,
    status: 201,
    policy: signedIn,
    rateLimit: 'write',
    idempotent: true,
    handler: ({ deps, actor, requestId }, _p, b) =>
      apply(deps, actor as AccountActor, b, requestId),
  });
  route(app, {
    method: 'POST',
    path: '/v1/facilitator-applications/:id/training-complete',
    response: ApplicationView,
    policy: signedIn,
    rateLimit: 'write',
    idempotent: true,
    handler: ({ deps, actor, requestId }, p) =>
      completeTraining(deps, actor as AccountActor, idOf(p), requestId),
  });
  route(app, {
    method: 'POST',
    path: '/v1/facilitator-applications/:id/signoffs',
    response: ApplicationView,
    policy: stepUp,
    rateLimit: 'write',
    idempotent: true,
    handler: ({ deps, actor, requestId }, p) =>
      signOff(deps, actor as AccountActor, idOf(p), requestId),
  });
}
