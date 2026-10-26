import {
  ALLOW,
  definePolicy,
  deny,
  isFacilitatorOf,
  requireActiveAccount,
  requireStepUp,
} from '../../../platform/policy.ts';

type RecordingRef = { facilitatorId: string; hometownId: string; status: string };

export const captureConsent = definePolicy<{ recording: RecordingRef }>({
  action: 'consent.capture',
  description:
    "The recording's facilitator (a facilitator of its hometown), in a passkey session, while the recording is a draft.",
  rule: (actor, { recording }) => {
    const base = requireStepUp(actor);
    if (!base.allow || actor.kind !== 'account') return base;
    if (actor.id !== recording.facilitatorId || !isFacilitatorOf(actor, recording.hometownId))
      return deny('authz.denied');
    return recording.status === 'draft' ? ALLOW : deny('archive.invalid_transition');
  },
});

export type ConsentChangeResource = {
  recording: RecordingRef;
  stewardAccountId: string | null;
  /** A new spoken statement from the elder, uploaded for this recording. */
  hasNewEvidence: boolean;
  kind: 'narrowing' | 'withdrawal' | 'widening';
  /** Widening only: the steward is within the elder's pre-authorisation. */
  stewardWithinPreAuthorisation?: boolean;
  /** Elder deceased without a steward: consent can only narrow. */
  frozen: boolean;
};

/**
 * Who may change consent (approved 2026-10-25, docs/plans/phase-1 §5). Narrowing and withdrawal:
 * any facilitator of the hometown (not necessarily the original, 06 §8) with a new spoken
 * statement, or the steward. Widening: a facilitator with the elder present (new statement), or
 * the steward within the pre-authorisation. Custodian panels arrive in Phase 2.
 */
export const changeConsent = definePolicy<ConsentChangeResource>({
  action: 'consent.change',
  description:
    'Narrow/withdraw: a hometown facilitator with new evidence, or the steward. Widen: facilitator with the elder present, or steward within pre-authorisation.',
  rule: (actor, r) => {
    const base = requireStepUp(actor);
    if (!base.allow || actor.kind !== 'account') return base;
    const isSteward = r.stewardAccountId !== null && actor.id === r.stewardAccountId;
    const facilitatorWithElder = isFacilitatorOf(actor, r.recording.hometownId) && r.hasNewEvidence;

    if (r.kind === 'widening') {
      if (r.frozen) return deny('consent.frozen');
      if (facilitatorWithElder) return ALLOW;
      if (isSteward && r.stewardWithinPreAuthorisation) return ALLOW;
      return isSteward ? deny('consent.widen_not_allowed') : deny('authz.denied');
    }
    if (isSteward || facilitatorWithElder) return ALLOW;
    if (isFacilitatorOf(actor, r.recording.hometownId)) return deny('consent.evidence_required');
    return deny('authz.denied');
  },
});

/** Reading consent terms (not evidence): the recording's facilitator, a hometown facilitator, or the steward. */
export const readConsent = definePolicy<{
  recording: RecordingRef;
  stewardAccountId: string | null;
}>({
  action: 'consent.read',
  description: "The recording's facilitator, any facilitator of its hometown, or the steward.",
  rule: (actor, r) => {
    const base = requireActiveAccount(actor);
    if (!base.allow || actor.kind !== 'account') return base;
    if (actor.id === r.recording.facilitatorId || actor.id === r.stewardAccountId) return ALLOW;
    return isFacilitatorOf(actor, r.recording.hometownId) ? ALLOW : deny('authz.denied');
  },
});
