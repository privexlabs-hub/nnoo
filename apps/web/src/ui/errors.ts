import type { MessageKey } from '@nnoo/i18n';
import { ApiError } from '../api/client.ts';

/** Maps an API error to calm copy. Never shows raw server text to the person. */
export function messageFor(e: unknown): MessageKey {
  if (!(e instanceof ApiError)) return 'error.generic';
  if (e.code === 'network') return 'error.network';
  if (e.status === 429) return 'error.rateLimited';
  if (e.status === 503) return 'error.unavailable';
  return 'error.generic';
}
