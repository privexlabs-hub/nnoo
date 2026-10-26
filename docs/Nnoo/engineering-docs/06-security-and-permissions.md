# 06 · Security & permissions

## 1. What we protect, ranked

1. **Elder consent and restricted knowledge.** Nsọ never stored. Umunna never leaked. Revocation always honoured.
2. **Integrity of collective decisions.** Votes, tallies, panels, config. Nobody can quietly change them.
3. **Children's safety and privacy.**
4. **Identity and personal data:** phones, names, hometowns, payout destinations.
5. **Availability of learning**, including offline.

## 2. Identity

- **Sign-in:** phone OTP (6 digits, 5 min TTL, 5 attempts, per-number and per-IP rate limits), then passkey enrolment is offered. Email is an optional recovery channel.
- **Tokens:** access JWT valid 10 min (claims: `sub`, `sid`, `ver`, no roles). Refresh token valid 30 days, rotating, single-use, bound to the device. Reuse revokes the whole session family.
- **Roles are not in the token.** They are loaded per request from a 60-second cache that is invalidated on `RoleGranted`/`RoleRevoked`. A revocation therefore applies within a minute, not at token expiry.
- **Facilitators and custodians** need a passkey or an authenticator app (second factor) to submit, to sit on panels, or to change consent.
- **Minors:** created by a guardian account. They have no phone requirement and sign in with a device-bound credential plus guardian approval.
- **Device integrity:** App Attest (iOS) / Play Integrity (Android) for facilitator uploads and voting. This is a signal, not a hard block.

## 3. Authorisation model

A **policy engine** with one function: `can(actor, action, resource, context) → allow | deny(code)`.

- **RBAC + scope:** a role grant with scope (`kin@hometown:X`).
- **ABAC:** resource attributes (tier, case status, is facilitator of the case, is minor, account age).
- **Policies are data + code:** a table in `modules/*/domain/policies.ts`, each entry `{ action, rule, denyCode }`. One file per module, reviewed like business rules.
- **Default deny.** Unknown action → deny. A route without a policy → the server won't boot (04 §4).
- **Capabilities** returned to clients come from the same `can()` calls, so the UI and enforcement never diverge.

**Core policy table (abridged)**

| Action | Allow when |
|---|---|
| `media.play` | recording published AND (tier=oha OR (tier=umunna AND actor kin of `umunna_scope`)) AND consent not revoked |
| `media.upload` | actor is facilitator of recording AND tier ≠ nso AND active consent exists AND recording in draft |
| `ikpe.vote` | 01 §6 eligibility AND case open/paused AND not minor |
| `ikpe.flag` | eligible voter AND < 3 open flags by actor across cases (anti-abuse) |
| `consent.revoke` | actor captured consent on behalf of elder (with elder evidence) OR actor is steward OR panel decision |
| `consent.widen` | new consent capture by facilitator with elder present, OR steward within `steward_may_widen_to` |
| `kin.vouch` | actor verified kin of hometown ≥ 30 days AND vouching rights not suspended |
| `comment.hide` | moderator AND second moderator co-signs within 24 h (pending until then) |
| `recording.takedown` | two distinct moderators |
| `admin.*` read | operator in an active, audited break-glass session with reason |
| votes/tallies/audit write | **no actor**: no endpoint exists |

## 4. Endpoint security checklist (every route)

- [ ] Declared `policy`, request and response schemas (unknown fields stripped, size limits).
- [ ] Resource loaded **by id plus an ownership/scope predicate** in the query, never id alone, which prevents IDOR.
- [ ] Rate-limit class declared (`auth`, `write`, `vote`, `read`, `media`).
- [ ] Idempotency on create/command.
- [ ] No sensitive field in the response unless the policy allows it. Response schemas are allow-lists.
- [ ] Audit entry for state changes on consent, ikpe, roles, payments, governance, moderation.
- [ ] Tested in the generated authz matrix (07 §6).

## 5. Media and files

- **Buckets are private.** Object keys are opaque UUIDs. There are no public ACLs (enforced by bucket policy plus an IaC test).
- **Playback:** `GET /v1/media/{id}/play` runs `media.play`, then returns a CDN URL signed for **10 min**, path-scoped, and including the account hash in the signature. The CDN cache key includes the signature scope, so restricted audio can't be served from cache to the wrong person.
- **Upload:** presigned multipart limited to the declared size and content-type. The server verifies the SHA-256 on completion, and the worker re-probes the format with ffmpeg and rejects anything else (no polyglots). Images are re-encoded to strip EXIF/GPS.
- **Nsọ:** blocked in policy, the API and a DB trigger (`media_no_nso`). The facilitator app also never offers upload for Nsọ.
- **Offline caches on devices** are encrypted. Each cached asset carries its tier, and sync purges anything that has been revoked or is no longer authorised.

## 6. Data protection

| Class | Examples | Controls |
|---|---|---|
| Restricted | consent evidence, beneficiary tokens, Umunna audio | separate bucket/KMS key, access audited, never in logs |
| Personal | phone, name, hometown, kin links | encrypted at rest, column-level access in admin, erasure flow |
| Children | minor accounts, progress | guardian-controlled, no ads/analytics SDKs, no profiling |
| Public | published Ọha recordings, proverbs | still served via signed URLs (anti-scraping + revocation) |

- **Payout details** are tokenised at the provider. We store a token, never raw account numbers.
- **Location:** city id only. The kin map uses k-anonymity (≥ 5 per cell).
- **Analytics:** first-party, aggregated, no third-party trackers in the app. Learner voice is never sent to analytics.
- **Erasure:** account → PII nulled, votes kept as a pseudonymous hash (01 §14 INV-11). Consent records belong to the elder and are not erased by the facilitator's erasure.

## 7. Secrets and keys

- A managed secret store per environment. No secrets in repos, mobile bundles or web bundles (CI scans with gitleaks).
- KMS envelope encryption for restricted buckets and DB column encryption keys. Keys rotate yearly or on incident.
- CI/CD uses OIDC federation to the cloud. There are no long-lived deploy keys.
- Mobile holds only public config. Provider calls happen on the server.

## 8. Threats specific to Nnọọ

| Threat | Mitigation |
|---|---|
| **Sybil kin** (fake accounts to pass or block cases) | vouching with accountability, account-age gates, device attestation signal, vouch-graph anomaly detection (clusters vouching each other within days), quorum frozen at open |
| **Brigading** from outside a hometown | non-kin votes don't count toward the outcome |
| **Single bad custodian** | panels of 3+, random draw (seeded RNG recorded in the audit), recusal if related to the elder |
| **Insider admin** | no write paths to votes/tallies/consent, DB role lacks UPDATE/DELETE on append-only tables, break-glass audited and alerted to the council channel |
| **Archive scraping** | signed URLs, per-account play rate limits, Opus derivatives only (masters never served) |
| **Facilitator coercion of elders** | consent statement recorded in the elder's own voice. Custodian spot checks. The revocation path does not require the original facilitator. |
| **Account takeover** | OTP limits, passkeys, refresh-reuse detection, new-device alerts |
| **Child contact** | minors are not discoverable, there is no DM, and circles for minors are guardian-approved |

## 9. Secure SDLC

- Threat-model review for any change to policies, consent, ikpe, payments or media access (required PR label `security-review`).
- SAST (CodeQL), dependency audit, container scan, and IaC scan (tfsec/Checkov-class) in CI.
- Yearly external penetration test before major releases. Bug bounty after launch.
- Security incidents follow the 09 §8 runbook, with notification timelines per applicable law.
