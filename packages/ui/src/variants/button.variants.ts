import { cva } from 'class-variance-authority'
import { clsx } from 'cn'

const primaryVariantClassName = clsx(
  'bg-primary text-primary-foreground',
  'hover:bg-primary/90 active:bg-primary/90 data-pressed:bg-primary/90',
  '*:data-[slot=button-loading-indicator]:text-primary-foreground',
)

const defaultSize = clsx('h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2')
const defaultIconSize = clsx('size-8')

/**
 * Refer to `forms.css` for global form default styles that replace some of the shadcn/ui styles.
 *
 * Customized from shadcn/ui defaults with coss-ui compatibility, so components vendored from
 * either library render correctly against this single cva:
 *
 * - all shadcn + coss-ui variant/size names are present; `md`/`icon-md` retained as local
 *   aliases of `default`/`icon` (cva defaults remain variant `primary`, size `md`)
 * - `relative` on base: coss-ui's loading indicator is absolutely positioned within the button
 * - `data-loading:*` base styles pair with the custom Button's spin-delayed loading state
 * - per-variant `*:data-[slot=button-loading-indicator]:text-*` so the spinner stays visible
 *   while `data-loading:text-transparent` hides the label (spinner inherits currentColor)
 * - `data-pressed:*` alongside `active:*` for Base UI composed triggers (Menu.Trigger, etc.)
 * - corner radius comes from the `rounded-control` semantic token (see globals.css)
 *
 * Destructive is split by use case:
 *
 * - `destructive`: hard — solid destructive bg with white text (coss-ui / current shadcn style);
 *   this is what vendored components expect when they pass `variant="destructive"`
 * - `destructive-outline`: coss-ui's outline treatment with destructive hover affordance
 *
 * Colors are coss-ui/shadcn tokens (see shadcn.css) except for links (see palette.css). The tokens are defined with
 * light-dark() so there are no `dark:` overrides. Hover states use the opacity modifier as coss-ui does, except for
 * `secondary`: its token is nearly transparent so a lower opacity is not visible.
 *
 * Note `clsx()` is employed for developer ergonomics including intellisense and autocomplete.
 */
export const buttonVariants = cva(
  clsx(
    'group/button relative select-none outline-none touch-manipulation',
    'inline-flex items-center justify-center shrink-0 border transition-all',
    'rounded-control', // custom semantic token for button/input radius
    'text-sm font-medium whitespace-nowrap',
    'border-transparent bg-clip-padding',

    // disabled styles (verify vs. forms.css globals to avoid duplication)
    'disabled:pointer-events-none disabled:opacity-50',

    // coss-ui loading state (Button sets data-loading + renders the indicator after the spin delay)
    'data-loading:select-none data-loading:text-transparent',

    // focus styles
    'focus-visible:cx-focus-ring',
    'aria-invalid:focus-visible:cx-focus-ring-invalid',
    'aria-invalid:border-destructive',

    // child svg icon styles
    "[&_svg:not([class*='size-'])]:size-4",
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',

    // touch target: expand hit area to ≥44px on coarse pointers (Apple HIG / WCAG 2.5.5)
    'pointer-coarse:after:absolute pointer-coarse:after:inset-0 pointer-coarse:after:m-auto',
    'pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11',
  ),
  {
    variants: {
      variant: {
        default: primaryVariantClassName,
        primary: primaryVariantClassName,
        outline: clsx(
          'border-input bg-popover text-foreground',
          'hover:bg-accent/50 hover:text-foreground active:bg-accent/50 data-pressed:bg-accent/50',
          'aria-expanded:bg-accent/50 aria-expanded:text-foreground',
          '*:data-[slot=button-loading-indicator]:text-foreground',
        ),
        secondary: clsx(
          'bg-secondary text-secondary-foreground',
          'hover:bg-secondary-foreground/8 active:bg-secondary-foreground/8 data-pressed:bg-secondary-foreground/8',
          'aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
          '*:data-[slot=button-loading-indicator]:text-secondary-foreground',
        ),
        ghost: clsx(
          'hover:bg-accent hover:text-foreground active:bg-accent data-pressed:bg-accent',
          'aria-expanded:bg-accent aria-expanded:text-foreground',
          '*:data-[slot=button-loading-indicator]:text-foreground',
        ),
        destructive: clsx(
          'bg-destructive text-white',
          'hover:bg-destructive/90 active:bg-destructive/90 data-pressed:bg-destructive/90',
          'focus-visible:cx-focus-ring-invalid',
          '*:data-[slot=button-loading-indicator]:text-white',
        ),
        // coss-ui
        'destructive-outline': clsx(
          'border-input bg-popover text-destructive-foreground',
          'hover:border-destructive active:border-destructive data-pressed:border-destructive',
          'focus-visible:cx-focus-ring-invalid',
          '*:data-[slot=button-loading-indicator]:text-destructive-foreground',
        ),
        link: clsx(
          'text-P-link underline-offset-4',
          'hover:text-P-link-hover hover:underline data-pressed:underline',
          '*:data-[slot=button-loading-indicator]:text-P-link',
        ),
      },
      size: {
        default: defaultSize,
        xs: clsx(
          'h-6 gap-1 rounded-[min(var(--radius-control),10px)] px-2 text-xs',
          'in-data-[slot=button-group]:rounded-control',
          'has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5',
          "[&_svg:not([class*='size-'])]:size-3",
        ),
        sm: clsx(
          'h-7 gap-1 rounded-[min(var(--radius-control),12px)] px-2.5 text-[0.8rem]',
          'in-data-[slot=button-group]:rounded-control',
          'has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5',
          "[&_svg:not([class*='size-'])]:size-3.5",
        ),
        md: defaultSize, // custom alias of 'default'
        lg: clsx('h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pe-2.5 has-data-[icon=inline-start]:ps-2.5'),
        xl: clsx(
          'h-10 gap-2 px-3.5 text-base',
          'has-data-[icon=inline-end]:pe-3 has-data-[icon=inline-start]:ps-3',
          "[&_svg:not([class*='size-'])]:size-4.5",
        ),
        // custom visual size that meets Apple guidelines (44px)
        tap: clsx(
          'h-11 gap-2 px-4 text-base',
          'has-data-[icon=inline-end]:pe-3.5 has-data-[icon=inline-start]:ps-3.5',
          "[&_svg:not([class*='size-'])]:size-5",
        ),
        icon: defaultIconSize,
        'icon-xs': clsx(
          'size-6 rounded-[min(var(--radius-control),10px)]',
          "in-data-[slot=button-group]:rounded-control [&_svg:not([class*='size-'])]:size-3",
        ),
        'icon-sm': clsx('size-7 rounded-[min(var(--radius-control),12px)] in-data-[slot=button-group]:rounded-control'),
        'icon-md': defaultIconSize, // custom alias of 'icon'
        'icon-lg': clsx('size-9'),
        'icon-xl': clsx("size-10 [&_svg:not([class*='size-'])]:size-5"),
        // custom visual size that meets Apple guidelines (44px)
        'icon-tap': clsx("size-11 [&_svg:not([class*='size-'])]:size-5.5"),
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)
