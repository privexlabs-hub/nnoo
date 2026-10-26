import type { Hono } from 'hono';
import { identityRoutes } from './modules/identity/public.ts';
import type { AppEnv } from './platform/app-env.ts';
import type { Deps } from './platform/deps.ts';
import { createPlatformApp } from './platform/http.ts';
import { internalRoutes } from './platform/internal.ts';

/** The public /v1 API (Neon Function `api`). Modules register their routes here. */
export function createApiApp(deps: Deps): Hono<AppEnv> {
  const app = createPlatformApp(deps, 'public');
  identityRoutes(app);
  return app;
}

/** The internal surface (Neon Function `jobs`): trigger-safe and service-token routes only. */
export function createJobsApp(deps: Deps): Hono<AppEnv> {
  const app = createPlatformApp(deps, 'internal');
  internalRoutes(app);
  return app;
}
