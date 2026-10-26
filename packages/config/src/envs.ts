/** Deployment environments (ADR-027). There is deliberately no default. */
export const NNOO_ENVS = ['local', 'test', 'preview', 'staging', 'production'] as const;
export type NnooEnv = (typeof NNOO_ENVS)[number];
