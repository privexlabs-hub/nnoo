// Every table the runtime can query, for Drizzle's typed API. Module boundaries are
// enforced by dependency-cruiser on imports of each module's schema file, not here.
export * from './schema.ts';
export * from './enums.ts';
export * from '../modules/community/infrastructure/schema.ts';
export * from '../modules/archive/infrastructure/schema.ts';
export * from '../modules/consent/infrastructure/schema.ts';
export * from '../modules/media/infrastructure/schema.ts';
export * from '../modules/identity/infrastructure/schema.ts';
export * from '../modules/audit/infrastructure/schema.manual.ts';
