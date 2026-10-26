import { getAuthTables } from 'better-auth/db';
import { getTableColumns } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { authOptions } from '../../src/modules/identity/infrastructure/auth.ts';
import * as s from '../../src/modules/identity/infrastructure/schema.ts';
import { testEnv } from './helpers.ts';

/**
 * Our hand-written Drizzle tables must contain every field Better Auth (with our
 * plugins) reads or writes. Fails on a library upgrade that adds fields.
 */
describe('auth schema matches Better Auth', () => {
  const options = authOptions({
    env: testEnv(),
    db: {} as never,
    sms: { sendOtp: async () => {} },
    email: { sendOtp: async () => {} },
  });
  const tables = getAuthTables(options as never) as Record<
    string,
    { modelName: string; fields: Record<string, { fieldName?: string }> }
  >;
  const drizzle: Record<string, Record<string, unknown>> = {
    user: getTableColumns(s.authUser),
    session: getTableColumns(s.authSession),
    account: getTableColumns(s.authAccount),
    verification: getTableColumns(s.authVerification),
    jwks: getTableColumns(s.authJwks),
    passkey: getTableColumns(s.authPasskey),
  };

  for (const [model, def] of Object.entries(tables)) {
    if (model === 'rateLimit') continue; // in-memory rate limit storage: no table
    it(`${model} has every field`, () => {
      const cols = drizzle[model];
      expect(cols, `missing Drizzle table for ${model}`).toBeDefined();
      for (const [field, f] of Object.entries(def.fields)) {
        expect(Object.keys(cols!), `${model}.${field}`).toContain(f.fieldName ?? field);
      }
      expect(Object.keys(cols!)).toContain('id');
    });
  }
});
