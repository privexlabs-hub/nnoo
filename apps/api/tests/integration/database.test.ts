import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { inject } from 'vitest';
import { fold } from '@nnoo/igbo-text';
import { runMigrations } from '../../scripts/migrate.ts';
import { asApp, asOwner } from './harness.ts';

const denied = /permission denied/;

async function insertAuthUser(
  c: { query: (q: string, v?: unknown[]) => Promise<unknown> },
  id = randomUUID(),
) {
  await c.query(
    `insert into auth."user" (id, name, email, email_verified) values ($1, 'learner', $2, false)`,
    [id, `${id}@test.nnoo.invalid`],
  );
  return id;
}

describe('migrations', () => {
  it('are idempotent: running them again is a no-op', async () => {
    await expect(runMigrations(inject('ownerUrl'))).resolves.toBeUndefined();
  });

  it('create the expected append-only partitions for audit_log', async () => {
    const parts = await asOwner((c) =>
      c.query<{ n: number }>(
        `select count(*)::int as n from pg_inherits where inhparent = 'audit_log'::regclass`,
      ),
    );
    expect(parts.rows[0]!.n).toBeGreaterThanOrEqual(4); // default + current + 2 ahead
  });
});

describe('Igbo text in SQL (INV-9, ADR-014)', () => {
  const samples = [
    'ụlọ',
    'Ọbá',
    'Nnọọ',
    'Ndị Igbo',
    'Ụbọchị ahịa',
    'ṅ',
    'akwụ̀kwọ́',
    'İ',
    'ọ́',
    'Eke Orie Afọ Nkwọ',
  ];

  it('igbo_fold() matches packages/igbo-text fold() byte for byte', async () => {
    const res = await asOwner((c) =>
      c.query<{ t: string; f: string }>(
        `select t, igbo_fold(t) as f from unnest($1::text[]) as t`,
        [samples],
      ),
    );
    for (const row of res.rows) expect(row.f, row.t).toBe(fold(row.t));
  });

  it('the igbo_text domain rejects non-NFC text', async () => {
    await asOwner(async (c) => {
      await expect(c.query(`select 'ụlọ'::igbo_text`)).resolves.toBeTruthy();
      await expect(c.query(`select $1::igbo_text`, ['ụlọ'])).rejects.toThrow(/igbo_text/);
    });
  });

  it('account.display_name must be NFC', async () => {
    await asOwner(async (c) => {
      const id = await insertAuthUser(c);
      await expect(
        c.query(`update account set display_name = $2 where id = $1`, [id, 'Adá'.normalize('NFD')]),
      ).rejects.toThrow(/account_display_name_nfc/);
    });
  });
});

describe('identity invariants in the database', () => {
  it('every auth user gets an account and a learner grant in the same transaction', async () => {
    const id = await asOwner(async (c) => insertAuthUser(c));
    const rows = await asOwner((c) =>
      c.query(
        `select a.identity_level, g.role, g.granted_via from account a join role_grant g on g.account_id = a.id where a.id = $1`,
        [id],
      ),
    );
    expect(rows.rows).toEqual([{ identity_level: 'none', role: 'learner', granted_via: 'signup' }]);
  });

  it('role grants can never be "granted via admin" (Igbo enwe eze)', async () => {
    await asOwner(async (c) => {
      const id = await insertAuthUser(c);
      await expect(
        c.query(
          `insert into role_grant (id, account_id, role, scope_type, granted_via) values (uuidv7(), $1, 'moderator', 'global', 'admin')`,
          [id],
        ),
      ).rejects.toThrow(/role_grant_not_admin/);
    });
  });

  it('a hometown-scoped grant needs a scope id and a global one must not have it', async () => {
    await asOwner(async (c) => {
      const id = await insertAuthUser(c);
      await expect(
        c.query(
          `insert into role_grant (id, account_id, role, scope_type, granted_via) values (uuidv7(), $1, 'kin', 'hometown', 'vouch')`,
          [id],
        ),
      ).rejects.toThrow(/role_grant_scope_id/);
    });
  });
});

describe('least-privilege runtime role (ADR-026, INV-11)', () => {
  it('cannot update or delete audit rows, directly or through a partition', async () => {
    await asApp(async (c) => {
      await c.query(`insert into audit_log (action, resource_type) values ('test.grants', 'test')`);
      await expect(c.query(`update audit_log set action = 'test.changed'`)).rejects.toThrow(denied);
      await expect(c.query(`delete from audit_log`)).rejects.toThrow(denied);
      await expect(c.query(`truncate audit_log`)).rejects.toThrow(denied);
      const part = await c.query<{ p: string }>(
        `select 'audit_log_' || to_char(now(), 'YYYYMM') as p`,
      );
      await expect(c.query(`delete from ${part.rows[0]!.p}`)).rejects.toThrow(denied);
      await expect(c.query(`update audit_log_default set action = 'x.y'`)).rejects.toThrow(denied);
    });
  });

  it('may only set dispatched_at on outbox events', async () => {
    await asApp(async (c) => {
      const ins = await c.query<{ id: string }>(
        `insert into outbox_event (type, aggregate_id, payload) values ('Test', gen_random_uuid(), '{}') returning id`,
      );
      const id = ins.rows[0]!.id;
      await expect(
        c.query(`update outbox_event set dispatched_at = now() where id = $1`, [id]),
      ).resolves.toBeTruthy();
      await expect(
        c.query(`update outbox_event set type = 'Other' where id = $1`, [id]),
      ).rejects.toThrow(denied);
      await expect(c.query(`delete from outbox_event where id = $1`, [id])).rejects.toThrow(denied);
    });
  });

  it('cannot create objects or grant itself roles', async () => {
    await asApp(async (c) => {
      await expect(c.query(`create table sneaky (id int)`)).rejects.toThrow(denied);
      await expect(c.query(`create role sneaky`)).rejects.toThrow(
        /permission denied|must have CREATEROLE/,
      );
    });
  });

  it('can run partition maintenance through the owner-defined function only', async () => {
    await asApp(async (c) => {
      await expect(
        c.query(
          `select ensure_monthly_partition('audit_log', (now() + interval '3 months')::date)`,
        ),
      ).resolves.toBeTruthy();
      await expect(
        c.query(`select ensure_monthly_partition('account', now()::date)`),
      ).rejects.toThrow(/not a managed partitioned table/);
    });
  });
});
