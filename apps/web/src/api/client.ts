import { Problem } from '@nnoo/contracts';
import type { z } from 'zod';

/** The edge URL of the API in deployed builds; empty locally (the dev server proxies /v1). */
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const CLIENT = `web/${import.meta.env.VITE_APP_VERSION ?? '0.0.0'}`;

/** An RFC 9457 problem from the API, or a network failure (`code: 'network'`). */
export class ApiError extends Error {
  override name = 'ApiError';
  constructor(
    readonly status: number,
    readonly code: string,
    detail?: string,
  ) {
    super(detail ?? code);
  }
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  json?: unknown;
  headers?: Record<string, string>;
  /** Commands the server declares idempotent need a key; one per user intent, reused on retry. */
  idempotencyKey?: string;
  signal?: AbortSignal;
};

/** One HTTP call. Cookies travel (the refresh cookie and the sign-in ceremony are httpOnly). */
export async function http(path: string, opts: RequestOptions = {}): Promise<Response> {
  const headers: Record<string, string> = { 'x-client': CLIENT, ...opts.headers };
  if (opts.json !== undefined) headers['content-type'] = 'application/json';
  if (opts.idempotencyKey) headers['idempotency-key'] = opts.idempotencyKey;
  try {
    return await fetch(`${BASE}${path}`, {
      method: opts.method ?? (opts.json !== undefined ? 'POST' : 'GET'),
      headers,
      credentials: 'include',
      body: opts.json !== undefined ? JSON.stringify(opts.json) : undefined,
      signal: opts.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new ApiError(0, 'network');
  }
}

/** Turns a non-2xx response into an ApiError, reading the problem body when there is one. */
export async function toError(res: Response): Promise<ApiError> {
  const body: unknown = await res.json().catch(() => null);
  const p = Problem.safeParse(body);
  if (p.success) return new ApiError(res.status, p.data.code, p.data.detail);
  // Better Auth ceremonies answer with their own error shape: keep only a code-like string.
  const code =
    body && typeof body === 'object' && 'code' in body && typeof body.code === 'string'
      ? `auth.${body.code.toLowerCase()}`
      : `http.${res.status}`;
  return new ApiError(res.status, code);
}

/** Parses a 2xx body with the contract's schema: a shape the client does not expect is a bug. */
export async function parse<S extends z.ZodType>(res: Response, schema: S): Promise<z.infer<S>> {
  if (!res.ok) throw await toError(res);
  return schema.parse(await res.json());
}
