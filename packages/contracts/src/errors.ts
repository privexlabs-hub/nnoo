import { z } from 'zod';

/**
 * Stable error codes (02 §6, docs/neon/04 §6). Clients map each code to localised,
 * brand-voice copy in packages/i18n. Codes are never renamed; add new ones instead.
 */
export const ERROR_CODES = [
  'http.not_found',
  'http.method_not_allowed',
  'http.validation_failed',
  'http.payload_too_large',
  'http.unsupported_media_type',
  'http.idempotency_key_required',
  'http.idempotency_key_reused',
  'http.idempotency_in_progress',
  'http.rate_limited',
  'http.forbidden_origin',
  'client.upgrade_required',
  'auth.unauthenticated',
  'auth.token_invalid',
  'identity.suspended',
  'identity.session_required',
  'identity.step_up_required',
  'identity.refresh_invalid',
  'identity.refresh_reused',
  'authz.denied',
  'invariant.violation',
  'service.unavailable',
  'internal.error',
] as const;

export const ErrorCode = z.enum(ERROR_CODES);
export type ErrorCode = z.infer<typeof ErrorCode>;

/** RFC 9457 problem details. `detail` never contains SQL, stack traces or personal data. */
export const Problem = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  code: ErrorCode,
  detail: z.string().optional(),
  requestId: z.string().optional(),
  errors: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
});
export type Problem = z.infer<typeof Problem>;
