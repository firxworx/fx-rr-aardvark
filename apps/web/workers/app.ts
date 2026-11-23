import { createRequestHandler, RouterContextProvider } from 'react-router'

import { createCspNonce } from '@workspace/core/csp'
import { applySecurityHeaders } from '@workspace/core/security-headers'
import { cloudflareContext, nonceContext } from '@/context.server'

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

    return securedResponse
  },
} satisfies ExportedHandler<Env>
