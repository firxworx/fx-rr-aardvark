import { createContext, useContext } from 'react'

/*
 * Context and hook for Content Security Policy (CSP) nonce.
 *
 * Nonces are used in CSP to allow specific inline scripts or styles that would
 * otherwise be blocked by the policy.
 *
 * The provider should wrap `<ServerRouter>` in `entry.server.tsx` to provide the
 * nonce to server-rendered components in `root.tsx` so they can populate the
 * `nonce` prop of components that inject scripts and/or styles to the DOM.
 *
 * Note Base UI's `<CSPProvider>` has historically flaky support with react-router nonce
 * so the need for it is eliminated by disabling style injection and including required
 * styles in the global stylesheet.
 *
 * @see https://base-ui.com/react/utils/csp-provider
 */

/**
 * React context for storing the CSP nonce value.
 */
const NonceContext = createContext<string>('')

/**
 * React context provider component provides the CSP nonce value to its children.
 */
export function NonceContextProvider({
  nonce,
  children,
}: {
  nonce: string
  children: React.ReactNode
}): React.JSX.Element {
  return <NonceContext.Provider value={nonce}>{children}</NonceContext.Provider>
}

/**
 * React hook to access the current CSP nonce value from react context `NonceContext`.
 *
 * @returns The current nonce string
 */
export const useNonceContext = () => useContext(NonceContext)
