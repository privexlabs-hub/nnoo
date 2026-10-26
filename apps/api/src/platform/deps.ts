import type { RuntimeEnv } from '@nnoo/config/env';
import type { ActorLoader } from '../modules/identity/application/actors.ts';
import type { Auth } from '../modules/identity/infrastructure/auth.ts';
import type { EmailPort, SmsPort } from '../modules/identity/infrastructure/ports.ts';
import type { TokenService } from '../modules/identity/infrastructure/tokens.ts';
import type { StoragePort } from '../modules/media/infrastructure/storage.ts';
import type { Clock } from './clock.ts';
import type { Db } from './db.ts';
import type { Logger } from './logger.ts';
import type { RateLimiter } from './rate-limit.ts';

/** Everything a request handler may use. Built once per isolate; passed explicitly, never global. */
export type Deps = {
  env: RuntimeEnv;
  db: Db;
  clock: Clock;
  log: Logger;
  auth: Auth;
  tokens: TokenService;
  actors: ActorLoader;
  sms: SmsPort;
  email: EmailPort;
  rateLimiter: RateLimiter;
  storage: StoragePort;
  /** After a commit that wrote outbox rows: drain soon, in the background (ADR-019). Correctness never depends on it. */
  kick: () => void;
  /** Post-commit work that must not delay the response (waitUntil on Neon, fire-and-forget elsewhere). */
  defer: (work: Promise<unknown>) => void;
};
