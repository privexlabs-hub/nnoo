import { readFileSync } from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { INBOX } from '../playwright.config.ts';

/** Latest code the fake SMS/email provider "sent" to this destination (test inbox file). */
async function codeFor(to: string): Promise<string> {
  for (let i = 0; i < 50; i++) {
    const lines = readFileSync(INBOX, 'utf8').trim().split('\n').filter(Boolean);
    const hit = lines
      .map((l) => JSON.parse(l) as { to: string; code: string })
      .reverse()
      .find((m) => m.to === to);
    if (hit) return hit.code;
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`no code sent to ${to}`);
}

async function expectAccessible(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
}

const phone = `+23480${String(Date.now()).slice(-8)}`; // synthetic test number

test('phone sign-in, cookie refresh across reload, profile in Igbo, passkey, sign-out', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Nnọọ. Welcome home.' })).toBeVisible();
  await expectAccessible(page);

  await page.getByLabel(/phone number/i).fill(phone);
  await page.getByRole('button', { name: 'Send code' }).click();
  await page.getByLabel('Six-digit code').fill(await codeFor(phone));
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nnọọ.', exact: true })).toBeVisible();
  await expectAccessible(page);

  // Tokens: refresh token only in an httpOnly cookie; nothing secret in web storage.
  const refreshCookie = (await context.cookies()).find((c) => c.name === 'nnoo_refresh');
  expect(refreshCookie?.httpOnly).toBe(true);
  expect(refreshCookie?.sameSite).toBe('Strict');
  expect(refreshCookie?.path).toBe('/v1/sessions');
  const storage = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
  expect(storage).not.toMatch(/eyJ|refresh/i);

  // Profile: Igbo text keeps its tone marks and dotted vowels.
  await page.getByRole('navigation').getByRole('link', { name: 'You' }).click();
  const name = 'Ọbịageli Nwáńkwọ';
  await page.getByLabel('Name shown to others').fill(name);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Saved.')).toBeVisible();
  await expectAccessible(page);

  // Reload: the in-memory access token is gone; the refresh cookie restores the session.
  await page.reload();
  await expect(page.getByRole('heading', { name })).toBeVisible();

  // Passkey with a virtual authenticator (Chromium WebAuthn domain).
  const cdp = await context.newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
  await page.getByRole('button', { name: 'Add a passkey' }).click();
  await expect(page.getByText('Passkey added.')).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { name: 'Nnọọ. Welcome home.' })).toBeVisible();
  expect((await context.cookies()).find((c) => c.name === 'nnoo_refresh')).toBeUndefined();

  await page.getByRole('button', { name: 'Sign in with a passkey' }).click();
  // Back where they were (You), signed in by passkey.
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
  expect((await context.cookies()).find((c) => c.name === 'nnoo_refresh')?.httpOnly).toBe(true);
  await page.getByRole('navigation').getByRole('link', { name: 'Today' }).click();
  await expect(page.getByRole('heading', { name: `Nnọọ, ${name}.` })).toBeVisible();
});

test('a wrong code gets calm copy and no session', async ({ page, context }) => {
  const other = `+23481${String(Date.now()).slice(-8)}`;
  await page.goto('/');
  await page.getByLabel(/phone number/i).fill(other);
  await page.getByRole('button', { name: 'Send code' }).click();
  const real = await codeFor(other);
  await page.getByLabel('Six-digit code').fill(real === '000000' ? '111111' : '000000');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText(/did not match/);
  expect((await context.cookies()).find((c) => c.name === 'nnoo_refresh')).toBeUndefined();
});
