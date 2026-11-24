import { defineConfig, devices } from '@playwright/test';

const channel = process.env.PLAYWRIGHT_CHANNEL;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    locale: 'en-US',
    timezoneId: 'America/New_York',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...(channel ? { channel } : {}),
  },
  projects: [
    {
      name: 'desktop',
      testIgnore: '**/mobile.spec.js',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      testMatch: '**/mobile.spec.js',
      use: { ...devices['iPhone 13'], browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'node tests/helpers/serve.mjs',
    url: 'http://127.0.0.1:4173',
    // Always use the test server, even if another app is running on this port.
    reuseExistingServer: false,
    timeout: 30000,
    env: { VITE_API_URL: '' },
  },
});
