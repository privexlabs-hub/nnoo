import { defineConfig } from 'drizzle-kit';

// Generation only reads the TypeScript schema; it never connects to a database.
// Applying migrations goes through scripts/migrate.ts, which checks the target
// environment and project before running anything (ADR-018, ADR-027).
// Tables that Drizzle cannot express (partitioned audit_log) live in custom SQL
// migrations and are declared for queries in *.manual.ts files, outside this glob.
export default defineConfig({
  dialect: 'postgresql',
  schema: [
    './src/platform/schema.ts',
    './src/platform/enums.ts',
    './src/modules/*/infrastructure/schema.ts',
  ],
  out: './migrations',
  schemaFilter: ['public', 'auth'],
  strict: true,
  verbose: true,
});
