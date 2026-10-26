# 10 · Documentation & governance

## 1. Docs as code

- Docs live in `docs/` next to the code and are reviewed in the same PR as the change.
- **Source-of-truth hierarchy** (higher wins on conflict, and a conflict is a bug to fix):
  1. `01-product-requirements.md` + accepted ADRs
  2. `packages/contracts` (API shape) and migrations (data shape)
  3. Module manifests and policy tables
  4. Everything else (guides, comments)
- Every module has a short `README.md`: purpose, owned tables, public interface, events, invariants it protects.

## 2. Architecture Decision Records

Put them in `docs/adr/NNNN-title.md`, using this template:

```
# ADR-NNNN: <title>
Status: proposed | accepted | superseded by ADR-XXXX
Date: YYYY-MM-DD   Deciders: <names/roles>
## Context  — forces, constraints, what breaks today
## Decision — what we will do
## Consequences — good, bad, what it makes harder; migration path
## Alternatives considered
## Revisit when — the measurable trigger for reconsidering
```

**Initial ADR backlog** (record each before or during the first build sprint):

| ADR | Decision |
|---|---|
| 001 | Modular monolith + workers. Extraction criteria. |
| 002 | TypeScript end to end, Python only in the audio worker |
| 003 | PostgreSQL as system of record, queue and outbox (no Redis/Kafka at launch) |
| 004 | One `/v1` API for all clients, no BFF, capabilities in payloads |
| 005 | UUIDv7 client-generated IDs for offline creation |
| 006 | Outbox pattern for every cross-module side effect |
| 007 | Hosting region, storage + CDN provider, data residency |
| 008 | Identity: phone OTP + passkeys, own auth module |
| 009 | Payments provider and beneficiary tokenisation |
| 010 | Ikpe quorum formula and outcome thresholds (references 01 §6) |
| 011 | Nsọ: metadata only, never store audio |
| 012 | Tone scoring algorithm v1 (YIN/pYIN + speaker normalisation + banded DTW) and versioning |
| 013 | Expo for mobile including tablet facilitator mode |
| 014 | Igbo text storage: NFC + folded search keys, no generic unaccent |
| 015 | Minor accounts and guardian model |

## 3. Ownership

- `CODEOWNERS` per module and package. Every module has a **tech owner** and a **rule owner**.
- **Rule owners for cultural rules** (Ikpe thresholds, consent tiers, Nsọ handling, calendar anchors, dialect taxonomy) are the **custodian council**, not the engineering team. Engineering owns *how* a rule is enforced. The council owns *what* the rule is.
- Product owns copy and flows within the rules.

## 4. Changing a business rule

The rules apply to us too: **Igbo enwe eze.**

| Change type | Process |
|---|---|
| Copy, layout, non-rule UX | normal PR, product review |
| Technical (no behaviour change) | PR + tech owner, ADR if architectural |
| Configurable parameter (e.g. quorum floor for one hometown) | governance proposal → a `governance` Ikpe case in that scope → on pass, a new `governance_config` version activates for **new** cases only |
| Rule change (e.g. thresholds, a new tier, eligibility) | update 01 + an ADR, council panel review, kin ratification case, then code. Old cases keep the rules they opened under. |
| Emergency safety change | two moderators + one custodian may apply a **temporary** restriction (never a loosening) for ≤ 14 days. It then needs normal ratification or it lapses automatically. |

## 5. Conventions

- **Commits:** Conventional Commits (`feat(ikpe): …`, `fix(consent): …`). The module is the scope.
- **PR template:** what/why · rule or ADR link · modules touched · migration? · new endpoints (policy names) · scenarios added · offline behaviour · screenshots (web + mobile) · security-review label if applicable.
- **Branches:** short-lived and trunk-based. `main` is always releasable.
- **Code review:** at least 1 reviewer. 2 reviewers for policies, consent, ikpe, payments, media access, migrations with triggers.

## 6. Change safety: so one change doesn't break five things

Before merging, answer in the PR:
1. Which **modules' state** does this read or write? (Should match the manifests.)
2. Which **events** does it emit or consume? Are the handlers idempotent?
3. Which **invariants** (01 §14) could it affect? Which test or monitor proves they still hold?
4. Which **clients and versions** see the change? Is it compatible with the 6-month mobile window?
5. What happens **offline** and on **retry**?

If any answer is "not sure", add a scenario test.

## 7. How AI agents may modify this project

AI coding agents follow [`AGENTS.md`](AGENTS.md). In short:
- Read 01, the relevant module README and its manifest before editing.
- Never modify policies, consent, ikpe evaluation, payments, migrations with triggers, or append-only tables without a human-approved plan in the PR description.
- Never add a client-side business rule. Use capabilities.
- Never strip or "fix" Igbo diacritics. Never add an `unaccent`-style normalisation to stored text.
- Always add or extend tests at the right layer (07). Run the module boundary lint and the authz matrix locally.
- Keep changes inside one module unless the task requires otherwise, and say so explicitly.

## 8. Keeping docs alive

- A CI check fails if a migration changes a table not mentioned in its module README, or if a new route policy is missing from the policy table.
- Quarterly docs review: check the planning numbers (08), runbooks (09) and ADR "revisit when" triggers.
- The prototype (`index.html`) is the visual and flow reference. When the product diverges, update the prototype or note the divergence in the relevant feature README.
