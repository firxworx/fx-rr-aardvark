'use client'

/**
 * Simple animated spinner with default `role="status"` and `aria-label="Loading"`.
 * @module
 */

import { Loader2Icon } from 'lucide-react'

import { cn } from '@workspace/ui/lib/style'

export function Spinner({ className, ...restProps }: React.ComponentProps<'svg'>): React.JSX.Element {
  return (
    <Loader2Icon role="status" aria-label="Loading" className={cn('size-4 animate-spin', className)} {...restProps} />
  )
}
