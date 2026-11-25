import { type APIRequestContext, expect, test } from '@playwright/test'

import { SECURITY_HEADERS } from '@workspace/core/security-headers'
import { APP_ACTIONS_THEME_PATHNAME, THEME_INPUT_NAME } from '@workspace/core/theme'

async function getDocument(request: APIRequestContext): Promise<{ csp: string; nonce: string; html: string }> {
  const response = await request.get('/')
  const csp = response.headers()['content-security-policy'] ?? ''
  const nonce = csp.match(/'nonce-([^']+)'/)?.[1] ?? ''

  return { csp, nonce, html: await response.text() }
}

// covers a document, a static asset, and a resource route
// static assets bypass the worker: that case fails if `public/_headers` is not in sync with `SECURITY_HEADERS`
for (const path of ['/', '/favicon.ico', '/robots.txt']) {
  test(`${path} has security headers`, async ({ request }) => {
    const response = await request.get(path)
    const headers = response.headers()

    expect(response.status()).toBe(200)

    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect.soft(headers[name.toLowerCase()], name).toBe(value)
    }
  })
}

test('documents have a strict CSP with a nonce for each request', async ({ request }) => {
  const first = await getDocument(request)
  const second = await getDocument(request)

  expect(first.csp).toContain("default-src 'self'")
  expect(first.csp).toContain("'strict-dynamic'")
  expect(first.csp).toContain("object-src 'none'")
  expect(first.csp).not.toContain('unsafe-eval')

  expect(first.nonce).not.toBe('')
  expect(first.nonce).not.toBe(second.nonce)

  // the client reads the nonce from this tag so that it hydrates with the same value as the server
  expect(first.html).toContain(`<meta property="csp-nonce" nonce="${first.nonce}"`)

  const scriptTags = first.html.match(/<script\b[^>]*>/g) ?? []

  expect(scriptTags.length).toBeGreaterThan(0)

  for (const scriptTag of scriptTags) {
    expect(scriptTag).toContain(`nonce="${first.nonce}"`)
  }
})

test('documents are not stored by shared caches', async ({ request }) => {
  const response = await request.get('/')

  expect(response.headers()['cache-control']).toBe('private')
})

const CROSS_ORIGIN_HEADERS: Record<string, string>[] = [
  { 'Sec-Fetch-Site': 'cross-site' },
  { 'Sec-Fetch-Site': 'same-site' },
  { Origin: 'https://evil.example' },
  { Origin: 'null' },
]

for (const headers of CROSS_ORIGIN_HEADERS) {
  const description = JSON.stringify(headers)

  // resource routes are not covered by the origin check of react-router
  test(`rejects a cross-origin resource route action with ${description}`, async ({ request }) => {
    const response = await request.post(APP_ACTIONS_THEME_PATHNAME, { headers, form: { [THEME_INPUT_NAME]: 'dark' } })

    expect(response.status()).toBe(403)
    expect(response.headers()['set-cookie']).toBeUndefined()
  })

  // react-router responds with 400 if its own check rejects the request before middleware runs
  test(`rejects a cross-origin data request action with ${description}`, async ({ request }) => {
    const response = await request.post(`${APP_ACTIONS_THEME_PATHNAME}.data`, {
      headers,
      form: { [THEME_INPUT_NAME]: 'dark' },
    })

    expect([400, 403]).toContain(response.status())
    expect(response.headers()['set-cookie']).toBeUndefined()
  })
}
