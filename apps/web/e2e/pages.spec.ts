import { expect, type Page, test } from '@playwright/test'

/**
 * Collect errors reported by the browser including uncaught exceptions, hydration errors, and CSP violations.
 */
function collectErrors(page: Page): string[] {
  const errors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })

  page.on('pageerror', (error) => {
    errors.push(error.message)
  })

  return errors
}

for (const path of ['/', '/example']) {
  test(`${path} loads without errors`, async ({ page }) => {
    const errors = collectErrors(page)
    const response = await page.goto(path, { waitUntil: 'networkidle' })

    expect(response?.status()).toBe(200)
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect(errors).toEqual([])
  })
}

test('navigates on the client', async ({ page }) => {
  const errors = collectErrors(page)
  const documentRequests: string[] = []

  page.on('request', (request) => {
    if (request.isNavigationRequest()) {
      documentRequests.push(request.url())
    }
  })

  await page.goto('/', { waitUntil: 'networkidle' })
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Example' }).click()

  await expect(page).toHaveURL('/example')
  await expect(page.getByRole('heading', { level: 1, name: 'Example Page Route' })).toBeVisible()
  expect(documentRequests).toHaveLength(1)
  expect(errors).toEqual([])
})

test('unknown paths respond with 404', async ({ page }) => {
  const response = await page.goto('/does-not-exist')

  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Not Found')
})

test('serves robots.txt and sitemap.xml', async ({ request }) => {
  const robots = await request.get('/robots.txt')
  const sitemap = await request.get('/sitemap.xml')

  expect(robots.status()).toBe(200)
  expect(robots.headers()['content-type']).toContain('text/plain')
  expect(await robots.text()).toContain('User-agent: *')

  expect(sitemap.status()).toBe(200)
  expect(sitemap.headers()['content-type']).toContain('application/xml')
  expect(await sitemap.text()).toContain('<urlset')
})

// tests run with ENVIRONMENT=production: the worker sends `X-Robots-Tag: noindex` in other environments
for (const path of ['/', '/sitemap.xml']) {
  test(`${path} may be indexed in production`, async ({ request }) => {
    const response = await request.get(path)

    expect(response.status()).toBe(200)
    expect(response.headers()['x-robots-tag']).toBeUndefined()
  })
}
