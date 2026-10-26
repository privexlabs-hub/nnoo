# 08 · Scalability & performance

## 1. Planning assumptions

These are *planning numbers*, not forecasts. Revise them from real metrics each quarter.

| | Year 1 | Year 3 |
|---|---|---|
| Registered learners | 50k | 500k |
| Daily active | 8k | 80k |
| Facilitators | 500 | 5k |
| Published recordings | 10k | 150k |
| Audio hours stored (masters) | 3k h (~ 1 TB FLAC) | 40k h (~ 13 TB) |
| Votes / day (peak) | 20k | 300k |
| API peak RPS | ~150 | ~1.5k |
| Audio egress / month | ~3 TB | ~40 TB |

**Conclusion:** the expensive and heavy parts are **audio egress** and **audio processing**, not API compute. Postgres on one well-sized primary plus a read replica covers year 3 if the hot paths below are designed correctly.

## 2. Performance budgets

| Path | Budget |
|---|---|
| API reads p95 | < 150 ms server time |
| API writes p95 (vote, comment) | < 300 ms |
| Today/home screen (cold, 3G-class) | < 2.5 s to interactive. Lesson audio first byte < 1 s via CDN. |
| On-device tone scoring | < 150 ms after the learner stops speaking (mid-range Android) |
| Facilitator upload of a 30 min session | resumable, survives any number of drops, ≤ 1.1× raw size overhead |
| Revocation propagation | ≤ 15 min end to end (SLA) |
| Outbox lag | p99 < 30 s |

## 3. Hot paths and how they scale

**Ikpe tallies.** Incremental counters in `ikpe_tally`, updated in the vote transaction with a row lock. Contention per case is low (votes per case per second is small). There is no `COUNT(*)` on reads. A nightly reconciliation checks the counters. If a single viral case ever contends, switch to sharded counter rows (N rows per case, summed on read). That is a localised change because only `ikpe/infrastructure` touches tallies.

**Ikpe evaluation.** The job is triggered per vote and coalesced (singleton job per case with a 2 s debounce), plus a sweep every 5 minutes over `status='open' AND (min_close_at < now OR timeout_at < now)` using a partial index.

**Archive and lesson reads.** Published content changes rarely, so:
- API responses for published, Ọha-tier lists are cacheable (`Cache-Control: private, max-age=60`, ETag).
- Umunna lists are cached per hometown scope, never globally.
- Lesson bundles are pre-built into downloadable packs (JSON + Opus) per dialect and versioned. The mobile app downloads deltas.

**Audio delivery.** Opus 32 kbps is about 14 MB per hour, roughly 10× cheaper than serving masters. The CDN serves derivatives. Masters are never served. Peaks JSON lets waveforms render without downloading audio.

**Audio processing.** A queue-driven worker pool that autoscales on queue depth. A job is idempotent by `(asset_id, step, algo_version)`. Targets are re-extracted in batches when `algo_version` bumps.

**Search.** Postgres FTS + `pg_trgm` on folded columns. Move to a dedicated search engine only if p95 > 300 ms at year-3 volumes (ADR needed).

**Feeds (Ọha).** Chronological per circle: keyset pagination on `(circle_id, created_at desc, id)`. No fan-out-on-write needed at these sizes.

## 4. Database growth

- Partition `audit_log` and `ikpe_vote_event` monthly. Detach to cold storage after 13 months.
- Index every foreign key used in a predicate. Use partial indexes for "open" states (`ikpe_case WHERE status IN ('open','paused')`, `outbox_event WHERE dispatched_at IS NULL`).
- Connection pooling (PgBouncer, transaction mode) in front of the primary. App pools stay small.
- Read replica for archive browse, search, stats and admin reports. Writes and anything in a transaction go to the primary. Never read your own write from the replica: after a write, the response carries the new state.

## 5. Scaling stages (do the next stage only when metrics say so)

1. **Launch:** 2 API instances, 1 job worker, audio workers 0–N on demand, Postgres primary + replica, CDN.
2. **Growth:** horizontal API autoscaling on CPU/RPS, a separate job-worker pool per queue class (payouts isolated from notifications), and bigger Postgres instances.
3. **Year 3+:** extract the media/audio pipeline as its own service if it dominates deploy risk or cost. This is already an isolated worker with a narrow contract, so extraction is a deployment change, not a rewrite.

## 6. Measuring before optimising

- RED metrics per route (rate, errors, duration) and USE metrics for DB/CPU.
- `pg_stat_statements` is reviewed weekly. Top 10 queries by total time get an owner.
- Real-user monitoring on web and mobile: screen load, audio start time, scoring latency, by country and network type.
- Each performance PR includes before/after numbers from the same load profile.

## 7. Cost controls

- CDN egress alerts at 80% of budget. Bucket lifecycle rules: raw upload parts expire after 7 days, revoked assets are purged, masters go to infrequent-access storage after 90 days.
- Worker autoscale floor is 0 outside peak.
- No per-request calls to paid APIs on read paths.
