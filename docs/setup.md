# Setup: from a clean checkout to a running API

## Prerequisites

- Node.js **24** (`.nvmrc`), pnpm **12** (`corepack enable`), git.
- Neon CLI ≥ 8.11 (`npm i -g neon`) and access to the **`nnoo-dev`** project only.
- Docker Desktop (for Testcontainers integration tests). Without Docker, see "Integration tests on a
  Neon test branch" below.

## 1. Install and run the offline gates

```bash
pnpm install --frozen-lockfile
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## 2. Link to the dev project and create your branch

Never link a laptop to `nnoo-prod`.

```bash
neon login
neon link --project-id rapid-queen-34040580 --branch seed --no-env-pull   # nnoo-dev
neon branches create --project-id rapid-queen-34040580 --name dev/<you> --parent seed \
  --expires-at "$(date -u -v+14d +%Y-%m-%dT%H:%M:%SZ)" --cu 0.25-1 --no-secrets
neon checkout dev/<you> --no-env-pull
```

Your branch inherits `seed`'s migrations, roles and synthetic data.

## 3. Write `.env.local` (gitignored)

Copy `.env.example`. Set:

- `NNOO_ENV=local`, `SMS_PROVIDER=fake`, `EMAIL_PROVIDER=fake`
- `APP_DATABASE_URL`: your branch's **pooled** host with user `nnoo_app_login` and the password a
  maintainer shares out of band (`neon connection-string dev/<you> --pooled --role-name nnoo_owner`
  gives the host; replace user and password; add `sslmode=verify-full`). Never use the owner role.
- `MIGRATION_DATABASE_URL`: `neon connection-string dev/<you> --role-name nnoo_owner --database-name nnoo` (direct host)
- `AUTH_SECRET`, `EDGE_AUTH_SECRETS`: fresh random values (`.env.example` shows how).

## 4. Migrate and run

```bash
set -a; . ./.env.local; set +a
pnpm db:migrate          # guarded: refuses a project that does not match NNOO_ENV
pnpm dev                 # neon dev: serves api (and jobs) with hot reload
curl -H "x-edge-auth: $EDGE_AUTH_SECRETS" http://localhost:8787/v1/health
```

`neon dev` may warn that it cannot pick a role for "Neon env"; that is expected: the runtime reads
`APP_DATABASE_URL` from `.env.local`, never the owner `DATABASE_URL`.

**Sign in locally:** `POST /v1/auth/phone-number/send-otp` → the code is in
`.local/otp-inbox.jsonl` (never in logs) → `POST /v1/auth/phone-number/verify` → `POST /v1/sessions`
with header `X-Auth-Session: <token>` → use the returned `accessToken` as `Authorization: Bearer`.

**Run a trigger route locally:** they are trigger-safe, so you can call them directly:
`curl -X POST localhost:<jobs-port>/internal/jobs/drain -H 'x-neon-trigger-invocation-id: local-1' -H 'content-type: application/json' -d '{"version":1,"invocation_id":"local-1","trigger":{"type":"schedule","id":"t","name":"jobs-drain"},"data":{"scheduled_at":"2026-01-01T00:00:00Z"}}'`

**Run the web app:** with `pnpm dev` running, in a second terminal run
`pnpm --filter @nnoo/web dev`, then open http://localhost:5173.

- The Vite proxy forwards `/v1` to `API_PROXY_TARGET` (default `http://localhost:8787`) and adds
  `X-Edge-Auth` from `EDGE_AUTH_SECRETS` in `.env.local`.
- Sign-in codes appear in `.local/otp-inbox.jsonl`.
- Passkeys work on `localhost`.

**Web end-to-end tests** (Docker; never Neon):

```bash
pnpm --filter @nnoo/web exec playwright install chromium   # once
pnpm --filter @nnoo/web test:e2e
```

These start `apps/api/scripts/e2e-server.ts`: a throwaway Postgres 18 container, migrations, the
runtime role and fake SMS/email that write to `.local/e2e-inbox.jsonl`. They then start the Vite
dev server on :5174.

## 5. Integration tests

```bash
pnpm test:integration                     # Testcontainers Postgres 18 (Docker)
```

### Integration tests on a Neon test branch (no Docker)

```bash
neon branches create --project-id rapid-queen-34040580 --name test-<topic> --parent seed \
  --expires-at "$(date -u -v+1d +%Y-%m-%dT%H:%M:%SZ)" --cu 0.25 --no-secrets
export INTEGRATION_NEON_BRANCH=test-<topic>
export INTEGRATION_DATABASE_URL="$(neon connection-string test-<topic> --project-id rapid-queen-34040580 --role-name nnoo_owner --database-name nnoo)"
pnpm --filter @nnoo/api test:integration
neon branches delete test-<topic> --project-id rapid-queen-34040580
```

The harness refuses anything that is not a `test-*` branch of `nnoo-dev`.

## 6. Deploy your branch (optional)

Write a gitignored env file (`NNOO_ENV=preview`, `SMS_PROVIDER=none`, `EMAIL_PROVIDER=none`,
`NNOO_TRIGGERS=off`, the app-role URL, fresh secrets, `AUTH_BASE_URL` = your api function URL), then:

```bash
neon config plan  --branch dev/<you> --env .local/dev-<you>.env
neon deploy       --branch dev/<you> --env .local/dev-<you>.env --no-env-pull
neon functions get api --branch dev/<you>
neon logs query --branch dev/<you> --source function --since 1h
```

Delete your branch when the work is merged: `neon branches delete dev/<you>`.
