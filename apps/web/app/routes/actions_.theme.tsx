import { data } from 'react-router'

import type { Route } from './+types/actions_.theme'

import { THEME_INPUT_NAME, zThemeMode } from '@workspace/core/theme'
import { getThemeSetCookieHeaderValue } from '@/lib/theme.server'

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const themeMode = zThemeMode.parse(formData.get(THEME_INPUT_NAME))

  return data(null, {
    headers: { 'Set-Cookie': await getThemeSetCookieHeaderValue(themeMode) },
  })
}
