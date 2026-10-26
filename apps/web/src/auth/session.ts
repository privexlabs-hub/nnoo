import { identity } from '@nnoo/contracts';
import { ApiError, http, parse, type RequestOptions } from '../api/client.ts';
import { readDeviceId, rememberDeviceId } from './device.ts';

/**
 * Web sessions (ADR-028): the 10-minute access token lives only in memory; the rotating
 * refresh token is an httpOnly cookie scoped to /v1/sessions, so script can never read it.
 * A reload refreshes from the cookie. Reuse of an old refresh token revokes the whole family.
 */
type Listener = (signedIn: boolean) => void;

let access: { token: string; expiresAt: number } | null = null;
let refreshing: Promise<boolean> | null = null;
const listeners = new Set<Listener>();

function set(s: identity.SessionView | null): void {
  access = s ? { token: s.accessToken, expiresAt: Date.parse(s.accessTokenExpiresAt) } : null;
  if (s) rememberDeviceId(s.deviceId);
  for (const l of listeners) l(access !== null);
}

export function onSessionChange(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export const isSignedIn = () => access !== null;

/** Exchanges a completed Better Auth ceremony (its httpOnly cookie) for an app session. */
export async function exchangeCeremony(): Promise<void> {
  const deviceId = readDeviceId();
  const res = await http('/v1/sessions', {
    json: {
      platform: 'web',
      refreshTokenTransport: 'cookie',
      ...(deviceId ? { deviceId } : {}),
      deviceLabel: navigator.userAgent.slice(0, 80),
    },
  });
  set(await parse(res, identity.SessionView));
}

/**
 * Rotates the refresh cookie. Callers in this tab share one request, and tabs take turns through
 * a Web Lock: two tabs presenting the same cookie at once would look like reuse and revoke the
 * family. The second tab then sends the cookie the first one just rotated.
 */
export function refresh(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.locks)
        return await navigator.locks.request('nnoo.refresh', rotate);
      return await rotate();
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

async function rotate(): Promise<boolean> {
  const deviceId = readDeviceId();
  const res = await http('/v1/sessions/refresh', {
    json: {},
    headers: deviceId ? { 'x-device-id': deviceId } : {},
  });
  if (res.status === 401 || res.status === 403) {
    set(null); // no cookie, expired, reused or revoked: sign in again
    return false;
  }
  set(await parse(res, identity.SessionView));
  return true;
}

/** An authenticated call: refreshes ahead of expiry, and once more if the server says 401. */
export async function authed(path: string, opts: RequestOptions = {}): Promise<Response> {
  if (!access || access.expiresAt - Date.now() < 30_000) {
    if (!(await refresh())) throw new ApiError(401, 'identity.session_required');
  }
  const send = () =>
    http(path, { ...opts, headers: { ...opts.headers, authorization: `Bearer ${access!.token}` } });
  const res = await send();
  if (res.status !== 401) return res;
  if (!(await refresh())) throw new ApiError(401, 'identity.session_required');
  return send();
}

export async function signOut(): Promise<void> {
  try {
    if (access) await authed('/v1/sessions/current', { method: 'DELETE' });
    await http('/v1/auth/sign-out', { json: {} }); // ends the ceremony cookie too, if still live
  } finally {
    set(null);
  }
}

/** Test seam only. */
export function resetSessionForTests(): void {
  access = null;
  refreshing = null;
  listeners.clear();
}
