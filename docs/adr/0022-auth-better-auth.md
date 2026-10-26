# ADR-022: Authentication with Better Auth behind the identity module

Status: Resolved by ADR-028 (Option B). Managed Better Auth does not expose passkeys, MFA, phone-first sign-up or custom JWT claims (checked 2026-10-25 against neon.com/docs/auth/guides/plugins and the roadmap).
Date: 2026-10-25 (recorded from docs/neon/01; original text below)

**Decision.** Run a Phase 0 spike to choose between:

- **A: Managed Better Auth** (`auth: true` in `neon.ts`)
- **B: Better Auth as a library** inside `api`, with tables in a dedicated `auth` schema

Requirements: phone-number OTP, passkeys, device-bound minor sign-in, refresh-token rotation with reuse detection, JWTs verifiable by JWKS.

Pick A only if it meets all of them (⚠ Verify plugin support in the managed offering). In both cases **roles, kin membership and guardianship stay in our identity/community tables**. Authentication says _who you are_; Nnọọ decides _what you may do_.
