import {
  startAuthentication,
  startRegistration,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';
import { z } from 'zod';
import { ApiError, http, toError } from '../api/client.ts';

// Better Auth sign-in ceremonies under /v1/auth (allow-listed by the API). Each completed
// ceremony leaves a short-lived httpOnly cookie that exchangeCeremony() turns into a session.

async function ok(res: Response): Promise<unknown> {
  if (!res.ok) throw await toError(res);
  return res.json().catch(() => ({}));
}

export const E164 = /^\+[1-9]\d{7,14}$/;

/** "+234 803-000 0000" → "+2348030000000" */
export const normalisePhone = (raw: string) => raw.replace(/[\s()-]/g, '');

export const sendPhoneCode = async (phoneNumber: string) =>
  void (await ok(await http('/v1/auth/phone-number/send-otp', { json: { phoneNumber } })));

export const verifyPhoneCode = async (phoneNumber: string, code: string) =>
  void (await ok(await http('/v1/auth/phone-number/verify', { json: { phoneNumber, code } })));

export const sendEmailCode = async (email: string) =>
  void (await ok(
    await http('/v1/auth/email-otp/send-verification-otp', { json: { email, type: 'sign-in' } }),
  ));

export const verifyEmailCode = async (email: string, otp: string) =>
  void (await ok(await http('/v1/auth/sign-in/email-otp', { json: { email, otp } })));

export async function signInWithPasskey(): Promise<void> {
  // The server builds and later verifies these WebAuthn options; the browser only relays them.
  const options = await ok(await http('/v1/auth/passkey/generate-authenticate-options'));
  const response = await startAuthentication({
    optionsJSON: options as PublicKeyCredentialRequestOptionsJSON,
  });
  await ok(await http('/v1/auth/passkey/verify-authentication', { json: { response } }));
}

/** Needs a live ceremony cookie (signed in within the last 15 minutes). */
export async function registerPasskey(name: string): Promise<void> {
  const res = await http('/v1/auth/passkey/generate-register-options');
  if (res.status === 401) throw new ApiError(401, 'identity.session_required');
  const options = await ok(res);
  const { clientExtensionResults: _ext, ...response } = await startRegistration({
    optionsJSON: options as PublicKeyCredentialCreationOptionsJSON,
  });
  await ok(await http('/v1/auth/passkey/verify-registration', { json: { response, name } }));
}

export const PasskeyList = z.array(
  z.object({ id: z.string(), name: z.string().nullish(), createdAt: z.coerce.date() }).loose(),
);

export async function listPasskeys(): Promise<z.infer<typeof PasskeyList> | null> {
  const res = await http('/v1/auth/passkey/list-user-passkeys');
  if (res.status === 401) return null; // ceremony expired: list needs a fresh sign-in
  return PasskeyList.parse(await ok(res));
}

export const deletePasskey = async (id: string) =>
  void (await ok(await http('/v1/auth/passkey/delete-passkey', { json: { id } })));
