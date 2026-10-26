# Nnọọ documentation

This folder is the **only canonical documentation**. Code that disagrees with it is a bug; a rule
that is wrong is changed here first ([10 §4](10-documentation-and-governance.md)).

| Read                                                                                                                                     | When                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [00 · Source of truth](00-source-of-truth.md)                                                                                            | How these docs were derived, what is legacy, open decisions                                             |
| [01 · Product requirements](01-product-requirements.md)                                                                                  | Before touching any feature. Merged with Brief v2 by [ADR-031](adr/0031-brief-v2-safety-first-merge.md) |
| [02 · Architecture](02-system-architecture.md) · [03 · Data model](03-data-model.md) · [04 · Codebase](04-codebase-structure.md)         | Adding a component, table or module                                                                     |
| [05 · Stack](05-stack-and-dependencies.md) · [06 · Security](06-security-and-permissions.md) · [07 · Testing](07-testing-and-quality.md) | Adding a library, an endpoint or a test                                                                 |
| [08 · Scale](08-scalability-and-performance.md) · [09 · Operations](09-deployment-and-operations.md)                                     | Something is slow; releasing; recovering                                                                |
| [10 · Governance](10-documentation-and-governance.md) · [11 · Roadmap](11-roadmap.md)                                                    | Changing a rule; planning                                                                               |
| [neon/](neon/00-README.md)                                                                                                               | How it is built on Neon: config, database, API, storage, jobs, auth, AI, CI/CD, build sequence          |
| [adr/](adr/README.md)                                                                                                                    | Every material decision, with status and verification                                                   |
| [setup.md](setup.md)                                                                                                                     | From a clean checkout to a running local API                                                            |
| [../AGENTS.md](../AGENTS.md)                                                                                                             | Required reading for AI coding agents                                                                   |

Source material (frozen, not maintained): `docs/Nnoo/` (Claude Design export: prototype, original
engineering docs and Neon guide) and `docs/nnoo brand identity and marketing system/` (Business
Brief v2.1, brand playbook, logos, website).
