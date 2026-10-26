/**
 * Bundles each Neon Function entrypoint the way `neon deploy` does (esbuild, ESM,
 * Node 24), so CI catches bundling problems without deploying. Output: dist/<fn>/index.mjs.
 */
import { build } from 'esbuild';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const entries = { api: 'src/function.api.ts', jobs: 'src/function.jobs.ts' } as const;

for (const [name, entry] of Object.entries(entries)) {
  const outfile = `${root}dist/${name}/index.mjs`;
  const result = await build({
    entryPoints: [`${root}${entry}`],
    outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node24',
    sourcemap: 'linked', // maps stay server-side; never served to clients
    metafile: true,
    logLevel: 'warning',
    // CJS dependencies call require(); give the ESM bundle one.
    banner: {
      js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);",
    },
  });
  const kb = Math.round(statSync(outfile).size / 1024);
  console.log(`${name}: ${kb} KiB (${Object.keys(result.metafile.inputs).length} inputs)`);
}
