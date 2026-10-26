import { loadRuntimeEnv, type RuntimeEnv } from '@nnoo/config/env';

export const EDGE_SECRET = 'edge-secret-for-tests-0123456789abcdef';

export function testEnv(overrides: Record<string, string> = {}): RuntimeEnv {
  return loadRuntimeEnv({
    NNOO_ENV: 'test',
    FUNCTION_NAME: 'api',
    APP_DATABASE_URL: 'postgresql://nnoo_app_login:test@127.0.0.1:5432/nnoo',
    AUTH_SECRET: 'test-auth-secret-0123456789abcdef0123456789',
    AUTH_BASE_URL: 'http://localhost:8787',
    AUTH_TRUSTED_ORIGINS: 'http://localhost:5173',
    EDGE_AUTH_SECRETS: EDGE_SECRET,
    CORS_ALLOWED_ORIGINS: 'http://localhost:5173',
    MIN_CLIENT_VERSIONS: '{"mobile":"1.6.0"}',
    SMS_PROVIDER: 'fake',
    EMAIL_PROVIDER: 'fake',
    STORAGE_PROVIDER: 'fake',
    AUDIO_WORKER_KEYS: 'worker-key-for-tests-0123456789abcdef',
    LOG_LEVEL: 'error',
    ...overrides,
  });
}
