import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          environment: 'node',
          globalSetup: ['tests/integration/global-setup.ts'],
          testTimeout: 120_000, // remote Neon test branches add latency; Testcontainers is much faster
          hookTimeout: 120_000,
          // One Postgres container per run; files share it but each test isolates its own data.
          fileParallelism: false,
        },
      },
    ],
  },
});
