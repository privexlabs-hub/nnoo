# 02 · neon.ts, environments & dev workflow

## 1. Repository placement

`neon.ts` and `.neon` live at the **monorepo root** (`nnoo/`). Function sources point into `apps/api`.

```
nnoo/
├─ neon.ts               # backend as code (this file)
├─ .neon                 # written by `neon link` — commit? NO (contains project binding per dev); gitignore
├─ .env.local            # written by `neon checkout` / `neon deploy` — gitignored, never committed
├─ apps/api/src/
│  ├─ function.api.ts    # export default Hono app for the `api` function
│  └─ function.jobs.ts   # export default Hono app for the `jobs` function
└─ apps/audio-worker/    # Python container (not deployed by neon)
```

⚠ Verify that `neon deploy` bundles functions which import pnpm workspace packages (`packages/contracts`, `packages/*-core`). Fallback: prebuild each function into a single file with `tsup`/`esbuild` in CI and point `source` at the bundle.

> **As built:** the canonical file is [`/neon.ts`](../../neon.ts). Differences from the sample below: two projects (ADR-027), so the dev project's root branch is `seed`; `auth` and `aiGateway` are off (ADR-028/029); buckets arrive in Phase 1.3; triggers are `jobs-drain`, `invariants`, `maintenance` for now, their cadence chosen from `NNOO_ENV` at deploy time; the `branch` closure gives new `dev/*`, `preview/*`, `test-*` branches the parent `seed`, a TTL and a small compute. Setup steps: [../setup.md](../setup.md).

## 2. The full neon.ts

```typescript
// neon.ts
import { defineConfig } from '@neon/config/v1';

export default defineConfig({
  // Keep the branch policy scaffolded by `neon config init` and tighten it to
  // protect `main` (ADR-024). ⚠ Verify available policy fields.

  aiGateway: true, // paid plan; used only per 08
  // auth: true,            // enable ONLY if ADR-022 selects Managed Better Auth

  buckets: {
    // ⚠ Verify the exact value for private access; the quickstart only shows 'public_read'.
    'media-uploads': { access: 'private' }, // untrusted raw uploads; lifecycle-expired after 7 days
    'media-masters': { access: 'private' }, // FLAC masters, never served
    'media-derivatives': { access: 'private' }, // Opus/AAC/peaks, served via presigned GET
    'consent-evidence': { access: 'private' }, // spoken consent statements, restricted
  },

  functions: {
    api: { name: 'nnoo api', source: './apps/api/src/function.api.ts' },
    jobs: { name: 'nnoo jobs', source: './apps/api/src/function.jobs.ts' },
  },

  triggers: {
    // ── schedules (cron, UTC) ───────────────────────────────────────────
    'jobs-drain': {
      type: 'schedule',
      function: 'jobs',
      cron: '* * * * *',
      functionPath: '/internal/jobs/drain',
    },
    'ikpe-sweep': {
      type: 'schedule',
      function: 'jobs',
      cron: '*/5 * * * *',
      functionPath: '/internal/ikpe/sweep',
    },
    'revocation-sla': {
      type: 'schedule',
      function: 'jobs',
      cron: '*/5 * * * *',
      functionPath: '/internal/consent/sla-check',
    },
    invariants: {
      type: 'schedule',
      function: 'jobs',
      cron: '*/10 * * * *',
      functionPath: '/internal/invariants/check',
    },
    'nightly-reconcile': {
      type: 'schedule',
      function: 'jobs',
      cron: '0 2 * * *',
      functionPath: '/internal/reconcile',
    },
    'nightly-stats': {
      type: 'schedule',
      function: 'jobs',
      cron: '30 2 * * *',
      functionPath: '/internal/stats/hometowns',
    },
    partitions: {
      type: 'schedule',
      function: 'jobs',
      cron: '0 3 25 * *',
      functionPath: '/internal/db/partitions',
    },
    'gloss-coverage': {
      type: 'schedule',
      function: 'jobs',
      cron: '0 4 * * *',
      functionPath: '/internal/i18n/coverage',
    },
    'branch-hygiene': {
      type: 'schedule',
      function: 'jobs',
      cron: '0 5 * * *',
      functionPath: '/internal/ops/branch-hygiene',
    },

    // ── storage events ──────────────────────────────────────────────────
    'upload-created': {
      type: 'storage_object_created',
      function: 'jobs',
      bucket: 'media-uploads',
      functionPath: '/internal/storage/upload-created',
    },
    'evidence-created': {
      type: 'storage_object_created',
      function: 'jobs',
      bucket: 'consent-evidence',
      functionPath: '/internal/storage/evidence-created',
    },
  },
});
```

Triggers branch with the project (see Neon's Function Triggers overview). On preview branches, disable `branch-hygiene` and confirm the triggers fire against the preview's own function. ⚠ Verify the trigger branching behaviour and the `enabled: false` per branch.

## 3. Environments (ADR-027: two projects)

| Env        | Neon project / branch                                         | DB credentials                                       | Auth callbacks / cookies                                            | Functions         | Triggers                       | Data                      |
| ---------- | ------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------- | ----------------- | ------------------------------ | ------------------------- |
| local      | `nnoo-dev` / `dev/<name>` from `seed` (TTL 14 d)              | `nnoo_app_login` pooled; owner only for `db:migrate` | `http://localhost:*`; non-Secure cookies only when `NNOO_ENV=local` | `neon dev`        | off; call routes manually      | synthetic                 |
| test       | Testcontainers Postgres 18, or `nnoo-dev` / `test-*` (≤ 24 h) | throwaway                                            | fake                                                                | in-process Hono   | invoked directly               | fixtures                  |
| preview    | `nnoo-dev` / `preview/pr-<n>` from `seed` (TTL 7 d)           | per-branch `nnoo_app_login`                          | function URL; preview origins                                       | deployed per PR   | drain */15                     | synthetic                 |
| staging    | `nnoo-dev` / `staging` from `seed`                            | per-branch                                           | staging origin                                                      | on merge          | drain */15                     | synthetic + RC migrations |
| production | **`nnoo-prod` / `main`** (not created yet)                    | `nnoo_app_login`; owner only in CI `production` env  | `https://app.nnoo.app` etc., Secure + SameSite                      | tag + 2 approvals | documented cadence (paid plan) | real                      |

Object Storage buckets and AI keys follow the branch: none are shared between projects. Seeding: only `seed` (synthetic); production is never seeded.

### Original single-project mapping (superseded by ADR-027)

See ADR-024 for the policy. Mapping:

| Env (docs/09) | Neon branch                                                                    | Functions                  | Triggers                      | Data                      |
| ------------- | ------------------------------------------------------------------------------ | -------------------------- | ----------------------------- | ------------------------- |
| local         | `dev/<name>` (or local Postgres via Testcontainers for unit/integration tests) | `neon dev`                 | off, or manual `curl`         | synthetic                 |
| preview       | `preview/pr-<n>` from `seed`                                                   | deployed per PR            | on (schedules can be thinned) | synthetic                 |
| staging       | `staging` from `seed`                                                          | deployed on merge          | on                            | synthetic + RC migrations |
| production    | `main`                                                                         | deployed on tag + approval | on                            | real                      |

## 4. Environment variables

| Variable                                                                          | Source                               | Used by                         | Notes                                             |
| --------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------- | ------------------------------------------------- |
| `DATABASE_URL`                                                                    | injected by `neon checkout`/`deploy` | **CI migrations only**          | Owner role. Never read by runtime code (ADR-026). |
| `APP_DATABASE_URL`                                                                | set per branch (⚠ Verify mechanism)  | `api`, `jobs`                   | `nnoo_app` role, **pooled** host                  |
| `APP_DATABASE_URL_DIRECT`                                                         | set per branch                       | partition/maintenance jobs only | unpooled host, for session-level operations       |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, `AWS_REGION` | injected for buckets                 | `api`, `jobs` (presigning)      | never shipped to clients                          |
| `NEON_AI_GATEWAY_TOKEN`, `NEON_AI_GATEWAY_BASE_URL`                               | injected when `aiGateway: true`      | `jobs` (drafting) only          | `api` never calls AI inline                       |
| `EDGE_AUTH_SECRET`                                                                | secret store (07 §6)                 | `api`                           | checked on every `/v1` request (ADR-023)          |
| `AUTH_*` (Better Auth secrets / JWKS URL)                                         | secret store or managed auth         | `api`                           |                                                   |
| `SERVICE_TOKEN_SIGNING_KEY`                                                       | secret store                         | `jobs`                          | signs audio-worker tokens                         |
| `PAYMENTS_*`, `SMS_*`, `PUSH_*`, `SENTRY_DSN`                                     | secret store                         | `api`, `jobs`                   | providers behind ports                            |
| `EXPO_PUBLIC_API_URL`, `VITE_API_URL`                                             | client build config                  | mobile, web                     | the **edge** URL, never the raw function URL      |

Validate every variable at cold start with a Zod schema (`packages/config/env.ts`). A missing variable is a crash at boot, not a runtime surprise.

## 5. Developer workflow

```bash
# one-time
npm i -g neon
neon login
neon link --no-config                 # bind repo to the `nnoo` project
neon checkout dev/<your-name>         # branch from `seed`  (⚠ Verify parent selection flag)

# daily
pnpm db:migrate                       # drizzle-kit migrate against your dev branch
pnpm seed                             # synthetic elders/recordings/kin (never real data)
neon dev                              # serves api + jobs locally with injected Neon env
pnpm --filter web dev                 # web learner against local api
pnpm --filter mobile start            # Expo against local api (tunnel)

# exercise a trigger endpoint locally
curl -X POST localhost:<port>/internal/ikpe/sweep -H 'x-neon-trigger-invocation-id: local-test'

# inspect
neon functions get api                # function URL for your branch
neon logs query --source function     # function logs
```

Rules:

- Never `neon checkout main` on a laptop. Production access is break-glass only (07 §8).
- Never paste production connection strings anywhere. CI holds them through OIDC/secret store.
- Delete your branch when the work is merged (`branch-hygiene` expires stale `dev/*` after 14 days).

## 6. The seed branch

`seed` is rebuilt weekly by CI from `tools/seed`:

- 3 synthetic hometowns, ~200 synthetic accounts (kin, facilitators, custodians, minors with guardians)
- ~60 recordings across every state (draft, in_review, published, returned, withdrawn), with generated tone-bearing audio (TTS or synthesized contours) and placeholder consent evidence
- Ikpe cases in every status, including bootstrap mode, paused-with-flag and timed-out
- Fixtures for every scenario in `docs/07 §5`

Because previews branch from `seed`, every PR gets a realistic, fully populated environment in seconds, with no production data.
