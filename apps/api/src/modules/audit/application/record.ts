import type { Tx } from '../../../platform/db.ts';
import { auditLog } from '../infrastructure/schema.manual.ts';

export type AuditEntry = {
  actorId: string | null;
  actorRole?: string | null;
  /** `<module>.<verb>`, e.g. 'identity.session_created'. */
  action: string;
  resourceType: string;
  resourceId?: string | null;
  /** Identifiers and reason categories only: never personal data, tokens or free text. */
  detail?: Record<string, unknown>;
  requestId?: string | null;
};

/** Append-only (INV-11). Always called with the transaction that made the change. */
export async function record(tx: Tx, e: AuditEntry): Promise<void> {
  await tx.insert(auditLog).values({
    actorId: e.actorId,
    actorRole: e.actorRole ?? null,
    action: e.action,
    resourceType: e.resourceType,
    resourceId: e.resourceId ?? null,
    detail: e.detail ?? null,
    requestId: e.requestId ?? null,
  });
}
