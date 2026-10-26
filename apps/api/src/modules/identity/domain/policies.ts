import { ALLOW, definePolicy, deny, requireActiveAccount } from '../../../platform/policy.ts';

export const readMe = definePolicy({
  action: 'identity.me.read',
  description: 'A signed-in, active account may read its own profile.',
  rule: (actor) => requireActiveAccount(actor),
});

export const updateMe = definePolicy({
  action: 'identity.me.update',
  description: 'A signed-in, active account may edit its own display name and UI locale.',
  rule: (actor) => requireActiveAccount(actor),
});

export const endSession = definePolicy({
  action: 'identity.session.delete',
  description: 'A signed-in account may sign out its current session.',
  rule: (actor) => (actor.kind === 'account' ? ALLOW : deny('auth.unauthenticated', 401)),
});

/**
 * Ikpe voting needs 01 §6 eligibility plus the Brief's 18+ rule. Phase 0 exposes only
 * the actor-level part as a capability; case-level checks arrive with the ikpe module.
 */
export const IKPE_MIN_ACCOUNT_AGE_DAYS = 7;
export const ikpeVoterBaseline = definePolicy({
  action: 'ikpe.vote.baseline',
  description:
    'Adult, phone/email verified (identity ≥ basic), account at least 7 days old, active.',
  rule: (actor, _r: void, { clock }) => {
    const base = requireActiveAccount(actor);
    if (!base.allow || actor.kind !== 'account') return base;
    if (actor.ageBand !== 'adult') return deny('authz.denied');
    if (actor.identityLevel === 'none') return deny('authz.denied');
    const ageMs = clock.now().getTime() - actor.accountCreatedAt.getTime();
    if (ageMs < IKPE_MIN_ACCOUNT_AGE_DAYS * 86_400_000) return deny('authz.denied');
    return ALLOW;
  },
});

/** Minors (and unknown age) never post in Ọha (01 §3, Brief §21). */
export const ohaPosterBaseline = definePolicy({
  action: 'oha.post.baseline',
  description: 'Adult, active account.',
  rule: (actor) => {
    const base = requireActiveAccount(actor);
    if (!base.allow || actor.kind !== 'account') return base;
    return actor.ageBand === 'adult' ? ALLOW : deny('authz.denied');
  },
});

export const applyAsFacilitator = definePolicy({
  action: 'facilitator.apply',
  description: 'Adult, active account that is not already a facilitator.',
  rule: (actor) => {
    const base = requireActiveAccount(actor);
    if (!base.allow || actor.kind !== 'account') return base;
    if (actor.ageBand !== 'adult') return deny('authz.denied');
    return actor.roles.some((r) => r.role === 'facilitator') ? deny('authz.denied') : ALLOW;
  },
});
