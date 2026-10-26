# 01 · Platform decisions (ADRs 016–026)

These ADRs adapt `engineering-docs` to Neon. Each also exists as `docs/adr/00NN-*.md` in the repo. **Supersedes** means the earlier ADR or row in `engineering-docs/05` is replaced. The business rules themselves are not changed by any of these.

---

## ADR-016: Neon as the primary backend platform; region `aws-eu-central-1`

**Context.** We want Postgres, object storage, long-running compute, scheduling and AI behind one config and one provider, with branchable environments. Neon offers Postgres in all its regions. Object Storage, Functions and the AI Gateway are currently offered in `aws-us-east-2`, `aws-us-east-1`, `aws-eu-central-1` and `aws-ap-southeast-1`. There is no African region.

**Decision.** One Neon project, `nnoo`, in **`aws-eu-central-1` (Frankfurt)**:
- It has the lowest latency of the four regions to Lagos/Enugu/Port Harcourt and to the UK/EU diaspora, while staying acceptable for North America.
- Postgres, buckets and functions sit in the same region, so the API talks to the DB at in-region latency.

**Consequences.** Personal data of Nigerian residents is processed outside Nigeria, so the NDPA 2023 cross-border transfer requirements apply. **Legal review is required before launch** (lawful basis, safeguards, privacy notice). Offline lesson packs (`engineering-docs/08 §3`) hide most of the latency to Nigeria.

**Revisit when** Neon offers storage and functions in an African region, or when p95 audio start time in Nigeria exceeds its budget.

---

## ADR-017: The API runs as a Neon Function built on Hono (supersedes Fastify)

**Decision.** The modular monolith (`engineering-docs/02 §1`) is a single **Hono** app deployed as the Neon Function `api`. Background work is a second function, `jobs`, built from the same codebase with a different entrypoint. Both open one `pg` `Pool` at module scope and call `attachDatabasePool(pool)`, as the quickstart recommends.

**Why.** Functions run on long-lived compute next to the database, which suits multi-step transactions. Hono is the framework Neon Functions use. The module structure, default-deny router and contracts carry over unchanged; only the HTTP adapter changes (04).

**Consequences.** Schema-first validation is now `@hono/zod-validator` + `@hono/zod-openapi` instead of Fastify schemas, using the same Zod contracts. Cold starts after scale-to-zero must be measured against the p95 budgets. ⚠ Verify the options for minimum instances and concurrency.

**Revisit when** cold starts or the function limits break the API budgets. The fallback is the same Hono app in a container, which needs no code changes in the modules.

---

## ADR-018: Drizzle ORM + generated migrations (supersedes Kysely + node-pg-migrate)

**Decision.** Schema in TypeScript with Drizzle (`pgEnum`, checks, partial and unique indexes, generated columns). Migrations come from `drizzle-kit generate` and are applied with `drizzle-kit migrate`. Anything Drizzle can't express (triggers, functions, partitions, grants, `igbo_fold`) goes in **custom SQL migrations** in the same history (`drizzle-kit generate --custom`).

**Rules.**
- `drizzle-kit push` is forbidden on every shared branch (`main`, `staging`, `seed`, previews).
- Module ownership is a Drizzle file per module (`modules/<m>/infrastructure/schema.ts`). The boundary lint checks imports of those schema objects.

---

## ADR-019: Jobs and outbox in Postgres, drained by schedule triggers (supersedes pg-boss)

**Context.** Functions scale to zero, so a permanently polling worker loop is the wrong shape. Function Triggers can call a function on a cron schedule or on storage events, even from zero.

**Decision.**
- A `job` table claimed with `FOR UPDATE SKIP LOCKED`, and the existing `outbox_event` table (03 §6, 06).
- The schedule trigger `jobs-drain` runs every minute and drains both within a time budget.
- After a commit, the `api` function also **kicks** the dispatcher in-process, so typical latency is seconds. ⚠ Verify that background promises survive after the response in the Neon Functions runtime. If not, the minute trigger is the only path, and the outbox-lag SLO becomes p99 < 90 s.

---

## ADR-020: Private buckets, presigned URLs, CDN deferred

**Decision.** Four private buckets: `media-uploads`, `media-masters`, `media-derivatives`, `consent-evidence`. Nothing is `public_read`.
- Uploads use presigned multipart URLs.
- Playback uses presigned GET URLs (10 min TTL) issued only after the `media.play` policy passes.
- Revocation deletes the derivative objects, so any outstanding URL stops working immediately.
- A CDN comes later, with origin authentication, when egress cost or latency metrics justify it.

⚠ Verify: private access mode, presigned GET/PUT and multipart support on the S3-compatible endpoint, bucket CORS for browser playback, and lifecycle (expiry) rules. **Fallback** if presigning isn't supported: an authenticated streaming proxy route in `api` (higher compute cost).

---

## ADR-021: The audio worker runs outside Neon and holds no credentials

**Context.** Transcoding and pitch extraction need Python, ffmpeg and pYIN. Neon Functions in the quickstart are TypeScript/Hono.

**Decision.** A small Python container (any container host, ideally in eu-central). It:
1. calls `POST /internal/audio/claim` on `jobs` with a short-lived service token;
2. receives a job plus **presigned** GET (raw upload) and PUT (master, derivatives, peaks) URLs;
3. processes the audio;
4. reports results to `POST /internal/audio/{jobId}/result`.

It has **no database credentials and no storage keys**. A leaked worker can only touch the objects of the jobs it has claimed.

---

## ADR-022: Authentication with Better Auth behind the identity module

**Decision.** Run a Phase 0 spike to choose between:
- **A: Managed Better Auth** (`auth: true` in `neon.ts`)
- **B: Better Auth as a library** inside `api`, with tables in a dedicated `auth` schema

Requirements: phone-number OTP, passkeys, device-bound minor sign-in, refresh-token rotation with reuse detection, JWTs verifiable by JWKS.

Pick A only if it meets all of them (⚠ Verify plugin support in the managed offering). In both cases **roles, kin membership and guardianship stay in our identity/community tables**. Authentication says *who you are*; Nnọọ decides *what you may do*.

---

## ADR-023: Edge proxy in front of the functions

**Decision.** `api.nnoo.app` goes through an edge proxy (e.g. Cloudflare) to the `api` function URL. The edge provides TLS, WAF, bot protection on OTP routes and coarse rate limits. It also injects a secret header `X-Edge-Auth` that `api` requires on every `/v1` route, so the raw function URL can't be used to bypass the edge.

The `jobs` function is not behind the edge. Its endpoints are trigger-safe (06 §5) or need service tokens.

---

## ADR-024: Branch policy — production is never casually branched

**Context.** `neon checkout` forks the database, **buckets and functions together**. A branch of `main` would copy elders' audio, consent evidence and personal data outside the revocation ledger.

**Decision.**

| Branch | Parent | Data | Lifetime |
|---|---|---|---|
| `main` | — | production | permanent, protected |
| `seed` | — | synthetic only (fixtures, generated audio) | permanent, rebuilt weekly |
| `staging` | `seed` | synthetic + release-candidate migrations | permanent, reset per release |
| `preview/pr-<n>` | `seed` | synthetic | deleted when the PR closes |
| `dev/<name>` | `seed` | synthetic | developer-owned, auto-expire 14 days |
| `restore/<ts>` | `main` at a point in time | production | break-glass only, ≤ 24 h, then deleted (09 §6) |

Branching `main` for any other purpose is a SEV2 policy violation. Keep the branch policy generated by `neon config init`, and tighten it to protect `main`. ⚠ Verify the fields that policy supports.

---

## ADR-025: AI Gateway for drafting only

**Decision.** AI may produce **drafts** of transcripts, glosses and translations, and only for recordings whose consent includes `allow_machine_assist = true`. A human edits and approves every draft. Ikpe reviews the revision as usual and sees that it was machine-drafted.

AI never publishes, votes, resolves flags, verifies kin, scores learners or sees Nsọ material, minors' data or learner voice. Full rules are in 08.

---

## ADR-026: Least-privilege database roles

**Decision.**
- `nnoo_owner` runs migrations only, from CI.
- `nnoo_app` is the runtime role for `api` and `jobs`. It has no `UPDATE`/`DELETE` on append-only tables and only column-level `UPDATE` on consent revocation fields.
- `nnoo_readonly` is for replicas and analytics.

The runtime never uses the owner credentials that `neon deploy` injects by default: functions read `APP_DATABASE_URL`, not `DATABASE_URL` (07 §4). ⚠ Verify how to set function env vars per branch.
