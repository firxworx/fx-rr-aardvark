import { defineProject } from 'vitest/config'

/**
 * @see https://vitest.dev/guide/projects
 */
export default defineProject({
  test: {
    globals: false,
    environment: 'node',
  },
})
