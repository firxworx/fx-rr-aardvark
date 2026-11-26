import './closing-section.css'

import { cn } from '@workspace/ui/lib/style'
import { LayoutContainer } from '@/layout/app-layout'
import { Mascot } from './mascot'

/**
 * Decorative end of the home page: the mascot climbs out of its burrow (bottom border) on scroll.
 *
 * @see closing-section.css
 */
export function ClosingSection({ className }: { className?: string }): React.JSX.Element {
  return (
    <section className={cn('border-b border-border pt-12 sm:pt-16', className)}>
      <LayoutContainer className="flex justify-center">
        <div className="burrow">
          <Mascot className="burrow-climber block size-56 sm:size-72 lg:size-96" />
        </div>
      </LayoutContainer>
    </section>
  )
}
