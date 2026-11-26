import { describe, expect, it } from 'vitest'

import { getCanonicalUrl } from '@/routes/sitemap[.]xml'

describe('getCanonicalUrl', () => {
  it('keeps the slash of the root path', () => {
    expect(getCanonicalUrl('https://example.com', '/')).toBe('https://example.com/')
  })

  it('removes trailing slashes from other paths', () => {
    expect(getCanonicalUrl('https://example.com', '/about/')).toBe('https://example.com/about')
    expect(getCanonicalUrl('https://example.com', '/docs//')).toBe('https://example.com/docs')
  })
})
