import { useEffect, useState } from 'react'
import { useRouteLoaderData } from 'react-router'

import { DEFAULT_THEME_MODE, type ThemeMode } from '@workspace/core/conventions'

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
 * Be careful when using this hook in SSR environments: this hook uses `window.matchMedia`
 * to figure out the effective system theme when the user's preference is 'system' and
 * the `window` object is not available on the server.
 *
 * This hook was originally created to support use with client-only components/libraries
 * such as `MDXEditor` to help implement light-dark support.
 *
 * This hook assumes react-router apps where the root loader returns a data object
 * with key `theme` via `useTheme()` dependency.
 *
 * @see {@link useTheme}
 */
export function useResolvedTheme(): Extract<ThemeMode, 'light' | 'dark'> {
  const userThemePreference = useTheme()
  const systemTheme = useSystemTheme()

  return userThemePreference === 'system' ? systemTheme : userThemePreference
}

/**
 * React hook that infers the system theme (light or dark) using `window.matchMedia`.
 *
 * Take care when using this hook in SSR contexts as it relies on `window.matchMedia`
 * which is not available on the server.
 *
 * Defaults to 'light'.
 *
 * @see {@link useResolvedTheme}
 */
export function useSystemTheme(): Extract<ThemeMode, 'light' | 'dark'> {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return 'light' // light as default for SSR
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }

    // listen for changes in the system theme
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return systemTheme
}
