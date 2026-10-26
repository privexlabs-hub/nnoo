# 09 · CI/CD & operations on Neon

## 1. Pipeline overview (GitHub Actions)

```
PR opened/updated
 ├─ static:   typecheck · lint (boundaries, no client role checks, no hard-coded copy/colors) · gitleaks · CodeQL
 ├─ unit:     domain + property tests (no DB)
 ├─ integ:    Testcontainers Postgres (same major as Neon) → migrations → integration tests
 ├─ preview:  create Neon branch preview/pr-<n> from `seed`
 │            → drizzle-kit migrate (owner URL from branch)
 │            → neon deploy (functions + triggers on the preview branch)
 │            → set APP_DATABASE_URL / EDGE_AUTH_SECRET for the preview functions
 │            → deploy web preview (points at preview edge route)
 │            → scenarios (docs/07 §5) + authz matrix + Playwright smoke
 └─ comment:  preview URLs, migration timings, bundle sizes

merge to main
 ├─ build once (function bundles, web assets, worker image) — tagged by SHA
 ├─ staging:  reset `staging` from `seed` → migrate → deploy → full scenarios + k6 smoke + Maestro (nightly)
 └─ release candidate ready

tag vX.Y.Z (manual approval: 2 reviewers)
 ├─ migrate `main` (direct host, lock_timeout 2s)        ← expand step only
 ├─ neon deploy to `main` (functions + triggers)
 ├─ post-deploy checks: health, invariants endpoint, error-rate watch (15 min)
 └─ web: atomic switch; mobile: EAS build/submit (phased) or EAS Update if JS-only

PR closed → delete preview/pr-<n> branch (and its forked buckets/functions)
```

Branch automation: use Neon's GitHub integration or the official branch create/delete Actions, or call the Neon API with a project-scoped key held as a GitHub secret. ⚠ Verify the current action names and inputs. CI authenticates to Neon with a **project-scoped API key** stored in GitHub environments. The production environment requires approval.

## 2. Example workflow fragment

```yaml
# .github/workflows/preview.yml (fragment)
jobs:
  preview:
    runs-on: ubuntu-latest
    environment: preview
    env:
      NEON_API_KEY: ${{ secrets.NEON_API_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: npm i -g neon
      - name: Create branch from seed
        run: neon branches create --name preview/pr-${{ github.event.number }} --parent seed # ⚠ Verify flags
      - name: Checkout branch env
        run: neon checkout preview/pr-${{ github.event.number }}
      - run: pnpm drizzle-kit migrate
      - run: neon deploy
      - run: pnpm tools:set-function-env --branch preview/pr-${{ github.event.number }} # APP_DATABASE_URL, EDGE_AUTH_SECRET
      - run: pnpm test:scenarios && pnpm test:authz
```

## 3. Release rules

- **Order:** migrations (expand) → functions → clients. The contract step of expand/contract ships at least one release later and only after the mobile compatibility window (6 months / 2 minor versions).
- **Rollback:** functions roll back by redeploying the previous tagged bundle (`neon deploy` from the tag). Migrations don't roll back automatically; we roll forward with a fix. Expand-only migrations make rollback of code safe.
- **Triggers** deploy with `neon.ts`. Disabling a trigger in an incident: set `enabled: false` and redeploy, or use Console/CLI. Every change is audited in the incident log.
- **Feature flags** for rollout only (DB-stored, cached 30 s). Never for business rules.

## 4. Observability

| Signal               | Source                                                                     | Destination                                                                                                                                                                                                          |
| -------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Function logs (JSON) | stdout                                                                     | `neon logs query --source function` for ad hoc work. Exported to the log platform for retention and alerting (⚠ Verify the log export/drain option; fallback: ship logs from code with an HTTP log client, batched). |
| Errors               | Sentry-class SDK in Hono (⚠ Verify runtime compatibility)                  | error tracker, release-tagged                                                                                                                                                                                        |
| Traces               | OpenTelemetry (manual spans around use cases, DB, storage, provider calls) | OTLP endpoint. Keep the AI SDK telemetry off (08 §3).                                                                                                                                                                |
| DB metrics           | Neon console/metrics, `pg_stat_statements`                                 | weekly top-queries review                                                                                                                                                                                            |
| Business SLOs        | `/internal/invariants/check`, queue metrics, revocation SLA                | alerting + council channel for INV breaches                                                                                                                                                                          |
| Client RUM           | mobile + web SDK (first-party, no trackers)                                | screen load, audio start, scoring latency by country                                                                                                                                                                 |

**Dashboards:** API RED by route · cold-start rate and p95 · pool saturation · outbox lag · job depth by queue · payout pipeline · revocation SLA · storage egress by bucket · AI Gateway spend.

## 5. Backups and recovery

| Asset            | Primary protection                                                                                       | Independent copy                                                                                                                                       | Drill                   |
| ---------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| Postgres         | Neon point-in-time restore (set history retention to the plan maximum; ⚠ Verify the window for the plan) | nightly logical dump (`pg_dump -Fc` via the direct host, `nnoo_readonly`) → encrypted object in a **separate provider/account**, 35 daily + 12 monthly | quarterly               |
| Masters          | `media-masters` bucket                                                                                   | nightly copy of new or changed masters to an independent bucket. Deletes replayed from the revocation ledger within 24 h.                              | quarterly               |
| Derivatives      | regenerable from masters                                                                                 | —                                                                                                                                                      | yearly batch regen test |
| Consent evidence | `consent-evidence` bucket                                                                                | nightly copy (encrypted, restricted)                                                                                                                   | quarterly               |
| Config           | git (`neon.ts`, migrations, IaC for edge/worker)                                                         | —                                                                                                                                                      | every deploy            |

Targets (from `docs/09`): **RPO ≤ 5 min, RTO ≤ 4 h** for the database.

## 6. Restore procedure (Neon)

1. Incident commander approves. CI job `restore` creates `restore/<timestamp>` from `main` at the target point in time (Neon branch from history).
2. **Replay the revocation ledger** onto the restore branch: every consent revoked after the restore point → re-apply revocation, unpublish, purge object keys. Restoring must never bring back revoked content.
3. Run `/internal/invariants/check` and the scenario smoke against the restore branch (functions deployed to it, triggers disabled).
4. Cut over: either promote the restore branch to be the new primary or copy the recovered rows back into `main`, according to the incident type. ⚠ Verify how Neon promotes or resets a branch.
5. Re-enable triggers, watch SLOs, and delete the old or restore branch in ≤ 24 h. Write the post-mortem.

Drill this quarterly on a restore from **`seed`-derived staging**, and yearly on `main` under break-glass. Record the timings.

## 7. Runbooks (Neon-specific additions)

| Runbook                             | First actions                                                                                                                                  |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Function cold-start storm / latency | check compute size and minimum instances (⚠ Verify), pool saturation, recent deploy; roll back if a regression                                 |
| Pool exhaustion                     | lower `max` per isolate, check for leaked transactions (`pg_stat_activity` by `application_name`), kill idle-in-transaction > 30 s             |
| Trigger not firing                  | `neon logs query`, trigger enabled state, branch it targets; run the endpoint manually with a test invocation id (safe by design)              |
| Storage trigger flood               | rate limiter engaged? quarantine counts; disable the trigger temporarily (the explicit `/complete` path still works)                           |
| AI Gateway 403/429                  | retry with backoff (credential propagation); pause the `ai.*` queue; nothing user-facing depends on it                                         |
| Neon regional incident              | API in read-degraded mode if the replica is available; mobile offline continues; status page; no writes are lost on the client (offline queue) |
| Accidental branch from `main`       | delete immediately, audit what was accessed, SEV2 review                                                                                       |

## 8. Cost management

- Compute autosuspend for previews and dev, `main` sized for the year-1 load profile. Review monthly.
- Branch hygiene: previews deleted on PR close, `dev/*` expire after 14 days.
- Storage lifecycle: `media-uploads` 7-day expiry. Masters are the main long-term cost; track GB per audio hour.
- AI Gateway budget with queue pause (08 §5).
