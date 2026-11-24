import { env as cloudflareEnv } from 'cloudflare:workers'
import * as z from 'zod'

/**
 * Zod schema for validating server environment variables.
 */
const zEnv = z.object({
  ENVIRONMENT: z.enum(['development', 'production']),
  SITE_URL: z.url().refine((value) => !value.endsWith('/'), {
    error: 'SITE_URL must not have a trailing slash to support CORS, cookies, and canonical URLs.',
  }),
  TOAST_COOKIE_SECRET: z.string().min(32, 'TOAST_COOKIE_SECRET must be at least 32 characters long').optional(),
})

/**
 * Parsed and validated server environment variables.
 */
export const env = (() => {
  const parsed = zEnv.safeParse(cloudflareEnv)

  if (parsed.success === false) {
    console.error('❌ Invalid environment variables:', z.treeifyError(parsed.error))
    throw new Error('Invalid environment variables')
  }

  const validatedData = parsed.data
  Object.freeze(validatedData) // ensure immutability

  if (validatedData.ENVIRONMENT === 'development') {
    console.log(`✅ Environment: ${validatedData.ENVIRONMENT}`)
  }

  return validatedData
})()
