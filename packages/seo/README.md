# @workspace/seo

SEO tags for React Router (framework mode) apps: title, description, canonical URL, Open Graph, and JSON-LD.

Routes set SEO values via loader data or [handle](https://reactrouter.com/how-to/using-handle) export, then the
`<DocumentSeo>` component in the root route renders the tags once (i.e. no duplicate or redundant tags).

Refer to [docs/seo.md](../../docs/seo.md) for usage.

## Exports

- `DocumentSeo`: renders the tags of the current page (root route component)
- `ErrorSeo`: renders the title and `noindex` of error pages (root `ErrorBoundary`)
- `getCanonicalUrl()`, `stripTrailingSlashes()`: URL helpers (e.g. for a sitemap or redirects)
- types: `SeoConfig` (site-wide values), `SeoHandle` and `RouteSeoInput` (values of routes)

## Conventions

- relative imports between files in `src/` without a file extension
- tests live in `test/` and are type checked: run with `pnpm --filter @workspace/seo test`

## Implementation

The implementation uses React 19 `<title>`, `<meta>`, and `<link>` elements, which React hoists into `<head>`, and
renders JSON-LD as a `<script type="application/ld+json">` element in `<body>`. Route `meta` exports are not used for
these tags (the root still renders `<Meta />` for other tags).
