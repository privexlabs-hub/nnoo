import type { Context, MiddlewareHandler } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { uuidv7 } from 'uuidv7';
import { ANONYMOUS, type Actor } from './actor.ts';
import type { AppEnv } from './app-env.ts';
import { actorHash, constantTimeEqual } from './crypto.ts';
import type { Deps } from './deps.ts';
import { DomainError, problem, problemResponse } from './problem.ts';

const REQUEST_ID = /^[A-Za-z0-9._-]{8,128}$/;
export const MAX_BODY_BYTES = 1024 * 1024; // 1 MB on /v1; media goes straight to storage (07 §2)

export const injectDeps =
  (deps: Deps): MiddlewareHandler<AppEnv> =>
  async (c, next) => {
    c.set('deps', deps);
    await next();
  };

/** 1. Accept the edge's X-Request-Id or create one; echo it on every response. */
export const requestId: MiddlewareHandler<AppEnv> = async (c, next) => {
  const incoming = c.req.header('x-request-id');
  const id = incoming && REQUEST_ID.test(incoming) ? incoming : uuidv7();
  c.set('requestId', id);
  c.header('X-Request-Id', id);
  await next();
};

/** 2. One JSON line per request: route, status, duration, hashed actor. No bodies, no PII. */
export const accessLog: MiddlewareHandler<AppEnv> = async (c, next) => {
  const started = performance.now();
  await next();
  const { log, env } = c.get('deps');
  const ctx = c.get('ctx') as AppEnv['Variables']['ctx'] | undefined;
  const actor = ctx?.actor;
  log.info('request', {
    request_id: c.get('requestId'),
    method: c.req.method,
    route: c.req.routePath,
    status: c.res.status,
    ms: Math.round(performance.now() - started),
    actor_hash: actor?.kind === 'account' ? actorHash(actor.id, env.AUTH_SECRET) : undefined,
  });
};

/**
 * 3. ADR-023: /v1 is reachable only through the edge proxy, which adds X-Edge-Auth.
 * Without it the route answers 404, so the raw function URL reveals nothing.
 */
export const edgeAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const presented = c.req.header('x-edge-auth');
  const secrets = c.get('deps').env.EDGE_AUTH_SECRETS;
  const ok = presented !== undefined && secrets.some((s) => constantTimeEqual(presented, s));
  if (!ok) return problemResponse(c, problem('http.not_found', 404));
  await next();
};

/** 4. Browser origins on an allow-list. Mobile apps are not CORS-bound. */
export const corsAllowList: MiddlewareHandler<AppEnv> = async (c, next) => {
  const allowed = c.get('deps').env.CORS_ALLOWED_ORIGINS;
  return cors({
    origin: (origin) => (allowed.includes(origin) ? origin : null),
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: [
      'Authorization',
      'Content-Type',
      'Idempotency-Key',
      'If-Match',
      'X-Client',
      'X-Device-Id',
      'X-Request-Id',
    ],
    exposeHeaders: ['ETag', 'Retry-After', 'X-Request-Id'],
    maxAge: 600,
  })(c, next);
};

function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/** 5. `X-Client: mobile/1.8.2`. Below the platform's minimum → 426 (02 §6, S-16). */
export const clientVersion: MiddlewareHandler<AppEnv> = async (c, next) => {
  const header = c.req.header('x-client');
  const m = header ? /^([a-z]+)\/(\d+\.\d+\.\d+)$/.exec(header) : null;
  if (m) {
    const min = c.get('deps').env.MIN_CLIENT_VERSIONS[m[1]!];
    if (min && compareSemver(m[2]!, min) < 0) {
      throw new DomainError(
        'client.upgrade_required',
        426,
        `Minimum supported ${m[1]} version is ${min}.`,
      );
    }
  }
  await next();
};

export function clientIpOf(c: Context): string {
  // Trusted only because edgeAuth proved the request came through our edge.
  const cf = c.req.header('cf-connecting-ip');
  if (cf) return cf;
  const xff = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
  return xff || 'unknown';
}

/**
 * 6. Verifies a Bearer access token (if present) and loads the Actor. A bad token is a
 * 401, never a silent downgrade to anonymous. Identity comes only from the token.
 */
export const authenticate: MiddlewareHandler<AppEnv> = async (c, next) => {
  const deps = c.get('deps');
  const header = c.req.header('authorization');
  let actor: Actor = ANONYMOUS;
  if (header !== undefined) {
    const m = /^Bearer ([A-Za-z0-9._~+/=-]+)$/.exec(header);
    if (!m) throw problem('auth.token_invalid', 401);
    const claims = await deps.tokens.verify(m[1]!);
    actor = await deps.actors.load(claims);
  }
  const requestId = c.get('requestId');
  c.set('ctx', {
    actor,
    requestId,
    clientIp: clientIpOf(c),
    log: deps.log.child({ request_id: requestId }),
  });
  await next();
};

export const limitBody: MiddlewareHandler<AppEnv> = bodyLimit({
  maxSize: MAX_BODY_BYTES,
  onError: () => {
    throw problem('http.payload_too_large', 413);
  },
});

type PgLikeError = { code?: string; constraint?: string; message?: string };

/** 9. Maps failures to RFC 9457. Never leaks SQL, stack traces or row values. */
export function onError(err: Error, c: Context<AppEnv>): Response {
  if (err instanceof DomainError) return problemResponse(c, err);
  if (err instanceof HTTPException) {
    const status = err.status;
    const code =
      status === 413
        ? 'http.payload_too_large'
        : status === 404
          ? 'http.not_found'
          : 'http.validation_failed';
    return problemResponse(c, problem(code, status === 413 || status === 404 ? status : 400));
  }

  const deps = c.get('deps') as Deps | undefined;
  const pg = err as PgLikeError;
  const fields = {
    request_id: c.get('requestId'),
    route: c.req.routePath,
    error: err.name,
    pg_code: pg.code,
    constraint: pg.constraint,
  };
  // A check_violation raised by an INV-* trigger means a domain check was bypassed: page on-call.
  if (pg.code === '23514' && pg.message?.startsWith('INV-')) {
    deps?.log.error('invariant violation', {
      ...fields,
      page: true,
      invariant: pg.message.split(':')[0],
    });
    return problemResponse(c, problem('invariant.violation', 500));
  }
  deps?.log.error('unhandled error', fields);
  return problemResponse(c, problem('internal.error', 500));
}

export const notFound = (c: Context<AppEnv>) => problemResponse(c, problem('http.not_found', 404));
