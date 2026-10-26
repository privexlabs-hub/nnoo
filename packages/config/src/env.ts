import { z } from 'zod';
import { assertNotProductionDatabase } from './environments.ts';
import { NNOO_ENVS, type NnooEnv } from './envs.ts';

/**
 * Environment boundary (docs/neon/02 §4, ADR-027).
 *
 * Every process (api, jobs, scripts) validates its environment once at boot.
 * A missing or unsafe value is a crash, never a silent fallback. There is no
 * default for NNOO_ENV, so nothing can drift into production by omission.
 */
export { NNOO_ENVS, type NnooEnv } from './envs.ts';

/** Environments allowed to use fake providers (SMS, email, storage, AI). */
export const FAKE_PROVIDER_ENVS: readonly NnooEnv[] = ['local', 'test'];

const csv = z.string().transform((s) =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean),
);

const postgresUrl = z
  .string()
  .url()
  .refine(
    (u) => u.startsWith('postgres://') || u.startsWith('postgresql://'),
    'must be a postgres URL',
  );

const runtimeSchema = z
  .object({
    NNOO_ENV: z.enum(NNOO_ENVS),
    FUNCTION_NAME: z.enum(['api', 'jobs', 'script']).default('script'),

    // Runtime role (ADR-026). The Neon-injected DATABASE_URL is the owner role and is never used here.
    APP_DATABASE_URL: postgresUrl,
    APP_DATABASE_ROLE: z.string().min(1).default('nnoo_app_login'),

    // Better Auth (ADR-028). Secret signs cookies and encrypts JWKS private keys.
    AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
    AUTH_BASE_URL: z.string().url(),
    AUTH_TRUSTED_ORIGINS: csv.default([]),

    // ADR-023: the edge proxy injects X-Edge-Auth. Two values are accepted during rotation.
    EDGE_AUTH_SECRETS: csv.pipe(z.array(z.string().min(32)).min(1).max(2)),

    CORS_ALLOWED_ORIGINS: csv.default([]),
    MIN_CLIENT_VERSIONS: z
      .string()
      .default('{}')
      .transform((s, ctx) => {
        try {
          return z.record(z.string(), z.string()).parse(JSON.parse(s));
        } catch {
          ctx.addIssue({ code: 'custom', message: 'MIN_CLIENT_VERSIONS must be a JSON object' });
          return z.NEVER;
        }
      }),

    SMS_PROVIDER: z.enum(['none', 'fake', 'termii', 'twilio']),
    EMAIL_PROVIDER: z.enum(['none', 'fake', 'resend', 'smtp']),

    // Object Storage (ADR-020/032). `fake` = in-memory, local/test only. Neon injects AWS_* when buckets are declared.
    STORAGE_PROVIDER: z.enum(['s3', 'fake']).default('s3'),
    AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
    AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    AWS_ENDPOINT_URL_S3: z.string().url().optional(),
    AWS_REGION: z.string().min(1).optional(),
    // Shared secret(s) the audio worker uses to claim jobs (ADR-021); per-job tokens follow. jobs only.
    AUDIO_WORKER_KEYS: csv.pipe(z.array(z.string().min(32)).max(2)).default([]),

    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    SENTRY_DSN: z.string().url().optional(),
  })
  .superRefine((e, ctx) => {
    const fakesAllowed = FAKE_PROVIDER_ENVS.includes(e.NNOO_ENV);
    if (e.STORAGE_PROVIDER === 'fake' && !fakesAllowed) {
      ctx.addIssue({
        code: 'custom',
        path: ['STORAGE_PROVIDER'],
        message: `fake storage is only allowed in ${FAKE_PROVIDER_ENVS.join('/')}`,
      });
    }
    if (e.STORAGE_PROVIDER === 's3') {
      for (const key of [
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_ENDPOINT_URL_S3',
        'AWS_REGION',
      ] as const) {
        if (!e[key])
          ctx.addIssue({
            code: 'custom',
            path: [key],
            message: 'required when STORAGE_PROVIDER=s3',
          });
      }
    }
    for (const key of ['SMS_PROVIDER', 'EMAIL_PROVIDER'] as const) {
      if (e[key] === 'fake' && !fakesAllowed) {
        ctx.addIssue({
          code: 'custom',
          path: [key],
          message: `fake ${key} is only allowed in ${FAKE_PROVIDER_ENVS.join('/')}`,
        });
      }
    }
    // `none` = sign-in by that channel is switched off (503); acceptable before a provider exists, never in production.
    if (e.NNOO_ENV === 'production' && (e.SMS_PROVIDER === 'none' || e.EMAIL_PROVIDER === 'none')) {
      ctx.addIssue({
        code: 'custom',
        path: ['SMS_PROVIDER'],
        message: 'production needs real SMS and email providers',
      });
    }
    if (e.NNOO_ENV === 'production' && !e.AUTH_BASE_URL.startsWith('https://')) {
      ctx.addIssue({
        code: 'custom',
        path: ['AUTH_BASE_URL'],
        message: 'production requires https',
      });
    }
    const user = safeUser(e.APP_DATABASE_URL);
    if (user !== e.APP_DATABASE_ROLE) {
      ctx.addIssue({
        code: 'custom',
        path: ['APP_DATABASE_URL'],
        message: `runtime must connect as ${e.APP_DATABASE_ROLE}, not "${user ?? '?'}" (ADR-026)`,
      });
    }
  });

export type RuntimeEnv = z.infer<typeof runtimeSchema>;

function safeUser(url: string): string | undefined {
  try {
    return decodeURIComponent(new URL(url).username) || undefined;
  } catch {
    return undefined;
  }
}

/** Formats issues without echoing values: secrets must never reach logs. */
function describe(error: z.ZodError): string {
  return error.issues.map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
}

export class EnvError extends Error {
  override name = 'EnvError';
}

export function loadRuntimeEnv(
  source: Record<string, string | undefined> = process.env,
): RuntimeEnv {
  const parsed = runtimeSchema.safeParse(source);
  if (!parsed.success) {
    throw new EnvError(`BOOT: invalid environment\n${describe(parsed.error)}`);
  }
  assertNotProductionDatabase(parsed.data.NNOO_ENV, parsed.data.APP_DATABASE_URL);
  return parsed.data;
}
