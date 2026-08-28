import { reactRouter } from '@react-router/dev/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type UserConfig } from 'vite'

/**
 * Vite configuration for react-router on Cloudflare Workers.
 *
 * Local wrangler state is persisted to workspace root to support shared resources
 * such as D1 databases across multiple apps in the workspace.
 *
 * LightningCSS is used vs. default postcss because it handles css in comments better
 * and appears to have better support for complex tailwind selectors.
 */
export default defineConfig(
  (): UserConfig => ({
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      port: 5173,
      strictPort: true,
      // hmr: true
    },
    plugins: [
      cloudflare({
        viteEnvironment: { name: 'ssr' },
        persistState: { path: '../../.wrangler/state' },
      }),
      tailwindcss(),
      reactRouter(),
    ],
    build: {
      minify: true,
    },
    // ssr: { noExternal: [] },
    // optimizeDeps: { include: [] },
  }),
)
