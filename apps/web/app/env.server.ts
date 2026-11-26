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
 * Validated server environment variables (excludes Cloudflare bindings such as D1 and KV: get them from
 * `cloudflareContext`).
 */
export type ServerEnv = Readonly<z.infer<typeof zServerEnv>>

/**
 * Parse and validate server environment variables.
 *
 * `workers/app.ts` parses the `env` of each request (a few microseconds) and sets the result as `envContext`: do not
 * cache the result across requests because a running isolate may be reused after a secret or variable changes.
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
