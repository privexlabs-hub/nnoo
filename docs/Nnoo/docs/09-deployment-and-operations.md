# 09 · Deployment & operations

## 1. Environments

| Env | Purpose | Data | Deploys |
|---|---|---|---|
| local | dev | seeded fixtures (synthetic elders, never real recordings) | — |
| preview | per-PR | seeded, ephemeral DB | on PR |
| staging | release candidate, mobile TestFlight/internal track | anonymised snapshot (no audio, no PII) | on merge to `main` |
| production | live | real | tagged release, manual approval |

Region and data residency: decided in **ADR-007**. Criteria: NDPA 2023 obligations for Nigerian residents, latency to Nigeria and the main diaspora cities, and the managed Postgres/KMS available. Backups are replicated to a second region.

## 2. Infrastructure

- Everything is in OpenTofu (`infra/`): network, DB, buckets + policies, CDN, secrets, queues, alerts. No console changes in production (drift detection runs nightly).
- Containers for the API, the job worker and the audio worker, on a managed container platform with autoscaling.
- Managed PostgreSQL with point-in-time recovery (PITR), a read replica, and encryption at rest.

## 3. Release process

**Backend**
1. Merge to `main` → build once, an immutable image tagged by commit SHA.
2. Deploy to staging → smoke + scenarios + k6 smoke.
3. Promote **the same image** to production as a rolling or canary release (10% → 50% → 100% with automatic rollback on error-rate/latency SLO burn).
4. Migrations run as a separate pre-deploy step (§4).

**Mobile**
- EAS builds per release. Staged rollout (store phased release 1% → 100% over 7 days).
- OTA updates (EAS Update) **only** for JS/asset changes that keep the same native runtime and the same local-DB schema. Anything else needs a store release.
- Every request sends `X-Client`. The server keeps a `min_supported` per platform. Clients older than that receive `426`.
- **API compatibility window:** every `/v1` change must work with the last **2 minor versions** of the mobile app and with any version released in the past 6 months.

**Web:** static assets to the CDN with content-hashed filenames, atomic switch, instant rollback by pointer.

**Feature flags:** server-side flags (stored in the DB, cached) for rollout only. **Business rules are never feature flags**; they change through governance config (10 §4).

## 4. Database migrations: expand / contract

1. **Expand:** add the new nullable column/table/index (`CREATE INDEX CONCURRENTLY`), and deploy code that writes both shapes.
2. **Backfill** in batches via a job (throttled, resumable).
3. **Switch reads** to the new shape.
4. **Contract:** drop the old column in a later release, after the mobile compatibility window.

Rules: no migration takes an `ACCESS EXCLUSIVE` lock on a hot table for more than 1 s (CI measures this against a snapshot). Every migration has a tested down path **or** a written forward-fix plan. Trigger changes for invariants require `security-review`.

## 5. Backups and recovery

| Asset | Method | RPO | RTO |
|---|---|---|---|
| Postgres | continuous WAL (PITR 14 days) + daily snapshots kept 35 days + monthly 1 year, cross-region | ≤ 5 min | ≤ 4 h |
| Masters (FLAC) | object versioning + cross-region replication. Delete markers honoured for revocations (replication of deletes **enabled**). | ≤ 15 min | ≤ 8 h |
| Derivatives | regenerable from masters | — | hours (batch) |
| Config / IaC | git | 0 | ≤ 1 h |

- **Restore drills quarterly:** restore production to an isolated environment, run the invariant checker and scenario smoke, and record the time taken.
- **Revocation and backups:** a revoked asset deleted from primary storage is also deleted from replicas. DB backups that contain metadata expire naturally. On restore, the **revocation ledger is replayed** before the system goes live, so a restore can never bring back revoked content.

## 6. Observability

- **Logs:** structured JSON with `request_id`, `actor_hash`, `module`, `action`. **No PII, no tokens, no Igbo free text from comments** (those can identify people). Retention 30 days hot.
- **Traces:** OpenTelemetry across API → DB → outbox → worker, with propagated context on events.
- **Metrics and SLOs:**

  | SLO | Target |
  |---|---|
  | API availability | 99.5% / month |
  | Vote write success | 99.9% |
  | Revocation propagation within 15 min | 100% (page on any miss) |
  | Outbox lag p99 | < 30 s |
  | Payout obligations stuck > 48 h | 0 |

- **Invariant monitors** (production checkers every 10 min, alerting the on-call and the council channel):
  - published recording without a passed case (INV-1)
  - any audio asset for an Nsọ recording (INV-2)
  - a play-URL issuance log entry for Umunna to non-kin (INV-3)
  - more than one payout per recording+kind (INV-4)
  - tally drift vs recomputation
  - UPDATE/DELETE attempts on append-only tables (DB audit)
  - revoked assets reachable via CDN (synthetic probe)

## 7. Operational access

- No standing production DB access. **Break-glass:** time-boxed (≤ 2 h), reason required, a second operator approves, the whole session is logged, and the council channel is auto-notified.
- Admin console reads are audited. There are no write tools for votes, tallies, consent or audit.

## 8. Incidents

- Severity: SEV1 (consent/restricted exposure, vote integrity, data loss), SEV2 (major outage), SEV3 (degradation).
- **SEV1 runbook:** contain (unpublish/disable path), preserve evidence, notify custodians and affected elders' facilitators within 24 h, legal assessment of regulator/data-subject notification deadlines, write a public post-incident note in plain language.
- Blameless post-mortems within 5 working days. Action items get owners and due dates.

**Runbooks required before launch:** revocation SLA breach · Nsọ media detected · tally drift · stuck outbox · payout provider outage · CDN purge failure · DB failover · restore from PITR · mobile force-upgrade · compromised facilitator account · Sybil cluster detected.

## 9. Routine operations

Weekly dependency PRs · monthly access review (role grants for moderators/operators) · quarterly restore drill + key rotation check · yearly penetration test, DR game day, and review of the planning numbers in 08.
