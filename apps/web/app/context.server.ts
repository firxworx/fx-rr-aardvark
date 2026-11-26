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

export const cloudflareContext = createContext<CloudflareContext>()

/**
 * Validated environment variables: `context.get(envContext).SITE_URL`.
 */
export const envContext = createContext<ServerEnv>()

export const nonceContext = createContext<NonceContext>()
