// Every table the runtime can query, for Drizzle's typed API. Module boundaries are
// enforced by dependency-cruiser on imports of each module's schema file, not here.
export * from './schema.ts';
export * from '../modules/identity/infrastructure/schema.ts';
export * from '../modules/audit/infrastructure/schema.manual.ts';
