# ADR-018: Drizzle ORM + generated migrations (supersedes Kysely + node-pg-migrate)

Status: Accepted. Verified 2026-10-25: `drizzle-kit generate` + custom SQL migrations apply cleanly on Neon Postgres 18 (seed, test-integration, dev/claude). Applied by apps/api/scripts/migrate.ts (guarded wrapper around the Drizzle migrator) rather than bare `drizzle-kit migrate`.
Date: 2026-10-25 (recorded from docs/neon/01; original text below)

**Decision.** Schema in TypeScript with Drizzle (`pgEnum`, checks, partial and unique indexes, generated columns). Migrations come from `drizzle-kit generate` and are applied with `drizzle-kit migrate`. Anything Drizzle can't express (triggers, functions, partitions, grants, `igbo_fold`) goes in **custom SQL migrations** in the same history (`drizzle-kit generate --custom`).

**Rules.**

- `drizzle-kit push` is forbidden on every shared branch (`main`, `staging`, `seed`, previews).
- Module ownership is a Drizzle file per module (`modules/<m>/infrastructure/schema.ts`). The boundary lint checks imports of those schema objects.
