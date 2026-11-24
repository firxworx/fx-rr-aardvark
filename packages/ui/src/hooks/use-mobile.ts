import * as React from 'react'

import { MOBILE_BREAKPOINT_PX } from '../constants'

/**
 * Return a boolean indicating if the viewport is narrower than the mobile breakpoint; always false during SSR.
 *
 * Name and path follow the shadcn/ui convention so registry components (e.g. sidebar) can import it.
 *
 * @public
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT_PX)
    }
    mql.addEventListener('change', onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT_PX)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}
