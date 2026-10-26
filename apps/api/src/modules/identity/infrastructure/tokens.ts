import { createLocalJWKSet, errors as joseErrors, jwtVerify, type JSONWebKeySet } from 'jose';
import { uuidv7 } from 'uuidv7';
import type { Clock } from '../../../platform/clock.ts';
import { problem } from '../../../platform/problem.ts';
import { ACCESS_TOKEN_TTL_SECONDS, API_AUDIENCE, type Auth } from './auth.ts';

/** Claims carried by an access token: who and which session. Never roles (06 §2). */
export type AccessClaims = { sub: string; sid: string; ver: number; amr: string[] };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const JWKS_CACHE_MS = 10 * 60_000;

export type TokenService = {
  issue(claims: AccessClaims): Promise<{ token: string; expiresAt: Date }>;
  verify(token: string): Promise<AccessClaims>;
};

export function createTokenService(auth: Auth, clock: Clock, issuer: string): TokenService {
  let cached: { set: ReturnType<typeof createLocalJWKSet>; at: number } | undefined;

  // Keys live in auth.jwks (private keys encrypted with AUTH_SECRET). Reading them in-process
  // avoids an HTTP self-call through the edge.
  async function keySet(force = false) {
    const now = clock.now().getTime();
    if (!cached || force || now - cached.at > JWKS_CACHE_MS) {
      const jwks = (await auth.api.getJwks()) as JSONWebKeySet;
      cached = { set: createLocalJWKSet(jwks), at: now };
    }
    return cached.set;
  }

  return {
    async issue(claims) {
      const iat = Math.floor(clock.now().getTime() / 1000);
      const exp = iat + ACCESS_TOKEN_TTL_SECONDS;
      const { token } = await auth.api.signJWT({
        body: { payload: { ...claims, iat, exp, jti: uuidv7(), iss: issuer, aud: API_AUDIENCE } },
      });
      return { token, expiresAt: new Date(exp * 1000) };
    },

    async verify(token) {
      const opts = {
        issuer,
        audience: API_AUDIENCE,
        algorithms: ['EdDSA'],
        currentDate: clock.now(),
        clockTolerance: 5,
      };
      let payload;
      try {
        ({ payload } = await jwtVerify(token, await keySet(), opts));
      } catch (e) {
        if (e instanceof joseErrors.JWKSNoMatchingKey) {
          try {
            ({ payload } = await jwtVerify(token, await keySet(true), opts)); // key rotated since cache
          } catch {
            throw problem('auth.token_invalid', 401);
          }
        } else {
          throw problem('auth.token_invalid', 401);
        }
      }
      const { sub, sid, ver, amr } = payload as Record<string, unknown>;
      if (
        typeof sub !== 'string' ||
        !UUID.test(sub) ||
        typeof sid !== 'string' ||
        !UUID.test(sid) ||
        typeof ver !== 'number' ||
        !Number.isInteger(ver) ||
        !Array.isArray(amr)
      ) {
        throw problem('auth.token_invalid', 401);
      }
      return { sub, sid, ver, amr: amr.filter((a): a is string => typeof a === 'string') };
    },
  };
}
