// Neon Function `jobs` (ADR-017, ADR-019): drains the outbox and job queue, runs sweeps.
import { createJobsApp } from './app.ts';
import { boot } from './platform/boot.ts';

process.env.FUNCTION_NAME ??= 'jobs';
export default createJobsApp(boot());
