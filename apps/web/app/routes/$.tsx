import { data } from 'react-router'

import type { Route } from './+types/$'

import { ProductionErrorDisplay } from '@/layout/error-boundary'

export async function loader({}: Route.LoaderArgs) {
  return data({}, 404)
}

export default function NotFoundRoute(): React.JSX.Element {
  return <ErrorBoundary />
}

export function ErrorBoundary(): React.JSX.Element {
  return (
    <ProductionErrorDisplay
      message="Oops! Page Not Found."
      detail="The content you're looking for at this URL was not found."
    />
  )
}
