# 04 · Codebase & folder structure

## 1. One monorepo, organised by capability

`pnpm` workspaces + Turborepo. One repo keeps contracts, clients and the API changing together in one PR, which removes a whole class of "works on my side" breaks.

```
nnoo/
├─ apps/
│  ├─ api/                 # Fastify modular monolith (Node/TS)
│  ├─ worker/              # job runner: outbox, sweeps, payouts (same codebase, different entrypoint)
│  ├─ audio-worker/        # Python: transcode, loudness, pitch targets (isolated, narrow contract)
│  ├─ mobile/              # Expo app: learner + facilitator modes, iOS/Android, phone/tablet
│  ├─ web/                 # React SPA learner app (Vite)
│  ├─ marketing/           # static site (Astro), no app logic
│  └─ admin/               # internal console (React SPA, admin API scope only)
├─ packages/
│  ├─ contracts/           # Zod schemas → OpenAPI → generated clients. THE API shape.
│  ├─ api-client/          # generated fetch client + react-query hooks (web + mobile)
│  ├─ pronunciation-core/  # pure TS: normalise, DTW, scoring. Used by web + mobile. Golden tests.
│  ├─ calendar-core/       # pure TS: market day
│  ├─ igbo-text/           # NFC, tone-mark utilities, folding for search, validation
│  ├─ design-tokens/       # colors_and_type → CSS vars + RN theme (single source)
│  ├─ ui-web/              # web components (NnooButton, ConsentBadge, Waveform…)
│  ├─ ui-native/           # RN equivalents with the same names & props
│  ├─ i18n/                # message catalogs (en, fr, …) + ICU formatting; Igbo UI phrases
│  └─ config-eslint/, config-ts/
├─ docs/                   # this folder; ADRs in docs/adr/
├─ infra/                  # OpenTofu modules, environments
└─ tools/                  # codegen, seeders, scenario runner, invariant checker
```

## 2. Where logic is allowed to live

| Kind of logic | Lives in | Not in |
|---|---|---|
| Business rules, permissions, state transitions | `apps/api/src/modules/*/domain` | clients, workers, SQL views |
| Pure algorithms needed offline | `packages/*-core` | duplicated per client |
| Payload shapes | `packages/contracts` | hand-written types in apps |
| Visual tokens | `packages/design-tokens` | hex codes in components |
| Copy | `packages/i18n` | string literals in components (lint rule) |
| Provider integration | module `infrastructure/adapters` | domain or HTTP layer |

When a client needs "can the user do X?", the answer is in `capabilities` on the payload. A PR adding a role check to a client is rejected.

## 3. API module layout (same in every module)

```
apps/api/src/modules/ikpe/
├─ module.manifest.ts      # name, owned tables, allowed deps, emitted/consumed events
├─ domain/                 # pure: entities, value objects, policies, state machine, evaluate()
│  ├─ case.ts
│  ├─ evaluate.ts          # Ikpe outcome rules (01 §6). No I/O.
│  ├─ eligibility.ts
│  └─ policies.ts          # can(actor, action, resource)
├─ application/            # use cases: castVote, openCase, raiseFlag … (transactions here)
├─ infrastructure/
│  ├─ repo.ts              # Kysely queries on OWN tables only
│  └─ adapters/
├─ http/                   # routes: schema from contracts + declared policy + handler → use case
├─ events/                 # handlers for consumed events (idempotent)
├─ public.ts               # the ONLY file other modules may import
└─ __tests__/
```

**Import rules** (dependency-cruiser, CI-enforced):
- `domain` imports nothing outside `domain` and `packages/*-core`.
- `http` → `application` → `domain` + `infrastructure`. Never the reverse.
- Another module may import only `modules/<x>/public.ts`, and only if listed in its manifest.
- `infrastructure/repo.ts` may reference only the tables listed in the manifest (checked by a SQL-AST lint over the Kysely calls).
- No circular module dependencies.

## 4. Route declaration (default-deny)

```ts
route({
  method: 'PUT', path: '/v1/ikpe/cases/:caseId/vote',
  body: contracts.ikpe.CastVoteBody, response: contracts.ikpe.VoteView,
  policy: 'ikpe.vote',            // required: boot fails without it
  idempotent: true,
  rateLimit: 'vote',
  handler: (ctx, { caseId }, body) => ikpe.castVote(ctx.actor, caseId, body.choice, body.waitReason),
});
```
The router refuses to register a route that has no `policy` (or no explicit `policy: 'public'` with a justification string). It also refuses one with no response schema.

## 5. Clients

**Mobile (`apps/mobile`)**
```
app/                     # expo-router screens
  (learner)/today, lessons/[id], oba/, ikpe/, oha/, you/
  (facilitator)/sessions/, sessions/[id]/consent, record, review
features/<capability>/   # screens compose these; each feature = hooks + components
offline/                 # SQLite schema (versioned), sync engine, upload queue
platform/                # audio capture, secure storage, push
```
Mode is a routing group chosen by role grants plus the device class. Tablets default to the facilitator layout (left rail + stage), as in the prototype.

**Web (`apps/web`)** mirrors `features/` with the same names, so a feature means the same thing on both clients. Layout: left nav · stage · contextual rail.

Both clients use `packages/api-client` (generated) and `packages/pronunciation-core`. Neither has its own copy of any rule.

## 6. Naming conventions

- Igbo product terms are used verbatim in code identifiers, ASCII-folded: `oba`, `oha`, `ikpe`, `umunna`, `nso`. Display strings keep diacritics (`Ọbá`).
- Events are past tense, `<Module><Thing><Verb>`: `IkpeCasePassed`. Commands are imperative: `castVote`.
- Error codes are `<module>.<snake_reason>`, e.g. `consent.revoked`.
- Files are kebab-case. React components are PascalCase. DB uses snake_case.

## 7. Adding a feature: a checklist

1. Rule in `docs/01` (or an ADR) → 2. contract in `packages/contracts` → 3. migration + constraints → 4. domain + policy + tests → 5. use case + route → 6. events if cross-module → 7. client feature using generated hooks → 8. scenario test if it touches another module's state → 9. update the module manifest.
