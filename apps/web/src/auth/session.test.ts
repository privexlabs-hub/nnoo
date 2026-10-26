import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authed, exchangeCeremony, isSignedIn, refresh, resetSessionForTests } from './session.ts';

const session = (n: number) => ({
  sessionId: '0190a000-0000-7000-8000-000000000001',
  deviceId: '0190a000-0000-7000-8000-000000000002',
  accessToken: `access-${n}`,
  accessTokenExpiresAt: new Date(Date.now() + 600_000).toISOString(),
  refreshTokenExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
});
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  resetSessionForTests();
  localStorage.clear();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('web session', () => {
  it('asks for the refresh token as a cookie and never stores tokens in web storage', async () => {
    fetchMock.mockResolvedValueOnce(json(201, session(1)));
    await exchangeCeremony();
    const [, init] = fetchMock.mock.calls[0]!;
    expect(JSON.parse(init.body)).toMatchObject({
      platform: 'web',
      refreshTokenTransport: 'cookie',
    });
    expect(init.credentials).toBe('include');
    expect(isSignedIn()).toBe(true);
    const stored = JSON.stringify({ ...localStorage });
    expect(stored).not.toContain('access-1');
    expect(stored).toContain(session(1).deviceId); // the device id is not a secret
  });

  it('shares one refresh between concurrent callers (a second would be reuse)', async () => {
    fetchMock.mockResolvedValue(json(200, session(2)));
    const results = await Promise.all([refresh(), refresh(), refresh()]);
    expect(results).toEqual([true, true, true]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('signs out when the refresh cookie is refused', async () => {
    fetchMock.mockResolvedValueOnce(json(401, { code: 'identity.refresh_reused', status: 401 }));
    expect(await refresh()).toBe(false);
    expect(isSignedIn()).toBe(false);
  });

  it('sends the bearer token, and refreshes once on a 401', async () => {
    fetchMock
      .mockResolvedValueOnce(json(201, session(1)))
      .mockResolvedValueOnce(json(401, { code: 'identity.session_required' }))
      .mockResolvedValueOnce(json(200, session(3)))
      .mockResolvedValueOnce(json(200, { ok: true }));
    await exchangeCeremony();
    const res = await authed('/v1/me');
    expect(res.status).toBe(200);
    expect(fetchMock.mock.calls[1]![1].headers.authorization).toBe('Bearer access-1');
    expect(fetchMock.mock.calls[3]![1].headers.authorization).toBe('Bearer access-3');
  });
});
