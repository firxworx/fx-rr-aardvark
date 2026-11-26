# web

React Router Framework Mode (SSR) application on Cloudflare Workers with TailwindCSS and Base UI.

- `/workers/app.ts` - worker entrypoint (provides `cloudflareContext` and `nonceContext` to react-router context; applies security headers)
- `/public/_headers` - cache and security headers for static assets (keep security headers in sync with
  `@workspace/core/security-headers`)
- `/public/assets` - **must not exist**: `/assets/` is reserved for build output, which is cached as immutable
- `app/constants.ts` - key constants and configuration
- `app/env.server.ts` - environment variable validation and parsing with zod v4
- `app/entry.server.tsx` - server entrypoint that sets the CSP header (policy defined in `@workspace/core/csp`)
- `app/entry.client.tsx` - client entrypoint with error hooks (attach an error tracker in `app/lib/report-client-error.ts`)
- `app/middleware` - middleware registered in `app/root.tsx` (cross-origin request protection, server-initiated toasts)
- `app/routes.ts` - route manifest (file-based routing with `@react-router/fs-routes`)
- `app/root.tsx` - application root with Base UI providers, toast implementation, CSP

## Config

Key configuration files:

- `apps/web/react-router.config.ts`
- `apps/web/vite.config.ts`

## Unit Tests

Vitest tests in `test/`: `*.test.ts` runs in Node.js and `*.test.tsx` in jsdom with React Testing Library (refer to
`vitest.config.ts`). Modules that import `cloudflare:workers` cannot be tested here.

```sh
pnpm --filter web test
```

## Smoke Tests

Playwright tests in `e2e/` run against a production build in the Workers runtime and cover page loads (including CSP
violations and hydration errors), caching and security headers, cross-origin protection, and theme switching.

```sh
pnpm --filter web exec playwright install chromium # once
pnpm test:e2e
```

Update the tests when you replace the demo routes.

## Routing

Ensure the resource routes for `sitemap.xml` and `robots.txt` are maintained and kept in sync for any special or reserved routes that may be added to the project and should be excluded from search indexes (e.g. `actions`, `api`, etc.).
