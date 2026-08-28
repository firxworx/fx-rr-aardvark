import { renderToReadableStream } from 'react-dom/server'
import type { EntryContext, HandleErrorFunction } from 'react-router'
import { isRouteErrorResponse, type RouterContextProvider, ServerRouter } from 'react-router'
import { isbot } from 'isbot'

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

  // add a basic content security policy (CSP) header with noncec value for inline scripts
  // larger example: https://gist.github.com/wenzf/cf43d7adade3110e16ca8b1931c9afa5/503eb48cd38f206a1d43ecfb6a67f45bbcbe2e41
  responseHeaders.set('Content-Security-Policy', `script-src 'self' 'nonce-${nonce}' 'strict-dynamic';`)

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

  // remember that headers may also be set via hono prior to react-router handling the request
  responseHeaders.set('Content-Type', 'text/html')
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
