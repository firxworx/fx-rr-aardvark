import * as z from 'zod'

/**
 * Zod schema for validating server environment variables.
 */
const zServerEnv = z.object({
  ENVIRONMENT: z.enum(['development', 'preview', 'production']),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warning', 'error', 'fatal']),
  SITE_URL: z.url().refine((value) => !value.endsWith('/'), {
    error: 'SITE_URL must not have a trailing slash to support CORS, cookies, and canonical URLs.',
  }),
  TOAST_COOKIE_SECRET: z.string().min(32, 'TOAST_COOKIE_SECRET must be at least 32 characters long'),
})

/**
 * Validated server environment variables. Bindings (D1, KV, etc.) are not included: get them from `cloudflareContext`.
 */
export type ServerEnv = Readonly<z.infer<typeof zServerEnv>>

/**
 * Parse and validate server environment variables.
 *
 * @throws {Error} if a variable is missing or invalid (the message names variables but does not include values)
 */
export function parseEnv(source: unknown): ServerEnv {
  const parsed = zServerEnv.safeParse(source)

  if (!parsed.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`)
  }

  return Object.freeze(parsed.data)
}

// cache by `env` object: parse once while the object is unchanged, and again when Cloudflare provides a new one
// (an isolate may be reused when only bindings, vars, or secrets change)
const serverEnvCache = new WeakMap<object, ServerEnv>()

/**
 * Get validated server environment variables for the `env` object of a handler (cached).
 *
 * Request handlers read the result from `envContext` (set in `workers/app.ts`) instead of calling this function.
 *
 * @throws {Error} if a variable is missing or invalid
 */
export function getServerEnv(env: object): ServerEnv {
  const cached = serverEnvCache.get(env)

  if (cached !== undefined) {
    return cached
  }

  const serverEnv = parseEnv(env)
  serverEnvCache.set(env, serverEnv)

  return serverEnv
}
