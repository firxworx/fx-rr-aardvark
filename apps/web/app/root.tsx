import { useEffect } from 'react'
import { data, Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from 'react-router'
import { CSPProvider, DirectionProvider } from '@base-ui/react'
import { Tooltip } from '@base-ui/react/tooltip'
import interLatinUrl from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v8'
import type { $ZodConfig } from 'zod/v4/core'

import type { Route } from './+types/root'

import { DEFAULT_THEME_MODE } from '@workspace/core/theme'
import { DocumentSeo, ErrorSeo } from '@workspace/seo'
import { AnchoredToastProvider, ToastProvider, toastManager } from '@workspace/ui/components/toast'
import { DEFAULT_LOCALE, IS_DEV_BUILD } from '@/constants'
import { envContext } from '@/context.server'
import { AppLayout } from '@/layout/app-layout'
import { GeneralErrorBoundary, getErrorInfo } from '@/layout/error-boundary'
import { RouteTransition } from '@/layout/route-transition'
import { CSP_NONCE_META_PROPERTY, useNonceContext } from '@/lib/nonce.context'
import { getTheme } from '@/lib/theme.server'
import { crossOriginMiddleware } from '@/middleware/cross-origin.middleware.server'
import { getToast, toastMiddleware } from '@/middleware/toast.middleware.server'
import { trailingSlashMiddleware } from '@/middleware/trailing-slash.middleware.server'
import { SEO_CONFIG } from '@/seo'

// inter @font-face css is bundled into the root route css (rendered by <Links />); see preload in links()
import '@fontsource-variable/inter'
import stylesheet from '@/styles/app.css?url'

/**
 * Global middleware applied to all routes; `crossOriginMiddleware` (CSRF protection) must be first.
 *
 * @see https://github.com/code-forge-io/remix-toast (README for middleware mode; the basis for this implementation)
 */
export const middleware = [crossOriginMiddleware(), trailingSlashMiddleware(), toastMiddleware()]

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
    siteUrl: context.get(envContext).SITE_URL, // origin of canonical, og:url, and og:image URLs
  })
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
        {/* route `meta` exports: not for SEO tags, which `DocumentSeo` renders (refer to docs/seo.md) */}
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
  const { toast, siteUrl } = loaderData
  const nonce = useNonceContext()

  // zod config jitless must run before zod loads on the client to avoid CSP unsafe-eval errors
  const ZOD_GLOBAL_CONFIG_KEY = '__zod_globalConfig'
  const ZOD_CONFIG: $ZodConfig = {
    jitless: true,
  }

  // render server-initiated toasts obtained from root loader data
  // deferred because on a full page load this effect runs before the parent `ToastProvider` subscribes to `toastManager`
  // (react runs child effects first) and the manager drops toasts added without a subscriber
  useEffect(() => {
    if (!toast) {
      return
    }

    const defaultTimeoutMs = 5000

    const timer = setTimeout(() => {
      toastManager.add({
        type: toast.type,
        title: toast.title,
        description: toast.description,
        timeout: toast.duration ?? defaultTimeoutMs,
        priority: toast.priority,
      })
    }, 0)

    return () => clearTimeout(timer)
  }, [toast])

  return (
    <>
      {/* title, meta, and link tags from the `seo` values of routes (refer to docs/seo.md) */}
      <DocumentSeo config={SEO_CONFIG} siteUrl={siteUrl} strict={IS_DEV_BUILD} />
      <script
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `globalThis.${ZOD_GLOBAL_CONFIG_KEY} = Object.assign(globalThis.${ZOD_GLOBAL_CONFIG_KEY} ?? {}, ${JSON.stringify(ZOD_CONFIG)});`,
        }}
      />
      <CSPProvider disableStyleElements>
        <NuqsAdapter>
          <AppLayout>
            <RouteTransition>
              <Outlet />
            </RouteTransition>
          </AppLayout>
        </NuqsAdapter>
      </CSPProvider>
    </>
  )
}

/**
 * Error pages render instead of `App` (and its `DocumentSeo`): `ErrorSeo` sets their title and `noindex`.
 */
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps): React.JSX.Element {
  return (
    <>
      <ErrorSeo config={SEO_CONFIG} title={getErrorInfo(error).message} />
      <GeneralErrorBoundary isDevelopment={IS_DEV_BUILD} />
    </>
  )
}
