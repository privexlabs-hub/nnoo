# Nnọọ engineering docs

This is the reference for building Nnọọ from scratch. One backend serves every client: iOS, Android, the web learner app, the facilitator tablet, the marketing site and the internal admin console.

The goal is not to predict every requirement. It is a system where **you can change one thing without breaking five others.**

## How to read

| # | Document | Read it when |
|---|---|---|
| 01 | [Product requirements & business rules](01-product-requirements.md) | Before touching any feature. This is the law. |
| 02 | [System architecture](02-system-architecture.md) | Adding a component, an integration or a new flow |
| 03 | [Data model & database design](03-data-model.md) | Adding or changing a table, constraint or state |
| 04 | [Codebase & folder structure](04-codebase-structure.md) | Deciding where code goes |
| 05 | [Stack, tools & dependencies](05-stack-and-dependencies.md) | Adding a library or service |
| 06 | [Security & permissions](06-security-and-permissions.md) | Adding an endpoint, a role or a file type |
| 07 | [Testing & quality](07-testing-and-quality.md) | Before opening a PR |
| 08 | [Scalability & performance](08-scalability-and-performance.md) | Something is slow, or about to be |
| 09 | [Deployment & operations](09-deployment-and-operations.md) | Releasing, migrating, recovering |
| 10 | [Documentation & governance](10-documentation-and-governance.md) | Changing a rule, recording a decision, or working as an AI agent |
| 11 | [Roadmap](11-roadmap.md) | Planning the build from scratch, phase by phase |
| — | [AGENTS.md](AGENTS.md) | Required reading for AI coding agents |

## The founding principle

**"Igbo enwe eze"**: the Igbo have no king. No single account, whether admin, custodian, facilitator or founder, can publish content, change a vote or pass a case. Authority comes from verified kin, acting together, under rules written down in advance. The data model, permissions and operations all enforce this, not just the UI.

The second principle: **the voice belongs to the elder.** Consent is captured before recording, can be narrowed or revoked at any time, and revocation beats every other rule in the system.

## Scope: "all modes and pairs"

**Modes**
- *Surfaces:* iOS, Android (phone + tablet), web learner, facilitator mode (tablet-first, also phone), marketing site, admin console.
- *Roles:* visitor, learner, kin, facilitator, elder (consent holder), steward, custodian, moderator, operator. Defined in 01.
- *Connectivity:* online, low-bandwidth, fully offline. The facilitator and lesson flows must work offline.
- *Age:* adult and minor accounts. Minors have restricted capabilities and are linked to a guardian.

**Pairs**
- *Language pairs:* source content is Igbo, always tagged with a dialect. Glosses and UI come in any locale (`en` at launch, then `fr`, `pt`, `de`, `es`…). Every Igbo/locale pair is supported by the data model. See 03 §Localisation.
- *Client ↔ API:* every client uses the same versioned `/v1` API. There is no client-specific backend logic. See 02.
- *Human pairs:* facilitator ↔ elder (consent capture), guardian ↔ minor (account control), steward ↔ elder (consent succession), voucher ↔ candidate (kin verification).

## The five failure modes and where each is handled

| Failure mode | Primary defence | Where |
|---|---|---|
| **Duplicated business logic** | Rules live only in backend domain modules. Clients render the server-computed `capabilities` and `state`. Shared pure algorithms (tone scoring, market day) live in one package used by every client. | 02 §3, 04 §2, 04 §5 |
| **Insecure endpoints** | Default-deny router: a route without a declared policy fails to boot. An authz matrix test is generated from the policy table. Media URLs are signed per request after a tier check. | 06 §3–5, 07 §6 |
| **Inconsistent data models** | One schema source (`packages/contracts`), DB constraints for every invariant, state machines enforced in both domain and DB, no JSON blobs for core fields. | 03 §2, 03 §6 |
| **Hidden dependencies** | Modules talk through public interfaces and outbox events only. Lint fails on cross-module imports and on cross-module table access. Each module lists its ports in a manifest. | 02 §4, 04 §3 |
| **Features that work alone but break together** | A cross-feature scenario suite (consent revoked mid-vote, lesson referencing an unpublished recording, offline vote replay…), property tests on Ikpe, and invariant monitors in production. | 07 §5, 09 §6 |

## Glossary

| Term | Meaning in the product |
|---|---|
| **Nnọọ** | "Welcome." The product. |
| **Ọbá** | Storehouse. The published archive of elder recordings. |
| **Ọha** | The people / gathering. The community surface. Also the *public* consent tier. |
| **Ikpe** | Judgment / council. Where submissions wait for kin to decide. |
| **Umunna** | Kindred. The *kin-only* consent tier. |
| **Nsọ** | Sacred / restricted. Metadata only; audio is never hosted. |
| **Ilu** | Proverb. |
| **Eke, Orie, Afọ, Nkwo** | The four market days. A 4-day cycle. |
| **Kin** | A learner verified as belonging to a hometown. |
| **Facilitator** | A volunteer who records elders with consent. |
| **Custodian** | A cultural knowledge holder. Custodians act only as panels, never alone. |
| **Steward** | The person who holds an elder's consent rights after the elder dies or becomes incapacitated. Named at capture. |
| **Case** | One Ikpe review of one recording revision. |

## Status of these docs

Version 1.0, written alongside the hi-fi prototype (`index.html`). Numbers marked *default* are configurable starting points, not research findings. Change them through the governance process in 10.


## Implementation on Neon

The Neon-specific, production implementation guide lives in [`neon-implementation/`](../neon-implementation/00-README.md). Technical changes it introduces (Hono on Neon Functions, Drizzle, Postgres job queue drained by triggers, private Neon buckets) are recorded there as ADRs 016–026. The business rules in this folder remain authoritative.
