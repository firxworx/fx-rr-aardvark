import { createRequestHandler, RouterContextProvider } from 'react-router'

import { createCspNonce } from '@workspace/core/csp'
import { applySecurityHeaders } from '@workspace/core/security-headers'
import { configureLogging } from '@workspace/logger/configure'
import { IS_DEV_BUILD } from '@/constants'
import { cloudflareContext, nonceContext } from '@/context.server'
// validates environment variables at startup so that a deploy with invalid values fails
import { env } from '@/env.server'

configureLogging({ level: env.LOG_LEVEL, format: IS_DEV_BUILD ? 'dev' : 'json' })

const requestHandler = createRequestHandler(() => import('virtual:react-router/server-build'), import.meta.env.MODE)

export default {
  async fetch(request, env, ctx) {
    const nonce = createCspNonce()

    const contextProvider = new RouterContextProvider()
    contextProvider.set(cloudflareContext, { env, ctx })
    contextProvider.set(nonceContext, { nonce })

    const response = await requestHandler(request, contextProvider)

    // copy response because headers may be immutable (e.g. redirects)
    // static assets bypass the worker; refer to `public/_headers` for their security headers
    const securedResponse = new Response(response.body, response)
    applySecurityHeaders(securedResponse.headers)

    // keep other environments out of search indexes (crawlers that obey `robots.txt` do not crawl them at all)
    if (env.ENVIRONMENT !== 'production') {
      securedResponse.headers.set('X-Robots-Tag', 'noindex')
    }

    return securedResponse
  },
} satisfies ExportedHandler<Env>
