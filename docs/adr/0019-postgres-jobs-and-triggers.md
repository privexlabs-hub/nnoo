# ADR-019: Jobs and outbox in Postgres, drained by schedule triggers (supersedes pg-boss)

Status: Accepted. Verified 2026-10-25: `waitUntil` exists in @neon/functions (background work up to 15 min after the response), so the post-commit kick is supported; cron cadence is reduced off production (ADR-027).
Date: 2026-10-25 (recorded from docs/neon/01; original text below)

**Context.** Functions scale to zero, so a permanently polling worker loop is the wrong shape. Function Triggers can call a function on a cron schedule or on storage events, even from zero.

**Decision.**

- A `job` table claimed with `FOR UPDATE SKIP LOCKED`, and the existing `outbox_event` table (03 §6, 06).
- The schedule trigger `jobs-drain` runs every minute and drains both within a time budget.
- After a commit, the `api` function also **kicks** the dispatcher in-process, so typical latency is seconds. ⚠ Verify that background promises survive after the response in the Neon Functions runtime. If not, the minute trigger is the only path, and the outbox-lag SLO becomes p99 < 90 s.
