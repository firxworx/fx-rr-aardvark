import { renderToReadableStream } from 'react-dom/server'
import type { EntryContext, HandleErrorFunction } from 'react-router'
import { isRouteErrorResponse, type RouterContextProvider, ServerRouter } from 'react-router'
import { isbot } from 'isbot'

import { createContentSecurityPolicy, serializeContentSecurityPolicy } from '@workspace/core/csp'
import { nonceContext } from '@/context.server'
import { NonceContextProvider } from '@/lib/nonce.context'

/**
 * React Router server request handler for streaming SSR.
 *
 * @see https://reactrouter.com/how-to/security#content-security-policy
 */
export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  contextProvider: RouterContextProvider,
) {
  let shellRendered = false
  const userAgent = request.headers.get('user-agent')

  // retrieve nonce created in worker entrypoint and provided to react-router
  const { nonce } = contextProvider.get(nonceContext)

  // add content security policy (CSP) header with nonce value (refer to @workspace/core/csp for the policy)
  // mode distinguishes vite dev server vs. production builds (not cloudflare environments; see ENVIRONMENT var)
  const csp = createContentSecurityPolicy({ nonce, isDevelopment: import.meta.env.MODE === 'development' })
  responseHeaders.set('Content-Security-Policy', serializeContentSecurityPolicy(csp))

  /*
   * Note the current release of Base UI <CSPProvider> failed to handle the nonce properly
   * regardless of where it was placed in the component tree.
   *
   * As such this app avoids base-ui injected style elements by setting disableStyleElements
   * on CSPProvider in root.tsx. Any required styles are added to the global stylesheet.
   */

  const body = await renderToReadableStream(
    <NonceContextProvider nonce={nonce}>
      <ServerRouter nonce={nonce} context={routerContext} url={request.url} />
    </NonceContextProvider>,
    {
      onError(error: unknown) {
        responseStatusCode = 500
        // Log streaming rendering errors from inside the shell.  Don't log
        // errors encountered during initial shell rendering since they'll
        // reject and get logged in handleDocumentRequest.
        if (shellRendered) {
          console.error(error)
        }
      },
      nonce,
    },
  )
  shellRendered = true

  // ensure requests from bots and SPA Mode renders wait for all content to load before responding
  // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
    await body.allReady
  }

  responseHeaders.set('Content-Type', 'text/html')

  /*
   * Each document (html response) embeds a per-request CSP nonce in `<Scripts>`, `<Links>`, and the
   * `csp-nonce` meta tag (see `root.tsx`).
   *
   * A shared cache (CDN, proxy) would serve the same nonce to every visitor and enable an attacker
   * to learn it and run injected scripts.
   *
   * - `private` forbids shared caches from storing the response; the visitor's own browser may still
   *   cache it, which exposes the nonce to no other user.
   * - `set()` runs after route `headers()` exports so a route cannot turn shared caching on by mistake.
   */
  responseHeaders.set('Cache-Control', 'private')

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  })
}

/**
 * @see https://reactrouter.com/how-to/error-reporting
 */
export const handleError: HandleErrorFunction = (error, { request }) => {
  // skip logging aborted requests (expected in normal operation)
  if (request.signal.aborted) {
    return
  }

  // skip logging 404 errors (excessive bot and crawler noise)
  if (isRouteErrorResponse(error) && error.status === 404) {
    return
  }

  console.error(error instanceof Error ? error.stack : error)
}
