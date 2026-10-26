# ADR-0033: Build the web learner before the mobile apps

Status: Accepted by product owner (2026-10-26)
Date: 2026-10-26

## Context

`10-build-sequence` puts the Expo facilitator app at step 1.6 and the web learner SPA at 4.1. The
product owner asked for the web version first. This machine also has no Xcode or Android Studio,
so mobile work could only be checked in CI or on a phone.

## Decision

1. **Order.** W0 is the web shell and sign-in. W1 is Phase 2 (kin verification, Ikpe, Ọbá
   publish and play) with its web screens. W2 is Phase 3 learning on the web. W3 is the rest of
   Phase 4: Ọha, search and admin. After that come the mobile learner, the Expo facilitator app
   (formerly 1B) and Phase 5.
2. **Recording stays mobile.** `docs/01 §4` gives the web learner no capture surface. Until the
   facilitator app exists, recordings in dev and test come only from API fixtures and scripts,
   with synthetic data.
3. **Web sessions (ADR-028).**
   - The access token lives in memory only.
   - The refresh token is an httpOnly, SameSite=Strict cookie scoped to `/v1/sessions`, sent only
     with a trusted `Origin`.
   - Refreshes take a Web Lock, so two tabs never present the same cookie. Doing so would look
     like reuse and revoke the session family.
   - Only the device id, which is not a secret, goes in `localStorage`.
4. **Edge header.**
   - The browser never holds `X-Edge-Auth`.
   - Locally, the Vite dev server's proxy adds it, reading it in Node; it is never bundled.
   - In deployed environments, the edge Worker adds it (ADR-023).
   - Only `VITE_API_URL` (the edge URL) is public.
   - CI greps the bundle for server-only values.
5. **Passkey relying party.** WebAuthn requires the RP ID to be a domain suffix of the page's
   origin. The default (the API hostname, such as `api.nnoo.app`) cannot serve a web app on
   `app.nnoo.app`. The optional `AUTH_RP_ID`, for example `nnoo.app`, sets it. Boot fails if any
   `AUTH_TRUSTED_ORIGINS` host is not on that domain.
6. **Honest empty states.** Sections that are not built yet say so. The prototype's sample
   elders, lessons and proverbs are not shown as real content.

## Consequences

- Tested end to end in a real browser (Playwright plus axe, against the real API on a throwaway
  Postgres): phone OTP, cookie refresh across a reload, Igbo text kept in NFC, passkey enrolment
  and sign-in through a virtual authenticator, and sign-out.
- Field capture (S-01 on a device) moves later. The audio worker and capture API are built, but
  no client records yet.
- Before deployment, the web needs an edge in front of the API (the Cloudflare account, an external
  step) and a static host for `apps/web/dist`.
