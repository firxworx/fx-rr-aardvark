import type { Route } from './+types/robots[.]txt'

import { IS_PROD_BUILD } from '@/constants'
import { envContext } from '@/context.server'

// set 1 hour as crawlers do not require fresher robots rules
const CACHE_CONTROL = 'public, max-age=3600'

/**
 * Resource route for `/robots.txt` (wired declaratively in `routes.ts`, outside the root layout).
 * Non-production builds/environments disallow everything to stay out of search indexes.
 */
export function loader({ context }: Route.LoaderArgs): Response {
  const env = context.get(envContext)
  const lines =
    env.ENVIRONMENT === 'production' && IS_PROD_BUILD
      ? ['User-agent: *', 'Allow: /', 'Disallow: /actions/', '', `Sitemap: ${env.SITE_URL}/sitemap.xml`]
      : ['User-agent: *', 'Disallow: /']

  return new Response(`${lines.join('\n')}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': CACHE_CONTROL,
    },
  })
}
