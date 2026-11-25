/**
 * Middleware that rejects cross-origin requests that may change state (CSRF protection).
 *
 * React Router verifies the origin of actions called by document and `.data` requests but not of actions
 * of resource routes (e.g. `routes/actions_.theme.tsx`).
 *
 * Register it first in `root.tsx` so it runs before any other middleware, loader, or action. Server to server
 * requests (e.g. webhooks) are not affected. Endpoints that accept a cross-site POST from a browser (e.g. SAML or
 * OAuth `form_post` callbacks) must be exempted here.
 *
 * @module
 */

import type { MiddlewareFunction } from 'react-router'

import { isCrossOriginWrite } from '@workspace/core/request-origin'

export function crossOriginMiddleware(): MiddlewareFunction {
  return async function crossOriginMiddleware({ request }, next) {
    if (isCrossOriginWrite(request)) {
      return new Response('Forbidden', { status: 403 })
    }

    return await next()
  }
}
