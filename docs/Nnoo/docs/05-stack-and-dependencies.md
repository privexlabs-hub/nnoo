# 05 · Frameworks, tools & dependencies

## 1. Selection criteria

1. **One language where possible.** TypeScript across the API, workers, web and mobile, so types and pure algorithms are shared.
2. **Boring and well supported.** Large community, long-term-support releases, many people who can hire into it.
3. **Few moving parts.** Postgres does queueing, outbox, search and sessions before we add Redis, Kafka or Elasticsearch.
4. **Replaceable integrations.** Every vendor sits behind a port (02 §8).

## 2. The stack

| Layer | Choice | Why | Rejected (for now) |
|---|---|---|---|
| Language | TypeScript (strict) | shared contracts & algorithms | Go/Kotlin backend (would split types) |
| Runtime | Node.js, current Active LTS | ecosystem, team skills | Deno/Bun (less hosting/tooling maturity for our needs) |
| HTTP | Fastify | speed, schema-first, plugin isolation | NestJS (heavier abstractions), Express (no schema-first) |
| Validation / contracts | Zod → OpenAPI 3.1 (zod-to-openapi) | one schema for types, validation and docs | hand-written OpenAPI |
| DB | PostgreSQL (supported major, ≥ 16) | constraints, triggers, partitioning, FTS, JSONB | MongoDB (weak invariants) |
| Query layer | Kysely + codegen from the DB | typed SQL, no hidden ORM magic, easy to review | Prisma (harder with partial indexes/triggers), raw SQL strings |
| Migrations | `node-pg-migrate` (SQL files) | plain SQL, reviewable, expand/contract friendly | ORM auto-migrations |
| Jobs / outbox | pg-boss (Postgres-backed) | no extra infra, transactional enqueue | Redis/BullMQ (another stateful system) |
| Audio worker | Python + ffmpeg + a pYIN pitch implementation (e.g. librosa) | best audio/pitch libraries | doing DSP in Node |
| Object storage | S3-compatible (AWS S3 or Cloudflare R2, ADR-007) | multipart, presigned URLs, lifecycle rules | DB blobs |
| CDN | Provider with signed URLs + African PoPs (ADR-007) | latency for Nigeria + diaspora | — |
| Mobile | Expo (React Native), EAS Build/Update | iOS + Android + tablet, one codebase, shared TS | separate native apps (2× logic) |
| Mobile local DB | SQLite (expo-sqlite) + SQLCipher-class encryption | offline, encrypted at rest | AsyncStorage for data |
| Web | React + Vite SPA, TanStack Query/Router | app, not SEO; same hooks as mobile | Next.js (SSR not needed for the app) |
| Marketing | Astro (static) | fast, no app logic | — |
| Auth | Own module: phone OTP + passkeys (WebAuthn), short-lived JWT access tokens + rotating refresh tokens | works for elders' families and diaspora; no vendor lock on identity | third-party IdP (cost, data residency) — revisit by ADR |
| Push | Expo Push → APNs/FCM | one API | — |
| Payments | Nigerian provider behind `PaymentsPort` (ADR-009) | NGN payouts to bank/mobile money | — |
| Observability | OpenTelemetry → a managed backend; Sentry-class error tracking | vendor-neutral traces | — |
| IaC | OpenTofu | open, reviewable | click-ops |
| CI | GitHub Actions + Turborepo cache | monorepo-aware | — |
| Testing | Vitest, Testcontainers (Postgres), fast-check, Playwright, Maestro, k6 | see 07 | — |

## 3. Dependency policy

- **Adding a dependency needs a PR note:** what it does, its weekly maintenance signal (releases in the last 12 months, open security advisories), licence (MIT/Apache/BSD/ISC preferred, no AGPL in clients), bundle size impact for clients, and the alternative of writing it ourselves.
- **Do not add a dependency** for anything under ~50 lines that we can test (e.g. small date maths, the market-day calculation).
- **Pinned** via lockfile. Renovate opens grouped weekly PRs. Security patches merge within 72 h (critical) or 14 days (high).
- **Banned in `domain/`:** any I/O library, date libraries with implicit local time, `Math.random` (inject a random source, needed for panel draws to be testable and auditable).
- **Single version rule:** one version of React, Zod and date handling across the monorepo (enforced by `pnpm` `overrides` + a lint check).
- **Upgrades:** Node LTS and the Postgres major are reviewed yearly. Expo SDK is upgraded within 2 releases to keep store compliance.

## 4. Audio and pitch specifics

| Concern | Decision |
|---|---|
| Capture | 48 kHz mono PCM on the facilitator device, stored lossless until upload completes |
| Archive master | FLAC in a private bucket |
| Delivery | Opus 32 kbps (default), AAC-LC 64 kbps (iOS fallback), plus pre-computed peaks JSON for waveforms |
| Loudness | Normalised to about −18 LUFS for consistent playback (worker step) |
| Pitch (elder targets) | pYIN F0, 10 ms hop → semitones relative to the speaker's median → resampled to a fixed N per word. Stored with `algo_version`. |
| Pitch (learner, on device) | YIN in TS/WASM in `pronunciation-core`, the same normalisation, so scores are comparable with the elder targets |
| Cross-language parity | Shared golden fixtures (WAV → expected contour ± tolerance) run in both the Python and TS test suites |
