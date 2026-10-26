import { and, desc, eq, lt, or } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import type { capture } from '@nnoo/contracts';
import * as audit from '../../audit/public.ts';
import * as community from '../../community/public.ts';
import type { AccountActor } from '../../../platform/actor.ts';
import type { Clock } from '../../../platform/clock.ts';
import { inTransaction, type Db, type Queryable, type Tx } from '../../../platform/db.ts';
import { writeOutbox } from '../../../platform/jobs/queue.ts';
import { can, type Decision } from '../../../platform/policy.ts';
import { DomainError, problem } from '../../../platform/problem.ts';
import {
  createElder as createElderPolicy,
  createRecording as createRecordingPolicy,
  editOwnRecording,
  readOwnRecording,
} from '../domain/policies.ts';
import {
  canTransition,
  isOpenForCapture,
  statusOnRevocation,
  type RecordingStatus,
} from '../domain/recording.ts';
import {
  elderProfile,
  recording,
  recordingNote,
  recordingRevision,
} from '../infrastructure/schema.ts';

type Deps = { db: Db; clock: Clock };

function decide(decision: Decision) {
  if (!decision.allow) throw new DomainError(decision.code, decision.status);
}

// ── elders ──────────────────────────────────────────────────────────────────
export async function createElder(
  deps: Deps,
  actor: AccountActor,
  b: capture.CreateElderBody,
  requestId: string,
): Promise<capture.ElderView> {
  decide(createElderPolicy.rule(actor, { hometownId: b.hometownId }, deps));
  return inTransaction(deps.db, { actorId: actor.id, requestId }, async (tx) => {
    if (!(await community.hometownExists(tx, b.hometownId)))
      throw problem('community.hometown_not_found', 422);
    if (!(await community.dialectExists(tx, b.dialectId)))
      throw problem('community.dialect_not_found', 422);
    const inserted = await tx
      .insert(elderProfile)
      .values({
        id: b.id,
        displayName: b.displayName,
        hometownId: b.hometownId,
        dialectId: b.dialectId,
        birthYear: b.birthYear ?? null,
        lineage: b.lineage ?? null,
        familyRepresentativeName: b.familyRepresentativeName ?? null,
        payeeKind: b.payee.kind,
        payeeName: b.payee.kind === 'family_member' ? b.payee.name : null,
        createdBy: actor.id,
      })
      .onConflictDoNothing()
      .returning();
    if (inserted.length === 0)
      throw problem('archive.recording_exists', 409, 'An elder with this id already exists.');
    await audit.record(tx, {
      actorId: actor.id,
      action: 'archive.elder_created',
      resourceType: 'elder_profile',
      resourceId: b.id,
      requestId,
    });
    return elderView(inserted[0]!);
  });
}

function elderView(e: typeof elderProfile.$inferSelect): capture.ElderView {
  return {
    id: e.id,
    displayName: e.displayName,
    hometownId: e.hometownId,
    dialectId: e.dialectId,
    birthYear: e.birthYear,
    lineage: e.lineage,
    familyRepresentativeName: e.familyRepresentativeName,
    payee: { kind: e.payeeKind, name: e.payeeName },
  };
}

// ── recordings ──────────────────────────────────────────────────────────────
type RecordingRow = typeof recording.$inferSelect & { titleIg: string };

function recordingView(actor: AccountActor, r: RecordingRow, clock: Clock): capture.RecordingView {
  const own = can(
    actor,
    editOwnRecording,
    { facilitatorId: r.facilitatorId, status: r.status },
    { clock },
  );
  const draft = r.status === 'draft';
  return {
    id: r.id,
    elderId: r.elderId,
    hometownId: r.hometownId,
    dialectId: r.dialectId,
    topic: r.topic,
    status: r.status,
    tier: r.tier,
    titleIg: r.titleIg,
    recordedAt: r.recordedAt.toISOString(),
    capabilities: {
      // recording.tier is non-null exactly when a consent is active (consent triggers).
      canCaptureConsent: own && draft && r.tier === null,
      canUploadAudio: own && draft && r.tier !== null && r.tier !== 'nso',
      canDiscard: own && canTransition(r.status, 'discarded'),
      canAddNote: own && isOpenForCapture(r.status),
    },
  };
}

async function loadOwn(q: Queryable, actor: AccountActor, id: string): Promise<RecordingRow> {
  // Scope predicate in SQL (06 §4): someone else's recording is simply not found.
  const [r] = await q
    .select({ rec: recording, titleIg: recordingRevision.titleIg })
    .from(recording)
    .innerJoin(recordingRevision, eq(recordingRevision.id, recording.currentRevisionId))
    .where(and(eq(recording.id, id), eq(recording.facilitatorId, actor.id)));
  if (!r) throw problem('archive.recording_not_found', 404);
  return { ...r.rec, titleIg: r.titleIg };
}

export async function createRecording(
  deps: Deps,
  actor: AccountActor,
  b: capture.CreateRecordingBody,
  requestId: string,
): Promise<capture.RecordingView> {
  return inTransaction(deps.db, { actorId: actor.id, requestId }, async (tx) => {
    const [elder] = await tx.select().from(elderProfile).where(eq(elderProfile.id, b.elderId));
    if (!elder) throw problem('archive.elder_not_found', 422);
    decide(createRecordingPolicy.rule(actor, { hometownId: elder.hometownId }, deps));
    const dialectId = b.dialectId ?? elder.dialectId;
    if (b.dialectId && !(await community.dialectExists(tx, b.dialectId)))
      throw problem('community.dialect_not_found', 422);

    const inserted = await tx
      .insert(recording)
      .values({
        id: b.id,
        elderId: elder.id,
        facilitatorId: actor.id,
        hometownId: elder.hometownId,
        dialectId,
        topic: b.topic,
        recordedAt: new Date(b.recordedAt),
      })
      .onConflictDoNothing()
      .returning();
    if (inserted.length === 0) throw problem('archive.recording_exists', 409);
    const revisionId = uuidv7();
    await tx
      .insert(recordingRevision)
      .values({
        id: revisionId,
        recordingId: b.id,
        rev: 1,
        titleIg: b.titleIg,
        createdBy: actor.id,
      });
    const [updated] = await tx
      .update(recording)
      .set({ currentRevisionId: revisionId })
      .where(eq(recording.id, b.id))
      .returning();
    await audit.record(tx, {
      actorId: actor.id,
      action: 'archive.recording_created',
      resourceType: 'recording',
      resourceId: b.id,
      detail: { topic: b.topic },
      requestId,
    });
    return recordingView(actor, { ...updated!, titleIg: b.titleIg }, deps.clock);
  });
}

export async function getRecording(
  deps: Deps,
  actor: AccountActor,
  id: string,
): Promise<capture.RecordingView> {
  const r = await loadOwn(deps.db, actor, id);
  decide(readOwnRecording.rule(actor, { facilitatorId: r.facilitatorId, status: r.status }, deps));
  return recordingView(actor, r, deps.clock);
}

type Cursor = { t: string; id: string };
const encodeCursor = (c: Cursor) => Buffer.from(JSON.stringify(c)).toString('base64url');
function decodeCursor(s: string | undefined): Cursor | undefined {
  if (!s) return undefined;
  try {
    const c = JSON.parse(Buffer.from(s, 'base64url').toString()) as Cursor;
    if (typeof c.t !== 'string' || typeof c.id !== 'string' || Number.isNaN(Date.parse(c.t)))
      throw new Error();
    return c;
  } catch {
    throw new DomainError('http.validation_failed', 400, 'Invalid cursor.');
  }
}

/** The facilitator's sessions list (F-02), newest first, keyset-paginated on (created_at, id). */
export async function listMyRecordings(
  deps: Deps,
  actor: AccountActor,
  q: { cursor?: string | undefined; limit: number },
): Promise<capture.RecordingList> {
  const cursor = decodeCursor(q.cursor);
  const rows = await deps.db
    .select({ rec: recording, titleIg: recordingRevision.titleIg })
    .from(recording)
    .innerJoin(recordingRevision, eq(recordingRevision.id, recording.currentRevisionId))
    .where(
      and(
        eq(recording.facilitatorId, actor.id),
        cursor
          ? or(
              lt(recording.createdAt, new Date(cursor.t)),
              and(eq(recording.createdAt, new Date(cursor.t)), lt(recording.id, cursor.id)),
            )
          : undefined,
      ),
    )
    .orderBy(desc(recording.createdAt), desc(recording.id))
    .limit(q.limit + 1);
  const page = rows.slice(0, q.limit);
  const last = page.at(-1);
  return {
    items: page.map((r) => recordingView(actor, { ...r.rec, titleIg: r.titleIg }, deps.clock)),
    nextCursor:
      rows.length > q.limit && last
        ? encodeCursor({ t: last.rec.createdAt.toISOString(), id: last.rec.id })
        : null,
  };
}

export async function discardRecording(
  deps: Deps & { kick: () => void },
  actor: AccountActor,
  id: string,
  requestId: string,
): Promise<capture.RecordingView> {
  const view = await inTransaction(deps.db, { actorId: actor.id, requestId }, async (tx) => {
    const r = await loadOwn(tx, actor, id);
    decide(
      editOwnRecording.rule(actor, { facilitatorId: r.facilitatorId, status: r.status }, deps),
    );
    if (!canTransition(r.status, 'discarded')) throw problem('archive.invalid_transition', 409);
    const [u] = await tx
      .update(recording)
      .set({ status: 'discarded' })
      .where(eq(recording.id, id))
      .returning();
    await writeOutbox(tx, 'RecordingDiscarded', id, { recordingId: id });
    await audit.record(tx, {
      actorId: actor.id,
      action: 'archive.recording_discarded',
      resourceType: 'recording',
      resourceId: id,
      requestId,
    });
    return recordingView(actor, { ...u!, titleIg: r.titleIg }, deps.clock);
  });
  deps.kick(); // the database already made its audio unservable; delete the bytes now
  return view;
}

export async function addNote(
  deps: Deps,
  actor: AccountActor,
  recordingId: string,
  b: capture.AddNoteBody,
  requestId: string,
): Promise<capture.NoteView> {
  return inTransaction(deps.db, { actorId: actor.id, requestId }, async (tx) => {
    const r = await loadOwn(tx, actor, recordingId);
    decide(
      editOwnRecording.rule(actor, { facilitatorId: r.facilitatorId, status: r.status }, deps),
    );
    const inserted = await tx
      .insert(recordingNote)
      .values({ id: b.id, recordingId, atMs: b.atMs, body: b.body, createdBy: actor.id })
      .onConflictDoNothing()
      .returning();
    if (inserted.length === 0)
      throw problem('archive.recording_exists', 409, 'A note with this id already exists.');
    const n = inserted[0]!;
    return {
      id: n.id,
      recordingId,
      atMs: n.atMs,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
    };
  });
}

// ── public, for consent and media (same transaction where atomicity is a rule, 02 §4) ──
export type RecordingForConsent = {
  id: string;
  facilitatorId: string;
  hometownId: string;
  status: RecordingStatus;
  tier: 'oha' | 'umunna' | 'nso' | null;
  stewardAccountId: string | null;
  elderDeceased: boolean;
};

/** Locks the recording row so concurrent consent changes serialise. */
export async function lockRecordingForConsent(
  tx: Tx,
  id: string,
): Promise<RecordingForConsent | null> {
  const [r] = await tx
    .select({
      id: recording.id,
      facilitatorId: recording.facilitatorId,
      hometownId: recording.hometownId,
      status: recording.status,
      tier: recording.tier,
      stewardAccountId: elderProfile.stewardAccountId,
      deceasedAt: elderProfile.deceasedAt,
    })
    .from(recording)
    .innerJoin(elderProfile, eq(elderProfile.id, recording.elderId))
    .where(eq(recording.id, id))
    .for('update', { of: [recording] });
  if (!r) return null;
  const { deceasedAt, ...rest } = r;
  return { ...rest, elderDeceased: deceasedAt !== null };
}

/** Consent withdrawn: the recording leaves every path to publication (02 §5.4). Audio rows are made
 * unservable by the database in the same statement (recording_restrict_purges_audio). */
export async function applyRevocation(tx: Tx, id: string): Promise<RecordingStatus | null> {
  const [r] = await tx
    .select({ status: recording.status })
    .from(recording)
    .where(eq(recording.id, id));
  if (!r) return null;
  const next = statusOnRevocation(r.status);
  if (!next) return null;
  await tx.update(recording).set({ status: next }).where(eq(recording.id, id));
  return next;
}

export type RecordingForMedia = {
  id: string;
  facilitatorId: string;
  hometownId: string;
  status: RecordingStatus;
  tier: 'oha' | 'umunna' | 'nso' | null;
};

export async function recordingForMedia(
  q: Queryable,
  id: string,
  lock = false,
): Promise<RecordingForMedia | null> {
  const query = q
    .select({
      id: recording.id,
      facilitatorId: recording.facilitatorId,
      hometownId: recording.hometownId,
      status: recording.status,
      tier: recording.tier,
    })
    .from(recording)
    .where(eq(recording.id, id));
  const [r] = lock ? await query.for('share') : await query;
  return r ?? null;
}

/** Tier of a recording, for the storage guard (05 §4). */
export async function tierOf(q: Queryable, id: string) {
  const [r] = await q.select({ tier: recording.tier }).from(recording).where(eq(recording.id, id));
  return r?.tier ?? null;
}
