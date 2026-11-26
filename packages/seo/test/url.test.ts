import { describe, expect, it } from 'vitest'

import { getCanonicalUrl, stripTrailingSlashes, toAbsoluteUrl } from '../src/url'

const SITE_URL = 'https://example.com'

describe('stripTrailingSlashes', () => {
  it('removes trailing slashes and keeps the root path', () => {
    expect(stripTrailingSlashes('/about/')).toBe('/about')
    expect(stripTrailingSlashes('/docs//')).toBe('/docs')
    expect(stripTrailingSlashes('/')).toBe('/')
    expect(stripTrailingSlashes('//')).toBe('/')
  })
})

describe('getCanonicalUrl', () => {
  it('keeps the slash of the root path', () => {
    expect(getCanonicalUrl(SITE_URL, '/')).toBe('https://example.com/')
  })

  it('removes trailing slashes from other paths', () => {
    expect(getCanonicalUrl(SITE_URL, '/about/')).toBe('https://example.com/about')
    expect(getCanonicalUrl(SITE_URL, '/docs//')).toBe('https://example.com/docs')
  })

  it('keeps the host of the site for paths that start with two slashes', () => {
    expect(getCanonicalUrl(SITE_URL, '//evil.com/page')).toBe('https://example.com//evil.com/page')
    expect(getCanonicalUrl(SITE_URL, '/\\evil.com')).toBe('https://example.com//evil.com')
  })

  it('encodes the pathname', () => {
    expect(getCanonicalUrl(SITE_URL, '/café')).toBe('https://example.com/caf%C3%A9')
  })
})

describe('toAbsoluteUrl', () => {
  it('resolves paths against the site URL', () => {
    expect(toAbsoluteUrl('/images/og.png', SITE_URL)).toBe('https://example.com/images/og.png')
  })

  it('keeps absolute http(s) URLs', () => {
    expect(toAbsoluteUrl('https://cdn.example.net/og.png', SITE_URL)).toBe('https://cdn.example.net/og.png')
  })

  it('rejects other protocols and invalid URLs', () => {
    expect(toAbsoluteUrl('javascript:alert(1)', SITE_URL)).toBeUndefined()
    expect(toAbsoluteUrl('data:image/png;base64,AA', SITE_URL)).toBeUndefined()
    expect(toAbsoluteUrl('https://', SITE_URL)).toBeUndefined()
  })
})
