import type { Route } from './+types/route'

import { envContext } from '@/context.server'
import { PageLayout } from '@/layout/app-layout'

export function loader({ context }: Route.LoaderArgs) {
  return { env: context.get(envContext).ENVIRONMENT }
}

export default function ExampleRoute({ loaderData: { env } }: Route.ComponentProps): React.JSX.Element {
  return (
    <PageLayout>
      <h1>Example Page Route</h1>
      <p>ENVIRONMENT: {env}</p>
      <p>This route intentionally has minimal content.</p>
    </PageLayout>
  )
}
