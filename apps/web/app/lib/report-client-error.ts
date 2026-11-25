import { isRouteErrorResponse } from 'react-router'

type ClientErrorContext = {
  /** What reported the error: react-router (loaders, actions, navigation) or react (rendering, hydration). */
  source: 'router' | 'react-caught' | 'react-uncaught' | 'react-recoverable'

  /** Route pattern e.g. `users/:id` (vs. the URL which may include personal data). */
  pattern?: string | undefined

  componentStack?: string | null | undefined
}

/**
 * Report an error that was caught on the client by react-router or react: attach an error tracker here.
 *
 * Errors in event handlers, timers, and unhandled promise rejections are not reported here. Error trackers usually
 * listen for those with the `error` and `unhandledrejection` events of `window`.
 *
 * Refer to `handleError` in `entry.server.tsx` for errors on the server.
 *
 * @see https://reactrouter.com/how-to/error-reporting
 */
export function reportClientError(error: unknown, context: ClientErrorContext): void {
  // skip 404 errors (expected in normal operation)
  if (isRouteErrorResponse(error) && error.status === 404) {
    return
  }

  // biome-ignore lint/suspicious/noConsole: client code (the logger is for server code)
  console.error('Client error:', error, context)
}
