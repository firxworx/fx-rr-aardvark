# Production Checklist

Pre-deployment / pre-production checklist for new projects.

Delete what does not apply. Items marked **[included]** are provided by the starter: confirm they still suit the project.

## Project Identity

- [ ] Run the setup script or complete the manual steps in [setup.md](./setup.md)
- [ ] Commit `apps/web/wrangler.jsonc` (remove it from `.gitignore`)
- [ ] Set app name, default title, and description in `apps/web/app/constants.ts`
- [ ] Replace favicons, touch icon, and `public/images/og-default.png`
- [ ] Remove demo content: home page, example route, GitHub link
- [ ] Review locale (`DEFAULT_LOCALE`)
- [ ] Review `compatibility_date` in `wrangler.jsonc`; it cannot be later than the installed `wrangler` supports
- [ ] Choose a license: update `LICENSE` and `package.json` (or set `UNLICENSED`). The starter is MIT.
- [ ] Rewrite the README; add `SECURITY.md` and `CODEOWNERS` as appropriate

## Domain and DNS

- [ ] Configure the custom domain in `wrangler.jsonc` and set `SITE_URL` to match
- [ ] Choose a canonical host and redirect the other (`www` or apex)
- [ ] Enable "Always Use HTTPS" for the zone: **SSL/TLS > Edge Certificates** in the Cloudflare dashboard
  - it is a zone setting so it cannot be set in `wrangler.jsonc`, and it applies to every host in the zone
  - it does not apply to `workers.dev`: browsers always use https for `.dev` domains
- [ ] Set `workers_dev` and `preview_urls` to `false` in production: otherwise the app has public URLs that bypass the WAF
  and rate limiting rules of the zone and duplicate its content
- [ ] **Review HSTS `includeSubDomains` before using an apex domain**: browsers will require https for every subdomain
  for a year. Update both `packages/core/src/security-headers.ts` and `apps/web/public/_headers`
- [ ] Enable DNSSEC; add CAA records
- [ ] Configure SPF, DKIM, and DMARC, including for a domain that does not send email

## Environments and Secrets

- [ ] **[included]** Preview environment deploys as its own worker ([setup.md](./setup.md))
- [ ] **[included]** Environment variables are validated at startup; deploy fails if a required secret is not set
- [ ] Set secrets for each environment with different values; list new secrets in `secrets.required`
- [ ] Use separate resources (D1, KV, R2, queues) for each environment
- [ ] Restrict access to non-production environments (e.g. Cloudflare Access)
- [ ] Plan how to rotate each secret (cookie `secrets` accepts multiple: the first signs and all verify)

## Security

- [ ] **[included]** Nonce-based CSP
- [ ] **[included]** Security headers for worker responses and static assets
- [ ] **[included]** Cross-origin requests that may change state are rejected, including for resource routes
- [ ] Update the CSP for each third party (analytics, fonts, images, embeds, payments); avoid `unsafe-inline`
- [ ] Add CSP violation reporting (`report-to`)
- [ ] Review `Cross-Origin-Opener-Policy` and `Permissions-Policy` if using OAuth popups, payments, camera, or location
- [ ] Exempt endpoints that accept a cross-site POST from a browser (SAML, OAuth `form_post`) in
  `cross-origin.middleware.server.ts`
- [ ] Verify signatures of webhooks (the cross-origin check does not apply to server to server requests)
- [ ] Validate all input at the boundary with zod; limit body and upload sizes
- [ ] Validate redirect targets that come from user input (`@workspace/core/request-origin`)
- [ ] Review all cookies: `Secure`, `HttpOnly`, `SameSite`, expiry
- [ ] Add rate limiting (WAF rules or rate limiting binding), especially for auth, forms, and expensive endpoints
- [ ] Add bot protection to public forms (e.g. Turnstile)
- [ ] Enable WAF managed rules
- [ ] Add `/.well-known/security.txt`
- [ ] Review what loaders return: everything returned is sent to the browser

## Authentication and Authorization

If the project has user accounts:

- [ ] Authorize in every loader and action: a parent route does not protect its children
- [ ] Rotate the session on sign in; revoke on sign out and password change; set idle and absolute expiry
- [ ] Offer MFA or passkeys; protect against brute force and account enumeration
- [ ] Never allow shared caching of private responses
- [ ] Audit log for sensitive actions

## Data

If the project stores data:

- [ ] Apply migrations in the release process; order them with respect to the deploy
- [ ] Use expand/contract changes so the previous version works with the new schema (required for rollback)
- [ ] Configure backups and **test a restore** (note D1 Time Travel retention for the plan)
- [ ] Define data retention, export, and deletion
- [ ] Review data location / jurisdiction requirements
- [ ] Make queue consumers and webhooks idempotent; configure dead letter queues

## Observability

Refer to [logging.md](./logging.md).

- [ ] **[included]** Workers Logs is enabled and every request is logged (`head_sampling_rate`)
- [ ] **[included]** Structured (JSON) logs with the request ID, method, and path
- [ ] **[included]** Query strings are removed from logged URLs (`redact_query_string`)
- [ ] **[included]** Workers Issues is enabled: errors and 5xx responses are grouped. It may incur costs.
- [ ] Set up notifications for Issues (automations)
- [ ] Estimate the cost of logs at expected traffic; review `LOG_LEVEL` and `head_sampling_rate`
- [ ] Do not log personal data, tokens, or cookies; check that paths do not contain any
- [ ] Workers Logs are kept for up to seven days: export logs if they must be kept longer (OpenTelemetry or Logpush)
- [ ] **[included]** Client errors caught by react-router and react are logged by `reportClientError()`
- [ ] Report errors to an error tracker:
  - `handleError` and the render `onError` in `entry.server.tsx`
  - `reportClientError()` in `app/lib/report-client-error.ts`
  - refer to https://reactrouter.com/how-to/instrumentation
- [ ] **[included]** `/health` reports the environment and the deployed version: monitor it from outside Cloudflare
- [ ] Alert on error rate, latency, and CPU limits
- [ ] Set usage and billing notifications for the Cloudflare account; consider CPU `limits` in `wrangler.jsonc`

## CI and Release

- [ ] **[included]** CI runs lint, dependency version checks, typecheck, unit tests, build, and smoke tests
- [ ] **[included]** Dependencies must be at least one day old (`minimumReleaseAge`); CI actions are pinned to a commit
- [ ] Add smoke tests for critical paths of the project (`apps/web/e2e`)
- [ ] Protect the main branch: require a pull request and the CI check
- [ ] Enable automated updates for dependencies and actions (Dependabot or Renovate)
- [ ] Run `pnpm audit --prod` before each release: advisories are published for versions that are already in the lockfile.
  Then review `pnpm audit` for build tools, which run in CI and on developer machines
- [ ] Enable secret scanning with push protection
- [ ] If CI deploys: use an API token scoped to what it needs, stored as an environment secret
- [ ] Plan gradual rollout (`deploy:version` and `deploy:promote`)
- [ ] **Rehearse a rollback** (`wrangler rollback`), including migrations
- [ ] Check a tab that was open before a deploy: it may request assets of the previous version

## Quality

- [ ] **[included]** Hashed assets are cached as immutable (`/assets/*` in `public/_headers`); never create `public/assets/`
- [ ] Set a budget for Core Web Vitals and measure with real user data
- [ ] Set cache headers for public responses; purge as required
- [ ] Optimize images: dimensions, formats, lazy loading
- [ ] Test with a keyboard and a screen reader: skip link, focus after navigation, page title for each route
- [ ] Test small screens (the demo layout hides its navigation) and real devices
- [ ] Test forms without JavaScript (if no JS is a requirement)
- [ ] Review error pages: 404, 500, and an error in the root loader
- [ ] Check light and dark theme contrast, reduced motion, and zoom to 200%

## SEO and Sharing

- [ ] **[included]** `robots.txt` disallows crawling and the worker sends `X-Robots-Tag: noindex` outside of production.
  Crawlers that obey `robots.txt` do not see the header and may still index a linked URL: only restricted access
  prevents it

If the project has public pages:

- [ ] Title, description, canonical URL, and Open Graph metadata for each page
- [ ] Update `sitemap.xml` (`SITEMAP_INCLUDE_PATHS`) and `robots.txt` for all routes
- [ ] Verify the domain with search engines and submit the sitemap
- [ ] Check link previews and structured data

## Legal and Operations

- [ ] Privacy policy, terms, and contact details
- [ ] Consent for non-essential cookies and analytics where required
- [ ] Review processors and data processing agreements
- [ ] Require 2FA for Cloudflare, GitHub, and the domain registrar; at least two administrators for each
- [ ] Enable domain auto-renew and registrar lock
- [ ] Document who responds to incidents and how to reach them
