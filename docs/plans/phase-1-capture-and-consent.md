# Phase 1 plan: Capture & consent

Status: **approved by the product owner, 2026-10-25** (decisions in §8). Consent, media access, policies and triggers are AGENTS.md stop-and-ask areas; this plan is the approval.
triggers are stop-and-ask areas). Date: 2026-10-25.
Sources: docs/01 §5, §8, §15; docs/02 §5.1, §5.4, §7; docs/03; docs/06 §3, §5; docs/neon/05, 06 §4,
10 §Phase 1; Brief v2.1 §07 (facilitator tablet), §20 F-01…F-05, §23, §27, §33; ADR-031; prototype
`docs/Nnoo/src/App.jsx` (FacilitatorTablet).

## 1. Goal and exit criteria

Facilitators can record elders **offline, consent first**, and the audio arrives intact, private
and revocable. Nothing is published in Phase 1: Ikpe (Phase 2) is the only path to publication.

Phase 1 is done when:

1. **Offline capture** (Brief §33): with no signal, a facilitator completes consent, records 30 min,
   reviews, and the upload completes automatically later with the **same SHA-256**; killing the
   app at 10/50/99% resumes (07 §7).
2. **Consent first:** the API refuses session audio until the consent evidence has uploaded (05 §3).
3. **Nsọ (S-15, INV-2):** an upload for an Nsọ recording is rejected at the policy, the API **and**
   a DB trigger; an orphan or Nsọ object that reaches storage anyway is quarantined and alerts.
4. **Revocation (S-02 shape, INV-7):** revoking consent makes every derivative unreachable within
   15 min, verified by the `revocation-sla` monitor, which also fires on a deliberate failure.
5. **Audio pipeline:** an upload becomes a FLAC master, Opus + AAC derivatives and waveform peaks;
   the raw upload is deleted; bad formats and hash mismatches are rejected with the brand-voice
   message.
6. Gates green; the authz matrix covers every new route; docs/03 and manifests updated.

## 2. Split into two deliverables

|                          | Scope                                                                                                    | Why separate                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **1A — backend**         | community, consent, archive, media modules; storage; upload trigger; revocation; audio worker; scenarios | Verifiable on Neon now with automated tests      |
| **1B — facilitator app** | Expo app, tablet-first facilitator mode: session → consent → topic → record → review → sync              | Larger, needs devices; builds on a stable 1A API |

I propose 1A first, with a report, then 1B.

## 3. Storage spike first (build step 1.3)

Verified from Neon docs (2026-10-25): presigned PUT/GET ✅, multipart (Create/UploadPart/Complete/
Abort/ListParts) ✅, `PutBucketCors` ✅. **Lifecycle rules are stored but not enforced** ❌, and
**`DeleteObject` is a soft delete on the branch**. Versioning is not real.

The spike runs on a `test-*` branch and answers, with evidence in ADR-032:

- presigned **UploadPart** URLs work from a client; `ContentType` binding on presigned PUT; max object
  size; whether `x-amz-checksum-sha256` is honoured;
- after `DeleteObject`, does a previously issued presigned GET fail at once (needed for INV-7)?
- **is soft-deleted audio really gone?** If it survives in branch history, revocation must also
  account for PITR/restore (docs/09 §5 already requires replaying the revocation ledger on restore;
  the go-live checklist will record how long deleted bytes persist);
- `storage_object_created` trigger payload and timing.

Design consequences already known:

- the 7-day expiry of `media-uploads` becomes our own **sweep job** (daily, trigger-safe), together
  with orphan detection;
- buckets are private; bucket CORS on `media-derivatives` only (GET from the web origins).

## 4. Data model (migration 0003+, owner per module)

**community:** `state`, `lga`, `hometown` (NFC name, generated `name_search = lower(igbo_fold(name))`,
`bootstrap_mode`), `dialect` (tree), `hometown_dialect`. Seed: 3 **synthetic** hometowns. No kin or
vouching yet (Phase 2).

**archive:** `elder_profile` (NFC name, hometown, dialect, birth year, deceased_at, `steward_account_id`,
`family_representative` name, **payee designation**: elder or a named family member; never bank
data), `recording` (client UUIDv7 id, elder, facilitator, hometown, dialect, topic in
{story, proverb, song, recipe, craft, place_lore}, `status`, cached `tier`, `recorded_at`),
`recording_revision` (rev, NFC `title_ig`, `transcript_ig`, `glosses` jsonb by locale, tags,
`draft_source`), `recording_note` (facilitator notes at timestamps).
State machine `draft → discarded | in_review(Phase 2) | withdrawn`, enforced by the domain **and** an
allowed-transitions trigger (docs/03 §4).

**consent:** `consent_record`: versioned, append-only except revocation fields (ADR-026 grants):

- `tier` (`oha` | `umunna` | `nso`), `umunna_scope` (hometown ids)
- **separate permissions** (ADR-031): `allow_archive`, `allow_lessons`, `allow_social`, `allow_photo`;
  `allow_machine_assist` default **false** (ADR-025)
- `steward_may_widen_to`; `witness_name` (oral consent without reading or signing)
- `evidence_media_id` (spoken statement), optional `signature_media_id`
- `captured_by`, `captured_at`, `revoked_at`, `revoked_by`, `revocation_reason`
- constraints: one active consent per recording; `(tier = umunna) = (umunna_scope is not null)`;
  a trigger keeps `recording.tier` equal to the active consent; reconciled nightly.

**media:** `media_asset` (opaque key `<kind>/<uuidv7>`, kind, `sha256`, bytes, duration, mime,
status `pending → uploaded → ready | rejected → purged`), `upload_session` (multipart upload id,
part size 8 MiB, expires). Trigger `media_no_nso` (INV-2) as in docs/neon/03 §4.

## 5. Policies (for approval)

| Action                              | Allow when                                                                                                                                                                                                        |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `archive.elder.create`              | facilitator of the elder's hometown, step-up `amr` includes `passkey`                                                                                                                                             |
| `archive.recording.create`          | facilitator of the recording's hometown; elder exists; client id unused (idempotent)                                                                                                                              |
| `consent.capture`                   | facilitator of the hometown, step-up; recording in `draft`; evidence upload declared                                                                                                                              |
| `media.upload`                      | actor is the recording's facilitator **and** tier ≠ `nso` **and** active consent **and** recording `draft` **and** (kind ≠ session audio **or** consent evidence already `uploaded`)                              |
| `consent.narrow` / `consent.revoke` | (a) a facilitator of the hometown (**not necessarily the original**, 06 §8) with a new spoken statement from the elder; or (b) the steward; or (c) a custodian panel decision (Phase 2). Takes effect immediately |
| `consent.widen`                     | a new consent capture with the elder present; or the steward, only up to `steward_may_widen_to`                                                                                                                   |
| `archive.recording.discard`         | the recording's facilitator, while `draft`                                                                                                                                                                        |
| `media.status.read`                 | the recording's facilitator                                                                                                                                                                                       |
| reads of consent evidence           | the facilitator who captured it and (Phase 2) custodian panels; every read audited                                                                                                                                |

Facilitator sessions carry `amr`; capture, consent and widening require a passkey sign-in
(07 §1 step-up). OTP-only sessions get `401 identity.step_up_required`.

## 6. Flows

**Capture → upload (docs/02 §5.1, neon/05 §3), all commands idempotent with the client UUIDv7:**
`POST /v1/elders` → `POST /v1/recordings` → `POST /v1/consents` →
`POST /v1/uploads {recordingId, kind, bytes, sha256}` (→ `{uploadId, partUrls, partSize}`) → PUT parts
directly to storage → `GET /v1/uploads/{id}` (resume: missing parts, fresh URLs) →
`POST /v1/uploads/{id}/complete` (HeadObject, size check, status `uploaded`, outbox `MediaUploaded`,
job `audio.process`).
Consent evidence uses the same flow into `consent-evidence` and must complete first.

**Upload trigger** (`storage_object_created` on `media-uploads`, trigger-safe): unknown key →
quarantine (delete, audit, alert); Nsọ → purge + page; `pending` with all parts present →
complete server-side once.

**Audio worker (ADR-021):** Python + ffmpeg container. Claims `audio` jobs with a 15-minute service
token bound to one job; receives presigned GET (raw) and PUT (master, opus, aac, peaks) URLs; verifies
the SHA-256 → `ffprobe` whitelist (wav, flac, m4a/aac, opus) → FLAC master → −18 LUFS → Opus 32 kbps,
AAC 64 kbps → 800-point peaks → result callback. It holds no DB or storage credentials.
Locally and in CI it runs in Docker. Pitch targets are Phase 3.

**Revocation (beats everything, docs/02 §5.4):** one transaction: consent revoked → recording
`withdrawn` → audit → outbox `ConsentRevoked`. Then jobs: delete every derivative now; delete the
master within 24 h (or move it to the private archive if the elder chose that); `revocation-sla`
trigger every 5 min HEADs every derivative of recent revocations and pages on any object still
reachable after 15 min. Narrowing Ọha → Umunna or Nsọ takes effect at once; to Nsọ also purges audio.

## 7. Facilitator app (1B)

Expo (React Native), tablet-first layout from the prototype: fixed left rail (session card, the
6-item checklist, "Every recording belongs to the elder and their community. You can always stop.
There is no hurry."), stage on the right. Screens F-01 to F-04 from the Brief.
**Fixed from the prototype:** consent is step 1, before topic and recording.

- Recording: 48 kHz mono PCM, stored lossless until upload completes; level meter; pause; notes.
- Offline: encrypted SQLite (read models + upload queue), files in app storage; consent evidence
  queued before session audio; resumable multipart upload with per-part retry; identical hash.
- Sign-in: phone OTP, then passkey enrolment (needed for step-up).
- Copy: `packages/i18n` (en + Igbo phrases), brand voice; tokens from `packages/design-tokens`.
- Tests: Maestro flows incl. airplane mode and app kill; unit tests for the sync engine.

## 8. Decisions (approved 2026-10-25)

**Outcome:** (1) policy table approved, including revocation by **any facilitator of the hometown** with a new spoken statement; (2) **interim council bootstrap** via a CI job with two human approvers; (3) record **who is paid only**, no bank data; (4) audio-worker host decided at the 1A report; (5) 1A before 1B.

Original questions:

1. **Approve the policy table in §5**, especially that any facilitator of the hometown may record a
   revocation with a new spoken statement (06 §8: "the revocation path does not require the
   original facilitator").
2. **Bootstrapping the first facilitators and custodians.** Rules: facilitator = training +
   2 custodian sign-offs; custodians by custodian 2/3 + kin ratification. At launch there are no
   custodians. Proposal: a one-time **interim council bootstrap**: ≥ 5 named interim custodians
   from ≥ 3 hometowns, written to a `governance_event`, executed by a CI job that needs **two human
   approvers** (no admin endpoint, `granted_via = 'bootstrap'`), after which only panels grant.
   Alternative: keep Phase 1 entirely on `nnoo-dev` with synthetic facilitators.
3. **Payee designation in Phase 1:** record only _who_ is to be paid (the elder or a named family
   member); collect payout destinations in Phase 5 through the provider's tokenisation. Agree?
4. **Audio worker host** for preview/staging: not needed for automated tests (Docker in CI). For a
   shared preview we need a small container host near Frankfurt (e.g. Fly.io, Google Cloud Run or
   Scaleway; each has a free or low tier). Choose now, or defer to the 1A report?
5. **Order:** 1A (backend) first, then 1B (Expo app)?

## 9. Out of scope for Phase 1

Ikpe, submission and publication (Phase 2); kin verification (Phase 2); pitch targets (Phase 3);
payments (Phase 5); field alpha on production (needs `nnoo-prod`, a paid plan, legal review and
your approval).
