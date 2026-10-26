# ADR-0029: AI Gateway not enabled on the Free plan

Status: Accepted
Date: 2026-10-25

## Context

ADR-025 allows AI only for drafts (gloss/translation, tag suggestions, a facilitator help assistant,
ops digests), consent-gated by `allow_machine_assist`. Neon's pricing (checked 2026-10-25) lists the
AI Gateway as not available on the Free plan. No v1 must-have depends on AI; the earliest use is
Phase 4.4 ("if adopted").

## Decision

- `aiGateway` is not declared in `neon.ts`; no code calls a model.
- The `ai` job queue exists in the schema but is never drained (`DRAIN_ORDER` excludes it).
- When AI drafting is adopted: a typed `DraftingPort` in the archive module, a real Neon AI Gateway
  adapter used only by `jobs`, and a deterministic fixture adapter for tests that is refused outside
  `local`/`test` (the same rule as fake SMS/email). Production prerequisite: a paid plan with the
  AI Gateway, a pinned model chosen by the eval in docs/neon/08 §4, and a monthly budget with
  queue pause.

## Consequences

No AI cost, no AI data processing, and no mock presented as a working feature.

## Revisit when

Phase 4 planning, or a funded paid plan.
