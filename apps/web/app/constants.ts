import { href } from 'react-router'

export const IS_DEV_BUILD = import.meta.env.DEV
export const IS_PROD_BUILD = import.meta.env.PROD

export const APP_NAME = 'Acme'
export const DEFAULT_LOCALE = 'en' as const

export const MAIN_ELEMENT_ID = 'main'

export const DEFAULT_META_TITLE = 'Acme'
export const DEFAULT_META_DESCRIPTION = 'React Router SSR starter app template in a pnpm workspace.'

export const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Example', to: '/example' },
] satisfies
  | {
      to: Parameters<typeof href>[0]
      label: string
      title?: string | undefined
    }[]
  | undefined

/**
 * Paths to include in the sitemap (refer to sitemap resource route).
 *
 * Exclude any reserved routes as required (e.g. `actions`, `api`, `auth`, etc.).
 * Ensure the `robots.txt` route is compatible with the sitemap and specifies required `Disallow` rules.
 */
export const SITEMAP_INCLUDE_PATHS: string[] = [href('/')]
