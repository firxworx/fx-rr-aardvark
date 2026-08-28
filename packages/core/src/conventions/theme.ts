import z from 'zod'

/**
 * Type representing theme mode (light/dark/system).
 */
export type ThemeMode = z.infer<typeof zThemeMode>

export const THEME_MODES = ['dark', 'light', 'system'] as const
export const DEFAULT_THEME_MODE: ThemeMode = 'system'

export const zThemeMode = z.enum(THEME_MODES)

/**
 * Name of cookie that stores current theme mode (light/dark/system) in the browser.
 */
export const THEME_COOKIE_NAME = 'app_theme' as const

/**
 * Form input name for theme used by theme switch feature.
 */
export const THEME_INPUT_NAME = 'theme' as const

/**
 * Fetcher key (`react-router`) of fetcher used to handle theme change requests.
 */
export const THEME_FETCHER_KEY = 'theme'

/**
 * Standard non-i18n (no locale prefix) route for handling theme change requests from the client.
 */
export const APP_ACTIONS_THEME_PATHNAME = '/actions/theme' as const
