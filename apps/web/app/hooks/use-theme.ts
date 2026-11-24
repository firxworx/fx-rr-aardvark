import { useSyncExternalStore } from 'react'
import { useRouteLoaderData } from 'react-router'

import { DEFAULT_THEME_MODE, type ThemeMode } from '@workspace/core/theme'

type ResolvedTheme = Exclude<ThemeMode, 'system'>

const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)'

/**
 * React hook for `react-router` apps that returns the current theme mode: `light`, `dark`, or `system`.
 *
 * Assumes the root loader returns an object that includes `theme` key.
 */
export function useTheme(): ThemeMode {
  const data = useRouteLoaderData<Record<'theme', ThemeMode>>('root')
  return data?.theme ?? DEFAULT_THEME_MODE
}

/**
 * React hook that returns the _effective_ theme mode on the client: `light` or `dark`.
 *
 * Most UI does not need this hook because styles use css `light-dark()`. It is intended for client libraries
 * that must be told the theme (e.g. code editors, charts, maps).
 *
 * The system theme is unknown on the server so `system` resolves to `light` for SSR and hydration;
 * the component re-renders with the actual system theme after hydration.
 *
 * This hook assumes react-router apps where the root loader returns a data object
 * with key `theme` via `useTheme()` dependency.
 *
 * @see {@link useTheme}
 * @public
 */
export function useResolvedTheme(): ResolvedTheme {
  const userThemePreference = useTheme()
  const systemTheme = useSystemTheme()

  return userThemePreference === 'system' ? systemTheme : userThemePreference
}

function useSystemTheme(): ResolvedTheme {
  return useSyncExternalStore(subscribeToSystemTheme, getSystemTheme, getServerSystemTheme)
}

function subscribeToSystemTheme(onChange: () => void): () => void {
  const mediaQuery = window.matchMedia(DARK_MEDIA_QUERY)
  mediaQuery.addEventListener('change', onChange)

  return () => mediaQuery.removeEventListener('change', onChange)
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_MEDIA_QUERY).matches ? 'dark' : 'light'
}

function getServerSystemTheme(): ResolvedTheme {
  return 'light'
}
