import {
  ALLOW,
  definePolicy,
  deny,
  isCustodianOf,
  isFacilitatorOf,
  requireActiveAccount,
  requireStepUp,
} from '../../../platform/policy.ts';

/** Two distinct custodians of the hometown sign off a trained applicant (01 §3). */
export const SIGNOFFS_REQUIRED = 2;

export const applyToFacilitate = definePolicy<{ hometownId: string }>({
  action: 'community.facilitator.apply',
  description: 'An adult, active account that is not yet a facilitator of that hometown.',
  rule: (actor, r) => {
    const base = requireActiveAccount(actor);
    if (!base.allow || actor.kind !== 'account') return base;
    if (actor.ageBand !== 'adult') return deny('authz.denied');
    return isFacilitatorOf(actor, r.hometownId) ? deny('community.application_exists') : ALLOW;
  },
});

export const signOffFacilitator = definePolicy<{
  hometownId: string;
  applicantId: string;
  trainingCompleted: boolean;
  status: string;
}>({
  action: 'community.facilitator.signoff',
  description:
    'A custodian of the hometown, in a passkey session, for a pending, trained applicant who is not themselves.',
  rule: (actor, r) => {
    const base = requireStepUp(actor);
    if (!base.allow || actor.kind !== 'account') return base;
    if (!isCustodianOf(actor, r.hometownId)) return deny('authz.denied');
    if (actor.id === r.applicantId) return deny('community.signoff_not_allowed');
    if (r.status !== 'pending' || !r.trainingCompleted)
      return deny('community.signoff_not_allowed');
    return ALLOW;
  },
});
