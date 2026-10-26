# 05 · Storage & media pipeline

## 1. Buckets

| Bucket | Contents | Written by | Read by | Lifecycle |
|---|---|---|---|---|
| `media-uploads` | raw multipart uploads from facilitators (untrusted) | device (presigned PUT) | audio worker (presigned GET) | expire after 7 days |
| `media-masters` | validated FLAC masters | audio worker (presigned PUT) | audio worker (re-extraction) | keep. Deleted on revocation (§6). |
| `media-derivatives` | Opus, AAC, peaks JSON | audio worker | learners (presigned GET after policy) | deleted on revocation/unpublish |
| `consent-evidence` | spoken consent statements, photographed forms | device | custodian panels and facilitator only, audited | life of the consent + 7 years |

All buckets are private. Object keys are opaque: `<kind>/<uuidv7>` (no names, hometowns or titles in keys).

## 2. Presigning helper

The quickstart installs the AWS SDK presigners alongside the Files SDK. We use the S3 client directly against the injected `AWS_ENDPOINT_URL_S3`.

```typescript
// apps/api/src/modules/media/infrastructure/storage.ts
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand,
         CompleteMultipartUploadCommand, GetObjectCommand, PutObjectCommand,
         DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@nnoo/config/env';

export const s3 = new S3Client({
  region: env.AWS_REGION,
  endpoint: env.AWS_ENDPOINT_URL_S3,
  forcePathStyle: true,                // ⚠ Verify addressing style for Neon storage
});

export const presignGet = (bucket: string, key: string, seconds = 600) =>
  getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: seconds });

export const presignPut = (bucket: string, key: string, contentType: string, seconds = 900) =>
  getSignedUrl(s3, new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), { expiresIn: seconds });

export const presignPart = (bucket: string, key: string, uploadId: string, partNumber: number) =>
  getSignedUrl(s3, new UploadPartCommand({ Bucket: bucket, Key: key, UploadId: uploadId, PartNumber: partNumber }), { expiresIn: 3600 });
```

The Files SDK (`files-sdk/neon`) is fine for simple server-side puts, such as the partition archive exports. Device uploads and playback use presigned URLs.

## 3. Upload flow (offline-first facilitator)

```
Tablet (offline)                         api                          storage / jobs
──────────────────                       ───                          ──────────────
create recording + consent locally
record consent statement, then session
          … later, online …
POST /v1/recordings        (Idem: rec id) ──► archive: draft row
POST /v1/consents          (Idem: consent id) ► consent row (tier, allow_machine_assist)
POST /v1/uploads {recordingId, kind, bytes, sha256}
                                          ──► policy media.upload (tier≠nso, consent active, draft, own)
                                              media_asset(status=pending)
                                              CreateMultipartUpload(media-uploads, key)
                          ◄── {uploadId, partUrls[1..n], partSize} (refreshable)
PUT parts directly to storage (resumable, retry per part) ─────────────────────────► media-uploads
POST /v1/uploads/{id}/complete {parts[{n, etag}]}
                                          ──► CompleteMultipartUpload; HeadObject (size)
                                              media_asset(status=uploaded); outbox MediaUploaded
                                              job audio.process(asset)            ──► jobs
                                                                                   storage_object_created
                                                                                   trigger → backstop (§4)
```

- **Part size:** 8 MiB. **Resume:** the device asks `GET /v1/uploads/{id}` to find out which parts are done (`ListParts`), then asks for fresh URLs for the missing ones.
- **Integrity:** the device sends SHA-256 of the whole file. The audio worker recomputes it from the object and fails the job on mismatch (the asset becomes `rejected`, and the facilitator sees "The recording didn't arrive whole. Would you send it once more?").
- **Consent evidence** uses the same flow into `consent-evidence`, and **must complete before** the session audio can be marked `uploaded` (policy check in `complete`).

## 4. Upload trigger (backstop and guard)

```typescript
// /internal/storage/upload-created   (storage_object_created on media-uploads)
app.post('/internal/storage/upload-created', triggerSafe(async (c, { data }) => {
  const { bucket_name, object_key } = data;
  const asset = await media.findByStorageKey(object_key);

  if (!asset) {                                   // object with no record → quarantine
    await media.quarantine(bucket_name, object_key, 'orphan');   // delete + audit + alert
    return;
  }
  if (await archive.tierOf(asset.recordingId) === 'nso') {        // INV-2 defence in depth
    await media.purgeNow(asset, 'INV-2');
    await alert.page('INV-2 upload attempt', { assetId: asset.id });
    return;
  }
  if (asset.status === 'pending') {
    // device crashed after the last part but before /complete: finish server-side
    await media.completeFromStorage(asset);        // idempotent; enqueues audio.process once
  }
}));
```

The handler is idempotent and only reconciles state that already exists, so a spoofed call does nothing harmful (06 §5).

## 5. Audio worker contract (ADR-021)

```
POST /internal/audio/claim            Authorization: Bearer <service token, 15 min, jti tracked>
  ◄── { jobId, step: 'process'|'reextract', assetId,
        input:  { getUrl },                                  // media-uploads or media-masters
        output: { masterPutUrl, opusPutUrl, aacPutUrl, peaksPutUrl },
        expect: { sha256, maxDurationMs },
        params: { loudnessLufs: -18, opusKbps: 32, aacKbps: 64, pitch: { hopMs: 10, algo: 'pyin@1' } } }

POST /internal/audio/{jobId}/result
  { status: 'ok'|'rejected', sha256, durationMs, format, lufs,
    toneTargets?: [{ startMs, endMs, contour: number[], syllables: [...] }], algoVersion }
```

- `jobs` creates the service token when it hands out a claim and revokes it on result or timeout. A worker can't reuse it for another job.
- Worker steps: verify the hash → `ffprobe` format whitelist (wav, flac, m4a/aac, opus) → reject anything else → transcode to FLAC master → loudness-normalise → Opus and AAC → peaks JSON (fixed 800 points) → optional pitch targets for tagged word segments → PUT the outputs → POST the result.
- On `ok`, `media.derivativesReady` (in `jobs`) inserts `media_asset` rows for the outputs (`ready`), deletes the raw object from `media-uploads`, and emits `DerivativesReady`.
- Retries: the job's `max_attempts = 5` with exponential backoff, then `needs_attention` and the facilitator sees "Preparing audio is taking longer than usual."

## 6. Playback and revocation

```typescript
// GET /v1/media/:id/play  → { url, expiresAt, mime }
route(app, {
  method: 'GET', path: '/v1/media/:id/play', response: contracts.media.PlayView,
  policy: 'media.play', rateLimit: 'media',
  handler: async (ctx, { id }) => {
    const a = await media.loadPlayable(ctx.actor, id);    // scope predicate + tier + consent + published
    await media.logIssuance(ctx.actor, a);                 // feeds the INV-3 monitor
    return { url: await presignGet('media-derivatives', a.storageKey, 600),
             expiresAt: new Date(Date.now() + 600_000).toISOString(), mime: a.mime };
  },
});
```

**Revocation** (`engineering-docs/02 §5.4`). The transaction commits, then:
1. job `media.purge(recording)` deletes **every** derivative object right away. Outstanding presigned URLs fail from then on, because the object is gone.
2. The master is deleted within 24 h, unless the elder chose private archiving. In that case it is copied to `cold-private` (if adopted) and deleted from `media-masters`.
3. Clients receive revocation hints at their next sync. Their cached copies are deleted.
4. The `revocation-sla` trigger (every 5 min) runs `HeadObject` on every derivative key of recordings revoked in the last 24 h. Any `200` older than 15 min pages the on-call (INV-7).

## 7. Lesson packs

`learning.buildPack(dialect)` (a job) writes a versioned JSON manifest plus references to Opus derivatives. The pack contains **asset ids, not URLs**. The device requests a batch of presigned URLs (`POST /v1/media/play-batch`, max 50, the same policy per item) when it downloads or refreshes a pack. Revoked items arrive as tombstones in the next manifest.

## 8. Costs and limits

- Opus 32 kbps ≈ 14 MB per audio hour served. Masters are never served.
- Watch storage size and egress per bucket. Alert at 80% of the monthly budget. ⚠ Verify Neon Object Storage pricing, egress and request limits for the plan.
- If egress or latency exceeds budget, put a CDN in front of `media-derivatives` with origin authentication and **signed CDN URLs**, keeping the same `media.play` policy. Record it as an ADR.
