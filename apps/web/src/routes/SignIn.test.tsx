import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetSessionForTests } from '../auth/session.ts';
import { SignIn } from './SignIn.tsx';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  resetSessionForTests();
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('<SignIn>', () => {
  it('refuses a number without a country code before calling the API', async () => {
    render(<SignIn onSignedIn={() => {}} />);
    await userEvent.type(screen.getByLabelText(/phone number/i), '08030000000');
    await userEvent.click(screen.getByRole('button', { name: /send code/i }));
    expect(screen.getByRole('alert').textContent).toMatch(/country code/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('phone → code → session exchange', async () => {
    const onSignedIn = vi.fn();
    fetchMock
      .mockResolvedValueOnce(json(200, { status: true }))
      .mockResolvedValueOnce(json(200, { status: true, token: 'x' }))
      .mockResolvedValueOnce(
        json(201, {
          sessionId: '0190a000-0000-7000-8000-000000000001',
          deviceId: '0190a000-0000-7000-8000-000000000002',
          accessToken: 'a',
          accessTokenExpiresAt: new Date(Date.now() + 600_000).toISOString(),
          refreshTokenExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        }),
      );
    render(<SignIn onSignedIn={onSignedIn} />);
    await userEvent.type(screen.getByLabelText(/phone number/i), '+234 803 000 0000');
    await userEvent.click(screen.getByRole('button', { name: /send code/i }));
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual({ phoneNumber: '+2348030000000' });

    await userEvent.type(await screen.findByLabelText(/six-digit code/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    await vi.waitFor(() => expect(onSignedIn).toHaveBeenCalled());
    expect(fetchMock.mock.calls[2]![0]).toBe('/v1/sessions');
  });

  it('shows calm copy for a wrong code, not the server text', async () => {
    fetchMock
      .mockResolvedValueOnce(json(200, { status: true }))
      .mockResolvedValueOnce(json(400, { code: 'INVALID_OTP', message: 'Invalid OTP' }));
    render(<SignIn onSignedIn={() => {}} />);
    await userEvent.click(screen.getByRole('radio', { name: /email/i }));
    await userEvent.type(screen.getByLabelText(/email address/i), 'Ada@Example.org');
    await userEvent.click(screen.getByRole('button', { name: /send code/i }));
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toEqual({
      email: 'ada@example.org',
      type: 'sign-in',
    });
    await userEvent.type(await screen.findByLabelText(/six-digit code/i), '000000');
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/did not match/i);
    expect(screen.queryByText('Invalid OTP')).toBeNull();
  });
});
