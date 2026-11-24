/**
 * React `<ViewTransition>` boundary for route content, keyed so a route change mounts a new boundary:
 * the old page exits and the new page enters, styled with the `route` view transition class (`globals.css`).
 *
 * `update="none"`: re-renders within the same route (pending UI, revalidation, search params, fetchers such as the
 * theme form) start no view transition. The react-router docs show a persistent (unkeyed) boundary instead but then
 * React starts a view transition for the navigation's pending-state commit and the route commit waits for it to end.
 *
 * A key change remounts `children` so page state resets on a param change (`/posts/1` → `/posts/2`).
 * To keep it, pass a `transitionKey` that ignores params (e.g. the route id); param changes then do not animate.
 *
 * Enter/exit only fire when the boundary is above every DOM node of the content: wrap `<Outlet />` directly.
 *
 * @see https://reactrouter.com/how-to/view-transitions
 * @see https://react.dev/reference/react/ViewTransition
 *
 * @module
 */

import { ViewTransition } from 'react'
import { useLocation } from 'react-router'

interface RouteTransitionProps {
  /** Changing the key animates a route change; default `pathname`. */
  transitionKey?: string
  children: React.ReactNode
}

export function RouteTransition({ transitionKey, children }: RouteTransitionProps): React.JSX.Element {
  const { pathname } = useLocation()

  return (
    <ViewTransition key={transitionKey ?? pathname} enter="route" exit="route" update="none" default="none">
      {children}
    </ViewTransition>
  )
}
