import { useCallback, useEffect, useRef, useState } from 'react'
import { useFetcher } from 'react-router'

import {
  APP_ACTIONS_THEME_PATHNAME,
  THEME_FETCHER_KEY,
  THEME_INPUT_NAME,
  type ThemeMode,
} from '@workspace/core/conventions'
import { useTheme } from './use-theme'

/**
 * Applies the theme class to `<html>` exactly the way the server does, so the optimistic
 * client update and the subsequent root revalidation agree and nothing flashes.
 *
 * `system` intentionally removes both classes and falls through to the
 * `prefers-color-scheme` branch in the stylesheet.
 */
export function applyDocumentThemeClass(nextTheme: ThemeMode): void {
  const root = document.documentElement

  root.classList.remove('light', 'dark')

  if (nextTheme !== 'system') {
    root.classList.add(nextTheme)
  }
}

/**
 * Runs `apply()` inside a view transition when the browser supports it and the user has not
 * asked for reduced motion.
 *
 * Resolves when the crossfade has finished (or immediately when there was nothing to run).
 * Callers that need to animate something else — closing a drawer, say — should await this
 * rather than guess at a delay: starting another animation inside the transition window means
 * competing with the `::view-transition` pseudo tree for the frames.
 */
export function startThemeViewTransition(apply: () => void): Promise<void> {
  if (typeof document === 'undefined') {
    apply()
    return Promise.resolve()
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const supportsViewTransitions =
    'startViewTransition' in document && typeof document.startViewTransition === 'function'

  if (prefersReducedMotion || !supportsViewTransitions) {
    apply()
    return Promise.resolve()
  }

  const transition = document.startViewTransition(apply)

  // `finished` promise rejects when the browser skips the transition (e.g. route transition already in flight)
  // for sequencing purposes a skipped transition is a finished one
  return transition.finished.catch(() => undefined)
}

export interface UseOptimisticThemeResult {
  /** Server truth, from the root loader. */
  theme: ThemeMode
  /** What the UI should render: the optimistic value while in flight, otherwise `theme`. */
  displayTheme: ThemeMode
  /** The value being written, or `null` when idle. Use for per-option pending affordances. */
  pendingTheme: ThemeMode | null
  isPending: boolean
  /** Resolves once the view transition has finished, not when the server round-trip lands. */
  setTheme: (nextTheme: ThemeMode) => Promise<void>
}

/**
 * Owns the theme write: optimistic local state, the `<html>` class swap inside a view
 * transition, the POST to the theme resource route, and the settle/rollback bookkeeping.
 *
 * Every consumer shares one fetcher key, so a switch in the desktop header and a drawer on
 * mobile observe the same pending state.
 */
export function useOptimisticTheme(): UseOptimisticThemeResult {
  const wasPendingRef = useRef<boolean>(false)
  const appliedThemeRef = useRef<ThemeMode | null>(null)

  const [optimisticTheme, setOptimisticTheme] = useState<ThemeMode | null>(null)

  const theme = useTheme()

  const fetcher = useFetcher<null>({ key: THEME_FETCHER_KEY })
  const { submit } = fetcher

  const isPending = fetcher.state !== 'idle'

  // lock the UI to the optimistic theme so the fetcher's brief empty state can't flip it back
  const displayTheme = optimisticTheme ?? theme

  // release the lock once the action and the root revalidation have both settled
  useEffect(() => {
    if (isPending) {
      wasPendingRef.current = true
      return
    }

    if (!wasPendingRef.current) {
      return
    }

    wasPendingRef.current = false
    setOptimisticTheme(null)

    // on failure the root loader still holds the old value while <html> carries the optimistic
    // class; React won't correct it on its own because its `className` prop never changed
    if (appliedThemeRef.current !== null && appliedThemeRef.current !== theme) {
      applyDocumentThemeClass(theme)
    }

    appliedThemeRef.current = null
  }, [isPending, theme])

  const setTheme = useCallback(
    (nextTheme: ThemeMode): Promise<void> => {
      if (nextTheme === (optimisticTheme ?? theme)) {
        return Promise.resolve()
      }

      setOptimisticTheme(nextTheme)
      appliedThemeRef.current = nextTheme

      // a fetcher keeps this out of the navigation stack so an in-flight route transition is untouched
      submit({ [THEME_INPUT_NAME]: nextTheme }, { method: 'POST', action: APP_ACTIONS_THEME_PATHNAME })

      // no flushSync: local state drives the control's own affordances, the view transition only
      // crossfades the document-level color swap, and the two are free to run independently
      return startThemeViewTransition(() => applyDocumentThemeClass(nextTheme))
    },
    [optimisticTheme, theme, submit],
  )

  return { theme, displayTheme, pendingTheme: optimisticTheme, isPending, setTheme }
}
