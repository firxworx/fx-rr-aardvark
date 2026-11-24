// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { getSameHostReferrer, isCrossOriginWrite } from '../src/request-origin'

// pnpm --filter @workspace/core test test/request-origin.test.ts

const URL_SAME_HOST = 'https://example.com/actions/theme'

function createRequest(headers: Record<string, string> = {}, method = 'POST'): Request {
  return new Request(URL_SAME_HOST, { method, headers })
}

describe('isCrossOriginWrite', () => {
  it.each(['GET', 'HEAD', 'OPTIONS'])('allows cross-site %s requests', (method) => {
    const headers = { 'Sec-Fetch-Site': 'cross-site', Origin: 'https://evil.example' }

    expect(isCrossOriginWrite(createRequest(headers, method))).toBe(false)
  })

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('rejects cross-site %s requests', (method) => {
    expect(isCrossOriginWrite(createRequest({ 'Sec-Fetch-Site': 'cross-site' }, method))).toBe(true)
  })

  it.each([
    ['same-origin', false],
    ['none', false],
    ['same-site', true],
    ['cross-site', true],
    ['unknown', true],
    ['', true],
  ])('handles Sec-Fetch-Site "%s"', (fetchSite, expected) => {
    expect(isCrossOriginWrite(createRequest({ 'Sec-Fetch-Site': fetchSite }))).toBe(expected)
  })

  it('prefers Sec-Fetch-Site over Origin', () => {
    const sameOrigin = createRequest({ 'Sec-Fetch-Site': 'same-origin', Origin: 'null' })
    const crossSite = createRequest({ 'Sec-Fetch-Site': 'cross-site', Origin: 'https://example.com' })

    expect(isCrossOriginWrite(sameOrigin)).toBe(false)
    expect(isCrossOriginWrite(crossSite)).toBe(true)
  })

  it.each([
    ['https://example.com', false],
    ['http://example.com', false],
    ['https://evil.example', true],
    ['https://sub.example.com', true],
    ['https://example.com.evil.example', true],
    ['https://example.com:8443', true],
    ['null', true],
    ['', true],
  ])('falls back to Origin "%s"', (origin, expected) => {
    expect(isCrossOriginWrite(createRequest({ Origin: origin }))).toBe(expected)
  })

  it('allows requests with neither header (non-browser clients)', () => {
    expect(isCrossOriginWrite(createRequest())).toBe(false)
  })
})

describe('getSameHostReferrer', () => {
  it('returns the complete url', () => {
    const referrer = getSameHostReferrer(createRequest({ Referer: 'https://example.com/example?a=1' }))

    expect(referrer?.href).toBe('https://example.com/example?a=1')
  })

  it('keeps the host of a referrer with a path that starts with //', () => {
    const referrer = getSameHostReferrer(createRequest({ Referer: 'https://example.com//evil.example/x' }))

    expect(referrer?.href).toBe('https://example.com//evil.example/x')
    expect(referrer?.host).toBe('example.com')
  })

  it.each([
    'https://evil.example/',
    'https://sub.example.com/',
    'https://example.com:8443/',
    'https://example.com@evil.example/',
    'javascript://example.com/%0aalert(1)',
    '//example.com/',
    '/example',
    'about:client',
    '',
  ])('rejects "%s"', (referrer) => {
    expect(getSameHostReferrer(createRequest({ Referer: referrer }))).toBeUndefined()
  })

  it('returns undefined without a referrer', () => {
    expect(getSameHostReferrer(createRequest())).toBeUndefined()
  })
})
