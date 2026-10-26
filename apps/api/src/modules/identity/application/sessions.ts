import { and, eq, isNull, sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import type { identity } from '@nnoo/contracts';
import * as audit from '../../audit/public.ts';
import type { Clock } from '../../../platform/clock.ts';
import { randomToken, sha256 } from '../../../platform/crypto.ts';
import { inTransaction, type Db, type Tx } from '../../../platform/db.ts';
import { problem } from '../../../platform/problem.ts';
import type { TokenService } from '../infrastructure/tokens.ts';
import {
  account,
  authUser,
  device,
  refreshToken,
  sessionFamily,
} from '../infrastructure/schema.ts';

/** Sliding refresh lifetime (06 §2): every refresh issues a new token valid this long. */
export const REFRESH_TOKEN_TTL_MS = 30 * 86_400_000;

export type SessionDeps = { db: Db; clock: Clock; tokens: TokenService };

export type CeremonySession = {
  /** Better Auth session id (the sign-in ceremony). */
  authSessionId: string;
  userId: string;
  amr: string | null;
};

export type IssuedSession = {
  sessionId: string;
  deviceId: string;
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

async function issueRefresh(tx: Tx, familyId: string, now: Date) {
  const raw = randomToken();
  const expiresAt = new Date(now.getTime() + REFRESH_TOKEN_TTL_MS);
  await tx
    .insert(refreshToken)
    .values({ id: uuidv7(), familyId, tokenHash: sha256(raw), issuedAt: now, expiresAt });
  await tx.update(sessionFamily).set({ expiresAt }).where(eq(sessionFamily.id, familyId));
  return { raw, expiresAt };
}

async function revokeFamily(tx: Tx, familyId: string, reason: string, now: Date) {
  await tx
    .update(sessionFamily)
    .set({ revokedAt: now, revokeReason: reason })
    .where(and(eq(sessionFamily.id, familyId), isNull(sessionFamily.revokedAt)));
}

/**
 * Exchanges a completed sign-in ceremony (phone OTP, email OTP or passkey) for a
 * session family: a short access JWT plus a rotating refresh token. Each ceremony
 * session can be exchanged once (unique auth_session_id).
 */
export async function createSession(
  deps: SessionDeps,
  ceremony: CeremonySession,
  body: identity.CreateSessionBody,
  requestId: string,
): Promise<IssuedSession> {
  const now = deps.clock.now();
  const amr = ceremony.amr ? [ceremony.amr] : [];

  const issued = await inTransaction(
    deps.db,
    { actorId: ceremony.userId, requestId },
    async (tx) => {
      const [acct] = await tx
        .select({
          status: account.status,
          authVersion: account.authVersion,
          identityLevel: account.identityLevel,
        })
        .from(account)
        .where(eq(account.id, ceremony.userId))
        .for('update');
      if (!acct) throw problem('identity.session_required', 401);
      if (acct.status !== 'active') throw problem('identity.suspended', 403);

      // A verified phone or email is identity level `basic` (01 §6); in-person comes from a facilitator.
      if (acct.identityLevel === 'none') {
        const [u] = await tx
          .select({ phone: authUser.phoneNumberVerified, email: authUser.emailVerified })
          .from(authUser)
          .where(eq(authUser.id, ceremony.userId));
        if (u?.phone || u?.email) {
          await tx
            .update(account)
            .set({ identityLevel: 'basic' })
            .where(eq(account.id, ceremony.userId));
        }
      }

      let deviceId = body.deviceId;
      if (deviceId) {
        const [own] = await tx
          .select({ id: device.id })
          .from(device)
          .where(
            and(
              eq(device.id, deviceId),
              eq(device.accountId, ceremony.userId),
              isNull(device.revokedAt),
            ),
          );
        if (own) {
          await tx.update(device).set({ lastSeenAt: now }).where(eq(device.id, deviceId));
        } else {
          deviceId = undefined; // unknown or someone else's device id: start a new device, never adopt it
        }
      }
      if (!deviceId) {
        deviceId = uuidv7();
        await tx.insert(device).values({
          id: deviceId,
          accountId: ceremony.userId,
          platform: body.platform,
          label: body.deviceLabel ?? null,
          createdAt: now,
          lastSeenAt: now,
        });
      }

      const familyId = uuidv7();
      const inserted = await tx
        .insert(sessionFamily)
        .values({
          id: familyId,
          accountId: ceremony.userId,
          deviceId,
          authSessionId: ceremony.authSessionId,
          amr,
          createdAt: now,
          expiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_MS),
        })
        .onConflictDoNothing({ target: sessionFamily.authSessionId })
        .returning({ id: sessionFamily.id });
      if (inserted.length === 0)
        throw problem('identity.session_required', 401, 'This sign-in was already used.');

      const refresh = await issueRefresh(tx, familyId, now);
      await audit.record(tx, {
        actorId: ceremony.userId,
        action: 'identity.session_created',
        resourceType: 'session_family',
        resourceId: familyId,
        detail: { amr, platform: body.platform },
        requestId,
      });
      return { familyId, deviceId, ver: acct.authVersion, refresh };
    },
  );

  const access = await deps.tokens.issue({
    sub: ceremony.userId,
    sid: issued.familyId,
    ver: issued.ver,
    amr,
  });
  return {
    sessionId: issued.familyId,
    deviceId: issued.deviceId,
    accessToken: access.token,
    accessTokenExpiresAt: access.expiresAt,
    refreshToken: issued.refresh.raw,
    refreshTokenExpiresAt: issued.refresh.expiresAt,
  };
}

/**
 * Rotates a refresh token. Single use: presenting a token that was already used, or
 * from another device, revokes the whole family (06 §2, reuse detection).
 */
export async function refreshSession(
  deps: SessionDeps,
  rawToken: string,
  deviceId: string | undefined,
  requestId: string,
): Promise<IssuedSession> {
  const now = deps.clock.now();
  type Outcome =
    | {
        ok: true;
        accountId: string;
        familyId: string;
        deviceId: string;
        ver: number;
        amr: string[];
        refresh: { raw: string; expiresAt: Date };
      }
    | {
        ok: false;
        code: 'identity.refresh_invalid' | 'identity.refresh_reused' | 'identity.suspended';
      };

  // The transaction commits even when the outcome is a rejection, so revocations stick.
  const outcome = await inTransaction<Outcome>(deps.db, { requestId }, async (tx) => {
    const [row] = await tx
      .select({
        tokenId: refreshToken.id,
        usedAt: refreshToken.usedAt,
        expiresAt: refreshToken.expiresAt,
        familyId: sessionFamily.id,
        familyRevokedAt: sessionFamily.revokedAt,
        familyDeviceId: sessionFamily.deviceId,
        amr: sessionFamily.amr,
        accountId: account.id,
        status: account.status,
        ver: account.authVersion,
      })
      .from(refreshToken)
      .innerJoin(sessionFamily, eq(sessionFamily.id, refreshToken.familyId))
      .innerJoin(account, eq(account.id, sessionFamily.accountId))
      .where(eq(refreshToken.tokenHash, sha256(rawToken)))
      .for('update', { of: [refreshToken, sessionFamily] });

    if (!row || row.familyRevokedAt) return { ok: false, code: 'identity.refresh_invalid' };

    const reject = async (reason: 'refresh_reuse' | 'device_mismatch') => {
      await revokeFamily(tx, row.familyId, reason, now);
      await audit.record(tx, {
        actorId: row.accountId,
        action: 'identity.session_revoked',
        resourceType: 'session_family',
        resourceId: row.familyId,
        detail: { reason },
        requestId,
      });
      return { ok: false as const, code: 'identity.refresh_reused' as const };
    };

    if (row.usedAt) return reject('refresh_reuse');
    if (!deviceId || deviceId !== row.familyDeviceId) return reject('device_mismatch');
    if (row.expiresAt <= now) return { ok: false, code: 'identity.refresh_invalid' };
    if (row.status !== 'active') {
      await revokeFamily(tx, row.familyId, `account_${row.status}`, now);
      return { ok: false, code: 'identity.suspended' };
    }

    await tx.update(refreshToken).set({ usedAt: now }).where(eq(refreshToken.id, row.tokenId));
    await tx.update(device).set({ lastSeenAt: now }).where(eq(device.id, row.familyDeviceId!));
    const refresh = await issueRefresh(tx, row.familyId, now);
    return {
      ok: true,
      accountId: row.accountId,
      familyId: row.familyId,
      deviceId: row.familyDeviceId!,
      ver: row.ver,
      amr: row.amr,
      refresh,
    };
  });

  if (!outcome.ok) throw problem(outcome.code, outcome.code === 'identity.suspended' ? 403 : 401);

  const access = await deps.tokens.issue({
    sub: outcome.accountId,
    sid: outcome.familyId,
    ver: outcome.ver,
    amr: outcome.amr,
  });
  return {
    sessionId: outcome.familyId,
    deviceId: outcome.deviceId,
    accessToken: access.token,
    accessTokenExpiresAt: access.expiresAt,
    refreshToken: outcome.refresh.raw,
    refreshTokenExpiresAt: outcome.refresh.expiresAt,
  };
}

/** Signs out one session family. Access tokens lapse within their 10-minute lifetime. */
export async function endSession(
  deps: SessionDeps,
  accountId: string,
  familyId: string,
  requestId: string,
) {
  const now = deps.clock.now();
  await inTransaction(deps.db, { actorId: accountId, requestId }, async (tx) => {
    const res = await tx
      .update(sessionFamily)
      .set({ revokedAt: now, revokeReason: 'sign_out' })
      .where(
        and(
          eq(sessionFamily.id, familyId),
          eq(sessionFamily.accountId, accountId),
          isNull(sessionFamily.revokedAt),
        ),
      )
      .returning({ id: sessionFamily.id });
    if (res.length > 0) {
      await audit.record(tx, {
        actorId: accountId,
        action: 'identity.session_revoked',
        resourceType: 'session_family',
        resourceId: familyId,
        detail: { reason: 'sign_out' },
        requestId,
      });
    }
  });
}

/** Used by the cleanup job: refresh tokens long past expiry carry no value. */
export async function purgeExpiredRefreshTokens(db: Db, now: Date): Promise<number> {
  const res = await db.execute(
    sql`delete from refresh_token where expires_at < ${new Date(now.getTime() - 7 * 86_400_000)}`,
  );
  return res.rowCount ?? 0;
}
