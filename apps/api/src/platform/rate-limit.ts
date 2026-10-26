import { sql } from 'drizzle-orm';
import type { Db } from './db.ts';

/**
 * Route classes (04 §3, 06 §4). Coarse IP limits also run at the edge; these durable,
 * per-account limits are the ones the edge cannot see.
 */
export const RATE_LIMITS = {
  auth: { capacity: 10, perSecond: 10 / 60 },
  write: { capacity: 60, perSecond: 1 },
  vote: { capacity: 30, perSecond: 0.5 },
  read: { capacity: 300, perSecond: 5 },
  media: { capacity: 120, perSecond: 2 },
  /** Sending a code: per IP (06 §2 / 07 §2: 5 per minute). */
  otpIp: { capacity: 5, perSecond: 5 / 60 },
  /** Sending a code: per destination phone/email hash (3 per 15 minutes). */
  otpDestination: { capacity: 3, perSecond: 3 / 900 },
  /** Trigger endpoints: bounded even if someone floods them (06 §5). */
  trigger: { capacity: 30, perSecond: 1 },
} as const;
export type RateLimitClass = keyof typeof RATE_LIMITS;
export type RouteRateLimit = 'auth' | 'write' | 'vote' | 'read' | 'media';

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

export type RateLimiter = { take(cls: RateLimitClass, subject: string): Promise<RateLimitResult> };

/**
 * Token bucket in `rate_limit_bucket`, one atomic upsert per check, so it is correct
 * across isolates without Redis (05 §1). Refill uses database time.
 */
export function createRateLimiter(db: Db): RateLimiter {
  return {
    async take(cls, subject) {
      const { capacity, perSecond } = RATE_LIMITS[cls];
      const key = `${cls}:${subject}`;
      const res = await db.execute<{ tokens: number }>(sql`
        insert into rate_limit_bucket (bucket_key, tokens, refilled_at)
        values (${key}, ${capacity - 1}, now())
        on conflict (bucket_key) do update set
          tokens = greatest(-1, least(${capacity}::real,
                     rate_limit_bucket.tokens
                     + extract(epoch from (now() - rate_limit_bucket.refilled_at)) * ${perSecond}::real) - 1),
          refilled_at = now()
        returning tokens`);
      const tokens = Number(res.rows[0]?.tokens ?? -1);
      if (tokens >= 0) return { allowed: true, retryAfterSeconds: 0 };
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((1 - tokens) / perSecond)),
      };
    },
  };
}

/** For tests and local tooling that must not touch the database. */
export const allowAll: RateLimiter = {
  take: async () => ({ allowed: true, retryAfterSeconds: 0 }),
};
