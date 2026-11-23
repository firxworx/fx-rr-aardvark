import { describe, expect, it } from 'vitest'

import { applySecurityHeaders, SECURITY_HEADERS } from '../src/security-headers'

// pnpm --filter @workspace/core test test/security-headers.test.ts

describe('SECURITY_HEADERS', () => {
  it('is frozen', () => {
    expect(Object.isFrozen(SECURITY_HEADERS)).toBe(true)
  })

  it('uses same-origin referrer policy (required for react-router action origin checks without JS)', () => {
    expect(SECURITY_HEADERS['Referrer-Policy']).toBe('same-origin')
  })

  it('serializes the permissions policy', () => {
    const permissionsPolicy = SECURITY_HEADERS['Permissions-Policy']

    expect(permissionsPolicy).toContain('fullscreen=(self)')
    expect(permissionsPolicy).toContain('camera=()')
    expect(permissionsPolicy).toContain('sync-xhr=()')
    expect(permissionsPolicy).toMatch(/^[a-z-]+=\([a-z ]*\)(, [a-z-]+=\([a-z ]*\))*$/)
  })
})

describe('applySecurityHeaders', () => {
  it('sets all security headers', () => {
    const headers = new Headers()
    applySecurityHeaders(headers)

    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(headers.get(name)).toBe(value)
    }
  })

  it('preserves headers that are already set', () => {
    const headers = new Headers({ 'Referrer-Policy': 'no-referrer', 'Content-Type': 'text/html' })
    applySecurityHeaders(headers)

    expect(headers.get('Referrer-Policy')).toBe('no-referrer')
    expect(headers.get('Content-Type')).toBe('text/html')
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff')
  })
})
