import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ErrorCode, Problem } from '@nnoo/contracts';

/** A failure that is part of the contract: stable code, safe message, HTTP status. */
export class DomainError extends Error {
  override name = 'DomainError';
  constructor(
    readonly code: ErrorCode,
    readonly status: ContentfulStatusCode,
    readonly detail?: string,
    readonly errors?: { path: string; message: string }[],
    readonly headers?: Record<string, string>,
  ) {
    super(code);
  }
}

export const problem = (code: ErrorCode, status: ContentfulStatusCode, detail?: string) =>
  new DomainError(code, status, detail);

const TITLES: Partial<Record<number, string>> = {
  400: 'Bad request',
  401: 'Not signed in',
  403: 'Not allowed',
  404: 'Not found',
  409: 'Conflict',
  413: 'Payload too large',
  415: 'Unsupported media type',
  422: 'Unprocessable',
  426: 'Upgrade required',
  429: 'Too many requests',
  500: 'Something went wrong',
  503: 'Unavailable',
};

export function problemResponse(c: Context, err: DomainError): Response {
  const body: Problem = {
    type: `https://nnoo.app/problems/${err.code}`,
    title: TITLES[err.status] ?? 'Error',
    status: err.status,
    code: err.code,
    ...(err.detail ? { detail: err.detail } : {}),
    ...(err.errors ? { errors: err.errors } : {}),
    requestId: c.get('requestId'),
  };
  for (const [k, v] of Object.entries(err.headers ?? {})) c.header(k, v);
  return c.json(body, err.status, { 'Content-Type': 'application/problem+json' });
}
