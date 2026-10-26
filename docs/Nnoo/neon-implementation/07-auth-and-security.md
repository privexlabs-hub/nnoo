# 07 · Auth & security on Neon

`engineering-docs/06` remains the security model. This file covers the Neon-specific implementation.

## 1. Authentication with Better Auth (ADR-022)

**Phase 0 spike: acceptance tests both options must pass**

| Requirement | Test |
|---|---|
| Phone OTP sign-in (6 digits, 5 min TTL, 5 attempts) through our SMS port | sign in with a test number, exhaust attempts, get locked |
| Passkey enrolment and sign-in (WebAuthn: iOS, Android, web) | enrol on each platform, sign in without OTP |
| Minor account created by a guardian, device-bound credential | guardian creates a minor, the minor signs in on a paired device only |
| Short-lived access JWT (10 min) + rotating refresh with reuse detection | replaying an old refresh token revokes the session family |
| JWKS endpoint for verification in `api` | `api` verifies tokens offline from cached JWKS |
| Session revoke on demand (compromise, suspension) | revoke → next refresh fails; access tokens expire ≤ 10 min |
| Data location: auth tables in our region, exportable | inspect the tables or export |

- **Option A, Managed Better Auth** (`auth: true`): fewer moving parts. Choose it only if every row passes. ⚠ Verify plugin availability and configuration in the managed offering.
- **Option B, Better Auth library in `api`**: tables in schema `auth`, owned by the identity module. We operate it ourselves, but it is fully configurable.

**Either way**, the JWT carries only `sub`, `sid` and `ver`. Roles are loaded from `role_grant` per request (60 s cache, invalidated by events). Revoking a role takes effect within a minute.

```typescript
// apps/api/src/platform/auth.ts
import { createRemoteJWKSet, jwtVerify } from 'jose';
const jwks = createRemoteJWKSet(new URL(env.AUTH_JWKS_URL), { cacheMaxAge: 10 * 60_000 });

export const authenticate = createMiddleware<AppEnv>(async (c, next) => {
  const token = c.req.header('authorization')?.replace(/^Bearer /, '');
  let actor: Actor = Actor.anonymous();
  if (token) {
    const { payload } = await jwtVerify(token, jwks, { issuer: env.AUTH_ISSUER, audience: 'nnoo-api' });
    actor = await identity.loadActor(payload.sub!, payload.sid as string);   // roles, scopes, minor flag
    if (actor.suspended) return problem(c, 'identity.suspended', 403);
  }
  c.set('ctx', { actor, requestId: c.get('requestId') });
  await next();
});
```

**Second factor for sensitive roles.** Facilitator submit, consent changes and panel decisions require `amr` to include `passkey` or `otp+totp` in the token (step-up). Otherwise the response is `401 identity.step_up_required`.

## 2. Edge and origin protection (ADR-023)

- The edge proxy adds `X-Edge-Auth: <secret>`. `api` rejects any `/v1` request without it, returning `404` so it doesn't reveal that the route exists. Rotate the secret quarterly, accepting two secrets during the overlap.
- Edge WAF rules: OTP routes get a bot challenge, and are limited per IP to 5/min and per number to 3 per 15 min. Body size is capped at 1 MB on `/v1` (uploads go straight to storage).
- `jobs` has no edge. Protection is described in 06 §5 (trigger-safe design) and in the service tokens.

## 3. Policy enforcement

Unchanged from `engineering-docs/06 §3`. Implementation notes:
- Policy tables live in `modules/*/domain/policies.ts`. `route()` refuses to boot without a policy (04 §3).
- Resource loads always include the scope predicate in SQL (`WHERE id = $1 AND <actor can see>`), which prevents IDOR.
- The authz matrix runs in CI against a preview branch (from `seed`) with every actor fixture.

## 4. Database roles and grants (ADR-026)

Create the roles once per branch lineage (on `main` and `seed`; children inherit them). Neon supports `CREATE ROLE` from SQL for privileged roles, or through Console/CLI/API.

```sql
-- 0004_custom_grants.sql  (runs as nnoo_owner)
CREATE ROLE nnoo_app NOLOGIN;          -- LOGIN role nnoo_app_login is created via Neon (password managed there) and GRANTed nnoo_app
CREATE ROLE nnoo_readonly NOLOGIN;

GRANT USAGE ON SCHEMA public TO nnoo_app, nnoo_readonly;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO nnoo_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO nnoo_app;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO nnoo_readonly;

-- INV-11: append-only tables
REVOKE UPDATE, DELETE ON ikpe_vote_event, audit_log, outbox_event FROM nnoo_app;
GRANT UPDATE (dispatched_at) ON outbox_event TO nnoo_app;       -- the only mutable column

-- votes: no deletes ever; updates only via upsert columns
REVOKE DELETE ON ikpe_vote FROM nnoo_app;
REVOKE UPDATE ON ikpe_vote FROM nnoo_app;
GRANT UPDATE (choice, wait_reason, updated_at) ON ikpe_vote TO nnoo_app;

-- consent: history is immutable; only revocation fields can change
REVOKE UPDATE, DELETE ON consent_record FROM nnoo_app;
GRANT UPDATE (revoked_at, revoked_by, revocation_reason) ON consent_record TO nnoo_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO nnoo_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO nnoo_readonly;
```

A CI test connects as `nnoo_app` and asserts that `UPDATE audit_log`, `DELETE FROM ikpe_vote_event` and `UPDATE consent_record SET tier=…` all fail with `permission denied`. New tables require an explicit grants review; default privileges give CRUD, so append-only tables must add their REVOKE in the same migration.

**Row-Level Security** is an optional extra layer for `consent_record` and `media_asset`, keyed on `current_setting('app.actor_id', true)` set by the transaction helper. Adopt it only with an ADR, because it is easy to get subtly wrong with the pooler. Use `set_config(..., true)` inside the transaction only.

## 5. Storage security

- Buckets are private. Credentials exist only in the `api` and `jobs` function env. The audio worker gets presigned URLs only (ADR-021).
- Presigned PUTs are bound to an exact key and content type. Expiry is 15 min for single objects and 60 min per part.
- The upload trigger quarantines orphan objects and anything for an Nsọ recording (05 §4).
- Bucket CORS (web playback): `GET` only, origins `https://app.nnoo.app` (+ preview origins on preview branches). ⚠ Verify the CORS configuration method.

## 6. Secrets

| Secret | Where | Rotation |
|---|---|---|
| Neon-injected (DB owner URL, S3 keys, AI Gateway token) | Neon (`neon deploy` injects into the function env). Locally, `.env.local` (gitignored). | Rotate through Neon on incident and yearly |
| App DB URL (`nnoo_app_login`) | function env per branch | yearly / on incident |
| Edge secret, service-token signing key, auth secrets, provider keys | function env from a secret manager. ⚠ Verify whether `neon.ts` / `@neon/env` support secret references; otherwise inject from CI through the Neon API at deploy time. | quarterly (edge), yearly (others) |
| Mobile / web | public config only (`EXPO_PUBLIC_API_URL`) | — |

- `gitleaks` in CI. `.env*`, `.neon` and `*.pem` are in `.gitignore`. Pre-commit hook blocks secrets.
- Validate env at boot (02 §4). The function refuses to start with a missing secret.

## 7. Branch data protection (ADR-024)

- Preview, dev and staging branches derive from `seed`, so they **never contain production personal data, consent evidence or audio**.
- `main` is protected in the branch policy. Restore branches from `main` are break-glass: created by CI on an approved incident ticket, network access restricted, deleted in ≤ 24 h. Their creation is posted to the council channel.
- Because branching also forks buckets, the revocation ledger (`consent_record` revocations + `media_asset.purged_at`) is **replayed** on any branch derived from `main` before it is used for anything (09 §6).

## 8. Operator access

- No standing `main` access for humans. Neon console membership for `main` is limited to 2 named operators with hardware-key SSO.
- Break-glass is a time-boxed role (`nnoo_breakglass`, read-only by default), granted through an audited CI job with a second approver, auto-revoked after 2 h, and reported to the council channel.
- Neon project audit events are exported to the security log. ⚠ Verify availability.

## 9. Threats added by the platform

| Threat | Mitigation |
|---|---|
| Spoofed trigger calls | trigger-safe endpoints, invocation dedupe, rate limits (06 §5) |
| Direct calls to the function URL bypassing the edge | `X-Edge-Auth` requirement |
| Production data copied into a preview by `neon checkout main` | branch policy, CI-only production credentials, `branch-hygiene` audit, SEV2 policy |
| Leaked AI Gateway token | `jobs`-only, usage alerts, rotation. It can't reach data on its own. |
| Over-privileged runtime DB role | ADR-026 grants + CI permission tests |
| Leaked S3 keys | keys only in function env; bucket access logs reviewed; rotate on suspicion |
