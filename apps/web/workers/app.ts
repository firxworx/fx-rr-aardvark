import { createRequestHandler, RouterContextProvider } from 'react-router'

import { createCspNonce } from '@workspace/core/csp'
import { cloudflareContext, nonceContext } from '@/context.server'

const requestHandler = createRequestHandler(() => import('virtual:react-router/server-build'), import.meta.env.MODE)

export default {
  fetch(request, env, ctx) {
    const nonce = createCspNonce()

    const contextProvider = new RouterContextProvider()
    contextProvider.set(cloudflareContext, { env, ctx })
    contextProvider.set(nonceContext, { nonce })

    return requestHandler(request, contextProvider)
  },
} satisfies ExportedHandler<Env>
