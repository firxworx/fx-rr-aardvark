import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { MehIcon } from 'lucide-react'
import * as z from 'zod'

import { buttonVariants } from '@workspace/ui/variants/button.variants'
import { MAIN_ELEMENT_ID } from '@/constants'
import { LayoutContainer } from '@/layout/app-layout'

export type ErrorInfo = {
  message: string
  detail: string
}

const HTTP_ERRORS: Record<number, ErrorInfo> = {
  400: {
    message: '400 Bad Request',
    detail: 'The request could not be processed.',
  },
  401: {
    message: '401 Unauthorized',
    detail: 'Sign in to view this page.',
  },
  403: {
    message: '403 Forbidden',
    detail: 'You do not have permission to view this page.',
  },
  404: {
    message: '404 Not Found',
    detail: 'The page you are looking for does not exist.',
  },
  405: {
    message: '405 Method Not Allowed',
    detail: 'This page does not accept the request.',
  },
  500: {
    message: '500 Internal Server Error',
    detail: 'Something went wrong on our end. Try again later.',
  },
  503: {
    message: '503 Service Unavailable',
    detail: 'The site is temporarily unavailable. Try again later.',
  },
}

const DEFAULT_ERROR: ErrorInfo = {
  message: 'Something went wrong',
  detail: 'An unexpected error occurred. Refresh the page or try again later.',
}

/**
 * Optional data of a thrown response that replaces the default text, e.g.
 * `throw data({ message: 'Post not found' }, 404)`.
 *
 * Thrown data is sent to the browser: never include internal details.
 */
const zErrorData = z.object({
  message: z.string().optional(),
  detail: z.string().optional(),
})

/**
 * Get the text to display for an error caught by an error boundary.
 *
 * Errors other than thrown responses get generic text: in production builds react-router replaces server errors with
 * a generic error, and client errors may contain internal details.
 */
export function getErrorInfo(error: unknown): ErrorInfo {
  if (!isRouteErrorResponse(error)) {
    return DEFAULT_ERROR
  }

  const statusError: ErrorInfo | undefined =
    HTTP_ERRORS[error.status] ??
    (error.statusText === '' ? undefined : { message: `${error.status} ${error.statusText}`, detail: '' })

  const parsed = zErrorData.safeParse(error.data)
  const data = parsed.success ? parsed.data : {}

  return {
    message: data.message ?? statusError?.message ?? DEFAULT_ERROR.message,
    detail: data.detail ?? statusError?.detail ?? DEFAULT_ERROR.detail,
  }
}

function DevErrorDisplay({ message, detail, stack }: ErrorInfo & { stack?: string | undefined }): React.JSX.Element {
  return (
    <LayoutContainer as="main" id={MAIN_ELEMENT_ID} className="space-y-4 py-16">
      <div className="space-y-1">
        <h1 className="font-semibold text-lg">{message}</h1>
        <p className="text-base text-muted-foreground">{detail}</p>
      </div>
      {stack !== undefined && stack !== '' && (
        <pre className="w-full overflow-x-auto rounded-lg bg-destructive/10 p-4 text-destructive text-sm">
          <code>{stack}</code>
        </pre>
      )}
    </LayoutContainer>
  )
}

/**
 * Full-page error display without the app layout (header, navigation, footer).
 *
 * `min-h-dvh` vs. `h-screen`: the page only scrolls when its content does not fit (`100vh` is taller than the visible
 * viewport on mobile browsers while their toolbars are shown).
 */
function ErrorDisplay({ message, detail }: ErrorInfo): React.JSX.Element {
  return (
    <main id={MAIN_ELEMENT_ID} className="flex min-h-dvh items-center justify-center p-6">
      <div className="mx-auto flex max-w-sm flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-muted p-3">
          <MehIcon className="size-6" />
        </div>

        <div className="space-y-1">
          <h1 className="font-semibold text-lg text-balance">{message}</h1>
          {detail !== '' && <p className="text-base text-muted-foreground text-pretty">{detail}</p>}
        </div>

        <Link to="/" className={buttonVariants()}>
          Back to home
        </Link>
      </div>
    </main>
  )
}

/**
 * Error boundary of the root route: renders every error page without the app layout so that it does not depend on
 * loader data of layout routes (which may be what failed).
 *
 * Development builds show the message and stack of errors. Thrown responses (e.g. 404) show the same page in all builds.
 */
export function GeneralErrorBoundary({ isDevelopment }: { isDevelopment: boolean }): React.JSX.Element {
  const error = useRouteError()

  if (isDevelopment && error instanceof Error) {
    return <DevErrorDisplay message="Application Error" detail={error.message} stack={error.stack} />
  }

  return <ErrorDisplay {...getErrorInfo(error)} />
}
