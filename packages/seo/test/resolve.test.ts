import { describe, expect, it } from 'vitest'

import type { SeoConfig } from '../src/config'
import { formatTitle, type ResolveSeoOptions, resolveSeo, type SeoRouteMatch } from '../src/resolve'
import type { RouteSeoInput } from '../src/schema'

const SITE_URL = 'https://example.com'

const CONFIG: SeoConfig = {
  siteName: 'Acme',
  defaultTitle: 'Acme',
  titleTemplate: '%s | Acme',
  defaultDescription: 'Default description',
  image: { url: '/images/og-default.png', width: 1200, height: 630, alt: 'Acme' },
  jsonLd: (siteUrl) => [{ '@type': 'WebSite', name: 'Acme', url: `${siteUrl}/` }],
}

function match(id: string, sources: { handle?: RouteSeoInput; loaderData?: RouteSeoInput } = {}): SeoRouteMatch {
  return {
    id,
    handle: sources.handle === undefined ? undefined : { seo: sources.handle },
    loaderData: sources.loaderData === undefined ? undefined : { seo: sources.loaderData },
  }
}

function resolve(matches: SeoRouteMatch[], options: Partial<ResolveSeoOptions> = {}) {
  return resolveSeo({ config: CONFIG, siteUrl: SITE_URL, pathname: '/', matches, ...options })
}

describe('formatTitle', () => {
  it('replaces %s with the title as is', () => {
    expect(formatTitle('%s | Acme', 'Pricing')).toBe('Pricing | Acme')
    expect(formatTitle('%s | Acme', 'Save $& more')).toBe('Save $& more | Acme')
  })
})

describe('resolveSeo', () => {
  it('uses the site config when no route sets values', () => {
    const seo = resolve([match('root'), match('routes/_index')])

    expect(seo).toMatchObject({
      title: 'Acme',
      description: 'Default description',
      canonicalUrl: 'https://example.com/',
      noIndex: false,
      ogType: 'website',
      ogTitle: 'Acme',
      ogDescription: 'Default description',
      ogLocale: undefined,
      twitterSite: undefined,
      image: { url: 'https://example.com/images/og-default.png', width: 1200, height: 630, alt: 'Acme' },
    })
    expect(seo.jsonLd).toEqual({
      '@context': 'https://schema.org',
      '@graph': [{ '@type': 'WebSite', name: 'Acme', url: 'https://example.com/' }],
    })
  })

  it('formats the title of a page and uses it for og:title', () => {
    const seo = resolve([match('root'), match('routes/pricing', { handle: { title: 'Pricing' } })])

    expect(seo.title).toBe('Pricing | Acme')
    expect(seo.ogTitle).toBe('Pricing')
  })

  it('applies values from the root to the leaf with loader data after the handle', () => {
    const seo = resolve([
      match('root'),
      match('routes/blog', { handle: { titleTemplate: '%s | Acme Blog', ogType: 'article', description: 'Blog' } }),
      match('routes/blog.$slug', {
        handle: { title: 'Post' },
        loaderData: { title: 'My post', ogImage: '/images/post.png' },
      }),
    ])

    expect(seo).toMatchObject({
      title: 'My post | Acme Blog',
      description: 'Blog',
      ogType: 'article',
      image: { url: 'https://example.com/images/post.png' },
    })
  })

  it('keeps values of parent routes when a route sets null or empty text', () => {
    const seo = resolve([
      match('routes/blog', { handle: { description: 'Blog', ogImage: '/images/blog.png' } }),
      match('routes/blog.$slug', { loaderData: { title: 'Post', description: null, ogImage: null } }),
      match('routes/blog.$slug.comments', { loaderData: { description: '   ' } }),
    ])

    expect(seo.description).toBe('Blog')
    expect(seo.image?.url).toBe('https://example.com/images/blog.png')
  })

  it('defaults the canonical URL to the pathname without trailing slashes', () => {
    expect(resolve([match('root')], { pathname: '/about/' }).canonicalUrl).toBe('https://example.com/about')
  })

  it('reads canonical only from the leaf route', () => {
    const fromLayout = resolve([match('routes/docs', { handle: { canonical: '/docs' } }), match('routes/docs.intro')], {
      pathname: '/docs/intro',
    })
    const fromLeaf = resolve([match('routes/docs'), match('routes/docs.intro', { handle: { canonical: '/intro' } })], {
      pathname: '/docs/intro',
    })

    expect(fromLayout.canonicalUrl).toBe('https://example.com/docs/intro')
    expect(fromLeaf.canonicalUrl).toBe('https://example.com/intro')
  })

  it('omits the canonical URL of pages that should not be indexed, including child routes', () => {
    const seo = resolve([match('routes/account', { handle: { noIndex: true } }), match('routes/account.settings')], {
      pathname: '/account/settings',
    })

    expect(seo.noIndex).toBe(true)
    expect(seo.canonicalUrl).toBeUndefined()
  })

  it('combines JSON-LD nodes of all routes without nested @context', () => {
    const seo = resolve([
      match('routes/blog', { handle: { jsonLd: { '@type': 'Blog', name: 'Blog' } } }),
      match('routes/blog.$slug', {
        loaderData: { jsonLd: [{ '@context': 'https://schema.org', '@type': 'BlogPosting', headline: 'Post' }] },
      }),
    ])

    expect(seo.jsonLd?.['@graph']).toEqual([
      { '@type': 'WebSite', name: 'Acme', url: 'https://example.com/' },
      { '@type': 'Blog', name: 'Blog' },
      { '@type': 'BlogPosting', headline: 'Post' },
    ])
  })

  it('omits the image and JSON-LD when neither the config nor a route sets them', () => {
    const seo = resolveSeo({
      config: { siteName: 'Acme', defaultTitle: 'Acme', titleTemplate: '%s | Acme' },
      siteUrl: SITE_URL,
      pathname: '/',
      matches: [match('root')],
    })

    expect(seo.description).toBeUndefined()
    expect(seo.image).toBeUndefined()
    expect(seo.jsonLd).toBeUndefined()
  })

  it('ignores an image with an unsupported protocol', () => {
    const seo = resolve([match('routes/page', { handle: { ogImage: 'javascript:alert(1)' } })])

    expect(seo.image).toBeUndefined()
  })

  describe('invalid values', () => {
    const invalid = { handle: { seo: { title: 'Page', noindex: true } }, loaderData: undefined }

    it('throws with the route and the problem when strict', () => {
      expect(() => resolve([{ id: 'routes/page', ...invalid }], { strict: true })).toThrow(
        /handle of route "routes\/page"[\s\S]*noindex/,
      )
    })

    it('skips them when not strict', () => {
      expect(resolve([{ id: 'routes/page', ...invalid }]).title).toBe('Acme')
    })

    it('rejects a title template without %s', () => {
      expect(() =>
        resolve([{ id: 'routes/page', handle: { seo: { titleTemplate: 'Blog' } }, loaderData: undefined }], {
          strict: true,
        }),
      ).toThrow(/titleTemplate must contain %s/)
    })
  })

  it('ignores loader data and handles without seo', () => {
    const seo = resolve([{ id: 'root', handle: { other: true }, loaderData: { theme: 'dark', seo: null } }])

    expect(seo.title).toBe('Acme')
  })
})
