import { uuidv7 } from 'uuidv7';
import { z } from 'zod';
import * as audit from '../../audit/public.ts';
import * as identity from '../../identity/public.ts';
import { inTransaction, type Db } from '../../../platform/db.ts';
import { DomainError, problem } from '../../../platform/problem.ts';
import { governanceEvent } from '../infrastructure/schema.ts';

/**
 * The interim custodian council (11 §Phase 0, approved 2026-10-25): ≥ 5 people from ≥ 3 hometowns,
 * recorded once per environment, approved by two humans outside the system (the CI environment's
 * required reviewers). After this, custodians and facilitators are only granted by panels.
 */
export const BootstrapInput = z
  .object({
    charter: z.string().min(1).max(200), // e.g. "Charter v0, ratified 2026-…"
    custodians: z
      .array(z.object({ accountId: z.uuid(), hometownId: z.uuid() }).strict())
      .min(5)
      .max(50),
    approvers: z.array(z.string().min(1).max(100)).min(2),
  })
  .strict();
export type BootstrapInput = z.infer<typeof BootstrapInput>;

export function bootstrapProblem(i: BootstrapInput): string | null {
  const people = new Set(i.custodians.map((c) => c.accountId));
  const towns = new Set(i.custodians.map((c) => c.hometownId));
  if (people.size < 5) return 'at least 5 distinct custodians are required';
  if (towns.size < 3) return 'custodians must come from at least 3 hometowns';
  if (new Set(i.approvers).size < 2) return 'two distinct approvers are required';
  return null;
}

export async function bootstrapInterimCouncil(
  db: Db,
  input: BootstrapInput,
): Promise<{ eventId: string; granted: number }> {
  const bad = bootstrapProblem(input);
  if (bad) throw new DomainError('governance.invalid_bootstrap', 422, bad);
  const eventId = uuidv7();
  return inTransaction(db, { requestId: `governance-bootstrap-${eventId}` }, async (tx) => {
    const inserted = await tx
      .insert(governanceEvent)
      .values({
        id: eventId,
        kind: 'interim_council_bootstrap',
        payload: { charter: input.charter, custodians: input.custodians },
        approvals: input.approvers,
      })
      .onConflictDoNothing()
      .returning({ id: governanceEvent.id });
    if (!inserted[0]) throw problem('governance.already_bootstrapped', 409);
    let granted = 0;
    for (const c of input.custodians) {
      if (
        await identity.grantRole(tx, {
          accountId: c.accountId,
          role: 'custodian',
          scope: { type: 'hometown', id: c.hometownId },
          grantedVia: `governance:${eventId}`,
        })
      )
        granted++;
    }
    await audit.record(tx, {
      actorId: null,
      action: 'governance.interim_council_bootstrapped',
      resourceType: 'governance_event',
      resourceId: eventId,
      detail: { custodians: input.custodians.length, approvers: input.approvers },
    });
    return { eventId, granted };
  });
}
