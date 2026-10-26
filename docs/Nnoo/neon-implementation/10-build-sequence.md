# 10 · Build sequence & go-live checklist

This is the concrete, ordered path from an empty repository to v1.0 on Neon. It follows the phases in `engineering-docs/11-roadmap.md`. Each step lists what to do, the Neon pieces involved, and how to know it's done.

## Phase 0: Foundations

| # | Step | Neon pieces | Done when |
|---|---|---|---|
| 0.1 | Create the monorepo (pnpm + Turborepo), packages from `engineering-docs/04` | — | `pnpm build` green |
| 0.2 | Neon project `nnoo` in `aws-eu-central-1` | `neon projects create --name nnoo --region-id aws-eu-central-1` | project exists. Paid plan if AI Gateway is planned. |
| 0.3 | `neon link --no-config`, `neon config init`; commit `neon.ts` (no buckets/functions yet); gitignore `.neon`, `.env*` | `neon.ts` | CI can read `neon.ts` |
| 0.4 | Create the `seed` branch. Protect `main` in the branch policy. | branches, policy | `main` protected; `seed` exists |
| 0.5 | Drizzle setup, first migration (identity tables, `job`, `outbox_event`, `audit_log`, `idempotency_key`, `trigger_invocation`) + custom SQL (extensions, `igbo_text` domain, grants) | Postgres | migrate works on `seed` and Testcontainers |
| 0.6 | Create `nnoo_app_login` (and others). Grant roles. CI permission tests. | roles | `nnoo_app` can't update `audit_log` |
| 0.7 | `api` function skeleton: platform middleware, default-deny `route()`, env validation, `/v1/health` | Function `api` | `neon deploy` → `neon functions get api` returns 200 through the edge |
| 0.8 | Edge proxy: `api.nnoo.app` → function URL, `X-Edge-Auth`, WAF baseline | — | the raw function URL returns 404 for `/v1/*` |
| 0.9 | Auth spike (ADR-022): run the acceptance tests on Managed vs library Better Auth; decide; implement OTP + passkey sign-in | `auth: true`? | sign-in works on iOS, Android, web |
| 0.10 | `jobs` function + `jobs-drain` trigger + outbox dispatcher + trigger-safe middleware | Function `jobs`, schedule trigger | a test event flows outbox → job → handler on a preview branch |
| 0.11 | CI: static, unit, integration, preview branch per PR from `seed`, authz matrix harness | GitHub Actions + Neon API key | PR shows a preview URL and green gates |
| 0.12 | Observability baseline: structured logs, error tracking, dashboards | logs | errors from a preview appear in the tracker |

## Phase 1: Capture & consent

| # | Step | Neon pieces | Done when |
|---|---|---|---|
| 1.1 | Community module: geography, hometowns, dialects (seeded taxonomy) | Postgres | seed contains 3 hometowns |
| 1.2 | Archive + consent modules: elders, recordings, revisions, consent versions, stewards; state machine triggers | Postgres, custom SQL | invalid transitions fail in the DB |
| 1.3 | Add the buckets to `neon.ts` (all private), deploy, verify the presigning and CORS assumptions | Object Storage | the ⚠ items in 05 are confirmed or have fallbacks |
| 1.4 | Media module: upload sessions, multipart presign, complete, `upload-created` trigger with quarantine and Nsọ guard | Storage + trigger | killing the app mid-upload resumes; orphan objects are quarantined |
| 1.5 | Audio worker container + claim/result API + service tokens | `jobs` | an upload becomes Opus/AAC/peaks; raw is deleted |
| 1.6 | Facilitator mode in Expo: offline store, consent-first capture, sync, idempotent replay | — | 30 min session recorded in airplane mode, synced later, identical hash |
| 1.7 | Revocation flow + `revocation-sla` trigger + purge jobs | trigger | S-02 scenario green; SLA monitor fires on a deliberate failure |
| 1.8 | Field alpha on `main` (facilitators only, Ikpe not yet live; recordings stay `draft`/`in_review`) | `main` | exit criteria in the roadmap |

## Phase 2: Ikpe & Ọbá

| # | Step | Neon pieces | Done when |
|---|---|---|---|
| 2.1 | Kin verification (vouches, in-person, founding circles), `nightly-stats` trigger | trigger | `verified_active_kin` snapshots exist |
| 2.2 | Ikpe module: cases, votes, events, tallies, `evaluate()`, flags, panels (seeded RNG recorded) | Postgres | property tests green |
| 2.3 | `ikpe-sweep` trigger, debounced `ikpe.evaluate` jobs | trigger | timeouts and min-close transitions happen without user traffic |
| 2.4 | Publication + INV-1 trigger; `media.play` with presigned GET; issuance log | storage | S-04 green; non-kin can't play Umunna |
| 2.5 | Governance config + governance cases | Postgres | a threshold change ratified through Ikpe applies to new cases only |
| 2.6 | `invariants` + `nightly-reconcile` triggers wired to alerts | triggers | a deliberately inserted drift on `staging` is detected |
| 2.7 | Mobile learner and kin surfaces: Ikpe list/case/vote, Ọbá browse/play; offline vote replay | — | S-05, S-06 green |

## Phase 3: Learning & tone

| # | Step | Neon pieces | Done when |
|---|---|---|---|
| 3.1 | Tone-target extraction in the audio worker (`reextract` step) | `jobs` audio queue | targets stored with `algo_version` |
| 3.2 | `pronunciation-core` package + golden fixtures shared with Python | — | parity tests green in both languages |
| 3.3 | Learning module, lesson packs, `play-batch` presign | storage | a pack downloads and plays offline |
| 3.4 | Minor accounts + guardian model in auth and capabilities | auth | S-13 green |
| 3.5 | Learner beta | `main` | roadmap exit criteria |

## Phase 4: Web learner & Ọha

| # | Step | Neon pieces | Done when |
|---|---|---|---|
| 4.1 | Web learner SPA on the generated client (three-column layout from the prototype) | — | shared scenario suite passes against the web too |
| 4.2 | Ọha: circles, posts, moderation pairs, kin map (k ≥ 5) | Postgres | moderation needs two moderators |
| 4.3 | Search on folded columns (`pg_trgm`, FTS) | Postgres | `ulo` finds `ụlọ` |
| 4.4 | AI gloss drafts (if adopted): consent flag, `ai.*` jobs, eval harness | AI Gateway | eval baseline recorded; drafts are suggestions only |
| 4.5 | Admin console with break-glass reads | — | no write path exists for votes/tallies/consent |
| 4.6 | `gloss-coverage` trigger + second locale | trigger | coverage report per language pair |

## Phase 5: Payments & launch

| # | Step | Neon pieces | Done when |
|---|---|---|---|
| 5.1 | Payments module + provider adapter + webhooks (`/v1/webhooks/<provider>`, raw stored, idempotent) | `api`, `jobs` | S-10 green |
| 5.2 | Steward succession + deceased-elder flow | — | S-11 green |
| 5.3 | Independent backups (logical dumps, master copies) + restore drill using a Neon PITR branch + revocation replay | branching | drill within RTO, recorded |
| 5.4 | Load test to year-1 budgets against `staging` sized like `main` | compute sizing | budgets met; cold-start rate acceptable |
| 5.5 | External penetration test (edge, function URLs, trigger endpoints, presigned URLs, auth) | — | 0 open high/critical |
| 5.6 | Runbooks (engineering-docs/09 + 09 §7 here), on-call, status page | — | tabletop exercise done |

## Go-live checklist (production `main`)

**Platform**
- [ ] Project in the approved region. Paid plan features confirmed. Compute sized and autoscaling limits set.
- [ ] `main` protected. Only 2 named operators. Hardware-key SSO.
- [ ] Every ⚠ Verify item in this folder resolved (confirmed, or fallback implemented), with a link to the evidence.
- [ ] Branch policy enforced. No `preview/*` or `dev/*` derived from `main` (audited).

**Data**
- [ ] Migrations applied through CI only. No `drizzle-kit push` history on shared branches.
- [ ] Runtime uses `nnoo_app_login`. Permission tests green against `main`.
- [ ] Invariant triggers present (INV-1, 2, 4, 8, 9) and tested.
- [ ] PITR window at the plan maximum. Independent nightly dumps verified by a restore.

**Security**
- [ ] Edge in front of `api`. The raw function URL rejects `/v1`.
- [ ] Trigger endpoints trigger-safe, deduplicated and rate-limited. Spoof test performed.
- [ ] All buckets private. Presigned TTLs as specified. Bucket CORS restricted.
- [ ] Secrets in the secret store. `gitleaks` clean. Rotation dates set.
- [ ] Authz matrix covers 100% of routes. Pen-test findings closed.

**Operations**
- [ ] Dashboards and alerts live (outbox lag, job depth, revocation SLA, invariants, payouts, spend).
- [ ] Runbooks published. On-call rota. Status page.
- [ ] Restore drill timing recorded within RTO.
- [ ] Data-protection review signed off (NDPA cross-border transfer, GDPR, children).

**Community and governance**
- [ ] Council charter ratified. Ikpe thresholds in `governance_config` v1.
- [ ] Consent script (including `allow_machine_assist`) approved by custodians and tested with elders.
- [ ] Transparency page live (how Ikpe works, takedown log, AI use statement).

Launch only when every box is checked. A box can't be waived by any one person; it needs the council and tech-owner sign-off described in `engineering-docs/10 §4`.
