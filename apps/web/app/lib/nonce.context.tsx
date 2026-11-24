import { createContext, useContext } from 'react'

/*
 * Context and hook for Content Security Policy (CSP) nonce.
 *
 * Nonces are used in CSP to allow specific inline scripts or styles that would
 * otherwise be blocked by the policy.
 *
 * The provider wraps `<ServerRouter>` in `entry.server.tsx` and `<HydratedRouter>` in
 * `entry.client.tsx` so components in `root.tsx` can populate the `nonce` prop of
 * components that inject scripts and/or styles to the DOM.
 *
 * The client must render the same nonce as the server: React 19.3+ compares the `nonce`
 * property during hydration. Browsers hide the `nonce` attribute but keep the property,
 * so the client reads it from the `<meta property="csp-nonce">` tag rendered in `root.tsx`
 * (also the Vite dev client convention for nonce-ing its injected styles).
 *
 * Note Base UI's `<CSPProvider>` has historically flaky support with react-router nonce
 * so the need for it is eliminated by disabling style injection and including required
 * styles in the global stylesheet.
 *
 * @see https://base-ui.com/react/utils/csp-provider
 * @see https://reactrouter.com/how-to/security
 */

/**
 * `property` value of the `<meta>` tag that carries the nonce to the client.
 */
export const CSP_NONCE_META_PROPERTY = 'csp-nonce'

/**
 * Read the nonce from the `<meta property="csp-nonce">` tag on the client.
 *
 * Reads the `nonce` property because browsers hide the attribute value.
 */
export function getDocumentNonce(): string {
  return document.querySelector<HTMLMetaElement>(`meta[property="${CSP_NONCE_META_PROPERTY}"]`)?.nonce ?? ''
}

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
