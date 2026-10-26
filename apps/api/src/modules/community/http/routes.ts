import type { Hono } from 'hono';
import { capture } from '@nnoo/contracts';
import type { AppEnv } from '../../../platform/app-env.ts';
import { route } from '../../../platform/route.ts';
import { searchHometowns } from '../application/reference.ts';

export function communityRoutes(app: Hono<AppEnv>): void {
  route(app, {
    method: 'GET',
    path: '/v1/hometowns',
    query: capture.HometownQuery,
    response: capture.HometownList,
    policy: {
      public:
        'reference data: hometown, LGA, state and dialect names, needed before sign-up (A-02)',
    },
    rateLimit: 'read',
    handler: ({ deps }, _p, _b, q) => searchHometowns(deps.db, q.q, q.limit),
  });
}
