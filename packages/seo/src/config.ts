import type { JsonLdNode, SeoImage } from './schema'

/**
 * Site-wide SEO values: every page uses them unless its routes set their own.
 */
export interface SeoConfig {
  /** Name of the site for `og:site_name`. */
  siteName: string
  /** Title of pages that do not set a title (e.g. the home page); not formatted with the title template. */
  defaultTitle: string
  /** Formats page titles: `%s` is replaced by the title of the page, e.g. `'%s | Acme'`. */
  titleTemplate: string
  /** Description of pages that do not set one (omitted when not set). */
  defaultDescription?: string | undefined
  /** Share image of pages that do not set one (omitted when not set); 1200x630 is recommended. */
  image?: SeoImage | undefined
  /** Open Graph locale e.g. `en_US` (omitted when not set). */
  locale?: string | undefined
  /** X (Twitter) handle of the site including `@` (omitted when not set). */
  twitterSite?: string | undefined
  /** Schema.org nodes for every page (e.g. `WebSite`); receives the site URL to build absolute URLs. */
  jsonLd?: ((siteUrl: string) => JsonLdNode[]) | undefined
}
