/**
 * LogTape console formatters: JSON for Workers Logs and readable lines for development.
 *
 * @see https://developers.cloudflare.com/workers/observability/logs/workers-logs/
 *
 * @module
 */

import { type ConsoleFormatter, getAnsiColorFormatter, type LogLevel, type LogRecord } from '@logtape/logtape'

import { toError } from '@workspace/core/errors'

/**
 * Workers Logs takes the level from a `level` field: use its names (the console method that LogTape calls for each
 * level) so that filters by level match all logs.
 */
const WORKERS_LOG_LEVELS = {
  trace: 'debug',
  debug: 'debug',
  info: 'info',
  warning: 'warn',
  error: 'error',
  fatal: 'error',
} as const satisfies Record<LogLevel, string>

const MAX_CAUSE_DEPTH = 3
const UNSERIALIZABLE = '[unserializable]'

interface SerializedError {
  name: string
  message: string
  stack?: string | undefined
  cause?: SerializedError | undefined
}

/**
 * Convert a thrown value to a plain object (`JSON.stringify(error)` is `{}`).
 */
function serializeError(value: unknown, depth = 0): SerializedError {
  const error = toError(value)
  const serialized: SerializedError = { name: error.name, message: error.message }

  // the stack and cause of an error created by `toError()` are not useful
  if (!(value instanceof Error)) {
    return serialized
  }

  serialized.stack = error.stack

  if (error.cause !== undefined && depth < MAX_CAUSE_DEPTH) {
    serialized.cause = serializeError(error.cause, depth + 1)
  }

  return serialized
}

/**
 * Workers Logs records an object as `{}` if any of its values cannot be serialized, and an `Error` as `{}`.
 */
function toJsonValue(value: unknown): unknown {
  try {
    const json = JSON.stringify(value, (_key, item) => {
      if (typeof item === 'bigint') {
        return item.toString()
      }

      return item instanceof Error ? serializeError(item) : item
    })

    return json === undefined ? undefined : JSON.parse(json)
  } catch {
    return UNSERIALIZABLE // circular reference, `toJSON()` that throws, etc.
  }
}

function renderMessage(message: LogRecord['message']): string {
  // text at even indexes, placeholder values at odd indexes
  return message
    .map((part, index) => {
      if (index % 2 === 0 || typeof part === 'string') {
        return String(part)
      }

      return part instanceof Error ? part.message : JSON.stringify(toJsonValue(part))
    })
    .join('')
}

/**
 * Write each log as one flat object so that Workers Logs indexes its fields. Workers Logs reads `level` and `message` of
 * the object, and Workers Issues reads `error` (name, message, and stack, which it maps to source files).
 */
export function createJsonConsoleFormatter(): ConsoleFormatter {
  return (record) => {
    const reserved = {
      level: WORKERS_LOG_LEVELS[record.level],
      category: record.category.join('.'),
      message: renderMessage(record.message),
    }

    const entry: Record<string, unknown> = { ...reserved }

    for (const [key, value] of Object.entries(record.properties)) {
      // `error` accepts any thrown value
      entry[key] = key === 'error' && value !== undefined ? serializeError(value) : toJsonValue(value)
    }

    // properties must not replace reserved fields
    Object.assign(entry, reserved)

    return [entry]
  }
}

/**
 * Write readable logs to a terminal: a line with the message, the properties, and the error with its stack.
 */
export function createDevConsoleFormatter(): ConsoleFormatter {
  const formatLine = getAnsiColorFormatter({ timestamp: 'time' })

  return (record) => {
    const { error, ...properties } = record.properties
    const values: unknown[] = [formatLine(record).trimEnd()]

    if (Object.keys(properties).length > 0) {
      values.push(JSON.stringify(toJsonValue(properties)))
    }

    if (error !== undefined) {
      values.push(error)
    }

    return values
  }
}
