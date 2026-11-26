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

test('reports a failed navigation once and displays the error boundary', async ({ page }) => {
  const errors = collectErrors(page)

  await page.route('**/example.data*', (route) => route.fulfill({ status: 500, body: 'Internal Server Error' }))
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Example' }).click()

  await expect(page.getByRole('heading', { level: 1, name: '500 Internal Server Error' })).toBeVisible()

  const reports = errors.filter((error) => error.startsWith('Client error:'))

  expect(reports).toHaveLength(1)
  expect(reports[0]).toContain('router')
})

test('unknown paths respond with 404', async ({ page }) => {
  const response = await page.goto('/does-not-exist')

  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1, name: '404 Not Found' })).toBeVisible()
  await expect(page).toHaveTitle(/^404 Not Found/)
})

// error pages render without the app layout and only scroll if their content does not fit
for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 664 },
]) {
  test(`error page fits a ${viewport.width}x${viewport.height} viewport`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/does-not-exist')

    await expect(page.getByRole('banner')).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(viewport.height)
  })
}

test('skip link is the first tab stop and moves focus past the header', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.keyboard.press('Tab')

  const skipLink = page.getByRole('link', { name: 'Skip to main content' })

  await expect(skipLink).toBeFocused()
  await expect(skipLink).toBeInViewport()

  await page.keyboard.press('Enter')
  await page.keyboard.press('Tab')

  await expect(page.locator('main :focus')).toHaveCount(1)
})

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`with ${colorScheme} color scheme`, () => {
    test.use({ colorScheme })

    test('error page link is legible', async ({ page }) => {
      await page.goto('/does-not-exist')

      const link = page.getByRole('link', { name: 'Back to home' })

      // the text of a button style must not inherit the color that it uses as its background
      const { color, backgroundColor, expectedColor } = await link.evaluate((element) => {
        const probe = document.createElement('span')
        probe.style.color = 'var(--primary-foreground)'
        element.appendChild(probe)

        const { color, backgroundColor } = getComputedStyle(element)

        return { color, backgroundColor, expectedColor: getComputedStyle(probe).color }
      })

      expect(color).toBe(expectedColor)
      expect(color).not.toBe(backgroundColor)
    })
  })
}

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

test('health route reports the environment and version', async ({ request }) => {
  const response = await request.get('/health')

  expect(response.status()).toBe(200)
  expect(response.headers()['content-type']).toContain('application/json')
  expect(response.headers()['cache-control']).toBe('no-store')
  expect(response.headers()['x-robots-tag']).toBe('noindex')

  const body = await response.json()

  expect(body).toMatchObject({ status: 'ok', environment: 'production' })
  expect(typeof body.version?.id).toBe('string')
})

// tests run with ENVIRONMENT=production: the worker sends `X-Robots-Tag: noindex` in other environments
for (const path of ['/', '/sitemap.xml']) {
  test(`${path} may be indexed in production`, async ({ request }) => {
    const response = await request.get(path)

    expect(response.status()).toBe(200)
    expect(response.headers()['x-robots-tag']).toBeUndefined()
  })
}
