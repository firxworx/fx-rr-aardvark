import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/**
 * Unit tests for code that runs in Node.js or a browser (jsdom). It does not load `vite.config.ts`: the Cloudflare and
 * React Router plugins are not used, so modules that import `cloudflare:workers` cannot be tested here.
 *
 * - `test/**\/*.test.ts` runs in Node.js
 * - `test/**\/*.test.tsx` runs in jsdom with React Testing Library (refer to `test/_setup.ts`)
 *
 * Tests live in `test/` vs. next to the code because every module in `app/routes/` is a route.
 *
 * @see https://vitest.dev/guide/projects
 */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: false,
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['test/**/*.test.ts'],
        },
      },
      {
        extends: true,
        plugins: [react()],
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          include: ['test/**/*.test.tsx'],
          setupFiles: ['./test/_setup.ts'],
        },
      },
    ],
  },
})
