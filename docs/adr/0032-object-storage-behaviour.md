# ADR-0032: Neon Object Storage behaviour and what it means for media, revocation and backups

Status: Accepted, verified by spike on nnoo-dev (2026-10-26, branches `test-storage*`, since deleted)
Date: 2026-10-26

## Context

ADR-020 and docs/neon/05 assumed S3 semantics for presigned uploads, playback, deletion on
revocation, lifecycle expiry and backups, each marked "⚠ Verify". Revocation within 15 minutes
(INV-7) and "restoring never brings back revoked content" (09 §5) depend on how deletion and
branching behave.

## Findings (each tested, AWS SDK v3, path-style, SigV4)

| #   | Behaviour                                                                             | Result                                                                                                                               |
| --- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Private bucket, unsigned GET                                                          | 403 ✅                                                                                                                               |
| 2   | Presigned GET; after expiry                                                           | 200; 403 after expiry ✅                                                                                                             |
| 3   | Presigned PUT with a tampered key                                                     | 403 ✅                                                                                                                               |
| 4   | **Presigned PUT `ContentType` binding**                                               | **not enforced**: a different Content-Type was accepted                                                                              |
| 5   | Multipart: Create, presigned UploadPart (8 MiB), ListParts, Complete, HeadObject size | ✅ all work from a plain HTTP client                                                                                                 |
| 6   | `ChecksumSHA256` on PutObject                                                         | enforced (`BadDigest` on mismatch) ✅                                                                                                |
| 7   | **DeleteObject → outstanding presigned GET**                                          | **404 immediately** ✅                                                                                                               |
| 8   | Bucket CORS                                                                           | allowed origin only ✅                                                                                                               |
| 9   | Lifecycle configuration                                                               | accepted but **not enforced** (Neon docs)                                                                                            |
| 10  | **Branch at a past timestamp**                                                        | buckets fork their **state at branch creation**, not the past point: an object written after the timestamp was present on the branch |
| 11  | **Child branch created before a delete**                                              | **keeps the object** after the parent deletes it (copy-on-write)                                                                     |

## Decision

1. **Format is never trusted from the upload.** The audio worker's checksum check and `ffprobe`
   whitelist are mandatory gates (05 §5). The API records the declared size and SHA-256 and the
   complete step checks the size with HeadObject.
2. **Per-part integrity:** clients send `x-amz-checksum-sha256` on each part when supported; the
   whole-file SHA-256 is verified by the worker.
3. **Revocation deletes objects on the production branch, which takes effect at once.** Because
   children keep copies, `nnoo-prod` keeps **no long-lived child branches**: only break-glass
   `restore/<ts>` branches (≤ 24 h), on which the revocation ledger is replayed before any use
   (09 §6). A monitor alerts on any child of `main` older than 24 h.
4. **Expiry is ours:** a daily, trigger-safe sweep deletes `media-uploads` objects older than 7 days
   and orphan objects with no `media_asset` row; lifecycle configuration is not relied on.
5. **Backups:** Neon PITR restores Postgres but **not** bucket contents. The independent nightly copy
   of masters and consent evidence (docs/neon/09 §5) is the only file backup and is required before
   go-live; deletions from the revocation ledger are replayed in that copy within 24 h. After a
   database restore, media rows whose objects are missing (or objects without rows) are reconciled
   by the orphan sweep, never served.

## Consequences

- A database PITR restore can return rows for media whose objects no longer exist; playback then
  fails closed (404), and reconciliation marks them `purged`.
- Development and preview branches fork synthetic buckets; no production audio can reach them
  (ADR-027).

## Revisit when

Neon enforces lifecycle rules, adds point-in-time bucket restore, or changes child-branch
copy-on-write semantics.
