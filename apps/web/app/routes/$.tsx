import { data } from 'react-router'

/**
 * Catch-all route for paths that match no other route: responds with 404 and the root error boundary.
 *
 * Without it react-router also responds with 404, but the root loader does not run, so the error page ignores the
 * theme selected by the user.
 */
export async function loader(): Promise<never> {
  throw data(null, { status: 404 })
}

/**
 * Never rendered (the loader always throws). A route module without a default export is a resource route, which
 * would respond with the thrown response instead of the error page.
 */
export default function NotFoundRoute(): null {
  return null
}
