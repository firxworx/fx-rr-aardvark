import * as z from 'zod'

import { isNullish, isRecordWithKey } from '@workspace/core/helpers'
import type { SeoConfig } from './config'
import { type JsonLdNode, type RouteSeo, type SeoImage, zRouteSeo } from './schema'
import { getCanonicalUrl, toAbsoluteUrl } from './url'

/** Route match from `useMatches()`. */
export interface SeoRouteMatch {
  id: string
  handle: unknown
  loaderData: unknown
}

export interface ResolveSeoOptions {
  config: SeoConfig
  /** Origin of the site without a trailing slash, e.g. `https://example.com`. */
  siteUrl: string
  /** Pathname of the current page. */
  pathname: string
  /** Matched routes from the root to the leaf. */
  matches: SeoRouteMatch[]
  /** Throw on invalid `seo` values (development) vs. skip them. */
  strict?: boolean
}

/** Final values of the SEO tags of a page. */
export interface ResolvedSeo {
  title: string
  description: string | undefined
  /** `undefined` for pages that should not be indexed. */
  canonicalUrl: string | undefined
  noIndex: boolean
  siteName: string
  ogType: NonNullable<RouteSeo['ogType']>
  ogTitle: string
  ogDescription: string | undefined
  ogLocale: string | undefined
  /** Image with an absolute URL. */
  image: SeoImage | undefined
  twitterSite: string | undefined
  /** JSON-LD document with a graph of all nodes (`undefined` when there are none). */
  jsonLd: Record<string, unknown> | undefined
}

/**
 * Format a title with a title template: `%s` is replaced by the title.
 */
export function formatTitle(titleTemplate: string, title: string): string {
  // function replacer: a replacement string would interpret patterns such as `$&` in the title
  return titleTemplate.replace('%s', () => title)
}

/**
 * Read and validate the `seo` value of a route `handle` or loader data.
 *
 * @throws {Error} if the value is invalid and `strict` is set
 */
function parseRouteSeo(source: unknown, label: string, strict: boolean): RouteSeo | undefined {
  if (!isRecordWithKey(source, 'seo') || isNullish(source.seo)) {
    return undefined
  }

  const parsed = zRouteSeo.safeParse(source.seo)

  if (parsed.success) {
    return parsed.data
  }

  if (strict) {
    throw new Error(`Invalid seo in ${label}:\n${z.prettifyError(parsed.error)}`)
  }

  return undefined
}

/**
 * Drop keys whose value is `undefined` (e.g. `null` from a database) so they do not replace values of parent routes.
 */
function withoutUndefined<T extends object>(input: T): Partial<T> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Partial<T>
}

/**
 * Remove `@context` from a node: the JSON-LD document sets it once for the whole graph.
 */
function withoutContext(node: JsonLdNode): JsonLdNode {
  const { '@context': _context, ...rest } = node

  return rest as JsonLdNode
}

/**
 * Merge the site config and the `seo` values of matched routes into the final values of the SEO tags.
 *
 * For each route from the root to the leaf, the values of its `handle` and then its loader data replace values set
 * before them. Exceptions: `canonical` is only read from the leaf route and JSON-LD nodes of all routes are combined.
 */
export function resolveSeo({ config, siteUrl, pathname, matches, strict = false }: ResolveSeoOptions): ResolvedSeo {
  let merged: Omit<RouteSeo, 'canonical' | 'jsonLd'> = {}
  let canonical: string | undefined
  const jsonLdNodes: JsonLdNode[] = [...(config.jsonLd?.(siteUrl) ?? [])]
  const leafIndex = matches.length - 1

  for (const [index, match] of matches.entries()) {
    const sources = [
      parseRouteSeo(match.handle, `handle of route "${match.id}"`, strict),
      parseRouteSeo(match.loaderData, `loader data of route "${match.id}"`, strict),
    ]

    for (const seo of sources) {
      if (seo === undefined) {
        continue
      }

      const { canonical: routeCanonical, jsonLd, ...values } = seo
      merged = { ...merged, ...withoutUndefined(values) }

      if (index === leafIndex && routeCanonical !== undefined) {
        canonical = routeCanonical
      }

      if (jsonLd !== undefined) {
        jsonLdNodes.push(...jsonLd.map(withoutContext))
      }
    }
  }

  const noIndex = merged.noIndex === true
  const description = merged.description ?? config.defaultDescription
  const image = merged.ogImage ?? config.image
  const imageUrl = image === undefined ? undefined : toAbsoluteUrl(image.url, siteUrl)

  const routeCanonicalUrl = canonical === undefined ? undefined : toAbsoluteUrl(canonical, siteUrl)
  const canonicalUrl = noIndex ? undefined : (routeCanonicalUrl ?? getCanonicalUrl(siteUrl, pathname))

  return {
    title:
      merged.title === undefined
        ? config.defaultTitle
        : formatTitle(merged.titleTemplate ?? config.titleTemplate, merged.title),
    description,
    canonicalUrl,
    noIndex,
    siteName: config.siteName,
    ogType: merged.ogType ?? 'website',
    ogTitle: merged.ogTitle ?? merged.title ?? config.defaultTitle,
    ogDescription: merged.ogDescription ?? description,
    ogLocale: config.locale,
    image: image === undefined || imageUrl === undefined ? undefined : { ...image, url: imageUrl },
    twitterSite: config.twitterSite,
    jsonLd: jsonLdNodes.length === 0 ? undefined : { '@context': 'https://schema.org', '@graph': jsonLdNodes },
  }
}
