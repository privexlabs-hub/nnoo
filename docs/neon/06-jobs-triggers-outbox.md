# 06 · Jobs, triggers & outbox

## 1. Model

```
state change ──(same tx)──► outbox_event
                                │  dispatcher (kick after commit + every minute)
                                ▼
                        job rows (one per consumer)   e.g. IkpeCasePassed →
                                │                        payments.createObligation
                                │                        notify.casePassed
                                │                        learning.recordingPublished
                                ▼
                   jobs function drains (SKIP LOCKED) → module application services
```

The outbox makes side effects durable and atomic with the change. The job table makes them retryable and independently failing: one handler failing doesn't block the others.

## 2. Job table

```sql
CREATE TABLE job (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  queue        text NOT NULL,                 -- 'default' | 'payments' | 'notify' | 'audio' | 'ikpe'
  type         text NOT NULL,                 -- 'payments.createObligation', ...
  dedupe_key   text,                          -- e.g. 'ikpe.evaluate:<caseId>' or '<eventId>:<handler>'
  payload      jsonb NOT NULL,
  run_at       timestamptz NOT NULL DEFAULT now(),
  attempts     int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 8,
  locked_until timestamptz,
  last_error   text,
  done_at      timestamptz,
  failed_at    timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX job_dedupe_open ON job(dedupe_key) WHERE done_at IS NULL AND failed_at IS NULL;
CREATE INDEX job_ready ON job(queue, run_at) WHERE done_at IS NULL AND failed_at IS NULL;
```

**Claim** (one statement, safe with concurrent drains):

```sql
UPDATE job SET locked_until = now() + interval '2 minutes', attempts = attempts + 1
WHERE id IN (
  SELECT id FROM job
  WHERE queue = $1 AND done_at IS NULL AND failed_at IS NULL
    AND run_at <= now() AND (locked_until IS NULL OR locked_until < now())
  ORDER BY run_at
  LIMIT $2
  FOR UPDATE SKIP LOCKED)
RETURNING *;
```

- **Success** → `done_at = now()`.
- **Retryable error** → `run_at = now() + backoff(attempts)`, `locked_until = null`, `last_error`.
- **`attempts >= max_attempts`** → `failed_at` + the module's `onExhausted` handler, e.g. payout → `needs_attention`.
- **Debounce** (`ikpe.evaluate`): insert with `dedupe_key` and `ON CONFLICT DO NOTHING`, `run_at = now() + 2s`.

## 3. Drain endpoint

```typescript
app.post(
  '/internal/jobs/drain',
  triggerSafe(async () => {
    const deadline = Date.now() + 45_000; // finish well inside a minute
    await outbox.dispatch({ limit: 500 }); // outbox → job rows
    for (const q of ['ikpe', 'payments', 'notify', 'default']) {
      // priority order
      while (Date.now() < deadline) {
        const batch = await jobs.claim(q, 20);
        if (batch.length === 0) break;
        await Promise.allSettled(batch.map(runJob)); // each runJob: handler + mark done/retry
      }
    }
  }),
);
```

`queue = 'audio'` is **not** drained here. The external audio worker claims those jobs (05 §5).

**Kick after commit** (ADR-019). The `api` function calls `void dispatchSoon()` after a successful transaction that wrote an outbox row. It runs a bounded `outbox.dispatch` + `jobs.claim('ikpe', 5)` in-process. If the runtime drops the promise, the minute trigger catches up. Nothing depends on the kick for correctness.

## 4. Schedule triggers (all point at `jobs`)

| Trigger             | Cron (UTC)     | Path                           | Does                                                                                                                 | Idempotency                                   |
| ------------------- | -------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `jobs-drain`        | `* * * * *`    | `/internal/jobs/drain`         | outbox dispatch, job drain                                                                                           | claims are atomic                             |
| `ikpe-sweep`        | `*/5 * * * *`  | `/internal/ikpe/sweep`         | enqueue `ikpe.evaluate` for open cases past `min_close_at + paused_total` or `timeout_at`; expire panels past 7 days | dedupe keys                                   |
| `revocation-sla`    | `*/5 * * * *`  | `/internal/consent/sla-check`  | HEAD derivatives of recent revocations; page on any reachable at > 15 min                                            | read-only                                     |
| `invariants`        | `*/10 * * * *` | `/internal/invariants/check`   | INV-1/2/3/4/11 checks, tally drift sample                                                                            | read-only, alerts deduped                     |
| `nightly-reconcile` | `0 2 * * *`    | `/internal/reconcile`          | full tally recompute vs counters, `recording.tier` vs active consent, payouts vs provider                            | report + alert, never silent repair of votes  |
| `nightly-stats`     | `30 2 * * *`   | `/internal/stats/hometowns`    | `verified_active_kin` snapshot, bootstrap-mode flags                                                                 | upsert per day                                |
| `partitions`        | `0 3 25 * *`   | `/internal/db/partitions`      | create next partitions, archive old ones                                                                             | checks catalog first                          |
| `gloss-coverage`    | `0 4 * * *`    | `/internal/i18n/coverage`      | language-pair coverage report                                                                                        | upsert per day                                |
| `branch-hygiene`    | `0 5 * * *`    | `/internal/ops/branch-hygiene` | list `dev/*`/`preview/*` branches older than policy and request deletion                                             | main only, ⚠ Verify the Neon API scope needed |

Calendar note: crons are UTC. Anything "per day" in product terms (daily ilu, market day) is computed in code from `Africa/Lagos` time, not from the trigger time.

## 5. Trigger-endpoint safety

The quickstart checks that `X-Neon-Trigger-Invocation-Id` is present. That shows intent but **does not prove** Neon sent the request, because anyone can send the header to a public function URL. So every `/internal/*` trigger endpoint must satisfy all of the following:

1. **Safe by construction:** it only performs work the system would perform anyway at that moment: sweeps, reconciling existing state, draining due jobs. It never accepts a payload that grants, publishes, pays or deletes on its own say-so. Storage handlers look up the object and re-derive everything from DB state.
2. **Idempotent:** the invocation id is recorded in `trigger_invocation`. A duplicate returns `200 {duplicate:true}`.
3. **Bounded:** time and row budgets per call, so a flood of calls can't amplify load beyond what the claim queries allow.
4. **Rate-limited:** at most N calls per minute per path. Excess calls → `429`.
5. **Stronger origin auth if available:** ⚠ Verify whether Neon Functions authentication (JWT/API key) can be applied to trigger invocations, and enable it.

```typescript
export const triggerSafe =
  (fn: (c: Ctx, body: any) => Promise<void>) => async (c: Context<AppEnv>) => {
    const inv = c.req.header('x-neon-trigger-invocation-id');
    if (!inv) return c.json({ error: 'not a trigger call' }, 403);
    if (!(await triggerLimiter.allow(c.req.path))) return c.json({ error: 'rate limited' }, 429);
    if (!(await triggerInvocations.record(inv, c.req.path))) return c.json({ duplicate: true });
    await fn(c, await c.req.json().catch(() => ({})));
    return c.json({ ok: true });
  };
```

Service endpoints (`/internal/audio/*`) are different: they require a signed service token (05 §5) and never accept trigger headers as authorisation.

## 6. Outbox details

- `outbox_event(id, type, aggregate_id, payload, created_at, dispatched_at)`. See `docs/03`.
- The dispatcher maps `type` to its consumer handlers from each module's manifest (`consumes: [...]`) and inserts one job per consumer with `dedupe_key = '<eventId>:<handler>'`. Then it sets `dispatched_at`. All of that happens in one transaction.
- Event payloads carry ids, not data snapshots. Handlers re-read current state, so a late handler never acts on a stale or revoked recording.
- Ordering is guaranteed per aggregate only where a handler needs it. The handler checks the aggregate version and re-enqueues if it is early.

## 7. Monitoring

| Metric                                                      | Alert                              |
| ----------------------------------------------------------- | ---------------------------------- |
| oldest undispatched outbox row age                          | > 2 min                            |
| job queue depth per queue                                   | > 1,000 for 10 min                 |
| jobs `failed_at` in the last hour                           | any in `payments`; > 10 in others  |
| trigger calls without a matching schedule (spoof indicator) | any                                |
| drain duration                                              | > 50 s (approaching the next tick) |
