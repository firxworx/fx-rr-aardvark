import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { compile } from 'tailwindcss'
import { describe, expect, it } from 'vitest'

const SRC_DIR = join(import.meta.dirname, '../src')
const STYLES_DIR = join(SRC_DIR, 'styles')
const NODE_MODULES_DIR = join(import.meta.dirname, '../node_modules')

// packages imported by globals.css
const PACKAGE_STYLESHEETS: Record<string, string> = {
  tailwindcss: join(NODE_MODULES_DIR, 'tailwindcss/index.css'),
  'tw-animate-css': join(NODE_MODULES_DIR, 'tw-animate-css/dist/tw-animate.css'),
  'shadcn/tailwind.css': join(NODE_MODULES_DIR, 'shadcn/dist/tailwind.css'),
}

// e.g. `text-primary-foreground` and `bg-primary/90`, with or without variants (`hover:bg-primary/90`)
const COLOR_UTILITY_REGEX = /(?<=[\s'"`])(?:[^\s'"`]+:)?(?:bg|text|border|ring)-[A-Za-z][\w-]*(?:\/\d+)?(?=[\s'"`])/g
const COMMENT_REGEX = /\/\*[\s\S]*?\*\/|\/\/ .*$/gm

function getColorUtilities(source: string): string[] {
  return source.replace(COMMENT_REGEX, '').match(COLOR_UTILITY_REGEX) ?? []
}

async function loadStylesheet(id: string, base: string) {
  const path = PACKAGE_STYLESHEETS[id] ?? resolve(base, id)

  return { path, base: dirname(path), content: readFileSync(path, 'utf8') }
}

/**
 * Tailwind generates no css for a utility with an unknown token (e.g. `text-primary-fg`) or variant and does not report
 * it. Text may then inherit the same color as its background.
 */
describe('color utilities', () => {
  const files = readdirSync(SRC_DIR, { recursive: true, encoding: 'utf8' }).filter((file) => /\.tsx?$/.test(file))
  const utilities = new Map(
    files.flatMap((file) =>
      getColorUtilities(readFileSync(join(SRC_DIR, file), 'utf8')).map((utility) => [utility, file] as const),
    ),
  )

  it('are found in source files', () => {
    expect(utilities.has('text-primary-foreground')).toBe(true)
    expect(utilities.has('hover:bg-primary/90')).toBe(true)
    expect(utilities.has('not-dark:bg-clip-padding')).toBe(true)
  })

  it('refer to tokens and variants that exist in global styles', async () => {
    const globals = readFileSync(join(STYLES_DIR, 'globals.css'), 'utf8')
    const compiler = await compile(globals, { base: STYLES_DIR, loadStylesheet })

    // build output accumulates: it does not change if a utility is unknown
    const unknown: { utility: string; file: string }[] = []
    let css = compiler.build([])

    for (const [utility, file] of utilities) {
      const nextCss = compiler.build([utility])

      if (nextCss === css) {
        unknown.push({ utility, file })
      }

      css = nextCss
    }

    expect(unknown).toEqual([])
  })
})
