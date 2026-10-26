import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

// Hermetic: a throwaway Postgres container behind the real API, and the Vite dev server whose
// proxy adds the edge header like the edge Worker does. Never Neon, never production.
export const INBOX = fileURLToPath(new URL('../../.local/e2e-inbox.jsonl', import.meta.url));
const API_PORT = 8788;
const WEB = 'http://localhost:5174';
// Read in the main process only, where the web servers are started.
const edgeSecret = process.env.E2E_EDGE_SECRET ?? randomBytes(32).toString('base64url');

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: WEB, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm --filter @nnoo/api e2e:server',
      port: API_PORT,
      timeout: 240_000,
      reuseExistingServer: false,
      env: {
        E2E_INBOX: INBOX,
        E2E_EDGE_SECRET: edgeSecret,
        E2E_API_PORT: String(API_PORT),
        E2E_WEB_ORIGIN: WEB,
      },
      stdout: 'pipe',
    },
    {
      command: 'pnpm exec vite --port 5174 --strictPort',
      url: WEB,
      timeout: 60_000,
      reuseExistingServer: false,
      env: {
        API_PROXY_TARGET: `http://localhost:${API_PORT}`,
        EDGE_AUTH_SECRETS: edgeSecret,
        VITE_API_URL: '',
      },
    },
  ],
});
