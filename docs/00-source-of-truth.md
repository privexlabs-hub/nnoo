# 00 · Source of truth

Assessment made on 2026-10-25 from the complete local export of the Claude Design project
(`docs/Nnoo/`) and the brand folder (`docs/nnoo brand identity and marketing system/`). Every file
listed was read in full; the bundled `export/Nnoo.html` (944 KB) was inspected structurally.

## Sources and how they relate

| Source                                                                               | Content                                                                                                   | Status                                                                 |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `docs/Nnoo/engineering-docs/`                                                        | Product rules, architecture, data model, security, testing, operations, governance, roadmap               | Copied into `docs/01–11`; canonical there                              |
| `docs/Nnoo/docs/`                                                                    | **Byte-identical** to `engineering-docs/` (its `README.md` = `00-README.md`)                              | Duplicate; ignored                                                     |
| `docs/Nnoo/neon-implementation/`                                                     | How to build on Neon; ADR-016…026; build sequence                                                         | Copied into `docs/neon/`; canonical there; ADRs in `docs/adr/`         |
| `docs/Nnoo/src/`, `shared/`                                                          | Hi-fi prototype (React + in-browser Babel): learner mobile, web learner, facilitator tablet, marketing    | **Canonical visual/flow reference**                                    |
| `docs/Nnoo/export/`                                                                  | Same as `src/` minus `Web.jsx` (no web learner); `Nnoo.html` bundle still loads ReactDOM/Babel from a CDN | Older subset; ignored                                                  |
| `docs/Nnoo/uploads/Nnoo (4) 2/`                                                      | Identical copy; SVGs differ only by an added C2PA provenance block                                        | Duplicate; ignored                                                     |
| Brand folder: _Business Brief v2.1_                                                  | Product, flows, screen inventory, Part II build spec (proposed defaults)                                  | Product/flow spec; rules merged by ADR-031                             |
| Brand folder: Brief v1                                                               | Previous version                                                                                          | Superseded by v2.1                                                     |
| Brand folder: Social Playbook, Website v2, Logo Variations, `_ds/` README + lint     | Voice, marketing, 36 logo variants, design-system rules                                                   | Brand reference; logos copied to `packages/design-tokens/assets/logo/` |
| `shared/colors_and_type.css` = `_ds/colors_and_type.css` = brand `assets/tokens.css` | Design tokens (identical files)                                                                           | Single source → `packages/design-tokens`                               |

## Conflicts and resolutions

| #   | Conflict                                                                                                                                | Resolution                                                                                     |
| --- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1   | Engineering docs 02/04/05 (Fastify, Kysely, node-pg-migrate, pg-boss, own auth, apps/worker) vs Neon ADRs                               | ADRs win where they say so (017–022); noted at the top of 02, 04, 05                           |
| 2   | ADR-024 single Neon project vs required dev/prod isolation; protected branches are paid-only                                            | ADR-027: two projects                                                                          |
| 3   | ADR-022 managed vs self-hosted auth                                                                                                     | ADR-028: self-hosted (Managed lacks passkeys/MFA/phone-first)                                  |
| 4   | AI Gateway (ADR-025) vs Free plan                                                                                                       | ADR-029: off                                                                                   |
| 5   | Trigger header can be spoofed (06 §5)                                                                                                   | ADR-030: verified that Neon strips client `X-Neon-*`; trigger-safe handlers kept               |
| 6   | Business Brief v2 Part II vs 01 (Ikpe thresholds/states, verification, staff powers, minors, consent permissions, pitch bands, streaks) | ADR-031: safety-first merge (product owner), pending council ratification                      |
| 7   | Brief makes subscriptions a first-release must; engineering docs have no subscriptions                                                  | Product owner: Phase 5 with payouts (ADR-031)                                                  |
| 8   | Sign-in: phone OTP + passkeys (06) vs email/phone/Apple/Google (Brief)                                                                  | Product owner: phone OTP + passkeys + email OTP in v1; Apple/Google with mobile                |
| 9   | 09 §1 staging "anonymised snapshot" vs ADR-024 synthetic                                                                                | Synthetic from `seed`                                                                          |
| 10  | 09 §5 PITR 14 days vs Free plan 6 h                                                                                                     | Accept for dev; go-live needs a paid plan                                                      |
| 11  | Neon docs: create the app LOGIN role "via Neon"                                                                                         | Verified unsafe: CLI-created roles join `neon_superuser`; create it in SQL (ADR-026 amendment) |
| 12  | Prototype skips consent ("Step 2 of 4"), shows "Tone match 92%", streak counters, mock Ikpe counts                                      | Product rules win; prototype divergences recorded here, fixed in the real screens              |
| 13  | Prototype hard-codes hex/px values and a JS copy of tokens (`NnooTheme`, with a wrong marigold)                                         | Not carried forward; tokens generated from the CSS                                             |

## Prototype bugs noted (not carried forward)

`WebRecording` passes `steps` to `ProvenanceChain` (expects `items`) and crashes; `Eyebrow` ignores
`style`; proverb play button is a no-op; web Ikpe badge hard-coded to 2; `NnooTheme.clayDust` is
undefined.

## Open decisions (need people, not code)

- **Custodian council:** ratify ADR-031 values; consent script (incl. machine-assist wording);
  Umunna scope definition (town, LGA or lineage; Brief §18); calendar anchors per variant.
- **Legal:** NDPA 2023 cross-border transfer to Frankfurt; GDPR; children's privacy ages per market;
  payout compliance.
- **Providers:** SMS (Termii/Twilio, incl. hashed-OTP mitigation, ADR-028), email, payments
  (ADR-009), error tracking, audio-worker container host, edge (Cloudflare account).
- **Money:** contributor payment amount and length rule; currency for diaspora elders; pricing.
