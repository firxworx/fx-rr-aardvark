import { defineProject } from 'vitest/config'

/**
 * Tests run in Node.js: components are rendered to static markup with `react-dom/server`.
 *
 * @see https://vitest.dev/guide/projects
 */
export default defineProject({
  test: {
    globals: false,
    environment: 'node',
  },
})
