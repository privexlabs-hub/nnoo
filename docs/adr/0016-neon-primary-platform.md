# ADR-016: Neon as the primary backend platform; region `aws-eu-central-1`

Status: Accepted. Verified 2026-10-25: Postgres, Functions and Function Triggers work in aws-eu-central-1 on the Free plan (a schedule trigger fired and drained the outbox on dev/claude at 04:45:01 UTC); Object Storage is listed for the Free plan (5 GB) and is verified in Phase 1.3 (AI Gateway is not on the Free plan; see ADR-029). Legal review of NDPA cross-border transfer still required before real data.
Date: 2026-10-25 (recorded from docs/neon/01; original text below)

**Context.** We want Postgres, object storage, long-running compute, scheduling and AI behind one config and one provider, with branchable environments. Neon offers Postgres in all its regions. Object Storage, Functions and the AI Gateway are currently offered in `aws-us-east-2`, `aws-us-east-1`, `aws-eu-central-1` and `aws-ap-southeast-1`. There is no African region.

**Decision.** One Neon project, `nnoo`, in **`aws-eu-central-1` (Frankfurt)**:

- It has the lowest latency of the four regions to Lagos/Enugu/Port Harcourt and to the UK/EU diaspora, while staying acceptable for North America.
- Postgres, buckets and functions sit in the same region, so the API talks to the DB at in-region latency.

**Consequences.** Personal data of Nigerian residents is processed outside Nigeria, so the NDPA 2023 cross-border transfer requirements apply. **Legal review is required before launch** (lawful basis, safeguards, privacy notice). Offline lesson packs (`docs/08 §3`) hide most of the latency to Nigeria.

**Revisit when** Neon offers storage and functions in an African region, or when p95 audio start time in Nigeria exceeds its budget.
