import { describe, expect, it } from 'vitest'

import { getServerEnv, parseEnv } from '@/env.server'

const VALID_ENV = {
  ENVIRONMENT: 'production',
  LOG_LEVEL: 'info',
  SITE_URL: 'https://example.com',
  TOAST_COOKIE_SECRET: 'x'.repeat(32),
}

describe('parseEnv', () => {
  it('returns validated variables without other bindings', () => {
    const env = parseEnv({ ...VALID_ENV, CF_VERSION_METADATA: { id: 'abc' } })

    expect(env).toEqual(VALID_ENV)
    expect(Object.isFrozen(env)).toBe(true)
  })

  it('throws with the names of invalid variables but not their values', () => {
    const secret = 'too-short-secret'

    expect(() => parseEnv({ ...VALID_ENV, LOG_LEVEL: 'verbose', TOAST_COOKIE_SECRET: secret })).toThrow(
      /Invalid environment variables:[\s\S]*LOG_LEVEL[\s\S]*TOAST_COOKIE_SECRET/,
    )

    try {
      parseEnv({ ...VALID_ENV, TOAST_COOKIE_SECRET: secret })
    } catch (error) {
      expect(String(error)).not.toContain(secret)
    }
  })

  it('throws when a variable is missing', () => {
    const { SITE_URL: _siteUrl, ...withoutSiteUrl } = VALID_ENV

    expect(() => parseEnv(withoutSiteUrl)).toThrow(/SITE_URL/)
  })

  it('rejects a site URL with a trailing slash', () => {
    expect(() => parseEnv({ ...VALID_ENV, SITE_URL: 'https://example.com/' })).toThrow(/trailing slash/)
  })
})

describe('getServerEnv', () => {
  it('parses once for the same env object', () => {
    const source = { ...VALID_ENV }

    expect(getServerEnv(source)).toBe(getServerEnv(source))
  })

  it('parses again for a new env object (e.g. after a secret changes)', () => {
    const first = getServerEnv({ ...VALID_ENV })
    const second = getServerEnv({ ...VALID_ENV, TOAST_COOKIE_SECRET: 'y'.repeat(32) })

    expect(second).not.toBe(first)
    expect(second.TOAST_COOKIE_SECRET).toBe('y'.repeat(32))
  })
})
