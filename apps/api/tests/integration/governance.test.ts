import { uuidv7 } from 'uuidv7';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bootstrapInterimCouncil } from '../../src/modules/governance/public.ts';
import { asApp, asOwner, harness } from './harness.ts';
import { seedHometown, signIn, type Person } from './fixtures.ts';

const h = harness();
afterAll(() => h.close());

let towns: Awaited<ReturnType<typeof seedHometown>>[];
let custodians: Person[];

beforeAll(async () => {
  // Test databases only (the harness refuses anything else): start from no bootstrap.
  await asOwner(async (c) => {
    await c.query(`delete from role_grant where granted_via like 'governance:%'`);
    await c.query(`delete from governance_event`);
  });
  towns = [await seedHometown(), await seedHometown(), await seedHometown()];
  custodians = [];
  for (let i = 0; i < 5; i++) custodians.push(await signIn(h, { passkey: true }));
});

describe('interim council bootstrap (decision 2)', () => {
  it('refuses fewer than 5 people, fewer than 3 hometowns, or fewer than 2 approvers', async () => {
    const four = custodians
      .slice(0, 4)
      .map((c, i) => ({ accountId: c.id, hometownId: towns[i % 3]!.hometown }));
    await expect(
      bootstrapInterimCouncil(h.deps.db, {
        charter: 'v0',
        custodians: [...four, four[0]!],
        approvers: ['a', 'b'],
      }),
    ).rejects.toThrow(/governance.invalid_bootstrap/);
    const oneTown = custodians.map((c) => ({ accountId: c.id, hometownId: towns[0]!.hometown }));
    await expect(
      bootstrapInterimCouncil(h.deps.db, {
        charter: 'v0',
        custodians: oneTown,
        approvers: ['a', 'b'],
      }),
    ).rejects.toThrow(/governance.invalid_bootstrap/);
    const ok = custodians.map((c, i) => ({ accountId: c.id, hometownId: towns[i % 3]!.hometown }));
    await expect(
      bootstrapInterimCouncil(h.deps.db, { charter: 'v0', custodians: ok, approvers: ['a', 'a'] }),
    ).rejects.toThrow(/governance.invalid_bootstrap/);
  });

  it('grants custodian roles once, under a recorded event, and never again', async () => {
    // Custodians 0 and 3 share towns[0]; 1 and 4 share towns[1]; 2 holds towns[2].
    const council = custodians.map((c, i) => ({
      accountId: c.id,
      hometownId: towns[i % 3]!.hometown,
    }));
    const r = await bootstrapInterimCouncil(h.deps.db, {
      charter: 'Charter v0 (test)',
      custodians: council,
      approvers: ['reviewer-1', 'reviewer-2'],
    });
    expect(r.granted).toBe(5);
    await expect(
      bootstrapInterimCouncil(h.deps.db, {
        charter: 'again',
        custodians: council,
        approvers: ['x', 'y'],
      }),
    ).rejects.toThrow(/governance.already_bootstrapped/);
    await asApp(async (c) => {
      await expect(c.query(`delete from governance_event`)).rejects.toThrow(/permission denied/);
    });
  });

  it('the database refuses a custodian grant without a governance event (INV-5)', async () => {
    await asApp(async (c) => {
      await expect(
        c.query(
          `insert into role_grant (id, account_id, role, scope_type, scope_id, granted_via) values (uuidv7(), $1, 'custodian', 'hometown', $2, $3)`,
          [custodians[0]!.id, towns[0]!.hometown, `governance:${uuidv7()}`],
        ),
      ).rejects.toThrow(/INV-5/);
    });
  });
});

describe('becoming a facilitator: training + two custodian sign-offs (01 §3)', () => {
  it('grants the role on the second distinct sign-off, and the new facilitator can record', async () => {
    const town = towns[0]!; // custodians 0 and 3
    const applicant = await signIn(h, { passkey: true });
    const appId = uuidv7();
    const a = await applicant.call('/v1/facilitator-applications', {
      json: { id: appId, hometownId: town.hometown },
    });
    expect(a.status).toBe(201);

    // Before training: refused.
    const early = await custodians[0]!.call(`/v1/facilitator-applications/${appId}/signoffs`, {
      method: 'POST',
    });
    expect(await early.json()).toMatchObject({ code: 'community.signoff_not_allowed' });

    await applicant.call(`/v1/facilitator-applications/${appId}/training-complete`, {
      method: 'POST',
    });

    // A custodian of another hometown: refused.
    const wrongTown = await custodians[1]!.call(`/v1/facilitator-applications/${appId}/signoffs`, {
      method: 'POST',
    });
    expect(wrongTown.status).toBe(403);

    const first = await custodians[0]!.call(`/v1/facilitator-applications/${appId}/signoffs`, {
      method: 'POST',
    });
    expect(await first.json()).toMatchObject({ status: 'pending', signoffs: 1 });
    // The same custodian twice still counts once.
    const again = await custodians[0]!.call(`/v1/facilitator-applications/${appId}/signoffs`, {
      method: 'POST',
    });
    expect(await again.json()).toMatchObject({ status: 'pending', signoffs: 1 });

    const second = await custodians[3]!.call(`/v1/facilitator-applications/${appId}/signoffs`, {
      method: 'POST',
    });
    expect(await second.json()).toMatchObject({ status: 'approved', signoffs: 2 });

    const elder = await applicant.call('/v1/elders', {
      json: {
        id: uuidv7(),
        displayName: 'Nne Ọbịageli',
        hometownId: town.hometown,
        dialectId: town.dialect,
      },
    });
    expect(elder.status).toBe(201);
  });

  it('a custodian cannot sign off their own application, and needs a passkey session', async () => {
    const town = towns[0]!;
    const appId = uuidv7();
    await custodians[3]!.call('/v1/facilitator-applications', {
      json: { id: appId, hometownId: town.hometown },
    });
    await custodians[3]!.call(`/v1/facilitator-applications/${appId}/training-complete`, {
      method: 'POST',
    });
    const self = await custodians[3]!.call(`/v1/facilitator-applications/${appId}/signoffs`, {
      method: 'POST',
    });
    expect(await self.json()).toMatchObject({ code: 'community.signoff_not_allowed' });

    const otpCustodian = await signIn(h);
    await asOwner((c) =>
      c.query(
        `insert into role_grant (id, account_id, role, scope_type, scope_id, granted_via) values (uuidv7(), $1, 'custodian', 'hometown', $2, 'bootstrap')`,
        [otpCustodian.id, town.hometown],
      ),
    );
    const noPasskey = await otpCustodian.call(`/v1/facilitator-applications/${appId}/signoffs`, {
      method: 'POST',
    });
    expect(await noPasskey.json()).toMatchObject({ code: 'identity.step_up_required' });
  });

  it('the database refuses a facilitator grant that skips the sign-offs (INV-5)', async () => {
    await asApp(async (c) => {
      await expect(
        c.query(
          `insert into role_grant (id, account_id, role, scope_type, scope_id, granted_via) values (uuidv7(), $1, 'facilitator', 'hometown', $2, $3)`,
          [custodians[0]!.id, towns[0]!.hometown, `panel:${uuidv7()}`],
        ),
      ).rejects.toThrow(/INV-5/);
    });
  });

  it('minors cannot apply', async () => {
    const minor = await signIn(h);
    await asOwner((c) =>
      c.query(`update account set age_band = 'age_13_17' where id = $1`, [minor.id]),
    );
    h.deps.actors.invalidate(minor.id);
    const res = await minor.call('/v1/facilitator-applications', {
      json: { id: uuidv7(), hometownId: towns[0]!.hometown },
    });
    expect(res.status).toBe(403);
  });
});
