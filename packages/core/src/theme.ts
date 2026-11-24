import * as z from 'zod'

/**
 * Supported theme modes: `system` follows the user's OS/browser color scheme preference.
 */
export const THEME_MODES = ['dark', 'light', 'system'] as const

/**
 * Zod schema for validating a theme mode (e.g. from a cookie or form input).
 */
export const zThemeMode = z.enum(THEME_MODES)

/**
 * Type representing theme mode (light/dark/system).
 */
export type ThemeMode = z.infer<typeof zThemeMode>

export const DEFAULT_THEME_MODE: ThemeMode = 'system'

/**
 * Name of cookie that stores current theme mode (light/dark/system) in the browser.
 */
export const THEME_COOKIE_NAME = 'app_theme'

/**
 * Form input name for theme used by theme switch feature.
 */
export const THEME_INPUT_NAME = 'theme'

/**
 * Fetcher key (`react-router`) of fetcher used to handle theme change requests.
 *
 * Reserved for an optimistic (instant) theme switch: submit the theme form with this fetcher key and
 * read the pending value in the root via `useFetchers()` to prefer it over the root loader's theme.
 *
 * @public
 */
export const THEME_FETCHER_KEY = 'theme'

/**
 * Standard non-i18n (no locale prefix) route for handling theme change requests from the client.
 */
export const APP_ACTIONS_THEME_PATHNAME = '/actions/theme'
