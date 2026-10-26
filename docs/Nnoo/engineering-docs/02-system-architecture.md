# 02 · System architecture

## 1. Shape: a modular monolith with workers

One deployable API, one primary database, and background workers. Modules are separated by code boundaries, not by network boundaries.

**Why not microservices:** a small team, one domain, strong consistency needs (votes, payouts, consent). Microservices would multiply exactly the hidden-dependency and inconsistency problems we want to avoid. A module can be extracted later if a real scaling or ownership need appears; ADR-001 records the criteria.

```
┌───────────────────────────── Clients ─────────────────────────────┐
│ Mobile app (Expo: iOS, Android, phone+tablet)                      │
│   ├─ Learner mode      ├─ Facilitator mode (offline-first)         │
│ Web learner (React SPA)   Marketing (static)   Admin console       │
└──────────────┬──────────────────────────────────────┬─────────────┘
               │ HTTPS /v1 (JSON, OpenAPI)             │ signed media URLs
               ▼                                       ▼
┌──────────────────────────────┐            ┌────────────────────────┐
│ API (Node/TS, Fastify)        │            │ CDN  ← object storage   │
│  modules: identity, community,│            │  (private buckets)      │
│  consent, media, archive,     │            └───────────▲────────────┘
│  ikpe, learning, oha,         │                        │ derivatives
│  payments, notify, calendar,  │                        │
│  audit, governance            │            ┌───────────┴────────────┐
└───────┬───────────────┬───────┘            │ Audio worker (Python)   │
        │ SQL           │ outbox rows        │  transcode, loudness,   │
        ▼               ▼                    │  pitch targets          │
┌──────────────────────────────┐  jobs       └───────────▲────────────┘
│ PostgreSQL (primary + replica)│◄───────────┐           │ jobs
│  domain tables, outbox, jobs  │            │           │
└──────────────────────────────┘    ┌────────┴───────────┴───┐
                                    │ Job worker (Node/TS)    │
                                    │  outbox dispatch, sweeps│
                                    │  payouts, notifications │
                                    └──────────┬──────────────┘
                                               ▼
                         Payments provider · Push (APNs/FCM) · SMS/Email
```

## 2. Components and responsibilities

| Component | Owns | Never does |
|---|---|---|
| **API** | All business rules, authz, validation, state transitions | Long work (> 2 s), calling providers inline in a user request |
| **Job worker** | Outbox dispatch, scheduled sweeps (Ikpe timeouts, revocation SLA), payouts, notifications, reconciliation | Bypass domain modules. It calls module application services like the API does. |
| **Audio worker** | Transcode to Opus/AAC, loudness normalisation, waveform peaks, elder pitch-target extraction | Decide access or state. It writes results back through an internal API. |
| **PostgreSQL** | The system of record, including outbox and job queue | Hold audio binaries |
| **Object storage** | Audio, consent evidence, images. Private buckets only. | Public listing, public-read ACLs |
| **CDN** | Edge delivery of signed derivative URLs | Cache without a signature in the cache key |
| **Mobile app** | Presentation, offline store, on-device tone scoring, resumable upload | Authorisation decisions, quorum maths |
| **Web learner** | Presentation, on-device (in-browser) tone scoring | Same as mobile |
| **Admin console** | Moderation pairs, reconciliation views, config proposals | Edit votes, tallies, consent or audit (no such endpoints exist) |

## 3. One API for all clients (no duplicated logic)

- A single `/v1` REST API described by OpenAPI 3.1, generated from Zod schemas in `packages/contracts`. Typed clients for web, mobile and admin are generated from it. Nobody hand-writes request types.
- **No backend-for-frontend.** Clients differ in layout, not in rules. If a screen needs a different shape, add a read endpoint (a "view") in the owning module; don't reimplement logic in the client.
- **Capabilities, not role checks, in clients.** Every resource carries `capabilities`. Clients never contain `if (user.role === 'kin')`.
- **State is computed server-side.** Ikpe status, quorum progress, `isPlayable` and lesson availability come from the API. Clients never derive them.
- **Shared pure algorithms** that must run offline (tone scoring, market-day calculation, Igbo text normalisation) live in `packages/*-core`. These are pure functions with no I/O, versioned, and golden-tested. The server stores their outputs together with `algo_version`.

## 4. Module boundaries (no hidden dependencies)

Each module has the same internal layers (04 §3) and a **public interface**: application services plus published event types.

Rules:
1. A module reads and writes **only its own tables**. Other modules' data is reached through their public service or a read model built from their events.
2. Synchronous calls across modules are allowed only for **queries** and for **commands inside one transaction** where atomicity is a business rule (e.g. `ikpe.pass → archive.publish`). They go through the public service.
3. Side effects across modules (payout, notification, search index, cache purge) go through **domain events written to the outbox in the same transaction** as the state change.
4. Every module has a `module.manifest.ts` declaring its dependencies on other modules. The dependency-cruiser lint enforces the manifest, and cycles fail CI.

**Module map**

| Module | Owns | Depends on (queries) | Emits |
|---|---|---|---|
| identity | accounts, sessions, devices, role grants, guardianship | — | `AccountCreated`, `RoleGranted`, `AccountSuspended` |
| community | geography, hometowns, dialects, kin memberships, vouches, circles | identity | `KinVerified`, `KinRevoked` |
| consent | consent records, versions, revocations, stewards | identity, community | `ConsentNarrowed`, `ConsentRevoked`, `ConsentWidened` |
| media | assets, upload sessions, derivatives, signed URL issuance | consent (tier) | `MediaUploaded`, `DerivativesReady`, `MediaPurged` |
| archive | elders, recordings, revisions, publications, proverbs | consent, media, community | `RecordingSubmitted`, `RecordingPublished`, `RecordingUnpublished` |
| ikpe | cases, votes, tallies, comments, flags, panels | archive, community, consent | `CaseOpened`, `VoteCast`, `CasePassed`, `CaseReturned`, `CasePaused` |
| learning | words, lessons, items, tone targets, progress, attempts | archive, media | `LessonItemUnavailable` |
| oha | posts, comments, map presence | community | `PostCreated` |
| payments | obligations, attempts, beneficiaries | archive | `PayoutSucceeded`, `PayoutNeedsAttention` |
| notify | preferences, deliveries | identity | — |
| governance | configs, proposals, council appointments | community, ikpe | `ConfigActivated` |
| calendar | anchors, variants | governance | — |
| audit | append-only audit log | — (everyone writes through `audit.record`) | — |

## 5. Key flows

### 5.1 Facilitator capture → submit (offline-first)
1. The tablet creates `recording` (draft) and `consent_record` locally with client-generated UUIDv7 IDs. Consent audio is recorded first, then the session audio. Everything is stored encrypted in the device store.
2. When online: `POST /v1/recordings` (idempotency key = recording id) → `POST /v1/consents` → `POST /v1/uploads` returns a multipart upload session with presigned part URLs. Parts upload resumably, then `POST /v1/uploads/{id}/complete`.
3. The API verifies the checksum and that consent exists, and that the tier ≠ `nso`. It marks the asset `uploaded` and writes `MediaUploaded` to the outbox.
4. The audio worker transcodes, normalises and extracts peaks, then calls the internal `media.derivativesReady`.
5. The facilitator submits: `POST /v1/recordings/{id}/submit` → archive sets `in_review` and calls `ikpe.openCase` **in the same transaction**. Quorum is frozen at this point. `CaseOpened` is written to the outbox and kin are notified.

### 5.2 Vote
`PUT /v1/ikpe/cases/{id}/vote {choice}` with `If-Match` optional:
1. Policy: eligible voter (01 §6).
2. In one transaction: upsert the vote, append to `ikpe_vote_events`, apply the delta to `ikpe_tallies` (row lock on the tally row), and write `VoteCast` to the outbox.
3. After commit, the job `ikpe.evaluate(caseId)` runs. Evaluation is also run by a sweep every 5 minutes for time-based transitions.

### 5.3 Pass → publish → pay
`ikpe.evaluate` decides `passed`. In one transaction: case → `passed` (guarded `UPDATE … WHERE status='open'`), `archive.publish` (publication row, recording → `published`), and `CasePassed` + `RecordingPublished` written to the outbox. Then, asynchronously: the payments module creates the obligation (unique key `recording_id`), notifications go out, and the search index and lesson builder run.

### 5.4 Consent revoked (beats everything)
`POST /v1/consents/{id}/revoke`, by the elder via facilitator or by the steward:
1. In one transaction: consent → `revoked`; the archive marks the recording `withdrawn` or `unpublished`; any open case → `withdrawn`; `ConsentRevoked` is written to the outbox.
2. Jobs: purge CDN paths, delete derivatives (raw audio kept 30 days in a locked bucket only if the elder chose "archive privately", otherwise deleted), mark lesson items `unavailable`, and push a sync hint to clients.
3. The SLA monitor checks that every derivative is unreachable within 15 minutes and alerts otherwise.

## 6. API conventions

- **Paths:** `/v1/{module-resource}`, nouns, plural. Actions that are business commands use sub-resources: `/submit`, `/revoke`, `/vote`.
- **Idempotency:** every `POST` that creates or commands accepts an `Idempotency-Key` header. Keys and responses are stored 24 h per account. Mobile offline replay depends on this.
- **Concurrency:** `ETag` on mutable resources. `If-Match` is required for metadata edits (revisions) to prevent lost updates.
- **Pagination:** cursor-based (`?cursor=&limit=`), stable ordering by `(created_at, id)`.
- **Errors:** RFC 9457 `application/problem+json` with a stable `type` URI and a `code` (e.g. `ikpe.not_eligible`). Clients map `code` to localised copy. Error copy follows the brand voice ("The recording didn't catch. Would you try once more?").
- **Versioning:** additive changes only within `/v1`. Breaking changes → `/v2` with a 6-month overlap. Clients send `X-Client: mobile/1.8.2`. The server can answer `426`.
- **Localisation:** `Accept-Language` picks gloss locales. Igbo source text is always returned unchanged, along with its dialect.
- **Time:** RFC 3339 UTC everywhere. The client renders local time, except calendar fields, which say they are Lagos time.

## 7. Offline sync model

| Entity | Direction | Conflict rule |
|---|---|---|
| Draft recordings, consent | device → server | Server wins after the first acceptance. Client IDs make replays idempotent. |
| Votes cast offline | device → server | Replayed with original `cast_at`. Rejected if the case closed in the meantime; the user sees "The council closed before your voice arrived." |
| Lesson progress | both | Merge: max per item, union of completed. |
| Lessons, published recordings | server → device | Pull by `updated_since`. Tombstones for unpublished items. |
| Revocations | server → device | Highest priority. Sync on app foreground, plus silent push. |

The device stores an encrypted SQLite database plus a file cache. Media in the cache is keyed by asset id and re-checked against the server's `revoked_since` list on every sync.

## 8. Integrations (ports & adapters)

Each external service sits behind a port interface in the owning module, with a fake adapter for tests:
`PaymentsPort` (Nigerian provider, e.g. Paystack or Flutterwave, chosen in an ADR), `PushPort` (Expo push → APNs/FCM), `SmsPort` (OTP), `EmailPort`, `StoragePort` (S3-compatible API), `CdnPort` (signing + purge).

Provider webhooks land at `/v1/webhooks/{provider}`. They are verified by signature, stored raw, and processed by the job worker idempotently.

## 9. Failure modes

| Failure | Behaviour |
|---|---|
| DB primary down | API returns 503 for writes. Reads served from the replica where flagged safe. Mobile works offline. |
| Audio worker backlog | Submissions queue. Facilitator sees "Preparing audio". Cases open only after derivatives are ready. |
| Payments provider down | Obligations retry with backoff. Nothing user-facing breaks. |
| CDN purge fails | The SLA monitor alerts. Signed URLs have a 10 min TTL, so exposure is bounded anyway. |
| Push down | Users see things on the next app open. There is no correctness dependency on push. |
| Outbox dispatcher stalled | Alert at age > 2 min. Events are durable and nothing is lost. |
