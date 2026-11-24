/**
 * Server-initiated toasts based on `remix-toast` middleware mode with a customized
 * interface that matches the client-side `toastManager` from `@workspace/ui/components/toast`
 * powered by `coss-ui` and its underlying `base-ui`.
 *
 * The `remix-toast` v4.0.0 README describing _Middleware Mode_ for rr7+ middleware
 * is relevant to this implementation.
 *
 * This module uses session cookie storage for toast data; it is designed to easily accept
 * a custom session storage strategy if desired.
 *
 * Usage in a server action or loader:
 *
 * ```ts
 * import { setToast } from '@/middleware/toast.middleware.server'
 *
 * setToast(context, { type: 'success', title: 'hello toast!', description: 'This is a server action toast.' })
 * ```
 *
 * - Refer to `@workspace/ui/components/toast` for the client-side `toastManager` and usage.
 * - Refer to `root.tsx` for the integration of server-initiated toasts with the client-side `toastManager`.
 *
 * @see https://coss.com/ui/docs/components/toast
 * @see https://base-ui.com/react/components/toast
 * @see https://base-ui.com/react/components/toast#additional-types
 * @see https://github.com/code-forge-io/remix-toast/blob/main/src/index.ts
 * @see https://github.com/code-forge-io/remix-toast/blob/main/src/schema.ts
 * @see https://github.com/code-forge-io/remix-toast/blob/main/src/middleware/index.ts
 *
 * @module
 */

import {
  createContext,
  createCookieSessionStorage,
  type MiddlewareFunction,
  type RouterContextProvider,
  type SessionIdStorageStrategy,
  type SessionStorage,
} from 'react-router'
import * as z from 'zod'

import { env } from '@/env.server'

/** @public */
export type AppToastMessage = z.infer<typeof zAppToastMessage>

type AppToastCookieOptions = Partial<SessionIdStorageStrategy['cookie']>

const TOAST_COOKIE_NAME = 'app_toast_session'
const FLASH_SESSION = 'flash'

const TOAST_COOKIE_SECRET = env.TOAST_COOKIE_SECRET

const toastContext = createContext<AppToastMessage | null>(null)
const sessionToastContext = createContext<AppToastMessage | null>(null)

/**
 * Zod schema for toast message that aligns with `@workspace/ui/components/toast`.
 *
 * Refer to the types exported by `@base-ui/react/toast` for typing of the arguments
 * accepted by the toast manager's `add()` method.
 *
 * ```ts
 * import { type ToastManagerAddOptions } from '@base-ui/react/toast'
 * ```
 *
 * @see https://coss.com/ui/docs/components/toast
 * @see https://base-ui.com/react/components/toast#additional-types
 */
const zAppToastMessage = z.looseObject({
  title: z.string(),
  description: z.string().optional(),
  duration: z.number().int().nonnegative().optional(),
  type: z.custom<'info' | 'success' | 'error' | 'warning'>(),
  priority: z.custom<'low' | 'high'>().optional(),
})

const zFlashSessionValues = z.object({
  toast: zAppToastMessage.optional(),
})

const toastCookieOptions = {
  name: TOAST_COOKIE_NAME,
  sameSite: 'lax',
  path: '/',
  httpOnly: true,

  // secrets are not highly sensitive (tampering with the cookie is not a significant security risk)
  secrets: TOAST_COOKIE_SECRET ? [TOAST_COOKIE_SECRET] : undefined,
} satisfies AppToastCookieOptions

const defaultSessionStorage = createCookieSessionStorage({
  cookie: toastCookieOptions,
})

/**
 * Helper method used to get the toast data from the current request and purge the flash storage from the session.
 *
 * Adapted from `remix-toast` middleware module which imports internal `getToast()` (which this function
 * is based off) as `getToastPrimitive()` in `src/middleware/index.ts`. Revised to always accept `sessionStorage`
 * so decision of which session storage to use is sole responsibility of the caller.
 *
 * https://github.com/code-forge-io/remix-toast/blob/main/src/middleware/index.ts
 * https://github.com/code-forge-io/remix-toast/blob/main/src/index.ts
 *
 * @returns toast message if exists (else `undefined`); plus headers to purge it from the session
 */
async function processRequest(
  request: Request,
  sessionStorage: SessionStorage,
): Promise<{ toast: AppToastMessage | undefined; headers: Headers }> {
  const cookie = request.headers.get('Cookie')
  const session = await sessionStorage.getSession(cookie)

  const result = zFlashSessionValues.safeParse(session.get(FLASH_SESSION))
  const flash = result.success ? result.data : undefined

  const headers = new Headers({
    'Set-Cookie': await sessionStorage.commitSession(session),
  })

  const toast = flash?.toast
  return { toast, headers }
}

export function toastMiddleware(options?: { customSession?: SessionStorage }): MiddlewareFunction {
  const { customSession } = options || {}
  const sessionStorage = customSession || defaultSessionStorage

  return async function toastMiddleware({ request, context }, next) {
    const { toast, headers } = await processRequest(request, sessionStorage)

    context.set(toastContext, toast ?? null)

    // call next middleware or route handler
    const res = await next()

    if (res instanceof Response && toast) {
      res.headers.append('Set-Cookie', headers.get('Set-Cookie') ?? '')
    }

    const toastToSet = context.get(sessionToastContext)

    if (res instanceof Response && toastToSet) {
      const session = await sessionStorage.getSession(request.headers.get('Cookie'))

      session.flash(FLASH_SESSION, { toast: toastToSet })
      res.headers.append('Set-Cookie', await sessionStorage.commitSession(session))
    }

    return res
  }
}

/**
 * Set a server-initiated toast from a loader, action, or middleware. It displays when the root loader next runs
 * (e.g. the revalidation after an action).
 *
 * @public
 */
export const setToast = (
  context: RouterContextProvider | Readonly<RouterContextProvider>,
  toast: AppToastMessage | null,
) => {
  context.set(sessionToastContext, toast)
}

export const getToast = (context: RouterContextProvider | Readonly<RouterContextProvider>) => context.get(toastContext)
