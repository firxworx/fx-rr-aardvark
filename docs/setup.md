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
cp .wrangler.template.jsonc wrangler.jsonc
```

Run `pnpm install` to install dependencies then `pnpm typegen` to generate types (generates wrangler types):

```sh
pnpm install
pnpm typegen
```

### Setup Script

As an alternative to manual setup you can run the setup script to personalize a fresh clone of this repo.

The setup script will prompt for workspace name, worker name, site URL, etc.

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
- `apps/public` - public assets (e.g. `favicon.ico`, `apple-touch-icon`, etc.)

## Development

Run the dev server from workspace root:

```bash
pnpm dev
```
