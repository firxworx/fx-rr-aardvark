import { StrictMode, startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { HydratedRouter } from 'react-router/dom'

import { getDocumentNonce, NonceContextProvider } from '@/lib/nonce.context'

// client must render the same nonce as the server (react 19.3+ compares it during hydration)
const nonce = getDocumentNonce()

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <NonceContextProvider nonce={nonce}>
        <HydratedRouter />
      </NonceContextProvider>
    </StrictMode>,
  )
})
