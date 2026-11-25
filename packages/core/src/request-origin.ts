/**
 * Request origin helpers to protect against cross-site request forgery (CSRF) and open redirects.
 *
 * React Router verifies the `Origin` of document and `.data` (single fetch) requests that call an action
 * but not of requests to resource routes (routes that do not export a component).
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site
 * @see https://pkg.go.dev/net/http#CrossOriginProtection (basis for the checks)
 * @see https://words.filippo.io/csrf/
 *
 * @module
 */

/** Safe methods per RFC 9110 except `TRACE` which the Fetch standard forbids (and react-router does not support). */
const SAFE_METHODS: readonly string[] = ['GET', 'HEAD', 'OPTIONS']

const HTTP_PROTOCOLS: readonly string[] = ['http:', 'https:']

/**
 * Determine if the request is a cross-origin request from a browser with a method that may change state.
 *
 * - `Sec-Fetch-Site` is decisive when present (all current browsers; https and localhost only). Sibling
 *   subdomains (`same-site`) are considered cross-origin.
 * - Otherwise the `Origin` host is compared to the request host. The scheme is not compared so the check works
 *   behind a TLS-terminating proxy or tunnel. An opaque origin (`null`) is considered cross-origin.
 * - Requests with neither header are not from a browser (e.g. webhooks, API clients) so CSRF does not apply.
 */
export function isCrossOriginWrite(request: Request): boolean {
  if (SAFE_METHODS.includes(request.method)) {
    return false
  }

  const fetchSite = request.headers.get('Sec-Fetch-Site')

  if (fetchSite !== null) {
    return fetchSite !== 'same-origin' && fetchSite !== 'none'
  }

  const origin = request.headers.get('Origin')

  if (origin === null) {
    return false
  }

  return !URL.canParse(origin) || new URL(origin).host !== new URL(request.url).host
}

/**
 * Get the URL of the page that sent the request if it is on the same host; else `undefined`.
 *
 * Redirect to the complete URL (`href`): a path that starts with `//` is an open redirect when used on its own.
 */
export function getSameHostReferrer(request: Request): URL | undefined {
  const referrer = request.headers.get('Referer')

  if (referrer === null || !URL.canParse(referrer)) {
    return undefined
  }

  const url = new URL(referrer)

  return HTTP_PROTOCOLS.includes(url.protocol) && url.host === new URL(request.url).host ? url : undefined
}
