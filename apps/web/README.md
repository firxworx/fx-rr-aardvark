# web

React Router Framework Mode (SSR) application on Cloudflare Workers with TailwindCSS and Base UI.

- `/workers/app.ts` - worker entrypoint (provides `cloudflareContext` and `nonceContext` to react-router context)
- `app/constants.ts` - key constants and configuration
- `app/env.server.ts` - environment variable validation and parsing with zod v4
- `app/entry.server.tsx` - server entrypoint with CSP/nonce configuration
- `app/routes.ts` - route manifest (file-based routing with `@react-router/fs-routes`)
- `app/root.tsx` - application root with Base UI providers, toast implementation, CSP

## Config

Key configuration files:

- `apps/web/react-router.config.ts`
- `apps/web/vite.config.ts`

## Routing

Ensure the resource routes for `sitemap.xml` and `robots.txt` are maintained and kept in sync for any special or reserved routes that may be added to the project and should be excluded from search indexes (e.g. `actions`, `api`, etc.).
