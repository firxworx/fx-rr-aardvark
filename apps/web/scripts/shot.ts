/**
 * Screenshot utility for visual checks of the web app.
 *
 * Captures the matrix of routes x viewports x themes to PNG files and reports any console,
 * page, or network errors encountered while loading each route.
 *
 * Theme is applied via the theme cookie (server-rendered) plus matching `prefers-color-scheme`
 * emulation so the first painted frame is already correct and there is no flash to race.
 *
 * Usage:
 *   pnpm shot <route...> [flags]
 *   pnpm shot / --theme=all
 *   pnpm shot /about /blank --preset=mobile --preset=desktop --theme=all
 *   pnpm shot /about --clip=header --full
 */

import { mkdir } from 'node:fs/promises'
import { isAbsolute, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { type BrowserContext, type ConsoleMessage, chromium, type Page } from '@playwright/test'
import z from 'zod'

import { THEME_COOKIE_NAME, type ThemeMode } from '@workspace/core/conventions'

// theme variables should match @workspace/core/conventions/theme.ts
// type ThemeMode = 'light' | 'dark' | 'system'
// const THEME_COOKIE_NAME = 'app_theme' as const

const DEFAULT_PORT = 5173
const DEFAULT_BASE_URL = `http://localhost:${DEFAULT_PORT}`
const DEFAULT_OUT_DIR = '.shots'
const DEFAULT_PRESET = 'desktop'
const NETWORK_IDLE_TIMEOUT_MS = 5_000
const NAVIGATION_TIMEOUT_MS = 30_000
const PREFLIGHT_TIMEOUT_MS = 2_000

/** Ports probed to suggest an alternative when the target base URL is unreachable. */
const CANDIDATE_PORTS: number[] = [5173, 5174, 5175, 5176, 4173, 8787]

/** Environment variable providing the base URL when neither `--url` nor `--port` is passed. */
const BASE_URL_ENV_VAR = 'SHOT_BASE_URL'

const VIEWPORT_PRESETS = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
  wide: { width: 1536, height: 960 },
} as const satisfies Record<string, Viewport>

const zPresetName = z.enum(['mobile', 'tablet', 'desktop', 'wide'])
const zThemeOption = z.enum(['light', 'dark', 'system', 'all'])
const zColorScheme = z.enum(['light', 'dark'])
const zMotionOption = z.enum(['reduce', 'allow'])
const zPositiveInt = z.coerce.number().int().positive()
const zPort = z.coerce.number().int().min(1).max(65535)

interface Viewport {
  width: number
  height: number
}

interface CaptureDiagnostic {
  kind: 'console' | 'pageerror' | 'requestfailed' | 'response'
  detail: string
}

interface ShotOptions {
  routes: string[]
  viewports: Viewport[]
  themes: ThemeMode[]
  prefers: z.infer<typeof zColorScheme>
  baseUrl: string
  outDir: string
  isFullPage: boolean
  clipSelector: string | undefined
  waitSelector: string | undefined
  deviceScaleFactor: number
  isReducedMotion: boolean
  isHeaded: boolean
  isStrict: boolean
}

const USAGE = `
Usage: pnpm shot <route...> [flags]

Flags:
  --preset=mobile|tablet|desktop|wide   Viewport preset (repeatable, default: ${DEFAULT_PRESET})
  --vw=<n> --vh=<n>                     Explicit viewport size (overrides --preset)
  --theme=light|dark|system|all         Theme mode (default: light)
  --prefers=light|dark                  prefers-color-scheme when theme is 'system' (default: light)
  --full                                Capture the full scrollable page
  --clip=<selector>                     Capture a single element instead of the viewport
  --wait=<selector>                     Wait for a selector before capturing
  --motion=reduce|allow                 View transition / animation handling (default: reduce)
  --dpr=<n>                             Device scale factor (default: 1)
  --port=<n>                            Port on localhost (default: ${DEFAULT_PORT})
  --url=<base>                          Full base URL (overrides --port)
  --out=<dir>                           Output directory (default: ${DEFAULT_OUT_DIR})
  --headed                              Launch a real browser window (requires a display)
  --strict                              Exit non-zero if any error diagnostics were captured
  --help                                Show this message

Target resolution: --url > --port > $${BASE_URL_ENV_VAR} > ${DEFAULT_BASE_URL}
`.trimStart()

/**
 * Parse and validate command line arguments.
 */
function parseOptions(): ShotOptions {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      preset: { type: 'string', multiple: true },
      vw: { type: 'string' },
      vh: { type: 'string' },
      theme: { type: 'string' },
      prefers: { type: 'string' },
      full: { type: 'boolean' },
      clip: { type: 'string' },
      wait: { type: 'string' },
      motion: { type: 'string' },
      dpr: { type: 'string' },
      port: { type: 'string' },
      url: { type: 'string' },
      out: { type: 'string' },
      headed: { type: 'boolean' },
      strict: { type: 'boolean' },
      help: { type: 'boolean' },
    },
  })

  if (values.help === true) {
    console.log(USAGE)
    process.exit(0)
  }

  if (positionals.length === 0) {
    console.error('Error: at least one route is required.\n')
    console.error(USAGE)
    process.exit(1)
  }

  const themeOption = zThemeOption.parse(values.theme ?? 'light')
  const themes: ThemeMode[] = themeOption === 'all' ? ['light', 'dark'] : [themeOption]

  return {
    routes: positionals.map(normalizeRoute),
    viewports: resolveViewports(values.preset, values.vw, values.vh),
    themes,
    prefers: zColorScheme.parse(values.prefers ?? 'light'),
    baseUrl: resolveBaseUrl(values.url, values.port),
    outDir: values.out ?? DEFAULT_OUT_DIR,
    isFullPage: values.full === true,
    clipSelector: values.clip,
    waitSelector: values.wait,
    deviceScaleFactor: values.dpr === undefined ? 1 : zPositiveInt.parse(values.dpr),
    isReducedMotion: zMotionOption.parse(values.motion ?? 'reduce') === 'reduce',
    isHeaded: values.headed === true,
    isStrict: values.strict === true,
  }
}

/**
 * Resolve the target base URL.
 *
 * Precedence: `--url`, then `--port` on localhost, then the {@link BASE_URL_ENV_VAR} environment
 * variable, then {@link DEFAULT_BASE_URL}.
 */
function resolveBaseUrl(url: string | undefined, port: string | undefined): string {
  if (url !== undefined) {
    return url.replace(/\/+$/, '')
  }

  if (port !== undefined) {
    return `http://localhost:${zPort.parse(port)}`
  }

  const fromEnvironment = process.env[BASE_URL_ENV_VAR]

  return (fromEnvironment === undefined || fromEnvironment === '' ? DEFAULT_BASE_URL : fromEnvironment).replace(
    /\/+$/,
    '',
  )
}

/**
 * Return true when something answers an HTTP request at the given origin.
 *
 * Any response counts, including error statuses: the check is for a listener, not a healthy app.
 */
async function isReachable(baseUrl: string): Promise<boolean> {
  try {
    await fetch(baseUrl, { signal: AbortSignal.timeout(PREFLIGHT_TIMEOUT_MS), redirect: 'manual' })
    return true
  } catch {
    return false
  }
}

/**
 * Probe {@link CANDIDATE_PORTS} for listeners, excluding the port already known to be unreachable.
 */
async function findResponsivePorts(excludedPort: number | undefined): Promise<number[]> {
  const probed = await Promise.all(
    CANDIDATE_PORTS.filter((port) => port !== excludedPort).map(async (port) =>
      (await isReachable(`http://localhost:${port}`)) ? port : undefined,
    ),
  )

  return probed.filter((port): port is number => port !== undefined)
}

/**
 * Exit with actionable guidance when the target base URL has no listener.
 *
 * Without this the run would capture browser connection-error pages instead of the app.
 */
async function preflight(baseUrl: string): Promise<void> {
  if (await isReachable(baseUrl)) {
    return
  }

  const targetPort = Number.parseInt(new URL(baseUrl).port, 10)
  const alternatives = await findResponsivePorts(Number.isNaN(targetPort) ? undefined : targetPort)

  console.error(`Error: nothing listening at ${baseUrl}`)

  if (alternatives.length > 0) {
    console.error(`\n  A server is responding on ${alternatives.join(', ')}.`)
    console.error(`  Retry with: pnpm shot <route...> --port=${alternatives[0]}`)
  } else {
    console.error('\n  Start the dev server with `pnpm dev`, or pass --port/--url.')
  }

  process.exit(1)
}

/**
 * Resolve the viewport list from explicit dimensions or one or more named presets.
 */
function resolveViewports(
  presets: string[] | undefined,
  width: string | undefined,
  height: string | undefined,
): Viewport[] {
  if (width !== undefined || height !== undefined) {
    const preset = VIEWPORT_PRESETS[DEFAULT_PRESET]

    return [
      {
        width: width === undefined ? preset.width : zPositiveInt.parse(width),
        height: height === undefined ? preset.height : zPositiveInt.parse(height),
      },
    ]
  }

  const names = presets === undefined || presets.length === 0 ? [DEFAULT_PRESET] : presets

  return names.map((name) => VIEWPORT_PRESETS[zPresetName.parse(name)])
}

/**
 * Normalize a route argument to a leading-slash pathname.
 */
function normalizeRoute(route: string): string {
  return route.startsWith('/') ? route : `/${route}`
}

/**
 * Convert a route pathname to a filename-safe slug ('/' becomes 'home').
 */
function toRouteSlug(route: string): string {
  const slug = route
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

  return slug === '' ? 'home' : slug
}

/**
 * Attach listeners that collect error-level diagnostics for the lifetime of a page.
 */
function collectDiagnostics(page: Page): CaptureDiagnostic[] {
  const diagnostics: CaptureDiagnostic[] = []

  page.on('console', (message: ConsoleMessage) => {
    const type = message.type()

    if (type === 'error' || type === 'warning') {
      diagnostics.push({ kind: 'console', detail: `[${type}] ${message.text()}` })
    }
  })

  page.on('pageerror', (error: Error) => {
    diagnostics.push({ kind: 'pageerror', detail: error.message })
  })

  page.on('requestfailed', (request) => {
    const failure = request.failure()
    diagnostics.push({ kind: 'requestfailed', detail: `${request.url()} — ${failure?.errorText ?? 'unknown'}` })
  })

  page.on('response', (response) => {
    const status = response.status()

    if (status >= 400) {
      diagnostics.push({ kind: 'response', detail: `${status} ${response.url()}` })
    }
  })

  return diagnostics
}

/**
 * Wait for the page to reach a visually stable state before capturing.
 *
 * Network idle is best-effort because the vite dev server keeps long-lived connections open.
 */
async function settle(page: Page, waitSelector: string | undefined): Promise<void> {
  try {
    await page.waitForLoadState('networkidle', { timeout: NETWORK_IDLE_TIMEOUT_MS })
  } catch {
    // best-effort: fall through to the remaining settle steps
  }

  if (waitSelector !== undefined) {
    await page.waitForSelector(waitSelector, { state: 'visible' })
  }

  // fonts are bundled via fontsource but text metrics still shift until they are ready
  await page.evaluate(async () => {
    await document.fonts.ready
  })

  await page.evaluate(
    () =>
      new Promise<void>((resolveFrame) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolveFrame()))
      }),
  )
}

/**
 * Capture a single route in the given context and return the absolute path of the PNG written.
 */
async function captureRoute(context: BrowserContext, route: string, filePath: string, options: ShotOptions) {
  const page = await context.newPage()
  const diagnostics = collectDiagnostics(page)

  try {
    await page.goto(`${options.baseUrl}${route}`, { waitUntil: 'load', timeout: NAVIGATION_TIMEOUT_MS })
    await settle(page, options.waitSelector)

    if (options.clipSelector === undefined) {
      await page.screenshot({ path: filePath, fullPage: options.isFullPage })
    } else {
      const target = page.locator(options.clipSelector).first()
      await target.waitFor({ state: 'visible' })
      await target.screenshot({ path: filePath })
    }
  } finally {
    await page.close()
  }

  return diagnostics
}

async function main(): Promise<void> {
  const options = parseOptions()
  await preflight(options.baseUrl)

  const outDir = isAbsolute(options.outDir) ? options.outDir : resolve(process.cwd(), options.outDir)
  await mkdir(outDir, { recursive: true })

  const browser = await chromium.launch({ headless: !options.isHeaded })
  const writtenPaths: string[] = []
  let errorCount = 0

  try {
    for (const viewport of options.viewports) {
      for (const theme of options.themes) {
        const colorScheme = theme === 'system' ? options.prefers : theme

        const context = await browser.newContext({
          viewport,
          deviceScaleFactor: options.deviceScaleFactor,
          colorScheme,
          reducedMotion: options.isReducedMotion ? 'reduce' : 'no-preference',
        })

        // the root loader reads this cookie, so the server-rendered markup already carries the theme
        await context.addCookies([{ name: THEME_COOKIE_NAME, value: theme, url: options.baseUrl }])

        try {
          for (const route of options.routes) {
            const suffixes = [
              options.isFullPage ? 'full' : undefined,
              options.clipSelector === undefined ? undefined : 'clip',
            ]
            const suffix = suffixes.filter((value) => value !== undefined).join('-')
            const name = [toRouteSlug(route), `${viewport.width}x${viewport.height}`, theme].join('-')
            const filePath = join(outDir, `${suffix === '' ? name : `${name}-${suffix}`}.png`)

            const diagnostics = await captureRoute(context, route, filePath, options)
            writtenPaths.push(filePath)

            console.log(`${filePath}`)

            for (const diagnostic of diagnostics) {
              errorCount += 1
              console.log(`  ! ${diagnostic.kind}: ${diagnostic.detail}`)
            }
          }
        } finally {
          await context.close()
        }
      }
    }
  } finally {
    await browser.close()
  }

  console.log(`\n${writtenPaths.length} screenshot(s) written to ${outDir}`)

  if (errorCount > 0) {
    console.log(`${errorCount} diagnostic(s) captured`)

    if (options.isStrict) {
      process.exitCode = 1
    }
  }
}

await main()
