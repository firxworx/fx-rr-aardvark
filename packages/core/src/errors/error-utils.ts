import { isRecord } from '../helpers/guards'

export interface GetErrorMessageOptions {
  fallback?: string
}

export interface ToErrorOptions extends GetErrorMessageOptions {}

const DEFAULT_FALLBACK_MESSAGE = 'Unknown Error'

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function stringify(value: unknown): string {
  try {
    const json = JSON.stringify(value)
    return json === undefined ? String(value) : json
  } catch {
    return String(value) // circular refs, BigInt, etc.
  }
}

function extract(value: unknown, depth: number): string | undefined {
  if (depth > 4) {
    return undefined
  }

  if (isNonEmptyString(value)) {
    return value
  }

  if (value instanceof Error) {
    return isNonEmptyString(value.message) ? value.message : extract(value.cause, depth + 1)
  }

  if (isRecord(value)) {
    return extract(value.message, depth + 1) ?? extract(value.error, depth + 1)
  }

  return undefined
}

/**
 * Extract a string error message from an error-like object or string.
 *
 * Effectively this function normalizes an `Error` instance, error-like object, or string error
 * into a string with fallback to "Unknown Error".
 *
 * This implementation always returns a truthy value to support logic downstream from the
 * caller that determines if an error condition is present based on this function's return value.
 *
 * No special handling is done for zod errors; remember that `ZodError.message` is JSON of
 * the issues array and is not human-friendly in raw form.
 */
export function getErrorMessage(maybeError: unknown, options?: GetErrorMessageOptions): string {
  const message = extract(maybeError, 0)

  if (message !== undefined) {
    return message
  }

  if (options?.fallback) {
    return options.fallback
  }

  if (maybeError === undefined || maybeError === null || maybeError === '') {
    return DEFAULT_FALLBACK_MESSAGE
  }

  return `${DEFAULT_FALLBACK_MESSAGE}: ${stringify(maybeError)}`
}

/**
 * Normalize an unknown thrown value into an `Error` instance:
 *
 * Existing `Error` instances are returned as-is to preserve stack and identity.
 *
 * Non-error input is wrapped in a new `Error` with a message derived via
 * `getErrorMessage()` such that:
 *
 * - original value attached as `cause` to preserve context for debugging and logging;
 * - if the input is an object with non-empty `name` it is set on the new Error instance.
 *
 * Preserving the name benefits downstream checks/guards that rely on `error.name`
 * for detection e.g. `AbortError` API and for logging patterns that show the error name.
 *
 * Useful for errors that cross realms or that come through `postMessage`,
 * worker boundary, serialization, etc.
 */
export function toError(maybeError: unknown, options?: ToErrorOptions): Error {
  if (maybeError instanceof Error) {
    return maybeError
  }

  const message = getErrorMessage(maybeError, options)

  if (maybeError === undefined || maybeError === null) {
    return new Error(message)
  }

  const error = new Error(message, { cause: maybeError })

  if (isRecord(maybeError) && isNonEmptyString(maybeError.name)) {
    error.name = maybeError.name
  }

  return error
}
