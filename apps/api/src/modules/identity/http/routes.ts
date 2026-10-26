import { and, eq, gt } from 'drizzle-orm';
import type { Context, Hono } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { identity } from '@nnoo/contracts';
import type { AccountActor } from '../../../platform/actor.ts';
import type { AppEnv } from '../../../platform/app-env.ts';
import { sha256Hex } from '../../../platform/crypto.ts';
import { DomainError, problem } from '../../../platform/problem.ts';
import { registryOf, route } from '../../../platform/route.ts';
import { getMe, updateMe } from '../application/me.ts';
import {
  createSession,
  endSession,
  refreshSession,
  REFRESH_TOKEN_TTL_MS,
  type IssuedSession,
} from '../application/sessions.ts';
import {
  endSession as endSessionPolicy,
  readMe,
  updateMe as updateMePolicy,
} from '../domain/policies.ts';
import { AUTH_BASE_PATH, AUTH_ROUTE_ALLOWLIST, OTP_SEND_ROUTES } from '../infrastructure/auth.ts';
import { authSession } from '../infrastructure/schema.ts';

const REFRESH_COOKIE = 'nnoo_refresh';
const SESSION_PATH = '/v1/sessions';

function secureCookies(c: Context<AppEnv>): boolean {
  const env = c.get('deps').env.NNOO_ENV;
  return env !== 'local' && env !== 'test';
}

/** Cookie-borne credentials need a trusted Origin (CSRF); bearer headers do not. */
function assertTrustedOrigin(c: Context<AppEnv>): void {
  const origin = c.req.header('origin');
  const { AUTH_TRUSTED_ORIGINS, AUTH_BASE_URL } = c.get('deps').env;
  const trusted = new Set([new URL(AUTH_BASE_URL).origin, ...AUTH_TRUSTED_ORIGINS]);
  if (!origin || !trusted.has(origin)) throw problem('http.forbidden_origin', 403);
}

function toView(
  s: IssuedSession,
  transport: 'body' | 'cookie',
  c: Context<AppEnv>,
): identity.SessionView {
  if (transport === 'cookie') {
    setCookie(c, REFRESH_COOKIE, s.refreshToken, {
      httpOnly: true,
      secure: secureCookies(c),
      sameSite: 'Strict',
      path: SESSION_PATH,
      maxAge: Math.floor(REFRESH_TOKEN_TTL_MS / 1000),
    });
  }
  return {
    sessionId: s.sessionId,
    deviceId: s.deviceId,
    accessToken: s.accessToken,
    accessTokenExpiresAt: s.accessTokenExpiresAt.toISOString(),
    ...(transport === 'body' ? { refreshToken: s.refreshToken } : {}),
    refreshTokenExpiresAt: s.refreshTokenExpiresAt.toISOString(),
  };
}

/** Finds the completed Better Auth ceremony: `X-Auth-Session: <token>` (mobile) or its cookie (web). */
async function ceremonyFrom(c: Context<AppEnv>) {
  const { db, auth, clock } = c.get('deps');
  const headerToken = c.req.header('x-auth-session');
  if (headerToken) {
    const [s] = await db
      .select({ id: authSession.id, userId: authSession.userId, amr: authSession.amr })
      .from(authSession)
      .where(and(eq(authSession.token, headerToken), gt(authSession.expiresAt, clock.now())));
    if (!s) throw problem('identity.session_required', 401);
    return { authSessionId: s.id, userId: s.userId, amr: s.amr };
  }
  assertTrustedOrigin(c);
  const result = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!result) throw problem('identity.session_required', 401);
  const session = result.session as { id: string; userId: string; amr?: string | null };
  return { authSessionId: session.id, userId: session.userId, amr: session.amr ?? null };
}

export function identityRoutes(app: Hono<AppEnv>): void {
  // ── Better Auth ceremonies, allow-listed ────────────────────────────────────
  registryOf(app).push({
    method: 'POST',
    path: `${AUTH_BASE_PATH}/*`,
    policy: 'public',
    publicReason: 'sign-in ceremonies (OTP, passkey); only AUTH_ROUTE_ALLOWLIST paths are served',
    rateLimit: 'auth',
    idempotent: false,
  });
  app.on(['GET', 'POST'], `${AUTH_BASE_PATH}/*`, async (c) => {
    const deps = c.get('deps');
    const sub = c.req.path.slice(AUTH_BASE_PATH.length);
    const key = `${c.req.method} ${sub}`;
    if (!AUTH_ROUTE_ALLOWLIST.has(key)) throw problem('http.not_found', 404);
    const channelOff =
      (sub.startsWith('/phone-number/') && deps.env.SMS_PROVIDER === 'none') ||
      ((sub.startsWith('/email-otp/') || sub === '/sign-in/email-otp') &&
        deps.env.EMAIL_PROVIDER === 'none');
    if (channelOff)
      throw problem('service.unavailable', 503, 'This sign-in method is not available yet.');

    const ip = c.get('ctx').clientIp;
    const general = await deps.rateLimiter.take('auth', `ip:${ip}`);
    if (!general.allowed) {
      throw new DomainError('http.rate_limited', 429, undefined, undefined, {
        'Retry-After': String(general.retryAfterSeconds),
      });
    }
    if (OTP_SEND_ROUTES.has(key)) {
      const body = (await c.req.raw
        .clone()
        .json()
        .catch(() => ({}))) as { phoneNumber?: unknown; email?: unknown };
      const destination =
        typeof body.phoneNumber === 'string'
          ? body.phoneNumber
          : typeof body.email === 'string'
            ? body.email.toLowerCase()
            : '';
      for (const [cls, subject] of [
        ['otpIp', `ip:${ip}`],
        ['otpDestination', `dest:${sha256Hex(destination)}`],
      ] as const) {
        const r = await deps.rateLimiter.take(cls, subject);
        if (!r.allowed) {
          throw new DomainError('http.rate_limited', 429, undefined, undefined, {
            'Retry-After': String(r.retryAfterSeconds),
          });
        }
      }
    }
    return deps.auth.handler(c.req.raw);
  });

  // ── Session families ────────────────────────────────────────────────────────
  route(app, {
    method: 'POST',
    path: SESSION_PATH,
    body: identity.CreateSessionBody,
    response: identity.SessionView,
    status: 201,
    policy: {
      public:
        'exchanges a completed sign-in ceremony; the ceremony session is verified in the handler',
    },
    rateLimit: 'auth',
    idempotent: false, // each ceremony session can be exchanged once (unique auth_session_id)
    handler: async ({ c, deps, requestId }, _p, body) => {
      const ceremony = await ceremonyFrom(c);
      const issued = await createSession(deps, ceremony, body, requestId);
      return toView(issued, body.refreshTokenTransport, c);
    },
  });

  route(app, {
    method: 'POST',
    path: `${SESSION_PATH}/refresh`,
    body: identity.RefreshSessionBody,
    response: identity.SessionView,
    policy: {
      public:
        'presents a refresh token, which is verified, rotated and reuse-checked in the handler',
    },
    rateLimit: 'auth',
    idempotent: false, // single-use by design; a replay is reuse and revokes the family
    handler: async ({ c, deps, requestId }, _p, body) => {
      const fromCookie = !body.refreshToken;
      if (fromCookie) assertTrustedOrigin(c);
      const raw = body.refreshToken ?? getCookie(c, REFRESH_COOKIE);
      if (!raw) throw problem('identity.refresh_invalid', 401);
      try {
        const issued = await refreshSession(deps, raw, c.req.header('x-device-id'), requestId);
        return toView(issued, fromCookie ? 'cookie' : 'body', c);
      } catch (e) {
        if (fromCookie) deleteCookie(c, REFRESH_COOKIE, { path: SESSION_PATH });
        throw e;
      }
    },
  });

  route(app, {
    method: 'DELETE',
    path: `${SESSION_PATH}/current`,
    response: identity.SignedOutView,
    policy: endSessionPolicy,
    rateLimit: 'write',
    idempotent: false, // signing out twice is harmless
    handler: async ({ c, deps, actor, requestId }) => {
      const a = actor as AccountActor;
      await endSession(deps, a.id, a.sessionId, requestId);
      deps.actors.invalidate(a.id);
      deleteCookie(c, REFRESH_COOKIE, { path: SESSION_PATH });
      return { signedOut: true as const };
    },
  });

  // ── Profile ─────────────────────────────────────────────────────────────────
  route(app, {
    method: 'GET',
    path: '/v1/me',
    response: identity.MeView,
    policy: readMe,
    rateLimit: 'read',
    handler: ({ deps, actor }) => getMe(deps, actor as AccountActor),
  });

  route(app, {
    method: 'PATCH',
    path: '/v1/me',
    body: identity.UpdateMeBody,
    response: identity.MeView,
    policy: updateMePolicy,
    rateLimit: 'write',
    idempotent: false, // setting the same fields twice yields the same state
    handler: ({ deps, actor, requestId }, _p, body) =>
      updateMe(deps, actor as AccountActor, body, requestId),
  });
}
