/**
 * Logger for server code. Refer to `docs/logging.md`.
 *
 * Log calls are dropped until the entry point of the worker calls `configureLogging()` (e.g. in unit tests).
 *
 * @module
 */

import { getLogger, type Logger } from '@logtape/logtape'

export { type Logger, withContext } from '@logtape/logtape'

/** Root category of all logs of the workspace. */
export const APP_LOG_CATEGORY = 'app'

/**
 * @example
 * const logger = createLogger('contact')
 * logger.error('Failed to send message', { error, formId })
 */
export function createLogger(name: string): Logger {
  return getLogger([APP_LOG_CATEGORY, name])
}
