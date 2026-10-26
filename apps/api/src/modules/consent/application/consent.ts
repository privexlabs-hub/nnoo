import { and, asc, eq, isNull } from 'drizzle-orm';
import type { capture } from '@nnoo/contracts';
import * as archive from '../../archive/public.ts';
import * as audit from '../../audit/public.ts';
import type { AccountActor } from '../../../platform/actor.ts';
import { inTransaction, type Tx } from '../../../platform/db.ts';
import type { Deps } from '../../../platform/deps.ts';
import { writeOutbox } from '../../../platform/jobs/queue.ts';
import { DomainError, problem } from '../../../platform/problem.ts';
import { classify, frozen, stewardMayWiden, termsProblem, type Terms } from '../domain/consent.ts';
import { captureConsent, changeConsent, readConsent } from '../domain/policies.ts';
import { consentRecord } from '../infrastructure/schema.ts';

type Row = typeof consentRecord.$inferSelect;
type TermsInput = Pick<capture.CaptureConsentBody, 'tier' | 'umunnaScope' | 'permissions'>;

function toTerms(b: TermsInput): Terms {
  return {
    tier: b.tier,
    umunnaScope: b.tier === 'umunna' ? (b.umunnaScope ?? null) : (b.umunnaScope ?? null),
    allowArchive: b.permissions.archive,
    allowLessons: b.permissions.lessons,
    allowSocial: b.permissions.social,
    allowPhoto: b.permissions.photo,
    allowMachineAssist: b.permissions.machineAssist,
  };
}
const rowTerms = (r: Row): Terms => ({
  tier: r.tier,
  umunnaScope: r.umunnaScope,
  allowArchive: r.allowArchive,
  allowLessons: r.allowLessons,
  allowSocial: r.allowSocial,
  allowPhoto: r.allowPhoto,
  allowMachineAssist: r.allowMachineAssist,
});

function view(r: Row): capture.ConsentView {
  return {
    id: r.id,
    recordingId: r.recordingId,
    version: r.version,
    tier: r.tier,
    umunnaScope: r.umunnaScope,
    permissions: {
      archive: r.allowArchive,
      lessons: r.allowLessons,
      social: r.allowSocial,
      photo: r.allowPhoto,
      machineAssist: r.allowMachineAssist,
    },
    stewardMayWidenTo: r.stewardMayWidenTo,
    witnessName: r.witnessName,
    capturedAt: r.capturedAt.toISOString(),
    active: r.endedAt === null,
    endReason: r.endReason,
  };
}

function assertTerms(t: Terms) {
  const p = termsProblem(t);
  if (p) throw new DomainError('consent.invalid_terms', 422, p);
}

async function lockRecording(tx: Tx, recordingId: string) {
  const rec = await archive.lockRecordingForConsent(tx, recordingId);
  if (!rec) throw problem('archive.recording_not_found', 404);
  return rec;
}

async function activeConsent(tx: Tx, recordingId: string) {
  const [c] = await tx
    .select()
    .from(consentRecord)
    .where(and(eq(consentRecord.recordingId, recordingId), isNull(consentRecord.endedAt)))
    .for('update');
  return c ?? null;
}

/** First consent for a recording, captured before any session audio (01 §8, 05 §3). */
export async function captureFirstConsent(
  deps: Deps,
  actor: AccountActor,
  b: capture.CaptureConsentBody,
  requestId: string,
): Promise<capture.ConsentView> {
  const terms = toTerms(b);
  assertTerms(terms);
  return inTransaction(deps.db, { actorId: actor.id, requestId }, async (tx) => {
    const rec = await lockRecording(tx, b.recordingId);
    const d = captureConsent.rule(actor, { recording: rec }, deps);
    if (!d.allow) throw new DomainError(d.code, d.status);

    const [existing] = await tx.select().from(consentRecord).where(eq(consentRecord.id, b.id));
    if (existing) {
      if (existing.recordingId === b.recordingId && existing.capturedBy === actor.id)
        return view(existing); // replay
      throw problem('consent.already_captured', 409);
    }
    if (await activeConsent(tx, b.recordingId)) throw problem('consent.already_captured', 409);

    // consent_version_guard checks the version and that the evidence is this recording's uploaded,
    // unused spoken statement; recording.tier follows by trigger.
    const [row] = await tx
      .insert(consentRecord)
      .values({
        id: b.id,
        recordingId: b.recordingId,
        version: 1,
        tier: terms.tier,
        umunnaScope: terms.umunnaScope ? [...terms.umunnaScope] : null,
        allowArchive: terms.allowArchive,
        allowLessons: terms.allowLessons,
        allowSocial: terms.allowSocial,
        allowPhoto: terms.allowPhoto,
        allowMachineAssist: terms.allowMachineAssist,
        stewardMayWidenTo: b.stewardMayWidenTo ?? null,
        witnessName: b.witnessName ?? null,
        evidenceMediaId: b.evidenceMediaId,
        signatureMediaId: b.signatureMediaId ?? null,
        capturedBy: actor.id,
        capturedAt: new Date(b.capturedAt),
      })
      .returning();
    await writeOutbox(tx, 'ConsentCaptured', b.recordingId, {
      recordingId: b.recordingId,
      consentId: b.id,
    });
    await audit.record(tx, {
      actorId: actor.id,
      action: 'consent.captured',
      resourceType: 'consent_record',
      resourceId: b.id,
      detail: { recordingId: b.recordingId, tier: terms.tier, version: 1 },
      requestId,
    });
    return view(row!);
  });
}

/**
 * A new consent version (narrowing, widening or amending), effective immediately (01 §8).
 * Narrowing to Nsọ makes all audio unservable in the same transaction (DB trigger).
 */
export async function changeConsentTerms(
  deps: Deps,
  actor: AccountActor,
  recordingId: string,
  b: capture.ChangeConsentBody,
  requestId: string,
): Promise<capture.ConsentView> {
  const next = toTerms(b);
  assertTerms(next);
  const result = await inTransaction(deps.db, { actorId: actor.id, requestId }, async (tx) => {
    const rec = await lockRecording(tx, recordingId);
    const [replay] = await tx.select().from(consentRecord).where(eq(consentRecord.id, b.id));
    if (replay) {
      if (replay.recordingId === recordingId && replay.capturedBy === actor.id)
        return { row: replay, event: null };
      throw problem('consent.already_captured', 409);
    }
    const current = await activeConsent(tx, recordingId);
    if (!current) throw problem('consent.not_active', 409);

    const change = classify(rowTerms(current), next);
    if (change === 'same') throw problem('consent.no_change', 409);
    const kind = change === 'widening' ? 'widening' : 'narrowing';
    const d = changeConsent.rule(
      actor,
      {
        recording: rec,
        stewardAccountId: rec.stewardAccountId,
        hasNewEvidence: b.evidenceMediaId !== undefined,
        kind,
        stewardWithinPreAuthorisation: stewardMayWiden(
          rowTerms(current),
          next,
          current.stewardMayWidenTo,
        ),
        frozen: frozen(rec.elderDeceased, rec.stewardAccountId !== null),
      },
      deps,
    );
    if (!d.allow) throw new DomainError(d.code, d.status);
    const asSteward = actor.id === rec.stewardAccountId && !b.evidenceMediaId;
    if (!b.evidenceMediaId && !asSteward) throw problem('consent.evidence_required', 422);

    const now = deps.clock.now();
    const reason =
      change === 'widening' ? 'widened' : change === 'narrowing' ? 'narrowed' : 'amended';
    await tx
      .update(consentRecord)
      .set({ endedAt: now, endedBy: actor.id, endReason: reason })
      .where(eq(consentRecord.id, current.id));
    const [row] = await tx
      .insert(consentRecord)
      .values({
        id: b.id,
        recordingId,
        version: current.version + 1,
        tier: next.tier,
        umunnaScope: next.umunnaScope ? [...next.umunnaScope] : null,
        allowArchive: next.allowArchive,
        allowLessons: next.allowLessons,
        allowSocial: next.allowSocial,
        allowPhoto: next.allowPhoto,
        allowMachineAssist: next.allowMachineAssist,
        // A steward never gains the right to widen further than the elder said.
        stewardMayWidenTo: asSteward ? current.stewardMayWidenTo : (b.stewardMayWidenTo ?? null),
        witnessName: b.witnessName ?? null,
        evidenceMediaId: b.evidenceMediaId ?? null,
        actedAs: asSteward ? 'steward' : 'facilitator',
        signatureMediaId: b.signatureMediaId ?? null,
        capturedBy: actor.id,
        capturedAt: new Date(b.capturedAt),
      })
      .returning();
    const event = change === 'widening' ? 'ConsentWidened' : 'ConsentNarrowed';
    await writeOutbox(tx, event, recordingId, { recordingId, consentId: b.id });
    await audit.record(tx, {
      actorId: actor.id,
      action: `consent.${reason}`,
      resourceType: 'consent_record',
      resourceId: b.id,
      detail: {
        recordingId,
        fromTier: current.tier,
        toTier: next.tier,
        version: current.version + 1,
        by: asSteward ? 'steward' : 'facilitator',
      },
      requestId,
    });
    return { row: row!, event };
  });
  if (result.event) deps.kick();
  return view(result.row);
}

/** Withdrawal beats everything (02 §5.4): consent ends, the recording is withdrawn, audio unservable now. */
export async function revokeConsent(
  deps: Deps,
  actor: AccountActor,
  recordingId: string,
  b: capture.RevokeConsentBody,
  requestId: string,
): Promise<capture.ConsentView> {
  const row = await inTransaction(deps.db, { actorId: actor.id, requestId }, async (tx) => {
    const rec = await lockRecording(tx, recordingId);
    const current = await activeConsent(tx, recordingId);
    if (!current) {
      // Already withdrawn: answer with the last version (idempotent from the elder's point of view).
      const [last] = await tx
        .select()
        .from(consentRecord)
        .where(eq(consentRecord.recordingId, recordingId))
        .orderBy(asc(consentRecord.version));
      if (last?.endReason === 'withdrawn') return last;
      throw problem('consent.not_active', 409);
    }
    const d = changeConsent.rule(
      actor,
      {
        recording: rec,
        stewardAccountId: rec.stewardAccountId,
        hasNewEvidence: b.evidenceMediaId !== undefined,
        kind: 'withdrawal',
        frozen: false,
      },
      deps,
    );
    if (!d.allow) throw new DomainError(d.code, d.status);

    const [ended] = await tx
      .update(consentRecord)
      .set({
        endedAt: deps.clock.now(),
        endedBy: actor.id,
        endReason: 'withdrawn',
        endedEvidenceMediaId: b.evidenceMediaId ?? null,
      })
      .where(eq(consentRecord.id, current.id))
      .returning();
    const status = await archive.applyRevocation(tx, recordingId);
    await writeOutbox(tx, 'ConsentRevoked', recordingId, { recordingId, consentId: current.id });
    await audit.record(tx, {
      actorId: actor.id,
      action: 'consent.withdrawn',
      resourceType: 'consent_record',
      resourceId: current.id,
      detail: {
        recordingId,
        recordingStatus: status,
        by: actor.id === rec.stewardAccountId ? 'steward' : 'facilitator',
      },
      requestId,
    });
    return ended!;
  });
  deps.kick(); // delete the bytes now; the SLA monitor checks within 15 minutes (INV-7)
  return view(row);
}

/** Consent history for a recording (terms only; evidence is never returned here). */
export async function listConsents(
  deps: Deps,
  actor: AccountActor,
  recordingId: string,
): Promise<capture.ConsentList> {
  return inTransaction(deps.db, { actorId: actor.id }, async (tx) => {
    const rec = await archive.lockRecordingForConsent(tx, recordingId);
    if (!rec) throw problem('archive.recording_not_found', 404);
    const d = readConsent.rule(
      actor,
      { recording: rec, stewardAccountId: rec.stewardAccountId },
      deps,
    );
    if (!d.allow) throw problem('archive.recording_not_found', 404);
    const rows = await tx
      .select()
      .from(consentRecord)
      .where(eq(consentRecord.recordingId, recordingId))
      .orderBy(asc(consentRecord.version));
    return { items: rows.map(view) };
  });
}
