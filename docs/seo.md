# SEO

`@workspace/seo` (`packages/seo`) renders the title, description, canonical URL, Open Graph tags, and JSON-LD of each
page.

Routes set values in their `handle` or loader data. `<DocumentSeo />` in the root route component merges the values of
all matched routes and renders each tag once (React hoists title, meta, and link tags into `<head>`).

## Setup

Edit `apps/web/app/seo.ts` (`SEO_CONFIG`):

- `siteName`, `defaultTitle` (home page and pages without a title), `titleTemplate`, and `defaultDescription`
- `image`: share image of pages that do not set one. Replace `public/images/og-default.png` (1200x630) or remove
  `image` to omit it
- `locale` (`og:locale`) and `twitterSite` (X handle) are optional: their tags are omitted when not set
- `jsonLd`: schema.org nodes of every page (a `WebSite` node by default)

Set `SITE_URL` for each environment in `wrangler.jsonc`. Canonical, `og:url`, and `og:image` URLs use it, never the host
of the request.

A page whose routes set nothing gets the defaults: default title, description, and image, and a canonical URL of its own
path. A small app or an experiment needs no other changes.

## Route Values

Static values go in the `handle` of a route:

```tsx
import type { SeoHandle } from '@workspace/seo'

export const handle = {
  seo: {
    title: 'Pricing',
    description: 'Plans for teams of any size.',
  },
} satisfies SeoHandle
```

Values that depend on data are returned as `seo` from the loader:

```ts
import type { RouteSeoInput } from '@workspace/seo'

export async function loader({ params }: Route.LoaderArgs) {
  const post = await getPost(params.slug)

  return {
    post,
    seo: {
      title: post.title,
      description: post.summary, // null or empty text falls back to the parent route or the site default
      ogType: 'article',
      ogImage: post.imageUrl,
      jsonLd: { '@type': 'BlogPosting', headline: post.title, datePublished: post.publishedAt },
    } satisfies RouteSeoInput,
  }
}
```

Values:

- `title`: formatted with the title template (`Pricing | Acme`); `og:title` uses the title without the template
- `titleTemplate`: e.g. `'%s | Acme Blog'` for a section of the site; must contain `%s` (use `'%s'` for no suffix)
- `description`
- `canonical`: a path or URL. Defaults to the current path without a trailing slash or query string
- `noIndex`: renders `<meta name="robots" content="noindex">` and omits the canonical URL and `og:url`
- `ogTitle` and `ogDescription`: default to the title and description
- `ogType`: `website` (default), `article`, `profile`, or `product`
- `ogImage`: a URL or path, or `{ url, alt, width, height }`
- `jsonLd`: a schema.org node or an array of nodes (without `@context`)

### Merging

- Routes apply from the root to the leaf (the route that renders the page): for each route, the `handle` and then the
  loader data. A value replaces the value of parent routes.
- `null`, empty text, and missing keys keep the value of the parent route or the site default.
- `canonical` is read only from the leaf route: a layout cannot set the canonical URL of its child pages.
- Other values apply to child routes: e.g. `noIndex` in the `handle` of an account layout covers every account page.
- JSON-LD nodes of `SEO_CONFIG` and of all routes are combined into one `@graph`.

### Validation

TypeScript checks values written with `satisfies`. `<DocumentSeo />` also validates them with zod when it renders:
unknown keys (e.g. a typo such as `noindex`) and invalid values are errors.

- development: the page throws and the error page shows the route and the problem
- production: the values of that `handle` or loader data are ignored and the page uses the other values

## Error Pages

The root `ErrorBoundary` renders `<ErrorSeo />` instead: the title (e.g. `404 Not Found | Acme`) and `noindex`. Error
pages have no description, canonical URL, Open Graph tags, or JSON-LD, and do not read loader data (a failed loader may
be the cause of the error).

## Trailing Slashes

`trailingSlashMiddleware` (`app/middleware`) redirects GET and HEAD requests for a URL with a trailing slash to the URL
without it, e.g. `/example/?a=1` to `/example?a=1`:

- production: `308 Permanent Redirect`
- other environments: `307 Temporary Redirect` (because browsers cache permanent redirects e.g. on `localhost`)

Canonical and sitemap URLs never end with a slash (except the root `/`) per react-router convention.

Client navigation to a link with a trailing slash does not redirect, but the canonical URL of the page still omits it:
write links without a trailing slash.

Generate links with React Router's [`href()`](https://reactrouter.com/api/utils/href): it builds paths without a
trailing slash from the routes manifest with type-safe params, so a renamed or removed route fails the typecheck instead
of leaving a broken link.

## Notes

- Do not set the title, description, canonical URL, robots, Open Graph, or X (Twitter) tags with a route `meta` export
  or by rendering `<title>`, `<meta>`, or `<link rel="canonical">` in route components: they would duplicate the tags of
  `<DocumentSeo />`. The root still renders `<Meta />`, so `meta` exports work for other tags (refer to Not Included).
- Return SEO values from the loader with `await`: values that depend on a deferred promise (`<Await>`) would render
  after `<head>` was sent, and link preview bots do not run JavaScript.
- JSON-LD is rendered at the start of `<body>`, where search engines read it. Text is escaped so that it cannot end the
  script element (e.g. `</script>` in a post title). It is data, not a script that runs: the CSP does not apply to it.
- X (Twitter) reads `og:title`, `og:description`, and `og:image`: only `twitter:card` (pages with an image) and
  `twitter:site` (when set) are rendered.
- To show live state in the title (e.g. an unread count), set `document.title` in an effect: crawlers read the title of
  the server render.
- Robots rules outside production (`robots.txt` and `X-Robots-Tag`) do not depend on `noIndex`: refer to the SEO section
  of the [checklist](./checklist.md).

## Not Included

The `@workspace/seo` package covers what most sites need.

Add any of the following to `zRouteSeo` (`src/schema.ts`), `resolveSeo()` (`src/resolve.ts`), and `SeoTags`
(`src/components.tsx`) when a project requires it:

- `hreflang` alternate links for translated pages (if implementing i18n / internationalization)
- other meta tags such as `article:published_time` and `article:tag` (a route `meta` export can also render tags that
  `<DocumentSeo />` does not)
- robots directives other than `noindex` (e.g. `nofollow`, `max-image-preview:large`)
- values that are site-wide only: site name, `og:locale`, and the X handle of the site (no `twitter:creator`)
- types for JSON-LD nodes: [`schema-dts`](https://github.com/google/schema-dts) (types only, a dev dependency) e.g.
  `satisfies BlogPosting`
- a sitemap generated from the routes manifest: the included sitemap lists the paths of `SITEMAP_INCLUDE_PATHS` in
  `app/constants.ts`
