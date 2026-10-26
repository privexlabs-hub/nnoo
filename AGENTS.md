# AGENTS.md — rules for AI coding agents working on Nnọọ

This repository holds elders' voices, children's data and community decisions. Be conservative.
The full rules are in [docs/10 §7](docs/10-documentation-and-governance.md); the summary below is binding.

## Before you write code

1. Read `docs/01-product-requirements.md` §6, §8, §14 and [ADR-031](docs/adr/0031-brief-v2-safety-first-merge.md).
2. Read the target module's `module.manifest.ts` and `public.ts`.
3. Name the invariants (INV-1…12) your change could touch in the PR description.

## Hard rules

- No business rules, role checks or state derivation in clients. Use the server's `capabilities`.
- Import another module only through `modules/<x>/public.ts`. `pnpm lint` enforces it.
- Query only tables your module owns (see the manifest).
- Every route goes through `route()` with a policy (or a written public reason), response schema,
  rate-limit class and, for commands, an explicit idempotency choice. The server refuses to boot otherwise.
- No provider calls, AI calls or `fetch` inside a database transaction.
- No endpoint that updates or deletes votes, tallies, consent history or audit rows.
- Never store, transcode or serve audio for Nsọ recordings.
- Never normalise away Igbo tone marks or dotted vowels; stored text is NFC.
- No `Math.random`, `Date.now()` or `new Date()` in `domain/`: inject a clock and an RNG.
- Environment: never point anything at production by default; never commit `.env*`, `.neon` or
  `.local/`; never run `drizzle-kit push` on a shared branch; never create runtime roles with
  `neon roles create` (it grants `neon_superuser`).
- Stop and ask before changing policies, consent, Ikpe evaluation/eligibility, payments, media
  access, triggers or the governance config schema.

## Always

- Add tests at the right layer (docs/07 §2); add a scenario when you touch another module's state.
- Run `pnpm lint && pnpm typecheck && pnpm test && pnpm test:integration` before proposing a PR.
- Update `docs/03` and the module manifest when the schema changes; add an ADR for material decisions.
- Copy follows the brand voice: warm and reverent, no gamification, no emoji in chrome.
