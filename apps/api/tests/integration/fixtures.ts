import { createHash, randomUUID } from 'node:crypto';
import { uuidv7 } from 'uuidv7';
import type { FakeStorage } from '../../src/modules/media/public.ts';
import { asOwner, type Harness, testPhone } from './harness.ts';

/** Synthetic geography (never real people). Unique per call so tests can run in any order. */
export async function seedHometown(name = `Ụmụọji ${randomUUID().slice(0, 6)}`) {
  const ids = { state: uuidv7(), lga: uuidv7(), hometown: uuidv7(), dialect: uuidv7() };
  await asOwner(async (c) => {
    await c.query(`insert into state (id, name) values ($1, $2)`, [
      ids.state,
      `Anambra ${ids.state.slice(-6)}`,
    ]);
    await c.query(`insert into lga (id, state_id, name) values ($1, $2, $3)`, [
      ids.lga,
      ids.state,
      `Idemili ${ids.lga.slice(-6)}`,
    ]);
    await c.query(`insert into hometown (id, lga_id, name) values ($1, $2, $3)`, [
      ids.hometown,
      ids.lga,
      name.normalize('NFC'),
    ]);
    await c.query(`insert into dialect (id, name) values ($1, $2)`, [
      ids.dialect,
      `Nnewi central ${ids.dialect.slice(-6)}`,
    ]);
    await c.query(
      `insert into hometown_dialect (hometown_id, dialect_id, is_primary) values ($1, $2, true)`,
      [ids.hometown, ids.dialect],
    );
  });
  return ids;
}

/**
 * A signed-in account. `passkey: true` marks the ceremony session amr=passkey before the
 * exchange: a stand-in for the WebAuthn ceremony, which needs a browser (ADR-028). The
 * exchange, tokens and step-up checks that follow are the real ones.
 */
export async function signIn(
  h: Harness,
  opts: { passkey?: boolean; facilitatorOf?: string[]; custodianOf?: string[] } = {},
) {
  const phone = testPhone();
  await h.call('/v1/auth/phone-number/send-otp', { json: { phoneNumber: phone } });
  const v = await h.call('/v1/auth/phone-number/verify', {
    json: { phoneNumber: phone, code: h.inbox.latestCode(phone)! },
  });
  const { token, user } = (await v.json()) as { token: string; user: { id: string } };
  await asOwner(async (c) => {
    if (opts.passkey)
      await c.query(`update auth.session set amr = 'passkey' where token = $1`, [token]);
    await c.query(`update account set age_band = 'adult' where id = $1`, [user.id]);
    for (const h of opts.facilitatorOf ?? []) {
      await c.query(
        `insert into role_grant (id, account_id, role, scope_type, scope_id, granted_via) values (uuidv7(), $1, 'facilitator', 'hometown', $2, 'bootstrap')`,
        [user.id, h],
      );
    }
    for (const h of opts.custodianOf ?? []) {
      await c.query(
        `insert into role_grant (id, account_id, role, scope_type, scope_id, granted_via) values (uuidv7(), $1, 'custodian', 'hometown', $2, 'bootstrap')`,
        [user.id, h],
      );
    }
  });
  const ex = await h.call('/v1/sessions', {
    json: { platform: 'android' },
    headers: { 'x-auth-session': token },
  });
  const s = (await ex.json()) as { accessToken: string };
  const auth = { authorization: `Bearer ${s.accessToken}` };
  return {
    id: user.id,
    /** Calls as this person. Commands get a fresh Idempotency-Key unless one is given. */
    call: (path: string, init: { method?: string; json?: unknown; key?: string } = {}) =>
      h.call(path, {
        method: init.method,
        json: init.json,
        headers: {
          ...auth,
          ...(init.json !== undefined || init.method === 'POST'
            ? { 'idempotency-key': init.key ?? uuidv7() }
            : {}),
        },
      }),
  };
}

export type Person = Awaited<ReturnType<typeof signIn>>;

export const fakeStorage = (h: Harness) => h.deps.storage as FakeStorage;

/** Uploads a file through the real API, with the device's part PUTs simulated on the fake store. */
export async function upload(
  h: Harness,
  who: Person,
  recordingId: string,
  kind: 'audio_raw' | 'consent_evidence' | 'consent_signature',
  bytes = 9 * 1024 * 1024,
  extra: { purpose?: 'capture' | 'consent_change'; mime?: string } = {},
) {
  const id = uuidv7();
  const sha256 = createHash('sha256').update(id).digest('hex');
  const created = await who.call('/v1/uploads', {
    json: {
      id,
      recordingId,
      kind,
      bytes,
      sha256,
      mime: extra.mime ?? (kind === 'consent_signature' ? 'image/jpeg' : 'audio/wav'),
      ...(extra.purpose ? { purpose: extra.purpose } : {}),
    },
  });
  if (created.status !== 201)
    return { id, status: created.status, body: (await created.json()) as Record<string, unknown> };
  const view = (await created.json()) as {
    partSize: number;
    parts: { partNumber: number; url: string }[];
  };
  const store = fakeStorage(h);
  const parts = view.parts.map((p) => {
    const uploadId = new URL(p.url.replace('fake://', 'http://x/')).searchParams.get('uploadId')!;
    const size =
      p.partNumber < view.parts.length
        ? view.partSize
        : bytes - view.partSize * (view.parts.length - 1);
    return { partNumber: p.partNumber, etag: store.putPart(uploadId, p.partNumber, size) };
  });
  const done = await who.call(`/v1/uploads/${id}/complete`, { json: { parts } });
  return { id, status: done.status, body: (await done.json()) as Record<string, unknown> };
}

export const permissions = {
  archive: true,
  lessons: true,
  social: false,
  photo: false,
  machineAssist: false,
};

/** Elder → recording → spoken consent → consent (the order the facilitator app follows). */
export async function captureWithConsent(
  h: Harness,
  f: Person,
  ids: Awaited<ReturnType<typeof seedHometown>>,
  tier: 'oha' | 'umunna' | 'nso' = 'oha',
) {
  const elderId = uuidv7();
  const recordingId = uuidv7();
  const e = await f.call('/v1/elders', {
    json: {
      id: elderId,
      displayName: 'Mama Ada Nwosu',
      hometownId: ids.hometown,
      dialectId: ids.dialect,
      birthYear: 1947,
    },
  });
  if (e.status !== 201) throw new Error(`elder ${e.status} ${await e.text()}`);
  const r = await f.call('/v1/recordings', {
    json: {
      id: recordingId,
      elderId,
      topic: 'story',
      titleIg: 'Akụkọ ọjị',
      recordedAt: new Date().toISOString(),
    },
  });
  if (r.status !== 201) throw new Error(`recording ${r.status} ${await r.text()}`);
  const ev = await upload(h, f, recordingId, 'consent_evidence', 1024 * 1024);
  if (ev.status !== 200) throw new Error(`evidence ${ev.status} ${JSON.stringify(ev.body)}`);
  const consentId = uuidv7();
  const c = await f.call('/v1/consents', {
    json: {
      id: consentId,
      recordingId,
      tier,
      ...(tier === 'umunna' ? { umunnaScope: [ids.hometown] } : {}),
      permissions: tier === 'nso' ? { ...permissions, lessons: false } : permissions,
      evidenceMediaId: ev.id,
      capturedAt: new Date().toISOString(),
    },
  });
  if (c.status !== 201) throw new Error(`consent ${c.status} ${await c.text()}`);
  return { elderId, recordingId, consentId, evidenceId: ev.id };
}

/** What the external audio worker does: claim, PUT outputs, report. */
export async function runWorker(h: Harness, opts: { report?: 'ok' | 'rejected' } = {}) {
  const claimRes = await h.jobs.request('/internal/audio/claim', {
    method: 'POST',
    headers: { authorization: `Bearer ${h.deps.env.AUDIO_WORKER_KEYS[0]}` },
  });
  const claim = (await claimRes.json()) as {
    job: null | {
      jobId: number;
      token: string;
      input: { sha256: string };
      output: Record<string, string>;
    };
  };
  if (!claim.job) return { claimed: false as const };
  const store = fakeStorage(h);
  const outputs: Record<string, { sha256: string; bytes: number }> = {};
  for (const [name, url] of Object.entries(claim.job.output)) {
    const u = new URL(url.replace('fake://', 'http://x/'));
    const [bucket, ...key] = u.pathname.slice(1).split('/');
    const bytes = name === 'peaks' ? 3200 : 500_000;
    store.putObject(bucket as never, key.join('/'), bytes);
    outputs[name] = { sha256: 'b'.repeat(64), bytes };
  }
  const body =
    opts.report === 'rejected'
      ? { status: 'rejected', reason: 'format_not_allowed' }
      : {
          status: 'ok',
          sha256: claim.job.input.sha256,
          durationMs: 1_800_000,
          format: 'wav',
          lufs: -18.2,
          algoVersion: 'audio@1',
          outputs,
        };
  const res = await h.jobs.request(`/internal/audio/${claim.job.jobId}/result`, {
    method: 'POST',
    headers: { authorization: `Bearer ${claim.job.token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { claimed: true as const, status: res.status, body: await res.json(), job: claim.job };
}
