/**
 * Remove trailing slashes from a pathname; the root pathname `/` is kept.
 */
export function stripTrailingSlashes(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/'
}

/**
 * Canonical URL of a page: the pathname without trailing slashes on the site URL, without a query string or hash.
 *
 * The pathname is set on a URL of the site (vs. `new URL(pathname, siteUrl)`) so the result always has the host of
 * the site: `new URL('//evil.com', siteUrl)` resolves to `https://evil.com/` and the pathname of a request may start
 * with `//`.
 */
export function getCanonicalUrl(siteUrl: string, pathname: string): string {
  const url = new URL(siteUrl)
  url.pathname = stripTrailingSlashes(pathname)

  return url.href
}

/**
 * Resolve a URL or path set by the app (e.g. an image or a canonical URL of a route) against the site URL.
 *
 * Returns `undefined` for invalid URLs and protocols other than `http:` and `https:`. Do not pass the pathname of a
 * request: use `getCanonicalUrl()`.
 */
export function toAbsoluteUrl(urlOrPath: string, siteUrl: string): string | undefined {
  if (!URL.canParse(urlOrPath, siteUrl)) {
    return undefined
  }

  const url = new URL(urlOrPath, siteUrl)

  return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined
}
