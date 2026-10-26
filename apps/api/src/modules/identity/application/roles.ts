import { uuidv7 } from 'uuidv7';
import * as audit from '../../audit/public.ts';
import type { Tx } from '../../../platform/db.ts';
import { roleGrant } from '../infrastructure/schema.ts';

export type GrantRole = {
  accountId: string;
  role: 'kin' | 'facilitator' | 'custodian' | 'organiser';
  scope: { type: 'hometown'; id: string };
  /** 'panel:<id>' (two custodian sign-offs) or 'governance:<event id>'. Never an admin action. */
  grantedVia: `panel:${string}` | `governance:${string}`;
  requestId?: string | null;
};

/**
 * The only way a role is granted (06 §2): always in the caller's transaction, always audited,
 * and checked again by database triggers (role_grant_*). Idempotent per active grant.
 */
export async function grantRole(tx: Tx, g: GrantRole): Promise<boolean> {
  const inserted = await tx
    .insert(roleGrant)
    .values({
      id: uuidv7(),
      accountId: g.accountId,
      role: g.role,
      scopeType: g.scope.type,
      scopeId: g.scope.id,
      grantedVia: g.grantedVia,
    })
    .onConflictDoNothing()
    .returning({ id: roleGrant.id });
  if (inserted.length > 0) {
    await audit.record(tx, {
      actorId: null,
      action: 'identity.role_granted',
      resourceType: 'account',
      resourceId: g.accountId,
      detail: { role: g.role, scopeId: g.scope.id, grantedVia: g.grantedVia },
      requestId: g.requestId ?? null,
    });
  }
  return inserted.length > 0;
}
