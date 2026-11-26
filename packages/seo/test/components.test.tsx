import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ErrorSeo, SeoTags } from '../src/components'
import type { ResolvedSeo } from '../src/resolve'

const BASE_SEO: ResolvedSeo = {
  title: 'Pricing | Acme',
  description: 'Plans',
  canonicalUrl: 'https://example.com/pricing',
  noIndex: false,
  siteName: 'Acme',
  ogType: 'website',
  ogTitle: 'Pricing',
  ogDescription: 'Plans',
  ogLocale: undefined,
  image: undefined,
  twitterSite: undefined,
  jsonLd: undefined,
}

describe('SeoTags', () => {
  it('renders the tags of an indexable page without optional tags', () => {
    const html = renderToStaticMarkup(<SeoTags seo={BASE_SEO} />)

    expect(html).toContain('<title>Pricing | Acme</title>')
    expect(html).toContain('<meta name="description" content="Plans"/>')
    expect(html).toContain('<link rel="canonical" href="https://example.com/pricing"/>')
    expect(html).toContain('<meta property="og:url" content="https://example.com/pricing"/>')
    expect(html).not.toContain('robots')
    expect(html).not.toContain('og:image')
    expect(html).not.toContain('og:locale')
    expect(html).not.toContain('twitter:')
    expect(html).not.toContain('ld+json')
  })

  it('renders the image, twitter card, optional tags, and JSON-LD when set', () => {
    const html = renderToStaticMarkup(
      <SeoTags
        seo={{
          ...BASE_SEO,
          ogLocale: 'en_US',
          twitterSite: '@acme',
          image: { url: 'https://example.com/og.png', width: 1200, height: 630, alt: 'Acme' },
          jsonLd: { '@context': 'https://schema.org', '@graph': [{ '@type': 'WebSite', name: '</script>' }] },
        }}
      />,
    )

    expect(html).toContain('<meta property="og:image" content="https://example.com/og.png"/>')
    expect(html).toContain('<meta property="og:image:width" content="1200"/>')
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image"/>')
    expect(html).toContain('<meta name="twitter:site" content="@acme"/>')
    expect(html).toContain('<meta property="og:locale" content="en_US"/>')
    expect(html).toContain('<script type="application/ld+json">')
    expect(html).not.toContain('</script><')
  })

  it('renders noindex without the canonical URL', () => {
    const html = renderToStaticMarkup(<SeoTags seo={{ ...BASE_SEO, noIndex: true, canonicalUrl: undefined }} />)

    expect(html).toContain('<meta name="robots" content="noindex"/>')
    expect(html).not.toContain('canonical')
    expect(html).not.toContain('og:url')
  })
})

describe('ErrorSeo', () => {
  it('renders only the title and noindex', () => {
    const html = renderToStaticMarkup(
      <ErrorSeo
        config={{ siteName: 'Acme', defaultTitle: 'Acme', titleTemplate: '%s | Acme' }}
        title="404 Not Found"
      />,
    )

    expect(html).toBe('<title>404 Not Found | Acme</title><meta name="robots" content="noindex"/>')
  })
})
