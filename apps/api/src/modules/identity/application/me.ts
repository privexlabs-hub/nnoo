import { eq } from 'drizzle-orm';
import type { identity } from '@nnoo/contracts';
import * as audit from '../../audit/public.ts';
import type { AccountActor } from '../../../platform/actor.ts';
import type { Clock } from '../../../platform/clock.ts';
import { inTransaction, type Db } from '../../../platform/db.ts';
import { can } from '../../../platform/policy.ts';
import { problem } from '../../../platform/problem.ts';
import {
  applyAsFacilitator,
  ikpeVoterBaseline,
  ohaPosterBaseline,
  updateMe as updateMePolicy,
} from '../domain/policies.ts';
import { account } from '../infrastructure/schema.ts';

type Deps = { db: Db; clock: Clock };

function capabilities(actor: AccountActor, clock: Clock) {
  const ctx = { clock };
  return {
    canEditProfile: can(actor, updateMePolicy, undefined, ctx),
    canVoteInIkpe: can(actor, ikpeVoterBaseline, undefined, ctx),
    canPostInOha: can(actor, ohaPosterBaseline, undefined, ctx),
    canApplyAsFacilitator: can(actor, applyAsFacilitator, undefined, ctx),
  };
}

export async function getMe({ db, clock }: Deps, actor: AccountActor): Promise<identity.MeView> {
  // Scoped by the verified actor id: there is no way to ask for someone else's profile here.
  const [row] = await db.select().from(account).where(eq(account.id, actor.id));
  if (!row) throw problem('auth.token_invalid', 401);
  return {
    id: row.id,
    displayName: row.displayName,
    uiLocale: row.uiLocale,
    ageBand: row.ageBand,
    identityLevel: row.identityLevel,
    capabilities: capabilities(actor, clock),
  };
}

export async function updateMe(
  deps: Deps,
  actor: AccountActor,
  body: identity.UpdateMeBody,
  requestId: string,
) {
  await inTransaction(deps.db, { actorId: actor.id, requestId }, async (tx) => {
    await tx
      .update(account)
      .set({
        ...(body.displayName !== undefined ? { displayName: body.displayName } : {}),
        ...(body.uiLocale !== undefined ? { uiLocale: body.uiLocale } : {}),
      })
      .where(eq(account.id, actor.id));
    await audit.record(tx, {
      actorId: actor.id,
      action: 'identity.profile_updated',
      resourceType: 'account',
      resourceId: actor.id,
      detail: { fields: Object.keys(body) },
      requestId,
    });
  });
  return getMe(deps, actor);
}
