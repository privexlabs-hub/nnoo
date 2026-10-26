/**
 * Module boundaries (02 §4, 04 §3). CI fails on any violation.
 * - modules import each other only through public.ts
 * - domain/ is pure: no infrastructure, http, application or I/O libraries
 * - packages never import apps
 * - no cycles
 */
module.exports = {
  forbidden: [
    {
      name: 'no-cross-module-internals',
      comment: 'Another module may be imported only through its public.ts',
      severity: 'error',
      from: { path: '^apps/api/src/modules/([^/]+)/' },
      to: {
        path: '^apps/api/src/modules/([^/]+)/',
        pathNot: ['^apps/api/src/modules/$1/', '^apps/api/src/modules/[^/]+/public\\.ts$'],
      },
    },
    {
      name: 'domain-is-pure',
      severity: 'error',
      from: { path: '^apps/api/src/modules/[^/]+/domain/' },
      to: {
        path: [
          '^apps/api/src/modules/[^/]+/(infrastructure|application|http|events)/',
          '^apps/api/src/platform/(db|boot|http|middleware|route|rate-limit|triggers|internal|jobs)',
          'node_modules/(pg|drizzle-orm|hono|better-auth|@aws-sdk)',
        ],
      },
    },
    {
      name: 'http-does-not-touch-infrastructure-directly',
      comment:
        'http → application → domain/infrastructure (04 §3); http may read infrastructure constants only via application',
      severity: 'warn',
      from: { path: '^apps/api/src/modules/[^/]+/http/' },
      to: { path: '^apps/api/src/modules/[^/]+/infrastructure/(repo|storage)' },
    },
    {
      name: 'packages-do-not-import-apps',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^apps/' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true, viaOnly: { pathNot: ['\\.d\\.ts$'] } },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: ['node_modules', 'dist', 'docs', '\\.claude'] },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
};
