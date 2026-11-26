import * as React from 'react'

interface MascotProps extends Omit<React.ComponentProps<'svg'>, 'children'> {
  /** Accessible name; omit when the mascot is decorative (hidden from assistive technology). */
  title?: string
}

/**
 * Aardvark mascot of the app: 200x200 by default, size it with `className` (e.g. `size-32`).
 *
 * Inline SVG renders with the first paint (no request). Ids are unique per instance so it can render more than once
 * on a page.
 *
 * The viewBox starts at y -0.5 so the outlines of the feet (bottom at 199.5) end flush with the bottom edge: the
 * mascot stands on a border with no gap.
 */
export function Mascot({ title, ...props }: MascotProps): React.JSX.Element {
  const id = React.useId()
  const clipId = `${id}-clip`
  const titleId = `${id}-title`
  const hasTitle = title !== undefined && title !== ''

  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: named by <title> when `title` is set, otherwise aria-hidden
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={200}
      height={200}
      viewBox="0 -0.5 200 200"
      role={hasTitle ? 'img' : undefined}
      aria-labelledby={hasTitle ? titleId : undefined}
      aria-hidden={hasTitle ? undefined : true}
      {...props}
    >
      {hasTitle ? <title id={titleId}>{title}</title> : null}
      <defs>
        <clipPath id={clipId}>
          <path d="M56 196c-22 0-28-30-24-56 4-32 26-68 64-76 22-5 42 2 54 24 12 5 26 7 38 11 11.5 3 11.5 19-5 22-15 2-29 0-41-1 4 20 0 48-16 76Z" />
        </clipPath>
      </defs>
      <path
        fill="#c68870"
        stroke="#3d2b24"
        strokeLinejoin="round"
        strokeWidth="7"
        d="M108 66c-2-28 10-56 24-56s14 34-4 62Z"
      />
      <path fill="#e39088" d="M115 62c0-20 8-41 16-41 7 0 6 21-5 44Z" />
      <path
        fill="#d99b82"
        stroke="#3d2b24"
        strokeLinejoin="round"
        strokeWidth="7"
        d="M66 196c-38 0-62-12-62-36 0-10 11-10 13-1 3 13 17 15 37 5Z"
      />
      <path
        fill="#c68870"
        stroke="#3d2b24"
        strokeLinejoin="round"
        strokeWidth="7"
        d="M126 144c12 2 20 18 22 34 10 2 14 8 12 14-1 3-4 4-10 4h-24Z"
      />
      <path stroke="#3d2b24" strokeLinecap="round" strokeWidth="4.5" d="M151 195v-6" />
      <path
        fill="#d99b82"
        d="M56 196c-22 0-28-30-24-56 4-32 26-68 64-76 22-5 42 2 54 24 12 5 26 7 38 11 11.5 3 11.5 19-5 22-15 2-29 0-41-1 4 20 0 48-16 76Z"
      />
      <g clipPath={`url(#${clipId})`}>
        <path fill="#f3cfc0" d="M146 124c6 22 2 54-16 74h-24c-4-30 4-62 26-76Z" />
        <ellipse cx="190" cy="110" fill="#f29f97" rx="12" ry="16" transform="rotate(8 190 110)" />
        <path fill="none" stroke="#3d2b24" strokeWidth="4.5" d="M181 95c-4 10-4 19-1 29" />
      </g>
      <path
        fill="none"
        stroke="#3d2b24"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="7"
        d="M56 196c-22 0-28-30-24-56 4-32 26-68 64-76 22-5 42 2 54 24 12 5 26 7 38 11 11.5 3 11.5 19-5 22-15 2-29 0-41-1 4 20 0 48-16 76Z"
      />
      <ellipse cx="184.5" cy="109.5" fill="#3d2b24" rx="1.6" ry="2.7" transform="rotate(8 184.5 109.5)" />
      <ellipse cx="190" cy="110.2" fill="#3d2b24" rx="1.4" ry="2.4" transform="rotate(8 190 110.2)" />
      <circle cx="132" cy="94" r="7.5" fill="#3d2b24" />
      <circle cx="134.5" cy="91.5" r="2.6" fill="#fff" />
      <circle cx="129.8" cy="96.3" r="1.1" fill="#fff" />
      <ellipse cx="124" cy="107" fill="#ee867e" opacity=".65" rx="7.5" ry="4.5" />
      <path fill="none" stroke="#3d2b24" strokeLinecap="round" strokeWidth="4.5" d="M150 120q-7 0-12-6" />
      <path fill="#d99b82" d="M74 142c-28 2-34 36-16 50 4 3 10 4 20 4h18c10 0 11-13 1-16-8-2-14 0-18 2l1-34Z" />
      <path
        fill="none"
        stroke="#3d2b24"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="7"
        d="M74 142c-28 2-34 36-16 50 4 3 10 4 20 4h18c10 0 11-13 1-16-8-2-13 0-17 2"
      />
      <path stroke="#3d2b24" strokeLinecap="round" strokeWidth="4.5" d="M94 195v-6" />
      <path fill="#d99b82" d="M108 142c2 18 4 36 6 48 1 4 4 6 10 6h16c8 0 9-12-1-14-5-1-7-4-9-14q-3-18-6-30Z" />
      <path
        fill="none"
        stroke="#3d2b24"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="7"
        d="M108 142c2 18 4 36 6 48 1 4 4 6 10 6h16c8 0 9-12-1-14-5-1-7-4-9-14q-3-18-6-30"
      />
      <path stroke="#3d2b24" strokeLinecap="round" strokeWidth="4.5" d="M137 195v-6" />
      <path fill="#d99b82" d="M88 76C66 52 62 4 78 4s30 38 32 64Z" />
      <path fill="#f29f97" d="M90 68C76 50 74 17 80 17c8 0 17 25 20 45Z" />
      <path
        fill="none"
        stroke="#3d2b24"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="7"
        d="M88 74C66 52 62 4 78 4s30 38 32 60"
      />
    </svg>
  )
}
