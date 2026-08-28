import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/*
 * Although it is not done here remember that you can also customize class-variance-authority (cva)
 * e.g. https://github.com/piotrkulpinski/openalternative/blob/main/utils/cva.ts
 */

/**
 * Lightweight utility to concatenate multiple css classnames separated by spaces; omits falsey values.
 */
export function cx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Extended tailwind-merge.
 * Register any custom classes and utilities here so they can be merged correctly.
 */
const twMerge = extendTailwindMerge({
  override: {},
  extend: {
    classGroups: {
      'font-size': [
        // built-in font sizes
        'text-xs',
        'text-s',
        'text-m',
        'text-l',
        'text-2xl',

        // ... add custom sizes here ...
      ],
    },
  },
})

/**
 * Legendary `cn()` utility as popularized by shadcn/ui for intelligently merging TailwindCSS classnames
 * via a combination of `clsx` and `tailwind-merge`.
 */
export function cn(...args: ClassValue[]): string {
  return twMerge(clsx(args))
}
