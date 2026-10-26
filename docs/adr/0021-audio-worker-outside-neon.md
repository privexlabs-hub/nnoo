# ADR-021: The audio worker runs outside Neon and holds no credentials

Status: Accepted (Phase 1).
Date: 2026-10-25 (recorded from docs/neon/01; original text below)

**Context.** Transcoding and pitch extraction need Python, ffmpeg and pYIN. Neon Functions in the quickstart are TypeScript/Hono.

**Decision.** A small Python container (any container host, ideally in eu-central). It:

1. calls `POST /internal/audio/claim` on `jobs` with a short-lived service token;
2. receives a job plus **presigned** GET (raw upload) and PUT (master, derivatives, peaks) URLs;
3. processes the audio;
4. reports results to `POST /internal/audio/{jobId}/result`.

It has **no database credentials and no storage keys**. A leaked worker can only touch the objects of the jobs it has claimed.
