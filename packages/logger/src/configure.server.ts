import { AsyncLocalStorage } from 'node:async_hooks'
import { configureSync, getConsoleSink, type LogLevel } from '@logtape/logtape'

import { createDevConsoleFormatter, createJsonConsoleFormatter } from './formatters'
import { APP_LOG_CATEGORY } from './index.server'

export interface LoggingOptions {
  /** lowest level to log */
  level: LogLevel
  /** `json` for Workers Logs; `dev` for readable lines in a terminal */
  format: 'json' | 'dev'
}

/**
 * Configure LogTape. Call once in the entry point of a worker, at module scope.
 *
 * The console sink is synchronous. Use caution with sinks that buffer: the runtime may stop a worker that has responded,
 * and I/O cannot be shared between requests.
 *
 * @see https://logtape.org/manual/sinks#keeping-serverless-requests-alive
 */
export function configureLogging({ level, format }: LoggingOptions): void {
  configureSync({
    reset: true, // the module may run again in development (HMR)
    contextLocalStorage: new AsyncLocalStorage(), // required by `withContext()`
    sinks: {
      console: getConsoleSink({
        formatter: format === 'dev' ? createDevConsoleFormatter() : createJsonConsoleFormatter(),
      }),
    },
    loggers: [
      { category: [APP_LOG_CATEGORY], lowestLevel: level, sinks: ['console'] },
      { category: ['logtape', 'meta'], lowestLevel: 'warning', sinks: ['console'] },
    ],
  })
}
