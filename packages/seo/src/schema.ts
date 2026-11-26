import * as z from 'zod'

/**
 * Optional text that accepts `null` (e.g. a nullable database column): text is trimmed and empty text becomes
 * `undefined` so that the value of a parent route or the site default applies.
 *
 * `.optional()` wraps the transform: inside it the key would be required (`{ title: string | undefined }`).
 */
const zOptionalText = z
  .string()
  .nullable()
  .transform((value) => {
    const trimmed = value?.trim()

    return trimmed === undefined || trimmed === '' ? undefined : trimmed
  })
  .optional()

const zSeoImageObject = z.strictObject({
  /** Absolute URL or a path on the site. */
  url: z.string().trim().min(1),
  alt: zOptionalText,
  width: z.int().positive().optional(),
  height: z.int().positive().optional(),
})

/**
 * Image as a URL or an object; a URL becomes `{ url }` and `null` or an empty URL becomes `undefined`.
 */
const zSeoImage = z
  .union([z.string(), zSeoImageObject])
  .nullable()
  .transform((value) => {
    if (value === null) {
      return undefined
    }

    if (typeof value === 'string') {
      const url = value.trim()

      return url === '' ? undefined : { url }
    }

    return value
  })
  .optional()

/**
 * Schema.org node: `@type` is required and any other property is allowed.
 */
const zJsonLdNode = z.looseObject({
  '@type': z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
})

const zJsonLd = z
  .union([zJsonLdNode, z.array(zJsonLdNode)])
  .nullable()
  .transform((value) => {
    if (value === null) {
      return undefined
    }

    return Array.isArray(value) ? value : [value]
  })
  .optional()

/**
 * SEO values of a route, from its `handle` or its loader data (refer to docs/seo.md).
 *
 * Strict: an unknown key (e.g. a typo such as `noindex`) fails validation. No `.default()`: zod v4 applies defaults
 * to optional keys, which would replace values set by parent routes. Defaults come from `SeoConfig`.
 */
export const zRouteSeo = z.strictObject({
  /** Page title, formatted with the title template. */
  title: zOptionalText,
  /** Title template for this route and its child routes: `%s` is replaced by the title, e.g. `'%s | Acme Blog'`. */
  titleTemplate: z.string().includes('%s', { error: 'titleTemplate must contain %s' }).optional(),
  description: zOptionalText,
  /** Canonical URL or path of this route only (not inherited); defaults to the current pathname without a query. */
  canonical: zOptionalText,
  /** Ask search engines not to index the page (inherited by child routes); omits the canonical URL and `og:url`. */
  noIndex: z.boolean().optional(),
  /** Defaults to the page title (without the template). */
  ogTitle: zOptionalText,
  /** Defaults to the description. */
  ogDescription: zOptionalText,
  ogType: z.enum(['website', 'article', 'profile', 'product']).optional(),
  ogImage: zSeoImage,
  /** Schema.org nodes, added to the JSON-LD graph of the page with those of parent routes. */
  jsonLd: zJsonLd,
})

/**
 * SEO values accepted from routes (e.g. `null` from a database): `return { post, seo: { ... } satisfies RouteSeoInput }`.
 */
export type RouteSeoInput = z.input<typeof zRouteSeo>

/** SEO values of a route after validation. */
export type RouteSeo = z.output<typeof zRouteSeo>

export type SeoImage = z.output<typeof zSeoImageObject>

export type JsonLdNode = z.output<typeof zJsonLdNode>

/** Type of a route `handle` that sets SEO values: `export const handle = { seo: { ... } } satisfies SeoHandle`. */
export interface SeoHandle {
  seo?: RouteSeoInput
}
