// Neon Function `api` (ADR-017). Env is validated at module load: a bad config crashes the boot.
import { createApiApp } from './app.ts';
import { boot } from './platform/boot.ts';

process.env.FUNCTION_NAME ??= 'api';
export default createApiApp(boot());
