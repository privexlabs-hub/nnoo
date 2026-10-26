# ADR-0027: Separate Neon projects for development and production

Status: Accepted
Date: 2026-10-25 Deciders: product owner, engineering

## Context

ADR-024 put every environment in one Neon project as branches, protecting `main` with the branch
policy. Two facts changed that:

- The product owner requires development and production to be isolated by default, with no
  convenience path from a laptop or a preview to production data or credentials.
- On the Free plan, protected branches are not available (paid feature), so `main` could not be
  protected inside a shared project. A shared project also shares its 10-branch and 100 CU-hour
  allowances between production and every preview.

## Decision

- **`nnoo-dev`** (id `rapid-queen-34040580`, `aws-eu-central-1`, Postgres 18). Root branch
  **`seed`** (synthetic data only; there is no branch named `main`). Children: `staging`,
  `preview/pr-<n>` (TTL 7 d), `dev/<name>` (TTL 14 d), `test-*` (≤ 24 h).
- **`nnoo-prod`** (not created yet). Root branch `main` (real data); only `restore/<ts>`
  break-glass children. Created when Phase 1.8 is approved, ideally on a paid plan.
- Non-secret topology lives in `infra/environments.json`. `packages/config` refuses a production
  database host outside `production`; `apps/api/scripts/migrate.ts` refuses a project id that does
  not match `NNOO_ENV`, and production migrations only run with `CI=true` and `--confirm-production`.
- Credentials are scoped per project: developer laptops are linked only to `nnoo-dev`; production
  keys exist only in the GitHub `production` environment.
- **Trigger cadence** is chosen at deploy time in `neon.ts` from `NNOO_ENV`: production runs the
  documented cadence (drain every minute); other environments drain every 15 minutes and run
  monitors every 6 hours; `NNOO_TRIGGERS=off` disables them on developer branches. Reason: a
  schedule that fires every minute keeps a compute awake around the clock (~180 CU-h/month at
  0.25 CU), above the Free plan's 100 CU-h per project.

## Consequences

- A preview can never fork production data, buckets or functions: they are in another project.
- Schema changes reach production only through CI migrations against `nnoo-prod`.
- Two projects to administer; the release workflow must target `nnoo-prod` explicitly.
- Outbox latency off production is bounded by the `waitUntil` kick plus a 15-minute backstop.

## Alternatives considered

- One project with branch protection (ADR-024 as written): needs a paid plan for protection and
  mixes production with preview quotas.
- A project per environment including staging: more isolation than the risk needs; staging is
  synthetic and lives in `nnoo-dev`.

## Revisit when

Moving to a paid plan, or if staging must run against production-like data volumes (then add a
`perf` branch built from `seed`, never a copy of production).
