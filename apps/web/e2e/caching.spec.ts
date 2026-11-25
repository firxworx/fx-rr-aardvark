import { existsSync } from 'node:fs'
import { expect, test } from '@playwright/test'

const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable'

// `/assets/*` is cached as immutable (refer to `public/_headers`) so it must only contain hashed build output
test('public/assets does not exist', () => {
  expect(existsSync(new URL('../public/assets', import.meta.url))).toBe(false)
})

test('hashed build output is cached as immutable', async ({ request }) => {
  const document = await request.get('/')
  const html = await document.text()
  const paths = new Set(html.match(/\/assets\/[\w./-]+\.(?:js|css|woff2)/g))

  // confirm that the document references each type
  for (const extension of ['.js', '.css', '.woff2']) {
    expect([...paths].some((path) => path.endsWith(extension))).toBe(true)
  }

  for (const path of paths) {
    const response = await request.get(path)

    expect.soft(response.status(), path).toBe(200)
    expect.soft(response.headers()['cache-control'], path).toBe(IMMUTABLE_CACHE_CONTROL)
  }
})

test('other static assets are revalidated', async ({ request }) => {
  const response = await request.get('/favicon.ico')

  expect(response.status()).toBe(200)
  expect(response.headers()['cache-control']).toBe('public, max-age=0, must-revalidate')
})

// e.g. a tab opened before a deploy requests a file of the previous version
test('missing build output is not cached', async ({ request }) => {
  const response = await request.get('/assets/does-not-exist-00000000.js')

  expect(response.status()).toBe(404)
  expect(response.headers()['cache-control']).not.toContain('immutable')
})
