# Nnọọ

_Nnọọ_ (Igbo: "welcome") records the living culture of Ndị Igbo from elders, with consent; lets kin
from the elder's hometown decide in **Ikpe** what is kept in the **Ọbá** archive; and teaches the
diaspora in the elders' own voices, with tonal pronunciation feedback. _Two hands, one body._

The backend runs on **Neon**: Postgres, Functions (Hono), Function Triggers and, from Phase 1,
Object Storage. Start with [docs/README.md](docs/README.md) and [docs/setup.md](docs/setup.md).

## Repository

```
neon.ts                     backend as code (functions, triggers; buckets from Phase 1)
apps/api/                   the `api` and `jobs` Neon Functions (one codebase, two entrypoints)
  src/platform/             HTTP pipeline, default-deny route(), db, jobs/outbox, triggers
  src/modules/<module>/     domain · application · infrastructure · http · public.ts · manifest
  migrations/               versioned SQL (drizzle-kit generated + hand-written custom SQL)
  scripts/                  migrate (guarded), build (function bundles)
  tests/{unit,integration}/
packages/
  config/                   environment validation and Neon topology guards
  contracts/                Zod schemas for every /v1 payload + stable error codes
  igbo-text/                NFC rules and the search fold (parity-tested with SQL igbo_fold)
  calendar-core/            the four-day market week
  design-tokens/            tokens generated from the design system CSS; brand assets
infra/                      environments.json (non-secret topology), edge Worker
docs/                       canonical documentation, ADRs, Neon guide
.github/workflows/          ci, preview (per PR), release (production, approval-gated)
```

## Commands

| Command                                                  | Does                                                      |
| -------------------------------------------------------- | --------------------------------------------------------- |
| `pnpm install --frozen-lockfile`                         | install (pinned, release-age policy enforced)             |
| `pnpm format:check` · `pnpm lint` · `pnpm typecheck`     | formatting · ESLint + module boundaries · TypeScript      |
| `pnpm test`                                              | unit and property tests                                   |
| `pnpm test:integration`                                  | real Postgres (Testcontainers, or a Neon `test-*` branch) |
| `pnpm build`                                             | bundle the `api` and `jobs` functions                     |
| `pnpm db:generate` · `pnpm db:check` · `pnpm db:migrate` | migrations: generate · verify · apply (guarded)           |
| `pnpm dev`                                               | run the functions locally with `neon dev`                 |

## Status

Phase 0 (foundations) is implemented and verified on the `nnoo-dev` Neon project; see
[docs/neon/10-build-sequence.md](docs/neon/10-build-sequence.md#status). No production project
exists yet; real elders' data must not be stored until the go-live checklist is complete.
