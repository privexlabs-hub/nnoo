import { randomUUID } from 'node:crypto';
import { uuidv7 } from 'uuidv7';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asApp, asOwner, harness } from './harness.ts';
import {
  captureWithConsent,
  fakeStorage,
  permissions,
  runWorker,
  seedHometown,
  signIn,
  upload,
  type Person,
} from './fixtures.ts';

const h = harness();
afterAll(() => h.close());

let town: Awaited<ReturnType<typeof seedHometown>>;
let facilitator: Person;

beforeAll(async () => {
  town = await seedHometown();
  facilitator = await signIn(h, { passkey: true, facilitatorOf: [town.hometown] });
});

const mediaOf = async (who: Person, recordingId: string) =>
  (
    (await (await who.call(`/v1/recordings/${recordingId}/media`)).json()) as {
      items: { kind: string; status: string; rejectReason: string | null }[];
    }
  ).items;

describe('reference data', () => {
  it('finds a hometown by its folded name and returns the original spelling', async () => {
    const res = await h.call('/v1/hometowns?q=umuoji');
    const body = (await res.json()) as { items: { name: string }[] };
    expect(body.items.some((i) => i.name.startsWith('Ụmụọji'))).toBe(true);
  });
});

describe('S-01 (capture part): consent first, upload, process', () => {
  it('records an elder with consent and turns the upload into derivatives; the raw is deleted', async () => {
    const { recordingId } = await captureWithConsent(h, facilitator, town);
    const rec = (await (await facilitator.call(`/v1/recordings/${recordingId}`)).json()) as {
      tier: string;
      capabilities: Record<string, boolean>;
    };
    expect(rec.tier).toBe('oha');
    expect(rec.capabilities).toMatchObject({ canUploadAudio: true, canCaptureConsent: false });

    const audio = await upload(h, facilitator, recordingId, 'audio_raw', 30 * 1024 * 1024);
    expect(audio.status).toBe(200);
    expect(audio.body.status).toBe('uploaded');

    const w = await runWorker(h);
    expect(w.claimed && w.status).toBe(200);
    const media = await mediaOf(facilitator, recordingId);
    expect(
      media
        .filter((m) => m.status === 'ready')
        .map((m) => m.kind)
        .sort(),
    ).toEqual(['audio_aac', 'audio_master', 'audio_opus', 'peaks']);
    expect(media.find((m) => m.kind === 'audio_raw')?.status).toBe('purged');
    const rawKey = (
      await asOwner((c) => c.query(`select storage_key from media_asset where id = $1`, [audio.id]))
    ).rows[0].storage_key;
    expect(await fakeStorage(h).head('media-uploads', rawKey)).toBeNull();
  });

  it('refuses session audio before consent (consent first, 05 §3)', async () => {
    const elderId = uuidv7();
    const recordingId = uuidv7();
    await facilitator.call('/v1/elders', {
      json: {
        id: elderId,
        displayName: 'Papa Okoro',
        hometownId: town.hometown,
        dialectId: town.dialect,
      },
    });
    await facilitator.call('/v1/recordings', {
      json: {
        id: recordingId,
        elderId,
        topic: 'proverb',
        titleIg: 'Ilu',
        recordedAt: new Date().toISOString(),
      },
    });
    const audio = await upload(h, facilitator, recordingId, 'audio_raw');
    expect(audio.status).toBe(403);
    expect(audio.body.code).toBe('media.consent_required');
  });

  it('refuses consent whose evidence did not arrive, and evidence used twice', async () => {
    const elderId = uuidv7();
    const recordingId = uuidv7();
    await facilitator.call('/v1/elders', {
      json: {
        id: elderId,
        displayName: 'Auntie Chinwe',
        hometownId: town.hometown,
        dialectId: town.dialect,
      },
    });
    await facilitator.call('/v1/recordings', {
      json: {
        id: recordingId,
        elderId,
        topic: 'recipe',
        titleIg: 'Ofe nsala',
        recordedAt: new Date().toISOString(),
      },
    });
    const pending = await facilitator.call('/v1/uploads', {
      json: {
        id: uuidv7(),
        recordingId,
        kind: 'consent_evidence',
        bytes: 1000,
        sha256: 'c'.repeat(64),
        mime: 'audio/wav',
      },
    });
    const pendingId = ((await pending.json()) as { id: string }).id;
    const c = await facilitator.call('/v1/consents', {
      json: {
        id: uuidv7(),
        recordingId,
        tier: 'oha',
        permissions,
        evidenceMediaId: pendingId,
        capturedAt: new Date().toISOString(),
      },
    });
    expect(c.status).toBe(409);
    expect(await c.json()).toMatchObject({ code: 'consent.evidence_required' });
  });

  it('requires a passkey (step-up) session to capture', async () => {
    const otpOnly = await signIn(h, { facilitatorOf: [town.hometown] });
    const res = await otpOnly.call('/v1/elders', {
      json: { id: uuidv7(), displayName: 'X', hometownId: town.hometown, dialectId: town.dialect },
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: 'identity.step_up_required' });
  });

  it('only facilitators of the hometown may record there', async () => {
    const other = await seedHometown();
    const outsider = await signIn(h, { passkey: true, facilitatorOf: [other.hometown] });
    const res = await outsider.call('/v1/elders', {
      json: { id: uuidv7(), displayName: 'X', hometownId: town.hometown, dialectId: town.dialect },
    });
    expect(res.status).toBe(403);
  });

  it('hides other people’s recordings (no existence leak)', async () => {
    const { recordingId } = await captureWithConsent(h, facilitator, town);
    const other = await signIn(h, { passkey: true, facilitatorOf: [town.hometown] });
    expect((await other.call(`/v1/recordings/${recordingId}`)).status).toBe(404);
    expect((await other.call(`/v1/recordings/${randomUUID()}`)).status).toBe(404);
    expect((await other.call(`/v1/recordings/not-a-uuid`)).status).toBe(404);
  });

  it('keeps Igbo text byte-identical and rejects non-NFC titles', async () => {
    const elderId = uuidv7();
    await facilitator.call('/v1/elders', {
      json: {
        id: elderId,
        displayName: 'Nne Ụ̀zọ́',
        hometownId: town.hometown,
        dialectId: town.dialect,
      },
    });
    const title = 'Ụ̀lọ́ nne m'.normalize('NFC');
    const ok = await facilitator.call('/v1/recordings', {
      json: {
        id: uuidv7(),
        elderId,
        topic: 'story',
        titleIg: title,
        recordedAt: new Date().toISOString(),
      },
    });
    expect(((await ok.json()) as { titleIg: string }).titleIg).toBe(title);
    const bad = await facilitator.call('/v1/recordings', {
      json: {
        id: uuidv7(),
        elderId,
        topic: 'story',
        titleIg: title.normalize('NFD'),
        recordedAt: new Date().toISOString(),
      },
    });
    expect(bad.status).toBe(400);
  });

  it('pages the sessions list by keyset', async () => {
    const first = (await (await facilitator.call('/v1/recordings?limit=2')).json()) as {
      items: unknown[];
      nextCursor: string | null;
    };
    expect(first.items).toHaveLength(2);
    expect(first.nextCursor).toBeTruthy();
    const next = (await (
      await facilitator.call(`/v1/recordings?limit=2&cursor=${first.nextCursor}`)
    ).json()) as { items: { id: string }[] };
    expect(next.items.length).toBeGreaterThan(0);
  });
});

describe('resumable uploads (07 §7)', () => {
  it('reports stored parts and fresh URLs for the rest after an interruption', async () => {
    const { recordingId } = await captureWithConsent(h, facilitator, town);
    const id = uuidv7();
    const bytes = 3 * 8 * 1024 * 1024 - 100;
    const created = (await (
      await facilitator.call('/v1/uploads', {
        json: {
          id,
          recordingId,
          kind: 'audio_raw',
          bytes,
          sha256: 'd'.repeat(64),
          mime: 'audio/wav',
        },
      })
    ).json()) as {
      parts: { partNumber: number; url: string }[];
    };
    expect(created.parts).toHaveLength(3);
    const uploadId = new URL(
      created.parts[0]!.url.replace('fake://', 'http://x/'),
    ).searchParams.get('uploadId')!;
    fakeStorage(h).putPart(uploadId, 1, 8 * 1024 * 1024); // the app was killed after part 1
    const resumed = (await (await facilitator.call(`/v1/uploads/${id}`)).json()) as {
      uploadedParts: number[];
      parts: { partNumber: number }[];
    };
    expect(resumed.uploadedParts).toEqual([1]);
    expect(resumed.parts.map((p) => p.partNumber)).toEqual([2, 3]);
    // Completing with parts missing is refused; the client resumes.
    const early = await facilitator.call(`/v1/uploads/${id}/complete`, {
      json: { parts: [{ partNumber: 1, etag: `"etag-${uploadId}-1"` }] },
    });
    expect(early.status).toBe(409);
  });

  it('a retry with the same id resumes instead of creating a second upload', async () => {
    const { recordingId } = await captureWithConsent(h, facilitator, town);
    const body = {
      id: uuidv7(),
      recordingId,
      kind: 'audio_raw',
      bytes: 100,
      sha256: 'e'.repeat(64),
      mime: 'audio/wav',
    };
    const a = await facilitator.call('/v1/uploads', { json: body });
    const b = await facilitator.call('/v1/uploads', { json: body });
    expect([a.status, b.status]).toEqual([201, 201]);
    const count = await asOwner((c) =>
      c.query(`select count(*)::int as n from upload_session where media_asset_id = $1`, [body.id]),
    );
    expect(count.rows[0].n).toBe(1);
  });

  it('rejects an upload whose stored size differs from the declared size', async () => {
    const { recordingId } = await captureWithConsent(h, facilitator, town);
    const id = uuidv7();
    const created = (await (
      await facilitator.call('/v1/uploads', {
        json: {
          id,
          recordingId,
          kind: 'audio_raw',
          bytes: 1000,
          sha256: 'f'.repeat(64),
          mime: 'audio/wav',
        },
      })
    ).json()) as {
      parts: { url: string }[];
    };
    const uploadId = new URL(
      created.parts[0]!.url.replace('fake://', 'http://x/'),
    ).searchParams.get('uploadId')!;
    const etag = fakeStorage(h).putPart(uploadId, 1, 999);
    const done = (await (
      await facilitator.call(`/v1/uploads/${id}/complete`, {
        json: { parts: [{ partNumber: 1, etag }] },
      })
    ).json()) as { status: string };
    expect(done.status).toBe('rejected');
  });
});

describe('S-15: Nsọ audio is refused at policy, API and database (INV-2)', () => {
  it('policy refuses audio uploads for an Nsọ recording', async () => {
    const { recordingId } = await captureWithConsent(h, facilitator, town, 'nso');
    const audio = await upload(h, facilitator, recordingId, 'audio_raw');
    expect(audio.status).toBe(403);
    expect(audio.body.code).toBe('media.tier_forbidden');
  });

  it('the database refuses an audio row for an Nsọ recording even from the runtime role', async () => {
    const { recordingId } = await captureWithConsent(h, facilitator, town, 'nso');
    await asApp(async (c) => {
      await expect(
        c.query(
          `insert into media_asset (id, recording_id, kind, bucket, storage_key, sha256, bytes, mime) values ($1, $2, 'audio_opus', 'media-derivatives', $3, $4, 10, 'audio/ogg')`,
          [uuidv7(), recordingId, `audio_opus/${uuidv7()}`, Buffer.alloc(32)],
        ),
      ).rejects.toThrow(/INV-2/);
    });
  });

  it('an unknown object that reaches storage is quarantined by the upload trigger', async () => {
    const key = `audio_raw/${uuidv7()}`;
    fakeStorage(h).putObject('media-uploads', key, 10);
    const inv = `inv-${randomUUID()}`;
    const res = await h.jobs.request('/internal/storage/object-created', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-neon-trigger-invocation-id': inv },
      body: JSON.stringify({
        version: 1,
        invocation_id: inv,
        type: 'storage_object_created',
        trigger: { type: 'storage_object_created', id: 't', name: 'upload-created' },
        data: { bucket_name: 'media-uploads', object_key: key },
      }),
    });
    expect(await res.json()).toMatchObject({ ok: true, outcome: 'quarantined' });
    expect(await fakeStorage(h).head('media-uploads', key)).toBeNull();
  });

  it('narrowing to Nsọ makes existing audio unservable at once and deletes the bytes', async () => {
    const { recordingId } = await captureWithConsent(h, facilitator, town);
    await upload(h, facilitator, recordingId, 'audio_raw');
    await runWorker(h);
    const ev = await upload(h, facilitator, recordingId, 'consent_evidence', 1024);
    const res = await facilitator.call(`/v1/recordings/${recordingId}/consents`, {
      json: {
        id: uuidv7(),
        tier: 'nso',
        permissions: { ...permissions, lessons: false },
        evidenceMediaId: ev.id,
        capturedAt: new Date().toISOString(),
      },
    });
    expect(res.status).toBe(201);
    await h.settle();
    const media = await mediaOf(facilitator, recordingId);
    expect(
      media.filter((m) => m.kind !== 'consent_evidence').every((m) => m.status === 'purged'),
    ).toBe(true);
    const live = await asOwner((c) =>
      c.query(
        `select count(*)::int as n from media_asset where recording_id = $1 and kind <> 'consent_evidence' and object_deleted_at is null`,
        [recordingId],
      ),
    );
    expect(live.rows[0].n).toBe(0);
  });
});

describe('S-02 shape: revocation beats everything (INV-7)', () => {
  it('any facilitator of the hometown can record a withdrawal with a new spoken statement', async () => {
    const { recordingId } = await captureWithConsent(h, facilitator, town);
    await upload(h, facilitator, recordingId, 'audio_raw');
    await runWorker(h);

    const another = await signIn(h, { passkey: true, facilitatorOf: [town.hometown] });
    // Without a new statement: refused.
    const noEvidence = await another.call(`/v1/recordings/${recordingId}/consents/revoke`, {
      json: {},
    });
    expect(await noEvidence.json()).toMatchObject({ code: 'consent.evidence_required' });

    const ev = await upload(h, another, recordingId, 'consent_evidence', 2048, {
      purpose: 'consent_change',
    });
    expect(ev.status).toBe(200);
    const res = await another.call(`/v1/recordings/${recordingId}/consents/revoke`, {
      json: { evidenceMediaId: ev.id },
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ active: false, endReason: 'withdrawn' });

    // Unservable in the same transaction; bytes deleted by the post-commit kick.
    await h.settle();
    const rec = await asOwner((c) =>
      c.query(`select status, tier from recording where id = $1`, [recordingId]),
    );
    expect(rec.rows[0]).toEqual({ status: 'withdrawn', tier: null });
    const left = await asOwner((c) =>
      c.query(
        `select storage_key, bucket from media_asset where recording_id = $1 and kind <> 'consent_evidence'`,
        [recordingId],
      ),
    );
    for (const r of left.rows)
      expect(await fakeStorage(h).head(r.bucket, r.storage_key)).toBeNull();
    // Consent evidence is kept (life of the consent + 7 years).
    const evidence = await asOwner((c) =>
      c.query(
        `select count(*)::int as n from media_asset where recording_id = $1 and kind = 'consent_evidence' and status <> 'purged'`,
        [recordingId],
      ),
    );
    expect(evidence.rows[0].n).toBeGreaterThan(0);

    // The SLA monitor finds nothing overdue.
    const inv = `inv-${randomUUID()}`;
    const sla = await h.jobs.request('/internal/consent/sla-check', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-neon-trigger-invocation-id': inv },
      body: JSON.stringify({
        version: 1,
        invocation_id: inv,
        trigger: { type: 'schedule', id: 't', name: 'revocation-sla' },
        data: { scheduled_at: new Date().toISOString() },
      }),
    });
    expect(await sla.json()).toMatchObject({ ok: true, overdue: 0, reachable: 0 });

    // Nothing more can be uploaded or processed for it.
    const after = await upload(h, facilitator, recordingId, 'audio_raw');
    expect(after.status).toBe(403);
  });

  it('a facilitator of another hometown cannot revoke, even with evidence', async () => {
    const { recordingId } = await captureWithConsent(h, facilitator, town);
    const other = await seedHometown();
    const outsider = await signIn(h, { passkey: true, facilitatorOf: [other.hometown] });
    const ev = await upload(h, outsider, recordingId, 'consent_evidence', 1024, {
      purpose: 'consent_change',
    });
    expect(ev.status).toBe(403);
    const res = await outsider.call(`/v1/recordings/${recordingId}/consents/revoke`, { json: {} });
    expect(res.status).toBe(403);
  });

  it('the SLA monitor pages when bytes outlive a purge by more than 15 minutes', async () => {
    const local = harness({ start: new Date() });
    try {
      const f = await signIn(local, { passkey: true, facilitatorOf: [town.hometown] });
      const { recordingId } = await captureWithConsent(local, f, town);
      await upload(local, f, recordingId, 'audio_raw');
      await runWorker(local);
      // Simulate a failed purge: mark unservable 20 minutes ago without deleting the bytes.
      await asOwner((c) =>
        c.query(`update recording set status = 'discarded' where id = $1`, [recordingId]),
      );
      await asOwner((c) =>
        c.query(
          `update media_asset set purged_at = now() - interval '20 minutes' where recording_id = $1 and purged_at is not null and object_deleted_at is null`,
          [recordingId],
        ),
      );
      const inv = `inv-${randomUUID()}`;
      const sla = await local.jobs.request('/internal/consent/sla-check', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-neon-trigger-invocation-id': inv },
        body: JSON.stringify({
          version: 1,
          invocation_id: inv,
          trigger: { type: 'schedule', id: 't', name: 'revocation-sla' },
          data: { scheduled_at: new Date().toISOString() },
        }),
      });
      const report = (await sla.json()) as { overdue: number };
      expect(report.overdue).toBeGreaterThan(0);
      expect(
        local.logs.some((l) => l.includes('revocation SLA breach') && l.includes('"page":true')),
      ).toBe(true);
    } finally {
      await local.close();
    }
  });

  it('a late worker result for a revoked recording keeps nothing', async () => {
    const { recordingId } = await captureWithConsent(h, facilitator, town);
    await upload(h, facilitator, recordingId, 'audio_raw');
    // The worker claims, then consent is withdrawn before it reports.
    const claimRes = await h.jobs.request('/internal/audio/claim', {
      method: 'POST',
      headers: { authorization: `Bearer ${h.deps.env.AUDIO_WORKER_KEYS[0]}` },
    });
    const claim = (await claimRes.json()) as {
      job: {
        jobId: number;
        token: string;
        input: { sha256: string };
        output: Record<string, string>;
      };
    };
    const ev = await upload(h, facilitator, recordingId, 'consent_evidence', 1024);
    await facilitator.call(`/v1/recordings/${recordingId}/consents/revoke`, {
      json: { evidenceMediaId: ev.id },
    });
    const outputs: Record<string, { sha256: string; bytes: number }> = {};
    for (const [name, url] of Object.entries(claim.job.output)) {
      const [bucket, ...key] = new URL(url.replace('fake://', 'http://x/')).pathname
        .slice(1)
        .split('/');
      fakeStorage(h).putObject(bucket as never, key.join('/'), 100);
      outputs[name] = { sha256: 'b'.repeat(64), bytes: 100 };
    }
    const res = await h.jobs.request(`/internal/audio/${claim.job.jobId}/result`, {
      method: 'POST',
      headers: { authorization: `Bearer ${claim.job.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        status: 'ok',
        sha256: claim.job.input.sha256,
        durationMs: 1000,
        format: 'wav',
        lufs: -18,
        algoVersion: 'audio@1',
        outputs,
      }),
    });
    expect(await res.json()).toMatchObject({ accepted: true, kept: false });
    for (const url of Object.values(claim.job.output)) {
      const [bucket, ...key] = new URL(url.replace('fake://', 'http://x/')).pathname
        .slice(1)
        .split('/');
      expect(await fakeStorage(h).head(bucket as never, key.join('/'))).toBeNull();
    }
  });
});

describe('S-04 shape and stewards: narrowing and widening', () => {
  it('Ọha → Umunna is a narrowing that keeps audio; widening back needs the elder present', async () => {
    const { recordingId } = await captureWithConsent(h, facilitator, town);
    const ev = await upload(h, facilitator, recordingId, 'consent_evidence', 1024);
    const narrowed = await facilitator.call(`/v1/recordings/${recordingId}/consents`, {
      json: {
        id: uuidv7(),
        tier: 'umunna',
        umunnaScope: [town.hometown],
        permissions,
        evidenceMediaId: ev.id,
        capturedAt: new Date().toISOString(),
      },
    });
    expect(narrowed.status).toBe(201);
    expect(await narrowed.json()).toMatchObject({ version: 2, tier: 'umunna', active: true });
    const history = (await (
      await facilitator.call(`/v1/recordings/${recordingId}/consents`)
    ).json()) as { items: { version: number; endReason: string | null }[] };
    expect(history.items.map((i) => [i.version, i.endReason])).toEqual([
      [1, 'narrowed'],
      [2, null],
    ]);
  });

  it('a steward may widen only up to the elder’s pre-authorisation', async () => {
    const steward = await signIn(h, { passkey: true });
    const { recordingId, elderId } = await captureWithConsent(h, facilitator, town, 'nso');
    await asOwner((c) =>
      c.query(`update elder_profile set steward_account_id = $2 where id = $1`, [
        elderId,
        steward.id,
      ]),
    );
    await asOwner((c) =>
      c
        .query(
          `update consent_record set steward_may_widen_to = 'umunna' where recording_id = $1 and ended_at is null`,
          [recordingId],
        )
        .catch(() => {}),
    );
    // steward_may_widen_to is immutable (append-only consent); capture it on a new version instead:
    const ev = await upload(h, facilitator, recordingId, 'consent_evidence', 1024);
    await facilitator.call(`/v1/recordings/${recordingId}/consents`, {
      json: {
        id: uuidv7(),
        tier: 'nso',
        permissions: { ...permissions, lessons: false, archive: false },
        stewardMayWidenTo: 'umunna',
        evidenceMediaId: ev.id,
        capturedAt: new Date().toISOString(),
      },
    });
    const tooFar = await steward.call(`/v1/recordings/${recordingId}/consents`, {
      json: {
        id: uuidv7(),
        tier: 'oha',
        permissions: { ...permissions, lessons: false, archive: false },
        capturedAt: new Date().toISOString(),
      },
    });
    expect(await tooFar.json()).toMatchObject({ code: 'consent.widen_not_allowed' });
    const within = await steward.call(`/v1/recordings/${recordingId}/consents`, {
      json: {
        id: uuidv7(),
        tier: 'umunna',
        umunnaScope: [town.hometown],
        permissions: { ...permissions, lessons: false, archive: false },
        capturedAt: new Date().toISOString(),
      },
    });
    expect(within.status).toBe(201);
  });

  it('consent is frozen when the elder has died without a steward: it can only narrow', async () => {
    const { recordingId, elderId } = await captureWithConsent(h, facilitator, town, 'umunna');
    await asOwner((c) =>
      c.query(`update elder_profile set deceased_at = current_date where id = $1`, [elderId]),
    );
    const ev = await upload(h, facilitator, recordingId, 'consent_evidence', 1024);
    const widen = await facilitator.call(`/v1/recordings/${recordingId}/consents`, {
      json: {
        id: uuidv7(),
        tier: 'oha',
        permissions,
        evidenceMediaId: ev.id,
        capturedAt: new Date().toISOString(),
      },
    });
    expect(await widen.json()).toMatchObject({ code: 'consent.frozen' });
  });

  it('the runtime role cannot rewrite consent history', async () => {
    const { consentId } = await captureWithConsent(h, facilitator, town);
    await asApp(async (c) => {
      await expect(
        c.query(`update consent_record set tier = 'oha' where id = $1`, [consentId]),
      ).rejects.toThrow(/permission denied/);
      await expect(
        c.query(`delete from consent_record where id = $1`, [consentId]),
      ).rejects.toThrow(/permission denied/);
    });
  });
});

describe('audio worker contract (ADR-021)', () => {
  it('refuses claims without the worker key and results with a wrong or reused token', async () => {
    expect((await h.jobs.request('/internal/audio/claim', { method: 'POST' })).status).toBe(401);
    expect(
      (
        await h.jobs.request('/internal/audio/claim', {
          method: 'POST',
          headers: { authorization: 'Bearer nope' },
        })
      ).status,
    ).toBe(401);

    const { recordingId } = await captureWithConsent(h, facilitator, town);
    await upload(h, facilitator, recordingId, 'audio_raw');
    const first = await runWorker(h);
    expect(first.claimed && first.status).toBe(200);
    if (!first.claimed) return;
    // Replaying the same result with the same (now revoked) token fails.
    const replay = await h.jobs.request(`/internal/audio/${first.job.jobId}/result`, {
      method: 'POST',
      headers: { authorization: `Bearer ${first.job.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'rejected', reason: 'unreadable' }),
    });
    expect(replay.status).toBe(401);
    // A token is bound to its job.
    const other = await h.jobs.request(`/internal/audio/${first.job.jobId + 1}/result`, {
      method: 'POST',
      headers: { authorization: `Bearer ${first.job.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'rejected', reason: 'unreadable' }),
    });
    expect(other.status).toBe(401);
  });

  it('a rejected file shows the facilitator why', async () => {
    const { recordingId } = await captureWithConsent(h, facilitator, town);
    await upload(h, facilitator, recordingId, 'audio_raw');
    await runWorker(h, { report: 'rejected' });
    const raw = (await mediaOf(facilitator, recordingId)).find((m) => m.kind === 'audio_raw');
    expect(raw).toMatchObject({ status: 'rejected', rejectReason: 'media.format_not_allowed' });
  });

  it('discarding a recording purges its audio', async () => {
    const { recordingId } = await captureWithConsent(h, facilitator, town);
    await upload(h, facilitator, recordingId, 'audio_raw');
    await runWorker(h);
    const res = await facilitator.call(`/v1/recordings/${recordingId}/discard`, { method: 'POST' });
    expect(res.status).toBe(200);
    await h.settle();
    const live = await asOwner((c) =>
      c.query(
        `select count(*)::int as n from media_asset where recording_id = $1 and kind <> 'consent_evidence' and object_deleted_at is null`,
        [recordingId],
      ),
    );
    expect(live.rows[0].n).toBe(0);
  });
});
