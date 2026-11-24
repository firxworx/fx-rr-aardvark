# @workspace/ui

React components and global styles (tailwindcss v4).

Components may be sourced from [coss-ui](https://coss.com/ui) or [shadcn/ui](https://ui.shadcn.com/).

See [docs/styling.md](../docs/styling.md) for details on styling, tokens, light/dark theme.

## Global Styles

All styles are under `src/styles` with global style root: `globals.css`.

Import `shadcn/tailwind.css` adds `shimmer`, `scroll-fade`, `data-*` variants, `accordion` animations.

Reference: https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/tailwind.css

## Utilities

Package `@workspace/ui/lib/style` exports `cn()` classNames merge utility powered by the [cn](https://github.com/shadcn-ui/cn) package and configured with custom theme tokens.

## References

- https://ui.shadcn.com/docs/installation/manual
- https://coss.com/ui/docs/get-started
