import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 *
 * Two-Project Model:
 * 1. "seed" project: Runs bulk-import.spec.ts to test bulk import AND generate seed data
 * 2. "main" project: Runs all other tests using pre-seeded state (depends on seed project)
 */
export default defineConfig({
  testDir: './e2e',

  // Fail fast - stop after first failure
  // fullyParallel: false,

  // Don't run in parallel within a project (helps with timing issues)
  // workers: 1,

  // Retry failed tests once
  // retries: 1,

  // Test timeout
  timeout: 30000,

  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  // Projects configuration
  projects: [
    {
      name: 'seed',
      testMatch: /bulk-import\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'main',
      testIgnore: /bulk-import\.spec\.ts/,
      dependencies: ['seed'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Web server configuration
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
