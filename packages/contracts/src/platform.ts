import { z } from 'zod';

export const HealthView = z.object({
  status: z.literal('ok'),
  function: z.enum(['api', 'jobs']),
  env: z.enum(['local', 'test', 'preview', 'staging', 'production']),
  time: z.string().datetime(),
});
export type HealthView = z.infer<typeof HealthView>;
