/**
 * Workspace setup for a fresh clone of this template.
 *
 * Personalizes the workspace (name, description, author), creates `apps/web/wrangler.jsonc` from
 * `apps/web/wrangler.template.jsonc`, and creates `apps/web/.dev.vars` from `.dev.vars.example`
 * with freshly generated secrets.
 *
 * Existing files are never overwritten unless `--force` is passed (which writes a `.bak` copy
 * first), so the script is safe to re-run.
 *
 * Usage:
 *   pnpm run setup
 *   pnpm run setup -- --yes --name=my-app
 *   node scripts/setup.ts --yes --name=my-app --worker=my-app-web --site-url=https://my-app.example.com
 *
 * Flags:
 *   --name=<name>          workspace name for package.json (default: directory name)
 *   --description=<text>   package.json description (default: empty)
 *   --author=<text>        package.json author (default: field removed)
 *   --worker=<name>        cloudflare worker name (default: <name>-web)
 *   --site-url=<url>       production SITE_URL (default: https://<worker>.workers.dev)
 *   --preview-site-url=<url>
 *                          preview SITE_URL (default: derived from worker name and SITE_URL)
 *   --reset-git            reinitialize git history (destructive: deletes .git)
 *   --force                overwrite existing wrangler.jsonc / .dev.vars (backed up to *.bak)
 *   --yes                  non-interactive: accept flags and defaults without prompting
 *   --help                 print this usage
 */

import { execFileSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { copyFileSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import type { ConfirmOptions, TextOptions } from '@clack/prompts'
import { cancel, confirm, intro, isCancel, log, note, outro, text } from '@clack/prompts'

/** Token in `wrangler.template.jsonc` replaced with the cloudflare worker name. */
const TOKEN_WORKER_NAME = '__WORKER_NAME__'

/** Token in `wrangler.template.jsonc` replaced with the production site URL. */
const TOKEN_SITE_URL = '__SITE_URL__'

/** Token in `wrangler.template.jsonc` replaced with the preview site URL. */
const TOKEN_PREVIEW_SITE_URL = '__PREVIEW_SITE_URL__'

/** Token in `wrangler.template.jsonc` replaced with today's date (`YYYY-MM-DD`). */
const TOKEN_COMPATIBILITY_DATE = '__COMPATIBILITY_DATE__'

/** Matches a `.dev.vars.example` assignment whose value is the generated-secret token. */
const GENERATE_SECRET_REGEX = /^(\s*)([A-Z0-9_]+)(\s*=\s*)["']?__GENERATE_SECRET__["']?\s*$/

/** Byte length of generated secrets (32 bytes base64-encodes to 44 characters). */
const SECRET_BYTE_LENGTH = 32

/** npm package name rules (unscoped or scoped), lowercase only. */
const PACKAGE_NAME_REGEX = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/

/** Cloudflare worker script name rules. */
const WORKER_NAME_REGEX = /^[a-z0-9][a-z0-9-]{0,62}$/

const MAX_PACKAGE_NAME_LENGTH = 214

const USAGE = `
Usage: pnpm run setup [flags]

  --name=<name>          workspace name for package.json (default: directory name)
  --description=<text>   package.json description (default: empty)
  --author=<text>        package.json author (default: field removed)
  --worker=<name>        cloudflare worker name (default: <name>-web)
  --site-url=<url>       production SITE_URL (default: https://<worker>.workers.dev)
  --preview-site-url=<url>
                         preview SITE_URL (default: derived from worker name and SITE_URL)
  --reset-git            reinitialize git history (destructive: deletes .git)
  --force                overwrite existing wrangler.jsonc / .dev.vars (backed up to *.bak)
  --yes                  non-interactive: accept flags and defaults without prompting
  --help                 print this usage
`.trim()

interface SetupAnswers {
  workspaceName: string
  description: string
  author: string
  workerName: string
  siteUrl: string
  previewSiteUrl: string
  isResetGit: boolean
}

/** Outcome of a single file step, reported in the summary. */
interface StepResult {
  label: string
  detail: string
  isApplied: boolean
}

/** Validates a workspace (npm package) name; returns an error message or `undefined` when valid. */
function validateWorkspaceName(value: string | undefined): string | undefined {
  const name = value?.trim() ?? ''

  if (name.length === 0) {
    return 'Workspace name is required'
  }

  if (name.length > MAX_PACKAGE_NAME_LENGTH) {
    return `Workspace name must be ${MAX_PACKAGE_NAME_LENGTH} characters or fewer`
  }

  if (!PACKAGE_NAME_REGEX.test(name)) {
    return 'Workspace name must be lowercase with no spaces (npm package name rules)'
  }

  return undefined
}

/** Validates a cloudflare worker name; returns an error message or `undefined` when valid. */
function validateWorkerName(value: string | undefined): string | undefined {
  const name = value?.trim() ?? ''

  if (name.length === 0) {
    return 'Worker name is required'
  }

  if (!WORKER_NAME_REGEX.test(name)) {
    return 'Worker name must be lowercase alphanumeric with dashes (max 63 characters)'
  }

  return undefined
}

/**
 * Validates a production site URL.
 * Mirrors the constraints enforced by the `SITE_URL` schema in `apps/web/app/env.server.ts`.
 */
function validateSiteUrl(value: string | undefined): string | undefined {
  const siteUrl = value?.trim() ?? ''

  if (siteUrl.length === 0) {
    return 'SITE_URL is required'
  }

  if (siteUrl.endsWith('/')) {
    return 'SITE_URL must not have a trailing slash to support CORS, cookies, and canonical URLs'
  }

  let parsed: URL

  try {
    parsed = new URL(siteUrl)
  } catch {
    return 'SITE_URL must be a valid absolute URL (e.g. https://example.com)'
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return 'SITE_URL must use http or https'
  }

  return undefined
}

/** Applies a validator to a flag value and exits with its message when invalid. */
function assertFlag(value: string, validate: (value: string | undefined) => string | undefined, flag: string): string {
  const message = validate(value)

  if (message !== undefined) {
    console.error(`Invalid ${flag}: ${message}`)
    process.exit(1)
  }

  return value.trim()
}

/** Resolves the workspace root from this script's location and asserts it looks like the workspace. */
function resolveWorkspaceRoot(): string {
  const workspaceRoot = resolve(dirname(import.meta.dirname))

  if (!existsSync(join(workspaceRoot, 'pnpm-workspace.yaml'))) {
    console.error(`Could not locate the workspace root (no pnpm-workspace.yaml at ${workspaceRoot})`)
    process.exit(1)
  }

  return workspaceRoot
}

/**
 * Derives the default preview URL: wrangler names the preview worker `<worker>-preview` so a production
 * URL of `https://<worker>.<subdomain>.workers.dev` maps to `https://<worker>-preview.<subdomain>.workers.dev`.
 * The account subdomain is unknown for a production URL with a custom domain.
 */
function getDefaultPreviewSiteUrl(workerName: string, siteUrl: string): string {
  const { hostname } = new URL(siteUrl)
  const isWorkersDev = hostname.startsWith(`${workerName}.`) && hostname.endsWith('.workers.dev')
  const parentDomain = isWorkersDev ? hostname.slice(workerName.length + 1) : 'workers.dev'

  return `https://${workerName}-preview.${parentDomain}`
}

/** Resolves prompt input to the prompt's default when the user submits nothing. */
function withDefault(value: string | undefined, defaultValue: string): string {
  return value === undefined || value.trim().length === 0 ? defaultValue : value
}

/** Generates a base64 secret suitable for cookie/session signing. */
function generateSecret(): string {
  return randomBytes(SECRET_BYTE_LENGTH).toString('base64')
}

/**
 * Updates the root `package.json` with the given identity.
 * An empty author removes the field entirely; key order is preserved.
 */
function applyPackageJson(packageJsonPath: string, answers: SetupAnswers): StepResult {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as Record<string, unknown>

  packageJson.name = answers.workspaceName
  packageJson.description = answers.description

  if (answers.author.length > 0) {
    packageJson.author = answers.author
  } else {
    delete packageJson.author
  }

  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8')

  return {
    label: 'package.json',
    detail: `name: ${answers.workspaceName}${answers.author.length > 0 ? '' : ' (author removed)'}`,
    isApplied: true,
  }
}

/**
 * Creates `apps/web/wrangler.jsonc` from the template with placeholder tokens substituted.
 * The template is jsonc (comments) so it is treated as text and never parsed as JSON.
 */
function applyWranglerConfig(
  templatePath: string,
  configPath: string,
  answers: SetupAnswers,
  isForce: boolean,
): StepResult {
  const label = 'apps/web/wrangler.jsonc'

  if (!existsSync(templatePath)) {
    return { label, detail: `skipped: ${basename(templatePath)} not found`, isApplied: false }
  }

  if (existsSync(configPath) && !isForce) {
    return { label, detail: 'skipped: already exists (use --force to overwrite)', isApplied: false }
  }

  // local date (`en-CA` formats as YYYY-MM-DD) so the date is never ahead of the installed wrangler
  const compatibilityDate = new Date().toLocaleDateString('en-CA')

  const contents = readFileSync(templatePath, 'utf8')
    .replaceAll(TOKEN_WORKER_NAME, answers.workerName)
    .replaceAll(TOKEN_SITE_URL, answers.siteUrl)
    .replaceAll(TOKEN_PREVIEW_SITE_URL, answers.previewSiteUrl)
    .replaceAll(TOKEN_COMPATIBILITY_DATE, compatibilityDate)

  const unresolved = contents.match(/__[A-Z0-9_]+__/g)

  if (unresolved !== null) {
    console.error(`Unresolved placeholder(s) in ${basename(templatePath)}: ${[...new Set(unresolved)].join(', ')}`)
    process.exit(1)
  }

  const isOverwrite = existsSync(configPath)

  if (isOverwrite) {
    copyFileSync(configPath, `${configPath}.bak`)
  }

  writeFileSync(configPath, contents, 'utf8')

  return {
    label,
    detail: `${isOverwrite ? 'overwritten' : 'created'}: ${answers.workerName} (compatibility_date ${compatibilityDate})`,
    isApplied: true,
  }
}

/**
 * Creates `apps/web/.dev.vars` from the example file, replacing each secret token with its own
 * freshly generated secret.
 */
function applyDevVars(examplePath: string, devVarsPath: string, isForce: boolean): StepResult {
  const label = 'apps/web/.dev.vars'

  if (!existsSync(examplePath)) {
    return { label, detail: `skipped: ${basename(examplePath)} not found`, isApplied: false }
  }

  if (existsSync(devVarsPath) && !isForce) {
    return { label, detail: 'skipped: already exists (use --force to overwrite)', isApplied: false }
  }

  let secretCount = 0

  const contents = readFileSync(examplePath, 'utf8')
    .split('\n')
    .map((line) => {
      const match = line.match(GENERATE_SECRET_REGEX)

      if (match === null) {
        return line
      }

      secretCount += 1

      return `${match[1]}${match[2]}${match[3]}${generateSecret()}`
    })
    .join('\n')

  const isOverwrite = existsSync(devVarsPath)

  if (isOverwrite) {
    copyFileSync(devVarsPath, `${devVarsPath}.bak`)
  }

  writeFileSync(devVarsPath, contents, 'utf8')

  return {
    label,
    detail: `${isOverwrite ? 'overwritten' : 'created'}: ${secretCount} secret(s) generated`,
    isApplied: true,
  }
}

/** Rewrites the README title to the workspace name when the first line is a heading. */
function applyReadmeTitle(readmePath: string, workspaceName: string): StepResult {
  const label = 'README.md'

  if (!existsSync(readmePath)) {
    return { label, detail: 'skipped: not found', isApplied: false }
  }

  const lines = readFileSync(readmePath, 'utf8').split('\n')
  const [firstLine] = lines

  if (firstLine === undefined || !firstLine.startsWith('# ')) {
    return { label, detail: 'skipped: no title heading on the first line', isApplied: false }
  }

  if (firstLine === `# ${workspaceName}`) {
    return { label, detail: 'skipped: title already up to date', isApplied: false }
  }

  lines[0] = `# ${workspaceName}`
  writeFileSync(readmePath, lines.join('\n'), 'utf8')

  return { label, detail: `title set to ${workspaceName}`, isApplied: true }
}

/** Deletes the template's git history and initializes a fresh repository with everything staged. */
function applyGitReset(workspaceRoot: string): StepResult {
  const label = 'git history'

  rmSync(join(workspaceRoot, '.git'), { recursive: true, force: true })

  execFileSync('git', ['init', '-b', 'main'], { cwd: workspaceRoot, stdio: 'ignore' })
  execFileSync('git', ['add', '-A'], { cwd: workspaceRoot, stdio: 'ignore' })

  return { label, detail: 'reinitialized on branch main (changes staged, nothing committed)', isApplied: true }
}

/** Exits cleanly when a prompt is cancelled (ctrl+c) so a partial run never writes files. */
function exitCancelled(): never {
  cancel('Setup cancelled. No files were changed.')
  process.exit(0)
}

/** Text prompt that resolves to the entered value or exits when cancelled. */
async function promptText(options: TextOptions): Promise<string> {
  const value = await text(options)

  if (isCancel(value)) {
    exitCancelled()
  }

  return value
}

/** Confirm prompt that resolves to the answer or exits when cancelled. */
async function promptConfirm(options: ConfirmOptions): Promise<boolean> {
  const value = await confirm(options)

  if (isCancel(value)) {
    exitCancelled()
  }

  return value
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      name: { type: 'string' },
      description: { type: 'string' },
      author: { type: 'string' },
      worker: { type: 'string' },
      'site-url': { type: 'string' },
      'preview-site-url': { type: 'string' },
      'reset-git': { type: 'boolean' },
      force: { type: 'boolean' },
      yes: { type: 'boolean' },
      help: { type: 'boolean' },
    },
  })

  if (values.help === true) {
    console.log(USAGE)
    process.exit(0)
  }

  const workspaceRoot = resolveWorkspaceRoot()
  const packageJsonPath = join(workspaceRoot, 'package.json')
  const readmePath = join(workspaceRoot, 'README.md')
  const templatePath = join(workspaceRoot, 'apps/web/wrangler.template.jsonc')
  const configPath = join(workspaceRoot, 'apps/web/wrangler.jsonc')
  const examplePath = join(workspaceRoot, 'apps/web/.dev.vars.example')
  const devVarsPath = join(workspaceRoot, 'apps/web/.dev.vars')

  const isForce = values.force === true
  const isNonInteractive = values.yes === true
  const hasGitRepository = existsSync(join(workspaceRoot, '.git'))
  const isWranglerConfigNeeded = !existsSync(configPath) || isForce

  const defaultWorkspaceName = basename(workspaceRoot)

  const flagWorkspaceName =
    values.name === undefined ? undefined : assertFlag(values.name, validateWorkspaceName, '--name')
  const flagWorkerName =
    values.worker === undefined ? undefined : assertFlag(values.worker, validateWorkerName, '--worker')
  const flagSiteUrl =
    values['site-url'] === undefined ? undefined : assertFlag(values['site-url'], validateSiteUrl, '--site-url')
  const flagPreviewSiteUrl =
    values['preview-site-url'] === undefined
      ? undefined
      : assertFlag(values['preview-site-url'], validateSiteUrl, '--preview-site-url')

  let answers: SetupAnswers

  if (isNonInteractive) {
    const workspaceName = flagWorkspaceName ?? assertFlag(defaultWorkspaceName, validateWorkspaceName, '--name')
    const workerName = flagWorkerName ?? assertFlag(`${workspaceName}-web`, validateWorkerName, '--worker')

    const siteUrl = flagSiteUrl ?? `https://${workerName}.workers.dev`

    answers = {
      workspaceName,
      description: values.description ?? '',
      author: values.author ?? '',
      workerName,
      siteUrl,
      previewSiteUrl: flagPreviewSiteUrl ?? getDefaultPreviewSiteUrl(workerName, siteUrl),
      isResetGit: values['reset-git'] === true && hasGitRepository,
    }
  } else {
    intro('workspace setup')

    const workspaceName =
      flagWorkspaceName ??
      (await promptText({
        message: 'Workspace name',
        placeholder: defaultWorkspaceName,
        defaultValue: defaultWorkspaceName,
        validate: (value) => validateWorkspaceName(withDefault(value, defaultWorkspaceName)),
      }))

    const description =
      values.description ??
      (await promptText({
        message: 'Description (blank to leave empty)',
        defaultValue: '',
      }))

    const author =
      values.author ??
      (await promptText({
        message: 'Author (blank to remove the field)',
        placeholder: 'Ada Lovelace <ada@example.com> (https://example.com)',
        defaultValue: '',
      }))

    const defaultWorkerName = `${workspaceName}-web`

    const workerName =
      flagWorkerName ??
      (isWranglerConfigNeeded
        ? await promptText({
            message: 'Cloudflare Worker name',
            placeholder: defaultWorkerName,
            defaultValue: defaultWorkerName,
            validate: (value) => validateWorkerName(withDefault(value, defaultWorkerName)),
          })
        : defaultWorkerName)

    const defaultSiteUrl = `https://${workerName}.workers.dev`

    const siteUrl =
      flagSiteUrl ??
      (isWranglerConfigNeeded
        ? await promptText({
            message: 'Production SITE_URL',
            placeholder: defaultSiteUrl,
            defaultValue: defaultSiteUrl,
            validate: (value) => validateSiteUrl(withDefault(value, defaultSiteUrl)),
          })
        : defaultSiteUrl)

    const defaultPreviewSiteUrl = getDefaultPreviewSiteUrl(workerName, siteUrl)

    const previewSiteUrl =
      flagPreviewSiteUrl ??
      (isWranglerConfigNeeded
        ? await promptText({
            message: 'Preview SITE_URL',
            placeholder: defaultPreviewSiteUrl,
            defaultValue: defaultPreviewSiteUrl,
            validate: (value) => validateSiteUrl(withDefault(value, defaultPreviewSiteUrl)),
          })
        : defaultPreviewSiteUrl)

    const isResetGit =
      hasGitRepository &&
      (values['reset-git'] === true ||
        (await promptConfirm({
          message: 'Reset git history? (deletes .git and starts a fresh repository)',
          initialValue: false,
        })))

    answers = { workspaceName, description, author, workerName, siteUrl, previewSiteUrl, isResetGit }
  }

  const results: StepResult[] = [
    applyPackageJson(packageJsonPath, answers),
    applyWranglerConfig(templatePath, configPath, answers, isForce),
    applyDevVars(examplePath, devVarsPath, isForce),
    applyReadmeTitle(readmePath, answers.workspaceName),
  ]

  if (answers.isResetGit) {
    results.push(applyGitReset(workspaceRoot))
  }

  const summary = results
    .map((result) => `${result.isApplied ? '✓' : '○'} ${result.label} — ${result.detail}`)
    .join('\n')

  const hasNodeModules = existsSync(join(workspaceRoot, 'node_modules'))

  const nextSteps = [
    ...(hasNodeModules ? [] : ['pnpm install']),
    'pnpm typegen',
    'pnpm dev',
    'Review apps/web/wrangler.jsonc for your Cloudflare account settings',
  ]
    .map((step) => `- ${step}`)
    .join('\n')

  if (isNonInteractive) {
    console.log(summary)
    console.log(`\nNext:\n${nextSteps}`)
    return
  }

  note(summary, 'Summary')
  log.info(`Next steps:\n${nextSteps}`)
  outro('Workspace ready.')
}

await main()
