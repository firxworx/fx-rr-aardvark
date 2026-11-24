import { data, href, redirect } from 'react-router'

import type { Route } from './+types/actions_.theme'

import { getSameHostReferrer } from '@workspace/core/request-origin'
import { THEME_INPUT_NAME, type ThemeMode, zThemeMode } from '@workspace/core/theme'
import { getThemeSetCookieHeaderValue } from '@/lib/theme.server'

/**
 * Get the theme mode from the request body or `undefined` if the body cannot be parsed or the value is invalid.
 */
async function parseThemeMode(request: Request): Promise<ThemeMode | undefined> {
  const formData = await request.formData().catch(() => undefined)
  const result = zThemeMode.safeParse(formData?.get(THEME_INPUT_NAME))

  return result.success ? result.data : undefined
}

export async function action({ request }: Route.ActionArgs) {
  const themeMode = await parseThemeMode(request)

  if (themeMode === undefined) {
    return data(null, { status: 400 })
  }

  const headers = { 'Set-Cookie': await getThemeSetCookieHeaderValue(themeMode) }

  // without JS the browser navigates to the response (accepts html): return to the page that submitted the form
  if (request.headers.get('Accept')?.includes('text/html')) {
    return redirect(getSameHostReferrer(request)?.href ?? href('/'), { status: 303, headers })
  }

  return data(null, { headers })
}
