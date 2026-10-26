import { describe, expect, it } from 'vitest';
import { EnvError, loadRuntimeEnv } from './env.ts';
import {
  assertNotProductionDatabase,
  assertProjectMatchesEnv,
  TopologyError,
} from './environments.ts';

const s3 = {
  STORAGE_PROVIDER: 's3',
  AWS_ACCESS_KEY_ID: 'AKIA-test',
  AWS_SECRET_ACCESS_KEY: 'secret-test',
  AWS_ENDPOINT_URL_S3: 'https://storage.example.invalid',
  AWS_REGION: 'eu-central-1',
};

const base = {
  NNOO_ENV: 'local',
  APP_DATABASE_URL: 'postgresql://nnoo_app_login:pw@localhost:5432/nnoo',
  AUTH_SECRET: 'x'.repeat(32),
  AUTH_BASE_URL: 'http://localhost:8787',
  EDGE_AUTH_SECRETS: 'e'.repeat(32),
  SMS_PROVIDER: 'fake',
  EMAIL_PROVIDER: 'fake',
  STORAGE_PROVIDER: 'fake',
};

describe('loadRuntimeEnv', () => {
  it('accepts a valid local environment', () => {
    const env = loadRuntimeEnv(base);
    expect(env.NNOO_ENV).toBe('local');
    expect(env.EDGE_AUTH_SECRETS).toHaveLength(1);
  });

  it('has no default for NNOO_ENV', () => {
    const { NNOO_ENV: _omit, ...rest } = base;
    expect(() => loadRuntimeEnv(rest)).toThrow(EnvError);
  });

  it('rejects fake providers outside local/test', () => {
    expect(() => loadRuntimeEnv({ ...base, ...s3, NNOO_ENV: 'staging' })).toThrow(
      /fake SMS_PROVIDER/,
    );
  });

  it('requires every trusted origin to sit on the passkey relying-party domain', () => {
    const prod = {
      AUTH_BASE_URL: 'https://api.nnoo.app',
      AUTH_TRUSTED_ORIGINS: 'https://app.nnoo.app',
    };
    expect(() => loadRuntimeEnv({ ...base, ...prod })).toThrow(/AUTH_RP_ID/);
    expect(loadRuntimeEnv({ ...base, ...prod, AUTH_RP_ID: 'nnoo.app' }).AUTH_RP_ID).toBe(
      'nnoo.app',
    );
    expect(() =>
      loadRuntimeEnv({
        ...base,
        ...prod,
        AUTH_RP_ID: 'nnoo.app',
        AUTH_TRUSTED_ORIGINS: 'https://evil.example',
      }),
    ).toThrow(/AUTH_RP_ID/);
    // Locally the API and the web dev server share the host `localhost`.
    expect(
      loadRuntimeEnv({ ...base, AUTH_TRUSTED_ORIGINS: 'http://localhost:5173' }).AUTH_RP_ID,
    ).toBeUndefined();
  });

  it('rejects the owner role at runtime (ADR-026)', () => {
    expect(() =>
      loadRuntimeEnv({ ...base, APP_DATABASE_URL: 'postgresql://nnoo_owner:pw@localhost/nnoo' }),
    ).toThrow(/must connect as nnoo_app_login/);
  });

  it('allows provider "none" before launch but never in production', () => {
    expect(
      loadRuntimeEnv({
        ...base,
        ...s3,
        NNOO_ENV: 'preview',
        SMS_PROVIDER: 'none',
        EMAIL_PROVIDER: 'none',
      }).SMS_PROVIDER,
    ).toBe('none');
    expect(() =>
      loadRuntimeEnv({
        ...base,
        ...s3,
        NNOO_ENV: 'production',
        AUTH_BASE_URL: 'https://api.nnoo.app',
        SMS_PROVIDER: 'none',
        EMAIL_PROVIDER: 'resend',
      }),
    ).toThrow(/real SMS and email providers/);
  });

  it('refuses fake storage outside local/test and needs S3 credentials for s3', () => {
    expect(() =>
      loadRuntimeEnv({
        ...base,
        NNOO_ENV: 'preview',
        SMS_PROVIDER: 'none',
        EMAIL_PROVIDER: 'none',
      }),
    ).toThrow(/fake storage/);
    expect(() => loadRuntimeEnv({ ...base, STORAGE_PROVIDER: 's3' })).toThrow(/AWS_ACCESS_KEY_ID/);
  });

  it('requires https in production', () => {
    expect(() =>
      loadRuntimeEnv({
        ...base,
        ...s3,
        NNOO_ENV: 'production',
        SMS_PROVIDER: 'termii',
        EMAIL_PROVIDER: 'resend',
      }),
    ).toThrow(/production requires https/);
  });

  it('never echoes secret values in the error', () => {
    const secret = 'super-secret-value-that-is-too-short';
    try {
      loadRuntimeEnv({
        ...base,
        AUTH_SECRET: 'short',
        APP_DATABASE_URL: `postgresql://nnoo_owner:${secret}@h/db`,
      });
      expect.unreachable();
    } catch (e) {
      expect(String(e)).not.toContain(secret);
    }
  });

  it('accepts two edge secrets during rotation, not three', () => {
    const two = `${'a'.repeat(32)},${'b'.repeat(32)}`;
    expect(loadRuntimeEnv({ ...base, EDGE_AUTH_SECRETS: two }).EDGE_AUTH_SECRETS).toHaveLength(2);
    expect(() =>
      loadRuntimeEnv({ ...base, EDGE_AUTH_SECRETS: `${two},${'c'.repeat(32)}` }),
    ).toThrow();
  });
});

describe('topology guards', () => {
  const topo = {
    dev: { neonProjectId: 'dev-1', envs: ['local'] },
    prod: { neonProjectId: 'prod-1', envs: ['production'], dbHostMarkers: ['ep-prod-123'] },
  };

  it('refuses a production host outside production', () => {
    expect(() =>
      assertNotProductionDatabase(
        'local',
        'postgresql://u:p@ep-prod-123-pooler.eu.neon.tech/db',
        topo,
      ),
    ).toThrow(TopologyError);
    expect(() =>
      assertNotProductionDatabase('local', 'postgresql://u:p@ep-dev-9.eu.neon.tech/db', topo),
    ).not.toThrow();
  });

  it('requires the project id to match the environment', () => {
    expect(() => assertProjectMatchesEnv('staging', 'prod-1', topo)).toThrow(TopologyError);
    expect(() => assertProjectMatchesEnv('production', 'dev-1', topo)).toThrow(TopologyError);
    expect(() => assertProjectMatchesEnv('staging', 'dev-1', topo)).not.toThrow();
  });

  it('fails when production is not registered yet', () => {
    expect(() =>
      assertProjectMatchesEnv('production', 'x', {
        ...topo,
        prod: { ...topo.prod, neonProjectId: null },
      }),
    ).toThrow(/No Neon project is registered/);
  });
});
