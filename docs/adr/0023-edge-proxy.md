# ADR-023: Edge proxy in front of the functions

Status: Accepted. The `X-Edge-Auth` check is implemented and verified live (raw function URL answers 404 on /v1 without it). The Cloudflare Worker (infra/edge) is written but not deployed: needs a Cloudflare account.
Date: 2026-10-25 (recorded from docs/neon/01; original text below)

**Decision.** `api.nnoo.app` goes through an edge proxy (e.g. Cloudflare) to the `api` function URL. The edge provides TLS, WAF, bot protection on OTP routes and coarse rate limits. It also injects a secret header `X-Edge-Auth` that `api` requires on every `/v1` route, so the raw function URL can't be used to bypass the edge.

The `jobs` function is not behind the edge. Its endpoints are trigger-safe (06 §5) or need service tokens.
