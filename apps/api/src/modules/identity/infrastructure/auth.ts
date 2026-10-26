import { passkey } from '@better-auth/passkey';
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { emailOTP, jwt, phoneNumber } from 'better-auth/plugins';
import { uuidv7 } from 'uuidv7';
import type { RuntimeEnv } from '@nnoo/config/env';
import { sha256Hex } from '../../../platform/crypto.ts';
import type { Db } from '../../../platform/db.ts';
import type { EmailPort, SmsPort } from './ports.ts';
import {
  authAccount,
  authJwks,
  authPasskey,
  authSession,
  authUser,
  authVerification,
} from './schema.ts';

/** JWT audience for /v1. Tokens minted for any other audience are rejected. */
export const API_AUDIENCE = 'nnoo-api';
export const ACCESS_TOKEN_TTL_SECONDS = 10 * 60;
/** Better Auth sessions are only a ceremony handle; the long-lived credential is our rotating refresh token. */
export const CEREMONY_SESSION_TTL_SECONDS = 15 * 60;
export const AUTH_BASE_PATH = '/v1/auth';

const E164 = /^\+[1-9]\d{7,14}$/;

/**
 * Better Auth endpoints we expose, by "METHOD path" under /v1/auth. Everything else
 * Better Auth would serve returns 404 — notably /token (it would bypass refresh
 * rotation), password sign-in and reset (there are no passwords), user deletion
 * (erasure is our own flow, 06 §6) and list/revoke-session (our session families).
 */
export const AUTH_ROUTE_ALLOWLIST: ReadonlySet<string> = new Set([
  'POST /phone-number/send-otp',
  'POST /phone-number/verify',
  'POST /email-otp/send-verification-otp',
  'POST /sign-in/email-otp',
  'GET /passkey/generate-register-options',
  'POST /passkey/verify-registration',
  'GET /passkey/generate-authenticate-options',
  'POST /passkey/verify-authentication',
  'GET /passkey/list-user-passkeys',
  'POST /passkey/delete-passkey',
  'GET /get-session',
  'POST /sign-out',
  'GET /jwks',
]);

/** Routes that send a code: limited per IP and per destination before Better Auth runs. */
export const OTP_SEND_ROUTES: ReadonlySet<string> = new Set([
  'POST /phone-number/send-otp',
  'POST /email-otp/send-verification-otp',
]);

/** Maps the Better Auth route that created a session to an RFC 8176 `amr` value. */
export function amrForPath(path: string | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('/passkey/')) return 'passkey';
  if (path.startsWith('/phone-number/') || path.startsWith('/sign-in/email-otp')) return 'otp';
  return null;
}

export type AuthDeps = { env: RuntimeEnv; db: Db; sms: SmsPort; email: EmailPort };

export function authOptions({ env, db, sms, email }: AuthDeps) {
  const secureCookies = env.NNOO_ENV !== 'local' && env.NNOO_ENV !== 'test';
  const origin = new URL(env.AUTH_BASE_URL).origin;
  const trustedOrigins = [...new Set([origin, ...env.AUTH_TRUSTED_ORIGINS])];

  return {
    appName: 'Nnọọ',
    baseURL: env.AUTH_BASE_URL,
    basePath: AUTH_BASE_PATH,
    secret: env.AUTH_SECRET,
    trustedOrigins,
    telemetry: { enabled: false },
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: authUser,
        session: authSession,
        account: authAccount,
        verification: authVerification,
        jwks: authJwks,
        passkey: authPasskey,
      },
    }),
    emailAndPassword: { enabled: false },
    session: {
      expiresIn: CEREMONY_SESSION_TTL_SECONDS,
      disableSessionRefresh: true,
      additionalFields: { amr: { type: 'string', required: false, input: false } },
    },
    databaseHooks: {
      session: {
        create: {
          // Record how this person proved who they are; step-up checks read it (07 §1).
          before: async (session, ctx) => ({ data: { ...session, amr: amrForPath(ctx?.path) } }),
        },
      },
    },
    // Coarse per-isolate limits; durable per-IP/per-destination limits run before (rate-limit.ts).
    rateLimit: { enabled: env.NNOO_ENV !== 'test', window: 60, max: 30 },
    advanced: {
      database: { generateId: () => uuidv7() },
      cookiePrefix: 'nnoo',
      useSecureCookies: secureCookies,
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax', secure: secureCookies },
      ipAddress: { ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for'] },
    },
    plugins: [
      phoneNumber({
        otpLength: 6,
        expiresIn: 5 * 60,
        allowedAttempts: 5,
        phoneNumberValidator: (p) => E164.test(p),
        sendOTP: ({ phoneNumber: to, code }) => sms.sendOtp(to, code),
        signUpOnVerification: {
          // Better Auth requires an email column; this placeholder carries no phone digits.
          getTempEmail: (p) => `p-${sha256Hex(p).slice(0, 32)}@phone.nnoo.invalid`,
          getTempName: () => 'learner',
        },
      }),
      emailOTP({
        otpLength: 6,
        expiresIn: 5 * 60,
        allowedAttempts: 5,
        storeOTP: 'hashed',
        sendVerificationOTP: async ({ email: to, otp, type }) => {
          if (type !== 'sign-in' && type !== 'email-verification') return; // password reset is not offered
          await email.sendOtp(to, otp, type);
        },
      }),
      passkey({
        rpID: env.AUTH_RP_ID ?? new URL(env.AUTH_BASE_URL).hostname,
        rpName: 'Nnọọ',
        origin: trustedOrigins,
      }),
      jwt({
        jwks: { keyPairConfig: { alg: 'EdDSA', crv: 'Ed25519' } },
        jwt: {
          issuer: origin,
          audience: API_AUDIENCE,
          expirationTime: `${ACCESS_TOKEN_TTL_SECONDS}s`,
        },
        disableSettingJwtHeader: true,
      }),
    ],
  } satisfies BetterAuthOptions;
}

export const createAuth = (deps: AuthDeps) => betterAuth(authOptions(deps));
export type Auth = ReturnType<typeof createAuth>;
