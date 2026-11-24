import { href, NavLink } from 'react-router'
import clsx from 'clsx'

import { cn } from '@workspace/ui/lib/style'
import { APP_NAME, MAIN_ELEMENT_ID, NAV_LINKS } from '@/constants'
import { ThemeSelector } from '@/layout/theme-selector'

type LayoutElementType = 'div' | 'main' | 'section' | 'article' | 'header' | 'footer'

interface LayoutContainerProps extends React.ComponentProps<'div'> {
  as?: LayoutElementType
}

interface AppLayoutProps extends Omit<React.ComponentProps<'div'>, 'id'> {}

interface PageLayoutProps extends Omit<React.ComponentProps<'main'>, 'id'> {
  variant?: 'container' | 'full-width'
}

const layoutContainerClassName = clsx('mx-auto w-full max-w-layout px-4 sm:px-6')

export function LayoutContainer({
  as = 'div',
  className,
  children,
  ...restProps
}: LayoutContainerProps): React.JSX.Element {
  const Comp = as

  return (
    <Comp data-slot="container" className={cn(layoutContainerClassName, className)} {...restProps}>
      {children}
    </Comp>
  )
}

/**
 * Root layout for the application intended to render as a child of document body (see `root.tsx`).
 * Implements recommendation from Base UI docs to use a root div element with `isolation:isolate`.
 */
export function AppLayout({ className, children, ...restProps }: AppLayoutProps): React.JSX.Element {
  return (
    <div id="root" className={cn('root isolate flex min-h-svh flex-col', className)} {...restProps}>
      <header className="border-b border-border outline-none">
        <LayoutContainer className="grid grid-cols-[1fr_auto_1fr] items-center gap-6 h-16 text-base">
          <NavLink to={href('/')} viewTransition className="block col-start-1 justify-self-start font-bold">
            {APP_NAME}
          </NavLink>
          {/* explicit `col-start` required because below `md` the nav is hidden and dropped from grid auto-placement */}
          {Array.isArray(NAV_LINKS) && NAV_LINKS.length > 0 && (
            <nav aria-label="Main" className="col-start-2 hidden items-center gap-8 justify-self-center md:flex">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={`${link.label}-${link.to.toString()}`}
                  to={link.to}
                  className={cn(
                    'rounded-sm font-medium text-muted-foreground transition-colors',
                    'aria-[current=page]:text-foreground',
                    'hover:text-foreground focus-visible:cx-focus-ring',
                  )}
                  viewTransition
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          )}
          {/* placeholder for right-side content (e.g. auth menu, theme selector, etc.) */}
          <div className="col-start-3 flex items-center justify-self-end gap-6">&nbsp;</div>
        </LayoutContainer>
      </header>
      {children}
      <footer className="border-t border-border py-4">
        <LayoutContainer className="flex items-center justify-center">
          <ThemeSelector />
        </LayoutContainer>
      </footer>
    </div>
  )
}

/**
 * Page layout renders a `<main>` element and children; for routes that render a page under AppLayout.
 */
export function PageLayout({
  variant = 'container',
  className,
  children,
  ...restProps
}: PageLayoutProps): React.JSX.Element {
  return (
    <main id={MAIN_ELEMENT_ID} className={cn('flex-1', className)} {...restProps}>
      {variant === 'container' ? (
        <LayoutContainer as="section" className="py-8">
          {children}
        </LayoutContainer>
      ) : (
        children
      )}
    </main>
  )
}
