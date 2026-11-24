import { type CnFunction, createCn } from 'cn/config'

/*
 * Although it is not done here remember that you can also customize class-variance-authority (cva)
 * e.g. https://github.com/piotrkulpinski/openalternative/blob/main/utils/cva.ts
 */

/**
 * Legendary `cn()` utility as popularized by shadcn/ui for intelligently merging TailwindCSS classnames.
 *
 * Built with `createCn()` so that custom classes and theme tokens merge correctly: always import `cn` from this module
 * and not from the `cn` package. To join class names without merging, `import { clsx } from 'cn'`.
 *
 * The `<never, never>` type arguments make unknown class group and theme ids a type error. To add a custom class group
 * or theme scale, pass its id as the first or second type argument respectively.
 */
export const cn: CnFunction = createCn<never, never>({
  extend: {
    // register custom tokens here: keep in sync with `@theme` in `styles/globals.css`
    theme: {
      container: ['layout', 'typeset'],
      radius: ['control', 'control-wrapper'],
    },
  },
})
