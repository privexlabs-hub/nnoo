// Backend as code for Nnọọ (docs/neon/02, ADR-027). Applied per branch with:
//   neon deploy --env <env-file>
// Values under `env` are read from process.env at deploy time. Never pass an empty
// string: deploying "" deletes the variable on the live function.
import { defineConfig } from '@neon/config/v1';

const ENVS = ['local', 'test', 'preview', 'staging', 'production'] as const;
type DeployEnv = (typeof ENVS)[number];

function required(name: string): string {
  const v = process.env[name];
  if (v === undefined || v === '')
    throw new Error(`neon.ts: ${name} must be set in the --env file`);
  return v;
}
/** Include a key only when it has a value (an empty value would delete the live key). */
const optional = (name: string): Record<string, string> =>
  process.env[name] ? { [name]: process.env[name]! } : {};

// neon.ts is evaluated by `neon config status/plan` too; the env file is needed only for deploys.
const deploying = process.env.NNOO_ENV !== undefined;
const nnooEnv = (process.env.NNOO_ENV ?? 'preview') as DeployEnv;
if (!ENVS.includes(nnooEnv)) throw new Error(`neon.ts: NNOO_ENV must be one of ${ENVS.join(', ')}`);

function functionEnv(fn: 'api' | 'jobs'): Record<string, string> {
  if (!deploying) return {};
  return {
    FUNCTION_NAME: fn,
    NNOO_ENV: nnooEnv,
    APP_DATABASE_URL: required('APP_DATABASE_URL'), // nnoo_app_login on the pooled host (ADR-026)
    AUTH_SECRET: required('AUTH_SECRET'),
    AUTH_BASE_URL: required('AUTH_BASE_URL'),
    EDGE_AUTH_SECRETS: required('EDGE_AUTH_SECRETS'),
    SMS_PROVIDER: required('SMS_PROVIDER'),
    EMAIL_PROVIDER: required('EMAIL_PROVIDER'),
    ...optional('AUTH_TRUSTED_ORIGINS'),
    ...optional('CORS_ALLOWED_ORIGINS'),
    ...optional('MIN_CLIENT_VERSIONS'),
    ...optional('LOG_LEVEL'),
    ...optional('SENTRY_DSN'),
  };
}

/**
 * Trigger cadence (ADR-027): every-minute schedules keep a compute awake around the clock,
 * which exceeds the Free plan's compute hours. Production (on a paid plan) runs the
 * documented cadence; everything else is thinned. NNOO_TRIGGERS=off disables them on a
 * branch (developer branches), and inherited copies stay disabled.
 */
const prod = nnooEnv === 'production';
const triggersOn = process.env.NNOO_TRIGGERS !== 'off';
const schedule = (cron: string, functionPath: string) =>
  ({ type: 'schedule', function: 'jobs', cron, functionPath, enabled: triggersOn }) as const;

export default defineConfig({
  // auth: false — Better Auth runs as a library inside `api` (ADR-028): Managed Auth lacks passkeys/MFA.
  // aiGateway: false — not on the Free plan and not needed before Phase 4 (ADR-029).
  functions: {
    api: { name: 'nnoo api', source: './apps/api/src/function.api.ts', env: functionEnv('api') },
    jobs: {
      name: 'nnoo jobs',
      source: './apps/api/src/function.jobs.ts',
      env: functionEnv('jobs'),
    },
  },
  triggers: {
    'jobs-drain': schedule(prod ? '* * * * *' : '*/15 * * * *', '/internal/jobs/drain'),
    invariants: schedule(prod ? '*/10 * * * *' : '0 */6 * * *', '/internal/invariants/check'),
    maintenance: schedule('15 3 * * *', '/internal/maintenance'),
  },
  branch: (branch) => {
    if (branch.exists) return {}; // never rewrite settings of an existing branch
    if (/^(dev|preview|test)[/-]/.test(branch.name)) {
      return {
        parent: 'seed', // ADR-024: working branches derive from synthetic data only
        ttl: branch.name.startsWith('dev') ? '14d' : '7d',
        postgres: {
          computeSettings: {
            autoscalingLimitMinCu: 0.25,
            autoscalingLimitMaxCu: 1,
            suspendTimeout: 300,
          },
        },
      };
    }
    return {};
  },
});
