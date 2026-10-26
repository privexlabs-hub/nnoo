import { and, eq, isNull } from 'drizzle-orm';
import type { AccountActor, RoleGrant } from '../../../platform/actor.ts';
import type { Clock } from '../../../platform/clock.ts';
import type { Db } from '../../../platform/db.ts';
import { problem } from '../../../platform/problem.ts';
import type { AccessClaims } from '../infrastructure/tokens.ts';
import { account, roleGrant, sessionFamily } from '../infrastructure/schema.ts';

/** Role and revocation changes apply within this window (06 §2: "within a minute"). */
export const ACTOR_CACHE_MS = 60_000;
const MAX_ENTRIES = 5_000;

export type ActorLoader = {
  load(claims: AccessClaims): Promise<AccountActor>;
  /** Drop cached state for an account (role granted/revoked, suspension). */
  invalidate(accountId: string): void;
};

/**
 * Builds the Actor from verified token claims and the database: account status, age
 * band, identity level, active role grants and the session family. Per-isolate cache.
 */
export function createActorLoader(db: Db, clock: Clock): ActorLoader {
  const cache = new Map<string, { actor: AccountActor; at: number }>();

  return {
    invalidate(accountId) {
      for (const key of cache.keys()) if (key.startsWith(`${accountId}:`)) cache.delete(key);
    },

    async load(claims) {
      const key = `${claims.sub}:${claims.sid}`;
      const now = clock.now().getTime();
      const hit = cache.get(key);
      if (hit && now - hit.at < ACTOR_CACHE_MS) {
        if (hit.actor.status !== 'active') throw problem('identity.suspended', 403);
        return hit.actor;
      }

      const [row] = await db
        .select({
          id: account.id,
          status: account.status,
          ageBand: account.ageBand,
          identityLevel: account.identityLevel,
          createdAt: account.createdAt,
          authVersion: account.authVersion,
          familyRevokedAt: sessionFamily.revokedAt,
          familyAccountId: sessionFamily.accountId,
        })
        .from(account)
        .leftJoin(sessionFamily, eq(sessionFamily.id, claims.sid))
        .where(eq(account.id, claims.sub));

      // Unknown account, session from another account, revoked session or stale `ver`: not valid.
      if (
        !row ||
        row.familyAccountId !== row.id ||
        row.familyRevokedAt ||
        row.authVersion !== claims.ver
      ) {
        throw problem('auth.token_invalid', 401);
      }

      const grants = await db
        .select({
          role: roleGrant.role,
          scopeType: roleGrant.scopeType,
          scopeId: roleGrant.scopeId,
        })
        .from(roleGrant)
        .where(and(eq(roleGrant.accountId, row.id), isNull(roleGrant.revokedAt)));

      const actor: AccountActor = {
        kind: 'account',
        id: row.id,
        sessionId: claims.sid,
        status: row.status,
        ageBand: row.ageBand,
        identityLevel: row.identityLevel,
        accountCreatedAt: row.createdAt,
        amr: claims.amr,
        roles: grants.map((g) => ({ ...g, scopeType: g.scopeType as RoleGrant['scopeType'] })),
      };
      if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value!);
      cache.set(key, { actor, at: now });
      if (actor.status !== 'active') throw problem('identity.suspended', 403);
      return actor;
    },
  };
}
