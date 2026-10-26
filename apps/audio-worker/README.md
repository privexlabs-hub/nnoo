# Audio worker

Python 3.12 + ffmpeg. Claims `audio.process` jobs from the `jobs` function and produces, per
recording: a lossless **FLAC master** (never loudness-changed), **Opus 32 kbps** and **AAC 64 kbps**
listening copies normalised to −18 LUFS, and **800-point waveform peaks** (docs/neon/05 §5).

It holds **no database or storage credentials** (ADR-021): `NNOO_JOBS_URL` + `AUDIO_WORKER_KEY` only;
inputs and outputs are presigned URLs valid for one job. Rejections (hash mismatch, format not
allowed, unreadable, too long, silent) are reported; transient failures are not, so the claim
expires and the job is retried (at most 5 attempts).

```bash
docker build -t nnoo-audio-worker apps/audio-worker
docker run --rm nnoo-audio-worker python -m pytest -q          # unit + ffmpeg tests
docker run --rm -e NNOO_JOBS_URL=https://<jobs-url> -e AUDIO_WORKER_KEY=… nnoo-audio-worker
```

Pitch targets (pYIN) arrive in Phase 3 (`reextract` step).
