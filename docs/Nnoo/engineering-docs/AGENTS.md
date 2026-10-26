# AGENTS.md: rules for AI coding agents working on Nnọọ

You are modifying a system that holds elders' voices, children's data and community decisions. Be conservative.

## Before you write code
1. Read `docs/01-product-requirements.md` §6, §8 and §14 (Ikpe, consent, invariants).
2. Read the target module's `README.md` and `module.manifest.ts`.
3. Identify which invariants (INV-1…12) your change could touch. Name them in your PR description.

## Hard rules
- **Do not** put business rules, role checks or state derivation in `apps/web`, `apps/mobile` or `apps/admin`. Use the `capabilities` and `state` the API returns.
- **Do not** import another module's internals. Use only `modules/<x>/public.ts`, and only if the manifest allows it.
- **Do not** query tables your module does not own.
- **Do not** add routes without a `policy`, request/response schemas, a rate-limit class and idempotency (for commands).
- **Do not** call external providers inside a DB transaction.
- **Do not** create any endpoint that updates or deletes votes, tallies, consent history or audit rows.
- **Do not** store, transcode or serve audio for `nso` recordings.
- **Do not** normalise away Igbo tone marks or dotted vowels in stored or displayed text. Store NFC.
- **Do not** add dependencies without the note required in 05 §3.
- **Do not** use `Math.random`, `Date.now()` or local time in `domain/`. Inject a clock and an RNG.
- **Stop and ask** before changing: policies, consent, ikpe evaluation/eligibility, payments, media access, triggers, governance config schema.

## Always
- Add or extend tests at the right layer (07 §2). Add a scenario (07 §5) when touching another module's state.
- Run `pnpm lint:boundaries`, `pnpm test`, `pnpm test:authz` and `pnpm test:scenarios` before proposing a PR.
- Update the module README, the manifest and `docs/03` if the schema changes.
- Keep copy in `packages/i18n`. Follow the brand voice: warm and reverent, no gamification, no emoji in chrome.
- Prefer the smallest change that satisfies the task. Explain any change outside the target module.
