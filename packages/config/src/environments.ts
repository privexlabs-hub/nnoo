import topology from '../../../infra/environments.json' with { type: 'json' };
import type { NnooEnv } from './envs.ts';

/**
 * Neon topology guard (ADR-027). Development and production are separate Neon
 * projects. Anything that is not `production` must never hold a production
 * database host, and production must never point at the dev project.
 */
export type Topology = {
  dev: { neonProjectId: string; envs: readonly string[] };
  prod: { neonProjectId: string | null; envs: readonly string[]; dbHostMarkers: readonly string[] };
};

export const environments = topology as unknown as Topology;

export class TopologyError extends Error {
  override name = 'TopologyError';
}

export function expectedProjectId(env: NnooEnv): string | null {
  return env === 'production' ? environments.prod.neonProjectId : environments.dev.neonProjectId;
}

function host(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export function assertNotProductionDatabase(
  env: NnooEnv,
  databaseUrl: string,
  topo: Topology = environments,
): void {
  if (env === 'production') return;
  const h = host(databaseUrl);
  const hit = topo.prod.dbHostMarkers.find((m) => m && h.includes(m));
  if (hit) {
    throw new TopologyError(
      `BOOT: NNOO_ENV=${env} is configured with a production database host. Refusing to start.`,
    );
  }
}

/**
 * Used by migration and deploy scripts, which can learn the target project id
 * from `.neon` or the Neon API. A mismatch aborts before any change is made.
 */
export function assertProjectMatchesEnv(
  env: NnooEnv,
  projectId: string | undefined,
  topo: Topology = environments,
): void {
  const expected = env === 'production' ? topo.prod.neonProjectId : topo.dev.neonProjectId;
  if (!expected) {
    throw new TopologyError(
      `No Neon project is registered for NNOO_ENV=${env} in infra/environments.json.`,
    );
  }
  if (projectId !== expected) {
    throw new TopologyError(
      `Neon project "${projectId ?? 'unknown'}" does not match NNOO_ENV=${env} (expected ${expected}).`,
    );
  }
}
