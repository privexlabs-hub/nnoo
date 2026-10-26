/**
 * Who is acting. Built per request from a verified token plus role grants loaded from
 * the database — never from client-supplied ids or role fields (06 §2).
 */
export type RoleKind =
  'learner' | 'kin' | 'facilitator' | 'custodian' | 'organiser' | 'moderator' | 'operator';
export type RoleGrant = {
  role: RoleKind;
  scopeType: 'global' | 'hometown';
  scopeId: string | null;
};

export type AccountActor = {
  kind: 'account';
  id: string;
  sessionId: string;
  status: 'active' | 'suspended' | 'erased';
  ageBand: 'under_13' | 'age_13_17' | 'adult' | null;
  identityLevel: 'none' | 'basic' | 'in_person';
  accountCreatedAt: Date;
  /** Authentication methods of this session, e.g. ['otp'] or ['passkey'] (step-up checks). */
  amr: readonly string[];
  roles: readonly RoleGrant[];
};

export type AnonymousActor = { kind: 'anonymous' };
export type Actor = AccountActor | AnonymousActor;

export const ANONYMOUS: AnonymousActor = Object.freeze({ kind: 'anonymous' });

export function hasRole(actor: Actor, role: RoleKind, scopeId?: string): boolean {
  if (actor.kind !== 'account') return false;
  return actor.roles.some(
    (g) =>
      g.role === role &&
      (scopeId === undefined ? true : g.scopeType === 'global' || g.scopeId === scopeId),
  );
}
