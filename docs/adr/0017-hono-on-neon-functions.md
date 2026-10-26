# ADR-017: The API runs as a Neon Function built on Hono (supersedes Fastify)

Status: Accepted. Verified 2026-10-25: `api` and `jobs` deployed to nnoo-dev branch dev/claude with `neon deploy`; the default esbuild bundler handles pnpm workspace packages, so no prebundling fallback is needed. Runtime Node 24, 2 GiB, 15 min TTFB, default account cap 100 concurrent invocations.
Date: 2026-10-25 (recorded from docs/neon/01; original text below)

**Decision.** The modular monolith (`docs/02 §1`) is a single **Hono** app deployed as the Neon Function `api`. Background work is a second function, `jobs`, built from the same codebase with a different entrypoint. Both open one `pg` `Pool` at module scope and call `attachDatabasePool(pool)`, as the quickstart recommends.

**Why.** Functions run on long-lived compute next to the database, which suits multi-step transactions. Hono is the framework Neon Functions use. The module structure, default-deny router and contracts carry over unchanged; only the HTTP adapter changes (04).

**Consequences.** Schema-first validation is now `@hono/zod-validator` + `@hono/zod-openapi` instead of Fastify schemas, using the same Zod contracts. Cold starts after scale-to-zero must be measured against the p95 budgets. ⚠ Verify the options for minimum instances and concurrency.

**Revisit when** cold starts or the function limits break the API budgets. The fallback is the same Hono app in a container, which needs no code changes in the modules.
