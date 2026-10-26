import { sql } from 'drizzle-orm';
import { createRegistry, type JobHandler } from './queue.ts';

/**
 * Phase 0 has one consumer: `PlatformPing` proves the outbox → job → handler path end
 * to end on every branch (docs/neon/10 §0.10). Modules add their handlers here as they ship.
 */
const ping: JobHandler<{ eventId: number; aggregateId: string }> = {
  type: 'platform.ping',
  queue: 'default',
  maxAttempts: 3,
  run: async (p, { db }) => {
    await db.execute(sql`
      insert into audit_log (actor_id, action, resource_type, resource_id, detail)
      values (null, 'platform.ping_handled', 'outbox_event', ${p.aggregateId}, ${JSON.stringify({ eventId: p.eventId })}::jsonb)`);
  },
};

export const registry = createRegistry([ping as JobHandler], { PlatformPing: ['platform.ping'] });
