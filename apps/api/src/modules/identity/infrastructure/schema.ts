// Owner: identity. Better Auth tables live in the `auth` schema (ADR-028); Nnọọ's
// identity tables live in `public`. Roles never live in the auth store or the token.
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgSchema,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { bytea } from '../../../platform/db-types.ts';

const tz = (name: string) => timestamp(name, { withTimezone: true });

// ── auth schema (Better Auth library; shape checked by tests/unit/auth-schema.test.ts) ──
export const authSchema = pgSchema('auth');

export const authUser = authSchema.table('user', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  phoneNumber: text('phone_number').unique(),
  phoneNumberVerified: boolean('phone_number_verified'),
  createdAt: tz('created_at').notNull().defaultNow(),
  updatedAt: tz('updated_at').notNull().defaultNow(),
});

export const authSession = authSchema.table(
  'session',
  {
    id: uuid('id').primaryKey(),
    expiresAt: tz('expires_at').notNull(),
    token: text('token').notNull().unique(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    /** Sign-in method of this ceremony session ('otp' | 'passkey'), set by a database hook. */
    amr: text('amr'),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUser.id, { onDelete: 'cascade' }),
    createdAt: tz('created_at').notNull().defaultNow(),
    updatedAt: tz('updated_at').notNull().defaultNow(),
  },
  (t) => [index('auth_session_user').on(t.userId)],
);

export const authAccount = authSchema.table(
  'account',
  {
    id: uuid('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUser.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: tz('access_token_expires_at'),
    refreshTokenExpiresAt: tz('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: tz('created_at').notNull().defaultNow(),
    updatedAt: tz('updated_at').notNull().defaultNow(),
  },
  (t) => [index('auth_account_user').on(t.userId)],
);

export const authVerification = authSchema.table(
  'verification',
  {
    id: uuid('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: tz('expires_at').notNull(),
    createdAt: tz('created_at').notNull().defaultNow(),
    updatedAt: tz('updated_at').notNull().defaultNow(),
  },
  (t) => [index('auth_verification_identifier').on(t.identifier)],
);

export const authJwks = authSchema.table('jwks', {
  id: uuid('id').primaryKey(),
  publicKey: text('public_key').notNull(),
  privateKey: text('private_key').notNull(),
  alg: text('alg'),
  crv: text('crv'),
  createdAt: tz('created_at').notNull(),
  expiresAt: tz('expires_at'),
});

export const authPasskey = authSchema.table(
  'passkey',
  {
    id: uuid('id').primaryKey(),
    name: text('name'),
    publicKey: text('public_key').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => authUser.id, { onDelete: 'cascade' }),
    credentialID: text('credential_id').notNull(),
    counter: integer('counter').notNull(),
    deviceType: text('device_type').notNull(),
    backedUp: boolean('backed_up').notNull(),
    transports: text('transports'),
    aaguid: text('aaguid'),
    createdAt: tz('created_at'),
  },
  (t) => [
    index('auth_passkey_user').on(t.userId),
    index('auth_passkey_credential').on(t.credentialID),
  ],
);

// ── public: Nnọọ identity ────────────────────────────────────────────────────
export const accountStatus = pgEnum('account_status', ['active', 'suspended', 'erased']);
/** Brief §21: under-13 child profiles live inside a guardian's account; 13–17 learn and read only. */
export const ageBand = pgEnum('age_band', ['under_13', 'age_13_17', 'adult']);
export const identityLevel = pgEnum('identity_level', ['none', 'basic', 'in_person']);
export const roleKind = pgEnum('role_kind', [
  'learner',
  'kin',
  'facilitator',
  'custodian',
  'organiser',
  'moderator',
  'operator',
]);
export const devicePlatform = pgEnum('device_platform', ['ios', 'android', 'web']);

/**
 * One row per person. Same id as auth.user. Contact details (phone, email) stay
 * in the auth schema only, so they are not duplicated across tables.
 */
export const account = pgTable(
  'account',
  {
    id: uuid('id')
      .primaryKey()
      .references(() => authUser.id, { onDelete: 'restrict' }),
    displayName: text('display_name'),
    birthYear: smallint('birth_year'),
    ageBand: ageBand('age_band'),
    uiLocale: text('ui_locale').notNull().default('en'),
    identityLevel: identityLevel('identity_level').notNull().default('none'),
    status: accountStatus('status').notNull().default('active'),
    /** Bumped on suspension or erasure; access tokens carry it as `ver`. */
    authVersion: integer('auth_version').notNull().default(1),
    createdAt: tz('created_at').notNull().defaultNow(),
  },
  (t) => [
    check(
      'account_display_name_nfc',
      sql`${t.displayName} is null or ${t.displayName} = normalize(${t.displayName}, NFC)`,
    ),
    check(
      'account_display_name_len',
      sql`${t.displayName} is null or length(${t.displayName}) between 1 and 120`,
    ),
    check(
      'account_birth_year',
      sql`${t.birthYear} is null or ${t.birthYear} between 1900 and 2100`,
    ),
    check('account_ui_locale', sql`${t.uiLocale} ~ '^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$'`),
  ],
);

export const roleGrant = pgTable(
  'role_grant',
  {
    id: uuid('id').primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => account.id),
    role: roleKind('role').notNull(),
    scopeType: text('scope_type').notNull(),
    /** Hometown id when scope_type = 'hometown' (FK added with the community module). */
    scopeId: uuid('scope_id'),
    /** How it was granted: 'signup' | 'vouch' | 'panel:<id>' | 'bootstrap'. Never an admin action. */
    grantedVia: text('granted_via').notNull(),
    grantedAt: tz('granted_at').notNull().defaultNow(),
    revokedAt: tz('revoked_at'),
  },
  (t) => [
    check('role_grant_scope_type', sql`${t.scopeType} in ('global','hometown')`),
    check('role_grant_scope_id', sql`(${t.scopeType} = 'global') = (${t.scopeId} is null)`),
    check(
      'role_grant_not_admin',
      sql`${t.grantedVia} ~ '^(signup|vouch|bootstrap|panel:[0-9a-f-]{36}|governance:[0-9a-f-]{36})$'`,
    ),
    uniqueIndex('role_grant_active')
      .on(
        t.accountId,
        t.role,
        t.scopeType,
        sql`coalesce(${t.scopeId}, '00000000-0000-0000-0000-000000000000'::uuid)`,
      )
      .where(sql`${t.revokedAt} is null`),
    index('role_grant_account')
      .on(t.accountId)
      .where(sql`${t.revokedAt} is null`),
  ],
);

export const guardianship = pgTable(
  'guardianship',
  {
    guardianId: uuid('guardian_id')
      .notNull()
      .references(() => account.id),
    minorId: uuid('minor_id')
      .notNull()
      .references(() => account.id),
    createdAt: tz('created_at').notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.guardianId, t.minorId] }),
    check('guardianship_distinct', sql`${t.guardianId} <> ${t.minorId}`),
  ],
);

export const device = pgTable(
  'device',
  {
    id: uuid('id').primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => account.id),
    platform: devicePlatform('platform').notNull(),
    label: text('label'),
    createdAt: tz('created_at').notNull().defaultNow(),
    lastSeenAt: tz('last_seen_at').notNull().defaultNow(),
    revokedAt: tz('revoked_at'),
  },
  (t) => [index('device_account').on(t.accountId)],
);

/**
 * A sign-in on one device (JWT `sid`). Revoking the family ends every refresh
 * token in it; access tokens then lapse within their 10-minute lifetime.
 */
export const sessionFamily = pgTable(
  'session_family',
  {
    id: uuid('id').primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => account.id),
    deviceId: uuid('device_id').references(() => device.id),
    /** The Better Auth ceremony session exchanged for this family; each can be exchanged once. No FK: auth sessions expire and are deleted. */
    authSessionId: uuid('auth_session_id').notNull().unique(),
    /** Authentication methods used at sign-in, e.g. {otp} or {passkey}. */
    amr: text('amr').array().notNull(),
    createdAt: tz('created_at').notNull().defaultNow(),
    expiresAt: tz('expires_at').notNull(),
    revokedAt: tz('revoked_at'),
    revokeReason: text('revoke_reason'),
  },
  (t) => [
    index('session_family_account')
      .on(t.accountId)
      .where(sql`${t.revokedAt} is null`),
    check(
      'session_family_revoke_reason',
      sql`(${t.revokedAt} is null) = (${t.revokeReason} is null)`,
    ),
  ],
);

/** Rotating, single-use refresh tokens (06 §2). Only a SHA-256 hash is stored. */
export const refreshToken = pgTable(
  'refresh_token',
  {
    id: uuid('id').primaryKey(),
    familyId: uuid('family_id')
      .notNull()
      .references(() => sessionFamily.id),
    tokenHash: bytea('token_hash').notNull().unique(),
    issuedAt: tz('issued_at').notNull().defaultNow(),
    expiresAt: tz('expires_at').notNull(),
    usedAt: tz('used_at'),
  },
  (t) => [
    index('refresh_token_family').on(t.familyId),
    check('refresh_token_expiry', sql`${t.expiresAt} > ${t.issuedAt}`),
  ],
);
