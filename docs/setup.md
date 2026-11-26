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

Replace the `__PLACEHOLDER__` values in both files.

Generate a value for each secret in `.dev.vars` with `openssl rand -base64 32`.

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

## Agent Skills

AI coding agent skills are managed using the [skills CLI](https://www.skills.sh/docs/cli).

`skills-lock.json` pins a few skills for agents (react-router, modern-web-guidance) to a commit of their source.

Installed skills (`.agents/skills`, `.claude/skills`) are not committed to the repository; restore them from the lockfile with the `skills` CLI (`pnx` runs a package like `pnpm dlx` and is the `pnpm` equivalent to `npx`):

```sh
pnx skills install --dry-run    # show what would be installed
pnx skills install              # restore from skills-lock.json (experimental)
```

Review the lockfile and remove any skills that your project does not need.

`pnx skills update` updates skills to their latest versions and changes the lockfile. Skills are instructions for
agents: review the changes before committing them.

Custom skills for the workspace use the `fx-` prefix to namespace them and are committed (refer to `.gitignore`).

If you do not use Claude Code you can safely delete `CLAUDE.md` and the `.claude` directory if they exist.

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

### Explicit Declaration

This workspace requires secrets to be declared in `secrets.required` in `wrangler.jsonc` (per environment). Deployments
fail by design when a required secret is not set. `apps/web/workers/app.ts` validates secrets and variables with the
schema in `apps/web/app/env.server.ts`.

When `secrets.required` is set, only names in `vars` or `secrets.required` are:

- loaded from `.dev.vars`
- included in Cloudflare generated types (`pnpm typegen`)

Builds include only the declared secrets so local previews (`pnpm --filter web preview`) use the `vars` of the built
environment (e.g. `ENVIRONMENT` is `production`). The dev server (`pnpm dev`) also applies overrides of `vars` from
`.dev.vars` (e.g. `ENVIRONMENT` is `development`).

### Working with Secrets & Environment Variables

`apps/web/workers/app.ts` validates environment variables when the worker starts, so a deploy or the dev server fails
with a message that names each invalid variable. Loaders, actions, and middleware read the validated values with
`context.get(envContext)`.

Anything that holds a secret or variable should be created when handling a request instead of in module scope, e.g.
not `const client = new ApiClient(env.API_KEY)` at the top of a file.

Details regarding module scope, env caching, and the Cloudflare workers runtime:

- module scope runs once per isolate (an instance of the worker that handles many requests)
- when only secrets or variables change (`wrangler secret put` or the dashboard), Cloudflare may keep using isolates
  that are already running, so a value created at module scope keeps the previous secret
- the `env` of each request has the new values: `workers/app.ts` parses it for each request, and the toast middleware
  creates its cookie storage for each request

Set secrets before the first deploy and whenever a value changes. Use a different value for each environment.

For example to create `TOAST_COOKIE_SECRET`, change your working directory to `apps/web` and run:

```sh
openssl rand -base64 32 | pnpm wrangler secret put TOAST_COOKIE_SECRET --env=""      # production
openssl rand -base64 32 | pnpm wrangler secret put TOAST_COOKIE_SECRET --env=preview # preview
```

If a worker does not exist yet (e.g. it has never been deployed) wrangler creates a draft worker that reserves the name to hold the secret.

## Development

Run the dev server from workspace root:

```bash
pnpm dev
```
