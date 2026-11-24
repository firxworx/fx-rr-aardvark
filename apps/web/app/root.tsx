import { useEffect } from 'react'
import { data, Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from 'react-router'
import { CSPProvider, DirectionProvider } from '@base-ui/react'
import { Tooltip } from '@base-ui/react/tooltip'
import interLatinUrl from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v8'
import type { $ZodConfig } from 'zod/v4/core'

import type { Route } from './+types/root'

import { DEFAULT_THEME_MODE } from '@workspace/core/theme'
import { AnchoredToastProvider, ToastProvider, toastManager } from '@workspace/ui/components/toast'
import { DEFAULT_LOCALE, DEFAULT_META_DESCRIPTION, DEFAULT_META_TITLE } from '@/constants'
import { env } from '@/env.server'
import { AppLayout } from '@/layout/app-layout'
import { GeneralErrorBoundary } from '@/layout/error-boundary'
import { CSP_NONCE_META_PROPERTY, useNonceContext } from '@/lib/nonce.context'
import { getTheme } from '@/lib/theme.server'
import { getToast, toastMiddleware } from '@/middleware/toast.middleware.server'

// inter @font-face css is bundled into the root route css (rendered by <Links />); see preload in links()
import '@fontsource-variable/inter'
import stylesheet from '@/styles/app.css?url'

/**
 * Global middleware applied to all routes.
 *
 * @see https://github.com/code-forge-io/remix-toast (README for middleware mode; the basis for this implementation)
 */
export const middleware = [toastMiddleware()]

/**
 * Refer to `entry.server.tsx` and `workers/app.ts` for security headers; the CSP is defined in `@workspace/core/csp`.
 * Remember CSP must be updated when linking to external resources e.g. CDNs, fonts, analytics, etc.
 */
export const links: Route.LinksFunction = () => [
  { rel: 'preload', href: interLatinUrl, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
  { rel: 'stylesheet', href: stylesheet },
  { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
  { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
  { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },

  // set manifest for PWA icon support (optional)
  // { rel: 'manifest', href: '/manifest.webmanifest' },
]

export async function loader({ request, context }: Route.LoaderArgs) {
  const theme = await getTheme(request)
  const toast = getToast(context)

  return data({
    theme,
    toast, // server-initiated toasts (rendered by App component below)
    siteUrl: env.SITE_URL,
  })
}

export function meta(): Route.MetaDescriptors {
  return [{ title: DEFAULT_META_TITLE }, { name: 'description', content: DEFAULT_META_DESCRIPTION }]
}

export function Layout({ children }: { children: React.ReactNode }): React.JSX.Element {
  const data = useLoaderData<typeof loader | undefined>()
  const nonce = useNonceContext()

  const currentTheme = data?.theme ?? DEFAULT_THEME_MODE

  const locale = new Intl.Locale(DEFAULT_LOCALE)
  const { direction } = locale.getTextInfo()

  return (
    <html lang={DEFAULT_LOCALE} dir={direction} className={currentTheme === 'system' ? undefined : currentTheme}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property={CSP_NONCE_META_PROPERTY} nonce={nonce} />
        <Meta />
        <Links nonce={nonce} />
      </head>
      <body>
        <DirectionProvider direction={direction}>
          <ToastProvider>
            <AnchoredToastProvider>
              <Tooltip.Provider delay={300} closeDelay={100}>
                {children}
              </Tooltip.Provider>
            </AnchoredToastProvider>
          </ToastProvider>
        </DirectionProvider>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  )
}

/**
 * Base UI CSPProvider props disable injecting <style> elements
 * because global styles eliminate the need by including `base-ui-disable-scrollbar`.
 *
 * @see https://base-ui.com/react/utils/csp-provider
 */
export default function App({ loaderData }: Route.ComponentProps): React.JSX.Element {
  const { toast } = loaderData
  const nonce = useNonceContext()

  // zod config jitless must run before zod loads on the client to avoid CSP unsafe-eval errors
  const ZOD_GLOBAL_CONFIG_KEY = '__zod_globalConfig'
  const ZOD_CONFIG: $ZodConfig = {
    jitless: true,
  }

  // render server-initiated toasts obtained from root loader data
  useEffect(() => {
    if (!toast) {
      return
    }

    const defaultTimeoutMs = 5000
    const isServerToastType = ['info', 'success', 'warning', 'error'].includes(toast.type ?? '')

    toastManager.add({
      ...(isServerToastType && { type: toast.type }),
      title: toast.title ?? toast.message,
      description: toast.description,
      timeout: toast.duration ?? defaultTimeoutMs,
      priority: toast.priority,
    })
  }, [toast])

  return (
    <>
      <script
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `globalThis.${ZOD_GLOBAL_CONFIG_KEY} = Object.assign(globalThis.${ZOD_GLOBAL_CONFIG_KEY} ?? {}, ${JSON.stringify(ZOD_CONFIG)});`,
        }}
      />
      <CSPProvider disableStyleElements>
        <NuqsAdapter>
          <AppLayout>
            <Outlet />
          </AppLayout>
        </NuqsAdapter>
      </CSPProvider>
    </>
  )
}

export function ErrorBoundary(): React.JSX.Element {
  return <GeneralErrorBoundary isDevelopment={import.meta.env.DEV} />
}
