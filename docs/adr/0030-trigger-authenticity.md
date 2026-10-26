# ADR-0030: Trigger authenticity: Neon-stripped headers + trigger-safe handlers

Status: Accepted, verified
Date: 2026-10-25

## Context

docs/neon/06 §5 noted that a public function URL can receive a forged `X-Neon-Trigger-Invocation-Id`
and asked to verify whether stronger origin authentication exists for triggers.

## Findings (verified)

- Neon's Function Triggers documentation: Neon strips any client-supplied `X-Neon-*` header at its
  edge, so a delivery that carries the invocation header came from the trigger system.
  `parseTriggerDelivery` (@neon/functions ≥ 0.11) checks the header and the delivery shape.
- Live check on `nnoo-dev/dev/claude`: a request to `/internal/jobs/drain` that sent the header
  itself was rejected with 401 (the header did not reach the function).
- Trigger routes cannot require a user JWT or a shared secret (Neon posts to the native URL
  without them).

## Decision

Every `/internal/*` trigger route uses `triggerRoute()` (apps/api/src/platform/triggers.ts):
`parseTriggerDelivery` → per-path rate limit → `trigger_invocation` dedupe (a retry with the same id
is a no-op; a failed run forgets the id so the platform retry runs) → bounded handler. Handlers
remain **safe by construction**: they only do work the system would do anyway now; they never
grant, publish, pay or delete on a payload's say-so. Service routes (`/internal/audio/*`, Phase 1)
use signed service tokens instead.

## Consequences

Local development has no Neon edge, so locally anyone can call a trigger route; that is acceptable
because handlers are trigger-safe and local data is synthetic.

## Revisit when

Neon adds signed trigger deliveries.
