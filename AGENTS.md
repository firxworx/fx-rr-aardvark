# AGENTS

pnpm workspace (monorepo) deployed to Cloudflare Workers.

Prefer `pnpm dlx` instead of `npx` for one-off `pnpm` commands; `npx` is still OK if necessary.

Ignore contents of `docs.draft/` directory if it exists.

## Layout

App:

- `apps/web` — React Router v8 (framework mode, SSR) on Cloudflare Workers
- `apps/web/workers/app.ts` - worker entry point

Packages are source-shipped (no build step); no turborepo.

All packages are under `@workspace/` namespace e.g. `@workspace/ui` for the shared component library.

- `packages/core` - shared utilities
- `packages/ui` - reusable UI components and global styles (tailwindcss v4)
- `packages/ui/src/styles/globals.css` — entrypoint for global styles
- `tooling/tsconfig` - shared TypeScript config presets

## Commands

- `pnpm dev` / `pnpm --filter web dev`
- `pnpm check` — biome lint + format (run before considering any task done)
- `pnpm typecheck`
- `pnpm test` — vitest

Deploys via wrangler; app has `wrangler.jsonc`.

## Styling

- Tokens are designed for compatibility with coss-ui and shadcn/ui
- Tokens use `light-dark()` CSS. One class covers both modes: **never**
  write `dark:` color variants unless absolutely necessary. Non-color `dark:` variants (rare) are
  allowed. Any use of `dark:` should be flagged in your summary.
- Always prefer Tailwind logical property utilities (`ms-`, `me-`, `ps-`,
  `pe-`, `start-`, `end-`) instead of physical ones (`ml-`, `mr-`, `pl-`,
  `pr-`, `left-`, `right-`).

## TypeScript conventions

- Strict, professional grade, nullish-safe code: explicitly handle `undefined`/`null`
- Array types: `T[]`, never `Array<T>`
- Full parameter names: `event` vs. `e`, `error` vs. `e` or `err`
- 2-space indentation
- zod v4 schema names prefixed with `z` (e.g. `zUserProfile`)
- Formatting/linting is Biome (incl. Markdown and YAML) — do not add ESLint/Prettier config

## `apps/web`

- React Router v8 framework mode with SSR. Prefer loaders/actions over client-side fetching.
- Environment awareness: do not rely on `import.meta.env.PROD` or `NODE_ENV` to distinguish Cloudflare environments
  - use explicit `ENVIRONMENT` var from the Worker env (set per environment in `wrangler.jsonc`).
- Any Cloudflare bindings (D1, R2, Queues, KV, etc) should come from context; never import them globally.
- Import shared components from `@workspace/ui`; do not duplicate components into the app.
- Consider if coss-ui then shadcn/ui has a component before creating a new one.
- Validate all input at the boundary with Zod schemas.

## General

- Do not add dependencies without asking; prefer platform solutions.
- Dependency versions are managed with pnpm catalog and enforced with `syncpack`.

## Markdown

- Biome formats and lints Markdown and YAML too; `AGENTS.md`/`CLAUDE.md`, `docs/**`, and `.claude/**` are lint-only
  (not formatted) because Biome pads every table column to its widest cell.
- In docs meant for people, prefer lists over very wide tables.
- Use a trailing `\` for hard line breaks, not trailing spaces (trailing whitespace is trimmed).
