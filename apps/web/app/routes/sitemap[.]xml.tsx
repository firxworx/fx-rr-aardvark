import type { Route } from './+types/sitemap[.]xml'

import { SITEMAP_INCLUDE_PATHS } from '@/constants'
import { envContext } from '@/context.server'

// 1 hour cache (crawlers do not need a fresher sitemap for static pages)
const CACHE_CONTROL = 'public, max-age=3600'

/**
 * Resolve a pathname against the site origin with trailing slashes stripped (root keeps its '/').
 */
export function getCanonicalUrl(origin: string, pathname: string): string {
  return new URL(pathname.replace(/\/+$/, '') || '/', origin).href
}

/**
 * Resource route for `/sitemap.xml` (wired declaratively in `routes.ts`, outside the root layout).
 */
export function loader({ context }: Route.LoaderArgs): Response {
  const { SITE_URL } = context.get(envContext)
  const urls = SITEMAP_INCLUDE_PATHS.map((path) => `  <url><loc>${getCanonicalUrl(SITE_URL, path)}</loc></url>`)
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n')

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': CACHE_CONTROL,
    },
  })
}
