import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { compile } from 'tailwindcss'
import { describe, expect, it } from 'vitest'

const SRC_DIR = join(import.meta.dirname, '../src')
const THEME_CSS_PATH = join(import.meta.dirname, '../node_modules/tailwindcss/theme.css')

// e.g. `text-primary-foreground` and `bg-primary/90`, with or without variants (`hover:bg-primary/90`)
const COLOR_UTILITY_REGEX = /(?<=[\s'"`:])(?:bg|text|border|ring)-[A-Za-z][\w-]*(?:\/\d+)?(?=[\s'"`])/g
const COMMENT_REGEX = /\/\*[\s\S]*?\*\/|\/\/ .*$/gm

function getColorUtilities(source: string): string[] {
  return source.replace(COMMENT_REGEX, '').match(COLOR_UTILITY_REGEX) ?? []
}

async function createCompiler() {
  const paths = [THEME_CSS_PATH, join(SRC_DIR, 'styles/shadcn.css'), join(SRC_DIR, 'styles/palette.css')]
  const css = paths.map((path) => readFileSync(path, 'utf8')).join('\n')

  return compile(`${css}\n@tailwind utilities;`)
}

/**
 * Tailwind generates no css for a utility with an unknown token (e.g. `text-primary-fg`) and does not report it.
 * Text may then inherit the same color as its background.
 */
describe('color utilities', () => {
  const files = readdirSync(SRC_DIR, { recursive: true, encoding: 'utf8' }).filter((file) => /\.tsx?$/.test(file))
  const utilities = files.flatMap((file) =>
    getColorUtilities(readFileSync(join(SRC_DIR, file), 'utf8')).map((utility) => ({ file, utility })),
  )

  it('are found in source files', () => {
    expect(utilities).toContainEqual({ file: 'variants/button.variants.ts', utility: 'text-primary-foreground' })
    expect(utilities).toContainEqual({ file: 'variants/button.variants.ts', utility: 'bg-primary/90' })
  })

  it('refer to tokens that exist in the theme', async () => {
    const compiler = await createCompiler()
    const css = compiler.build(utilities.map(({ utility }) => utility))
    const unknown = utilities.filter(({ utility }) => !css.includes(`.${utility.replace('/', '\\/')} {`))

    expect(unknown).toEqual([])
  })
})
