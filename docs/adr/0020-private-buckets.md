# ADR-020: Private buckets, presigned URLs, CDN deferred

Status: Accepted. `access: "private"` is the documented default in neon.ts. CORS and lifecycle are not neon.ts fields: to be verified through the S3 API in Phase 1.3, with the streaming-proxy fallback if unsupported.
Date: 2026-10-25 (recorded from docs/neon/01; original text below)

**Decision.** Four private buckets: `media-uploads`, `media-masters`, `media-derivatives`, `consent-evidence`. Nothing is `public_read`.

- Uploads use presigned multipart URLs.
- Playback uses presigned GET URLs (10 min TTL) issued only after the `media.play` policy passes.
- Revocation deletes the derivative objects, so any outstanding URL stops working immediately.
- A CDN comes later, with origin authentication, when egress cost or latency metrics justify it.

⚠ Verify: private access mode, presigned GET/PUT and multipart support on the S3-compatible endpoint, bucket CORS for browser playback, and lifecycle (expiry) rules. **Fallback** if presigning isn't supported: an authenticated streaming proxy route in `api` (higher compute cost).
