import type { Config } from '@react-router/dev/config'

/**
 * React Router v8+ framework mode (SSR) configuration.
 *
 * @see https://reactrouter.com/changelog
 * @see https://reactrouter.com/upgrading/future
 * @see https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity
 */
export default {
  ssr: true,
  splitRouteModules: true,
  subResourceIntegrity: false,
  future: {
    unstable_optimizeDeps: true,
  },
} satisfies Config
