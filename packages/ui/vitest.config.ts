import react from '@vitejs/plugin-react'
import { defineProject } from 'vitest/config'

/**
 * @see https://vitejs.dev/config/
 * @see https://vitest.dev/guide/projects
 * @see https://github.com/vitest-dev/vitest/tree/main/examples/projects
 */
export default defineProject({
  plugins: [react()],
  test: {
    globals: false,
    environment: 'jsdom',
    setupFiles: ['./test/_setup.ts'],
  },
})
