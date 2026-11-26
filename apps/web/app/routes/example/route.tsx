import type { Route } from './+types/route'

import type { SeoHandle } from '@workspace/seo'
import { envContext } from '@/context.server'
import { PageLayout } from '@/layout/app-layout'

// static SEO values; values that depend on data can be returned as `seo` from the loader (refer to docs/seo.md)
export const handle = {
  seo: {
    title: 'Example',
    description: 'Example route of the React Router starter template.',
  },
} satisfies SeoHandle

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
