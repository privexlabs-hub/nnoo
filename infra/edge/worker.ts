/**
 * Edge proxy for api.nnoo.app (ADR-023). Deployed as a Cloudflare Worker on a domain we
 * own — NOT registered as a Neon custom domain (that would bypass this hop).
 *
 * - forwards to the `api` function's native URL (ORIGIN_URL, from `neon functions get api`)
 * - injects X-Edge-Auth (EDGE_AUTH_SECRET) and drops any client-supplied copy
 * - caps request bodies at 1 MB (uploads go straight to storage)
 * - WAF rules, bot protection on OTP routes and per-IP limits are configured on the zone
 *   (docs/neon/07 §2): OTP 5/min per IP; everything else coarse.
 * Streaming responses pass through unbuffered.
 */
export interface Env {
  ORIGIN_URL: string;
  EDGE_AUTH_SECRET: string;
}

const MAX_BODY = 1024 * 1024;
const HOP_BY_HOP = [
  'connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
  'x-edge-auth',
  'x-forwarded-host',
];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/v1/')) return new Response('Not found', { status: 404 });

    const length = Number(request.headers.get('content-length') ?? '0');
    if (length > MAX_BODY) return new Response('Payload too large', { status: 413 });

    const target = new URL(url.pathname + url.search, env.ORIGIN_URL);
    const headers = new Headers(request.headers);
    for (const h of HOP_BY_HOP) headers.delete(h);
    headers.set('x-edge-auth', env.EDGE_AUTH_SECRET);
    // Cloudflare sets CF-Connecting-IP itself; the API trusts it only because X-Edge-Auth proves this hop.

    return fetch(target, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      redirect: 'manual',
    });
  },
};
