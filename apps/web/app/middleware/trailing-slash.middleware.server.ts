/**
 * Middleware that redirects URLs with a trailing slash to the URL without it (e.g. `/example/` to `/example`) so
 * every page has one URL, matching its canonical URL (refer to `@workspace/seo`).
 *
 * Only GET and HEAD requests are redirected. Production uses a permanent redirect (308); other environments use a
 * temporary redirect (307) because browsers cache permanent redirects (e.g. for `localhost`).
 *
 * @module
 */

import { type MiddlewareFunction, redirect } from 'react-router'

import { stripTrailingSlashes } from '@workspace/seo'
import { envContext } from '@/context.server'

export function trailingSlashMiddleware(): MiddlewareFunction {
  return async function trailingSlashMiddleware({ request, context }, next) {
    const url = new URL(request.url)

    if ((request.method === 'GET' || request.method === 'HEAD') && url.pathname !== '/' && url.pathname.endsWith('/')) {
      // set the pathname of the request URL (vs. a path as `Location`): `//evil.com/` must not redirect to another host
      url.pathname = stripTrailingSlashes(url.pathname)

      throw redirect(url.href, context.get(envContext).ENVIRONMENT === 'production' ? 308 : 307)
    }

    return await next()
  }
}
