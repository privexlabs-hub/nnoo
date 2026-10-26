import type { Actor } from '../../../platform/actor.ts';
import {
  ALLOW,
  definePolicy,
  deny,
  isFacilitatorOf,
  requireActiveAccount,
  requireStepUp,
  type Decision,
} from '../../../platform/policy.ts';
import { isOpenForCapture, type RecordingStatus } from './recording.ts';

/** Route-level precondition for capture routes: an active, step-up session. */
export const captureSession = definePolicy({
  action: 'archive.capture.session',
  description: 'A signed-in, active account using a passkey session (step-up, 07 §1).',
  rule: (actor) => requireStepUp(actor),
});

function facilitatorWithStepUp(actor: Actor, hometownId: string): Decision {
  const base = requireStepUp(actor);
  if (!base.allow) return base;
  return isFacilitatorOf(actor, hometownId) ? ALLOW : deny('authz.denied');
}

export const createElder = definePolicy<{ hometownId: string }>({
  action: 'archive.elder.create',
  description: "A facilitator of the elder's hometown, in a passkey session.",
  rule: (actor, r) => facilitatorWithStepUp(actor, r.hometownId),
});

export const createRecording = definePolicy<{ hometownId: string }>({
  action: 'archive.recording.create',
  description: "A facilitator of the recording's hometown, in a passkey session.",
  rule: (actor, r) => facilitatorWithStepUp(actor, r.hometownId),
});

type OwnRecording = { facilitatorId: string; status: RecordingStatus };

export const readOwnRecording = definePolicy<OwnRecording>({
  action: 'archive.recording.read_own',
  description: 'The facilitator who recorded it.',
  rule: (actor, r) => {
    const base = requireActiveAccount(actor);
    if (!base.allow || actor.kind !== 'account') return base;
    return actor.id === r.facilitatorId ? ALLOW : deny('archive.recording_not_found', 403);
  },
});

export const editOwnRecording = definePolicy<OwnRecording>({
  action: 'archive.recording.edit_own',
  description:
    'The facilitator who recorded it, in a passkey session, while it is draft or returned.',
  rule: (actor, r) => {
    const base = requireStepUp(actor);
    if (!base.allow || actor.kind !== 'account') return base;
    if (actor.id !== r.facilitatorId) return deny('archive.recording_not_found', 403);
    return isOpenForCapture(r.status) ? ALLOW : deny('archive.invalid_transition');
  },
});

export const listOwnRecordings = definePolicy({
  action: 'archive.recording.list_own',
  description: 'A signed-in, active account; results are scoped to recordings they facilitated.',
  rule: (actor) => requireActiveAccount(actor),
});
