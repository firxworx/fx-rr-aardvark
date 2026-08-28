'use client'

/**
 * Customized `Button` and `ButtonProps` interface for use with other button-like components;
 * an expansion of coss-ui's button component.
 *
 * Customization vs. stock coss-ui:
 * - `showSpinner` escape hatch: when `false`, a pending button disables without ever
 *   entering the visual loading state (no `data-loading`, label remains visible).
 *
 * With coss-ui's implementation (vs other popular component registries), the component composes
 * event handlers added via props instead of overwriting them.
 *
 * @module
 */

import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import type { VariantProps } from 'class-variance-authority'

import { Spinner } from '@workspace/ui/components/spinner'
import { cn } from '@workspace/ui/lib/style'
import { buttonVariants } from '@workspace/ui/variants/button.variants'

export interface ButtonProps extends useRender.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  /**
   * Pending/loading state (coss-ui-compatible): disables the button immediately and, after
   * the spin delay elapses, applies `data-loading` and renders the loading indicator.
   */
  loading?: boolean

  /**
   * Set `false` to keep the label visible while pending (button still disables).
   *
   * @default true
   */
  showSpinner?: boolean
}

export function Button({
  className,
  variant,
  size,
  render,
  children,
  loading = false,
  showSpinner = true,
  disabled: disabledProp,
  ...props
}: ButtonProps): React.ReactElement {
  const isDisabled: boolean = Boolean(loading || disabledProp)
  const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>['type'] = render ? undefined : 'button'
  const defaultProps = {
    children: (
      <>
        {children}
        {loading && showSpinner && (
          <Spinner className="pointer-events-none absolute" data-slot="button-loading-indicator" />
        )}
      </>
    ),
    className: cn(buttonVariants({ className, size, variant })),
    'aria-disabled': loading || undefined,
    'data-loading': loading ? '' : undefined,
    'data-slot': 'button',
    disabled: isDisabled,
    type: typeValue,
  }
  return useRender({
    defaultTagName: 'button',
    props: mergeProps<'button'>(defaultProps, props),
    render,
  })
}
