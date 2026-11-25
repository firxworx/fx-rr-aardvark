import { StrictMode, startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { HydratedRouter } from 'react-router/dom'

import { getDocumentNonce, NonceContextProvider } from '@/lib/nonce.context'
import { reportClientError } from '@/lib/report-client-error'

// client must render the same nonce as the server (react 19.3+ compares it during hydration)
const nonce = getDocumentNonce()

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <NonceContextProvider nonce={nonce}>
        <HydratedRouter
          onError={(error, { pattern, errorInfo }) => {
            // render errors (with errorInfo) are reported by `onCaughtError`
            if (!errorInfo) {
              reportClientError(error, { source: 'router', pattern })
            }
          }}
        />
      </NonceContextProvider>
    </StrictMode>,
    {
      // unlike `onError` of `<HydratedRouter>` this includes errors thrown by a root error boundary
      onCaughtError: (error, { componentStack }) =>
        reportClientError(error, { source: 'react-caught', componentStack }),
      onUncaughtError: (error, { componentStack }) =>
        reportClientError(error, { source: 'react-uncaught', componentStack }),
      onRecoverableError: (error, { componentStack }) =>
        reportClientError(error, { source: 'react-recoverable', componentStack }),
    },
  )
})
