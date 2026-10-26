import { SignJWT, generateKeyPair } from 'jose';
import { afterAll, describe, expect, it } from 'vitest';
import { ACTOR_CACHE_MS } from '../../src/modules/identity/application/actors.ts';
import { asOwner, harness, signInWithPhone, testPhone } from './harness.ts';

const h = harness();
afterAll(() => h.close());

const bearer = (t: string) => ({ authorization: `Bearer ${t}` });

describe('phone OTP sign-in → session exchange → /v1/me', () => {
  it('signs a new person up, creates an account and returns capabilities, never roles', async () => {
    const s = await signInWithPhone(h);
    const me = await h.call('/v1/me', { headers: bearer(s.accessToken) });
    expect(me.status).toBe(200);
    const body = (await me.json()) as Record<string, unknown>;
    expect(body).toMatchObject({
      identityLevel: 'basic',
      ageBand: null,
      capabilities: { canEditProfile: true, canVoteInIkpe: false, canPostInOha: false },
    });
    expect(body).not.toHaveProperty('roles');
    expect(JSON.stringify(body)).not.toContain(s.phone);
  });

  it('keeps contact details out of the domain tables', async () => {
    const s = await signInWithPhone(h);
    const rows = await asOwner((c) =>
      c.query(
        `select row_to_json(a)::text as j from account a where id = (select user_id from auth.session where token = $1)`,
        [s.ceremonyToken],
      ),
    );
    expect(rows.rows[0]?.j).not.toContain(s.phone.slice(1));
  });

  it('lets a sign-in ceremony be exchanged only once', async () => {
    const s = await signInWithPhone(h);
    const again = await h.call('/v1/sessions', {
      json: { platform: 'android' },
      headers: { 'x-auth-session': s.ceremonyToken },
    });
    expect(again.status).toBe(401);
    expect(await again.json()).toMatchObject({ code: 'identity.session_required' });
  });

  it('records the sign-in method as amr=otp', async () => {
    const s = await signInWithPhone(h);
    const amr = await asOwner((c) =>
      c.query<{ amr: string[] }>(`select amr from session_family where id = $1`, [s.sessionId]),
    );
    expect(amr.rows[0]!.amr).toEqual(['otp']);
  });

  it('locks a code after 5 wrong attempts', async () => {
    const phone = testPhone();
    await h.call('/v1/auth/phone-number/send-otp', { json: { phoneNumber: phone } });
    const code = h.inbox.latestCode(phone)!;
    const wrong = code === '000000' ? '111111' : '000000';
    for (let i = 0; i < 5; i++)
      await h.call('/v1/auth/phone-number/verify', { json: { phoneNumber: phone, code: wrong } });
    const right = await h.call('/v1/auth/phone-number/verify', {
      json: { phoneNumber: phone, code },
    });
    expect(right.status).toBeGreaterThanOrEqual(400);
  });

  it('rejects phone numbers that are not E.164', async () => {
    const res = await h.call('/v1/auth/phone-number/send-otp', {
      json: { phoneNumber: '08012345678' },
    });
    expect(res.status).toBe(400);
  });
});

describe('email OTP sign-in (alternative and recovery channel)', () => {
  it('signs in with an emailed code and records amr=otp', async () => {
    const email = `learner-${Date.now()}-${Math.random().toString(36).slice(2)}@test.nnoo.invalid`;
    const sent = await h.call('/v1/auth/email-otp/send-verification-otp', {
      json: { email, type: 'sign-in' },
    });
    expect(sent.status).toBe(200);
    const otp = h.inbox.latestCode(email)!;
    const signed = await h.call('/v1/auth/sign-in/email-otp', { json: { email, otp } });
    expect(signed.status).toBe(200);
    const { token } = (await signed.json()) as { token: string };
    const ex = await h.call('/v1/sessions', {
      json: { platform: 'web' },
      headers: { 'x-auth-session': token },
    });
    expect(ex.status).toBe(201);
  });

  it('stores email codes hashed, never in plain text', async () => {
    const email = `hash-${Date.now()}@test.nnoo.invalid`;
    await h.call('/v1/auth/email-otp/send-verification-otp', { json: { email, type: 'sign-in' } });
    const otp = h.inbox.latestCode(email)!;
    const rows = await asOwner((c) =>
      c.query<{ value: string }>(`select value from auth.verification where identifier like $1`, [
        `%${email}%`,
      ]),
    );
    expect(rows.rows.length).toBeGreaterThan(0);
    for (const r of rows.rows) expect(r.value).not.toContain(otp);
  });
});

describe('access tokens', () => {
  it('expire after 10 minutes', async () => {
    const local = harness();
    try {
      const s = await signInWithPhone(local);
      expect((await local.call('/v1/me', { headers: bearer(s.accessToken) })).status).toBe(200);
      local.clock.advance(10 * 60_000 + 6_000);
      const res = await local.call('/v1/me', { headers: bearer(s.accessToken) });
      expect(res.status).toBe(401);
      expect(await res.json()).toMatchObject({ code: 'auth.token_invalid' });
    } finally {
      await local.close();
    }
  });

  it('reject tokens signed by any other key, even with valid-looking claims', async () => {
    const s = await signInWithPhone(h);
    const { privateKey } = await generateKeyPair('EdDSA', { crv: 'Ed25519' });
    const forged = await new SignJWT({ sid: s.sessionId, ver: 1, amr: ['passkey'] })
      .setProtectedHeader({ alg: 'EdDSA' })
      .setSubject(
        (
          (await (await h.call('/v1/me', { headers: bearer(s.accessToken) })).json()) as {
            id: string;
          }
        ).id,
      )
      .setIssuer('http://localhost:8787')
      .setAudience('nnoo-api')
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);
    expect((await h.call('/v1/me', { headers: bearer(forged) })).status).toBe(401);
  });

  it('reject a token whose alg is changed to none', async () => {
    const s = await signInWithPhone(h);
    const [, payload] = s.accessToken.split('.');
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    expect((await h.call('/v1/me', { headers: bearer(`${header}.${payload}.`) })).status).toBe(401);
  });
});

describe('refresh rotation with reuse detection (06 §2)', () => {
  it('rotates: each refresh token works once and returns a new one', async () => {
    const s = await signInWithPhone(h);
    const r1 = await h.call('/v1/sessions/refresh', {
      json: { refreshToken: s.refreshToken },
      headers: { 'x-device-id': s.deviceId },
    });
    expect(r1.status).toBe(200);
    const n1 = (await r1.json()) as { refreshToken: string; accessToken: string };
    expect(n1.refreshToken).not.toBe(s.refreshToken);
    expect((await h.call('/v1/me', { headers: bearer(n1.accessToken) })).status).toBe(200);
  });

  it('revokes the whole family when an old refresh token is replayed', async () => {
    const local = harness();
    try {
      const s = await signInWithPhone(local);
      const dev = { 'x-device-id': s.deviceId };
      const r1 = (await (
        await local.call('/v1/sessions/refresh', {
          json: { refreshToken: s.refreshToken },
          headers: dev,
        })
      ).json()) as {
        refreshToken: string;
        accessToken: string;
      };
      const replay = await local.call('/v1/sessions/refresh', {
        json: { refreshToken: s.refreshToken },
        headers: dev,
      });
      expect(replay.status).toBe(401);
      expect(await replay.json()).toMatchObject({ code: 'identity.refresh_reused' });
      // The legitimate holder's newer token is dead too: the family is revoked.
      const next = await local.call('/v1/sessions/refresh', {
        json: { refreshToken: r1.refreshToken },
        headers: dev,
      });
      expect(next.status).toBe(401);
      // Access tokens of the family stop working once the actor cache window passes.
      local.clock.advance(ACTOR_CACHE_MS + 1_000);
      expect((await local.call('/v1/me', { headers: bearer(r1.accessToken) })).status).toBe(401);
      const audit = await asOwner((c) =>
        c.query(
          `select detail->>'reason' as reason from audit_log where resource_id = $1 and action = 'identity.session_revoked'`,
          [s.sessionId],
        ),
      );
      expect(audit.rows).toEqual([{ reason: 'refresh_reuse' }]);
    } finally {
      await local.close();
    }
  });

  it('treats a refresh from another device as theft and revokes the family', async () => {
    const s = await signInWithPhone(h);
    const res = await h.call('/v1/sessions/refresh', {
      json: { refreshToken: s.refreshToken },
      headers: { 'x-device-id': crypto.randomUUID() },
    });
    expect(res.status).toBe(401);
    const ok = await h.call('/v1/sessions/refresh', {
      json: { refreshToken: s.refreshToken },
      headers: { 'x-device-id': s.deviceId },
    });
    expect(ok.status).toBe(401);
  });

  it('rejects unknown refresh tokens without revealing anything', async () => {
    const res = await h.call('/v1/sessions/refresh', {
      json: { refreshToken: 'x'.repeat(43) },
      headers: { 'x-device-id': crypto.randomUUID() },
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: 'identity.refresh_invalid' });
  });

  it('sign-out ends the session: refresh fails afterwards', async () => {
    const s = await signInWithPhone(h);
    const out = await h.call('/v1/sessions/current', {
      method: 'DELETE',
      headers: bearer(s.accessToken),
    });
    expect(out.status).toBe(200);
    const res = await h.call('/v1/sessions/refresh', {
      json: { refreshToken: s.refreshToken },
      headers: { 'x-device-id': s.deviceId },
    });
    expect(res.status).toBe(401);
  });

  it('a suspended account cannot refresh and its tokens stop working', async () => {
    const local = harness();
    try {
      const s = await signInWithPhone(local);
      const me = (await (
        await local.call('/v1/me', { headers: bearer(s.accessToken) })
      ).json()) as { id: string };
      await asOwner((c) =>
        c.query(
          `update account set status = 'suspended', auth_version = auth_version + 1 where id = $1`,
          [me.id],
        ),
      );
      local.clock.advance(ACTOR_CACHE_MS + 1_000);
      expect((await local.call('/v1/me', { headers: bearer(s.accessToken) })).status).toBe(401);
      const r = await local.call('/v1/sessions/refresh', {
        json: { refreshToken: s.refreshToken },
        headers: { 'x-device-id': s.deviceId },
      });
      expect(r.status).toBe(403);
      expect(await r.json()).toMatchObject({ code: 'identity.suspended' });
    } finally {
      await local.close();
    }
  });
});

describe('trusted identity comes only from the token', () => {
  it('ignores client-supplied identity fields: unknown fields are rejected', async () => {
    const s = await signInWithPhone(h);
    const res = await h.call('/v1/me', {
      method: 'PATCH',
      headers: bearer(s.accessToken),
      json: { id: crypto.randomUUID(), roles: ['moderator'], displayName: 'Ada' },
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: 'http.validation_failed' });
  });

  it('updates only the caller and keeps Igbo text byte-identical (NFC round trip)', async () => {
    const s = await signInWithPhone(h);
    const name = 'Ụ̀zọ́ Nwáńnọ̀';
    const res = await h.call('/v1/me', {
      method: 'PATCH',
      headers: bearer(s.accessToken),
      json: { displayName: name.normalize('NFC') },
    });
    expect(res.status).toBe(200);
    expect(((await res.json()) as { displayName: string }).displayName).toBe(name.normalize('NFC'));
    const nfd = await h.call('/v1/me', {
      method: 'PATCH',
      headers: bearer(s.accessToken),
      json: { displayName: name.normalize('NFD') },
    });
    expect(nfd.status).toBe(400);
  });

  it('does not adopt someone else’s device id at sign-in', async () => {
    const a = await signInWithPhone(h);
    const phone = testPhone();
    await h.call('/v1/auth/phone-number/send-otp', { json: { phoneNumber: phone } });
    const v = await h.call('/v1/auth/phone-number/verify', {
      json: { phoneNumber: phone, code: h.inbox.latestCode(phone)! },
    });
    const { token } = (await v.json()) as { token: string };
    const ex = await h.call('/v1/sessions', {
      json: { platform: 'android', deviceId: a.deviceId },
      headers: { 'x-auth-session': token },
    });
    expect(((await ex.json()) as { deviceId: string }).deviceId).not.toBe(a.deviceId);
  });
});

describe('web refresh cookie', () => {
  it('is httpOnly, SameSite=Strict, scoped to /v1/sessions, and needs a trusted Origin', async () => {
    const phone = testPhone();
    await h.call('/v1/auth/phone-number/send-otp', { json: { phoneNumber: phone } });
    const v = await h.call('/v1/auth/phone-number/verify', {
      json: { phoneNumber: phone, code: h.inbox.latestCode(phone)! },
    });
    const { token } = (await v.json()) as { token: string };
    const ex = await h.call('/v1/sessions', {
      json: { platform: 'web', refreshTokenTransport: 'cookie' },
      headers: { 'x-auth-session': token },
    });
    expect(ex.status).toBe(201);
    const body = (await ex.json()) as { refreshToken?: string; deviceId: string };
    expect(body.refreshToken).toBeUndefined();
    const cookie = ex.headers.get('set-cookie')!;
    expect(cookie).toMatch(/nnoo_refresh=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
    expect(cookie).toMatch(/Path=\/v1\/sessions/);
    const jar = cookie.split(';')[0]!;

    const noOrigin = await h.call('/v1/sessions/refresh', {
      json: {},
      headers: { cookie: jar, 'x-device-id': body.deviceId },
    });
    expect(noOrigin.status).toBe(403);
    expect(await noOrigin.json()).toMatchObject({ code: 'http.forbidden_origin' });
    const ok = await h.call('/v1/sessions/refresh', {
      json: {},
      headers: { cookie: jar, 'x-device-id': body.deviceId, origin: 'http://localhost:5173' },
    });
    expect(ok.status).toBe(200);
  });
});

describe('OTP sending limits (07 §2)', () => {
  it('allows 3 codes per number per 15 minutes, then 429 with Retry-After', async () => {
    const limited = harness({ realRateLimits: true });
    try {
      const phone = testPhone();
      const statuses: number[] = [];
      for (let i = 0; i < 4; i++) {
        const res = await limited.call('/v1/auth/phone-number/send-otp', {
          json: { phoneNumber: phone },
          headers: { 'cf-connecting-ip': `198.51.100.${i + 10}` }, // different IPs: the per-number limit applies
        });
        statuses.push(res.status);
        if (res.status === 429) expect(Number(res.headers.get('retry-after'))).toBeGreaterThan(0);
      }
      expect(statuses).toEqual([200, 200, 200, 429]);
    } finally {
      await limited.close();
    }
  });
});
