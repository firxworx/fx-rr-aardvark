import { useLocation, useMatches } from 'react-router'

import type { SeoConfig } from './config'
import { serializeJsonLd } from './json-ld'
import { formatTitle, type ResolvedSeo, resolveSeo } from './resolve'

/**
 * Title, meta, and link tags of a page (React hoists them into `<head>`) and its JSON-LD.
 *
 * The JSON-LD script stays where it is rendered (React only hoists scripts with `src` and `async`): search engines
 * read JSON-LD in `<body>`. It is data, not a script that runs, so the CSP does not apply and it needs no nonce.
 *
 * X (Twitter) reads `og:title`, `og:description`, and `og:image`: only `twitter:card` and `twitter:site` are set.
 */
export function SeoTags({ seo }: { seo: ResolvedSeo }): React.JSX.Element {
  const { image } = seo

  return (
    <>
      <title>{seo.title}</title>
      {seo.description !== undefined && <meta name="description" content={seo.description} />}
      {seo.noIndex && <meta name="robots" content="noindex" />}
      {seo.canonicalUrl !== undefined && <link rel="canonical" href={seo.canonicalUrl} />}

      <meta property="og:site_name" content={seo.siteName} />
      <meta property="og:type" content={seo.ogType} />
      <meta property="og:title" content={seo.ogTitle} />
      {seo.ogDescription !== undefined && <meta property="og:description" content={seo.ogDescription} />}
      {seo.canonicalUrl !== undefined && <meta property="og:url" content={seo.canonicalUrl} />}
      {seo.ogLocale !== undefined && <meta property="og:locale" content={seo.ogLocale} />}
      {image !== undefined && (
        <>
          <meta property="og:image" content={image.url} />
          {image.width !== undefined && <meta property="og:image:width" content={String(image.width)} />}
          {image.height !== undefined && <meta property="og:image:height" content={String(image.height)} />}
          {image.alt !== undefined && <meta property="og:image:alt" content={image.alt} />}
          <meta name="twitter:card" content="summary_large_image" />
        </>
      )}
      {seo.twitterSite !== undefined && <meta name="twitter:site" content={seo.twitterSite} />}

      {seo.jsonLd !== undefined && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(seo.jsonLd) }} />
      )}
    </>
  )
}

interface DocumentSeoProps {
  config: SeoConfig
  /** Origin of the site without a trailing slash (e.g. `SITE_URL`): never the origin of the request. */
  siteUrl: string
  /** Throw on invalid `seo` values of routes (development) vs. skip them. */
  strict?: boolean
}

/**
 * SEO tags of the current page from the `seo` values of all matched routes (`handle` and loader data).
 *
 * Render once in the root route component (not `Layout`): the root `ErrorBoundary` renders `ErrorSeo` instead.
 */
export function DocumentSeo({ config, siteUrl, strict = false }: DocumentSeoProps): React.JSX.Element {
  const matches = useMatches()
  const { pathname } = useLocation()

  return <SeoTags seo={resolveSeo({ config, siteUrl, pathname, matches, strict })} />
}

/**
 * Tags of error pages: the title and `noindex`. No description, canonical URL, or Open Graph tags; it does not use
 * loader data because a failed loader may be the cause of the error.
 */
export function ErrorSeo({ config, title }: { config: SeoConfig; title: string }): React.JSX.Element {
  return (
    <>
      <title>{formatTitle(config.titleTemplate, title)}</title>
      <meta name="robots" content="noindex" />
    </>
  )
}
