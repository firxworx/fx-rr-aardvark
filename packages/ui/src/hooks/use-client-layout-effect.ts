import { useEffect, useLayoutEffect } from 'react'

/**
 * @see vite-env.d.ts
 */
const IS_SERVER = import.meta.env.SSR
const IS_CLIENT = !IS_SERVER

/**
 * Run `useLayoutEffect()` on client-side only to avoid a server warning.
 * Falls back to `useEffect()` on the server which is a no-op in React.
 *
 * Essentially this implementation exploits that for typing and API consistency.
 *
 * This type of hook is often referred to as `useIsomorphicLayoutEffect()`.
 */
export const useClientLayoutEffect = IS_CLIENT ? useLayoutEffect : useEffect
