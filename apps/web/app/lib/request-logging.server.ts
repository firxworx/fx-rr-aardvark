import type { ServerInstrumentation } from 'react-router'

import { createLogger } from '@workspace/logger'

const logger = createLogger('request')

/**
 * Log each request handled by react-router at `debug` level. Deployed environments do not log these by default because
 * Workers Logs already records each request (invocation logs).
 *
 * @see https://reactrouter.com/how-to/instrumentation
 */
export const requestLogging: ServerInstrumentation = {
  handler({ instrument }) {
    instrument({
      async request(handleRequest, { request }) {
        const start = performance.now()
        const { statusCode, meta } = await handleRequest()

        logger.debug('Request handled', {
          method: request.method,
          path: new URL(request.url).pathname, // without the query string
          status: statusCode,
          route: meta?.pattern,
          durationMs: Math.round(performance.now() - start), // clock only advances after I/O in production
        })
      },
    })
  },
}
