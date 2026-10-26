# ADR-0028: Better Auth as a library in `api`, plus refresh-token rotation in identity

Status: Accepted (resolves ADR-022)
Date: 2026-10-25 Deciders: engineering, product owner (sign-in methods)

## Context

ADR-022 required phone OTP, passkeys, device-bound minor sign-in, short access JWTs, rotating
refresh tokens with reuse detection, JWKS verification and data in our region, and chose Managed
Better Auth only if it met all of them. Checked 2026-10-25: Managed Better Auth exposes no
passkeys, no MFA, no phone-first sign-up (existing users can only link a number), and no custom
JWT claims. The product owner chose phone OTP + passkeys + email OTP for v1 (Apple/Google with
the mobile apps).

## Decision

- Run **Better Auth 1.7 as a library inside the `api` function**, tables in the `auth` schema
  (owned by identity), plugins: `phoneNumber` (6 digits, 5 min, 5 attempts, sign-up on
  verification), `emailOTP` (hashed storage), `@better-auth/passkey`, `jwt` (EdDSA/Ed25519).
  Mounted at `/v1/auth/*` behind an allow-list; `/token`, password routes, `delete-user`,
  `list/revoke-session` and everything else return 404.
- A Better Auth session is only a **15-minute ceremony handle**, never refreshed. The client
  exchanges it once (`POST /v1/sessions`, unique `auth_session_id`) for:
  - an **access JWT**, 10 minutes, claims `sub`, `sid`, `ver`, `amr`, `jti`; `aud=nnoo-api`;
    signed with Better Auth's managed keys; verified in-process from `auth.jwks`;
  - a **refresh token**: 256-bit random, SHA-256 stored, single use, sliding 30 days, bound to a
    device. Presenting a used token, or one from another device, revokes the whole session family.
- Roles are never in tokens; the actor (status, age band, roles, session state) is loaded per
  request with a 60-second cache.
- Web keeps the refresh token in an httpOnly, Secure, SameSite=Strict cookie scoped to
  `/v1/sessions`, and cookie-borne requests must carry a trusted `Origin`. Mobile keeps it in
  secure storage and sends it in the body.
- `account` (public schema) is created by a database trigger in the same transaction as
  `auth.user`; contact details (phone, email) live only in `auth.user`.

## Consequences

- We operate auth ourselves (key rotation, upgrades). Better Auth upgrades are guarded by
  `tests/unit/auth-schema.test.ts`, which compares our tables with `getAuthTables()`.
- **Known limitation:** the phone-number plugin stores the current OTP in plain text in
  `auth.verification` for its 5-minute life (email OTP is hashed). It is readable only by the
  owner and `nnoo_app` roles. Mitigation options: a custom `verifyOTP` with our own hashed store,
  or an SMS provider's verify API (Termii/Twilio Verify). Decide with the SMS provider (Phase 1).
- Passkey ceremonies are configured but **not yet tested end to end** (needs a browser virtual
  authenticator: Playwright, when the web client exists).
- Step-up (`amr` must include `passkey` for facilitator submit, consent changes and panel
  decisions) is enforced from Phase 1, when those routes exist.

## Alternatives considered

Managed Better Auth (fails passkeys/MFA/phone-first); a custom auth implementation (more risk than
a maintained library); third-party IdP (cost, data residency, ADR-008).

## Revisit when

Managed Better Auth supports passkeys and phone-first sign-up, or Better Auth gains native refresh
rotation with reuse detection.
