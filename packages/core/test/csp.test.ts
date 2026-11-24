import { describe, expect, it } from 'vitest'

import { createContentSecurityPolicy, createCspNonce, serializeContentSecurityPolicy } from '../src/csp'
import { InvariantAssertionError } from '../src/errors/custom-errors'

// pnpm --filter @workspace/core test test/csp.test.ts

const NONCE = 'dGVzdC1ub25jZS12YWx1ZQ=='
const NONCE_SOURCE = `'nonce-${NONCE}'`

describe('createCspNonce', () => {
  it('returns a base64 encoded 16-byte value', () => {
    const nonce = createCspNonce()

    expect(nonce).toHaveLength(24)
    expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$/)
  })

  it('returns a different value on each call', () => {
    expect(createCspNonce()).not.toBe(createCspNonce())
  })
})

describe('createContentSecurityPolicy', () => {
  it('returns the production policy', () => {
    const directives = createContentSecurityPolicy({ nonce: NONCE, isDevelopment: false })

    expect(directives).toEqual({
      'default-src': ["'self'"],
      'script-src': ["'self'", NONCE_SOURCE, "'strict-dynamic'"],
      'style-src': ["'self'", NONCE_SOURCE],
      'style-src-elem': ["'self'", NONCE_SOURCE],
      'style-src-attr': ["'unsafe-inline'"],
      'img-src': ["'self'", 'data:'],
      'font-src': ["'self'"],
      'connect-src': ["'self'"],
      'worker-src': ["'self'"],
      'object-src': ["'none'"],
      'base-uri': ["'none'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': [],
    })
  })

  it('relaxes directives required by the vite dev server in development', () => {
    const directives = createContentSecurityPolicy({ nonce: NONCE, isDevelopment: true })

    expect(directives['style-src-elem']).toEqual(["'self'", "'unsafe-inline'"])
    expect(directives['style-src-elem']).not.toContain(NONCE_SOURCE)
    expect(directives['connect-src']).toContain('ws:')
    expect(directives['worker-src']).toContain('blob:')
    expect(directives).not.toHaveProperty('upgrade-insecure-requests')

    // script nonce applies in all modes
    expect(directives['script-src']).toContain(NONCE_SOURCE)
  })

  it('throws given an empty nonce', () => {
    expect(() => createContentSecurityPolicy({ nonce: '', isDevelopment: false })).toThrow(InvariantAssertionError)
    expect(() => createContentSecurityPolicy({ nonce: '  ', isDevelopment: false })).toThrow(InvariantAssertionError)
  })
})

describe('serializeContentSecurityPolicy', () => {
  it('joins directives and sources', () => {
    expect(
      serializeContentSecurityPolicy({
        'default-src': ["'self'"],
        'script-src': ["'self'", NONCE_SOURCE],
      }),
    ).toBe(`default-src 'self'; script-src 'self' ${NONCE_SOURCE}`)
  })

  it('serializes directives without sources as the bare directive name', () => {
    expect(
      serializeContentSecurityPolicy({
        'object-src': ["'none'"],
        'upgrade-insecure-requests': [],
      }),
    ).toBe("object-src 'none'; upgrade-insecure-requests")
  })

  it('returns an empty string given no directives', () => {
    expect(serializeContentSecurityPolicy({})).toBe('')
  })
})
