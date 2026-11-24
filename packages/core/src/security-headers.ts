/**
 * Security response headers (other than CSP; refer to `@workspace/core/csp`).
 *
 * Worker responses receive these headers via `applySecurityHeaders()` in the worker entrypoint.
 *
 * Static assets are served by Cloudflare Workers Static Assets without invoking the worker so the
 * same headers are declared in the app's `public/_headers` file: **keep both in sync**.
 *
 * Cross-Origin-Embedder-Policy (COEP) is intentionally omitted: it is only required for
 * cross-origin isolation (e.g. `SharedArrayBuffer`, WebAssembly threads) and may block
 * cross-origin resources.
 *
 * @see https://developers.cloudflare.com/workers/static-assets/headers/
 * @see https://owasp.org/www-project-secure-headers/
 * @see https://hono.dev/docs/middleware/builtin/secure-headers (basis for defaults)
 *
 * @module
 */

/**
 * Permissions Policy features disabled (empty allowlist) or limited to same-origin (`self`).
 *
 * Chromium on Linux may log "Unrecognized feature: 'bluetooth'" (Web Bluetooth off by default); expected.
 */
const PERMISSIONS_POLICY: Readonly<Record<string, string[]>> = {
  fullscreen: ['self'],
  payment: [],
  'sync-xhr': [],
  camera: [],
  microphone: [],
  geolocation: [],
  usb: [],
  accelerometer: [],
  gyroscope: [],
  magnetometer: [],
  bluetooth: [],
}

function serializePermissionsPolicy(policy: Readonly<Record<string, string[]>>): string {
  return Object.entries(policy)
    .map(([feature, allowlist]) => `${feature}=(${allowlist.join(' ')})`)
    .join(', ')
}

/**
 * Security headers applied to all responses.
 */
export const SECURITY_HEADERS: Readonly<Record<string, string>> = Object.freeze({
  // ignored by browsers over http so safe for local development; `preload` intentionally omitted
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',

  // `no-referrer` makes browsers send `Origin: null` on form POSTs without JS which fails
  // react-router's action origin check; `same-origin` still sends no referrer cross-origin
  'Referrer-Policy': 'same-origin',

  // legacy counterpart to CSP `frame-ancestors 'none'`
  'X-Frame-Options': 'DENY',

  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Origin-Agent-Cluster': '?1',

  // disable legacy XSS auditor (buggy and itself a source of vulnerabilities); CSP supersedes it
  'X-XSS-Protection': '0',

  'Permissions-Policy': serializePermissionsPolicy(PERMISSIONS_POLICY),
})

/**
 * Apply `SECURITY_HEADERS` to the given mutable `Headers` instance.
 *
 * Headers that are already set (e.g. by a route) are preserved so they can be overridden as needed.
 */
export function applySecurityHeaders(headers: Headers): void {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(name)) {
      headers.set(name, value)
    }
  }
}
