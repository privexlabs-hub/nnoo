// Owner: audit. The table is created by migrations/0001_custom_platform.sql because it is
// partitioned (Drizzle cannot express that). This file only declares it for typed queries
// and is deliberately outside drizzle.config.ts's schema glob.
import { bigint, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const auditLog = pgTable('audit_log', {
  id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity(),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
  actorId: uuid('actor_id'),
  actorRole: text('actor_role'),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: uuid('resource_id'),
  detail: jsonb('detail'),
  requestId: text('request_id'),
});
