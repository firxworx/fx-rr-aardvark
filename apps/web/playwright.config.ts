import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const BASE_URL = `http://localhost:${PORT}`

const isCI = Boolean(process.env.CI)

/**
 * Smoke tests run against the production build in the Workers runtime (`vite preview`) vs. the dev server
 * because the CSP, response headers, caching, and cookies differ between them.
 *
 * Requires `wrangler.jsonc` and `.dev.vars` (refer to docs/setup.md) and a browser:
 * `pnpm --filter web exec playwright install chromium`.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // always test a fresh build
    command: `pnpm run preview --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
