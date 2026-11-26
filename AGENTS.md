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
- `packages/logger` - structured logging for server code (LogTape; refer to `docs/logging.md`)
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
- Tokens use `light-dark()` CSS. One class covers both modes:
  - **Never** write `dark:` color variants unless absolutely necessary.
  - Non-color `dark:` variants (rare) are allowed.
  - Any use of `dark:` should be flagged in your summary.
- Always prefer Tailwind logical property utilities (`ms-`, `me-`, `ps-`,
  `pe-`, `start-`, `end-`) instead of physical ones (`ml-`, `mr-`, `pl-`,
  `pr-`, `left-`, `right-`).
- Navigation is animated by React `<ViewTransition>` (`RouteTransition` in `apps/web` root). Never use the deprecated
  react-router `viewTransition` prop/option or call `document.startViewTransition()`. Consider view transitions in any
  UI/UX work. See `docs/styling.md`.

## TypeScript conventions

- Strict, professional grade, nullish-safe code: explicitly handle `undefined`/`null`
- Array types: `T[]`, never `Array<T>`
- Full parameter names: `event` vs. `e`, `error` vs. `e` or `err`
- 2-space indentation
- zod v4 schema names prefixed with `z` (e.g. `zUserProfile`)
- zod v4 namespace import: `import * as z from 'zod'` (not `import { z }` or a default import) per zod docs;
  - bundlers can tree-shake a namespace import but not the `z` object
- Formatting/linting is Biome (incl. Markdown and YAML) — do not add ESLint/Prettier config

## `apps/web`

- React Router v8 framework mode with SSR. Prefer loaders/actions over client-side fetching.
- Environment awareness: do not rely on `import.meta.env.PROD` or `NODE_ENV` to distinguish Cloudflare environments
  - use explicit `ENVIRONMENT` var from the Worker env (set per environment in `wrangler.jsonc`).
- Any Cloudflare bindings (D1, R2, Queues, KV, etc) should come from context; never import them globally.
- Environment variables: read validated values with `context.get(envContext)` (set in `workers/app.ts`).
  - Never import `env` from `cloudflare:workers` in app code.
  - Never create values or clients from secrets at module scope: an isolate may be reused after a secret changes.
  - Add new variables to the schema in `app/env.server.ts`.
- Import shared components from `@workspace/ui`; do not duplicate components into the app.
- Consider if coss-ui then shadcn/ui has a component before creating a new one.
- Validate all input at the boundary with Zod schemas.
- Logging: server code uses `createLogger('<name>')` from `@workspace/logger`, never `console`.
  - Use a constant message with values as properties.
  - Pass errors as `error`: `logger.error('Failed to save', { error, id })`.
  - Never log personal data, secrets, cookies, or query strings.
  - Use `error` level only for failures that need attention.
  - Read `docs/logging.md` before changing logging or observability settings.
- Only names listed under `vars` or `secrets.required` in `wrangler.jsonc` are loaded from `.dev.vars`.
- Unit tests live in `apps/web/test/`: `*.test.ts` runs in Node.js and `*.test.tsx` in jsdom.
  - Modules that import `cloudflare:workers` cannot be tested there: keep logic in plain functions.
- Never create `apps/web/public/assets`: `/assets/` is reserved for hashed build output and cached as immutable. Use
  another directory such as `public/images`.

## General

- Do not add dependencies without asking; prefer platform solutions.
- Dependency versions are managed with pnpm catalog and enforced with `syncpack`.

## Markdown

- Biome formats and lints Markdown and YAML.
  - `AGENTS.md`/`CLAUDE.md`, `docs/**`, and `.claude/**` are lint-only (not formatted) because Biome pads every table
    column to its widest cell.
- In docs meant for people, prefer lists over very wide tables.
- Use a trailing `\` for hard line breaks, not trailing spaces (trailing whitespace is trimmed).
