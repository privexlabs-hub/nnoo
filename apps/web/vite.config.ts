import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

/**
 * Locally the browser calls /v1 on its own origin and this dev server forwards it to the API,
 * adding X-Edge-Auth the way the edge Worker does in deployed environments (ADR-023).
 * The secret is read here, in Node, and is never part of the bundle: only VITE_* reaches it.
 */
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, '../..', ''), ...process.env };
  const target = env.API_PROXY_TARGET ?? 'http://localhost:8787';
  const edgeSecret = env.EDGE_AUTH_SECRETS?.split(',')[0];
  return {
    plugins: [react()],
    envDir: '../..',
    envPrefix: 'VITE_',
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/v1': {
          target,
          changeOrigin: true,
          headers: edgeSecret ? { 'x-edge-auth': edgeSecret } : {},
        },
      },
    },
    build: { sourcemap: true },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}'],
      setupFiles: ['src/test-setup.ts'],
    },
  };
});
