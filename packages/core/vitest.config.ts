import { defineProject } from 'vitest/config'

/**
 * @see https://vitejs.dev/config/
 * @see https://vitest.dev/guide/projects
 * @see https://github.com/vitest-dev/vitest/tree/main/examples/projects
 */
export default defineProject({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: false,
    environment: 'jsdom',
  },
})
