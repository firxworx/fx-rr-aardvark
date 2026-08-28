/**
 * React Router server context (not to be confused with React context).
 *
 * Refer to worker entrypoint where cloudflare and nonce context are set and
 * provided to react-router's request handler.
 *
 * @module
 */

import { createContext } from 'react-router'

export type CloudflareContext = {
  env: Env
  ctx: ExecutionContext
}

export type NonceContext = {
  nonce: string
}

export const cloudflareContext = createContext<CloudflareContext>()
export const nonceContext = createContext<NonceContext>()
