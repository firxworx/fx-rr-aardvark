import { expect, test } from '@playwright/test'

import { APP_ACTIONS_THEME_PATHNAME, THEME_INPUT_NAME } from '@workspace/core/theme'

for (const javaScriptEnabled of [true, false]) {
  test.describe(`with javascript ${javaScriptEnabled ? 'enabled' : 'disabled'}`, () => {
    test.use({ javaScriptEnabled })

    test('switches theme, stays on the page, and persists', async ({ page }) => {
      await page.goto('/example?query=1')

      if (javaScriptEnabled) {
        await page.waitForLoadState('networkidle')
      }

      await page.getByRole('button', { name: 'Dark' }).click()

      await expect(page.locator('html')).toHaveClass('dark')
      await expect(page).toHaveURL('/example?query=1')

      await page.reload()
      await expect(page.locator('html')).toHaveClass('dark')
    })
  })
}

test('responds with 400 to invalid input', async ({ request }) => {
  const invalidTheme = await request.post(APP_ACTIONS_THEME_PATHNAME, { form: { [THEME_INPUT_NAME]: 'invalid' } })
  const invalidBody = await request.post(APP_ACTIONS_THEME_PATHNAME, { data: {} })

  expect(invalidTheme.status()).toBe(400)
  expect(invalidBody.status()).toBe(400)
})

for (const referrerPath of ['https://evil.example/', '//evil.example/']) {
  test(`does not redirect to another host with referrer ${referrerPath}`, async ({ request, baseURL }) => {
    const referrer = referrerPath.startsWith('//') ? `${baseURL}${referrerPath}` : referrerPath

    const response = await request.post(APP_ACTIONS_THEME_PATHNAME, {
      headers: { Accept: 'text/html', Referer: referrer },
      form: { [THEME_INPUT_NAME]: 'dark' },
      maxRedirects: 0,
    })

    const location = response.headers().location ?? ''

    expect(response.status()).toBe(303)
    expect(new URL(location, baseURL).origin).toBe(baseURL)
  })
}
