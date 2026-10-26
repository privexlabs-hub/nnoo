import { and, eq, sql } from 'drizzle-orm';
import type { Context, Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { z } from 'zod';
import type { AccountActor, Actor } from './actor.ts';
import type { AppEnv, RequestCtx } from './app-env.ts';
import { sha256Hex } from './crypto.ts';
import type { Deps } from './deps.ts';
import type { Policy } from './policy.ts';
import { DomainError, problem } from './problem.ts';
import type { RouteRateLimit } from './rate-limit.ts';
import { idempotencyKey } from './schema.ts';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
const COMMANDS: readonly Method[] = ['POST', 'PUT', 'PATCH', 'DELETE'];
const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{8,128}$/;
const IN_PROGRESS_STALE_MS = 60_000;

export type HandlerCtx<A extends Actor = Actor> = {
  c: Context<AppEnv>;
  deps: Deps;
  actor: A;
  requestId: string;
  req: RequestCtx;
};

/** A public route must say why it is public; the reason is listed in the authz matrix. */
export type PublicPolicy = { public: string };

export type RouteDef<
  B extends z.ZodType | undefined,
  Q extends z.ZodType | undefined,
  R extends z.ZodType,
> = {
  method: Method;
  path: string;
  body?: B;
  query?: Q;
  /** Required: responses are allow-lists; unknown fields are stripped. */
  response: R;
  status?: 200 | 201;
  /** Required: no default. Either a policy or an explicit public justification. */
  policy: Policy<void> | PublicPolicy;
  rateLimit: RouteRateLimit;
  /** Required for commands. When true, an Idempotency-Key header is mandatory. */
  idempotent?: boolean;
  handler: (
    ctx: HandlerCtx,
    params: Record<string, string>,
    body: B extends z.ZodType ? z.infer<B> : undefined,
    query: Q extends z.ZodType ? z.infer<Q> : undefined,
  ) => Promise<z.input<R>>;
};

export type RegisteredRoute = {
  method: Method;
  path: string;
  policy: string;
  publicReason?: string;
  rateLimit: RouteRateLimit;
  idempotent: boolean;
};

const registries = new WeakMap<Hono<AppEnv>, RegisteredRoute[]>();

/** Every route registered on `app`, for the authz matrix (07 §6). One list per app instance. */
export function registryOf(app: Hono<AppEnv>): RegisteredRoute[] {
  let list = registries.get(app);
  if (!list) registries.set(app, (list = []));
  return list;
}

export class BootError extends Error {
  override name = 'BootError';
}

function zodErrors(error: z.ZodError) {
  return error.issues.map((i) => ({ path: i.path.join('.') || '(root)', message: i.message }));
}

async function readJson(c: Context<AppEnv>): Promise<{ raw: string; value: unknown }> {
  const raw = await c.req.text();
  if (raw.length === 0) return { raw, value: undefined };
  const type = c.req.header('content-type') ?? '';
  if (!type.toLowerCase().startsWith('application/json'))
    throw problem('http.unsupported_media_type', 415);
  try {
    return { raw, value: JSON.parse(raw) };
  } catch {
    throw new DomainError('http.validation_failed', 400, 'Body is not valid JSON.');
  }
}

type Stored = { status: number; body: unknown };

/**
 * Runs `run` at most once per (account, Idempotency-Key). Identical replays get the
 * identical stored response; a reused key with a different body is rejected. Offline
 * mobile replay depends on this (docs/neon/04 §5).
 */
async function withIdempotency(
  deps: Deps,
  actor: AccountActor,
  key: string,
  fingerprint: string,
  method: string,
  path: string,
  run: () => Promise<Stored>,
): Promise<Stored> {
  const { db, clock } = deps;
  const claimed = await db
    .insert(idempotencyKey)
    .values({
      accountId: actor.id,
      key,
      method,
      path,
      requestHash: fingerprint,
      status: 0,
      response: {},
    })
    .onConflictDoNothing()
    .returning({ key: idempotencyKey.key });

  if (claimed.length === 0) {
    const [prev] = await db
      .select()
      .from(idempotencyKey)
      .where(and(eq(idempotencyKey.accountId, actor.id), eq(idempotencyKey.key, key)));
    if (!prev) throw problem('http.idempotency_in_progress', 409);
    if (prev.requestHash !== fingerprint) throw problem('http.idempotency_key_reused', 422);
    if (prev.status !== 0) return { status: prev.status, body: prev.response };
    const stale = clock.now().getTime() - prev.createdAt.getTime() > IN_PROGRESS_STALE_MS;
    if (!stale) throw problem('http.idempotency_in_progress', 409);
    // The earlier attempt died mid-flight: take the key over atomically.
    const took = await db
      .update(idempotencyKey)
      .set({ createdAt: clock.now() })
      .where(
        and(
          eq(idempotencyKey.accountId, actor.id),
          eq(idempotencyKey.key, key),
          eq(idempotencyKey.status, 0),
          eq(idempotencyKey.createdAt, prev.createdAt),
        ),
      )
      .returning({ key: idempotencyKey.key });
    if (took.length === 0) throw problem('http.idempotency_in_progress', 409);
  }

  const where = and(eq(idempotencyKey.accountId, actor.id), eq(idempotencyKey.key, key));
  try {
    const result = await run();
    await db
      .update(idempotencyKey)
      .set({ status: result.status, response: result.body as object })
      .where(where);
    return result;
  } catch (e) {
    if (e instanceof DomainError && e.status < 500) {
      // A deterministic refusal is part of the outcome: replays get the same answer.
      const body = { code: e.code, status: e.status, ...(e.detail ? { detail: e.detail } : {}) };
      await db
        .update(idempotencyKey)
        .set({ status: e.status, response: { problem: body } })
        .where(where);
    } else {
      await db.delete(idempotencyKey).where(sql`${where} and ${idempotencyKey.status} = 0`);
    }
    throw e;
  }
}

export function route<
  B extends z.ZodType | undefined,
  Q extends z.ZodType | undefined,
  R extends z.ZodType,
>(app: Hono<AppEnv>, d: RouteDef<B, Q, R>): void {
  const where = `${d.method} ${d.path}`;
  if (!d.policy) throw new BootError(`BOOT: ${where} has no policy`);
  if ('public' in d.policy && !d.policy.public?.trim())
    throw new BootError(`BOOT: ${where} is public without a reason`);
  if (!d.response) throw new BootError(`BOOT: ${where} has no response schema`);
  if (!d.rateLimit) throw new BootError(`BOOT: ${where} has no rate-limit class`);
  if (COMMANDS.includes(d.method) && d.idempotent === undefined) {
    throw new BootError(`BOOT: ${where} is a command and must declare idempotent`);
  }
  if (d.method === 'GET' && d.body) throw new BootError(`BOOT: ${where} is a GET with a body`);

  const policy = d.policy;
  registryOf(app).push({
    method: d.method,
    path: d.path,
    policy: 'action' in policy ? policy.action : 'public',
    ...('public' in policy ? { publicReason: policy.public } : {}),
    rateLimit: d.rateLimit,
    idempotent: d.idempotent ?? false,
  });

  app.on(d.method, d.path, async (c) => {
    const deps = c.get('deps');
    const req = c.get('ctx');
    const { actor } = req;

    // Actor-level precondition. Resource-level checks happen in the use case, which loads
    // the resource with a scope predicate (06 §4).
    if ('action' in policy) {
      const decision = policy.rule(actor, undefined, { clock: deps.clock });
      if (!decision.allow) throw problem(decision.code, decision.status);
    }

    const limit = await deps.rateLimiter.take(
      d.rateLimit,
      actor.kind === 'account' ? actor.id : `ip:${req.clientIp}`,
    );
    if (!limit.allowed) {
      throw new DomainError('http.rate_limited', 429, undefined, undefined, {
        'Retry-After': String(limit.retryAfterSeconds),
      });
    }

    const { raw, value } = d.body ? await readJson(c) : { raw: '', value: undefined };
    let body: unknown;
    if (d.body) {
      const parsed = d.body.safeParse(value ?? {});
      if (!parsed.success)
        throw new DomainError('http.validation_failed', 400, undefined, zodErrors(parsed.error));
      body = parsed.data;
    }
    let query: unknown;
    if (d.query) {
      const parsed = d.query.safeParse(c.req.query());
      if (!parsed.success)
        throw new DomainError('http.validation_failed', 400, undefined, zodErrors(parsed.error));
      query = parsed.data;
    }

    const execute = async (): Promise<Stored> => {
      const result = await d.handler(
        { c, deps, actor, requestId: req.requestId, req },
        c.req.param() as Record<string, string>,
        body as never,
        query as never,
      );
      // Allow-list: strips fields the schema does not declare; a mismatch is our bug (500).
      return { status: d.status ?? 200, body: d.response.parse(result) };
    };

    let out: Stored;
    if (d.idempotent) {
      if (actor.kind !== 'account') throw problem('auth.unauthenticated', 401);
      const key = c.req.header('idempotency-key');
      if (!key || !IDEMPOTENCY_KEY.test(key)) throw problem('http.idempotency_key_required', 400);
      const fingerprint = sha256Hex(`${d.method} ${c.req.path}\n${raw}`);
      out = await withIdempotency(deps, actor, key, fingerprint, d.method, d.path, execute);
      const stored = out.body as {
        problem?: { code: never; status: ContentfulStatusCode; detail?: string };
      };
      if (stored?.problem)
        throw new DomainError(stored.problem.code, stored.problem.status, stored.problem.detail);
    } else {
      out = await execute();
    }
    return c.json(out.body as object, out.status as ContentfulStatusCode);
  });
}
