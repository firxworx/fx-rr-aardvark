import { createCookie } from 'react-router'

import { DEFAULT_THEME_MODE, THEME_COOKIE_NAME, type ThemeMode, zThemeMode } from '@workspace/core/conventions'
import { IS_PROD_BUILD } from '@/constants'

/**
 * Cookie (react-router) to store and persist theme preference across sessions.
 */
const themeCookie = createCookie(THEME_COOKIE_NAME, {
  path: '/',
  sameSite: 'lax',
  secure: IS_PROD_BUILD,
  httpOnly: false, // allow client-side access to cookie value
  maxAge: 60 * 60 * 24 * 365, // 1 year in seconds
})

/**
 * Get current theme mode (light/dark/system) from request cookie with fallback to {@link DEFAULT_THEME_MODE}.
 */
export async function getTheme(request: Request): Promise<ThemeMode> {
  const value: unknown = await themeCookie.parse(request.headers.get('Cookie'))
  const result = zThemeMode.safeParse(value)

  return result.success ? result.data : DEFAULT_THEME_MODE
}

/**
 * Return serialized cookie string to change to the given theme.
 * Add a `Set-Cookie` header to the response with the value returned by this function.
 */
export async function getThemeSetCookieHeaderValue(nextTheme: ThemeMode): Promise<string> {
  return await themeCookie.serialize(zThemeMode.parse(nextTheme))
}
