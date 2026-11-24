import { describe, expect, it } from 'vitest'

import {
  getHttpReasonPhrase,
  HTTP_REASON_PHRASES,
  isErrorResponse,
  isKnownHttpStatusCode,
} from '../src/helpers/http-status'

// pnpm --filter @workspace/core test test/http-status.test.ts

describe('HTTP_REASON_PHRASES', () => {
  it('only contains valid status codes (100-599) with non-empty phrases', () => {
    for (const [code, phrase] of Object.entries(HTTP_REASON_PHRASES)) {
      expect(Number(code)).toBeGreaterThanOrEqual(100)
      expect(Number(code)).toBeLessThan(600)
      expect(phrase.trim()).toBe(phrase)
      expect(phrase.length).toBeGreaterThan(0)
    }
  })

  it('uses current RFC 9110 reason phrases', () => {
    expect(HTTP_REASON_PHRASES[203]).toBe('Non-Authoritative Information')
    expect(HTTP_REASON_PHRASES[302]).toBe('Found')
    expect(HTTP_REASON_PHRASES[413]).toBe('Content Too Large')
    expect(HTTP_REASON_PHRASES[414]).toBe('URI Too Long')
    expect(HTTP_REASON_PHRASES[416]).toBe('Range Not Satisfiable')
    expect(HTTP_REASON_PHRASES[422]).toBe('Unprocessable Content')
  })

  it('excludes non-standard codes', () => {
    expect(isKnownHttpStatusCode(419)).toBe(false)
    expect(isKnownHttpStatusCode(420)).toBe(false)
  })
})

describe('getHttpReasonPhrase', () => {
  it('returns the reason phrase for known codes', () => {
    expect(getHttpReasonPhrase(200)).toBe('OK')
    expect(getHttpReasonPhrase(404)).toBe('Not Found')
    expect(getHttpReasonPhrase(500)).toBe('Internal Server Error')
  })

  it('returns undefined for unknown codes without throwing', () => {
    expect(getHttpReasonPhrase(299)).toBeUndefined()
    expect(getHttpReasonPhrase(499)).toBeUndefined()
    expect(getHttpReasonPhrase(0)).toBeUndefined()
    expect(getHttpReasonPhrase(-1)).toBeUndefined()
    expect(getHttpReasonPhrase(404.5)).toBeUndefined()
    expect(getHttpReasonPhrase(Number.NaN)).toBeUndefined()
  })
})

describe('isErrorResponse', () => {
  it.each([400, 404, 499, 500, 599])('returns true for status %i', (status) => {
    expect(isErrorResponse(new Response(null, { status }))).toBe(true)
  })

  it.each([200, 204, 302, 399])('returns false for status %i', (status) => {
    expect(isErrorResponse(new Response(null, { status }))).toBe(false)
  })
})
