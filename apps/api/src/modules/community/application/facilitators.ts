import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import * as audit from '../../audit/public.ts';
import * as identity from '../../identity/public.ts';
import type { AccountActor } from '../../../platform/actor.ts';
import type { Clock } from '../../../platform/clock.ts';
import { inTransaction, type Db } from '../../../platform/db.ts';
import { DomainError, problem } from '../../../platform/problem.ts';
import {
  applyToFacilitate,
  signOffFacilitator,
  SIGNOFFS_REQUIRED,
} from '../domain/facilitators.ts';
import { facilitatorApplication, facilitatorSignoff, hometown } from '../infrastructure/schema.ts';

type Deps = { db: Db; clock: Clock; actors: { invalidate: (id: string) => void } };

export const ApplicationView = z.object({
  id: z.uuid(),
  hometownId: z.uuid(),
  status: z.enum(['pending', 'approved', 'withdrawn']),
  trainingCompleted: z.boolean(),
  signoffs: z.number(),
  signoffsRequired: z.number(),
});
export type ApplicationView = z.infer<typeof ApplicationView>;

type App = typeof facilitatorApplication.$inferSelect;
const view = (a: App, signoffs: number): ApplicationView => ({
  id: a.id,
  hometownId: a.hometownId,
  status: a.status as ApplicationView['status'],
  trainingCompleted: a.trainingCompletedAt !== null,
  signoffs,
  signoffsRequired: SIGNOFFS_REQUIRED,
});

async function signoffCount(db: Db | Parameters<Parameters<Db['transaction']>[0]>[0], id: string) {
  const [r] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(facilitatorSignoff)
    .where(eq(facilitatorSignoff.applicationId, id));
  return r?.n ?? 0;
}

/** Become a facilitator (F-01): apply from You, complete training, then two custodians sign off. */
export async function apply(
  deps: Deps,
  actor: AccountActor,
  b: { id: string; hometownId: string },
  requestId: string,
): Promise<ApplicationView> {
  const d = applyToFacilitate.rule(actor, { hometownId: b.hometownId }, deps);
  if (!d.allow) throw new DomainError(d.code, d.status);
  return inTransaction(deps.db, { actorId: actor.id, requestId }, async (tx) => {
    const [h] = await tx
      .select({ id: hometown.id })
      .from(hometown)
      .where(eq(hometown.id, b.hometownId));
    if (!h) throw problem('community.hometown_not_found', 422);
    const inserted = await tx
      .insert(facilitatorApplication)
      .values({ id: b.id, accountId: actor.id, hometownId: b.hometownId })
      .onConflictDoNothing()
      .returning();
    if (!inserted[0]) throw problem('community.application_exists', 409);
    await audit.record(tx, {
      actorId: actor.id,
      action: 'community.facilitator_applied',
      resourceType: 'facilitator_application',
      resourceId: b.id,
      detail: { hometownId: b.hometownId },
      requestId,
    });
    return view(inserted[0], 0);
  });
}

/** Training is completed in the facilitator app (consent, recording, cultural protocol). Self-attested; custodians verify in person. */
export async function completeTraining(
  deps: Deps,
  actor: AccountActor,
  id: string,
  requestId: string,
): Promise<ApplicationView> {
  return inTransaction(deps.db, { actorId: actor.id, requestId }, async (tx) => {
    const [a] = await tx
      .update(facilitatorApplication)
      .set({ trainingCompletedAt: deps.clock.now() })
      .where(
        and(
          eq(facilitatorApplication.id, id),
          eq(facilitatorApplication.accountId, actor.id),
          eq(facilitatorApplication.status, 'pending'),
        ),
      )
      .returning();
    if (!a) throw problem('community.application_not_found', 404);
    return view(a, await signoffCount(tx, id));
  });
}

/** A custodian signs off. The second distinct sign-off grants the role in the same transaction. */
export async function signOff(
  deps: Deps,
  actor: AccountActor,
  id: string,
  requestId: string,
): Promise<ApplicationView> {
  const result = await inTransaction(deps.db, { actorId: actor.id, requestId }, async (tx) => {
    const [a] = await tx
      .select()
      .from(facilitatorApplication)
      .where(eq(facilitatorApplication.id, id))
      .for('update');
    if (!a) throw problem('community.application_not_found', 404);
    const d = signOffFacilitator.rule(
      actor,
      {
        hometownId: a.hometownId,
        applicantId: a.accountId,
        trainingCompleted: a.trainingCompletedAt !== null,
        status: a.status,
      },
      deps,
    );
    if (!d.allow) throw new DomainError(d.code, d.status);
    await tx
      .insert(facilitatorSignoff)
      .values({ applicationId: id, custodianId: actor.id })
      .onConflictDoNothing();
    await audit.record(tx, {
      actorId: actor.id,
      action: 'community.facilitator_signed_off',
      resourceType: 'facilitator_application',
      resourceId: id,
      requestId,
    });
    const n = await signoffCount(tx, id);
    if (n >= SIGNOFFS_REQUIRED) {
      await identity.grantRole(tx, {
        accountId: a.accountId,
        role: 'facilitator',
        scope: { type: 'hometown', id: a.hometownId },
        grantedVia: `panel:${id}`,
        requestId,
      });
      const [u] = await tx
        .update(facilitatorApplication)
        .set({ status: 'approved', decidedAt: deps.clock.now() })
        .where(eq(facilitatorApplication.id, id))
        .returning();
      return { app: u!, n, granted: a.accountId };
    }
    return { app: a, n, granted: null };
  });
  if (result.granted) deps.actors.invalidate(result.granted);
  return view(result.app, result.n);
}
