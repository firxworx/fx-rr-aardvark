/**
 * React Router server context (not to be confused with React context).
 *
 * Refer to worker entrypoint where cloudflare, env, and nonce context are set and
 * provided to react-router's request handler.
 *
 * @module
 */

import { createContext } from 'react-router'

import type { ServerEnv } from '@/env.server'

export type CloudflareContext = {
  env: Env
  ctx: ExecutionContext
}

export type NonceContext = {
  nonce: string
}

/**
 * Cloudflare bindings (D1, KV, etc.) and execution context for the current request.
 * Read environment variables from `envContext` instead of `env`.
 */
export const cloudflareContext = createContext<CloudflareContext>()

/**
 * Parsed and validated environment variables: e.g. `context.get(envContext).SITE_URL`.
 */
export const envContext = createContext<ServerEnv>()

/**
 * Nonce value for the current request for content security policy (CSP).
 */
export const nonceContext = createContext<NonceContext>()
