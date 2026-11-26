import { env as cloudflareEnv } from 'cloudflare:workers'
import { createRequestHandler, RouterContextProvider } from 'react-router'

import { createCspNonce } from '@workspace/core/csp'
import { applySecurityHeaders } from '@workspace/core/security-headers'
import { configureLogging } from '@workspace/logger/configure'
import { IS_DEV_BUILD } from '@/constants'
import { cloudflareContext, envContext, nonceContext } from '@/context.server'
import { parseEnv } from '@/env.server'

// validate environment variables at startup: a deploy with invalid values fails (error 10021)
// only the log level is kept: it applies until the isolate is replaced, so a change to LOG_LEVEL may not apply to every
// request at once
const { LOG_LEVEL } = parseEnv(cloudflareEnv)

configureLogging({ level: LOG_LEVEL, format: IS_DEV_BUILD ? 'dev' : 'json' })

const requestHandler = createRequestHandler(() => import('virtual:react-router/server-build'), import.meta.env.MODE)

export default {
  async fetch(request, env, ctx) {
    const nonce = createCspNonce()

    const contextProvider = new RouterContextProvider()
    contextProvider.set(cloudflareContext, { env, ctx })
    // parsed for each request so that a changed secret or variable applies (validation takes a few microseconds)
    contextProvider.set(envContext, parseEnv(env))
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
