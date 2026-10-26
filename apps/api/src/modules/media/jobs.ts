import type { JobHandler } from '../../platform/jobs/queue.ts';
import { purgeRecordingObjects } from './application/processing.ts';

/** media's job handlers (06 §6). Payloads carry ids; handlers re-read current state. */
export const mediaJobs: JobHandler[] = [
  {
    type: 'media.purgeObjects',
    queue: 'default',
    maxAttempts: 10,
    run: async (p, { deps }) => {
      await purgeRecordingObjects(deps, (p as { aggregateId: string }).aggregateId);
    },
    onExhausted: async (p, { deps }) => {
      deps.log.error('purge exhausted', {
        alert: true,
        page: true,
        invariant: 'INV-7',
        recording_id: (p as { aggregateId: string }).aggregateId,
      });
    },
  },
];

/** Events that leave audio unservable; the database already marked the rows (0004). */
export const mediaConsumes = {
  ConsentRevoked: ['media.purgeObjects'],
  ConsentNarrowed: ['media.purgeObjects'],
  RecordingDiscarded: ['media.purgeObjects'],
};
