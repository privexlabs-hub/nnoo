import type { Actor } from './actor.ts';
import type { Deps } from './deps.ts';
import type { Logger } from './logger.ts';

export type RequestCtx = {
  actor: Actor;
  requestId: string;
  /** Client IP as reported by the edge proxy; used only for rate limiting, never stored. */
  clientIp: string;
  log: Logger;
};

export type AppEnv = {
  Variables: {
    deps: Deps;
    requestId: string;
    ctx: RequestCtx;
  };
};
