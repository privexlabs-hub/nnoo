import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const sha256 = (input: string | Buffer): Buffer =>
  createHash('sha256').update(input).digest();
export const sha256Hex = (input: string | Buffer): string => sha256(input).toString('hex');

/** 256-bit URL-safe random token. */
export const randomToken = (): string => randomBytes(32).toString('base64url');

export function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.byteLength !== bb.byteLength) return false;
  return timingSafeEqual(ab, bb);
}

/** Stable pseudonymous id for logs (`actor_hash`), not reversible without the salt. */
export const actorHash = (id: string, salt: string): string =>
  sha256Hex(`${salt}:${id}`).slice(0, 16);
