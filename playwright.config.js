import { defineConfig, devices } from '@playwright/test'

// Browser tests run against the production build (vite build + vite preview) and an API server
// backed by a throwaway in-memory Postgres (PULSEFIT_LOCAL_DB=memory://). Real data is never touched.
const API_PORT = 3101
const WEB_PORT = 4173

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e-results.json' }]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
    // iPhone-size screen (375 px wide) rendered by Chromium
    { name: 'mobile-iphone', use: { ...devices['iPhone X'], defaultBrowserType: 'chromium' } },
  ],
  webServer: [
    {
      command: 'node server/dev.js',
      url: `http://localhost:${API_PORT}/api/stats`,
      env: { PULSEFIT_LOCAL_DB: 'memory://', API_PORT: String(API_PORT) },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npx vite build && npx vite preview --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      env: { API_PORT: String(API_PORT) },
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
})
