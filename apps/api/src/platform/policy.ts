import type { ErrorCode } from '@nnoo/contracts';
import type { Actor } from './actor.ts';
import type { Clock } from './clock.ts';

/**
 * Policy engine (06 §3): can(actor, action, resource, context) → allow | deny(code).
 * Rules are pure. Resource-dependent rules are evaluated inside use cases after the
 * resource is loaded with a scope predicate; the router runs the actor-level part.
 */
export type Decision = { allow: true } | { allow: false; code: ErrorCode; status: 401 | 403 };
export const ALLOW: Decision = { allow: true };
export const deny = (code: ErrorCode, status: 401 | 403 = 403): Decision => ({
  allow: false,
  code,
  status,
});

export type PolicyContext = { clock: Clock };

export type Policy<R = void> = {
  /** e.g. 'identity.me.read' — appears in the route registry and the authz matrix. */
  action: string;
  /** Plain-language rule, reviewed like a business rule. */
  description: string;
  rule: (actor: Actor, resource: R, ctx: PolicyContext) => Decision;
};

export const definePolicy = <R = void>(p: Policy<R>): Policy<R> => p;

export function can<R>(actor: Actor, policy: Policy<R>, resource: R, ctx: PolicyContext): boolean {
  return policy.rule(actor, resource, ctx).allow;
}

/** Common precondition: a signed-in, active account. */
export function requireActiveAccount(actor: Actor): Decision {
  if (actor.kind !== 'account') return deny('auth.unauthenticated', 401);
  if (actor.status !== 'active') return deny('identity.suspended');
  return ALLOW;
}

/** Step-up (07 §1): facilitator capture, consent changes and panel decisions need a passkey session. */
export function requireStepUp(actor: Actor): Decision {
  const base = requireActiveAccount(actor);
  if (!base.allow || actor.kind !== 'account') return base;
  return actor.amr.includes('passkey') ? ALLOW : deny('identity.step_up_required', 401);
}

/** Holds an active facilitator grant for this hometown. */
export function isFacilitatorOf(actor: Actor, hometownId: string): boolean {
  return (
    actor.kind === 'account' &&
    actor.roles.some(
      (r) => r.role === 'facilitator' && r.scopeType === 'hometown' && r.scopeId === hometownId,
    )
  );
}

export function isCustodianOf(actor: Actor, hometownId: string): boolean {
  return (
    actor.kind === 'account' &&
    actor.roles.some(
      (r) => r.role === 'custodian' && r.scopeType === 'hometown' && r.scopeId === hometownId,
    )
  );
}
