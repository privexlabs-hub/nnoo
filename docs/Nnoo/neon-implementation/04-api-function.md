# 04 · The API function

## 1. Entrypoints

```typescript
// apps/api/src/function.api.ts
import { Hono } from 'hono';
import { platform } from './platform/http';        // request id, logging, errors, edge auth, CORS, auth
import { registerModules } from './modules/register';

const app = new Hono<AppEnv>();
platform(app, { surface: 'public' });
registerModules(app, ['identity', 'community', 'consent', 'media', 'archive', 'ikpe',
                      'learning', 'oha', 'payments', 'notify', 'governance', 'calendar']);
export default app;
```

```typescript
// apps/api/src/function.jobs.ts
import { Hono } from 'hono';
import { platform } from './platform/http';
import { internalRoutes } from './platform/internal';   // /internal/* (06)

const app = new Hono<AppEnv>();
platform(app, { surface: 'internal' });              // no CORS, no edge secret, trigger/service auth instead
internalRoutes(app);
export default app;
```

Both functions import the **same modules**. A sweep in `jobs` calls `ikpe.evaluate()`, exactly as a vote in `api` does, so no rule exists twice.

## 2. Platform middleware (order matters)

| # | Middleware | Behaviour |
|---|---|---|
| 1 | `requestId` | accepts `X-Request-Id` from the edge or generates one, and echoes it |
| 2 | `logger` | JSON logs: `request_id`, `route`, `status`, `ms`, `actor_hash`. No bodies, no PII. |
| 3 | `edgeAuth` (public only) | rejects `/v1/*` without a valid `X-Edge-Auth` (constant-time compare) → 404 |
| 4 | `cors` (public only) | allow-list: `https://app.nnoo.app`, `https://admin.nnoo.app`, preview origins on preview branches. Mobile is not CORS-bound. |
| 5 | `clientVersion` | parses `X-Client`. Below `min_supported` → `426` with store links. |
| 6 | `authenticate` | verifies the Bearer JWT through JWKS (cached), loads `Actor` with roles (60 s cache, invalidated by `RoleGranted`/`RoleRevoked` events) |
| 7 | `rateLimit` | per route class. Coarse limits at the edge, per-account limits in `rate_limit_bucket`. |
| 8 | `idempotency` | for routes declared `idempotent: true` |
| 9 | `errorHandler` | maps domain errors to `application/problem+json` with a stable `code` |

## 3. Default-deny routing

```typescript
// apps/api/src/platform/route.ts
import type { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { ZodTypeAny, z } from 'zod';
import { policies } from './policies';                    // union of every module's policy table

type RouteDef<B extends ZodTypeAny, R extends ZodTypeAny> = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: B; query?: ZodTypeAny;
  response: R;                                            // required: responses are allow-lists
  policy: keyof typeof policies | { public: string };     // required: no default
  rateLimit: 'auth' | 'write' | 'vote' | 'read' | 'media';
  idempotent?: boolean;
  handler: (ctx: Ctx, params: Record<string, string>, body: z.infer<B>) => Promise<z.infer<R>>;
};

export function route<B extends ZodTypeAny, R extends ZodTypeAny>(app: Hono<AppEnv>, d: RouteDef<B, R>) {
  if (!d.policy) throw new Error(`BOOT: ${d.method} ${d.path} has no policy`);
  if (!d.response) throw new Error(`BOOT: ${d.method} ${d.path} has no response schema`);
  if (['POST', 'PUT', 'PATCH'].includes(d.method) && d.idempotent === undefined)
    throw new Error(`BOOT: ${d.method} ${d.path} must declare idempotent`);
  registry.push(d);                                       // consumed by the authz matrix generator (engineering-docs/07 §6)

  const mw = [rateLimit(d.rateLimit), ...(d.idempotent ? [idempotency()] : []),
              ...(d.body ? [zValidator('json', d.body)] : [])];
  app.on(d.method, d.path, ...mw, async (c) => {
    const ctx = c.get('ctx');
    const body = d.body ? c.req.valid('json') : undefined;
    // Policy evaluation that needs the resource happens inside the use case (it loads the
    // resource with a scope predicate). Here we enforce the actor-level precondition.
    if (typeof d.policy === 'string') await policies[d.policy].precheck(ctx.actor);
    const result = await d.handler(ctx, c.req.param(), body);
    return c.json(d.response.parse(result));            // strips non-allow-listed fields
  });
}
```

```typescript
// apps/api/src/modules/ikpe/http/routes.ts
route(app, {
  method: 'PUT', path: '/v1/ikpe/cases/:caseId/vote',
  body: contracts.ikpe.CastVoteBody, response: contracts.ikpe.VoteView,
  policy: 'ikpe.vote', rateLimit: 'vote', idempotent: true,
  handler: (ctx, { caseId }, b) => ikpe.castVote(ctx.actor, caseId, b.choice, b.waitReason),
});
```

## 4. Capabilities in responses

Every view schema in `packages/contracts` that represents an actionable resource includes `capabilities`. They are computed with the same `can()` used for enforcement:

```typescript
const caps = {
  canVote:    await can(actor, 'ikpe.vote', c),
  canComment: await can(actor, 'ikpe.comment', c),
  canFlag:    await can(actor, 'ikpe.flag', c),
};
```

Clients (Expo, web SPA, admin) only read `capabilities`. Lint forbids `role` checks in `apps/mobile`, `apps/web` and `apps/admin`.

## 5. Idempotency middleware

```typescript
export const idempotency = () => createMiddleware<AppEnv>(async (c, next) => {
  const key = c.req.header('Idempotency-Key');
  if (!key) return problem(c, 'http.idempotency_key_required', 400);
  const actorId = c.get('ctx').actor.id;
  const hash = await sha256(await c.req.raw.clone().text());

  const hit = await idem.find(actorId, key);
  if (hit && hit.requestHash !== hash) return problem(c, 'http.idempotency_key_reused', 422);
  if (hit) return c.json(hit.response, hit.status);       // replay: identical response

  await next();
  if (c.res.status < 500) await idem.store(actorId, key, hash, c.res.status, await c.res.clone().json());
});
```

Offline mobile replay (votes, recordings, consent) depends on this middleware. The client uses the entity's UUIDv7 as the key.

## 6. Errors

Use RFC 9457 problem details with a stable `code` from `packages/contracts/errors.ts`. Clients map each `code` to localised copy in `packages/i18n`. Examples: `ikpe.not_eligible`, `ikpe.case_closed`, `consent.revoked`, `media.tier_forbidden`, `client.upgrade_required`. Never return stack traces or SQL errors. Map `check_violation` messages that start with `INV-` to `500 invariant.violation` and **page the on-call**: one of those means a domain check was bypassed.

## 7. Streaming and realtime

Neon Functions can hold SSE/WebSocket connections (see Neon's Functions WebSockets/SSE docs). The v1 API uses polling plus ETags for Ikpe tallies. Live tallies over SSE are a Phase 6 option behind an ADR. The data is the same `VoteView`; it is not a new rule path.

## 8. Function URLs and clients

- Clients only know `https://api.nnoo.app` (edge). `neon functions get api` prints the origin URL, which goes into the edge configuration, never into client builds.
- Preview branches get their own function URL. CI writes it into the preview edge route and into the preview web/mobile build config.
