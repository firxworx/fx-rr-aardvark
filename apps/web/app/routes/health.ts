import type { Route } from './+types/health'

import { cloudflareContext, envContext } from '@/context.server'

/**
 * Resource route for `/health`: reports the environment and the deployed version for uptime monitoring.
 *
 * The version comes from the `CF_VERSION_METADATA` binding (`version_metadata` in `wrangler.jsonc`): compare `id`
 * with the output of `wrangler deployments list`. It does not check dependencies such as databases.
 *
 * @see https://developers.cloudflare.com/workers/runtime-apis/bindings/version-metadata/
 */
export function loader({ context }: Route.LoaderArgs): Response {
  const { env } = context.get(cloudflareContext)
  const { ENVIRONMENT } = context.get(envContext)
  const { id, tag, timestamp } = env.CF_VERSION_METADATA

  return Response.json(
    {
      status: 'ok',
      environment: ENVIRONMENT,
      version: { id, tag, timestamp },
    },
    {
      headers: {
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex',
      },
    },
  )
}
