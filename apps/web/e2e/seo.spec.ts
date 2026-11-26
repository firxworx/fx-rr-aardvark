import { expect, type Page, test } from '@playwright/test'

/**
 * Count elements in `<head>` that match a selector (React hoists title, meta, and link tags of components there).
 */
async function countInHead(page: Page, selector: string): Promise<number> {
  return await page.locator(`head ${selector}`).count()
}

function getAttribute(html: string, pattern: RegExp): string | undefined {
  return pattern.exec(html)?.[1]
}

test('home page HTML has one set of SEO tags with absolute URLs and JSON-LD', async ({ request }) => {
  const html = await (await request.get('/')).text()
  const canonical = getAttribute(html, /<link rel="canonical" href="([^"]+)"/)
  const jsonLd = getAttribute(html, /<script type="application\/ld\+json">([^<]+)<\/script>/)

  expect(html.match(/<title>/g)).toHaveLength(1)
  expect(html.match(/<meta name="description"/g)).toHaveLength(1)
  expect(html).not.toContain('name="robots"')

  expect(canonical).toMatch(/^https:\/\/[^/]+\/$/)
  expect(getAttribute(html, /<meta property="og:url" content="([^"]+)"/)).toBe(canonical)
  expect(getAttribute(html, /<meta property="og:image" content="([^"]+)"/)).toBe(`${canonical}images/og-default.png`)

  expect(jsonLd).toBeDefined()
  expect(JSON.parse(jsonLd ?? '{}')).toMatchObject({
    '@context': 'https://schema.org',
    '@graph': [{ '@type': 'WebSite', url: canonical }],
  })
})

test('route handle sets the title, description, and canonical URL', async ({ request }) => {
  const html = await (await request.get('/example?utm_source=test')).text()

  expect(html).toContain('<title>Example | Acme</title>')
  expect(html).toContain('<meta property="og:title" content="Example"/>')
  // the query string is not part of the canonical URL
  expect(getAttribute(html, /<link rel="canonical" href="([^"]+)"/)).toMatch(/^https:\/\/[^/]+\/example$/)
})

test('error pages are noindex without a canonical URL or Open Graph tags', async ({ request }) => {
  const response = await request.get('/does-not-exist')
  const html = await response.text()

  expect(response.status()).toBe(404)
  expect(html).toContain('<title>404 Not Found | Acme</title>')
  expect(html).toContain('<meta name="robots" content="noindex"/>')
  expect(html).not.toContain('rel="canonical"')
  expect(html).not.toContain('og:')
  expect(html).not.toContain('ld+json')
})

test('keeps one set of tags after hydration and client navigation', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })

  expect(await countInHead(page, 'title')).toBe(1)
  expect(await countInHead(page, 'meta[name="description"]')).toBe(1)
  expect(await countInHead(page, 'link[rel="canonical"]')).toBe(1)

  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Example' }).click()

  await expect(page).toHaveTitle('Example | Acme')
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', /\/example$/)
  await expect(page.locator('head meta[property="og:url"]')).toHaveAttribute('content', /\/example$/)
  expect(await countInHead(page, 'title')).toBe(1)
  expect(await countInHead(page, 'meta[name="description"]')).toBe(1)
  expect(await countInHead(page, 'link[rel="canonical"]')).toBe(1)
  expect(await countInHead(page, 'meta[property="og:url"]')).toBe(1)
})

test('replaces the tags of the page with those of the error page on a failed navigation', async ({ page }) => {
  await page.route('**/example.data*', (route) => route.fulfill({ status: 500, body: 'Internal Server Error' }))
  await page.goto('/', { waitUntil: 'networkidle' })
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Example' }).click()

  await expect(page).toHaveTitle('500 Internal Server Error | Acme')
  expect(await countInHead(page, 'title')).toBe(1)
  expect(await countInHead(page, 'meta[name="robots"]')).toBe(1)
  expect(await countInHead(page, 'link[rel="canonical"]')).toBe(0)
  expect(await countInHead(page, 'meta[property^="og:"]')).toBe(0)
})
