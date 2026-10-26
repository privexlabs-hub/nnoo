# Nnọọ on Neon: implementation guide

This guide shows **how** to build Nnọọ from scratch, production-ready, on Neon's backend platform: Lakebase Postgres, Object Storage, Functions, Function Triggers, AI Gateway and branching.

It follows the patterns in Neon's _Full backend quickstart_ and adapts them to Nnọọ's rules.

- **What and why:** `docs/` (product rules, data model, security, governance). Those rules stay authoritative.
- **How, on Neon:** this folder. Where it changes a technical choice from `docs/05`, the change is recorded as an ADR in [01-platform-decisions.md](01-platform-decisions.md).

## Verification status (2026-10-25)

Resolved "⚠ Verify" items, with evidence. Unresolved ones stay marked in the files.

| Item                                     | Result                                                              | Evidence                                              |
| ---------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------- |
| Functions bundle pnpm workspace packages | ✅ works with the default esbuild bundler                           | deployed to `nnoo-dev/dev/claude`                     |
| Background work after the response       | ✅ `waitUntil` (≤ 15 min)                                           | `@neon/functions` 0.11 types; ADR-019                 |
| Per-branch function env                  | ✅ `functions.<slug>.env`, resolved by `neon deploy --env <file>`   | `neon.ts`                                             |
| Trigger origin                           | ✅ Neon strips client `X-Neon-*`; a spoofed drain returned 401 live | ADR-030                                               |
| Triggers on the Free plan                | ✅ a `jobs-drain` schedule fired and drained the outbox             | dev/claude, 04:45:01 UTC                              |
| Private buckets                          | ✅ `private` is the default `access`                                | neon.ts reference; CORS/lifecycle still ⚠ (Phase 1.3) |
| Managed Better Auth plugins              | ❌ no passkeys/MFA/phone-first → self-hosted                        | ADR-028                                               |
| AI Gateway on Free plan                  | ❌ not available                                                    | ADR-029                                               |
| App LOGIN role "via Neon"                | ⚠ CLI roles join `neon_superuser` → create in SQL                   | ADR-026 amendment                                     |
| Migrations on Neon PG 18                 | ✅ incl. `uuidv7()`, partitions, grants                             | seed, test-integration, dev/claude                    |

## Dependency notes

Recorded per [05 §3](../05-stack-and-dependencies.md) (licence · why · alternative). Versions are pinned in `pnpm-lock.yaml`; the install enforces pnpm's minimum release age, so brand-new releases are not installed the day they ship.

| Package                                                                      | Licence          | Why                                                        | Rejected alternative                        |
| ---------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------- | ------------------------------------------- |
| hono                                                                         | MIT              | Neon Functions' recommended framework (ADR-017)            | Fastify (needs a Node server adapter)       |
| drizzle-orm / drizzle-kit                                                    | Apache-2.0 / MIT | typed SQL + generated migrations (ADR-018)                 | Kysely + node-pg-migrate                    |
| pg                                                                           | MIT              | pooled long-lived connections in Functions (Neon guidance) | @neondatabase/serverless (per-request HTTP) |
| better-auth, @better-auth/passkey                                            | MIT              | phone/email OTP, passkeys, JWKS (ADR-028)                  | custom auth; Managed Better Auth            |
| jose                                                                         | MIT              | offline JWT verification with pinned EdDSA                 | hand-written JWT code                       |
| zod                                                                          | MIT              | one schema for validation, types, contracts                | multiple validators                         |
| uuidv7                                                                       | Apache-2.0       | client/server time-ordered ids (ADR-005)                   | uuid v4 (unordered)                         |
| @neon/functions, @neon/config, @neon/env                                     | Apache-2.0       | Neon runtime helpers and backend-as-code                   | —                                           |
| vitest, fast-check, testcontainers                                           | MIT              | unit, property and integration tests (07)                  | Jest                                        |
| eslint, typescript-eslint, prettier, dependency-cruiser, turbo, tsx, esbuild | MIT              | gates and builds                                           | —                                           |
| TypeScript 6.0 (not 7)                                                       | Apache-2.0       | typescript-eslint supports < 6.1                           | TS 7 native compiler (lint unsupported)     |

## Contents

| #   | File                                                                       | Covers                                                                       |
| --- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 00  | README (this file)                                                         | Overview, platform map, what not to copy from the quickstart                 |
| 01  | [Platform decisions (ADRs 016–026)](01-platform-decisions.md)              | Region, functions, ORM, jobs, storage, auth, edge, branching, AI, DB roles   |
| 02  | [neon.ts, environments & dev workflow](02-neon-config-and-environments.md) | The full `neon.ts`, branch strategy, env vars, CLI workflow                  |
| 03  | [Database on Neon](03-database.md)                                         | Drivers, pooling, Drizzle schema, custom SQL migrations, transactions, roles |
| 04  | [The API function](04-api-function.md)                                     | Hono app layout, default-deny routing, auth, idempotency, errors             |
| 05  | [Storage & media pipeline](05-storage-and-media.md)                        | Buckets, presigned upload/playback, upload trigger, audio worker, revocation |
| 06  | [Jobs, triggers & outbox](06-jobs-triggers-outbox.md)                      | Job table, dispatcher, every schedule trigger, trigger-endpoint safety       |
| 07  | [Auth & security on Neon](07-auth-and-security.md)                         | Better Auth, JWT, roles, secrets, branch data protection, edge               |
| 08  | [AI Gateway usage](08-ai-gateway.md)                                       | What AI may do, what it must never do, consent gating                        |
| 09  | [CI/CD & operations](09-cicd-and-operations.md)                            | Pipeline, migrations, previews, observability, backups, restore drills       |
| 10  | [Build sequence & go-live checklist](10-build-sequence.md)                 | Step-by-step from an empty repo to launch                                    |

## How to read the markers

- **⚠ Verify:** this goes beyond what the quickstart documents, for example an exact config key, a plan limit or a runtime behaviour. Confirm it against current Neon docs (`https://neon.com/docs/llms.txt`) before you rely on it. If it doesn't hold, use the fallback listed next to it.
- Code samples show shape and intent. The canonical code lives in the repo, and it passes the gates in `docs/07`.

## Platform map

| Need                                    | Provided by                                                     | Notes                                                  |
| --------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| System of record                        | **Neon Postgres**                                               | One project. Branches = environments.                  |
| API (`/v1`)                             | **Neon Function `api`** (Hono)                                  | Runs next to the DB. Uses a pooled `pg` client.        |
| Background work                         | **Neon Function `jobs`** + **schedule triggers**                | Drains the Postgres job queue and outbox. Runs sweeps. |
| Upload events                           | **`storage_object_created` trigger**                            | A backstop for the explicit upload-complete call       |
| Media storage                           | **Neon Object Storage** (S3-compatible)                         | Private buckets only. Presigned URLs.                  |
| AI drafting                             | **Neon AI Gateway**                                             | Narrow, consent-gated use (08). Paid plan.             |
| Authentication                          | **Better Auth**: Managed (`auth: true`) or self-hosted in `api` | Decided by the Phase 0 spike (ADR-022)                 |
| Previews                                | **Neon branching** (`neon checkout`)                            | Branched from the synthetic `seed` branch only         |
| Audio transcoding / pitch               | Python container (outside Neon)                                 | Needs no DB or storage credentials (ADR-021)           |
| Edge, domain, WAF, rate limits          | Edge proxy (e.g. Cloudflare)                                    | In front of the function URLs (ADR-023)                |
| Mobile build/updates                    | Expo EAS                                                        | Unchanged                                              |
| Web learner / admin / marketing hosting | Static hosting + CDN                                            | SPAs call the API. They never call the DB.             |
| SMS OTP, push, payments, error tracking | External providers behind ports                                 | Unchanged from `docs/02 §8`                            |

```
 iOS / Android (Expo)   Web learner   Admin   Marketing
          │                 │           │
          └────────► Edge proxy (api.nnoo.app: TLS, WAF, rate limits, edge secret)
                             │
                  ┌──────────▼───────────┐        presigned PUT/GET
                  │ Neon Function: api   │◄────────────────────────────┐
                  │ Hono · /v1 · modules │                              │
                  └──────┬───────────────┘                              │
              pooled pg  │   outbox + job rows                          │
                  ┌──────▼───────────────┐   ┌───────────────────────┐  │
                  │ Neon Postgres (main) │◄──┤ Neon Function: jobs   │  │
                  └──────────────────────┘   │ drains jobs/outbox,   │  │
                                             │ sweeps, webhooks out  │  │
            schedule triggers ──────────────►│ /internal/*           │  │
            storage_object_created ─────────►└──────────┬────────────┘  │
                                                        │ claim API      │
 ┌────────────────────────── Neon Object Storage ───────┼──────────────┐ │
 │ media-uploads · media-masters · media-derivatives ·   │              │ │
 │ consent-evidence      (all private)                   │              │ │
 └───────────────────────────────────────────────────────┼──────────────┘ │
                                              ┌──────────▼─────────┐      │
                                              │ Audio worker (Py)  │──────┘
                                              │ ffmpeg · pYIN      │
                                              └────────────────────┘
```

## Quickstart patterns we deliberately do **not** copy

The quickstart is a single-user tutorial. Several of its shortcuts would break Nnọọ invariants.

| Quickstart pattern                                              | Why it's wrong for Nnọọ                                                                                           | What we do instead                                                                                          |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Server Components query the DB directly with Drizzle            | Puts business logic in a client app and bypasses policies, so it duplicates logic (the failure mode in `docs/00`) | Every client, including any Next.js page, calls `/v1` on the `api` function                                 |
| Bucket `access: 'public_read'` and public object URLs           | Breaks INV-3 (Umunna leak) and INV-7 (revocation)                                                                 | Private buckets. Playback through a policy check plus a short-lived presigned URL (05).                     |
| Upload through a Server Action holding the whole file in memory | Large field recordings, no resume, no offline                                                                     | Presigned multipart upload straight from the device (05 §3)                                                 |
| `drizzle-kit push`                                              | No migration history, unsafe on shared data                                                                       | `drizzle-kit generate` + `migrate`, plus custom SQL migrations (03 §4). `push` only on throwaway local DBs. |
| `/generate` inserts AI text as a published post                 | Breaks INV-1 and INV-5. AI would publish without Ikpe.                                                            | AI writes **drafts** only. Humans edit. Ikpe decides (08).                                                  |
| Function with no auth, `cors()` open to all origins             | Insecure endpoints                                                                                                | JWT verification, default-deny policies, CORS allow-list (04, 07)                                           |
| Trigger handler trusts `X-Neon-Trigger-Invocation-Id` alone     | The header can be spoofed                                                                                         | Trigger endpoints are idempotent and safe to call by anyone (06 §5)                                         |
| Credentials only in `.env.local`                                | Fine for dev, not a production secret policy                                                                      | Production secrets handled per 07 §6. `.env.local` is gitignored.                                           |
| Single `posts` table, no constraints                            | —                                                                                                                 | Full model with DB-enforced invariants (`docs/03`)                                                          |
