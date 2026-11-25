import { env as cloudflareEnv } from 'cloudflare:workers'
import * as z from 'zod'

/**
 * Zod schema for validating server environment variables.
 */
const zEnv = z.object({
  ENVIRONMENT: z.enum(['development', 'preview', 'production']),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warning', 'error', 'fatal']),
  SITE_URL: z.url().refine((value) => !value.endsWith('/'), {
    error: 'SITE_URL must not have a trailing slash to support CORS, cookies, and canonical URLs.',
  }),
  TOAST_COOKIE_SECRET: z.string().min(32, 'TOAST_COOKIE_SECRET must be at least 32 characters long'),
})

/**
 * Parsed and validated server environment variables.
 *
 * The worker entry point imports this module at startup so that a deploy with invalid values fails. Throw instead of
 * logging: LogTape is not configured yet.
 */
export const env = (() => {
  const parsed = zEnv.safeParse(cloudflareEnv)

  if (parsed.success === false) {
    // messages of zod errors include names of variables but not their values
    throw new Error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`)
  }

  const validatedData = parsed.data
  Object.freeze(validatedData) // ensure immutability

  return validatedData
})()
