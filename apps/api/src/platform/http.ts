import { Hono } from 'hono';
import { platform as contracts } from '@nnoo/contracts';
import type { AppEnv } from './app-env.ts';
import type { Deps } from './deps.ts';
import {
  accessLog,
  authenticate,
  clientVersion,
  corsAllowList,
  edgeAuth,
  injectDeps,
  limitBody,
  notFound,
  onError,
  requestId,
} from './middleware.ts';
import { route } from './route.ts';

export type Surface = 'public' | 'internal';

/**
 * Platform middleware in the order of docs/neon/04 §2:
 * requestId → logger → edgeAuth → cors → clientVersion → authenticate; rate limiting and
 * idempotency are per route (route.ts); errors map to problem+json.
 */
export function createPlatformApp(deps: Deps, surface: Surface): Hono<AppEnv> {
  const app = new Hono<AppEnv>();
  app.onError(onError);
  app.notFound(notFound);
  app.use('*', injectDeps(deps), requestId, accessLog);

  if (surface === 'public') {
    app.use('/v1/*', edgeAuth, corsAllowList, limitBody, clientVersion, authenticate);
    route(app, {
      method: 'GET',
      path: '/v1/health',
      response: contracts.HealthView,
      policy: { public: 'liveness probe for the edge and deploy checks; reveals no data' },
      rateLimit: 'read',
      handler: async ({ deps: d }) => ({
        status: 'ok' as const,
        function: 'api' as const,
        env: d.env.NNOO_ENV,
        time: d.clock.now().toISOString(),
      }),
    });
  }
  return app;
}
