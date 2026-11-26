import type { SeoConfig } from '@workspace/seo'
import { APP_NAME } from '@/constants'

/**
 * Site-wide SEO values: every page uses them unless its routes set `seo` in their `handle` or loader data.
 *
 * Refer to `docs/seo.md`.
 */
export const SEO_CONFIG = {
  siteName: APP_NAME,
  defaultTitle: APP_NAME,
  titleTemplate: `%s | ${APP_NAME}`,
  defaultDescription: 'React Router SSR starter app template in a pnpm workspace.',
  // remove to omit the share image of pages that do not set one
  image: { url: '/images/og-default.png', width: 1200, height: 630, alt: APP_NAME },
  // optional: og:locale and the X (Twitter) handle of the site
  // locale: 'en_US',
  // twitterSite: '@acme',
  jsonLd: (siteUrl) => [{ '@type': 'WebSite', name: APP_NAME, url: `${siteUrl}/` }],
} satisfies SeoConfig
