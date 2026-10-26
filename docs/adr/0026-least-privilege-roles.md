# ADR-026: Least-privilege database roles

Status: Accepted. Verified 2026-10-25 by integration tests on Neon: nnoo_app cannot UPDATE/DELETE/TRUNCATE audit_log (including partitions directly) or change outbox events except dispatched_at. Amendment: the LOGIN role must be created with SQL as the owner. Roles created with `neon roles create` are members of neon_superuser, which would defeat least privilege.
Date: 2026-10-25 (recorded from docs/neon/01; original text below)

**Decision.**

- `nnoo_owner` runs migrations only, from CI.
- `nnoo_app` is the runtime role for `api` and `jobs`. It has no `UPDATE`/`DELETE` on append-only tables and only column-level `UPDATE` on consent revocation fields.
- `nnoo_readonly` is for replicas and analytics.

The runtime never uses the owner credentials that `neon deploy` injects by default: functions read `APP_DATABASE_URL`, not `DATABASE_URL` (07 §4). ⚠ Verify how to set function env vars per branch.
