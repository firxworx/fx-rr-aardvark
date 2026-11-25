# Workspace Setup

## Editor Configuration

If you use VSCode review `.vscode/settings.json` and customize to your liking (or delete this directory).

## Development Environment

You can set up the workspace manually or use the included setup script.

After setup using either method remove `apps/web/wrangler.jsonc` entry from `.gitignore` to commit this file.

### Manual Setup

Review and edit the fields in `package.json` including `name`, `description`, `author`, etc.

Copy example wrangler config and `.dev.vars` then edit the values to suit your project:

```sh
cd apps/web
cp .dev.vars.example .dev.vars
cp wrangler.template.jsonc wrangler.jsonc
```

Replace the `__PLACEHOLDER__` values in both files. Generate a value for each secret in `.dev.vars` with
`openssl rand -base64 32`.

Run `pnpm install` to install dependencies then `pnpm typegen` to generate types (generates wrangler types):

```sh
pnpm install
pnpm typegen
```

### Setup Script

As an alternative to manual setup you can run the setup script to personalize a fresh clone of this repo.

The setup script will prompt for workspace name, worker name, site URLs, etc.

```bash
pnpm install
pnpm setup:workspace
```

The script is at `scripts/setup.ts` and does the following:

- `package.json`: set `name` + `description`; remove template `author`.
- `apps/web/wrangler.jsonc`: create from `apps/web/wrangler.template.jsonc` and set properties
- `apps/web/.dev.vars`: create from `apps/web/.dev.vars.example`
  - generate a secret for every value with placeholder `__GENERATE_SECRET__`
- `README.md`: rewrite title and optionally reset git history

Existing files are never overwritten without `--force` (which writes a `.bak` first) so the script is safe to re-run.

Pass `--yes` (with `--name`, `--worker`, `--site-url`, ...) to run unattended; or `--help` to view all options flags.

Ensure the `SITE_URL` var in `wrangler.jsonc` is in the correct format: `https://<worker_name>.<subdomain>.workers.dev`.
This step is necessary because there is currently no way for the `wrangler` CLI to determine your `workers.dev` subdomain prior to publishing.

## Customization

Review the react-router application config files:

- `apps/web/react-router.config.ts`
- `apps/web/vite.config.ts`

Customize the application:

- `apps/web/app/constants.ts` - app constants (e.g. `APP_NAME`, etc.)
- `apps/web/public` - public assets (e.g. `favicon.ico`, `apple-touch-icon`, etc.)

## Environments

The top level of `apps/web/wrangler.jsonc` is the production environment. The `preview` environment is defined under
`env` and deploys as a separate worker named `<worker_name>-preview`.

- `pnpm --filter web run deploy` - production
- `pnpm --filter web run deploy:preview` - preview

The Cloudflare Vite plugin selects the environment at build time with `CLOUDFLARE_ENV` (set by the scripts).
Do not select an environment with `wrangler deploy --env`: it has no effect on a production build, which deploys to the
production worker.

To add an environment:

- add it under `env` in `wrangler.jsonc` with its own `vars`, `secrets`, and bindings (these are not inherited)
- add its name to `ENVIRONMENT` in `apps/web/app/env.server.ts`
- set its `LOG_LEVEL` (refer to [logging.md](./logging.md))
- add a deploy script to `apps/web/package.json`

## Secrets

Required secrets are declared in `secrets.required` in `wrangler.jsonc` (per environment) and validated in
`apps/web/app/env.server.ts`. A deploy fails if a required secret is not set.

Declare every secret: undeclared values in `.dev.vars` are not loaded unless they override a name in `vars`. Builds
include only the declared secrets so local runs of a build (`pnpm --filter web preview`) use the `vars` of the built
environment (e.g. `ENVIRONMENT` is `production`); the dev server (`pnpm dev`) applies all overrides.

Set secrets before the first deploy and whenever a value changes. Run from `apps/web` and use a different value for
each environment:

```sh
openssl rand -base64 32 | pnpm wrangler secret put TOAST_COOKIE_SECRET --env=""      # production
openssl rand -base64 32 | pnpm wrangler secret put TOAST_COOKIE_SECRET --env=preview # preview
```

If the worker does not exist yet wrangler creates a draft worker with that name to hold the secret.

## Development

Run the dev server from workspace root:

```bash
pnpm dev
```
